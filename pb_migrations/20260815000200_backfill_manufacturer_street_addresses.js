/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const batch = require(__hooks + "/../data/manufacturer_address_postcode_backfill_20260815.json")
  const expectedCount = 143
  const requiredTextFields = ["company_code", "street_address", "source_collection_date"]
  const officialAddressUrl = /^https:\/\/get\.data\.gov\.lt\/datasets\/gov\/rc\/ar\/adresai\/Adresas\/[0-9a-f-]{36}$/
  const publicDirectoryUrl = /^https:\/\/rekvizitai\.vz\.lt\/en\/company\/[a-z0-9_]+\/$/

  if (!Array.isArray(batch) || batch.length !== expectedCount) {
    throw new Error("manufacturer address/postcode backfill requires the immutable 143-record source batch")
  }

  const seenCodes = new Set()
  for (const record of batch) {
    if (!record || seenCodes.has(record.company_code) || !/^\d{7,12}$/.test(record.company_code || "")) {
      throw new Error("manufacturer address/postcode backfill requires unique valid company codes")
    }
    seenCodes.add(record.company_code)
    for (const field of requiredTextFields) {
      if (typeof record[field] !== "string" || !record[field].trim()) {
        throw new Error("manufacturer address/postcode backfill has an empty " + field + " for " + record.company_code)
      }
    }
    for (const field of ["slug", "legal_name"]) {
      if (field in record && (typeof record[field] !== "string" || !record[field].trim())) {
        throw new Error("manufacturer address/postcode backfill has invalid optional " + field + " for " + record.company_code)
      }
    }
    if (typeof record.postcode !== "string" || (record.postcode !== "" && !/^LT-\d{5}$/.test(record.postcode)) ||
        !Array.isArray(record.public_details_source_urls) || record.public_details_source_urls.length !== 1 ||
        !(officialAddressUrl.test(record.public_details_source_urls[0]) || publicDirectoryUrl.test(record.public_details_source_urls[0])) ||
        record.source_collection_date !== "2026-08-15") {
      throw new Error("manufacturer address/postcode backfill has invalid public address metadata for " + record.company_code)
    }
  }

  const collection = app.findCollectionByNameOrId("manufacturers")
  for (const fieldName of ["company_code", "street_address", "postcode", "location", "source_collection_date"]) {
    const field = collection.fields.getByName(fieldName)
    if (!field || field.type() !== "text") {
      throw new Error("manufacturers." + fieldName + " must be a text field")
    }
  }
  const provenance = collection.fields.getByName("public_details_source_urls")
  if (!provenance || provenance.type() !== "json") {
    throw new Error("manufacturers.public_details_source_urls must be a JSON field")
  }

  const sqlValue = (value) => "'" + String(value).replaceAll("'", "''") + "'"
  const values = batch.map((record) => "(" + [
    record.company_code,
    record.street_address,
    record.postcode,
    record.public_details_source_urls[0],
    record.source_collection_date,
  ].map(sqlValue).join(", ") + ")").join(", ")
  const sourceValue = (field) => "(SELECT `" + field + "` FROM `source` WHERE `source`.`company_code` = `manufacturers`.`company_code`)"
  const sourceStreet = sourceValue("street_address")
  const sourcePostcode = sourceValue("postcode")
  const sourceUrl = sourceValue("source_url")
  const existingSources = "`public_details_source_urls`"
  const mergedSources = "CASE " +
    "WHEN " + existingSources + " IS NULL OR trim(" + existingSources + ") IN ('', '[]', 'null') THEN json_array(" + sourceUrl + ") " +
    "WHEN json_valid(" + existingSources + ") = 1 THEN CASE json_type(" + existingSources + ") " +
      "WHEN 'array' THEN CASE WHEN EXISTS (SELECT 1 FROM json_each(" + existingSources + ") WHERE value = " + sourceUrl + ") " +
        "THEN " + existingSources + " ELSE json_insert(" + existingSources + ", '$[#]', " + sourceUrl + ") END " +
      "ELSE json_array(json_extract(" + existingSources + ", '$'), " + sourceUrl + ") END " +
    "ELSE json_array(" + sourceUrl + ") END"
  const streetBlank = "`street_address` IS NULL OR trim(`street_address`) = ''"
  const postcodeBlank = "`postcode` IS NULL OR trim(`postcode`) = ''"

  // The collection convention keeps city/locality in location and the precise
  // street in street_address. There is no established composed location format,
  // so location is deliberately untouched: this preserves any existing city
  // rather than replacing it with a less compatible address string. The one
  // bounded statement is atomic, updates only existing matching rows with a
  // blank sourced fact, and is a no-op after a successful run or partial retry.
  app.db().newQuery(
    "WITH `source` (`company_code`, `street_address`, `postcode`, `source_url`, `source_collection_date`) AS (VALUES " + values + ") " +
    "UPDATE `manufacturers` SET " +
      "`street_address` = CASE WHEN " + streetBlank + " THEN " + sourceStreet + " ELSE `street_address` END, " +
      "`postcode` = CASE WHEN " + postcodeBlank + " AND " + sourcePostcode + " <> '' THEN " + sourcePostcode + " ELSE `postcode` END, " +
      "`public_details_source_urls` = " + mergedSources + ", " +
      "`source_collection_date` = " + sourceValue("source_collection_date") + " " +
    "WHERE `company_code` IN (SELECT `company_code` FROM `source`) AND (" + streetBlank + " OR (" + postcodeBlank + " AND " + sourcePostcode + " <> ''))"
  ).execute()
}, (app) => {
  // Deliberately non-destructive: verified public-address enrichments survive rollback.
})
