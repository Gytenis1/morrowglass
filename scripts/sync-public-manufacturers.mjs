#!/usr/bin/env node
import { readFile, rename, writeFile } from 'node:fs/promises';

const sourceUrl = new URL('../data/manufacturers.json', import.meta.url);
const pocketBaseSourceUrl = new URL('../src/pocketbase.ts', import.meta.url);
const synchronizedFields = [
  'city',
  'location',
  'region',
  'region_label',
  'street_address',
  'postcode',
  'company_code',
  'website',
  'public_phone',
  'public_contact_url',
  'no_public_contact_route',
  'public_contact_checked_date',
  'public_details_source_urls',
  'source_collection_date',
];
const publicTaxonomyFields = [
  'category_codes',
  'category_labels',
  'scope_evidence',
];
// Scope evidence must retain the public URL it cites so the synchronized source
// remains valid when a live category correction introduces a new citation.
const publicEvidenceFields = ['source_urls'];
const publicFactFields = [
  'founded_year',
  'employee_count_band',
  'revenue_eur_latest',
  'revenue_year',
  'financial_source_url',
  'revenue_availability',
  'financial_verification_status',
  'verified_at',
];
const financialFields = [
  'revenue_eur_latest',
  'revenue_year',
  'financial_source_url',
  'revenue_availability',
  'financial_verification_status',
  'verified_at',
];
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const verifiedDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const employeeBands = new Set(['0', '1-9', '10-49', '50-249', '250+']);
const categoryLabels = new Map([
  ['K', 'Virtuvės baldai'],
  ['W', 'Spintos ir įmontuojami baldai'],
  ['BB', 'Miegamojo ir vonios baldai'],
  ['OC', 'Biuro ir komerciniai baldai'],
  ['HR', 'HoReCa ir prekybos baldai'],
  ['U', 'Minkšti baldai pagal užsakymą'],
  ['SW', 'Medžio darbai ir medžio masyvo baldai'],
  ['MM', 'Metalo ir mišrių medžiagų baldai'],
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
    url.searchParams.set('fields', ['slug', ...synchronizedFields, ...publicTaxonomyFields, ...publicEvidenceFields, ...publicFactFields].join(','));

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

function isValidVerifiedDate(value) {
  if (typeof value !== 'string' || !verifiedDatePattern.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function isPublicHttpUrl(value) {
  if (typeof value !== 'string' || !value) return false;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password;
  } catch {
    return false;
  }
}

function isPublicHttpsUrl(value) {
  return isPublicHttpUrl(value) && new URL(value).protocol === 'https:';
}

function validRemoteYearOrDefault(value, field, slug) {
  if (!Number.isInteger(value) || value < 0 || value > 2100 || (value !== 0 && value < 1800)) {
    throw new Error(`Public manufacturer ${slug} has an invalid ${field}.`);
  }
}

function validateRemoteRecord(record, index) {
  if (!record || typeof record !== 'object' || typeof record.slug !== 'string' || !slugPattern.test(record.slug)) {
    throw new Error(`Public manufacturer record ${index + 1} has an invalid slug.`);
  }
  for (const field of [...synchronizedFields, ...publicTaxonomyFields, ...publicEvidenceFields, ...publicFactFields]) {
    if (!(field in record)) throw new Error(`Public manufacturer ${record.slug} is missing synchronized field ${field}.`);
  }
  for (const field of ['city', 'location', 'region', 'region_label', 'street_address', 'postcode', 'company_code', 'website', 'public_phone', 'public_contact_url', 'public_contact_checked_date', 'source_collection_date']) {
    if (typeof record[field] !== 'string') throw new Error(`Public manufacturer ${record.slug} has a non-text ${field}.`);
  }
  if (typeof record.no_public_contact_route !== 'boolean') throw new Error(`Public manufacturer ${record.slug} has a non-boolean no_public_contact_route.`);
  if (!Array.isArray(record.category_codes) || !record.category_codes.length || record.category_codes.some((code) => typeof code !== 'string' || !categoryLabels.has(code))) {
    throw new Error(`Public manufacturer ${record.slug} has invalid category_codes.`);
  }
  if (new Set(record.category_codes).size !== record.category_codes.length) {
    throw new Error(`Public manufacturer ${record.slug} has duplicate category_codes.`);
  }
  if (!Array.isArray(record.category_labels) || record.category_labels.length !== record.category_codes.length) {
    throw new Error(`Public manufacturer ${record.slug} has misaligned category_labels.`);
  }
  record.category_codes.forEach((code, categoryIndex) => {
    const allowedLabels = historicalCategoryLabels.get(code) ?? new Set([categoryLabels.get(code)]);
    if (record.category_labels[categoryIndex] !== categoryLabels.get(code) && !allowedLabels.has(record.category_labels[categoryIndex])) {
      throw new Error(`Public manufacturer ${record.slug} has an invalid label for category ${code}.`);
    }
  });
  if (typeof record.scope_evidence !== 'string' || !record.scope_evidence.trim()) {
    throw new Error(`Public manufacturer ${record.slug} has invalid scope_evidence.`);
  }
  if (!Array.isArray(record.source_urls) || !record.source_urls.length || record.source_urls.some((value) => !isPublicHttpUrl(value))) {
    throw new Error(`Public manufacturer ${record.slug} has invalid source_urls.`);
  }
  if (!record.source_urls.some((url) => record.scope_evidence.includes(url))) {
    throw new Error(`Public manufacturer ${record.slug} scope_evidence does not cite a public source URL.`);
  }
  if (record.public_details_source_urls !== null && (!Array.isArray(record.public_details_source_urls) || record.public_details_source_urls.some((value) => typeof value !== 'string'))) {
    throw new Error(`Public manufacturer ${record.slug} has invalid public_details_source_urls.`);
  }
  if (typeof record.employee_count_band !== 'string' || (record.employee_count_band && !employeeBands.has(record.employee_count_band))) {
    throw new Error(`Public manufacturer ${record.slug} has an invalid employee_count_band.`);
  }
  validRemoteYearOrDefault(record.founded_year, 'founded_year', record.slug);
  if (!Number.isFinite(record.revenue_eur_latest) || record.revenue_eur_latest < 0) {
    throw new Error(`Public manufacturer ${record.slug} has an invalid revenue_eur_latest.`);
  }
  validRemoteYearOrDefault(record.revenue_year, 'revenue_year', record.slug);
  if (typeof record.financial_source_url !== 'string' || (record.financial_source_url && !isPublicHttpsUrl(record.financial_source_url))) {
    throw new Error(`Public manufacturer ${record.slug} has an invalid financial_source_url.`);
  }
  if (!['', 'paskelbta', 'nepaskelbta'].includes(record.revenue_availability)) {
    throw new Error(`Public manufacturer ${record.slug} has an invalid revenue_availability.`);
  }
  if (!['', 'patikrinta'].includes(record.financial_verification_status)) {
    throw new Error(`Public manufacturer ${record.slug} has an invalid financial_verification_status.`);
  }
  if (typeof record.verified_at !== 'string' || (record.verified_at && !isValidVerifiedDate(record.verified_at))) {
    throw new Error(`Public manufacturer ${record.slug} has an invalid verified_at.`);
  }
}

function remoteFinancialEnrichment(record) {
  const hasVerifiedSource = isPublicHttpsUrl(record.financial_source_url)
    && record.financial_verification_status === 'patikrinta'
    && isValidVerifiedDate(record.verified_at);
  if (!hasVerifiedSource) return null;

  if (record.revenue_availability === 'paskelbta'
    && record.revenue_eur_latest > 0
    && Number.isInteger(record.revenue_year)
    && record.revenue_year >= 1800
    && record.revenue_year <= 2100) {
    return Object.fromEntries(financialFields.map((field) => [field, record[field]]));
  }

  // PocketBase NumberFields expose their zero defaults for unavailable figures;
  // the source file represents these as null so import validation can distinguish
  // an explicitly unpublished figure from an incomplete published one.
  if (record.revenue_availability === 'nepaskelbta'
    && record.revenue_eur_latest === 0
    && record.revenue_year === 0) {
    return {
      revenue_eur_latest: null,
      revenue_year: null,
      financial_source_url: record.financial_source_url,
      revenue_availability: record.revenue_availability,
      financial_verification_status: record.financial_verification_status,
      verified_at: record.verified_at,
    };
  }

  return null;
}

function hasCompletePublishedFinancialEnrichment(record) {
  return record.revenue_availability === 'paskelbta'
    && Number.isFinite(record.revenue_eur_latest)
    && record.revenue_eur_latest > 0
    && Number.isInteger(record.revenue_year)
    && record.revenue_year >= 1800
    && record.revenue_year <= 2100
    && isPublicHttpsUrl(record.financial_source_url)
    && record.financial_verification_status === 'patikrinta'
    && isValidVerifiedDate(record.verified_at);
}

const [localRecords, pocketBaseSource] = await Promise.all([
  readFile(sourceUrl, 'utf8').then(JSON.parse),
  readFile(pocketBaseSourceUrl, 'utf8'),
]);
if (!Array.isArray(localRecords)) throw new Error('data/manufacturers.json must contain an array.');

const backendUrl = configuredBackendUrl(pocketBaseSource);
const publicRecords = await fetchPublicManufacturers(backendUrl);
const publicBySlug = new Map();
for (const [index, record] of publicRecords.entries()) {
  validateRemoteRecord(record, index);
  if (publicBySlug.has(record.slug)) throw new Error(`Public manufacturer response contains duplicate slug ${record.slug}.`);
  publicBySlug.set(record.slug, record);
}

const localSlugs = new Set();
for (const record of localRecords) {
  if (!record || typeof record !== 'object' || typeof record.slug !== 'string' || !slugPattern.test(record.slug)) {
    throw new Error('Local manufacturer source contains an invalid slug.');
  }
  if (localSlugs.has(record.slug)) throw new Error(`Local manufacturer source contains duplicate slug ${record.slug}.`);
  localSlugs.add(record.slug);
}

const missingPublicSlugs = [...localSlugs].filter((slug) => !publicBySlug.has(slug));
const unexpectedPublicSlugs = [...publicBySlug.keys()].filter((slug) => !localSlugs.has(slug));
if (unexpectedPublicSlugs.length) {
  throw new Error(`Public/local manufacturer slug mismatch: ${unexpectedPublicSlugs.length} public records are not present locally.`);
}

const synchronizedRecords = localRecords.filter((record) => publicBySlug.has(record.slug));
let changedRecords = 0;
let changedFields = 0;
for (const local of synchronizedRecords) {
  const remote = publicBySlug.get(local.slug);
  let changed = false;
  const synchronize = (field, nextValue) => {
    const localValue = local[field];
    const equivalentEmptyDefault = nextValue === '' && (localValue === undefined || localValue === null);
    const equivalentFalseDefault = nextValue === false && localValue === undefined;
    if (!equivalentEmptyDefault && !equivalentFalseDefault && JSON.stringify(localValue) !== JSON.stringify(nextValue)) {
      local[field] = nextValue;
      changed = true;
      changedFields += 1;
    }
  };

  for (const field of synchronizedFields) synchronize(field, remote[field]);
  // Official registry candidates deliberately retain their conservative O taxonomy
  // in the versioned source. Do not replace that source-taxonomy decision with a
  // public record classification during a static snapshot refresh.
  const retainsConservativeTaxonomy = local.evidence_source_type === 'Lietuvos atvirų duomenų portalas (Registrų centras)';
  if (!retainsConservativeTaxonomy) {
    for (const field of publicEvidenceFields) synchronize(field, remote[field]);
    for (const field of publicTaxonomyFields) synchronize(field, remote[field]);
  }
  if (remote.founded_year >= 1800) synchronize('founded_year', remote.founded_year);
  if (employeeBands.has(remote.employee_count_band)) synchronize('employee_count_band', remote.employee_count_band);

  const remoteFinancial = remoteFinancialEnrichment(remote);
  if (remoteFinancial && !(remote.revenue_availability === 'nepaskelbta' && hasCompletePublishedFinancialEnrichment(local))) {
    for (const field of financialFields) synchronize(field, remoteFinancial[field]);
  }
  if (changed) changedRecords += 1;
}

const temporaryUrl = new URL('../data/manufacturers.json.tmp', import.meta.url);
await writeFile(temporaryUrl, `${JSON.stringify(synchronizedRecords, null, 2)}\n`);
await rename(temporaryUrl, sourceUrl);
console.log(`Synchronized ${publicRecords.length} public manufacturers by slug; ${changedRecords} records and ${changedFields} approved fields changed; ${missingPublicSlugs.length} records absent from the public catalogue removed.`);
