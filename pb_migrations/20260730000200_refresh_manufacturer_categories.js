/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const seed = require(__hooks + "/../data/manufacturers.json")
  const categoryLabels = {
    K: "Virtuvės baldai",
    W: "Spintos ir įmontuojami baldai",
    BB: "Miegamojo ir vonios baldai",
    OC: "Biuro ir komerciniai baldai",
    HR: "HoReCa ir prekybos baldai",
    U: "Minkšti baldai pagal užsakymą",
    SW: "Medžio darbai ir medžio masyvo baldai",
    MM: "Metalo ir mišrių medžiagų baldai",
    O: "Kiti nestandartiniai baldai",
  }
  const validCodes = new Set(Object.keys(categoryLabels))

  if (!Array.isArray(seed) || seed.length < 121) {
    throw new Error("data/manufacturers.json must retain at least the original 121 manufacturer records")
  }

  const slugs = new Set()
  for (const record of seed) {
    if (!record.slug || slugs.has(record.slug)) {
      throw new Error("Every manufacturer must have a unique nonempty slug")
    }
    if (!Array.isArray(record.category_codes) || record.category_codes.length === 0) {
      throw new Error("Manufacturer " + record.slug + " must have at least one category code")
    }
    if (new Set(record.category_codes).size !== record.category_codes.length || record.category_codes.some((code) => !validCodes.has(code))) {
      throw new Error("Manufacturer " + record.slug + " has invalid category codes")
    }
    if (!Array.isArray(record.category_labels) || record.category_labels.length !== record.category_codes.length || record.category_codes.some((code, index) => record.category_labels[index] !== categoryLabels[code])) {
      throw new Error("Manufacturer " + record.slug + " must have labels matching category codes")
    }
    if (typeof record.scope_evidence !== "string" || typeof record.confidence_evidence !== "string" || !record.confidence_evidence.trim() || !Array.isArray(record.source_urls) || !record.source_urls.some((url) => record.scope_evidence.includes(url))) {
      throw new Error("Manufacturer " + record.slug + " category evidence must cite a source URL in scope evidence and retain confidence evidence")
    }
    slugs.add(record.slug)
  }
  if (slugs.size !== seed.length) {
    throw new Error("data/manufacturers.json must contain only unique manufacturer slugs")
  }

  const sqlValue = (value) => {
    const text = Array.isArray(value) ? JSON.stringify(value) : String(value)
    return "'" + text.replaceAll("'", "''") + "'"
  }
  const caseFor = (field) => seed
    .map((record) => "WHEN " + sqlValue(record.slug) + " THEN " + sqlValue(record[field]))
    .join(" ")
  const slugList = seed.map((record) => sqlValue(record.slug)).join(",")

  // This single, bounded update is restart-safe: repeating it sets the same four values
  // for the versioned slugs and cannot alter any other manufacturer columns or records.
  const sql = "UPDATE `manufacturers` SET " +
    "`category_codes` = CASE `slug` " + caseFor("category_codes") + " ELSE `category_codes` END, " +
    "`category_labels` = CASE `slug` " + caseFor("category_labels") + " ELSE `category_labels` END, " +
    "`scope_evidence` = CASE `slug` " + caseFor("scope_evidence") + " ELSE `scope_evidence` END, " +
    "`confidence_evidence` = CASE `slug` " + caseFor("confidence_evidence") + " ELSE `confidence_evidence` END " +
    "WHERE `slug` IN (" + slugList + ")"

  app.db().newQuery(sql).execute()
}, (app) => {
  // Deliberately non-destructive: a rollback does not erase persistent catalogue data.
})
