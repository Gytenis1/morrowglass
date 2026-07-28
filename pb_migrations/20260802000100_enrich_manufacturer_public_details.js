/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const seed = require(__hooks + "/../data/manufacturers.json")
  const detailFields = [
    "company_code",
    "public_phone",
    "street_address",
    "postcode",
    "founded_year",
    "employee_count_band",
    "public_details_source_urls",
  ]

  if (!Array.isArray(seed) || seed.length !== 200) {
    throw new Error("data/manufacturers.json must retain exactly 200 manufacturer records")
  }

  const slugs = new Set()
  for (const record of seed) {
    if (!record.slug || slugs.has(record.slug)) {
      throw new Error("Every manufacturer must have a unique nonempty slug")
    }
    slugs.add(record.slug)

    const populated = detailFields.filter((field) => record[field] !== undefined && record[field] !== null && record[field] !== "")
    if (populated.length === 0) continue

    if (!Array.isArray(record.public_details_source_urls) || record.public_details_source_urls.length === 0 || !record.public_details_source_urls.every((url) => typeof url === "string" && /^https:\/\//.test(url))) {
      throw new Error("Manufacturer " + record.slug + " public details must retain public source URL provenance")
    }
    if (record.company_code !== undefined && !/^\d{7,12}$/.test(record.company_code)) {
      throw new Error("Manufacturer " + record.slug + " has an invalid public company code")
    }
    if (record.founded_year !== undefined && (!Number.isInteger(record.founded_year) || record.founded_year < 1800 || record.founded_year > 2100)) {
      throw new Error("Manufacturer " + record.slug + " has an invalid founded year")
    }
  }

  const collection = app.findCollectionByNameOrId("manufacturers")
  const expectedFields = [
    new TextField({ name: "company_code", max: 32, pattern: "^\\d{7,12}$" }),
    new TextField({ name: "public_phone", max: 64 }),
    new TextField({ name: "street_address", max: 500 }),
    new TextField({ name: "postcode", max: 32, pattern: "^[A-Z]{2}-\\d{5}$" }),
    new NumberField({ name: "founded_year", min: 1800, max: 2100 }),
    new SelectField({ name: "employee_count_band", maxSelect: 1, values: ["0", "1-9", "10-49", "50-249", "250+"] }),
    new JSONField({ name: "public_details_source_urls", maxSize: 8192 }),
  ]

  for (const expected of expectedFields) {
    const existing = collection.fields.getByName(expected.name)
    if (!existing) {
      collection.fields.add(expected)
      continue
    }
    if (existing.type() !== expected.type()) {
      throw new Error("manufacturers." + expected.name + " exists with incompatible type " + existing.type())
    }
  }
  app.save(collection)

  const sqlValue = (value) => {
    if (typeof value === "number") return String(value)
    const text = Array.isArray(value) ? JSON.stringify(value) : String(value)
    return "'" + text.replaceAll("'", "''") + "'"
  }
  const recordsWithDetails = seed.filter((record) => Array.isArray(record.public_details_source_urls) && record.public_details_source_urls.length > 0)
  const caseFor = (field) => recordsWithDetails
    .filter((record) => record[field] !== undefined && record[field] !== null && record[field] !== "")
    .map((record) => "WHEN " + sqlValue(record.slug) + " THEN " + sqlValue(record[field]))
    .join(" ")
  const valueFor = (field) => "CASE `slug` " + caseFor(field) + " ELSE `" + field + "` END"
  const assignments = detailFields.map((field) => "`" + field + "` = " + valueFor(field)).join(", ")
  const changed = detailFields.map((field) => "`" + field + "` IS NOT " + valueFor(field)).join(" OR ")
  const slugList = recordsWithDetails.map((record) => sqlValue(record.slug)).join(",")

  // One bounded, restart-safe statement updates only the seven sourced public-detail
  // fields by slug. Its change predicate means a retry after a partial run does not
  // rewrite already-converged rows; no catalog records are inserted or deleted and
  // curated descriptions, categories, and source_urls are not named by this query.
  const sql = "UPDATE `manufacturers` SET " + assignments +
    " WHERE `slug` IN (" + slugList + ") AND (" + changed + ")"
  app.db().newQuery(sql).execute()
}, (app) => {
  // Deliberately non-destructive: public-detail fields and catalog records survive rollback.
})
