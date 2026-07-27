/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const seed = require(__hooks + "/../data/manufacturers.json")

  if (!Array.isArray(seed) || seed.length !== 121) {
    throw new Error("data/manufacturers.json must contain exactly 121 records")
  }

  let collection
  try {
    collection = app.findCollectionByNameOrId("manufacturers")
  } catch (_) {
    collection = new Collection({
      name: "manufacturers",
      type: "base",
    })
  }

  // Empty strings make list/view public. null rules close create/update/delete.
  collection.listRule = ""
  collection.viewRule = ""
  collection.createRule = null
  collection.updateRule = null
  collection.deleteRule = null

  const expectedFields = [
    new TextField({ name: "slug", required: true, min: 1, max: 180, pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" }),
    new TextField({ name: "legal_name", max: 240 }),
    new TextField({ name: "trading_name", required: true, min: 1, max: 240, presentable: true }),
    new TextField({ name: "source_identity", required: true, min: 1, max: 500 }),
    new BoolField({ name: "legal_entity_known" }),
    new TextField({ name: "description_lt", max: 1200 }),
    new TextField({ name: "location", required: true, min: 1, max: 240 }),
    new SelectField({
      name: "region",
      required: true,
      maxSelect: 1,
      values: ["vilnius-east-south", "kaunas-north", "klaipeda-panevezys-west-central"],
    }),
    new TextField({ name: "region_label", required: true, min: 1, max: 240 }),
    new SelectField({
      name: "category_codes",
      required: true,
      maxSelect: 8,
      values: ["K", "W", "BB", "OC", "HR", "U", "SW", "MM"],
    }),
    new JSONField({ name: "category_labels", required: true, maxSize: 4096 }),
    new SelectField({ name: "audience", required: true, maxSelect: 1, values: ["buitiniai", "verslas", "abiem"] }),
    new URLField({ name: "website" }),
    new URLField({ name: "public_contact_url" }),
    new SelectField({ name: "portfolio_status", required: true, maxSelect: 1, values: ["yra", "nežinoma"] }),
    new SelectField({ name: "confidence", required: true, maxSelect: 1, values: ["aukštas", "vidutinis"] }),
    new TextField({ name: "confidence_evidence", required: true, min: 1, max: 2400 }),
    new TextField({ name: "scope_evidence", required: true, min: 1, max: 2000 }),
    new TextField({ name: "evidence_source_type", required: true, min: 1, max: 240 }),
    new JSONField({ name: "source_urls", required: true, maxSize: 8192 }),
    new URLField({ name: "source_artifact_url", required: true }),
    new TextField({ name: "source_collection_date", required: true, min: 10, max: 10, pattern: "^\\d{4}-\\d{2}-\\d{2}$" }),
    new SelectField({ name: "verification_status", required: true, maxSelect: 1, values: ["nepatvirtinta"] }),
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

    // Keep the stable field id while bringing an already-partial schema up to date.
    existing.required = expected.required
    existing.presentable = expected.presentable
    if (expected.min !== undefined) existing.min = expected.min
    if (expected.max !== undefined) existing.max = expected.max
    if (expected.pattern !== undefined) existing.pattern = expected.pattern
    if (expected.maxSize !== undefined) existing.maxSize = expected.maxSize
    if (expected.maxSelect !== undefined) existing.maxSelect = expected.maxSelect
    if (expected.values !== undefined) existing.values = expected.values
  }

  const hasSlugIndex = collection.indexes.some((index) => index.includes("idx_manufacturers_slug"))
  if (!hasSlugIndex) {
    collection.addIndex("idx_manufacturers_slug", true, "slug", "")
  }

  app.save(collection)

  const columns = [
    "id", "slug", "legal_name", "trading_name", "source_identity", "legal_entity_known",
    "description_lt", "location", "region", "region_label", "category_codes", "category_labels",
    "audience", "website", "public_contact_url", "portfolio_status", "confidence",
    "confidence_evidence", "scope_evidence", "evidence_source_type", "source_urls",
    "source_artifact_url", "source_collection_date", "verification_status",
  ]

  const sqlValue = (value) => {
    if (value === null || value === undefined) return "''"
    if (typeof value === "boolean") return value ? "1" : "0"
    const text = Array.isArray(value) ? JSON.stringify(value) : String(value)
    return "'" + text.replaceAll("'", "''") + "'"
  }

  const stableId = (slug) => {
    let first = 2166136261
    let second = 2246822507
    for (let index = 0; index < slug.length; index++) {
      const code = slug.charCodeAt(index)
      first = Math.imul(first ^ code, 16777619)
      second = Math.imul(second ^ (code + index), 3266489917)
    }
    return "m" + (first >>> 0).toString(36).padStart(7, "0") + (second >>> 0).toString(36).padStart(7, "0")
  }

  const ids = new Set()
  const rows = seed.map((record) => {
    const id = stableId(record.slug)
    if (ids.has(id)) throw new Error("Generated duplicate manufacturer id for slug " + record.slug)
    ids.add(id)

    const values = [
      id,
      record.slug,
      record.legal_name || "",
      record.trading_name,
      record.source_identity,
      record.legal_entity_known,
      record.description_lt || "",
      record.location,
      record.region,
      record.region_label,
      record.category_codes,
      record.category_labels,
      record.audience,
      record.website || "",
      record.public_contact_url || "",
      record.portfolio_status,
      record.confidence,
      record.confidence_evidence,
      record.scope_evidence,
      record.evidence_source_type,
      record.source_urls,
      record.source_artifact_url,
      record.source_collection_date,
      record.verification_status,
    ]
    return "(" + values.map(sqlValue).join(",") + ")"
  })

  // One idempotent bulk statement keeps boot-time work bounded and fills any partial seed.
  const sql = "INSERT INTO manufacturers (" + columns.map((name) => "`" + name + "`").join(",") + ") VALUES " + rows.join(",") + " ON CONFLICT(`slug`) DO NOTHING"
  app.db().newQuery(sql).execute()
}, (app) => {
  // Deliberately non-destructive: persistent production data must survive a down migration.
})
