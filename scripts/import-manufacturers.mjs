#!/usr/bin/env node
import { readFile } from "node:fs/promises";

const HELP = `Usage:
  PB_URL=https://api.example PB_ADMIN_EMAIL=admin@example.com \\
    PB_ADMIN_PASSWORD='...' node scripts/import-manufacturers.mjs
  PB_URL=https://api.example PB_ADMIN_EMAIL=admin@example.com \\
    PB_ADMIN_PASSWORD='...' node scripts/import-manufacturers.mjs --prune
  node scripts/import-manufacturers.mjs --validate
  node scripts/import-manufacturers.mjs --help

The normal command authenticates as a PocketBase superuser, then creates or updates
all data/manufacturers.json records by unique slug. --prune also deletes backend
records whose slugs are no longer in the versioned file. --validate only checks
the local source file and does not require credentials or make network requests.`;

const sourceUrl = new URL("../data/manufacturers.json", import.meta.url);
const susrCorrectionManifestUrl = new URL("../data/category_evrk_20260807.json", import.meta.url);
const requiredFields = [
  "slug", "trading_name", "source_identity", "description_lt", "location", "region", "region_label",
  "category_codes", "category_labels", "audience", "portfolio_status", "confidence",
  "confidence_evidence", "scope_evidence", "evidence_source_type", "source_urls",
  "source_artifact_url", "source_collection_date", "verification_status",
];
const financialEnrichmentFields = ["financial_source_url", "revenue_availability", "financial_verification_status", "verified_at"];
const categoryLabels = new Map([
  ["K", "Virtuvės baldai"], ["W", "Spintos ir įmontuojami baldai"],
  ["BB", "Miegamojo ir vonios baldai"], ["OC", "Biuro ir komerciniai baldai"],
  ["HR", "HoReCa ir prekybos baldai"], ["U", "Minkšti baldai pagal užsakymą"],
  ["SW", "Medžio darbai ir medžio masyvo baldai"], ["MM", "Metalo ir mišrių medžiagų baldai"],
  ["O", "Kiti nestandartiniai baldai"],
]);
const categoryCodes = new Set(categoryLabels.keys());
const historicalCategoryLabels = new Map([["MM", new Set([categoryLabels.get("MM"), "Kiti baldai"])]]);
const regions = new Set(["vilnius-east-south", "kaunas-north", "klaipeda-panevezys-west-central", "national"]);
const regionLabels = new Map([
  ["vilnius-east-south", new Set(["Vilnius, rytų ir pietų Lietuva"])],
  ["kaunas-north", new Set(["Kaunas ir šiaurės Lietuva"])],
  ["klaipeda-panevezys-west-central", new Set(["Klaipėda, Panevėžys, vakarų ir centrinė Lietuva", "Klaipėda, Panevėžys, vakarų ir vidurio Lietuva"])],
  ["national", new Set(["Visa Lietuva (miestas nenurodytas oficialiame šaltinyje)"])],
]);
const originalRecordCount = 121;
const legacyRecordCount = 304;
// This release is a complete synchronized public snapshot, not the old 437-record
// migration checkpoint. Keep this explicit so a truncated future export cannot pass.
const expectedSynchronizedRecordCount = 1420;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeName(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}
function isValidDate(value) {
  if (typeof value !== "string" || !datePattern.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}
function isHttpsUrl(value) {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch { return false; }
}
function isPublicUrl(value) {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password;
  } catch { return false; }
}
function isOfficialDataPortalUrl(value) {
  if (!isHttpsUrl(value)) return false;
  const url = new URL(value);
  return (url.hostname === "data.gov.lt" && url.pathname.startsWith("/datasets/"))
    || (url.hostname === "get.data.gov.lt" && url.pathname.startsWith("/datasets/gov/rc/"));
}
function isOfficialRegisterSource(source) {
  return source && typeof source === "object"
    && isOfficialDataPortalUrl(source.data_portal_url)
    && typeof source.api_model_path === "string" && /^datasets\/gov\/rc\/jar\//.test(source.api_model_path)
    && typeof source.jar_entity_id === "string" && uuidPattern.test(source.jar_entity_id);
}
function hasOfficialReference(record) {
  return [record.source_artifact_url, ...(record.source_urls || []), ...(record.public_details_source_urls || [])].some(isOfficialDataPortalUrl);
}
function sameJson(left, right) { return JSON.stringify(left) === JSON.stringify(right); }
function isCurrentSusrActivityCorrection(record, corrections) {
  const correction = corrections.get(record.slug);
  return correction
    && record.evidence_source_type === "Lietuvos atvirų duomenų portalas (SŪSR ir Registrų centras)"
    && sameJson(record.category_codes, correction.target_category_codes)
    && sameJson(record.category_labels, correction.target_category_labels)
    && record.scope_evidence.includes(correction.official_susr_record_url)
    && record.source_urls.includes(correction.official_susr_record_url);
}
function hasDirectSourceBackedTaxonomy(record) {
  return record.evidence_source_type === "Rekvizitai, registracijos kodu patikrintas viešas puslapis"
    && record.source_urls.some((url) => isHttpsUrl(url) && new URL(url).hostname === "rekvizitai.vz.lt" && record.scope_evidence.includes(url));
}
function validateFiledFinancialHistory(history, slug) {
  if (!Array.isArray(history)) throw new Error(`Invalid filed_financial_history for ${slug}`);
  let priorPeriodEnd = null;
  for (const [historyIndex, entry] of history.entries()) {
    if (!entry || typeof entry !== "object" || !isValidDate(entry.fiscal_period_start) || !isValidDate(entry.fiscal_period_end)
      || entry.fiscal_period_start >= entry.fiscal_period_end || !isValidDate(entry.filing_registration_date)
      || !isOfficialRegisterSource(entry.source)
      || (entry.standard_names !== undefined && (!Array.isArray(entry.standard_names) || !entry.standard_names.length || entry.standard_names.some((name) => typeof name !== "string" || !name.trim())))
      || (entry.template_names !== undefined && (!Array.isArray(entry.template_names) || !entry.template_names.length || entry.template_names.some((name) => typeof name !== "string" || !name.trim())))) {
      throw new Error(`Invalid filed financial history entry ${historyIndex + 1} for ${slug}`);
    }
    if (priorPeriodEnd !== null && priorPeriodEnd <= entry.fiscal_period_end) throw new Error(`Filed financial history must be newest-first for ${slug}`);
    priorPeriodEnd = entry.fiscal_period_end;
    for (const [field, value] of Object.entries(entry)) {
      if (field.endsWith("_eur") && !Number.isFinite(value)) {
        throw new Error(`Invalid ${field} in filed financial history for ${slug}`);
      }
    }
    if (entry.revenue_evidence !== undefined) {
      const evidence = entry.revenue_evidence;
      if (!evidence || typeof evidence !== "object" || typeof evidence.api_record_id !== "string" || !uuidPattern.test(evidence.api_record_id)
        || typeof evidence.line_name !== "string" || !evidence.line_name.trim() || !isValidDate(evidence.registration_date)) {
        throw new Error(`Invalid revenue citation in filed financial history for ${slug}`);
      }
    }
  }
}

function validate(records) {
  if (!Array.isArray(records) || records.length !== expectedSynchronizedRecordCount) {
    throw new Error(`Expected exactly ${expectedSynchronizedRecordCount} synchronized manufacturer records; found ${Array.isArray(records) ? records.length : "non-array JSON"}`);
  }
  const slugs = new Set();
  const normalizedNames = new Map();
  const companyCodes = new Map();
  for (const [index, record] of records.entries()) {
    for (const field of requiredFields) {
      if (record[field] === undefined || record[field] === null || record[field] === "") throw new Error(`Record ${index + 1} (${record.slug || "no slug"}) is missing ${field}`);
    }
    // Empty city is an explicit absence after a bare-country placeholder is removed.
    if (typeof record.city !== "string") throw new Error(`Invalid city for ${record.slug}`);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.slug)) throw new Error(`Invalid slug: ${record.slug}`);
    if (slugs.has(record.slug)) throw new Error(`Duplicate slug: ${record.slug}`);
    slugs.add(record.slug);
    const normalizedName = normalizeName(record.trading_name);
    if (!normalizedName) throw new Error(`Invalid trading_name for ${record.slug}`);
    const priorNameIndex = normalizedNames.get(normalizedName);
    if (priorNameIndex !== undefined && (index >= originalRecordCount || priorNameIndex >= originalRecordCount)) throw new Error(`Duplicate normalized trading_name: ${record.trading_name}`);
    normalizedNames.set(normalizedName, index);
    if (!regions.has(record.region)) throw new Error(`Invalid region for ${record.slug}: ${record.region}`);
    if (!Array.isArray(record.category_codes) || !record.category_codes.length || record.category_codes.some((code) => !categoryCodes.has(code)) || new Set(record.category_codes).size !== record.category_codes.length) throw new Error(`Invalid or duplicate category_codes for ${record.slug}`);
    if (!Array.isArray(record.category_labels) || record.category_labels.length !== record.category_codes.length) throw new Error(`category_labels mismatch for ${record.slug}`);
    record.category_codes.forEach((code, categoryIndex) => {
      const allowedLabels = historicalCategoryLabels.get(code) ?? new Set([categoryLabels.get(code)]);
      if (!allowedLabels.has(record.category_labels[categoryIndex])) throw new Error(`Unexpected label for category ${code} on ${record.slug}`);
    });
    if (typeof record.description_lt !== "string" || !record.description_lt.trim()) throw new Error(`Missing description_lt for ${record.slug}`);
    if (!Array.isArray(record.source_urls) || !record.source_urls.length || record.source_urls.some((url) => !isPublicUrl(url))) throw new Error(`Missing or invalid source_urls for ${record.slug}`);
    if (!record.source_urls.some((url) => record.scope_evidence.includes(url))) throw new Error(`scope_evidence must cite a source_urls URL for ${record.slug}`);
    if (!isValidDate(record.source_collection_date)) throw new Error(`Invalid source date for ${record.slug}`);
    if (record.verification_status !== "nepatvirtinta") throw new Error(`Unexpected verification status for ${record.slug}`);
    const hasCompanyCode = record.company_code !== undefined && record.company_code !== null && record.company_code !== "";
    if (hasCompanyCode) {
      if (!/^\d{7,12}$/.test(record.company_code)) throw new Error(`Invalid public company identifier for ${record.slug}`);
      if (companyCodes.has(record.company_code)) throw new Error(`Duplicate company_code: ${record.company_code}`);
      companyCodes.set(record.company_code, index);
    }
    const hasPublicDetailsProvenance = Array.isArray(record.public_details_source_urls) && record.public_details_source_urls.length > 0;
    if (record.public_details_source_urls !== undefined && record.public_details_source_urls !== null && (!Array.isArray(record.public_details_source_urls) || record.public_details_source_urls.some((url) => !isHttpsUrl(url)))) throw new Error(`Invalid public registry provenance for ${record.slug}`);
    for (const field of ["street_address", "postcode"]) {
      if (record[field] !== undefined && typeof record[field] !== "string") throw new Error(`Invalid ${field} for ${record.slug}`);
      if (record[field]?.trim() && !hasPublicDetailsProvenance) throw new Error(`${field} requires public registry provenance for ${record.slug}`);
    }
    const hasFiledHistory = record.filed_financial_history !== undefined;
    if (hasFiledHistory) validateFiledFinancialHistory(record.filed_financial_history, record.slug);
    const hasFinancialEnrichment = financialEnrichmentFields.some((field) => record[field] !== undefined && record[field] !== "")
      || (Number.isFinite(record.revenue_eur_latest) && record.revenue_eur_latest !== 0)
      || (Number.isInteger(record.revenue_year) && record.revenue_year !== 0);
    if (hasFinancialEnrichment && financialEnrichmentFields.some((field) => record[field] === undefined)) throw new Error(`Incomplete financial enrichment for ${record.slug}`);
    if (hasFinancialEnrichment) {
      const hasCitedRegistryLatest = record.revenue_availability === "paskelbta" && isOfficialDataPortalUrl(record.financial_source_url)
        && record.filed_financial_history?.some((entry) => entry.revenue_eur === record.revenue_eur_latest && Number(entry.fiscal_period_end.slice(0, 4)) === record.revenue_year);
      // The official portal can also positively report no filed figures. Its
      // citation plus the record's official reference is the evidence in that
      // case; a blank legacy verified_at must not turn that into invented data.
      const hasCitedRegistryUnavailable = record.revenue_availability === "nepaskelbta" && record.revenue_eur_latest === null && record.revenue_year === null
        && isOfficialDataPortalUrl(record.financial_source_url) && hasOfficialReference(record) && Array.isArray(record.filed_financial_history)
        && !record.filed_financial_history.some((entry) => Object.hasOwn(entry, "revenue_eur"));
      if (!hasCompanyCode || !hasPublicDetailsProvenance || !isHttpsUrl(record.financial_source_url) || !["paskelbta", "nepaskelbta"].includes(record.revenue_availability) || record.financial_verification_status !== "patikrinta" || (!isValidDate(record.verified_at) && !hasCitedRegistryLatest && !hasCitedRegistryUnavailable)) throw new Error(`Invalid financial enrichment for ${record.slug}`);
      if (record.revenue_availability === "paskelbta") {
        if (!Number.isFinite(record.revenue_eur_latest) || !Number.isInteger(record.revenue_year)) throw new Error(`Published revenue requires value and year for ${record.slug}`);
      } else if (record.revenue_eur_latest !== null || record.revenue_year !== null) {
        // A prior verified figure may remain as a factual historic value when the
        // current registry lookup says no newer figure is published. Accept only
        // that exact, cited filed-history match; do not permit arbitrary numbers.
        const carriedFiledRevenue = record.filed_financial_history?.some((entry) =>
          entry.revenue_eur === record.revenue_eur_latest && Number(entry.fiscal_period_end.slice(0, 4)) === record.revenue_year
        );
        if (!carriedFiledRevenue) throw new Error(`Unpublished revenue must not populate number fields for ${record.slug}`);
      }
    }
    if (record.registry_financials_checked_date !== undefined && record.registry_financials_checked_date !== "" && !isValidDate(record.registry_financials_checked_date)) throw new Error(`Invalid registry_financials_checked_date for ${record.slug}`);
    if (record.official_location_status !== undefined) {
      if (!["", "location_published", "location_not_published"].includes(record.official_location_status)) throw new Error(`Invalid official_location_status for ${record.slug}`);
      if (record.official_location_status && (!isValidDate(record.official_location_checked_date) || !hasOfficialReference(record))) throw new Error(`Official location status requires dated official provenance for ${record.slug}`);
      if (record.official_location_status === "location_not_published") {
        const nationalMapping = record.location === "Lietuva" && record.city === "Lietuva" && record.region === "national" && record.region_label === "Visa Lietuva (miestas nenurodytas oficialiame šaltinyje)";
        // A later source audit may intentionally clear the display-only country
        // placeholder while retaining the official national grouping and its date.
        const omittedNationalLocality = record.location === "Lietuva" && record.city === "" && record.region === "national" && record.region_label === "Visa Lietuva (miestas nenurodytas oficialiame šaltinyje)";
        if (!nationalMapping && !omittedNationalLocality) throw new Error(`location_not_published must retain a no-guessing national mapping for ${record.slug}`);
      }
    }
    if (index >= legacyRecordCount) {
      if (typeof record.legal_name !== "string" || !record.legal_name.trim() || record.legal_entity_known !== true || !hasCompanyCode) throw new Error(`Official-source record ${record.slug} must retain its legal identity and company code`);
      const retainsNationalMapping = record.location === "Lietuva" && record.city === "Lietuva" && record.region === "national" && record.region_label === "Visa Lietuva (miestas nenurodytas oficialiame šaltinyje)";
      const omitsNationalPlaceholder = record.location === "Lietuva" && record.city === "" && record.region === "national" && record.region_label === "Visa Lietuva (miestas nenurodytas oficialiame šaltinyje)";
      // The register import preserves its recorded city even where the catalogue
      // deliberately retained the national grouping; do not guess a regional
      // reassignment from that city. A published city is still accepted only with
      // the linked official provenance.
      const hasSourceBackedLocation = hasPublicDetailsProvenance && record.city.trim()
        && (record.location === record.city || record.location === "Lietuva")
        && (regionLabels.get(record.region)?.has(record.region_label)
          || (record.region === "national" && record.region_label === record.city));
      if (!retainsNationalMapping && !omitsNationalPlaceholder && !hasSourceBackedLocation) throw new Error(`Official-source record ${record.slug} has an unsupported location mapping`);
      const retainsConservativeClassification = record.category_codes.length === 1 && record.category_codes[0] === "O" && record.category_labels[0] === categoryLabels.get("O");
      if ((!retainsConservativeClassification && !isCurrentSusrActivityCorrection(record, susrActivityCorrections) && !hasDirectSourceBackedTaxonomy(record)) || record.audience !== "nežinoma" || record.portfolio_status !== "nežinoma" || record.confidence !== "vidutinis") throw new Error(`Official-source record ${record.slug} has an unsupported catalogue classification`);
      if (!["Lietuvos atvirų duomenų portalas (Registrų centras)", "Lietuvos atvirų duomenų portalas (SŪSR ir Registrų centras)"].includes(record.evidence_source_type) && !hasDirectSourceBackedTaxonomy(record)) throw new Error(`Official-source record ${record.slug} has invalid provenance type`);
      if (!hasPublicDetailsProvenance && record.source_collection_date !== "2026-08-01") throw new Error(`Official-source record ${record.slug} has invalid collection date`);
    }
  }
  return records;
}

async function request(url, options = {}) {
  const response = await fetch(url, options);
  const body = await response.text();
  let parsed;
  try { parsed = body ? JSON.parse(body) : null; } catch { parsed = body; }
  if (!response.ok) {
    const detail = typeof parsed === "string" ? parsed : JSON.stringify(parsed);
    throw new Error(`${options.method || "GET"} ${url.pathname} failed (${response.status}): ${detail}`);
  }
  return parsed;
}

if (process.argv.includes("--help") || process.argv.includes("-h")) { console.log(HELP); process.exit(0); }
const susrCorrectionManifest = JSON.parse(await readFile(susrCorrectionManifestUrl, "utf8"));
if (!Array.isArray(susrCorrectionManifest?.results)) throw new Error("SŪSR correction manifest must contain results.");
const susrActivityCorrections = new Map();
for (const correction of susrCorrectionManifest.results) {
  if (!correction || typeof correction.slug !== "string" || !Array.isArray(correction.target_category_codes)
    || !Array.isArray(correction.target_category_labels) || !isHttpsUrl(correction.official_susr_record_url)) {
    throw new Error("SŪSR correction manifest contains an invalid result.");
  }
  if (susrActivityCorrections.has(correction.slug)) throw new Error(`SŪSR correction manifest contains duplicate slug ${correction.slug}`);
  susrActivityCorrections.set(correction.slug, correction);
}
const records = validate(JSON.parse(await readFile(sourceUrl, "utf8")));
const populatedDescriptions = records.filter((record) => record.description_lt.trim()).length;
const categorizedRecords = records.filter((record) => record.category_codes.length > 0).length;
const categoryDistribution = [...categoryLabels.keys()].map((code) => `${code}:${records.filter((record) => record.category_codes.includes(code)).length}`).join(", ");
const coverage = `Descriptions ${populatedDescriptions}/${records.length}; category coverage ${categorizedRecords}/${records.length} evidenced (full coverage); distribution ${categoryDistribution}.`;
if (process.argv.includes("--validate")) { console.log(`Validated ${records.length} manufacturer records with ${new Set(records.map((record) => record.slug)).size} unique slugs.`); console.log(coverage); process.exit(0); }

const { PB_URL, PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD } = process.env;
if (!PB_URL || !PB_ADMIN_EMAIL || !PB_ADMIN_PASSWORD) { console.error(HELP); throw new Error("PB_URL, PB_ADMIN_EMAIL, and PB_ADMIN_PASSWORD are required for import"); }
const baseUrl = new URL(PB_URL.endsWith("/") ? PB_URL : `${PB_URL}/`);
const authUrl = new URL("api/collections/_superusers/auth-with-password", baseUrl);
const auth = await request(authUrl, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ identity: PB_ADMIN_EMAIL, password: PB_ADMIN_PASSWORD }) });
const headers = { authorization: auth.token, "content-type": "application/json" };
let created = 0; let updated = 0; let deleted = 0;
for (const record of records) {
  const listUrl = new URL("api/collections/manufacturers/records", baseUrl);
  listUrl.searchParams.set("page", "1"); listUrl.searchParams.set("perPage", "1"); listUrl.searchParams.set("filter", `slug = "${record.slug}"`);
  const result = await request(listUrl, { headers });
  if (result.items.length) { await request(new URL(`api/collections/manufacturers/records/${result.items[0].id}`, baseUrl), { method: "PATCH", headers, body: JSON.stringify(record) }); updated++; }
  else { await request(new URL("api/collections/manufacturers/records", baseUrl), { method: "POST", headers, body: JSON.stringify(record) }); created++; }
}
if (process.argv.includes("--prune")) {
  const sourceSlugs = new Set(records.map((record) => record.slug));
  let page = 1; let totalPages = 1; const staleRecords = [];
  do {
    const listUrl = new URL("api/collections/manufacturers/records", baseUrl);
    listUrl.searchParams.set("page", String(page)); listUrl.searchParams.set("perPage", "200"); listUrl.searchParams.set("fields", "id,slug");
    const result = await request(listUrl, { headers });
    staleRecords.push(...result.items.filter((item) => !sourceSlugs.has(item.slug))); totalPages = result.totalPages; page++;
  } while (page <= totalPages);
  for (const stale of staleRecords) { await request(new URL(`api/collections/manufacturers/records/${stale.id}`, baseUrl), { method: "DELETE", headers }); deleted++; }
}
console.log(`Imported ${records.length} manufacturers: ${created} created, ${updated} updated, ${deleted} deleted.`);
console.log(coverage);
