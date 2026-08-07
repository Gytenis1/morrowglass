/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const manifest = require(__hooks + "/../data/official_websites_20260807.json")
  const expectedCount = 543
  const expectedCorrectionCount = 15
  const checkedDate = "2026-08-07"
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  const validUrl = (url) => typeof url === "string" && /^https?:\/\/[^\s]+$/i.test(url)

  // This migration is intentionally a delta. It validates the complete revised
  // 543-row manifest but applies only the 15 targeted correction results, leaving
  // every prior audit outcome and every non-blank live website untouched.
  if (!manifest || typeof manifest.method !== "string" || !manifest.method ||
      !manifest.baseline || manifest.baseline.target_count !== expectedCount ||
      manifest.baseline.checked_date !== checkedDate ||
      !manifest.counts || manifest.counts.total !== expectedCount ||
      !manifest.correction || manifest.correction.checked_date !== checkedDate ||
      !Array.isArray(manifest.results) || manifest.results.length !== expectedCount) {
    throw new Error("official website correction requires the complete revised 543-record manifest")
  }

  const seen = new Set()
  const corrections = []
  let foundCount = 0
  for (const result of manifest.results) {
    if (!result || !slugPattern.test(result.slug || "") || seen.has(result.slug) ||
        typeof result.legal_name !== "string" || typeof result.trading_name !== "string" ||
        typeof result.company_code !== "string" || typeof result.city !== "string" ||
        result.checked_date !== checkedDate || result.result !== result.status ||
        !["found", "not_found"].includes(result.status) ||
        !Array.isArray(result.checked_sources) || result.checked_sources.length < 2 ||
        !result.checked_sources.every((source) => typeof source === "string" && source) ||
        typeof result.evidence_note !== "string" || !result.evidence_note) {
      throw new Error("official website correction manifest has invalid metadata")
    }
    seen.add(result.slug)
    if (result.status === "found") {
      if (!validUrl(result.website) || !validUrl(result.website_source_url)) {
        throw new Error("official website correction manifest has invalid found URL for " + result.slug)
      }
      foundCount++
    } else if (result.website !== null || result.website_source_url !== null) {
      throw new Error("official website correction manifest has invalid not-found URL for " + result.slug)
    }
    if (Object.prototype.hasOwnProperty.call(result, "identity_evidence")) {
      if (result.status !== "found" || typeof result.identity_evidence !== "string" || !result.identity_evidence ||
          !result.checked_sources.some((source) => source === result.website_source_url)) {
        throw new Error("official website correction has invalid identity evidence for " + result.slug)
      }
      corrections.push(result)
    }
  }
  if (seen.size !== expectedCount || manifest.counts.found !== foundCount ||
      manifest.counts.not_found !== expectedCount - foundCount ||
      corrections.length !== expectedCorrectionCount || foundCount !== 150) {
    throw new Error("official website correction manifest counts do not reconcile")
  }

  const collection = app.findCollectionByNameOrId("manufacturers")
  for (const [name, type] of Object.entries({ slug: "text", website: "url", public_details_source_urls: "json", website_lookup_status: "select", website_checked_date: "text" })) {
    const field = collection.fields.getByName(name)
    if (!field || field.type() !== type) throw new Error("manufacturers." + name + " must be a " + type + " field")
  }

  const rows = [
    "('akcine-bendrove-klaipedos-mediena-240616710', 'https://vmg.eu/', 'https://vmg.eu/en/contacts/company-details/', '2026-08-07')",
    "('rol-lithuania-uab-300503175', 'https://rollithuania.lt/', 'https://rollithuania.lt/contacts/', '2026-08-07')",
    "('uab-balticsofa-121504969', 'https://www.balticsofa.com/', 'https://www.balticsofa.com/privacy-policy/', '2026-08-07')",
    "('uab-pelly-baltic-300513963', 'https://www.pelly.se/', 'https://www.pelly.se/en/about-pelly/', '2026-08-07')",
    "('uab-svenheim-301152003', 'https://svenheim.no/', 'https://svenheim.no/en/about-us/', '2026-08-07')",
    "('itab-lithuania-ab-233393310', 'https://itab.com/', 'https://itab.com/sintek', '2026-08-07')",
    "('uzdaroji-akcine-bendrove-vmg-akmenes-baldai-305610964', 'https://vmg.eu/', 'https://vmg.eu/en/our-history/', '2026-08-07')",
    "('kame-uab-303051031', 'https://kame.lt/', 'https://kame.lt/en/terms-and-conditions/', '2026-08-07')",
    "('uab-erelita-furniture-302556194', 'https://erelita.lt/', 'https://erelita.lt/privacy-policy/', '2026-08-07')",
    "('uzdaroji-akcine-bendrove-vildeta-120213448', 'https://vildeta.lt/lt/', 'https://vildeta.lt/en/contact-us', '2026-08-07')",
    "('uab-pats-sau-baldzius-300632782', 'https://www.baldzius.lt/', 'https://www.baldzius.lt/', '2026-08-07')",
    "('uab-pod-furniture-305671084', 'https://www.podfurniture.lt/', 'https://www.podfurniture.lt/', '2026-08-07')",
    "('uab-superlon-baltic-148441361', 'https://www.superlon.lt/', 'https://www.superlon.lt/', '2026-08-07')",
    "('uab-rieses-baldai-302658982', 'https://riesesbaldai.lt/', 'https://riesesbaldai.lt/kontaktai', '2026-08-07')",
    "('uab-siguldos-baldai-302316701', 'https://www.siguldosbaldai.lt/', 'https://www.siguldosbaldai.lt/apie-mus/', '2026-08-07')"
  ].join(",\n    ")
  const source = (column) => "(SELECT `" + column + "` FROM `source` WHERE `source`.`slug` = `manufacturers`.`slug` LIMIT 1)"
  const blankWebsite = "(`website` IS NULL OR trim(`website`) = '')"
  const sourceUrl = source("website_source_url")
  const existingSources = "`public_details_source_urls`"
  const mergedSources = "CASE " +
    "WHEN " + existingSources + " IS NULL OR trim(" + existingSources + ") IN ('', '[]', 'null') THEN json_array(" + sourceUrl + ") " +
    "WHEN json_valid(" + existingSources + ") = 1 AND json_type(" + existingSources + ") = 'array' THEN CASE " +
      "WHEN EXISTS (SELECT 1 FROM json_each(" + existingSources + ") WHERE value = " + sourceUrl + ") THEN " + existingSources +
      " ELSE json_insert(" + existingSources + ", '$[#]', " + sourceUrl + ") END " +
    "ELSE " + existingSources + " END"

  // The one bounded update is idempotent: it fills a URL only when still blank,
  // adds the reviewed source without replacing existing provenance, and records
  // the audited found status/date for the newly corrected rows.
  app.db().newQuery(
    "WITH `source` (`slug`, `website`, `website_source_url`, `checked_date`) AS (VALUES " + rows + ") " +
    "UPDATE `manufacturers` SET " +
      "`website` = CASE WHEN " + blankWebsite + " THEN " + source("website") + " ELSE `website` END, " +
      "`public_details_source_urls` = CASE WHEN " + blankWebsite + " THEN " + mergedSources + " ELSE `public_details_source_urls` END, " +
      "`website_lookup_status` = 'found', " +
      "`website_checked_date` = " + source("checked_date") + " " +
    "WHERE `slug` IN (SELECT `slug` FROM `source`)"
  ).execute()
}, (app) => {
  // Non-destructive rollback: research status, URLs, and provenance remain auditable.
})
