/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const allSeed = require(__hooks + "/../data/manufacturers.json")
  const officialBatch = require(__hooks + "/../data/official_furniture_candidates_20260801.json")
  const legacyRecordCount = 315
  const expectedOfficialRecordCount = 135
  const officialSourceType = "Lietuvos atvirų duomenų portalas (Registrų centras)"

  // The immutable official batch owns the final 135 entries. Requiring it to match the
  // final source segment prevents this migration from assigning provenance to a later,
  // unrelated catalogue addition.
  if (!Array.isArray(allSeed) || allSeed.length !== legacyRecordCount + expectedOfficialRecordCount ||
      !Array.isArray(officialBatch) || officialBatch.length !== expectedOfficialRecordCount ||
      JSON.stringify(allSeed.slice(legacyRecordCount)) !== JSON.stringify(officialBatch)) {
    throw new Error("official provenance backfill requires the immutable 135-record official source batch")
  }

  const slugs = new Set()
  for (const record of officialBatch) {
    if (!record || !record.slug || slugs.has(record.slug) || !/^\d{7,12}$/.test(record.company_code || "")) {
      throw new Error("official provenance backfill requires unique source-backed company identities")
    }
    if (record.evidence_source_type !== officialSourceType ||
        !Array.isArray(record.source_urls) || record.source_urls.length !== 1 ||
        record.source_urls[0] !== record.source_artifact_url ||
        !/^https:\/\/get\.data\.gov\.lt\//.test(record.source_urls[0])) {
      throw new Error("official provenance backfill requires one direct official source URL for " + record.slug)
    }
    slugs.add(record.slug)
  }

  const collection = app.findCollectionByNameOrId("manufacturers")
  const provenance = collection.fields.getByName("public_details_source_urls")
  if (!provenance || provenance.type() !== "json") {
    throw new Error("manufacturers.public_details_source_urls must be a JSON field")
  }

  const sqlValue = (value) => {
    const text = Array.isArray(value) ? JSON.stringify(value) : String(value)
    return "'" + text.replaceAll("'", "''") + "'"
  }
  const cases = officialBatch
    .map((record) => "WHEN " + sqlValue(record.slug) + " THEN " + sqlValue(record.source_urls))
    .join(" ")
  const slugList = officialBatch.map((record) => sqlValue(record.slug)).join(",")

  // Populate only blank provenance on the fixed official-source batch. The source URL
  // already stored in each versioned record is copied verbatim, no public fact is
  // inferred, and an operator-supplied provenance value is never overwritten.
  app.db().newQuery(
    "UPDATE `manufacturers` SET `public_details_source_urls` = CASE `slug` " + cases + " ELSE `public_details_source_urls` END " +
    "WHERE `slug` IN (" + slugList + ") AND (" +
    "`public_details_source_urls` IS NULL OR `public_details_source_urls` = '' OR " +
    "`public_details_source_urls` = '[]' OR `public_details_source_urls` = 'null')"
  ).execute()
}, (app) => {
  // Deliberately non-destructive: no catalogue rows or user-supplied provenance are removed.
})
