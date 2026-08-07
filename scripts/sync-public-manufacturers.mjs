#!/usr/bin/env node
import { readFile, rename, writeFile } from 'node:fs/promises';

const sourceUrl = new URL('../data/manufacturers.json', import.meta.url);
const pocketBaseSourceUrl = new URL('../src/pocketbase.ts', import.meta.url);

// This is the complete public record shape needed by the static source validator.
// Keep the request explicit: a PocketBase collection field added for internal use
// must not silently become a versioned catalogue fact.
const staticRecordFields = [
  'slug', 'legal_name', 'trading_name', 'source_identity', 'legal_entity_known',
  'description_lt', 'location', 'city', 'region', 'region_label', 'street_address',
  'postcode', 'company_code', 'website', 'public_phone', 'public_contact_url',
  'no_public_contact_route', 'public_contact_checked_date', 'public_details_source_urls',
  'source_collection_date', 'category_codes', 'category_labels', 'audience',
  'portfolio_status', 'confidence', 'confidence_evidence', 'scope_evidence',
  'evidence_source_type', 'source_urls', 'source_artifact_url', 'verification_status',
  'founded_year', 'employee_count_band', 'revenue_eur_latest', 'revenue_year',
  'financial_source_url', 'revenue_availability', 'financial_verification_status',
  'verified_at', 'filed_financial_history', 'registry_financials_checked_date',
  'official_location_status', 'official_location_checked_date',
];
const publicTaxonomyFields = ['category_codes', 'category_labels', 'scope_evidence'];
const publicEvidenceFields = ['source_urls'];
const financialFields = [
  'revenue_eur_latest', 'revenue_year', 'financial_source_url',
  'revenue_availability', 'financial_verification_status', 'verified_at',
];
const officialReferenceFields = [
  'public_details_source_urls', 'source_artifact_url', 'street_address', 'postcode',
  'official_location_status', 'official_location_checked_date',
];
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const verifiedDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const employeeBands = new Set(['0', '1-9', '10-49', '50-249', '250+']);
const bareCountryLabels = new Set(['lietuva', 'lithuania', 'latvija', 'latvia', 'estija', 'estonia', 'lenkija', 'poland', 'europe', 'europa']);
const currentBuildYear = Number(new Date().toISOString().slice(0, 4));
const isBareCountry = (value) => typeof value === 'string' && bareCountryLabels.has(value.trim().toLocaleLowerCase('lt-LT'));
const validFoundingYear = (value) => Number.isInteger(value) && value >= 1900 && value <= currentBuildYear;
const categoryLabels = new Map([
  ['K', 'Virtuvės baldai'], ['W', 'Spintos ir įmontuojami baldai'],
  ['BB', 'Miegamojo ir vonios baldai'], ['OC', 'Biuro ir komerciniai baldai'],
  ['HR', 'HoReCa ir prekybos baldai'], ['U', 'Minkšti baldai pagal užsakymą'],
  ['SW', 'Medžio darbai ir medžio masyvo baldai'], ['MM', 'Metalo ir mišrių medžiagų baldai'],
  ['O', 'Kiti nestandartiniai baldai'],
]);
const historicalCategoryLabels = new Map([['MM', new Set([categoryLabels.get('MM'), 'Kiti baldai'])]]);

function configuredBackendUrl(source) {
  const defaultUrl = /const defaultPocketBaseUrl\s*=\s*["']([^"']+)["']/.exec(source)?.[1];
  const value = process.env.VITE_POCKETBASE_URL || defaultUrl;
  if (!value) throw new Error('Could not resolve the public backend URL from VITE_POCKETBASE_URL or src/pocketbase.ts.');
  const url = new URL(value.endsWith('/') ? value : `${value}/`);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('The public backend URL must be an HTTP(S) URL without credentials.');
  }
  return url;
}

async function fetchPublicManufacturers(baseUrl) {
  const records = [];
  let page = 1;
  let totalPages = 1;
  do {
    const url = new URL('api/collections/manufacturers/records', baseUrl);
    url.searchParams.set('page', String(page));
    url.searchParams.set('perPage', '200');
    url.searchParams.set('sort', 'slug');
    url.searchParams.set('fields', staticRecordFields.join(','));
    const response = await fetch(url, { method: 'GET', headers: { accept: 'application/json' } });
    if (!response.ok) throw new Error(`Public manufacturer read failed on page ${page} (${response.status} ${response.statusText}).`);
    const result = await response.json();
    if (!Array.isArray(result.items) || !Number.isInteger(result.totalPages) || result.totalPages < 0) {
      throw new Error(`Public manufacturer read returned an invalid page ${page} response.`);
    }
    records.push(...result.items);
    totalPages = result.totalPages;
    page += 1;
  } while (page <= totalPages);
  return records;
}

function isValidDate(value) {
  if (typeof value !== 'string' || !verifiedDatePattern.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}
function isPublicHttpUrl(value) {
  if (typeof value !== 'string' || !value) return false;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password;
  } catch { return false; }
}
function isPublicHttpsUrl(value) { return isPublicHttpUrl(value) && new URL(value).protocol === 'https:'; }
function isOfficialDataPortalUrl(value) {
  if (!isPublicHttpsUrl(value)) return false;
  const url = new URL(value);
  return (url.hostname === 'data.gov.lt' && url.pathname.startsWith('/datasets/'))
    || (url.hostname === 'get.data.gov.lt' && url.pathname.startsWith('/datasets/gov/rc/'));
}
function isOfficialRegisterSource(source) {
  return source && typeof source === 'object'
    && isOfficialDataPortalUrl(source.data_portal_url)
    && typeof source.api_model_path === 'string'
    && /^datasets\/gov\/rc\/jar\//.test(source.api_model_path)
    && typeof source.jar_entity_id === 'string'
    && uuidPattern.test(source.jar_entity_id);
}
function validRemoteYearOrDefault(value, field, slug) {
  if (!Number.isInteger(value) || value < 0 || value > 2100 || (value !== 0 && value < 1800)) {
    throw new Error(`Public manufacturer ${slug} has an invalid ${field}.`);
  }
}
function nonEmptyTextArray(value) {
  return Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === 'string' && item.trim());
}
function validateFiledFinancialHistory(history, slug) {
  if (!Array.isArray(history)) throw new Error(`Public manufacturer ${slug} has invalid filed_financial_history.`);
  let previousPeriodEnd = null;
  for (const [index, item] of history.entries()) {
    if (!item || typeof item !== 'object' || !isValidDate(item.fiscal_period_start) || !isValidDate(item.fiscal_period_end)
      || item.fiscal_period_start >= item.fiscal_period_end || !isValidDate(item.filing_registration_date)
      || !isOfficialRegisterSource(item.source)
      || (item.standard_names !== undefined && !nonEmptyTextArray(item.standard_names))
      || (item.template_names !== undefined && !nonEmptyTextArray(item.template_names))) {
      throw new Error(`Public manufacturer ${slug} has invalid filed financial history entry ${index + 1}.`);
    }
    if (previousPeriodEnd !== null && previousPeriodEnd <= item.fiscal_period_end) {
      throw new Error(`Public manufacturer ${slug} filed financial history is not newest-first.`);
    }
    previousPeriodEnd = item.fiscal_period_end;
    for (const [field, value] of Object.entries(item)) {
      if (field.endsWith('_eur') && value !== undefined && !Number.isFinite(value)) {
        throw new Error(`Public manufacturer ${slug} has a non-numerical ${field} in filed financial history.`);
      }
    }
    if (item.revenue_evidence !== undefined) {
      const evidence = item.revenue_evidence;
      if (!evidence || typeof evidence !== 'object' || typeof evidence.api_record_id !== 'string' || !uuidPattern.test(evidence.api_record_id)
        || typeof evidence.line_name !== 'string' || !evidence.line_name.trim() || !isValidDate(evidence.registration_date)) {
        throw new Error(`Public manufacturer ${slug} has invalid revenue evidence in filed financial history.`);
      }
    }
  }
}

function normalizeRemoteRecord(record) {
  // PocketBase serializes an untouched JSON field as an empty string in some
  // records. Treat only that schema default (and null) as an empty collection;
  // any populated non-array value remains invalid and is never invented.
  const normalized = { ...record };
  if (normalized.filed_financial_history === '' || normalized.filed_financial_history === null) normalized.filed_financial_history = [];
  if (normalized.public_details_source_urls === '') normalized.public_details_source_urls = null;
  return normalized;
}

function validateRemoteRecord(record, index) {
  if (!record || typeof record !== 'object' || typeof record.slug !== 'string' || !slugPattern.test(record.slug)) {
    throw new Error(`Public manufacturer record ${index + 1} has an invalid slug.`);
  }
  for (const field of staticRecordFields) {
    if (!(field in record)) throw new Error(`Public manufacturer ${record.slug} is missing synchronized field ${field}.`);
  }
  for (const field of ['legal_name', 'trading_name', 'source_identity', 'description_lt', 'location', 'city', 'region', 'region_label', 'street_address', 'postcode', 'company_code', 'website', 'public_phone', 'public_contact_url', 'public_contact_checked_date', 'source_collection_date', 'confidence_evidence', 'scope_evidence', 'evidence_source_type', 'source_artifact_url', 'verification_status', 'financial_source_url', 'revenue_availability', 'financial_verification_status', 'verified_at', 'registry_financials_checked_date', 'official_location_status', 'official_location_checked_date']) {
    if (typeof record[field] !== 'string') throw new Error(`Public manufacturer ${record.slug} has a non-text ${field}.`);
  }
  if (typeof record.legal_entity_known !== 'boolean' || typeof record.no_public_contact_route !== 'boolean') throw new Error(`Public manufacturer ${record.slug} has invalid boolean metadata.`);
  if (!Array.isArray(record.category_codes) || !record.category_codes.length || record.category_codes.some((code) => typeof code !== 'string' || !categoryLabels.has(code)) || new Set(record.category_codes).size !== record.category_codes.length) {
    throw new Error(`Public manufacturer ${record.slug} has invalid category_codes.`);
  }
  if (!Array.isArray(record.category_labels) || record.category_labels.length !== record.category_codes.length) throw new Error(`Public manufacturer ${record.slug} has misaligned category_labels.`);
  record.category_codes.forEach((code, categoryIndex) => {
    const allowedLabels = historicalCategoryLabels.get(code) ?? new Set([categoryLabels.get(code)]);
    if (!allowedLabels.has(record.category_labels[categoryIndex])) throw new Error(`Public manufacturer ${record.slug} has an invalid label for category ${code}.`);
  });
  if (!record.scope_evidence.trim() || !Array.isArray(record.source_urls) || !record.source_urls.length || record.source_urls.some((value) => !isPublicHttpUrl(value)) || !record.source_urls.some((url) => record.scope_evidence.includes(url))) {
    throw new Error(`Public manufacturer ${record.slug} has invalid scope source evidence.`);
  }
  if (record.public_details_source_urls !== null && (!Array.isArray(record.public_details_source_urls) || record.public_details_source_urls.some((value) => !isPublicHttpsUrl(value)))) throw new Error(`Public manufacturer ${record.slug} has invalid public_details_source_urls.`);
  if (typeof record.employee_count_band !== 'string' || (record.employee_count_band && !employeeBands.has(record.employee_count_band))) throw new Error(`Public manufacturer ${record.slug} has an invalid employee_count_band.`);
  validRemoteYearOrDefault(record.founded_year, 'founded_year', record.slug);
  if (!Number.isFinite(record.revenue_eur_latest) || record.revenue_eur_latest < 0) throw new Error(`Public manufacturer ${record.slug} has an invalid revenue_eur_latest.`);
  validRemoteYearOrDefault(record.revenue_year, 'revenue_year', record.slug);
  if (record.financial_source_url && !isPublicHttpsUrl(record.financial_source_url)) throw new Error(`Public manufacturer ${record.slug} has an invalid financial_source_url.`);
  if (!['', 'paskelbta', 'nepaskelbta'].includes(record.revenue_availability) || !['', 'patikrinta'].includes(record.financial_verification_status) || (record.verified_at && !isValidDate(record.verified_at)) || (record.registry_financials_checked_date && !isValidDate(record.registry_financials_checked_date))) throw new Error(`Public manufacturer ${record.slug} has invalid financial metadata.`);
  if (!['', 'location_published', 'location_not_published'].includes(record.official_location_status) || (record.official_location_checked_date && !isValidDate(record.official_location_checked_date))) throw new Error(`Public manufacturer ${record.slug} has invalid official location metadata.`);
  validateFiledFinancialHistory(record.filed_financial_history, record.slug);
}

function remoteFinancialEnrichment(record) {
  const hasVerifiedSource = isPublicHttpsUrl(record.financial_source_url) && record.financial_verification_status === 'patikrinta' && isValidDate(record.verified_at);
  if (!hasVerifiedSource) return null;
  if (record.revenue_availability === 'paskelbta' && record.revenue_eur_latest > 0 && Number.isInteger(record.revenue_year) && record.revenue_year >= 1800 && record.revenue_year <= 2100) return Object.fromEntries(financialFields.map((field) => [field, record[field]]));
  if (record.revenue_availability === 'nepaskelbta' && record.revenue_eur_latest === 0 && record.revenue_year === 0) return { revenue_eur_latest: null, revenue_year: null, financial_source_url: record.financial_source_url, revenue_availability: record.revenue_availability, financial_verification_status: record.financial_verification_status, verified_at: record.verified_at };
  return null;
}
function hasCompletePublishedFinancialEnrichment(record) {
  return record.revenue_availability === 'paskelbta' && Number.isFinite(record.revenue_eur_latest) && record.revenue_eur_latest > 0 && Number.isInteger(record.revenue_year) && record.revenue_year >= 1800 && record.revenue_year <= 2100 && isPublicHttpsUrl(record.financial_source_url) && record.financial_verification_status === 'patikrinta' && isValidDate(record.verified_at);
}
function isBlank(value) { return value === undefined || value === null || value === ''; }
function uniqueUrls(values) { return [...new Set(values.filter(isPublicHttpUrl))]; }
function hasOfficialLocationEvidence(record) {
  return (record.public_details_source_urls ?? []).some(isOfficialDataPortalUrl)
    || record.source_urls.some(isOfficialDataPortalUrl)
    || isOfficialDataPortalUrl(record.source_artifact_url);
}
function mergeFiledFinancialHistory(localHistory, remoteHistory) {
  if (!Array.isArray(localHistory) || localHistory.length === 0) return remoteHistory;
  const byPeriod = new Map();
  for (const item of localHistory) byPeriod.set(`${item.fiscal_period_start}|${item.fiscal_period_end}`, item);
  for (const item of remoteHistory) byPeriod.set(`${item.fiscal_period_start}|${item.fiscal_period_end}`, item);
  return [...byPeriod.values()].sort((left, right) => right.fiscal_period_end.localeCompare(left.fiscal_period_end));
}

const [localRecords, pocketBaseSource] = await Promise.all([readFile(sourceUrl, 'utf8').then(JSON.parse), readFile(pocketBaseSourceUrl, 'utf8')]);
if (!Array.isArray(localRecords)) throw new Error('data/manufacturers.json must contain an array.');
const backendUrl = configuredBackendUrl(pocketBaseSource);
const publicRecords = await fetchPublicManufacturers(backendUrl);
const publicBySlug = new Map();
for (const [index, fetchedRecord] of publicRecords.entries()) {
  const record = normalizeRemoteRecord(fetchedRecord);
  publicRecords[index] = record;
  validateRemoteRecord(record, index);
  if (publicBySlug.has(record.slug)) throw new Error(`Public manufacturer response contains duplicate slug ${record.slug}.`);
  publicBySlug.set(record.slug, record);
}

const localSlugs = new Set();
for (const record of localRecords) {
  if (!record || typeof record !== 'object' || typeof record.slug !== 'string' || !slugPattern.test(record.slug)) throw new Error('Local manufacturer source contains an invalid slug.');
  if (localSlugs.has(record.slug)) throw new Error(`Local manufacturer source contains duplicate slug ${record.slug}.`);
  localSlugs.add(record.slug);
}
const missingPublicSlugs = [...localSlugs].filter((slug) => !publicBySlug.has(slug));
const newPublicRecords = publicRecords.filter((record) => !localSlugs.has(record.slug));
const synchronizedRecords = localRecords.filter((record) => publicBySlug.has(record.slug));
let changedRecords = 0;
let changedFields = 0;
for (const local of synchronizedRecords) {
  const remote = publicBySlug.get(local.slug);
  let changed = false;
  const synchronize = (field, nextValue, replace = false) => {
    const localValue = local[field];
    if (!replace && !isBlank(localValue)) return;
    if (JSON.stringify(localValue) !== JSON.stringify(nextValue)) {
      local[field] = nextValue;
      changed = true;
      changedFields += 1;
    }
  };
  // Existing versioned facts are stronger than an unqualified remote value. Fill
  // only blanks; authoritative fields below have explicit evidence requirements.
  for (const field of staticRecordFields) {
    if (!['slug', 'city', 'founded_year', ...publicTaxonomyFields, ...publicEvidenceFields, ...financialFields, ...officialReferenceFields, 'filed_financial_history', 'registry_financials_checked_date'].includes(field)) synchronize(field, remote[field]);
  }
  const retainsConservativeTaxonomy = local.evidence_source_type === 'Lietuvos atvirų duomenų portalas (Registrų centras)' || local.evidence_source_type === 'Lietuvos atvirų duomenų portalas (SŪSR ir Registrų centras)';
  if (!retainsConservativeTaxonomy) {
    for (const field of publicEvidenceFields) {
      const merged = uniqueUrls([...(Array.isArray(local[field]) ? local[field] : []), ...remote[field]]);
      synchronize(field, merged, merged.length > (local[field]?.length ?? 0));
    }
    for (const field of publicTaxonomyFields) synchronize(field, remote[field]);
  }
  // 0/empty/out-of-range years and bare-country city labels are storage
  // placeholders, not versioned catalogue facts. A source-backed remote fill wins;
  // otherwise preserve explicit absence as null/empty for static rendering.
  if (!validFoundingYear(local.founded_year)) synchronize('founded_year', validFoundingYear(remote.founded_year) ? remote.founded_year : null, true);
  if (isBareCountry(local.city) && !isBareCountry(remote.city)) synchronize('city', remote.city, true);
  if (employeeBands.has(remote.employee_count_band)) synchronize('employee_count_band', remote.employee_count_band);
  for (const field of ['public_details_source_urls']) {
    const merged = uniqueUrls([...(Array.isArray(local[field]) ? local[field] : []), ...(remote[field] ?? [])]);
    synchronize(field, merged, merged.length > (local[field]?.length ?? 0));
  }
  if (hasOfficialLocationEvidence(remote)) {
    for (const field of ['street_address', 'postcode']) synchronize(field, remote[field]);
    const localChecked = local.official_location_checked_date;
    if (remote.official_location_status && (!isValidDate(localChecked) || remote.official_location_checked_date >= localChecked)) {
      synchronize('official_location_status', remote.official_location_status, true);
      synchronize('official_location_checked_date', remote.official_location_checked_date, true);
    }
  }
  const remoteFinancial = remoteFinancialEnrichment(remote);
  if (remoteFinancial && !(remote.revenue_availability === 'nepaskelbta' && hasCompletePublishedFinancialEnrichment(local))) {
    for (const field of financialFields) synchronize(field, remoteFinancial[field]);
  }
  if (remote.registry_financials_checked_date && (!isValidDate(local.registry_financials_checked_date) || remote.registry_financials_checked_date >= local.registry_financials_checked_date)) synchronize('registry_financials_checked_date', remote.registry_financials_checked_date, true);
  if (remote.filed_financial_history.length) synchronize('filed_financial_history', mergeFiledFinancialHistory(local.filed_financial_history, remote.filed_financial_history), true);
  if (changed) changedRecords += 1;
}

function staticRecordFromRemote(remote) {
  const record = Object.fromEntries(staticRecordFields.map((field) => [field, remote[field]]));
  // PocketBase NumberFields expose a zero default even where the verified source
  // explicitly says the figure is unpublished. The versioned source uses null to
  // preserve that distinction, as it did for the pre-existing records.
  if (record.revenue_availability === 'nepaskelbta' && record.revenue_eur_latest === 0 && record.revenue_year === 0) {
    record.revenue_eur_latest = null;
    record.revenue_year = null;
  }
  return record;
}

// New public records are admitted as complete, already validated snapshots. This
// intentionally keeps existing local order (and its legacy invariants) while
// adding the previously rejected official-register records in stable slug order.
for (const remote of newPublicRecords) synchronizedRecords.push(staticRecordFromRemote(remote));
// Apply the same explicit-unpublished representation to records that were
// admitted by an interrupted/earlier refresh before this normalization existed.
for (const record of synchronizedRecords) {
  if (record.revenue_availability === 'nepaskelbta' && record.revenue_eur_latest === 0 && record.revenue_year === 0) {
    record.revenue_eur_latest = null;
    record.revenue_year = null;
  }
}
const temporaryUrl = new URL('../data/manufacturers.json.tmp', import.meta.url);
await writeFile(temporaryUrl, `${JSON.stringify(synchronizedRecords, null, 2)}\n`);
await rename(temporaryUrl, sourceUrl);
console.log(`Synchronized ${publicRecords.length} public manufacturers by slug; admitted ${newPublicRecords.length} new public records; ${changedRecords} existing records and ${changedFields} approved fields changed; ${missingPublicSlugs.length} records absent from the public catalogue removed.`);
