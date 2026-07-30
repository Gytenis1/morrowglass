/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  // This batch is deliberately separate from the fixed 200-record legacy seed.
  // It inserts only previously absent slugs, so it never overwrites cataloguing or
  // operator-enriched fields on either legacy or partially seeded records.
  const seed = require(__hooks + "/../data/regional_manufacturers_20260809.json")
  // The static source now contains all 315 records; this historic migration still
  // owns only the 115-record regional batch on a fresh database.
  const allSeed = require(__hooks + "/../data/manufacturers.json")
  const legacySeed = Array.isArray(allSeed) ? allSeed.slice(0, 200) : allSeed
  const categoryLabels = {
    K: "Virtuvės baldai",
    W: "Spintos ir įmontuojami baldai",
    BB: "Miegamojo ir vonios baldai",
    OC: "Biuro ir komerciniai baldai",
    HR: "Horeca ir viešosios erdvės",
    U: "Utility",
    SW: "Medžio darbai ir laiptai",
    MM: "Kiti baldai",
  }
  const regions = {
    "vilnius-east-south": "Vilnius, rytų ir pietų Lietuva",
    "kaunas-north": "Kaunas ir šiaurės Lietuva",
    "klaipeda-panevezys-west-central": "Klaipėda, Panevėžys, vakarų ir centrinė Lietuva",
  }
  const requiredFields = [
    "slug", "trading_name", "source_identity", "description_lt", "location", "city",
    "region", "region_label", "category_codes", "category_labels", "audience",
    "portfolio_status", "confidence", "confidence_evidence", "scope_evidence",
    "evidence_source_type", "source_urls", "source_artifact_url", "source_collection_date",
    "verification_status",
  ]

  if (!Array.isArray(allSeed) || allSeed.length !== 315 || !Array.isArray(legacySeed) || legacySeed.length !== 200) {
    throw new Error("data/manufacturers.json must retain the 200 legacy and 115 regional manufacturer records")
  }
  if (!Array.isArray(seed) || seed.length !== 115) {
    throw new Error("regional manufacturer batch must contain exactly 115 records")
  }

  const legacySlugs = new Set()
  for (const record of legacySeed) {
    if (!record || !record.slug || legacySlugs.has(record.slug)) throw new Error("legacy manufacturer seed must have unique slugs")
    legacySlugs.add(record.slug)
  }

  const slugs = new Set()
  for (const record of seed) {
    if (!record || typeof record !== "object") throw new Error("regional manufacturer record must be an object")
    for (const field of requiredFields) {
      if (record[field] === undefined || record[field] === null || record[field] === "") {
        throw new Error("regional manufacturer " + (record.slug || "without slug") + " is missing " + field)
      }
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.slug)) throw new Error("invalid regional manufacturer slug " + record.slug)
    if (slugs.has(record.slug) || legacySlugs.has(record.slug)) throw new Error("regional manufacturer slug conflicts with an existing seed " + record.slug)
    slugs.add(record.slug)
    if (record.legal_name !== undefined && typeof record.legal_name !== "string") throw new Error("invalid legal_name for " + record.slug)
    if (typeof record.legal_entity_known !== "boolean") throw new Error("invalid legal_entity_known for " + record.slug)
    if (record.legal_entity_known && !record.legal_name) throw new Error("known legal entity requires legal_name for " + record.slug)
    if (!regions[record.region] || record.region_label !== regions[record.region]) throw new Error("invalid region for " + record.slug)
    if (!Array.isArray(record.category_codes) || !Array.isArray(record.category_labels) || record.category_codes.length === 0 || record.category_codes.length !== record.category_labels.length) {
      throw new Error("invalid categories for " + record.slug)
    }
    const recordCodes = new Set()
    for (let index = 0; index < record.category_codes.length; index++) {
      const code = record.category_codes[index]
      if (!categoryLabels[code] || recordCodes.has(code) || record.category_labels[index] !== categoryLabels[code]) {
        throw new Error("invalid category mapping for " + record.slug)
      }
      recordCodes.add(code)
    }
    if (record.audience !== "buitiniai" && record.audience !== "verslas" && record.audience !== "abiem") throw new Error("invalid audience for " + record.slug)
    if (record.portfolio_status !== "yra" && record.portfolio_status !== "nežinoma") throw new Error("invalid portfolio status for " + record.slug)
    if (record.confidence !== "aukštas" && record.confidence !== "vidutinis") throw new Error("invalid confidence for " + record.slug)
    if (record.verification_status !== "nepatvirtinta" || record.source_collection_date !== "2026-07-30") throw new Error("invalid collection metadata for " + record.slug)
    if (!Array.isArray(record.source_urls) || record.source_urls.length === 0 || record.source_urls.some((url) => typeof url !== "string" || !/^https:\/\/[^\s]+$/i.test(url))) {
      throw new Error("regional manufacturer requires HTTPS source URLs for " + record.slug)
    }
    if (!/^https:\/\/[^\s]+$/i.test(record.source_artifact_url)) throw new Error("regional manufacturer requires an HTTPS source artifact URL for " + record.slug)
  }

  const columns = [
    "id", "slug", "legal_name", "trading_name", "source_identity", "legal_entity_known",
    "description_lt", "location", "city", "region", "region_label", "category_codes",
    "category_labels", "audience", "website", "public_contact_url", "portfolio_status",
    "confidence", "confidence_evidence", "scope_evidence", "evidence_source_type",
    "source_urls", "source_artifact_url", "source_collection_date", "verification_status",
  ]
  const sqlValue = (value) => {
    if (value === null || value === undefined) return "''"
    if (typeof value === "boolean") return value ? "1" : "0"
    const text = Array.isArray(value) ? JSON.stringify(value) : String(value)
    return "'" + text.replaceAll("'", "''") + "'"
  }
  // Deterministic PocketBase-compatible IDs make a failed boot safe to retry.
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
    if (ids.has(id)) throw new Error("generated duplicate manufacturer id for " + record.slug)
    ids.add(id)
    return "(" + [
      id, record.slug, record.legal_name || "", record.trading_name, record.source_identity,
      record.legal_entity_known, record.description_lt, record.location, record.city,
      record.region, record.region_label, record.category_codes, record.category_labels,
      record.audience, record.website || "", record.public_contact_url || "", record.portfolio_status,
      record.confidence, record.confidence_evidence, record.scope_evidence, record.evidence_source_type,
      record.source_urls, record.source_artifact_url, record.source_collection_date, record.verification_status,
    ].map(sqlValue).join(",") + ")"
  })

  // One bounded atomic insert is fast and restart-safe. A matching slug is deliberately
  // left untouched, including any manually enriched fields added after a partial run.
  const sql = "INSERT INTO `manufacturers` (" + columns.map((name) => "`" + name + "`").join(",") + ") VALUES " + rows.join(",") + " ON CONFLICT(`slug`) DO NOTHING"
  app.db().newQuery(sql).execute()
}, (app) => {
  // Deliberately non-destructive: catalogue records survive rollback.
})
