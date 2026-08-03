/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const batch = require(__hooks + "/../data/manufacturer_city_locality_backfill_20260815.json")
  const expectedCount = 5
  const textFields = ["company_code", "slug", "legal_name", "city", "locality", "location", "region", "region_label", "source_url", "source_collection_date", "checked_date"]

  if (!Array.isArray(batch) || batch.length !== expectedCount) {
    throw new Error("manufacturer city/locality backfill requires the immutable 5-record source batch")
  }

  const seenCodes = new Set()
  for (const record of batch) {
    if (!record || seenCodes.has(record.company_code) || !/^\d{7,12}$/.test(record.company_code || "")) {
      throw new Error("manufacturer city/locality backfill requires unique valid company codes")
    }
    seenCodes.add(record.company_code)
    for (const field of textFields) {
      if (typeof record[field] !== "string" || !record[field].trim()) {
        throw new Error("manufacturer city/locality backfill has an empty " + field + " for " + record.company_code)
      }
    }
    if (record.city === "Lietuva" || record.location === "Lietuva" || record.locality === "Lietuva" ||
        !/^https:\/\/rekvizitai\.vz\.lt\//.test(record.source_url) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(record.checked_date) || record.source_collection_date !== record.checked_date) {
      throw new Error("manufacturer city/locality backfill has invalid sourced locality metadata for " + record.company_code)
    }
    if ((record.region === "vilnius-east-south" && record.region_label !== "Vilnius, rytų ir pietų Lietuva") ||
        (record.region === "kaunas-north" && record.region_label !== "Kaunas ir šiaurės Lietuva") ||
        (record.region === "klaipeda-panevezys-west-central" && record.region_label !== "Klaipėda, Panevėžys, vakarų ir centrinė Lietuva") ||
        !["vilnius-east-south", "kaunas-north", "klaipeda-panevezys-west-central"].includes(record.region)) {
      throw new Error("manufacturer city/locality backfill has an unsupported region grouping for " + record.company_code)
    }
  }

  const collection = app.findCollectionByNameOrId("manufacturers")
  for (const fieldName of ["company_code", "city", "location", "region", "region_label", "source_collection_date"]) {
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
    record.city,
    record.location,
    record.region,
    record.region_label,
    record.source_url,
    record.checked_date,
  ].map(sqlValue).join(", ") + ")").join(", ")
  const sourceValue = (field) => "(SELECT `" + field + "` FROM `source` WHERE `source`.`company_code` = `manufacturers`.`company_code`)"
  const sourceUrl = sourceValue("source_url")
  const existingSources = "`public_details_source_urls`"
  const mergedSources = "CASE " +
    "WHEN " + existingSources + " IS NULL OR trim(" + existingSources + ") IN ('', '[]', 'null') THEN json_array(" + sourceUrl + ") " +
    "WHEN json_valid(" + existingSources + ") = 1 THEN CASE json_type(" + existingSources + ") " +
      "WHEN 'array' THEN CASE WHEN EXISTS (SELECT 1 FROM json_each(" + existingSources + ") WHERE value = " + sourceUrl + ") " +
        "THEN " + existingSources + " ELSE json_insert(" + existingSources + ", '$[#]', " + sourceUrl + ") END " +
      "ELSE json_array(json_extract(" + existingSources + ", '$'), " + sourceUrl + ") END " +
    "ELSE json_array(" + sourceUrl + ") END"

  // A single bounded statement is atomic and only matches the known placeholder. It
  // neither creates nor removes records, leaves stronger cities untouched, and appends
  // this concrete source URL only when it is not already present.
  app.db().newQuery(
    "WITH `source` (`company_code`, `city`, `location`, `region`, `region_label`, `source_url`, `checked_date`) AS (VALUES " + values + ") " +
    "UPDATE `manufacturers` SET " +
      "`city` = " + sourceValue("city") + ", " +
      "`location` = " + sourceValue("location") + ", " +
      "`region` = " + sourceValue("region") + ", " +
      "`region_label` = " + sourceValue("region_label") + ", " +
      "`public_details_source_urls` = " + mergedSources + ", " +
      "`source_collection_date` = " + sourceValue("checked_date") + " " +
    "WHERE `city` = 'Lietuva' AND `company_code` IN (SELECT `company_code` FROM `source`)"
  ).execute()
}, (app) => {
  // Deliberately non-destructive: sourced locality enrichments survive rollback.
})
