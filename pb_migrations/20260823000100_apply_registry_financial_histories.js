/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const manifest = require(__hooks + "/../data/registry_financials_20260807.json")
  const checkedDate = "2026-08-07"
  const expectedTargetCount = 386
  const dataPortalUrl = "https://data.gov.lt/datasets/1484/"
  const pnlModel = "datasets/gov/rc/jar/pelno_ataskaitos/PelnoAtaskaita"
  const revenueLine = "PARDAVIMO PAJAMOS"
  const pbtLine = "PELNAS (NUOSTOLIAI) PRIEŠ APMOKESTINIMĄ"
  const validDate = (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
  const validCode = (value) => typeof value === "string" && /^\d{7,12}$/.test(value)
  const validNumber = (value) => typeof value === "number" && Number.isFinite(value)

  if (!manifest || manifest.manifest_version !== 1 || !manifest.baseline ||
      manifest.baseline.filter !== "company_code != ''" || manifest.baseline.target_count !== expectedTargetCount ||
      manifest.baseline.checked_date !== checkedDate || !manifest.counts || !manifest.results ||
      Array.isArray(manifest.results) || Object.keys(manifest.results).length !== expectedTargetCount ||
      manifest.counts.target_records !== expectedTargetCount || !manifest.official_source ||
      manifest.official_source.data_portal_url !== dataPortalUrl || !manifest.official_source.model_confirmation ||
      manifest.official_source.model_confirmation.pnl_model !== pnlModel) {
    throw new Error("registry financial histories requires the complete 2026-08-07 386-record manifest")
  }

  const collection = app.findCollectionByNameOrId("manufacturers")
  const requiredFields = {
    slug: "text", company_code: "text", financial_source_url: "text", revenue_eur_latest: "number",
    revenue_year: "number", revenue_availability: "select", financial_verification_status: "select",
  }
  for (const [name, type] of Object.entries(requiredFields)) {
    const field = collection.fields.getByName(name)
    if (!field || field.type() !== type) throw new Error("manufacturers." + name + " must be a " + type + " field")
  }
  for (const [name, requiredValue] of [["revenue_availability", "paskelbta"], ["financial_verification_status", "patikrinta"]]) {
    const field = collection.fields.getByName(name)
    if (field.maxSelect !== 1 || !Array.isArray(field.values) || !field.values.includes(requiredValue)) {
      throw new Error("manufacturers." + name + " must be a compatible single-select field")
    }
  }

  // Field creation is guarded and saved once, making an interrupted pre-update
  // migration safe to retry against the persistent production volume.
  let schemaChanged = false
  const historyField = collection.fields.getByName("filed_financial_history")
  if (!historyField) {
    collection.fields.add(new JSONField({ name: "filed_financial_history", maxSize: 65536 }))
    schemaChanged = true
  } else if (historyField.type() !== "json") {
    throw new Error("manufacturers.filed_financial_history must be a json field")
  }
  const checkDateField = collection.fields.getByName("registry_financials_checked_date")
  if (!checkDateField) {
    collection.fields.add(new TextField({ name: "registry_financials_checked_date", min: 10, max: 10, pattern: "^\\d{4}-\\d{2}-\\d{2}$" }))
    schemaChanged = true
  } else if (checkDateField.type() !== "text") {
    throw new Error("manufacturers.registry_financials_checked_date must be a text field")
  }
  if (schemaChanged) app.save(collection)

  const sourceRows = []
  const seen = new Set()
  for (const [slug, result] of Object.entries(manifest.results)) {
    if (!result || result.slug !== slug || seen.has(slug) || !validCode(result.company_code) ||
        result.registry_checked_date !== checkedDate || !["exact_company_code_to_jar_id", "no_exact_jar_entity"].includes(result.join_status) ||
        !Array.isArray(result.financial_history) || result.financial_history.length > 4) {
      throw new Error("registry financial manifest has invalid metadata for " + slug)
    }
    seen.add(slug)
    const history = result.financial_history
    let newestRevenue = null
    let previousPeriod = null
    for (const entry of history) {
      if (!entry || !validDate(entry.fiscal_period_start) || !validDate(entry.fiscal_period_end) ||
          entry.fiscal_period_start > entry.fiscal_period_end || !validDate(entry.filing_registration_date) ||
          !entry.source || entry.source.data_portal_url !== dataPortalUrl || entry.source.api_model_path !== pnlModel ||
          typeof entry.source.jar_entity_id !== "string") {
        throw new Error("registry financial manifest has invalid period evidence for " + slug)
      }
      const periodKey = entry.fiscal_period_end + "|" + entry.filing_registration_date + "|" + entry.fiscal_period_start
      if (previousPeriod !== null && previousPeriod < periodKey) throw new Error("registry financial history is not newest-first for " + slug)
      previousPeriod = periodKey
      if (Object.prototype.hasOwnProperty.call(entry, "revenue_eur")) {
        if (!validNumber(entry.revenue_eur) || !entry.revenue_evidence || entry.revenue_evidence.line_name !== revenueLine ||
            typeof entry.revenue_evidence.api_record_id !== "string" || !validDate(entry.revenue_evidence.registration_date)) {
          throw new Error("registry financial manifest has unsupported revenue for " + slug)
        }
        const fiscalYear = Number(entry.fiscal_period_end.slice(0, 4))
        if (newestRevenue === null || fiscalYear > newestRevenue.year ||
            (fiscalYear === newestRevenue.year && entry.fiscal_period_end > newestRevenue.periodEnd)) {
          newestRevenue = { value: entry.revenue_eur, year: fiscalYear, periodEnd: entry.fiscal_period_end }
        }
      }
      if (Object.prototype.hasOwnProperty.call(entry, "profit_before_tax_eur") &&
          (!validNumber(entry.profit_before_tax_eur) || !entry.profit_before_tax_evidence ||
           entry.profit_before_tax_evidence.line_name !== pbtLine || typeof entry.profit_before_tax_evidence.api_record_id !== "string" ||
           !validDate(entry.profit_before_tax_evidence.registration_date))) {
        throw new Error("registry financial manifest has unsupported PBT for " + slug)
      }
    }
    if (result.join_status === "exact_company_code_to_jar_id") {
      if (!result.jar_entity || result.jar_entity.company_code_value !== result.company_code ||
          typeof result.jar_entity.id !== "string" || !result.source_citations ||
          result.source_citations.data_portal_url !== dataPortalUrl || result.source_citations.api_model_path !== pnlModel ||
          history.some((entry) => entry.source.jar_entity_id !== result.jar_entity.id)) {
        throw new Error("registry financial manifest has invalid JAR identity evidence for " + slug)
      }
    } else if (history.length !== 0) {
      throw new Error("unmapped manufacturer cannot receive financial history for " + slug)
    }
    sourceRows.push({ slug, companyCode: result.company_code, history: JSON.stringify(history), newestRevenue })
  }
  if (seen.size !== expectedTargetCount) throw new Error("registry financial manifest has duplicate slugs")

  const sqlValue = (value) => {
    if (value === null || value === undefined) return "NULL"
    if (typeof value === "number") return String(value)
    return "'" + String(value).replaceAll("'", "''") + "'"
  }

  // Bounded set-based updates, rather than record.save loops, keep startup fast.
  // Each update also rechecks company_code, so a later slug reassignment cannot
  // inherit history from a different legal entity. financial_source_url is never
  // assigned here: existing human-checkable provenance is retained while each
  // stored history entry carries its official portal and API-model citations.
  const batchSize = 25
  for (let offset = 0; offset < sourceRows.length; offset += batchSize) {
    const batch = sourceRows.slice(offset, offset + batchSize)
    const values = batch.map((row) => "(" + [
      row.slug, row.companyCode, row.history,
      row.newestRevenue ? row.newestRevenue.value : null,
      row.newestRevenue ? row.newestRevenue.year : null,
    ].map(sqlValue).join(", ") + ")").join(", ")
    const source = (column) => "(SELECT `" + column + "` FROM `source` WHERE `source`.`slug` = `manufacturers`.`slug` LIMIT 1)"
    const exactSource = "`company_code` = " + source("company_code")
    const newerOfficialRevenue = exactSource + " AND " + source("revenue_year") + " BETWEEN 1900 AND 2100 AND " +
      "(`revenue_year` IS NULL OR `revenue_year` = 0 OR `revenue_year` < " + source("revenue_year") + ")"
    app.db().newQuery(
      "WITH `source` (`slug`, `company_code`, `history_json`, `revenue_eur`, `revenue_year`) AS (VALUES " + values + ") " +
      "UPDATE `manufacturers` SET " +
        "`filed_financial_history` = CASE WHEN " + exactSource + " THEN " + source("history_json") + " ELSE `filed_financial_history` END, " +
        "`registry_financials_checked_date` = CASE WHEN " + exactSource + " THEN " + sqlValue(checkedDate) + " ELSE `registry_financials_checked_date` END, " +
        "`revenue_eur_latest` = CASE WHEN " + newerOfficialRevenue + " THEN " + source("revenue_eur") + " ELSE `revenue_eur_latest` END, " +
        "`revenue_year` = CASE WHEN " + newerOfficialRevenue + " THEN " + source("revenue_year") + " ELSE `revenue_year` END, " +
        "`revenue_availability` = CASE WHEN " + newerOfficialRevenue + " THEN 'paskelbta' ELSE `revenue_availability` END, " +
        "`financial_verification_status` = CASE WHEN " + newerOfficialRevenue + " THEN 'patikrinta' ELSE `financial_verification_status` END " +
      "WHERE `slug` IN (SELECT `slug` FROM `source`)"
    ).execute()
  }
}, (app) => {
  // Deliberately non-destructive: filed official histories and retained sources survive rollback.
})
