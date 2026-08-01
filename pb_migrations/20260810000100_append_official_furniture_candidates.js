/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  // This immutable, official-source batch is separate from the historical catalogue
  // batches. It deliberately inserts only these 135 records and never reseeds later
  // catalogue additions.
  const batch = require(__hooks + "/../data/official_furniture_candidates_20260801.json")
  const allSeed = require(__hooks + "/../data/manufacturers.json")
  const legacyRecordCount = 315
  const expectedBatchSize = 135
  const requiredFields = [
    "slug", "legal_name", "trading_name", "source_identity", "description_lt", "location", "city",
    "region", "region_label", "category_codes", "category_labels", "audience", "portfolio_status",
    "confidence", "confidence_evidence", "scope_evidence", "evidence_source_type", "source_urls",
    "source_artifact_url", "source_collection_date", "verification_status", "company_code",
  ]
  const regionLabel = "Visa Lietuva (miestas nenurodytas oficialiame šaltinyje)"
  const sourceType = "Lietuvos atvirų duomenų portalas (Registrų centras)"

  if (!Array.isArray(allSeed) || allSeed.length !== legacyRecordCount + expectedBatchSize) {
    throw new Error("data/manufacturers.json must retain the 315 legacy and 135 official-source records")
  }
  if (!Array.isArray(batch) || batch.length !== expectedBatchSize || JSON.stringify(allSeed.slice(legacyRecordCount)) !== JSON.stringify(batch)) {
    throw new Error("official furniture candidate batch must exactly match the appended manufacturer source records")
  }

  const legacySlugs = new Set()
  const legacyCodes = new Set()
  for (const record of allSeed.slice(0, legacyRecordCount)) {
    if (!record || !record.slug || legacySlugs.has(record.slug)) throw new Error("legacy manufacturer records must retain unique slugs")
    legacySlugs.add(record.slug)
    if (record.company_code) legacyCodes.add(record.company_code)
  }

  const slugs = new Set()
  const codes = new Set()
  const stableId = (slug) => {
    let first = 2166136261
    let second = 2246822507
    for (let index = 0; index < slug.length; index++) {
      const code = slug.charCodeAt(index)
      first = Math.imul(first ^ code, 16777619)
      second = Math.imul(second ^ (code + index), 3266489917)
    }
    return "m" + (first >>> 0).toString(36).padStart(7, "0") + (second >>> 0).toString(36).padStart(7, "0")
  }
  const allIds = new Set()
  for (const record of allSeed) {
    const id = stableId(record.slug)
    if (allIds.has(id)) throw new Error("generated duplicate manufacturer id for " + record.slug)
    allIds.add(id)
  }

  for (const record of batch) {
    if (!record || typeof record !== "object") throw new Error("official furniture candidate must be an object")
    for (const field of requiredFields) {
      if (record[field] === undefined || record[field] === null || record[field] === "") {
        throw new Error("official furniture candidate " + (record.slug || "without slug") + " is missing " + field)
      }
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.slug) || slugs.has(record.slug) || legacySlugs.has(record.slug)) {
      throw new Error("official furniture candidate slug conflicts with an existing record " + record.slug)
    }
    if (!/^\d{7,12}$/.test(record.company_code) || codes.has(record.company_code) || legacyCodes.has(record.company_code)) {
      throw new Error("official furniture candidate has a duplicate or invalid company code " + record.company_code)
    }
    if (record.legal_entity_known !== true || record.location !== "Lietuva" || record.city !== "Lietuva" || record.region !== "national" || record.region_label !== regionLabel) {
      throw new Error("official furniture candidate has an unsupported source-backed location mapping " + record.slug)
    }
    if (record.category_codes.length !== 1 || record.category_codes[0] !== "O" || record.category_labels.length !== 1 || record.category_labels[0] !== "Kiti nestandartiniai baldai" || record.audience !== "nežinoma" || record.portfolio_status !== "nežinoma" || record.confidence !== "vidutinis") {
      throw new Error("official furniture candidate has an unsupported conservative classification " + record.slug)
    }
    if (record.evidence_source_type !== sourceType || record.source_collection_date !== "2026-08-01" || record.verification_status !== "nepatvirtinta" || !Array.isArray(record.source_urls) || record.source_urls.length !== 1 || record.source_urls[0] !== record.source_artifact_url || !/^https:\/\/get\.data\.gov\.lt\//.test(record.source_artifact_url)) {
      throw new Error("official furniture candidate has invalid official-source provenance " + record.slug)
    }
    slugs.add(record.slug)
    codes.add(record.company_code)
  }

  // The official activity source does not state whether a candidate sells to household,
  // business, or both audiences. Preserve that fact instead of assigning a service scope.
  const collection = app.findCollectionByNameOrId("manufacturers")
  const audience = collection.fields.getByName("audience")
  if (!audience || audience.type() !== "select") throw new Error("manufacturers.audience must be a select field")
  if (!audience.values.includes("nežinoma")) {
    audience.values = [...audience.values, "nežinoma"]
    app.save(collection)
  }

  const columns = [
    "id", "slug", "legal_name", "trading_name", "source_identity", "legal_entity_known",
    "description_lt", "location", "city", "region", "region_label", "category_codes", "category_labels",
    "audience", "portfolio_status", "confidence", "confidence_evidence", "scope_evidence",
    "evidence_source_type", "source_urls", "source_artifact_url", "source_collection_date",
    "verification_status", "company_code",
  ]
  const sqlValue = (value) => {
    if (value === null || value === undefined) return "NULL"
    if (typeof value === "boolean") return value ? "1" : "0"
    const text = Array.isArray(value) ? JSON.stringify(value) : String(value)
    return "'" + text.replaceAll("'", "''") + "'"
  }
  const rows = batch.map((record) => "(" + [
    stableId(record.slug), record.slug, record.legal_name, record.trading_name, record.source_identity,
    record.legal_entity_known, record.description_lt, record.location, record.city, record.region,
    record.region_label, record.category_codes, record.category_labels, record.audience, record.portfolio_status,
    record.confidence, record.confidence_evidence, record.scope_evidence, record.evidence_source_type,
    record.source_urls, record.source_artifact_url, record.source_collection_date, record.verification_status,
    record.company_code,
  ].map(sqlValue).join(",") + ")")

  // One bounded multi-row insert keeps boot fast. Deterministic IDs and slug conflict
  // handling make an interrupted boot safe to retry without overwriting later edits.
  const sql = "INSERT INTO `manufacturers` (" + columns.map((name) => "`" + name + "`").join(",") + ") VALUES " + rows.join(",") + " ON CONFLICT(`slug`) DO NOTHING"
  app.db().newQuery(sql).execute()
}, (app) => {
  // Deliberately non-destructive: catalogue rows and the audience vocabulary survive rollback.
})
