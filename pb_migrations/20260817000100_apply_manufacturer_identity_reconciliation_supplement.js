/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const manifest = require(__hooks + "/../data/manufacturer_identity_reconciliation_supplement_20260804.json")
  const expectedCount = 12
  const checkDate = "2026-08-04"

  if (!manifest || !Array.isArray(manifest.corrections) || manifest.corrections.length !== expectedCount ||
      manifest.source_collection_date !== checkDate) {
    throw new Error("manufacturer identity reconciliation supplement requires its immutable 12-record manifest")
  }

  const slugs = new Set()
  const companyCodes = new Set()
  for (const correction of manifest.corrections) {
    if (!correction || typeof correction.slug !== "string" || !correction.slug || slugs.has(correction.slug) ||
        typeof correction.input_identity !== "string" || !correction.input_identity ||
        typeof correction.input_city !== "string" || !correction.input_city ||
        typeof correction.directory_identity !== "string" || !correction.directory_identity ||
        typeof correction.location_evidence !== "string" || !correction.location_evidence ||
        !/^\d{7,12}$/.test(correction.company_code || "") || companyCodes.has(correction.company_code) ||
        typeof correction.source_url !== "string" ||
        !/^https:\/\/rekvizitai\.vz\.lt\/en\/company\/[a-z0-9_]+\/$/.test(correction.source_url) ||
        correction.source_collection_date !== checkDate) {
      throw new Error("manufacturer identity reconciliation supplement has invalid strict correction data")
    }
    slugs.add(correction.slug)
    companyCodes.add(correction.company_code)
  }

  const collection = app.findCollectionByNameOrId("manufacturers")
  const statusField = collection.fields.getByName("registry_match_status")
  const checkedDateField = collection.fields.getByName("registry_match_checked_date")
  const provenanceField = collection.fields.getByName("public_details_source_urls")
  const companyCodeField = collection.fields.getByName("company_code")
  if (!statusField || (statusField.type() !== "select" && statusField.type() !== "text") ||
      !checkedDateField || !["text", "date", "select"].includes(checkedDateField.type()) ||
      !provenanceField || provenanceField.type() !== "json" ||
      !companyCodeField || companyCodeField.type() !== "text") {
    throw new Error("manufacturers reconciliation fields have incompatible types")
  }

  const sqlValue = (value) => "'" + String(value).replaceAll("'", "''") + "'"
  const values = manifest.corrections.map((correction) => "(" + [
    correction.slug,
    correction.company_code,
    correction.source_url,
    correction.source_collection_date,
  ].map(sqlValue).join(", ") + ")").join(", ")
  const sourceValue = (field) => "(SELECT `" + field + "` FROM `source` WHERE `source`.`slug` = `manufacturers`.`slug`)"
  const sourceCode = sourceValue("company_code")
  const sourceUrl = sourceValue("source_url")
  const sourceDate = sourceValue("checked_date")
  const codeBlank = "`company_code` IS NULL OR trim(`company_code`) = ''"
  const statusNotFound = "`registry_match_status` = 'not_found_in_register'"
  const codeFilledOrSame = "(" + codeBlank + " OR `company_code` = " + sourceCode + ")"
  const existingSources = "`public_details_source_urls`"
  const mergedSources = "CASE " +
    "WHEN " + existingSources + " IS NULL OR trim(" + existingSources + ") IN ('', '[]', 'null') THEN json_array(" + sourceUrl + ") " +
    "WHEN json_valid(" + existingSources + ") = 1 THEN CASE json_type(" + existingSources + ") " +
      "WHEN 'array' THEN CASE WHEN EXISTS (SELECT 1 FROM json_each(" + existingSources + ") WHERE value = " + sourceUrl + ") " +
        "THEN " + existingSources + " ELSE json_insert(" + existingSources + ", '$[#]', " + sourceUrl + ") END " +
      "ELSE json_array(json_extract(" + existingSources + ", '$'), " + sourceUrl + ") END " +
    "ELSE json_array(" + sourceUrl + ") END"

  // This is deliberately limited to the 12 supplemental manifest slugs. It does not
  // alter location data or frontend data. A retry converges: blank codes are filled
  // once, source URLs are appended at most once, and only a base not-found status with
  // a resulting/same correction code becomes matched.
  app.db().newQuery(
    "WITH `source` (`slug`, `company_code`, `source_url`, `checked_date`) AS (VALUES " + values + ") " +
    "UPDATE `manufacturers` SET " +
      "`company_code` = CASE WHEN " + codeBlank + " THEN " + sourceCode + " ELSE `company_code` END, " +
      "`registry_match_status` = CASE WHEN " + statusNotFound + " AND " + codeFilledOrSame +
        " THEN 'matched' ELSE `registry_match_status` END, " +
      "`registry_match_checked_date` = " + sourceDate + ", " +
      "`public_details_source_urls` = " + mergedSources + " " +
    "WHERE `slug` IN (SELECT `slug` FROM `source`)"
  ).execute()
}, (app) => {
  // Deliberately non-destructive: supplemental identity evidence survives rollback.
})
