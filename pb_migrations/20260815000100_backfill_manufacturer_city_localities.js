/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const batch = require(__hooks + "/../data/manufacturer_city_locality_backfill_20260815.json")
  const expectedCount = 127
  const textFields = ["company_code", "slug", "legal_name", "city", "locality", "location", "region", "region_label", "source_collection_date"]
  const supportedRegions = {
    "vilnius-east-south": "Vilnius, rytų ir pietų Lietuva",
    "kaunas-north": "Kaunas ir šiaurės Lietuva",
    "klaipeda-panevezys-west-central": "Klaipėda, Panevėžys, vakarų ir centrinė Lietuva",
  }

  if (!Array.isArray(batch) || batch.length !== expectedCount) {
    throw new Error("manufacturer city/locality backfill requires the immutable 127-record source batch")
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
    // locality is kept in the manifest for source auditability; this collection's
    // displayed locality columns are city and location, which must agree with it.
    if (record.city === "Lietuva" || record.locality !== record.city || record.location !== record.city ||
        !Array.isArray(record.public_details_source_urls) || record.public_details_source_urls.length !== 1 ||
        !/^https:\/\/get\.data\.gov\.lt\/datasets\/gov\/rc\/ar\/gyvenamojivietove\/GyvenamojiVietove\/[0-9a-f-]{36}$/.test(record.public_details_source_urls[0]) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(record.source_collection_date)) {
      throw new Error("manufacturer city/locality backfill has invalid official locality metadata for " + record.company_code)
    }
    if (supportedRegions[record.region] !== record.region_label) {
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
    record.public_details_source_urls[0],
    record.source_collection_date,
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

  // Region grouping is deterministic from the verified Savivaldybė: the
  // Vilnius/Alytus/Marijampolė/Utena east-south municipalities use the Vilnius
  // label; Kaunas/Šiauliai/Telšiai/Tauragė municipalities use Kaunas/north;
  // Klaipėda and Panevėžys (including Kėdainiai central) use west/central.
  // The single bounded statement is atomic and only matches the current national
  // placeholder. It cannot create/delete rows, preserves already-specific cities,
  // and appends (rather than replaces) the concrete official locality source.
  app.db().newQuery(
    "WITH `source` (`company_code`, `city`, `location`, `region`, `region_label`, `source_url`, `source_collection_date`) AS (VALUES " + values + ") " +
    "UPDATE `manufacturers` SET " +
      "`city` = " + sourceValue("city") + ", " +
      "`location` = " + sourceValue("location") + ", " +
      "`region` = " + sourceValue("region") + ", " +
      "`region_label` = " + sourceValue("region_label") + ", " +
      "`public_details_source_urls` = " + mergedSources + ", " +
      "`source_collection_date` = " + sourceValue("source_collection_date") + " " +
    "WHERE `city` = 'Lietuva' AND `company_code` IN (SELECT `company_code` FROM `source`)"
  ).execute()
}, (app) => {
  // Deliberately non-destructive: sourced locality enrichments survive rollback.
})
