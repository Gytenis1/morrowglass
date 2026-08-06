/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const manifest = require(__hooks + "/../data/websites_resolved_20260806.json")
  const expectedCount = 273
  const checkedDate = "2026-08-06"
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  const validUrl = (url) => typeof url === "string" && /^https:\/\/[^\s]+$/i.test(url)

  // This validates the immutable research artifact before touching either schema or
  // data, so an accidental partial/exported manifest cannot silently change records.
  if (!manifest || typeof manifest.method !== "string" || !manifest.method ||
      !manifest.baseline || manifest.baseline.target_count !== expectedCount ||
      manifest.baseline.checked_date !== checkedDate || !manifest.counts ||
      manifest.counts.total !== expectedCount || !Array.isArray(manifest.results) ||
      manifest.results.length !== expectedCount) {
    throw new Error("manufacturer website lookup requires the complete 2026-08-06 273-record manifest")
  }

  const seen = new Set()
  let foundCount = 0
  for (const result of manifest.results) {
    if (!result || !slugPattern.test(result.slug || "") || seen.has(result.slug) ||
        typeof result.legal_name !== "string" || typeof result.company_code !== "string" ||
        result.checked_date !== checkedDate || typeof result.evidence_note !== "string" || !result.evidence_note ||
        !["found", "not_found"].includes(result.status)) {
      throw new Error("manufacturer website lookup has invalid research metadata")
    }
    seen.add(result.slug)
    if (result.status === "found") {
      if (!validUrl(result.website) || !validUrl(result.website_source_url)) {
        throw new Error("manufacturer website lookup has an invalid found website for " + result.slug)
      }
      foundCount++
    } else if (result.website !== null || result.website_source_url !== null) {
      throw new Error("manufacturer website lookup has an invalid not-found website for " + result.slug)
    }
  }
  if (manifest.counts.found !== foundCount || manifest.counts.not_found !== expectedCount - foundCount) {
    throw new Error("manufacturer website lookup counts do not match its results")
  }

  const collection = app.findCollectionByNameOrId("manufacturers")
  for (const [name, type] of Object.entries({
    slug: "text",
    website: "url",
    public_details_source_urls: "json",
  })) {
    const field = collection.fields.getByName(name)
    if (!field || field.type() !== type) {
      throw new Error("manufacturers." + name + " must be a " + type + " field")
    }
  }

  let schemaChanged = false
  const statusField = collection.fields.getByName("website_lookup_status")
  if (!statusField) {
    collection.fields.add(new SelectField({ name: "website_lookup_status", maxSelect: 1, values: ["found", "not_found"] }))
    schemaChanged = true
  } else if (statusField.type() !== "select") {
    throw new Error("manufacturers.website_lookup_status must be a select field")
  }
  const dateField = collection.fields.getByName("website_checked_date")
  if (!dateField) {
    collection.fields.add(new TextField({ name: "website_checked_date", min: 10, max: 10, pattern: "^\\d{4}-\\d{2}-\\d{2}$" }))
    schemaChanged = true
  } else if (dateField.type() !== "text") {
    throw new Error("manufacturers.website_checked_date must be a text field")
  }
  if (schemaChanged) app.save(collection)

  const sqlValue = (value) => value === null ? "NULL" : "'" + String(value).replaceAll("'", "''") + "'"
  const rows = manifest.results.map((result) => "(" + [
    result.slug,
    result.status,
    result.website,
    result.website_source_url,
  ].map(sqlValue).join(", ") + ")").join(", ")
  const source = (column) => "(SELECT `" + column + "` FROM `source` WHERE `source`.`slug` = `manufacturers`.`slug` LIMIT 1)"
  const isFound = source("status") + " = 'found'"
  const blankWebsite = "(`website` IS NULL OR trim(`website`) = '')"
  const sourceUrl = source("website_source_url")
  const existingSources = "`public_details_source_urls`"
  // Valid JSON arrays retain all old provenance and append one concrete public
  // source only once. The other branches deliberately leave malformed/non-array
  // pre-existing data intact unless there is no existing value to preserve.
  const mergedSources = "CASE " +
    "WHEN " + existingSources + " IS NULL OR trim(" + existingSources + ") IN ('', '[]', 'null') THEN json_array(" + sourceUrl + ") " +
    "WHEN json_valid(" + existingSources + ") = 1 AND json_type(" + existingSources + ") = 'array' THEN CASE " +
      "WHEN EXISTS (SELECT 1 FROM json_each(" + existingSources + ") WHERE value = " + sourceUrl + ") THEN " + existingSources +
      " ELSE json_insert(" + existingSources + ", '$[#]', " + sourceUrl + ") END " +
    "ELSE " + existingSources + " END"

  // One bounded, slug-keyed statement is safe after an interrupted attempt: an
  // official URL only fills an empty website, provenance is de-duplicated, and the
  // same status/date assignment converges on every retry. Existing websites and all
  // unrelated columns remain untouched.
  app.db().newQuery(
    "WITH `source` (`slug`, `status`, `website`, `website_source_url`) AS (VALUES " + rows + ") " +
    "UPDATE `manufacturers` SET " +
      "`website` = CASE WHEN " + isFound + " AND " + blankWebsite + " THEN " + source("website") + " ELSE `website` END, " +
      "`public_details_source_urls` = CASE WHEN " + isFound + " THEN " + mergedSources + " ELSE `public_details_source_urls` END, " +
      "`website_lookup_status` = " + source("status") + ", " +
      "`website_checked_date` = " + sqlValue(checkedDate) + " " +
    "WHERE `slug` IN (SELECT `slug` FROM `source`)"
  ).execute()
}, (app) => {
  // Deliberately non-destructive: audited outcomes and accepted public URLs survive rollback.
})
