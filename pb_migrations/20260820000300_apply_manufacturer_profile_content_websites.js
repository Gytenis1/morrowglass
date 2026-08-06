/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const manifest = require(__hooks + "/../data/profile_content_websites_20260806.json")
  const expectedCount = 95
  const expectedEvidenceCount = 3
  const checkedDate = "2026-08-06"
  const targetLabel = "Kiti nestandartiniai baldai"
  const expectedFilter = "category_labels exactly [\"Kiti nestandartiniai baldai\"] and website is non-empty"
  const expectedApiFilter = "category_labels~\"Kiti nestandartiniai baldai\""
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
  const validUrlArray = (urls) => Array.isArray(urls) && urls.every(validUrl)
  const wordCount = (value) => typeof value === "string" ? value.trim().split(/\s+/).filter(Boolean).length : 0

  // The manifest is an immutable audit of the exact fallback cohort. Validate the
  // cohort and its accounting before changing any profile, so a partial or altered
  // export cannot classify a different set of manufacturers.
  if (!manifest || manifest.manifest_version !== 1 || typeof manifest.research_method !== "string" || !manifest.research_method.trim() ||
      !manifest.baseline || manifest.baseline.target_count !== expectedCount || manifest.baseline.checked_date !== checkedDate ||
      manifest.baseline.filter !== expectedFilter || manifest.baseline.api_filter !== expectedApiFilter ||
      !manifest.counts || manifest.counts.total !== expectedCount || manifest.counts.evidence_backed !== expectedEvidenceCount ||
      manifest.counts.no_specifics !== expectedCount - expectedEvidenceCount || !Array.isArray(manifest.results) || manifest.results.length !== expectedCount) {
    throw new Error("manufacturer website profile content requires the complete 2026-08-06 95-record manifest")
  }

  const seen = new Set()
  const evidenceRows = []
  let noSpecifics = 0
  for (const result of manifest.results) {
    if (!result || !slugPattern.test(result.slug || "") || seen.has(result.slug) ||
        typeof result.legal_name !== "string" || typeof result.company_code !== "string" || !/^\d{7,12}$/.test(result.company_code) ||
        result.checked_date !== checkedDate || !validUrl(result.source_url) || !validUrlArray(result.checked_source_urls) ||
        !Array.isArray(result.crawled_pages) || result.crawled_pages.some((page) => !page || !validUrl(page.requested_url) || !validUrl(page.final_url) || typeof page.status !== "number") ||
        typeof result.evidence !== "string" || !result.evidence.trim() || !["evidence_backed", "no_specifics"].includes(result.status) ||
        !Array.isArray(result.category_codes) || result.category_codes.length === 0 ||
        !Array.isArray(result.category_labels) || result.category_labels.length !== result.category_codes.length ||
        result.category_codes.some((code, index) => !categoryLabels[code] || result.category_labels[index] !== categoryLabels[code])) {
      throw new Error("manufacturer website profile content has invalid research metadata")
    }
    seen.add(result.slug)

    if (result.status === "no_specifics") {
      if (result.category_codes.length !== 1 || result.category_codes[0] !== "O" ||
          result.category_labels.length !== 1 || result.category_labels[0] !== targetLabel ||
          result.description_lt !== null || result.scope_evidence !== null ||
          !result.provenance_updates || !Array.isArray(result.provenance_updates.source_urls) || result.provenance_updates.source_urls.length !== 0 ||
          !Array.isArray(result.provenance_updates.public_details_source_urls) || result.provenance_updates.public_details_source_urls.length !== 0) {
        throw new Error("manufacturer website profile content has an invalid no_specifics result for " + result.slug)
      }
      noSpecifics++
      continue
    }

    if (result.source_type !== "official_website" || !Array.isArray(result.product_service_evidence) || result.product_service_evidence.length === 0 ||
        result.product_service_evidence.some((item) => typeof item !== "string" || !item.trim()) || wordCount(result.description_lt) < 40 ||
        typeof result.scope_evidence !== "string" || !result.scope_evidence.endsWith(result.source_url) ||
        !["aukštas", "vidutinis"].includes(result.confidence) || typeof result.confidence_evidence !== "string" || !result.confidence_evidence.trim() ||
        !result.provenance_updates || !validUrlArray(result.provenance_updates.source_urls) || !validUrlArray(result.provenance_updates.public_details_source_urls) ||
        !result.provenance_updates.source_urls.includes(result.source_url) || !result.provenance_updates.public_details_source_urls.includes(result.source_url)) {
      throw new Error("manufacturer website profile content has an invalid evidence-backed result for " + result.slug)
    }
    evidenceRows.push(result)
  }

  const descriptions40 = evidenceRows.filter((result) => wordCount(result.description_lt) >= 40).length
  const reclassified = evidenceRows.filter((result) => result.category_codes.length !== 1 || result.category_codes[0] !== "O").length
  if (seen.size !== expectedCount || evidenceRows.length !== expectedEvidenceCount || noSpecifics !== expectedCount - expectedEvidenceCount ||
      manifest.counts.descriptions_40_words_or_more !== descriptions40 || manifest.counts.reclassified_away_from_O !== reclassified ||
      manifest.counts.fallback_after_migration !== expectedCount - reclassified) {
    throw new Error("manufacturer website profile content manifest counts do not match results")
  }

  const collection = app.findCollectionByNameOrId("manufacturers")
  const requiredFields = {
    slug: "text", description_lt: "text", category_codes: "select", category_labels: "json",
    scope_evidence: "text", confidence: "select", confidence_evidence: "text", evidence_source_type: "text",
    source_urls: "json", public_details_source_urls: "json", source_collection_date: "text",
  }
  for (const [name, type] of Object.entries(requiredFields)) {
    const field = collection.fields.getByName(name)
    if (!field || field.type() !== type) throw new Error("manufacturers." + name + " must be a " + type + " field")
  }

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
    "json_valid(`category_labels`) = 1 AND json_type(`category_labels`) = 'array' AND " +
    "(SELECT count(*) FROM json_each(`category_labels`)) = 1 AND EXISTS (SELECT 1 FROM json_each(`category_labels`) WHERE value = " + sqlValue(targetLabel) + ")"

  // One bounded, slug-keyed statement updates only the three owned-site evidence
  // rows. The exact fallback predicate makes retries safe: records already enriched
  // here, or changed by newer work, are skipped. Valid provenance arrays gain the
  // direct evidence URL once; malformed retained values are never overwritten.
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
  // Deliberately non-destructive: sourced profile content and provenance survive rollback.
})
