/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const manifest = require(__hooks + "/../data/profile_content_20260806.json")
  const expectedCount = 242
  const checkedDate = "2026-08-06"
  const targetLabel = "Kiti nestandartiniai baldai"
  const categoryLabels = {
    K: "Virtuvės baldai",
    W: "Spintos ir įmontuojami baldai",
    BB: "Miegamojo ir vonios baldai",
    OC: "Biuro ir komerciniai baldai",
    HR: "HoReCa ir prekybos baldai",
    U: "Minkšti baldai pagal užsakymą",
    SW: "Medžio darbai ir medžio masyvo baldai",
    MM: "Metalo ir mišrių medžiagų baldai",
    O: targetLabel,
  }
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  const validUrl = (url) => typeof url === "string" && /^https?:\/\/[^\s]+$/i.test(url)
  const wordCount = (value) => typeof value === "string" ? value.trim().split(/\s+/).filter(Boolean).length : 0

  // Validate the complete audited cohort before updating a single record. This
  // migration intentionally accepts a defensible partial pass: its count fields must
  // be mathematically exact, rather than allowing an unsupported profile merely to
  // meet a target number.
  if (!manifest || manifest.manifest_version !== 1 || typeof manifest.research_method !== "string" ||
      !manifest.baseline || manifest.baseline.target_count !== expectedCount || manifest.baseline.checked_date !== checkedDate ||
      !manifest.counts || manifest.counts.total !== expectedCount || !Array.isArray(manifest.results) || manifest.results.length !== expectedCount) {
    throw new Error("manufacturer profile content requires the complete 2026-08-06 242-record manifest")
  }

  const seen = new Set()
  const evidenceRows = []
  let noSpecifics = 0
  for (const result of manifest.results) {
    if (!result || !slugPattern.test(result.slug || "") || seen.has(result.slug) ||
        typeof result.legal_name !== "string" || typeof result.company_code !== "string" || result.checked_date !== checkedDate ||
        !validUrl(result.source_url) || typeof result.evidence !== "string" || !result.evidence.trim() ||
        !Array.isArray(result.checked_source_urls) || !result.checked_source_urls.every(validUrl) ||
        !["evidence_backed", "no_specifics"].includes(result.status)) {
      throw new Error("manufacturer profile content has invalid research metadata")
    }
    seen.add(result.slug)
    if (result.status === "no_specifics") {
      if (!Array.isArray(result.category_codes) || result.category_codes.length !== 1 || result.category_codes[0] !== "O" ||
          !Array.isArray(result.category_labels) || result.category_labels.length !== 1 || result.category_labels[0] !== targetLabel ||
          result.description_lt !== null || result.scope_evidence !== null ||
          !result.provenance_updates || !Array.isArray(result.provenance_updates.source_urls) || result.provenance_updates.source_urls.length !== 0 ||
          !Array.isArray(result.provenance_updates.public_details_source_urls) || result.provenance_updates.public_details_source_urls.length !== 0) {
        throw new Error("manufacturer profile content has an invalid no_specifics result for " + result.slug)
      }
      noSpecifics++
      continue
    }
    if (!Array.isArray(result.product_service_evidence) || result.product_service_evidence.length === 0 ||
        result.product_service_evidence.some((item) => typeof item !== "string" || !item.trim()) ||
        wordCount(result.description_lt) < 40 || typeof result.scope_evidence !== "string" || !result.scope_evidence.endsWith(result.source_url) ||
        !["official_website", "public_business_page", "social_business_page"].includes(result.source_type) ||
        !["aukštas", "vidutinis"].includes(result.confidence) || typeof result.confidence_evidence !== "string" || !result.confidence_evidence.trim() ||
        !Array.isArray(result.category_codes) || result.category_codes.length === 0 ||
        !Array.isArray(result.category_labels) || result.category_labels.length !== result.category_codes.length ||
        result.category_codes.some((code, index) => !categoryLabels[code] || result.category_labels[index] !== categoryLabels[code]) ||
        !result.provenance_updates || !Array.isArray(result.provenance_updates.source_urls) || !Array.isArray(result.provenance_updates.public_details_source_urls) ||
        !result.provenance_updates.source_urls.includes(result.source_url) || !result.provenance_updates.public_details_source_urls.includes(result.source_url)) {
      throw new Error("manufacturer profile content has invalid evidence-backed result for " + result.slug)
    }
    evidenceRows.push(result)
  }
  const descriptions40 = evidenceRows.filter((result) => wordCount(result.description_lt) >= 40).length
  const reclassified = evidenceRows.filter((result) => result.category_codes.length !== 1 || result.category_codes[0] !== "O").length
  if (seen.size !== expectedCount ||
      manifest.counts.evidence_backed !== evidenceRows.length || manifest.counts.no_specifics !== noSpecifics ||
      manifest.counts.descriptions_40_words_or_more !== descriptions40 || manifest.counts.reclassified_away_from_O !== reclassified ||
      manifest.counts.fallback_after_migration !== expectedCount - reclassified) {
    throw new Error("manufacturer profile content manifest counts do not match results")
  }

  const collection = app.findCollectionByNameOrId("manufacturers")
  const requiredFields = {
    slug: "text", description_lt: "text", category_codes: "select", category_labels: "json",
    scope_evidence: "text", confidence: "select", confidence_evidence: "text", evidence_source_type: "text",
    source_urls: "json", public_details_source_urls: "json", source_collection_date: "text", verification_status: "select",
  }
  for (const [name, type] of Object.entries(requiredFields)) {
    const field = collection.fields.getByName(name)
    if (!field || field.type() !== type) throw new Error("manufacturers." + name + " must be a " + type + " field")
  }

  if (evidenceRows.length === 0) return
  const sqlValue = (value) => "'" + String(value).replaceAll("'", "''") + "'"
  const rows = evidenceRows.map((result) => "(" + [
    result.slug, result.description_lt, JSON.stringify(result.category_codes), JSON.stringify(result.category_labels),
    result.scope_evidence, result.confidence, result.confidence_evidence, result.source_type, result.source_url,
  ].map(sqlValue).join(", ") + ")").join(", ")
  const source = (column) => "(SELECT `" + column + "` FROM `source` WHERE `source`.`slug` = `manufacturers`.`slug` LIMIT 1)"
  const sourceUrl = source("source_url")
  const mergeSource = (column) => {
    const current = "`" + column + "`"
    return "CASE " +
      "WHEN " + current + " IS NULL OR trim(" + current + ") IN ('', '[]', 'null') THEN json_array(" + sourceUrl + ") " +
      "WHEN json_valid(" + current + ") = 1 AND json_type(" + current + ") = 'array' THEN CASE " +
        "WHEN EXISTS (SELECT 1 FROM json_each(" + current + ") WHERE value = " + sourceUrl + ") THEN " + current +
        " ELSE json_insert(" + current + ", '$[#]', " + sourceUrl + ") END " +
      "ELSE " + current + " END"
  }
  const isCurrentFallback = "json_valid(`category_codes`) = 1 AND json_type(`category_codes`) = 'array' AND " +
    "(SELECT count(*) FROM json_each(`category_codes`)) = 1 AND EXISTS (SELECT 1 FROM json_each(`category_codes`) WHERE value = 'O') AND " +
    "json_valid(`category_labels`) = 1 AND json_type(`category_labels`) = 'array' AND EXISTS (SELECT 1 FROM json_each(`category_labels`) WHERE value = " + sqlValue(targetLabel) + ")"

  // One bounded slug-keyed bulk update. The O-fallback predicate means a retry after
  // an interrupted run leaves already-updated profiles intact; JSON provenance is
  // appended only when absent, while malformed pre-existing provenance is preserved.
  app.db().newQuery(
    "WITH `source` (`slug`, `description_lt`, `category_codes`, `category_labels`, `scope_evidence`, `confidence`, `confidence_evidence`, `evidence_source_type`, `source_url`) AS (VALUES " + rows + ") " +
    "UPDATE `manufacturers` SET " +
      "`description_lt` = " + source("description_lt") + ", " +
      "`category_codes` = " + source("category_codes") + ", " +
      "`category_labels` = " + source("category_labels") + ", " +
      "`scope_evidence` = " + source("scope_evidence") + ", " +
      "`confidence` = " + source("confidence") + ", " +
      "`confidence_evidence` = " + source("confidence_evidence") + ", " +
      "`evidence_source_type` = " + source("evidence_source_type") + ", " +
      "`source_urls` = " + mergeSource("source_urls") + ", " +
      "`public_details_source_urls` = " + mergeSource("public_details_source_urls") + ", " +
      "`source_collection_date` = CASE WHEN `source_collection_date` IS NULL OR trim(`source_collection_date`) = '' THEN " + sqlValue(checkedDate) + " ELSE `source_collection_date` END " +
    "WHERE `slug` IN (SELECT `slug` FROM `source`) AND " + isCurrentFallback
  ).execute()
}, (app) => {
  // Deliberately non-destructive: sourced profile text, classifications, and merged
  // provenance survive rollback rather than reverting records to generic fallbacks.
})
