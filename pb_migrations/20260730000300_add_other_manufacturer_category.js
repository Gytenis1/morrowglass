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
  const validCodes = Object.keys(categoryLabels)

  if (!Array.isArray(seed) || seed.length < 121) {
    throw new Error("data/manufacturers.json must retain at least the original 121 manufacturer records")
  }

  // Preserve this migration's historic, 121-record O fallback set. Newer records
  // are validated and inserted by their own migrations.
  const baselineSeed = seed.slice(0, 121)
  const slugs = new Set()
  const otherFallbackRecords = []
  for (const record of baselineSeed) {
    if (!record.slug || slugs.has(record.slug)) {
      throw new Error("Every manufacturer must have a unique nonempty slug")
    }
    if (!Array.isArray(record.category_codes) || record.category_codes.length === 0 || new Set(record.category_codes).size !== record.category_codes.length || record.category_codes.some((code) => !validCodes.includes(code))) {
      throw new Error("Manufacturer " + record.slug + " has invalid or empty category codes")
    }
    if (!Array.isArray(record.category_labels) || record.category_labels.length !== record.category_codes.length || record.category_codes.some((code, index) => record.category_labels[index] !== categoryLabels[code])) {
      throw new Error("Manufacturer " + record.slug + " must have labels matching category codes")
    }
    if (typeof record.scope_evidence !== "string" || typeof record.confidence_evidence !== "string" || !record.confidence_evidence.trim() || !Array.isArray(record.source_urls) || !record.source_urls.some((url) => record.scope_evidence.includes(url))) {
      throw new Error("Manufacturer " + record.slug + " category evidence must cite a source URL in scope evidence and retain confidence evidence")
    }
    if (record.category_codes.length === 1 && record.category_codes[0] === "O") {
      if (!record.confidence_evidence.includes("O kaip bendroji („kiti“) atsarginė kategorija") || !record.scope_evidence.includes("O priskirta kaip bendroji („kiti“) atsarginė kategorija")) {
        throw new Error("Manufacturer " + record.slug + " must retain the O fallback evidence wording")
      }
      otherFallbackRecords.push(record)
    }
    slugs.add(record.slug)
  }
  if (slugs.size !== baselineSeed.length || otherFallbackRecords.length !== 30) {
    throw new Error("The original manufacturer seed must retain unique slugs and its 30 O fallback records")
  }

  const collection = app.findCollectionByNameOrId("manufacturers")
  const categoryCodes = collection.fields.getByName("category_codes")
  if (!categoryCodes || categoryCodes.type() !== "select") {
    throw new Error("manufacturers.category_codes must be a select field")
  }
  categoryCodes.values = validCodes
  categoryCodes.maxSelect = validCodes.length
  app.save(collection)

  const sqlValue = (value) => {
    const text = Array.isArray(value) ? JSON.stringify(value) : String(value)
    return "'" + text.replaceAll("'", "''") + "'"
  }
  const caseFor = (field) => otherFallbackRecords
    .map((record) => "WHEN " + sqlValue(record.slug) + " THEN " + sqlValue(record[field]))
    .join(" ")
  const slugList = otherFallbackRecords.map((record) => sqlValue(record.slug)).join(",")

  // One bounded, restart-safe update changes only the reclassified records' category and evidence fields.
  const sql = "UPDATE `manufacturers` SET " +
    "`category_codes` = CASE `slug` " + caseFor("category_codes") + " ELSE `category_codes` END, " +
    "`category_labels` = CASE `slug` " + caseFor("category_labels") + " ELSE `category_labels` END, " +
    "`scope_evidence` = CASE `slug` " + caseFor("scope_evidence") + " ELSE `scope_evidence` END, " +
    "`confidence_evidence` = CASE `slug` " + caseFor("confidence_evidence") + " ELSE `confidence_evidence` END " +
    "WHERE `slug` IN (" + slugList + ")"
  app.db().newQuery(sql).execute()
}, (app) => {
  // Deliberately non-destructive: rolling back must not erase persistent catalogue data.
})
