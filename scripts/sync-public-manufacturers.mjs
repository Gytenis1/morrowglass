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
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function configuredBackendUrl(source) {
  const defaultUrl = /const defaultPocketBaseUrl\s*=\s*["']([^"']+)["']/.exec(source)?.[1];
  const value = process.env.VITE_POCKETBASE_URL || defaultUrl;
  if (!value) throw new Error('Could not resolve the public backend URL from VITE_POCKETBASE_URL or src/pocketbase.ts.');

  const url = new URL(value.endsWith('/') ? value : `${value}/`);
  if (url.username || url.password) throw new Error('The public backend URL must not contain credentials.');
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
    url.searchParams.set('fields', ['slug', ...synchronizedFields].join(','));

    const response = await fetch(url, { method: 'GET', headers: { accept: 'application/json' } });
    if (!response.ok) throw new Error(`Public manufacturer read failed on page ${page} (${response.status} ${response.statusText}).`);

    const result = await response.json();
    if (!Array.isArray(result.items) || !Number.isInteger(result.totalPages)) {
      throw new Error(`Public manufacturer read returned an invalid page ${page} response.`);
    }
    records.push(...result.items);
    totalPages = result.totalPages;
    page += 1;
  } while (page <= totalPages);

  return records;
}

function validateRemoteRecord(record, index) {
  if (!record || typeof record !== 'object' || typeof record.slug !== 'string' || !slugPattern.test(record.slug)) {
    throw new Error(`Public manufacturer record ${index + 1} has an invalid slug.`);
  }
  for (const field of synchronizedFields) {
    if (!(field in record)) throw new Error(`Public manufacturer ${record.slug} is missing synchronized field ${field}.`);
  }
  for (const field of ['city', 'location', 'region', 'region_label', 'street_address', 'postcode', 'company_code', 'website', 'public_phone', 'public_contact_url', 'public_contact_checked_date', 'source_collection_date']) {
    if (typeof record[field] !== 'string') throw new Error(`Public manufacturer ${record.slug} has a non-text ${field}.`);
  }
  if (typeof record.no_public_contact_route !== 'boolean') throw new Error(`Public manufacturer ${record.slug} has a non-boolean no_public_contact_route.`);
  if (record.public_details_source_urls !== null && (!Array.isArray(record.public_details_source_urls) || record.public_details_source_urls.some((value) => typeof value !== 'string'))) {
    throw new Error(`Public manufacturer ${record.slug} has invalid public_details_source_urls.`);
  }
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
  for (const field of synchronizedFields) {
    const nextValue = remote[field];
    const localValue = local[field];
    const equivalentEmptyDefault = nextValue === '' && (localValue === undefined || localValue === null);
    const equivalentFalseDefault = nextValue === false && localValue === undefined;
    if (!equivalentEmptyDefault && !equivalentFalseDefault && JSON.stringify(localValue) !== JSON.stringify(nextValue)) {
      local[field] = nextValue;
      changed = true;
      changedFields += 1;
    }
  }
  if (changed) changedRecords += 1;
}

const temporaryUrl = new URL('../data/manufacturers.json.tmp', import.meta.url);
await writeFile(temporaryUrl, `${JSON.stringify(synchronizedRecords, null, 2)}\n`);
await rename(temporaryUrl, sourceUrl);
console.log(`Synchronized ${publicRecords.length} public manufacturers by slug; ${changedRecords} records and ${changedFields} approved fields changed; ${missingPublicSlugs.length} records absent from the public catalogue removed.`);
