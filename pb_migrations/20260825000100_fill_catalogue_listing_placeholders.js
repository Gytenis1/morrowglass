/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  // This migration consumes the pushed, complete live-catalogue checkpoint. It
  // never discovers URLs, joins by names, or makes network requests at boot.
  const manifest = require(__hooks + "/../data/placeholder_fill_20260807.json")
  const checkedDate = "2026-08-07"
  const currentYear = 2026
  const expected = {
    targeted_unique_slugs: 147, founded_year_targeted: 96, city_targeted: 53,
    founded_year_filled: 29, founded_year_unfilled: 67, city_filled: 7, city_unfilled: 46,
  }
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  const publicSource = (url) => typeof url === "string" && /^https:\/\/(?:get\.data\.gov\.lt|data\.gov\.lt|rekvizitai\.vz\.lt)\//.test(url)
  const sqlValue = (value) => value === null || value === undefined ? "NULL" :
    (typeof value === "number" ? String(value) : "'" + String(value).replaceAll("'", "''") + "'")
  const jsonEqual = (left, right) => JSON.stringify(left) === JSON.stringify(right)

  if (!manifest || manifest.manifest_version !== 1 || manifest.checked_date !== checkedDate ||
      !manifest.baseline || manifest.baseline.founded_year_zero_count !== 96 || manifest.baseline.city_lietuva_count !== 53 ||
      !manifest.counts || !manifest.results || Array.isArray(manifest.results) || typeof manifest.research_method !== "string") {
    throw new Error("placeholder fill requires the complete audited 2026-08-07 manifest")
  }
  for (const [key, value] of Object.entries(expected)) {
    if (manifest.counts[key] !== value) throw new Error("placeholder fill manifest has invalid " + key + " count")
  }

  const rows = []
  const seen = new Set()
  const counted = { yearTarget: 0, cityTarget: 0, yearFilled: 0, cityFilled: 0 }
  for (const [slug, result] of Object.entries(manifest.results)) {
    if (!result || result.slug !== slug || !slugPattern.test(slug) || seen.has(slug) ||
        !result.original || !result.founded_year || !result.city || !Array.isArray(result.checked_source_urls)) {
      throw new Error("placeholder fill manifest has malformed result for " + slug)
    }
    seen.add(slug)
    const validateOutcome = (field, target, original) => {
      const entry = result[field]
      if (entry.targeted !== target || !["accepted", "not_found_unfilled", "not_targeted"].includes(entry.outcome) ||
          (target && entry.outcome === "not_targeted") || (!target && entry.outcome !== "not_targeted") ||
          (!target && entry.proposed_fill !== null)) throw new Error("placeholder fill has invalid " + field + " outcome for " + slug)
      if (!target) return null
      if (field === "founded_year" && original !== 0) throw new Error("placeholder fill year target did not have live zero for " + slug)
      if (field === "city" && original !== "Lietuva") throw new Error("placeholder fill city target did not have bare-country placeholder for " + slug)
      if (entry.outcome === "not_found_unfilled") {
        if (entry.proposed_fill !== null) throw new Error("placeholder fill has unsupported unfilled value for " + slug)
        return null
      }
      const fill = entry.proposed_fill
      const evidence = result.checked_source_urls.find((check) => check && check.url === fill?.source_url && check.checked_date === checkedDate && check.outcome === "checked")
      if (!fill || fill.checked_date !== checkedDate || !publicSource(fill.source_url) || !evidence) throw new Error("placeholder fill lacks checked source for " + slug)
      if (field === "founded_year" && (!Number.isInteger(fill.value) || fill.value < 1900 || fill.value > currentYear)) throw new Error("placeholder fill has invalid registration year for " + slug)
      if (field === "city" && (typeof fill.value !== "string" || !fill.value.trim() || ["lietuva", "lithuania"].includes(fill.value.trim().toLowerCase()))) throw new Error("placeholder fill has invalid locality for " + slug)
      return fill
    }
    const yearTarget = result.founded_year.targeted === true
    const cityTarget = result.city.targeted === true
    const year = validateOutcome("founded_year", yearTarget, result.original.founded_year)
    const city = validateOutcome("city", cityTarget, result.original.city)
    if (yearTarget) counted.yearTarget++
    if (cityTarget) counted.cityTarget++
    if (year) counted.yearFilled++
    if (city) counted.cityFilled++
    const status = (yearTarget && !year || cityTarget && !city) ? ((year || city) ? "partial" : "unfilled") : "complete"
    rows.push({ slug, yearTarget, cityTarget, year: year?.value ?? null, city: city?.value ?? null, yearUrl: year?.source_url ?? null, cityUrl: city?.source_url ?? null, status })
  }
  if (seen.size !== expected.targeted_unique_slugs || counted.yearTarget !== expected.founded_year_targeted ||
      counted.cityTarget !== expected.city_targeted || counted.yearFilled !== expected.founded_year_filled || counted.cityFilled !== expected.city_filled) {
    throw new Error("placeholder fill manifest accounting does not reconcile")
  }

  const collection = app.findCollectionByNameOrId("manufacturers")
  for (const [name, type] of Object.entries({ slug: "text", founded_year: "number", city: "text", public_details_source_urls: "json" })) {
    const field = collection.fields.getByName(name)
    if (!field || field.type() !== type) throw new Error("manufacturers." + name + " must be a " + type + " field")
  }
  // Existing official_location_* fields describe registry-location research and
  // remain untouched. These two fields document this independent, mixed-source
  // placeholder audit without changing an existing field's vocabulary.
  let schemaChanged = false
  const statusField = collection.fields.getByName("placeholder_fill_status")
  if (!statusField) {
    collection.fields.add(new SelectField({ name: "placeholder_fill_status", maxSelect: 1, values: ["complete", "partial", "unfilled"] }))
    schemaChanged = true
  } else if (statusField.type() !== "select" || statusField.maxSelect !== 1 || !Array.isArray(statusField.values) ||
             !["complete", "partial", "unfilled"].every((value) => statusField.values.includes(value))) {
    throw new Error("manufacturers.placeholder_fill_status must be a compatible single-select field")
  }
  const dateField = collection.fields.getByName("placeholder_fill_checked_date")
  if (!dateField) {
    collection.fields.add(new TextField({ name: "placeholder_fill_checked_date", min: 10, max: 10, pattern: "^\\d{4}-\\d{2}-\\d{2}$" }))
    schemaChanged = true
  } else if (dateField.type() !== "text") {
    throw new Error("manufacturers.placeholder_fill_checked_date must be a text field")
  }
  if (schemaChanged) app.save(collection)

  const values = rows.sort((left, right) => left.slug.localeCompare(right.slug)).map((row) => "(" + [
    row.slug, row.yearTarget ? 1 : 0, row.cityTarget ? 1 : 0, row.year, row.city, row.yearUrl, row.cityUrl, row.status,
  ].map(sqlValue).join(", ") + ")").join(", ")
  const source = (column) => "(SELECT `" + column + "` FROM `source` WHERE `source`.`slug` = `manufacturers`.`slug`)"
  const sourceUrl = (column) => source(column)
  const appendUrl = (base, url) => "CASE WHEN " + url + " IS NULL THEN " + base +
    " WHEN " + base + " IS NULL OR trim(" + base + ") IN ('', '[]', 'null') THEN json_array(" + url + ")" +
    " WHEN json_valid(" + base + ") = 1 AND json_type(" + base + ") = 'array' THEN CASE WHEN EXISTS (SELECT 1 FROM json_each(" + base + ") WHERE value = " + url + ") THEN " + base + " ELSE json_insert(" + base + ", '$[#]', " + url + ") END" +
    " ELSE " + base + " END"
  const afterYearUrl = appendUrl("`public_details_source_urls`", sourceUrl("year_url"))
  const mergedUrls = appendUrl(afterYearUrl, sourceUrl("city_url"))

  // A single bounded statement changes exactly the manifest slugs. Source-backed
  // values fill only a zero/empty year or a bare-country city. Unsupported years
  // and cities become SQL NULL/empty respectively, preserving the accurate
  // absence rather than publishing a placeholder or an invented locality.
  app.db().newQuery(
    "WITH `source` (`slug`, `year_target`, `city_target`, `year_value`, `city_value`, `year_url`, `city_url`, `status`) AS (VALUES " + values + ") " +
    "UPDATE `manufacturers` SET " +
      "`founded_year` = CASE WHEN " + source("year_target") + " = 1 AND " + source("year_value") + " BETWEEN 1900 AND " + currentYear + " AND (`founded_year` IS NULL OR `founded_year` = 0) THEN " + source("year_value") +
        " WHEN " + source("year_target") + " = 1 AND `founded_year` = 0 THEN NULL ELSE `founded_year` END, " +
      "`city` = CASE WHEN " + source("city_target") + " = 1 AND lower(trim(`city`)) IN ('lietuva', 'lithuania') THEN coalesce(" + source("city_value") + ", '') ELSE `city` END, " +
      "`public_details_source_urls` = " + mergedUrls + ", " +
      "`placeholder_fill_status` = " + source("status") + ", " +
      "`placeholder_fill_checked_date` = " + sqlValue(checkedDate) + " " +
    "WHERE `slug` IN (SELECT `slug` FROM `source`)"
  ).execute()
}, (app) => {
  // Deliberately non-destructive: the immutable audit and source-backed fills survive rollback.
})
