/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const seed = require(__hooks + "/../data/manufacturers.json")
  const fieldNames = [
    "company_code",
    "public_details_source_urls",
    "revenue_eur_latest",
    "revenue_year",
    "financial_source_url",
    "owner_manager_name",
    "owner_signal",
    "revenue_availability",
    "financial_verification_status",
    "verified_at",
  ]

  if (!Array.isArray(seed) || seed.length !== 200) {
    throw new Error("data/manufacturers.json must retain exactly 200 manufacturer records")
  }

  const slugs = new Set()
  for (const record of seed) {
    if (!record.slug || slugs.has(record.slug)) throw new Error("Every manufacturer must have a unique nonempty slug")
    slugs.add(record.slug)
    if (!/^\d{7,12}$/.test(record.company_code || "")) throw new Error("Manufacturer " + record.slug + " must have a public company identifier")
    if (!Array.isArray(record.public_details_source_urls) || record.public_details_source_urls.length === 0 || !record.public_details_source_urls.every((url) => typeof url === "string" && /^https:\/\//.test(url))) {
      throw new Error("Manufacturer " + record.slug + " must retain public registry provenance")
    }
    if (typeof record.financial_source_url !== "string" || !/^https:\/\//.test(record.financial_source_url)) throw new Error("Manufacturer " + record.slug + " must have a public financial source URL")
    if (record.financial_verification_status !== "patikrinta") throw new Error("Manufacturer " + record.slug + " must be marked checked")
    if (!/^\d{4}-\d{2}-\d{2}$/.test(record.verified_at || "")) throw new Error("Manufacturer " + record.slug + " has an invalid verified_at date")
    if (record.revenue_availability === "paskelbta") {
      if (!Number.isFinite(record.revenue_eur_latest) || !Number.isInteger(record.revenue_year)) throw new Error("Manufacturer " + record.slug + " has incomplete published revenue")
    } else if (record.revenue_availability !== "nepaskelbta" || record.revenue_eur_latest !== null || record.revenue_year !== null) {
      throw new Error("Manufacturer " + record.slug + " must explicitly mark unpublished revenue without filling number fields")
    }
  }
  if (new Set(seed.map((record) => record.verified_at)).size !== 1) throw new Error("Financial verification date must be uniform")

  const collection = app.findCollectionByNameOrId("manufacturers")
  const expectedFields = [
    new NumberField({ name: "revenue_eur_latest", min: 0 }),
    new NumberField({ name: "revenue_year", min: 1800, max: 2100 }),
    new TextField({ name: "financial_source_url", max: 1000 }),
    new TextField({ name: "owner_manager_name", max: 240 }),
    new TextField({ name: "owner_signal", max: 300 }),
    new TextField({ name: "verified_at", min: 10, max: 10, pattern: "^\\d{4}-\\d{2}-\\d{2}$" }),
    new SelectField({ name: "revenue_availability", maxSelect: 1, values: ["paskelbta", "nepaskelbta"] }),
    new SelectField({ name: "financial_verification_status", maxSelect: 1, values: ["patikrinta"] }),
  ]

  for (const expected of expectedFields) {
    const existing = collection.fields.getByName(expected.name)
    if (!existing) {
      collection.fields.add(expected)
      continue
    }
    if (existing.type() !== expected.type()) throw new Error("manufacturers." + expected.name + " exists with incompatible type " + existing.type())
  }
  // Saving once after guarded field creation makes an interrupted migration safe to
  // rerun: a retry finds each field already present and continues to the bulk update.
  app.save(collection)

  const sqlValue = (value) => {
    if (value === null || value === undefined) return "NULL"
    if (typeof value === "number") return String(value)
    const text = Array.isArray(value) ? JSON.stringify(value) : String(value)
    return "'" + text.replaceAll("'", "''") + "'"
  }
  const caseFor = (field) => seed.map((record) => {
    // PocketBase stores NumberField values as NOT NULL columns. Its zero default is
    // used only where revenue_availability is the explicit `nepaskelbta` marker;
    // consumers must use that marker rather than interpreting zero as revenue.
    let value = record[field]
    if (value === null) value = field === "revenue_eur_latest" || field === "revenue_year" ? 0 : ""
    return "WHEN " + sqlValue(record.slug) + " THEN " + sqlValue(value)
  }).join(" ")
  const valueFor = (field) => "CASE `slug` " + caseFor(field) + " ELSE `" + field + "` END"
  const assignments = fieldNames.map((field) => "`" + field + "` = " + valueFor(field)).join(", ")
  const changed = fieldNames.map((field) => "`" + field + "` IS NOT " + valueFor(field)).join(" OR ")
  const slugList = seed.map((record) => sqlValue(record.slug)).join(",")

  // One bounded idempotent statement updates only sourced registry/financial fields.
  // It neither inserts nor deletes records and deliberately never names catalogue
  // descriptions, categories, labels, or their evidence fields.
  app.db().newQuery("UPDATE `manufacturers` SET " + assignments + " WHERE `slug` IN (" + slugList + ") AND (" + changed + ")").execute()
}, (app) => {
  // Deliberately non-destructive: enrichment and catalogue records survive rollback.
})
