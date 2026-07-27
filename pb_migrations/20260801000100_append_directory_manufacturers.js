/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const allSeed = require(__hooks + "/../data/manufacturers.json")
  const originalSeedSize = 121
  const appendedSeedSize = 79

  if (!Array.isArray(allSeed) || allSeed.length < originalSeedSize + appendedSeedSize) {
    throw new Error("data/manufacturers.json must retain the 121 original and 79 directory-expansion records")
  }

  // This migration is intentionally pinned to this directory-expansion batch so a
  // future dataset addition receives its own migration rather than being silently
  // inserted by an old migration on a new installation.
  const seed = allSeed.slice(originalSeedSize, originalSeedSize + appendedSeedSize)
  const slugs = new Set()
  for (const record of seed) {
    if (!record.slug || slugs.has(record.slug)) {
      throw new Error("Directory-expansion manufacturers must have unique nonempty slugs")
    }
    slugs.add(record.slug)
  }

  const columns = [
    "id", "slug", "legal_name", "trading_name", "source_identity", "legal_entity_known",
    "description_lt", "location", "city", "region", "region_label", "category_codes", "category_labels",
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
      record.city,
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

  // A single bounded statement is atomic and restart-safe. It never updates or
  // deletes rows, and an existing slug (including a partial prior application) is
  // deliberately left untouched.
  const sql = "INSERT INTO manufacturers (" + columns.map((name) => "`" + name + "`").join(",") + ") VALUES " + rows.join(",") + " ON CONFLICT(`slug`) DO NOTHING"
  app.db().newQuery(sql).execute()
}, (app) => {
  // Deliberately non-destructive: persistent catalogue records survive rollback.
})
