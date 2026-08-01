/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  // The historical catalogue accidentally kept a lower-quality directory alias for
  // each of these two legal entities. Replace only those exact live alias rows with
  // the source-controlled identities; the retained higher-quality rows are not named.
  const seed = require(__hooks + "/../data/manufacturers.json")
  const replacements = [
    {
      previousSlug: "mano-baldita",
      previousCompanyCode: "304956995",
      replacementSlug: "uab-gm-art-306083828",
      replacementCompanyCode: "306083828",
    },
    {
      previousSlug: "aukstaitijos-baldu-fabrikas",
      previousCompanyCode: "302893592",
      replacementSlug: "uab-fenolita-124264828",
      replacementCompanyCode: "124264828",
    },
  ]
  const fields = [
    "slug", "legal_name", "trading_name", "source_identity", "legal_entity_known",
    "description_lt", "location", "city", "region", "region_label", "category_codes",
    "category_labels", "audience", "website", "public_contact_url", "portfolio_status",
    "confidence", "confidence_evidence", "scope_evidence", "evidence_source_type",
    "source_urls", "source_artifact_url", "source_collection_date", "verification_status",
    "company_code", "public_phone", "street_address", "postcode", "founded_year",
    "employee_count_band", "public_details_source_urls", "financial_source_url",
    "revenue_eur_latest", "revenue_year", "owner_manager_name", "owner_signal",
    "revenue_availability", "financial_verification_status", "verified_at",
  ]

  if (!Array.isArray(seed) || seed.length !== 450) {
    throw new Error("manufacturer repair requires exactly 450 source records")
  }

  const sqlValue = (value) => {
    if (value === null || value === undefined) return "NULL"
    if (typeof value === "boolean") return value ? "1" : "0"
    if (typeof value === "number") return String(value)
    const text = Array.isArray(value) ? JSON.stringify(value) : String(value)
    return "'" + text.replaceAll("'", "''") + "'"
  }

  const resolved = replacements.map((replacement) => {
    const record = seed.find((candidate) => candidate.slug === replacement.replacementSlug)
    if (!record || record.company_code !== replacement.replacementCompanyCode) {
      throw new Error("manufacturer repair source is missing " + replacement.replacementSlug)
    }
    for (const field of fields) {
      if (record[field] === undefined) {
        throw new Error("manufacturer repair source is missing " + field + " for " + replacement.replacementSlug)
      }
    }
    if (!/^\d{7,12}$/.test(record.company_code) || !Array.isArray(record.source_urls) || record.source_urls.length !== 1 || !/^https:\/\/get\.data\.gov\.lt\//.test(record.source_urls[0])) {
      throw new Error("manufacturer repair source has invalid official provenance for " + replacement.replacementSlug)
    }
    return { ...replacement, record }
  })

  const replacementSlugs = new Set(resolved.map(({ replacementSlug }) => replacementSlug))
  const replacementCodes = new Set(resolved.map(({ replacementCompanyCode }) => replacementCompanyCode))
  if (replacementSlugs.size !== resolved.length || replacementCodes.size !== resolved.length) {
    throw new Error("manufacturer repair replacements must have unique identities")
  }

  // PocketBase NumberField columns are non-nullable. The source explicitly marks
  // unavailable revenue, so preserve that meaning via revenue_availability and use
  // PocketBase's numeric zero storage default for the two number columns.
  const storedValue = (record, field) => {
    if ((field === "revenue_eur_latest" || field === "revenue_year") && record[field] === null) return 0
    return record[field]
  }
  const assignments = fields.map((field) => {
    const cases = resolved.map(({ previousSlug, record }) => "WHEN " + sqlValue(previousSlug) + " THEN " + sqlValue(storedValue(record, field))).join(" ")
    return "`" + field + "` = CASE `slug` " + cases + " ELSE `" + field + "` END"
  }).join(", ")
  const targets = resolved.map(({ previousSlug, previousCompanyCode }) =>
    "(`slug` = " + sqlValue(previousSlug) + " AND `company_code` = " + sqlValue(previousCompanyCode) + ")"
  ).join(" OR ")

  // A single bounded statement is atomic and only matches the two known aliases.
  // After one alias is changed its old slug no longer matches, making a retry after
  // an interrupted boot a no-op for that row; already reconciled databases also
  // perform no writes. No other catalogue row is selected or modified.
  app.db().newQuery("UPDATE `manufacturers` SET " + assignments + " WHERE " + targets).execute()
}, (app) => {
  // Deliberately non-destructive: a rollback must not restore obsolete aliases.
})
