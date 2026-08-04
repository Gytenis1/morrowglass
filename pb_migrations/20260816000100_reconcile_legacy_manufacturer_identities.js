/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const manifest = require(__hooks + "/../data/manufacturer_identity_reconciliation_20260804.json")
  const expectedCount = 115
  const validStatuses = new Set(["matched", "not_found_in_register"])

  if (!manifest || !Array.isArray(manifest.results) || manifest.results.length !== expectedCount) {
    throw new Error("manufacturer identity reconciliation requires the immutable 115-record manifest")
  }

  const slugs = new Set()
  for (const record of manifest.results) {
    if (!record || typeof record.slug !== "string" || !record.slug || slugs.has(record.slug) ||
        typeof record.input_identity !== "string" || !record.input_identity ||
        typeof record.input_city !== "string" || !record.input_city ||
        !validStatuses.has(record.match_status) || record.source_collection_date !== "2026-08-04" ||
        !Array.isArray(record.public_details_source_urls) || record.public_details_source_urls.length !== 1 ||
        !record.public_details_source_urls.every((url) => typeof url === "string" && /^https:\/\/get\.data\.gov\.lt\//.test(url))) {
      throw new Error("manufacturer identity reconciliation has invalid manifest data")
    }
    slugs.add(record.slug)

    if (record.match_status === "matched") {
      if (!/^\d{7,12}$/.test(record.company_code || "") ||
          typeof record.canonical_official_name !== "string" || !record.canonical_official_name ||
          typeof record.official_registered_municipality !== "string" || !record.official_registered_municipality ||
          typeof record.official_registered_locality !== "string" || !record.official_registered_locality ||
          !/^https:\/\/get\.data\.gov\.lt\/datasets\/gov\/rc\/jar\/iregistruoti\/JuridinisAsmuo\/[0-9a-f-]{36}$/.test(record.public_details_source_urls[0])) {
        throw new Error("manufacturer identity reconciliation has an invalid strict match for " + record.slug)
      }
    } else if ("company_code" in record || record.public_details_source_urls[0] !== "https://get.data.gov.lt/datasets/gov/rc/jar/iregistruoti/JuridinisAsmuo") {
      throw new Error("manufacturer identity reconciliation has invalid not-found provenance for " + record.slug)
    }
  }

  const collection = app.findCollectionByNameOrId("manufacturers")
  const statusField = collection.fields.getByName("registry_match_status")
  if (!statusField) {
    collection.fields.add(new SelectField({
      name: "registry_match_status",
      required: false,
      maxSelect: 1,
      values: ["matched", "not_found_in_register"],
    }))
  } else if (statusField.type() !== "select" && statusField.type() !== "text") {
    throw new Error("manufacturers.registry_match_status exists with incompatible type " + statusField.type())
  }

  const checkedDateField = collection.fields.getByName("registry_match_checked_date")
  if (!checkedDateField) {
    collection.fields.add(new TextField({
      name: "registry_match_checked_date",
      required: false,
      max: 10,
      pattern: "^\\d{4}-\\d{2}-\\d{2}$",
    }))
  } else if (checkedDateField.type() !== "text" && checkedDateField.type() !== "date") {
    throw new Error("manufacturers.registry_match_checked_date exists with incompatible type " + checkedDateField.type())
  }
  app.save(collection)

  const provenance = collection.fields.getByName("public_details_source_urls")
  const companyCode = collection.fields.getByName("company_code")
  if (!provenance || provenance.type() !== "json" || !companyCode || companyCode.type() !== "text") {
    throw new Error("manufacturers must retain JSON public_details_source_urls and text company_code fields")
  }

  const sqlValue = (value) => "'" + String(value).replaceAll("'", "''") + "'"
  const values = manifest.results.map((record) => "(" + [
    record.slug,
    record.match_status,
    record.match_status === "matched" ? record.company_code : "",
    record.public_details_source_urls[0],
    record.source_collection_date,
  ].map(sqlValue).join(", ") + ")").join(", ")
  const sourceValue = (field) => "(SELECT `" + field + "` FROM `source` WHERE `source`.`slug` = `manufacturers`.`slug`)"
  const sourceStatus = sourceValue("match_status")
  const sourceCode = sourceValue("company_code")
  const sourceUrl = sourceValue("source_url")
  const sourceDate = sourceValue("checked_date")
  const statusBlank = "`registry_match_status` IS NULL OR trim(`registry_match_status`) = ''"
  const checkDateBlank = "`registry_match_checked_date` IS NULL OR trim(`registry_match_checked_date`) = ''"
  const codeBlank = "`company_code` IS NULL OR trim(`company_code`) = ''"
  const existingSources = "`public_details_source_urls`"
  const mergedSources = "CASE " +
    "WHEN " + existingSources + " IS NULL OR trim(" + existingSources + ") IN ('', '[]', 'null') THEN json_array(" + sourceUrl + ") " +
    "WHEN json_valid(" + existingSources + ") = 1 THEN CASE json_type(" + existingSources + ") " +
      "WHEN 'array' THEN CASE WHEN EXISTS (SELECT 1 FROM json_each(" + existingSources + ") WHERE value = " + sourceUrl + ") " +
        "THEN " + existingSources + " ELSE json_insert(" + existingSources + ", '$[#]', " + sourceUrl + ") END " +
      "ELSE json_array(json_extract(" + existingSources + ", '$'), " + sourceUrl + ") END " +
    "ELSE json_array(" + sourceUrl + ") END"

  // This one bounded statement only touches the 115 immutable legacy slugs. It keeps
  // nonblank operator data, adds each official registry URL at most once, and can be
  // safely retried after a partial boot: statuses/dates converge and a code is filled
  // only from a strict matched manifest row while the stored code is blank.
  app.db().newQuery(
    "WITH `source` (`slug`, `match_status`, `company_code`, `source_url`, `checked_date`) AS (VALUES " + values + ") " +
    "UPDATE `manufacturers` SET " +
      "`registry_match_status` = CASE WHEN " + statusBlank + " THEN " + sourceStatus + " ELSE `registry_match_status` END, " +
      "`registry_match_checked_date` = CASE WHEN " + checkDateBlank + " THEN " + sourceDate + " ELSE `registry_match_checked_date` END, " +
      "`company_code` = CASE WHEN " + sourceStatus + " = 'matched' AND " + codeBlank +
        " AND (" + statusBlank + " OR `registry_match_status` = 'matched') THEN " + sourceCode + " ELSE `company_code` END, " +
      "`public_details_source_urls` = " + mergedSources + " " +
    "WHERE `slug` IN (SELECT `slug` FROM `source`)"
  ).execute()
}, (app) => {
  // Deliberately non-destructive: identity reconciliation metadata and provenance survive rollback.
})
