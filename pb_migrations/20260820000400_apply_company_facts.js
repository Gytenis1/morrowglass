/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const manifest = require(__hooks + "/../data/company_facts_20260806.json")
  const expectedCount = 216
  const checkedDate = "2026-08-06"
  const expectedFilter = "company_code != '' && revenue_eur_latest = 0"
  const expectedCounts = {
    target_records: expectedCount,
    exact_code_matched_pages: 183,
    found: 143,
    partial: 40,
    not_found: 33,
    revenue_paskelbta: 143,
    employee_band_extracted: 90,
    founded_year_extracted: 171,
    manager_extracted: 162,
    evrk_activities_extracted: 0,
  }
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  const companyCodePattern = /^\d{7,12}$/
  const publicCompanyPage = (url) => typeof url === "string" && /^https:\/\/rekvizitai\.vz\.lt\/en\/company\/[a-z0-9_]+\/$/i.test(url)
  const validNullableText = (value, maximum) => value === null || (typeof value === "string" && value.trim() && value.length <= maximum)
  const validNullableYear = (value) => value === null || (Number.isInteger(value) && value >= 1800 && value <= 2100)
  const employeeBands = new Set(["0", "1-9", "10-49", "50-249", "250+"])

  // This manifest is an immutable audit of the zero-revenue baseline. Check every
  // count and every identity/evidence dependency before adding fields or changing
  // records, so a partial export cannot alter a different cohort.
  if (!manifest || manifest.manifest_version !== 1 || typeof manifest.research_method !== "string" || !manifest.research_method.trim() ||
      !manifest.baseline || manifest.baseline.filter !== expectedFilter || manifest.baseline.target_count !== expectedCount ||
      manifest.baseline.checked_date !== checkedDate || !manifest.baseline.listing_gap_observations ||
      manifest.baseline.listing_gap_observations.employee_count_band_empty_count !== 254 ||
      manifest.baseline.listing_gap_observations.founded_year_zero_count !== 253 ||
      !manifest.counts || !manifest.results || Array.isArray(manifest.results) || typeof manifest.results !== "object") {
    throw new Error("company facts requires the complete 2026-08-06 216-record manifest")
  }
  for (const [name, value] of Object.entries(expectedCounts)) {
    if (manifest.counts[name] !== value) throw new Error("company facts manifest has an invalid " + name + " count")
  }

  const results = Object.values(manifest.results)
  if (results.length !== expectedCount) throw new Error("company facts manifest must contain exactly 216 results")

  const seen = new Set()
  const sourceRows = []
  const counted = { found: 0, partial: 0, not_found: 0, exact: 0, revenue: 0, employee: 0, founded: 0, manager: 0 }
  for (const [slug, result] of Object.entries(manifest.results)) {
    if (!result || result.slug !== slug || !slugPattern.test(slug) || seen.has(slug) ||
        !companyCodePattern.test(result.company_code || "") || result.facts_checked_date !== checkedDate ||
        !["found", "partial", "not_found"].includes(result.facts_lookup_status) ||
        !Array.isArray(result.checked_candidate_urls) || result.checked_candidate_urls.length === 0 ||
        !Array.isArray(result.candidate_checks) || result.candidate_checks.length === 0 ||
        !result.extracted_facts || !result.migration_values || !result.existing_verified_values || !result.evidence || typeof result.evidence !== "object") {
      throw new Error("company facts manifest has invalid research metadata for " + slug)
    }
    seen.add(slug)
    counted[result.facts_lookup_status]++

    if (result.checked_candidate_urls.some((url) => !publicCompanyPage(url)) || result.candidate_checks.some((check) =>
      !check || !publicCompanyPage(check.url) || !publicCompanyPage(check.effective_url) ||
      !(check.http_status === null || (Number.isInteger(check.http_status) && check.http_status >= 100 && check.http_status <= 599)) ||
      typeof check.exact_company_code_match !== "boolean")) {
      throw new Error("company facts manifest has invalid candidate evidence for " + slug)
    }

    const exactCheck = result.accepted_source_url && result.candidate_checks.find((check) =>
      check.exact_company_code_match && (check.url === result.accepted_source_url || check.effective_url === result.accepted_source_url))
    const exactCodeMatch = Boolean(exactCheck)
    if (result.accepted_source_url !== null && !publicCompanyPage(result.accepted_source_url)) {
      throw new Error("company facts manifest has an invalid accepted source URL for " + slug)
    }
    if (exactCodeMatch) {
      if (typeof result.evidence.registration_code !== "string" || !result.evidence.registration_code.includes(result.company_code)) {
        throw new Error("company facts manifest lacks registration-code evidence for " + slug)
      }
      counted.exact++
    } else if (result.accepted_source_url !== null) {
      throw new Error("company facts manifest accepted a page without an exact company-code match for " + slug)
    }

    const facts = result.extracted_facts
    const values = result.migration_values
    const publishedTurnover = facts.revenue_availability === "paskelbta"
    if (!facts || !["paskelbta", "nepaskelbta"].includes(facts.revenue_availability) ||
        !validNullableYear(facts.revenue_year) || !validNullableYear(facts.founded_year) ||
        !(facts.employee_count_band === null || employeeBands.has(facts.employee_count_band)) ||
        !validNullableText(facts.owner_manager_name, 240) || !Array.isArray(facts.evrk_activities) ||
        !validNullableYear(values.revenue_year) || !validNullableYear(values.founded_year) ||
        !(values.employee_count_band === null || employeeBands.has(values.employee_count_band)) ||
        !validNullableText(values.owner_manager_name, 240) || !Array.isArray(values.evrk_activities)) {
      throw new Error("company facts manifest has invalid extracted values for " + slug)
    }
    if (publishedTurnover) {
      if (!exactCodeMatch || !Number.isFinite(facts.revenue_eur_latest) || facts.revenue_eur_latest < 0 || !Number.isInteger(facts.revenue_year) ||
          typeof result.evidence.sales_revenue !== "string" || !/Sales revenue/i.test(result.evidence.sales_revenue) ||
          !result.evidence.sales_revenue.includes("(" + facts.revenue_year + " year)")) {
        throw new Error("company facts manifest has unverified published turnover for " + slug)
      }
      if (values.revenue_eur_latest !== facts.revenue_eur_latest || values.revenue_year !== facts.revenue_year || values.revenue_availability !== "paskelbta") {
        throw new Error("company facts manifest has inconsistent published turnover values for " + slug)
      }
      counted.revenue++
    } else if (facts.revenue_eur_latest !== null || facts.revenue_year !== null || values.revenue_eur_latest !== null || values.revenue_year !== null || values.revenue_availability !== "nepaskelbta") {
      throw new Error("company facts manifest has inconsistent unpublished turnover values for " + slug)
    }
    if (!exactCodeMatch && (facts.employee_count_band !== null || facts.founded_year !== null || facts.owner_manager_name !== null || publishedTurnover)) {
      throw new Error("company facts manifest has source-backed facts without an exact company-code match for " + slug)
    }
    if (facts.employee_count_band !== null) {
      if (!exactCodeMatch || typeof result.evidence.employees !== "string" || !result.evidence.employees.trim()) throw new Error("company facts manifest has unverified employee evidence for " + slug)
      counted.employee++
    }
    if (facts.founded_year !== null) {
      if (!exactCodeMatch || typeof result.evidence.founded !== "string" || !result.evidence.founded.trim()) throw new Error("company facts manifest has unverified founded-year evidence for " + slug)
      counted.founded++
    }
    if (facts.owner_manager_name !== null) {
      if (!exactCodeMatch || typeof result.evidence.manager !== "string" || !result.evidence.manager.trim()) throw new Error("company facts manifest has unverified manager evidence for " + slug)
      counted.manager++
    }

    sourceRows.push({
      slug,
      company_code: result.company_code,
      status: result.facts_lookup_status,
      source_url: exactCodeMatch ? result.accepted_source_url : null,
      exact_code_match: exactCodeMatch ? 1 : 0,
      published_turnover: publishedTurnover ? 1 : 0,
      revenue_eur_latest: publishedTurnover ? facts.revenue_eur_latest : null,
      revenue_year: publishedTurnover ? facts.revenue_year : null,
      employee_count_band: exactCodeMatch ? facts.employee_count_band : null,
      founded_year: exactCodeMatch ? facts.founded_year : null,
      owner_manager_name: exactCodeMatch ? facts.owner_manager_name : null,
    })
  }
  if (seen.size !== expectedCount || counted.found !== expectedCounts.found || counted.partial !== expectedCounts.partial ||
      counted.not_found !== expectedCounts.not_found || counted.exact !== expectedCounts.exact_code_matched_pages ||
      counted.revenue !== expectedCounts.revenue_paskelbta || counted.employee !== expectedCounts.employee_band_extracted ||
      counted.founded !== expectedCounts.founded_year_extracted || counted.manager !== expectedCounts.manager_extracted) {
    throw new Error("company facts manifest counts do not match its evidence")
  }

  const collection = app.findCollectionByNameOrId("manufacturers")
  const requiredFields = {
    slug: "text", company_code: "text", revenue_eur_latest: "number", revenue_year: "number", financial_source_url: "text",
    owner_manager_name: "text", revenue_availability: "select", financial_verification_status: "select",
    employee_count_band: "select", founded_year: "number", public_details_source_urls: "json",
  }
  for (const [name, type] of Object.entries(requiredFields)) {
    const field = collection.fields.getByName(name)
    if (!field || field.type() !== type) throw new Error("manufacturers." + name + " must be a " + type + " field")
  }

  let schemaChanged = false
  const statusField = collection.fields.getByName("facts_lookup_status")
  if (!statusField) {
    collection.fields.add(new SelectField({ name: "facts_lookup_status", maxSelect: 1, values: ["found", "partial", "not_found"] }))
    schemaChanged = true
  } else if (statusField.type() !== "select" || statusField.maxSelect !== 1 || !Array.isArray(statusField.values) ||
      !["found", "partial", "not_found"].every((value) => statusField.values.includes(value))) {
    throw new Error("manufacturers.facts_lookup_status must be a compatible single-select field")
  }
  const dateField = collection.fields.getByName("facts_checked_date")
  if (!dateField) {
    collection.fields.add(new TextField({ name: "facts_checked_date", min: 10, max: 10, pattern: "^\\d{4}-\\d{2}-\\d{2}$" }))
    schemaChanged = true
  } else if (dateField.type() !== "text") {
    throw new Error("manufacturers.facts_checked_date must be a text field")
  }
  if (schemaChanged) app.save(collection)

  const sqlValue = (value) => {
    if (value === null || value === undefined) return "NULL"
    if (typeof value === "number") return String(value)
    return "'" + String(value).replaceAll("'", "''") + "'"
  }
  const rows = sourceRows.map((row) => "(" + [
    row.slug, row.company_code, row.status, row.source_url, row.exact_code_match, row.published_turnover,
    row.revenue_eur_latest, row.revenue_year, row.employee_count_band, row.founded_year, row.owner_manager_name,
  ].map(sqlValue).join(", ") + ")").join(", ")
  const source = (column) => "(SELECT `" + column + "` FROM `source` WHERE `source`.`slug` = `manufacturers`.`slug` LIMIT 1)"
  const databaseCompanyCodeMatches = "`company_code` = " + source("company_code")
  const exactSource = source("exact_code_match") + " = 1 AND " + databaseCompanyCodeMatches
  const sourceUrl = source("source_url")
  const existingSources = "`public_details_source_urls`"
  const mergedSources = "CASE " +
    "WHEN " + existingSources + " IS NULL OR trim(" + existingSources + ") IN ('', '[]', 'null') THEN json_array(" + sourceUrl + ") " +
    "WHEN json_valid(" + existingSources + ") = 1 AND json_type(" + existingSources + ") = 'array' THEN CASE " +
      "WHEN EXISTS (SELECT 1 FROM json_each(" + existingSources + ") WHERE value = " + sourceUrl + ") THEN " + existingSources +
      " ELSE json_insert(" + existingSources + ", '$[#]', " + sourceUrl + ") END " +
    "ELSE " + existingSources + " END"
  const hasVerifiedPublishedTurnover = "`revenue_availability` = 'paskelbta' AND `financial_verification_status` = 'patikrinta' AND `revenue_year` BETWEEN 1800 AND 2100"
  const sourceHasPublishedTurnover = exactSource + " AND " + source("published_turnover") + " = 1"
  const sourceHasNoPublishedTurnover = databaseCompanyCodeMatches + " AND " + source("published_turnover") + " = 0"
  const blank = (column) => "(" + column + " IS NULL OR trim(" + column + ") = '')"

  // One bounded slug-keyed update makes retries converge. Exact-code evidence is a
  // prerequisite for every positive source fact. Existing verified published
  // turnover remains stronger than a no-turnover outcome; other facts only fill
  // empty values, and valid provenance arrays retain every existing URL.
  app.db().newQuery(
    "WITH `source` (`slug`, `company_code`, `status`, `source_url`, `exact_code_match`, `published_turnover`, `revenue_eur_latest`, `revenue_year`, `employee_count_band`, `founded_year`, `owner_manager_name`) AS (VALUES " + rows + ") " +
    "UPDATE `manufacturers` SET " +
      "`revenue_eur_latest` = CASE " +
        "WHEN " + sourceHasPublishedTurnover + " AND NOT (" + hasVerifiedPublishedTurnover + ") THEN " + source("revenue_eur_latest") + " " +
        "WHEN " + sourceHasNoPublishedTurnover + " AND NOT (" + hasVerifiedPublishedTurnover + ") THEN 0 " +
        "ELSE `revenue_eur_latest` END, " +
      "`revenue_year` = CASE " +
        "WHEN " + sourceHasPublishedTurnover + " AND NOT (" + hasVerifiedPublishedTurnover + ") THEN " + source("revenue_year") + " " +
        "WHEN " + sourceHasNoPublishedTurnover + " AND NOT (" + hasVerifiedPublishedTurnover + ") THEN 0 " +
        "ELSE `revenue_year` END, " +
      "`revenue_availability` = CASE " +
        "WHEN " + sourceHasPublishedTurnover + " AND NOT (" + hasVerifiedPublishedTurnover + ") THEN 'paskelbta' " +
        "WHEN " + sourceHasNoPublishedTurnover + " AND NOT (" + hasVerifiedPublishedTurnover + ") THEN 'nepaskelbta' " +
        "ELSE `revenue_availability` END, " +
      "`financial_source_url` = CASE WHEN " + sourceHasPublishedTurnover + " AND " + blank("`financial_source_url`") + " THEN " + sourceUrl + " ELSE `financial_source_url` END, " +
      "`financial_verification_status` = CASE WHEN " + sourceHasPublishedTurnover + " AND NOT (" + hasVerifiedPublishedTurnover + ") THEN 'patikrinta' ELSE `financial_verification_status` END, " +
      "`employee_count_band` = CASE WHEN " + exactSource + " AND " + source("employee_count_band") + " IS NOT NULL AND " + blank("`employee_count_band`") + " THEN " + source("employee_count_band") + " ELSE `employee_count_band` END, " +
      "`founded_year` = CASE WHEN " + exactSource + " AND " + source("founded_year") + " IS NOT NULL AND (`founded_year` IS NULL OR `founded_year` = 0) THEN " + source("founded_year") + " ELSE `founded_year` END, " +
      "`owner_manager_name` = CASE WHEN " + exactSource + " AND " + source("owner_manager_name") + " IS NOT NULL AND " + blank("`owner_manager_name`") + " THEN " + source("owner_manager_name") + " ELSE `owner_manager_name` END, " +
      "`public_details_source_urls` = CASE WHEN " + exactSource + " THEN " + mergedSources + " ELSE `public_details_source_urls` END, " +
      "`facts_lookup_status` = " + source("status") + ", " +
      "`facts_checked_date` = " + sqlValue(checkedDate) + " " +
    "WHERE `slug` IN (SELECT `slug` FROM `source`)"
  ).execute()
}, (app) => {
  // Deliberately non-destructive: audited facts and retained provenance survive rollback.
})
