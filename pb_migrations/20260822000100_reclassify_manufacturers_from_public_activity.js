/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const manifest = require(__hooks + "/../data/category_reclass_20260806.json")
  const checkedDate = "2026-08-06"
  const expectedTargetCount = 238
  const fallbackCode = "O"
  const fallbackLabel = "Kiti nestandartiniai baldai"
  const labels = {
    K: "Virtuvės baldai", W: "Spintos ir įmontuojami baldai",
    BB: "Miegamojo ir vonios baldai", OC: "Biuro ir komerciniai baldai",
    HR: "HoReCa ir prekybos baldai", U: "Minkšti baldai pagal užsakymą",
    SW: "Medžio darbai ir medžio masyvo baldai",
    MM: "Metalo ir mišrių medžiagų baldai", O: fallbackLabel,
  }
  const expectedCounts = {
    target_records: 238, exact_code_matched_pages: 222, reclassified: 8,
    unchanged_checked: 230, fallback_after_migration: 230,
  }
  const expectedByCategory = { HR: 2, K: 1, O: 230, OC: 4, SW: 2, W: 3 }
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  const companyCodePattern = /^\d{7,12}$/
  const publicCompanyPage = (url) => typeof url === "string" && /^https:\/\/rekvizitai\.vz\.lt\/en\/company\/[a-z0-9_-]+\/$/i.test(url)
  const validText = (value, maximum) => typeof value === "string" && value.trim() && value.length <= maximum

  // The checkpoint is a complete, immutable snapshot of the exact fallback pair.
  // Reject partial exports or category substitutions before generating any SQL.
  if (!manifest || manifest.manifest_version !== 1 || typeof manifest.research_method !== "string" || !manifest.research_method.trim() ||
      !manifest.baseline || manifest.baseline.target_count !== expectedTargetCount || manifest.baseline.checked_date !== checkedDate ||
      !manifest.counts || !manifest.results || Array.isArray(manifest.results) || typeof manifest.results !== "object") {
    throw new Error("category reclassification requires the complete 2026-08-06 238-record checkpoint")
  }
  for (const [name, value] of Object.entries(expectedCounts)) {
    if (manifest.counts[name] !== value) throw new Error("category checkpoint has invalid " + name + " count")
  }
  if (JSON.stringify(manifest.counts.by_category) !== JSON.stringify(expectedByCategory) || Object.keys(manifest.results).length !== expectedTargetCount) {
    throw new Error("category checkpoint has invalid category totals or result count")
  }

  const seen = new Set()
  const rows = []
  const counted = { exact: 0, changed: 0, unchanged: 0 }
  const categories = {}
  for (const [slug, result] of Object.entries(manifest.results)) {
    if (!result || result.slug !== slug || !slugPattern.test(slug) || seen.has(slug) || !companyCodePattern.test(result.company_code || "") ||
        result.checked_date !== checkedDate || !Array.isArray(result.checked_candidate_urls) || result.checked_candidate_urls.length === 0 ||
        !Array.isArray(result.candidate_checks) || !result.candidate_checks.length || !["exact_code_matched", "no_exact_company_code_match"].includes(result.source_check_status) ||
        !Array.isArray(result.category_codes) || !result.category_codes.length || !Array.isArray(result.category_labels) ||
        result.category_codes.length !== result.category_labels.length || !validText(result.scope_evidence, 2000) ||
        !["aukštas", "vidutinis"].includes(result.confidence) || !validText(result.confidence_evidence, 2400)) {
      throw new Error("category checkpoint has invalid research metadata for " + slug)
    }
    seen.add(slug)
    if (result.checked_candidate_urls.some((url) => !publicCompanyPage(url)) || result.candidate_checks.some((check) => !check ||
        !publicCompanyPage(check.url) || !publicCompanyPage(check.effective_url) ||
        !(check.http_status === null || (Number.isInteger(check.http_status) && check.http_status >= 100 && check.http_status <= 599)) ||
        typeof check.exact_company_code_match !== "boolean")) {
      throw new Error("category checkpoint has invalid candidate evidence for " + slug)
    }
    const exactCheck = result.candidate_checks.find((check) => check.exact_company_code_match &&
      (check.url === result.accepted_source_url || check.effective_url === result.accepted_source_url))
    const exact = Boolean(exactCheck)
    if ((result.source_check_status === "exact_code_matched") !== exact || (exact && !publicCompanyPage(result.accepted_source_url)) ||
        (!exact && result.accepted_source_url !== null)) {
      throw new Error("category checkpoint has inconsistent code-match state for " + slug)
    }
    if (exact) counted.exact++
    for (const [index, code] of result.category_codes.entries()) {
      if (!labels[code] || result.category_labels[index] !== labels[code]) throw new Error("category checkpoint has an invalid category pair for " + slug)
      categories[code] = (categories[code] || 0) + 1
    }
    const changed = !(result.category_codes.length === 1 && result.category_codes[0] === fallbackCode)
    if (changed) {
      if (!exact || !validText(result.activity_evidence, 900) || !result.scope_evidence.includes(result.activity_evidence) ||
          !result.scope_evidence.includes(result.accepted_source_url) || result.public_details_source_url_to_append !== result.accepted_source_url) {
        throw new Error("category checkpoint has unsupported reclassification for " + slug)
      }
      counted.changed++
    } else {
      if (result.public_details_source_url_to_append !== null || !result.scope_evidence.includes(checkedDate)) {
        throw new Error("category checkpoint has an invalid unchanged fallback audit for " + slug)
      }
      counted.unchanged++
    }
    rows.push({
      slug, company_code: result.company_code, changed: changed ? 1 : 0,
      category_codes: JSON.stringify(result.category_codes), category_labels: JSON.stringify(result.category_labels),
      scope_evidence: result.scope_evidence, confidence: result.confidence,
      confidence_evidence: result.confidence_evidence, source_url: changed ? result.accepted_source_url : null,
    })
  }
  if (seen.size !== expectedTargetCount || counted.exact !== expectedCounts.exact_code_matched_pages ||
      counted.changed !== expectedCounts.reclassified || counted.unchanged !== expectedCounts.unchanged_checked ||
      Object.keys(categories).length !== Object.keys(expectedByCategory).length ||
      Object.entries(expectedByCategory).some(([code, count]) => categories[code] !== count)) {
    throw new Error("category checkpoint totals do not match its per-record evidence")
  }

  const collection = app.findCollectionByNameOrId("manufacturers")
  const requiredFields = {
    slug: "text", company_code: "text", category_codes: "select", category_labels: "json",
    scope_evidence: "text", confidence: "select", confidence_evidence: "text",
    evidence_source_type: "text", source_urls: "json", public_details_source_urls: "json",
  }
  for (const [name, type] of Object.entries(requiredFields)) {
    const field = collection.fields.getByName(name)
    if (!field || field.type() !== type) throw new Error("manufacturers." + name + " must be a " + type + " field")
  }
  if (collection.fields.getByName("category_codes").maxSelect < 8 || !Object.keys(labels).every((code) => collection.fields.getByName("category_codes").values.includes(code))) {
    throw new Error("manufacturers.category_codes must retain the complete taxonomy")
  }

  const sqlValue = (value) => {
    if (value === null || value === undefined) return "NULL"
    if (typeof value === "number") return String(value)
    return "'" + String(value).replaceAll("'", "''") + "'"
  }
  const values = rows.map((row) => "(" + [
    row.slug, row.company_code, row.changed, row.category_codes, row.category_labels,
    row.scope_evidence, row.confidence, row.confidence_evidence, row.source_url,
  ].map(sqlValue).join(", ") + ")").join(", ")
  const source = (column) => "(SELECT `" + column + "` FROM `source` WHERE `source`.`slug` = `manufacturers`.`slug` LIMIT 1)"
  const currentFallback = "json_valid(`category_codes`) = 1 AND json_type(`category_codes`) = 'array' AND " +
    "(SELECT count(*) FROM json_each(`category_codes`)) = 1 AND EXISTS (SELECT 1 FROM json_each(`category_codes`) WHERE value = 'O') AND " +
    "json_valid(`category_labels`) = 1 AND json_type(`category_labels`) = 'array' AND " +
    "(SELECT count(*) FROM json_each(`category_labels`)) = 1 AND EXISTS (SELECT 1 FROM json_each(`category_labels`) WHERE value = " + sqlValue(fallbackLabel) + ")"
  const codeMatches = "`company_code` = " + source("company_code")
  const sourceUrl = source("source_url")
  const mergeUrl = (column) => {
    const current = "`" + column + "`"
    return "CASE WHEN " + current + " IS NULL OR trim(" + current + ") IN ('', '[]', 'null') THEN json_array(" + sourceUrl + ") " +
      "WHEN json_valid(" + current + ") = 1 AND json_type(" + current + ") = 'array' THEN CASE " +
      "WHEN EXISTS (SELECT 1 FROM json_each(" + current + ") WHERE value = " + sourceUrl + ") THEN " + current +
      " ELSE json_insert(" + current + ", '$[#]', " + sourceUrl + ") END ELSE " + current + " END"
  }
  const checkedScope = source("scope_evidence")
  const appendedCheckedScope = "CASE WHEN instr(COALESCE(`scope_evidence`, ''), " + checkedScope + ") > 0 THEN `scope_evidence` " +
    "WHEN length(COALESCE(`scope_evidence`, '')) + length(" + checkedScope + ") + 2 <= 2000 THEN rtrim(COALESCE(`scope_evidence`, '')) || char(10) || char(10) || " + checkedScope +
    " ELSE substr(COALESCE(`scope_evidence`, ''), 1, 2000 - length(" + checkedScope + ") - 2) || char(10) || char(10) || " + checkedScope + " END"

  // Exactly one slug-keyed, bounded bulk update. Reclassifications can affect
  // only the captured pair and still require the company code to match. Checked
  // O records retain their category but gain a dated source-check note; reruns
  // detect the exact note and do not append it twice.
  app.db().newQuery(
    "WITH `source` (`slug`, `company_code`, `changed`, `category_codes`, `category_labels`, `scope_evidence`, `confidence`, `confidence_evidence`, `source_url`) AS (VALUES " + values + ") " +
    "UPDATE `manufacturers` SET " +
      "`category_codes` = CASE WHEN " + source("changed") + " = 1 AND " + codeMatches + " THEN " + source("category_codes") + " ELSE `category_codes` END, " +
      "`category_labels` = CASE WHEN " + source("changed") + " = 1 AND " + codeMatches + " THEN " + source("category_labels") + " ELSE `category_labels` END, " +
      "`scope_evidence` = CASE WHEN " + source("changed") + " = 1 AND " + codeMatches + " THEN " + checkedScope + " ELSE " + appendedCheckedScope + " END, " +
      "`confidence` = CASE WHEN " + source("changed") + " = 1 AND " + codeMatches + " THEN " + source("confidence") + " ELSE `confidence` END, " +
      "`confidence_evidence` = CASE WHEN " + source("changed") + " = 1 AND " + codeMatches + " THEN " + source("confidence_evidence") + " ELSE `confidence_evidence` END, " +
      "`evidence_source_type` = CASE WHEN " + source("changed") + " = 1 AND " + codeMatches + " THEN 'Rekvizitai, registracijos kodu patikrintas viešas puslapis' ELSE `evidence_source_type` END, " +
      "`source_urls` = CASE WHEN " + source("changed") + " = 1 AND " + codeMatches + " THEN " + mergeUrl("source_urls") + " ELSE `source_urls` END, " +
      "`public_details_source_urls` = CASE WHEN " + source("changed") + " = 1 AND " + codeMatches + " THEN " + mergeUrl("public_details_source_urls") + " ELSE `public_details_source_urls` END " +
    "WHERE `slug` IN (SELECT `slug` FROM `source`) AND " + currentFallback
  ).execute()
}, (app) => {
  // Deliberately non-destructive: evidence, checked-source notes, and categories survive rollback.
})
