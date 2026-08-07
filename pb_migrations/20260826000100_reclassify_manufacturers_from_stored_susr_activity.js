/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const manifest = require(__hooks + "/../data/category_evrk_20260807.json")
  const checkedDate = "2026-08-07"
  const expectedTargetCount = 245
  const expectedGenericBaseline = 1213
  const fallbackCodes = ["O"]
  const fallbackLabels = ["Kiti nestandartiniai baldai"]
  const expectedActivities = {
    "31.01": {
      wording: "Įstaigos ir prekybos įmonių (parduotuvių) baldų gamyba",
      target_codes: ["OC", "HR"],
      target_labels: ["Biuro ir komerciniai baldai", "HoReCa ir prekybos baldai"],
    },
    "31.02": {
      wording: "Virtuvės baldų gamyba",
      target_codes: ["K"],
      target_labels: ["Virtuvės baldai"],
    },
    "31.03": {
      wording: "Čiužinių gamyba",
      target_codes: ["BB"],
      target_labels: ["Miegamojo ir vonios baldai"],
    },
  }
  const expectedCounts = { "31.01": 108, "31.02": 123, "31.03": 14 }
  const api = "https://sn-pb-repo-1293389879-dc1c2f.fly.dev/api/collections/manufacturers/records"
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  const officialUrlPattern = /^https:\/\/get\.data\.gov\.lt\/datasets\/gov\/lsd\/cl\/ja_asmenys\/JuridinisAsmuo\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
  const equal = (left, right) => JSON.stringify(left) === JSON.stringify(right)
  const exactKeys = (value, keys) => value && typeof value === "object" && !Array.isArray(value) &&
    equal(Object.keys(value).sort(), [...keys].sort())
  const nonemptyText = (value, maximum) => typeof value === "string" && value.trim().length > 0 && value.length <= maximum
  const categoryPair = (codes, labels) => Array.isArray(codes) && Array.isArray(labels) && codes.length > 0 &&
    codes.length === labels.length && new Set(codes).size === codes.length

  // Treat the checkpoint as immutable input, not a list of suggestions. Validation
  // occurs before any SQL is constructed so a partial, stale, or hand-edited file
  // cannot change live categories.
  if (!exactKeys(manifest, ["manifest_version", "checked_date", "research_method", "source", "baseline", "counts", "activities", "results"]) ||
      manifest.manifest_version !== 1 || manifest.checked_date !== checkedDate || !nonemptyText(manifest.research_method, 4000) ||
      !exactKeys(manifest.source, ["public_manufacturers_api", "official_susr_url_pattern", "stored_fields"]) ||
      manifest.source.public_manufacturers_api !== api || typeof manifest.source.official_susr_url_pattern !== "string" ||
      !Array.isArray(manifest.source.stored_fields) ||
      !equal(manifest.source.stored_fields, ["slug", "category_codes", "category_labels", "description_lt", "scope_evidence", "source_urls", "public_details_source_urls"]) ||
      !exactKeys(manifest.baseline, ["prior_category_codes", "prior_category_labels", "generic_fallback_records_scanned", "target_count", "checked_date"]) ||
      !equal(manifest.baseline.prior_category_codes, fallbackCodes) || !equal(manifest.baseline.prior_category_labels, fallbackLabels) ||
      manifest.baseline.generic_fallback_records_scanned !== expectedGenericBaseline || manifest.baseline.target_count !== expectedTargetCount ||
      manifest.baseline.checked_date !== checkedDate || !exactKeys(manifest.counts, ["target_records", "by_activity_code", "generic_category_decrease"]) ||
      manifest.counts.target_records !== expectedTargetCount || manifest.counts.generic_category_decrease !== expectedTargetCount ||
      !equal(manifest.counts.by_activity_code, expectedCounts) || !equal(manifest.activities, expectedActivities) || !Array.isArray(manifest.results) ||
      manifest.results.length !== expectedTargetCount) {
    throw new Error("SŪSR category checkpoint has an invalid schema, baseline, or total")
  }

  const seenSlugs = new Set()
  const actualCounts = { "31.01": 0, "31.02": 0, "31.03": 0 }
  const rows = []
  for (const result of manifest.results) {
    if (!exactKeys(result, ["slug", "checked_date", "prior_category_codes", "prior_category_labels", "activity_code", "activity_wording", "official_susr_record_url", "target_category_codes", "target_category_labels", "description_lt", "scope_evidence"]) ||
        !nonemptyText(result.slug, 180) || !slugPattern.test(result.slug) || seenSlugs.has(result.slug) || result.checked_date !== checkedDate ||
        !equal(result.prior_category_codes, fallbackCodes) || !equal(result.prior_category_labels, fallbackLabels) ||
        !Object.prototype.hasOwnProperty.call(expectedActivities, result.activity_code) || !nonemptyText(result.activity_wording, 900) ||
        !officialUrlPattern.test(result.official_susr_record_url || "") || !categoryPair(result.target_category_codes, result.target_category_labels) ||
        !nonemptyText(result.description_lt, 1200) || !nonemptyText(result.scope_evidence, 2000)) {
      throw new Error("SŪSR category checkpoint has malformed record evidence")
    }
    const activity = expectedActivities[result.activity_code]
    const phrase = result.activity_code + " – " + activity.wording
    if (result.activity_wording !== activity.wording || !equal(result.target_category_codes, activity.target_codes) ||
        !equal(result.target_category_labels, activity.target_labels) || !(result.description_lt.includes(phrase) || result.scope_evidence.includes(phrase)) ||
        !result.scope_evidence.includes(result.official_susr_record_url)) {
      throw new Error("SŪSR category checkpoint has an invalid code/wording/category/source pair for " + result.slug)
    }
    seenSlugs.add(result.slug)
    actualCounts[result.activity_code]++
    const newScope = "SŪSR registre nurodyta pagrindinė veikla: " + phrase + ". Oficialus įrašo URL: " + result.official_susr_record_url
    if (!nonemptyText(newScope, 2000)) throw new Error("SŪSR category evidence is too long for " + result.slug)
    rows.push({
      slug: result.slug,
      activity_phrase: phrase,
      official_url: result.official_susr_record_url,
      category_codes: JSON.stringify(result.target_category_codes),
      category_labels: JSON.stringify(result.target_category_labels),
      scope_evidence: newScope,
    })
  }
  if (seenSlugs.size !== expectedTargetCount || !equal(actualCounts, expectedCounts)) {
    throw new Error("SŪSR category checkpoint has duplicate/overlapping slugs or incorrect per-code totals")
  }

  const collection = app.findCollectionByNameOrId("manufacturers")
  const requiredFields = {
    slug: "text", category_codes: "select", category_labels: "json", description_lt: "text",
    scope_evidence: "text", source_urls: "json", public_details_source_urls: "json",
  }
  for (const [name, type] of Object.entries(requiredFields)) {
    const field = collection.fields.getByName(name)
    if (!field || field.type() !== type) throw new Error("manufacturers." + name + " must be a " + type + " field")
  }
  const categoryCodes = collection.fields.getByName("category_codes")
  const requiredCodes = [...new Set(Object.values(expectedActivities).flatMap((activity) => activity.target_codes).concat(fallbackCodes))]
  if (categoryCodes.maxSelect < 2 || !Array.isArray(categoryCodes.values) || requiredCodes.some((code) => !categoryCodes.values.includes(code))) {
    throw new Error("manufacturers.category_codes does not support the validated category taxonomy")
  }

  const sqlValue = (value) => "'" + String(value).replaceAll("'", "''") + "'"
  const values = rows.map((row) => "(" + [
    row.slug, row.activity_phrase, row.official_url, row.category_codes, row.category_labels, row.scope_evidence,
  ].map(sqlValue).join(", ") + ")").join(", ")
  const source = (column) => "(SELECT `" + column + "` FROM `source` WHERE `source`.`slug` = `manufacturers`.`slug` LIMIT 1)"
  const currentFallback = "json_valid(`category_codes`) = 1 AND json_type(`category_codes`) = 'array' AND " +
    "(SELECT count(*) FROM json_each(`category_codes`)) = 1 AND EXISTS (SELECT 1 FROM json_each(`category_codes`) WHERE value = 'O') AND " +
    "json_valid(`category_labels`) = 1 AND json_type(`category_labels`) = 'array' AND " +
    "(SELECT count(*) FROM json_each(`category_labels`)) = 1 AND EXISTS (SELECT 1 FROM json_each(`category_labels`) WHERE value = " + sqlValue(fallbackLabels[0]) + ")"
  const storedEvidenceMatches = "(instr(COALESCE(`description_lt`, ''), " + source("activity_phrase") + ") > 0 OR " +
    "instr(COALESCE(`scope_evidence`, ''), " + source("activity_phrase") + ") > 0) AND " +
    "instr(COALESCE(`scope_evidence`, ''), " + source("official_url") + ") > 0"
  const mergeOfficialUrl = (column) => {
    const current = "`" + column + "`"
    // Never repair invalid JSON: append only to an absent array or a valid array
    // that does not already contain the validated official URL.
    return "CASE WHEN " + current + " IS NULL OR trim(" + current + ") IN ('', '[]', 'null') THEN json_array(" + source("official_url") + ") " +
      "WHEN json_valid(" + current + ") = 1 AND json_type(" + current + ") = 'array' THEN CASE " +
      "WHEN EXISTS (SELECT 1 FROM json_each(" + current + ") WHERE value = " + source("official_url") + ") THEN " + current +
      " ELSE json_insert(" + current + ", '$[#]', " + source("official_url") + ") END ELSE " + current + " END"
  }

  // One slug-keyed CTE bulk update. Each row must still have the exact O/fallback
  // pair and the captured stored SŪSR phrase and URL; records changed after the
  // checkpoint are skipped. No financial, description, date, or other evidence
  // fields are overwritten.
  app.db().newQuery(
    "WITH `source` (`slug`, `activity_phrase`, `official_url`, `category_codes`, `category_labels`, `scope_evidence`) AS (VALUES " + values + ") " +
    "UPDATE `manufacturers` SET " +
      "`category_codes` = " + source("category_codes") + ", " +
      "`category_labels` = " + source("category_labels") + ", " +
      "`scope_evidence` = " + source("scope_evidence") + ", " +
      "`source_urls` = " + mergeOfficialUrl("source_urls") + ", " +
      "`public_details_source_urls` = " + mergeOfficialUrl("public_details_source_urls") + " " +
    "WHERE `slug` IN (SELECT `slug` FROM `source`) AND " + currentFallback + " AND " + storedEvidenceMatches
  ).execute()
}, (app) => {
  // Deliberately non-destructive: an applied registry-evidence category correction survives rollback.
})
