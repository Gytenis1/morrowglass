/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const seed = require(__hooks + "/../data/manufacturers.json")

  if (!Array.isArray(seed) || seed.length !== 121) {
    throw new Error("data/manufacturers.json must contain exactly 121 records")
  }

  const slugs = new Set()
  for (const record of seed) {
    if (!record.slug || slugs.has(record.slug)) {
      throw new Error("Every manufacturer must have a unique nonempty slug")
    }
    if (typeof record.description_lt !== "string" || !record.description_lt.trim()) {
      throw new Error("Manufacturer " + record.slug + " must have an enriched description_lt")
    }
    if (!Array.isArray(record.category_codes) || !Array.isArray(record.category_labels) || record.category_codes.length !== record.category_labels.length) {
      throw new Error("Manufacturer " + record.slug + " must have matching category arrays")
    }
    if (!Array.isArray(record.source_urls) || !record.source_urls.some((url) => record.scope_evidence.includes(url))) {
      throw new Error("Manufacturer " + record.slug + " scope_evidence must cite one of its source URLs")
    }
    slugs.add(record.slug)
  }

  const collection = app.findCollectionByNameOrId("manufacturers")
  let categoryCodes = collection.fields.getByName("category_codes")
  if (!categoryCodes) {
    categoryCodes = new SelectField({
      name: "category_codes",
      required: false,
      maxSelect: 8,
      values: ["K", "W", "BB", "OC", "HR", "U", "SW", "MM"],
    })
    collection.fields.add(categoryCodes)
  } else {
    if (categoryCodes.type() !== "select") {
      throw new Error("manufacturers.category_codes exists with incompatible type " + categoryCodes.type())
    }
    categoryCodes.required = false
    categoryCodes.maxSelect = 8
    categoryCodes.values = ["K", "W", "BB", "OC", "HR", "U", "SW", "MM"]
  }

  let categoryLabels = collection.fields.getByName("category_labels")
  if (!categoryLabels) {
    categoryLabels = new JSONField({ name: "category_labels", required: false, maxSize: 4096 })
    collection.fields.add(categoryLabels)
  } else {
    if (categoryLabels.type() !== "json") {
      throw new Error("manufacturers.category_labels exists with incompatible type " + categoryLabels.type())
    }
    categoryLabels.required = false
    categoryLabels.maxSize = 4096
  }

  // Mutating only these fields preserves every other field, including city and all API rules.
  app.save(collection)

  const sqlValue = (value) => {
    const text = Array.isArray(value) ? JSON.stringify(value) : String(value)
    return "'" + text.replaceAll("'", "''") + "'"
  }
  const caseFor = (field) => seed
    .map((record) => "WHEN " + sqlValue(record.slug) + " THEN " + sqlValue(record[field]))
    .join(" ")
  const slugList = seed.map((record) => sqlValue(record.slug)).join(",")

  // One bounded, idempotent bulk update; a restart repeats the same values and does no harm.
  // There are no per-row database lookups or saves, and rows outside the versioned set are untouched.
  const sql = "UPDATE `manufacturers` SET " +
    "`description_lt` = CASE `slug` " + caseFor("description_lt") + " ELSE `description_lt` END, " +
    "`category_codes` = CASE `slug` " + caseFor("category_codes") + " ELSE `category_codes` END, " +
    "`category_labels` = CASE `slug` " + caseFor("category_labels") + " ELSE `category_labels` END, " +
    "`scope_evidence` = CASE `slug` " + caseFor("scope_evidence") + " ELSE `scope_evidence` END, " +
    "`verification_status` = CASE `slug` " + caseFor("verification_status") + " ELSE `verification_status` END " +
    "WHERE `slug` IN (" + slugList + ")"
  app.db().newQuery(sql).execute()
}, (app) => {
  // Deliberately non-destructive: persistent production data and optional fields survive rollback.
})
