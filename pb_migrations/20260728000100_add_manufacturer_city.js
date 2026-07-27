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
    if (typeof record.city !== "string" || !record.city.trim()) {
      throw new Error("Manufacturer " + record.slug + " must have a nonempty city")
    }
    slugs.add(record.slug)
  }

  const collection = app.findCollectionByNameOrId("manufacturers")
  const expected = new TextField({ name: "city", required: true, min: 1, max: 240 })
  const existing = collection.fields.getByName("city")

  if (!existing) {
    collection.fields.add(expected)
  } else {
    if (existing.type() !== expected.type()) {
      throw new Error("manufacturers.city exists with incompatible type " + existing.type())
    }
    existing.required = true
    existing.min = 1
    existing.max = 240
  }

  // Saving only the field definition leaves the collection's existing API rules untouched.
  app.save(collection)

  const sqlValue = (value) => "'" + String(value).replaceAll("'", "''") + "'"
  const cases = seed.map((record) => "WHEN " + sqlValue(record.slug) + " THEN " + sqlValue(record.city)).join(" ")
  const slugList = seed.map((record) => sqlValue(record.slug)).join(",")

  // One idempotent statement updates only city for all versioned manufacturer rows.
  const sql = "UPDATE `manufacturers` SET `city` = CASE `slug` " + cases + " ELSE `city` END WHERE `slug` IN (" + slugList + ")"
  app.db().newQuery(sql).execute()
}, (app) => {
  // Deliberately non-destructive: persistent production data and schema survive rollback.
})
