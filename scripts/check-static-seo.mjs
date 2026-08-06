#!/usr/bin/env node
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const publicDir = join(rootDir, 'public');
const SITE_URL = 'https://www.baldininkai.org';
const DATASET_LICENSE_NAME = 'Creative Commons Attribution 4.0 International';
const DATASET_LICENSE_VERSION = '4.0';
const DATASET_LICENSE_URL = 'https://creativecommons.org/licenses/by/4.0/';
const DATASET_JSON_URL = `${SITE_URL}/baldininkai-org-gamintojai.json`;
const DATASET_CSV_URL = `${SITE_URL}/baldininkai-org-gamintojai.csv`;
const OPEN_DATA_URL = `${SITE_URL}/atviri-duomenys/`;
const MARKET_OVERVIEW_PATH = '/baldu-rinkos-apzvalga';
const MARKET_OVERVIEW_URL = `${SITE_URL}${MARKET_OVERVIEW_PATH}/`;
const ENGLISH_MARKET_OVERVIEW_PATH = '/en/lithuanian-furniture-makers-data';
const ENGLISH_MARKET_OVERVIEW_URL = `${SITE_URL}${ENGLISH_MARKET_OVERVIEW_PATH}/`;
const ENGLISH_HUB_PATH = '/en';
const ENGLISH_HUB_URL = `${SITE_URL}/en/`;
const ENGLISH_CATEGORY_BASE_PATH = '/en/furniture-makers';
const ENGLISH_CATEGORY_LABELS = new Map([
  ['virtuves-baldai', 'Custom kitchen furniture'],
  ['spintos-ir-imontuojami-baldai', 'Custom wardrobes and fitted furniture'],
  ['miegamojo-ir-vonios-baldai', 'Custom bedroom and bathroom furniture'],
  ['biuro-ir-komerciniai-baldai', 'Custom office and commercial furniture'],
  ['horeca-ir-prekybos-baldai', 'Custom HoReCa and retail furniture'],
  ['minksti-baldai', 'Custom upholstered furniture'],
  ['medzio-darbai-ir-masyvo-baldai', 'Woodwork and solid-wood furniture'],
  ['metalo-ir-misriu-medziagu-baldai', 'Custom metal and mixed-material furniture'],
  ['kiti-nestandartiniai-baldai', 'Other custom furniture'],
  ['kiti-baldai', 'Other furniture'],
]);
const ENGLISH_SOURCING_GUIDE_PATH = '/en/sourcing-guide';
const ENGLISH_SOURCING_GUIDE_URL = `${SITE_URL}${ENGLISH_SOURCING_GUIDE_PATH}/`;
const ENGLISH_CITY_MINIMUM = 10;
const NOT_PUBLISHED_ENGLISH = 'Not published in this catalogue';
const ENGLISH_REGION_LABELS = new Map([
  ['Vilnius, rytų ir pietų Lietuva', { label: 'Vilnius, eastern and southern Lithuania', slug: 'vilnius-east-south-lithuania' }],
  ['Kaunas ir šiaurės Lietuva', { label: 'Kaunas and northern Lithuania', slug: 'kaunas-north-lithuania' }],
  ['Klaipėda, Panevėžys, vakarų ir centrinė Lietuva', { label: 'Klaipėda, Panevėžys, western and central Lithuania', slug: 'klaipeda-panevezys-west-central-lithuania' }],
  ['Klaipėda, Panevėžys, vakarų ir vidurio Lietuva', { label: 'Klaipėda, Panevėžys, western and mid-Lithuania', slug: 'klaipeda-panevezys-west-mid-lithuania' }],
  ['Visa Lietuva (miestas nenurodytas oficialiame šaltinyje)', { label: 'All Lithuania (no city stated in the official source)', slug: 'all-lithuania-city-not-stated' }],
]);
const ENGLISH_EMPLOYEE_BAND_LABELS = new Map([
  ['0', '0 employees'],
  ['1-9', '1–9 employees'],
  ['10-49', '10–49 employees'],
  ['50-249', '50–249 employees'],
  ['250+', '250 or more employees'],
]);
const manufacturers = JSON.parse(await readFile(join(rootDir, 'data/manufacturers.json'), 'utf8'));
const landingConfig = JSON.parse(await readFile(join(rootDir, 'data/seo-landings.json'), 'utf8'));
const manufacturersBySlug = new Map(manufacturers.map((record) => [record.slug, record]));
const datasetHeaders = [
  'slug',
  'profile_url',
  'trading_name',
  'legal_name',
  'company_code',
  'city',
  'street_address',
  'postcode',
  'region_label',
  'website',
  'public_phone',
  'contact_route_status',
  'categories',
  'public_source_urls',
  'verification_date',
];
const errors = [];
let generatedDatasetMetadata = null;
const titleRoutes = new Map();
const descriptionRoutes = new Map();
const hubGuidanceRoutes = new Map();
const cityIntroRoutes = new Map();
const cityFaqRoutes = new Map();

async function htmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const filePath = join(directory, entry.name);
    if (entry.isDirectory()) return htmlFiles(filePath);
    return entry.isFile() && entry.name === 'index.html' ? [filePath] : [];
  }));
  return files.flat();
}

function routeFor(file) {
  const directory = relative(publicDir, dirname(file));
  return directory ? `/${directory.split('\\').join('/')}` : '/';
}

function canonicalUrl(route) {
  return `${SITE_URL}${route === '/' ? '/' : `${route}/`}`;
}

function attribute(tag, name) {
  const match = new RegExp(`\\b${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, 'i').exec(tag);
  return match?.[2] ?? '';
}

function tags(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map((match) => match[0]);
}

function schemaTypes(value) {
  if (!value || typeof value !== 'object') return [];
  const types = Array.isArray(value['@type']) ? value['@type'] : [value['@type']].filter(Boolean);
  const graph = Array.isArray(value['@graph']) ? value['@graph'].flatMap(schemaTypes) : [];
  const nested = Object.entries(value)
    .filter(([key]) => key !== '@graph')
    .flatMap(([, child]) => Array.isArray(child) ? child.flatMap(schemaTypes) : schemaTypes(child));
  return [...types, ...graph, ...nested];
}

function schemasOfType(schemas, type) {
  const matches = [];
  const visit = (value) => {
    if (!value || typeof value !== 'object') return;
    const types = Array.isArray(value['@type']) ? value['@type'] : [value['@type']].filter(Boolean);
    if (types.includes(type)) matches.push(value);
    for (const child of Object.values(value)) Array.isArray(child) ? child.forEach(visit) : visit(child);
  };
  schemas.forEach(visit);
  return matches;
}

function hasEmptySchemaValue(value) {
  if (value == null) return true;
  if (typeof value === 'string') return !value.trim();
  if (Array.isArray(value)) return value.length === 0 || value.some(hasEmptySchemaValue);
  if (typeof value === 'object') return Object.keys(value).length === 0 || Object.values(value).some(hasEmptySchemaValue);
  return false;
}

function withoutNonVisibleContent(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--([\s\S]*?)-->/g, ' ');
}

function visibleText(html) {
  return withoutNonVisibleContent(html)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&(?:amp|#38);/gi, '&')
    .replace(/&(?:quot|#34);/gi, '"')
    .replace(/&(?:apos|#0*39);/gi, "'")
    .replace(/&(?:lt|#60);/gi, '<')
    .replace(/&(?:gt|#62);/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function visibleFaqEntries(html) {
  const rendered = withoutNonVisibleContent(html);
  const sections = [...rendered.matchAll(/<section\b([^>]*)>([\s\S]*?)<\/section>/gi)];
  for (const [, attributes, content] of sections) {
    const classes = attribute(`<section ${attributes}>`, 'class');
    const hidden = /\bhidden\b|aria-hidden\s*=\s*["']true["']|display\s*:\s*none/i.test(attributes);
    if (hidden || !/(?:landing-faq|article-faq)/.test(classes) || !/<h2\b[^>]*>\s*Dažniausi klausimai\s*<\/h2>/i.test(content)) continue;
    const questions = [...content.matchAll(/<dt\b[^>]*>([\s\S]*?)<\/dt>/gi)].map((match) => visibleText(match[1])).filter(Boolean);
    const answers = [...content.matchAll(/<dd\b[^>]*>([\s\S]*?)<\/dd>/gi)].map((match) => visibleText(match[1])).filter(Boolean);
    return questions.length === answers.length ? questions.length : -1;
  }
  return 0;
}

function hubGuidance(html) {
  const rendered = withoutNonVisibleContent(html);
  const match = /<section\b[^>]*class=(["'])[^"']*\blanding-guidance\b[^"']*\1[^>]*>([\s\S]*?)<\/section>\s*<section\b[^>]*class=(["'])[^"']*\blanding-(?:related|results)\b[^"']*\3/i.exec(rendered);
  return match ? visibleText(match[2]) : '';
}

function lithuanianWordCount(text) {
  return text.match(/[\p{L}\p{M}]+(?:[’'-][\p{L}\p{M}]+)*/gu)?.length ?? 0;
}

function slugifyLithuanian(value) {
  const replacements = { ą: 'a', č: 'c', ę: 'e', ė: 'e', į: 'i', š: 's', ų: 'u', ū: 'u', ž: 'z' };
  return value.toLocaleLowerCase('lt-LT')
    .replace(/[ąčęėįšųūž]/g, (character) => replacements[character] ?? character)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function addNormalizedRoute(map, text, route) {
  const normalized = text.toLocaleLowerCase('lt-LT').replace(/\s+/g, ' ').trim();
  if (!normalized) return;
  const routes = map.get(normalized) ?? [];
  routes.push(route);
  map.set(normalized, routes);
}

function validFaqPage(schemas, expectedEntries) {
  const candidates = [];
  const visit = (value) => {
    if (!value || typeof value !== 'object') return;
    if ((Array.isArray(value['@type']) ? value['@type'] : [value['@type']]).includes('FAQPage')) candidates.push(value);
    for (const child of Object.values(value)) Array.isArray(child) ? child.forEach(visit) : visit(child);
  };
  schemas.forEach(visit);
  return candidates.some((schema) => Array.isArray(schema.mainEntity)
    && schema.mainEntity.length === expectedEntries
    && schema.mainEntity.every((item) => item?.['@type'] === 'Question'
      && typeof item.name === 'string' && item.name.trim()
      && item.acceptedAnswer?.['@type'] === 'Answer'
      && typeof item.acceptedAnswer.text === 'string' && item.acceptedAnswer.text.trim()));
}

function addError(route, message) {
  errors.push(`${route}: ${message}`);
}

function publicUrl(value) {
  if (!value) return '';
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
  } catch {
    return '';
  }
}

function publishedTurnover(record) {
  const amount = record.revenue_eur_latest;
  const year = record.revenue_year;
  const sourceUrl = publicUrl(record.financial_source_url);
  if (record.revenue_availability !== 'paskelbta' || !Number.isFinite(amount) || amount <= 0 || !Number.isInteger(year) || !sourceUrl) return null;
  return { amount, year, sourceUrl };
}

function formatEuro(amount, locale = 'lt-LT') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
}

function formatPercent(count, total, locale = 'lt-LT') {
  return new Intl.NumberFormat(locale, { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(total ? count / total : 0);
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function countBy(records, valueFor) {
  const counts = new Map();
  for (const record of records) {
    const value = valueFor(record);
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]), 'lt'));
}

function validIsoDate(value) {
  const iso = String(value ?? '').trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return '';
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return date.getUTCFullYear() === Number(match[1]) && date.getUTCMonth() === Number(match[2]) - 1 && date.getUTCDate() === Number(match[3]) ? iso : '';
}

function recordVerificationDate(record) {
  return validIsoDate(record.verified_at)
    || validIsoDate(record.public_contact_checked_date)
    || validIsoDate(record.source_collection_date);
}

function expectedContactStatus(record) {
  const hasPhone = Boolean(String(record.public_phone ?? '').trim());
  const hasContactUrl = Boolean(publicUrl(record.public_contact_url));
  if (hasPhone && hasContactUrl) return 'public_phone_and_contact_url';
  if (hasPhone) return 'public_phone';
  if (hasContactUrl) return 'public_contact_url';
  if (record.no_public_contact_route === true) return 'no_public_contact_route';
  return '';
}

function publicSourceUrls(record) {
  return [...new Set([
    ...(Array.isArray(record.source_urls) ? record.source_urls : []),
    ...(Array.isArray(record.public_details_source_urls) ? record.public_details_source_urls : []),
    record.financial_source_url,
  ].map(publicUrl).filter(Boolean))];
}

function expectedDatasetRecord(record) {
  return {
    slug: record.slug,
    profile_url: `${SITE_URL}/gamintojas/${record.slug}/`,
    trading_name: record.trading_name?.trim() || null,
    legal_name: record.legal_name?.trim() || null,
    company_code: record.company_code?.trim() || null,
    city: record.city?.trim() || null,
    street_address: record.street_address?.trim() || null,
    postcode: record.postcode?.trim() || null,
    region_label: record.region_label?.trim() || null,
    website: publicUrl(record.website) || null,
    public_phone: record.public_phone?.trim() || null,
    contact_route_status: expectedContactStatus(record),
    categories: [...record.category_labels],
    public_source_urls: publicSourceUrls(record),
    verification_date: recordVerificationDate(record) || null,
  };
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"') quoted = true;
    else if (character === ',') {
      row.push(field);
      field = '';
    } else if (character === '\n') {
      row.push(field.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      field = '';
    } else field += character;
  }
  if (quoted) throw new Error('unterminated quoted CSV field');
  if (field || row.length) {
    row.push(field.replace(/\r$/, ''));
    rows.push(row);
  }
  return rows;
}

async function checkGeneratedAssets() {
  const jsonPath = join(publicDir, 'baldininkai-org-gamintojai.json');
  const csvPath = join(publicDir, 'baldininkai-org-gamintojai.csv');
  let dataset = [];
  try {
    const document = JSON.parse(await readFile(jsonPath, 'utf8'));
    if (!document || typeof document !== 'object' || Array.isArray(document)) {
      addError('/baldininkai-org-gamintojai.json', 'dataset must be an object with metadata and records');
    } else {
      const topLevelKeys = Object.keys(document).sort();
      if (JSON.stringify(topLevelKeys) !== JSON.stringify(['metadata', 'records'])) addError('/baldininkai-org-gamintojai.json', 'top-level keys must be exactly metadata and records');
      generatedDatasetMetadata = document.metadata;
      dataset = document.records;
    }
  } catch (error) {
    addError('/baldininkai-org-gamintojai.json', `missing or invalid JSON (${error.message})`);
  }

  const generatedDate = validIsoDate(generatedDatasetMetadata?.generated_date);
  const expectedAttribution = generatedDate
    ? `Šaltinis: Baldininkai.org viešų šaltinių Lietuvos baldų gamintojų kandidatų katalogas, ${OPEN_DATA_URL}, versija ${generatedDate}`
    : '';
  if (!generatedDatasetMetadata || typeof generatedDatasetMetadata !== 'object' || Array.isArray(generatedDatasetMetadata)) {
    addError('/baldininkai-org-gamintojai.json', 'metadata must be a non-empty object');
  } else {
    const expectedMetadataKeys = ['attribution', 'generated_date', 'license', 'open_data_url', 'source', 'source_url', 'version'];
    if (JSON.stringify(Object.keys(generatedDatasetMetadata).sort()) !== JSON.stringify(expectedMetadataKeys)) addError('/baldininkai-org-gamintojai.json', 'metadata keys do not match the documented licence/source structure');
    if (!generatedDate) addError('/baldininkai-org-gamintojai.json', 'metadata generated_date must be a valid ISO date');
    if (generatedDatasetMetadata.version !== generatedDate) addError('/baldininkai-org-gamintojai.json', 'metadata version must equal generated_date');
    if (generatedDatasetMetadata.attribution !== expectedAttribution) addError('/baldininkai-org-gamintojai.json', 'metadata attribution does not match the required dated text');
    if (generatedDatasetMetadata.source !== 'Baldininkai.org' || generatedDatasetMetadata.source_url !== SITE_URL || generatedDatasetMetadata.open_data_url !== OPEN_DATA_URL) addError('/baldininkai-org-gamintojai.json', 'metadata source URLs do not identify Baldininkai.org and the open-data page');
    const license = generatedDatasetMetadata.license;
    const expectedLicense = { name: DATASET_LICENSE_NAME, version: DATASET_LICENSE_VERSION, url: DATASET_LICENSE_URL };
    if (JSON.stringify(license) !== JSON.stringify(expectedLicense)) addError('/baldininkai-org-gamintojai.json', 'metadata license must identify CC BY 4.0 with its direct URL');
  }

  if (!Array.isArray(dataset)) addError('/baldininkai-org-gamintojai.json', 'records must be a JSON array');
  else {
    if (dataset.length !== manufacturers.length) addError('/baldininkai-org-gamintojai.json', `expected ${manufacturers.length} objects, found ${dataset.length}`);
    const sourceSlugs = new Set(manufacturers.map((record) => record.slug));
    const datasetSlugs = new Set(dataset.map((record) => record?.slug));
    if (datasetSlugs.size !== dataset.length) addError('/baldininkai-org-gamintojai.json', 'dataset slugs must be unique');
    for (const slug of sourceSlugs) if (!datasetSlugs.has(slug)) addError('/baldininkai-org-gamintojai.json', `missing source record ${slug}`);
    for (const record of dataset) {
      const source = manufacturersBySlug.get(record?.slug);
      if (!source) {
        addError('/baldininkai-org-gamintojai.json', `unexpected record ${String(record?.slug)}`);
        continue;
      }
      const expected = expectedDatasetRecord(source);
      if (JSON.stringify(record) !== JSON.stringify(expected)) addError('/baldininkai-org-gamintojai.json', `record ${source.slug} does not match source-derived fields`);
      if (!record.contact_route_status) addError('/baldininkai-org-gamintojai.json', `record ${source.slug} has no contact_route_status`);
      if (!Array.isArray(record.categories) || !Array.isArray(record.public_source_urls)) addError('/baldininkai-org-gamintojai.json', `record ${source.slug} must keep categories and public_source_urls as arrays`);
    }
  }

  try {
    const csv = await readFile(csvPath, 'utf8');
    const lines = csv.split(/\r?\n/);
    const metadataLines = [];
    while (lines[0]?.startsWith('#')) metadataLines.push(lines.shift());
    const expectedMetadataLines = [
      `# Licence: ${DATASET_LICENSE_NAME} (CC BY ${DATASET_LICENSE_VERSION}) - ${DATASET_LICENSE_URL}`,
      `# Attribution: ${expectedAttribution}`,
      `# Generated: ${generatedDate}`,
      `# Version: ${generatedDate}`,
      `# Source: Baldininkai.org - ${SITE_URL} - open data: ${OPEN_DATA_URL}`,
    ];
    if (JSON.stringify(metadataLines) !== JSON.stringify(expectedMetadataLines)) addError('/baldininkai-org-gamintojai.csv', 'comment metadata must contain the exact licence, attribution, date/version and source lines before the header');
    const rows = parseCsv(lines.join('\n'));
    const [headers, ...dataRows] = rows;
    if (JSON.stringify(headers) !== JSON.stringify(datasetHeaders)) addError('/baldininkai-org-gamintojai.csv', 'headers do not match the stable dataset header order');
    if (dataRows.length !== manufacturers.length) addError('/baldininkai-org-gamintojai.csv', `expected ${manufacturers.length} data rows, found ${dataRows.length}`);
    dataRows.forEach((row, index) => {
      const fileLine = metadataLines.length + index + 2;
      if (row.length !== datasetHeaders.length) addError('/baldininkai-org-gamintojai.csv', `row ${fileLine} has ${row.length} fields; expected ${datasetHeaders.length}`);
      const jsonRecord = dataset[index];
      if (!jsonRecord) return;
      const expectedRow = datasetHeaders.map((header) => Array.isArray(jsonRecord[header]) ? jsonRecord[header].join(' | ') : jsonRecord[header] == null ? '' : String(jsonRecord[header]));
      if (JSON.stringify(row) !== JSON.stringify(expectedRow)) addError('/baldininkai-org-gamintojai.csv', `row ${fileLine} does not match JSON record ${jsonRecord.slug}`);
    });
  } catch (error) {
    addError('/baldininkai-org-gamintojai.csv', `missing or invalid CSV (${error.message})`);
  }

  try {
    const llms = await readFile(join(publicDir, 'llms.txt'), 'utf8');
    for (const required of ['Baldininkai.org', OPEN_DATA_URL, MARKET_OVERVIEW_URL, ENGLISH_HUB_URL, ENGLISH_MARKET_OVERVIEW_URL, ENGLISH_SOURCING_GUIDE_URL, ...landingConfig.categories.map((category) => canonicalUrl(`${ENGLISH_CATEGORY_BASE_PATH}/${category.slug}`)), DATASET_JSON_URL, DATASET_CSV_URL, `${SITE_URL}/sitemap.xml`, 'English summary', 'English category pages', 'English region data cuts', 'English larger-city data cuts', 'English published-turnover data cuts', 'nepatvirtinti viešų šaltinių kandidatai', DATASET_LICENSE_NAME, 'CC BY 4.0', DATASET_LICENSE_URL, expectedAttribution]) {
      if (!llms.includes(required)) addError('/llms.txt', `missing required content: ${required}`);
    }
  } catch (error) {
    addError('/llms.txt', `missing or unreadable (${error.message})`);
  }

  try {
    const sitemap = await readFile(join(publicDir, 'sitemap.xml'), 'utf8');
    if (!sitemap.includes(`<loc>${SITE_URL}/atviri-duomenys/</loc>`)) addError('/sitemap.xml', 'missing open-data route');
    if (!sitemap.includes(`<loc>${MARKET_OVERVIEW_URL}</loc>`)) addError('/sitemap.xml', 'missing Lithuanian market-overview route');
    if (!sitemap.includes(`<loc>${ENGLISH_MARKET_OVERVIEW_URL}</loc>`)) addError('/sitemap.xml', 'missing English market-overview route');
    if (!sitemap.includes(`<loc>${ENGLISH_HUB_URL}</loc>`)) addError('/sitemap.xml', 'missing English sourcing hub');
    for (const category of landingConfig.categories) {
      const categoryUrl = canonicalUrl(`${ENGLISH_CATEGORY_BASE_PATH}/${category.slug}`);
      if (!sitemap.includes(`<loc>${categoryUrl}</loc>`)) addError('/sitemap.xml', `missing English category route ${categoryUrl}`);
    }
  } catch (error) {
    addError('/sitemap.xml', `missing or unreadable (${error.message})`);
  }

  try {
    const robots = await readFile(join(publicDir, 'robots.txt'), 'utf8');
    if (/^\s*Disallow\s*:/im.test(robots)) addError('/robots.txt', 'must not disallow any crawler path');
    for (const required of ['User-agent: *', 'Allow: /', 'Allow: /en/', 'Allow: /llms.txt', 'Allow: /atviri-duomenys/', `Allow: ${MARKET_OVERVIEW_PATH}/`, `Allow: ${ENGLISH_MARKET_OVERVIEW_PATH}/`, 'Allow: /baldininkai-org-gamintojai.json', 'Allow: /baldininkai-org-gamintojai.csv', `Sitemap: ${SITE_URL}/sitemap.xml`]) {
      if (!robots.includes(required)) addError('/robots.txt', `missing directive: ${required}`);
    }
  } catch (error) {
    addError('/robots.txt', `missing or unreadable (${error.message})`);
  }
}

await checkGeneratedAssets();

const files = await htmlFiles(publicDir);
if (!files.length) {
  console.error('SEO audit failed: no public/**/index.html files found. Run npm run build first.');
  process.exit(1);
}
const recordsByCity = new Map();
for (const record of manufacturers) {
  const city = record.city?.trim();
  if (!city) continue;
  const records = recordsByCity.get(city) ?? [];
  records.push(record);
  recordsByCity.set(city, records);
}
const expectedCities = [...recordsByCity].map(([city, records]) => ({ city, records, count: records.length, slug: slugifyLithuanian(city) }))
  .sort((a, b) => a.city.localeCompare(b.city, 'lt'));
const expectedLandingCities = expectedCities.filter((entry) => entry.count >= landingConfig.cityThreshold);
const cityRouteSet = new Set(expectedLandingCities.map((entry) => `/baldai-pagal-uzsakyma/${entry.slug}`));
const cityIndexRoute = '/baldai-pagal-uzsakyma/miestai';
const expectedEmployeeBands = ['0', '1-9', '10-49', '50-249', '250+'];
const expectedEmployeeBandLabels = new Map([
  ['0', '0 darbuotojų'],
  ['1-9', '1–9 darbuotojai'],
  ['10-49', '10–49 darbuotojai'],
  ['50-249', '50–249 darbuotojai'],
  ['250+', '250 ir daugiau darbuotojų'],
]);
const expectedEnglishEmployeeBandLabels = new Map([
  ['0', '0 employees'],
  ['1-9', '1–9 employees'],
  ['10-49', '10–49 employees'],
  ['50-249', '50–249 employees'],
  ['250+', '250 or more employees'],
]);
const expectedTurnovers = manufacturers
  .map((record) => ({ record, turnover: publishedTurnover(record) }))
  .filter((entry) => entry.turnover)
  .sort((a, b) => a.turnover.amount - b.turnover.amount);
const expectedTurnoverValues = expectedTurnovers.map((entry) => entry.turnover.amount);
const expectedTurnoverStats = {
  total: expectedTurnoverValues.reduce((total, amount) => total + amount, 0),
  median: median(expectedTurnoverValues),
  q1: median(expectedTurnoverValues.slice(0, Math.floor(expectedTurnoverValues.length / 2))),
  q3: median(expectedTurnoverValues.slice(Math.ceil(expectedTurnoverValues.length / 2))),
};
const expectedTurnoverBands = new Map([
  ['lt-100k', expectedTurnovers.filter(({ turnover }) => turnover.amount < 100_000).length],
  ['100k-500k', expectedTurnovers.filter(({ turnover }) => turnover.amount >= 100_000 && turnover.amount < 500_000).length],
  ['500k-2m', expectedTurnovers.filter(({ turnover }) => turnover.amount >= 500_000 && turnover.amount <= 2_000_000).length],
  ['gt-2m', expectedTurnovers.filter(({ turnover }) => turnover.amount > 2_000_000).length],
]);
const expectedFiscalYears = new Map(countBy(expectedTurnovers, ({ turnover }) => String(turnover.year)));
const expectedEmployeeRecords = manufacturers.filter((record) => expectedEmployeeBands.includes(record.employee_count_band));
const expectedEmployeeDistribution = new Map(expectedEmployeeBands.map((band) => [band, expectedEmployeeRecords.filter((record) => record.employee_count_band === band).length]));
const overviewYear = Number(generatedDatasetMetadata?.generated_date?.slice(0, 4));
const expectedFoundingRecords = manufacturers.filter((record) => Number.isInteger(record.founded_year) && record.founded_year >= 1800 && record.founded_year <= overviewYear);
const expectedFoundingCohorts = new Map([
  ['before-1990', expectedFoundingRecords.filter((record) => record.founded_year < 1990).length],
  ['1990s', expectedFoundingRecords.filter((record) => record.founded_year >= 1990 && record.founded_year < 2000).length],
  ['2000s', expectedFoundingRecords.filter((record) => record.founded_year >= 2000 && record.founded_year < 2010).length],
  ['2010s', expectedFoundingRecords.filter((record) => record.founded_year >= 2010 && record.founded_year < 2020).length],
  ['2020s', expectedFoundingRecords.filter((record) => record.founded_year >= 2020).length],
].filter(([, count]) => count > 0));
const expectedOldestFoundingYear = Math.min(...expectedFoundingRecords.map((record) => record.founded_year));
const expectedNewestFoundingYear = Math.max(...expectedFoundingRecords.map((record) => record.founded_year));
const expectedRegions = new Map(countBy(manufacturers, (record) => record.region_label?.trim()));
const expectedLeadingCities = countBy(manufacturers, (record) => record.city?.trim()).slice(0, 10);
const categoryPageCountsByCode = new Map(countBy(landingConfig.categories, (category) => category.code));
function manufacturerMatchesPublishedCategory(record, category) {
  const currentLabel = category.title.replace(/ pagal užsakymą$/, '');
  return record.category_codes.some((code, index) => code === category.code
    && (categoryPageCountsByCode.get(category.code) === 1 || record.category_labels[index] === currentLabel));
}
const expectedEnglishCategories = landingConfig.categories.map((category) => ({
  category,
  label: ENGLISH_CATEGORY_LABELS.get(category.slug) ?? category.title,
  route: `${ENGLISH_CATEGORY_BASE_PATH}/${category.slug}`,
  records: manufacturers
    .filter((record) => manufacturerMatchesPublishedCategory(record, category))
    .sort((a, b) => a.trading_name.localeCompare(b.trading_name, 'en')),
}));
const expectedEnglishCategoryByRoute = new Map(expectedEnglishCategories.map((entry) => [entry.route, entry]));
const expectedEnglishCategoryByLithuanianRoute = new Map(expectedEnglishCategories.map((entry) => [`/baldai-pagal-uzsakyma/${entry.category.slug}`, entry]));
const expectedCategoryMix = expectedEnglishCategories.map((entry) => ({
  code: entry.category.code,
  slug: entry.category.slug,
  count: entry.records.length,
  hrefLt: `/baldai-pagal-uzsakyma/${entry.category.slug}`,
  hrefEn: entry.route,
}));
const expectedEnglishRegionGroups = [...expectedRegions].map(([sourceLabel, count]) => {
  const metadata = ENGLISH_REGION_LABELS.get(sourceLabel);
  if (!metadata) throw new Error(`Checker has no English route metadata for region_label: ${sourceLabel}`);
  return {
    sourceLabel,
    count,
    label: metadata.label,
    path: `/en/regions/${metadata.slug}`,
    records: manufacturers.filter((record) => record.region_label?.trim() === sourceLabel),
  };
});
const expectedEnglishCityGroups = expectedCities
  .filter((entry) => entry.count >= ENGLISH_CITY_MINIMUM)
  .map((entry) => ({ ...entry, path: `/en/cities/${entry.slug}` }));
const expectedEnglishTurnoverBands = [
  { key: 'lt-100k', path: '/en/turnover/under-eur-100k', label: 'Under €100,000', includes: (amount) => amount < 100_000 },
  { key: '100k-500k', path: '/en/turnover/eur-100k-to-500k', label: '€100,000 to under €500,000', includes: (amount) => amount >= 100_000 && amount < 500_000 },
  { key: '500k-2m', path: '/en/turnover/eur-500k-to-2m', label: '€500,000 to €2 million', includes: (amount) => amount >= 500_000 && amount <= 2_000_000 },
  { key: 'gt-2m', path: '/en/turnover/over-eur-2m', label: 'Over €2 million', includes: (amount) => amount > 2_000_000 },
].map((band) => ({
  ...band,
  records: expectedTurnovers.filter(({ turnover }) => band.includes(turnover.amount)).map(({ record }) => record),
}));
const expectedEnglishListRoutes = new Map([
  ...expectedEnglishRegionGroups.map((group) => [group.path, { kind: 'region', records: group.records, group }]),
  ...expectedEnglishCityGroups.map((group) => [group.path, { kind: 'city', records: group.records, group }]),
  ...expectedEnglishTurnoverBands.map((group) => [group.path, { kind: 'turnover', records: group.records, group }]),
]);
const expectedEnglishHubRoutes = [
  ...expectedEnglishCategories.map((entry) => entry.route),
  ...expectedEnglishListRoutes.keys(),
  ENGLISH_SOURCING_GUIDE_PATH,
  ENGLISH_MARKET_OVERVIEW_PATH,
];
const expectedEnglishSuiteRoutes = [ENGLISH_HUB_PATH, ...expectedEnglishHubRoutes];
const [generatedLlms, generatedSitemap] = await Promise.all([
  readFile(join(publicDir, 'llms.txt'), 'utf8'),
  readFile(join(publicDir, 'sitemap.xml'), 'utf8'),
]);
for (const route of expectedEnglishSuiteRoutes) {
  const url = canonicalUrl(route);
  if (!generatedLlms.includes(url)) addError('/llms.txt', `missing English sourcing route ${url}`);
  if (!generatedSitemap.includes(`<loc>${url}</loc>`)) addError('/sitemap.xml', `missing English sourcing route ${url}`);
}
const expectedSnapshotRoutes = new Map([
  ...landingConfig.categories.map((category) => [
    `/baldai-pagal-uzsakyma/${category.slug}`,
    { kind: 'category', records: manufacturers.filter((record) => record.category_codes.includes(category.code)) },
  ]),
  ...expectedLandingCities.map((city) => [
    `/baldai-pagal-uzsakyma/${city.slug}`,
    { kind: 'city', records: city.records },
  ]),
]);
const landingSnapshotNote = 'Skaičiai paremti viešais šaltiniais, apima skirtingus finansinius metus ir tik šiuo metu kataloge skelbiamus gamintojų kandidatus.';
const landingSnapshotTurnoverMinimum = 3;

function escapedAttribute(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function validateLandingSnapshot(route, html, records, kind) {
  const total = records.length;
  const snapshotMarkers = [...html.matchAll(/\bdata-maker-snapshot\b/g)];
  if (snapshotMarkers.length !== 1) {
    addError(route, `expected exactly one maker snapshot, found ${snapshotMarkers.length}`);
    return;
  }
  if (!html.includes(`class="landing-snapshot" data-maker-snapshot data-snapshot-scope="${kind}" data-record-count="${total}"`)) {
    addError(route, `snapshot scope/count must be ${kind}/${total}`);
  }

  const turnoverRecords = records.map((record) => ({ record, turnover: publishedTurnover(record) })).filter((entry) => entry.turnover);
  const employeeRecords = records.filter((record) => expectedEmployeeBands.includes(record.employee_count_band));
  const foundingRecords = records.filter((record) => Number.isInteger(record.founded_year) && record.founded_year >= 1800 && record.founded_year <= overviewYear);
  const coverage = new Map([
    ['total', total],
    ['turnover', turnoverRecords.length],
    ['employees', employeeRecords.length],
    ['founded', foundingRecords.length],
  ]);
  for (const [metric, count] of coverage) {
    if (!html.includes(`data-snapshot-coverage="${metric}" data-count="${count}" data-total="${total}"`)) {
      addError(route, `snapshot ${metric} coverage must be ${count}/${total}`);
    }
    if (!visibleText(html).includes(formatPercent(count, total).replace(/\s+/g, ' '))) {
      addError(route, `snapshot ${metric} coverage is missing share ${formatPercent(count, total)}`);
    }
  }

  const expectedFiscalYearsForPage = new Map(countBy(turnoverRecords, ({ turnover }) => String(turnover.year)));
  const renderedFiscalYears = [...html.matchAll(/data-snapshot-fiscal-year="(\d{4})" data-count="(\d+)"/g)];
  if (renderedFiscalYears.length !== expectedFiscalYearsForPage.size) {
    addError(route, `snapshot expected ${expectedFiscalYearsForPage.size} fiscal-year rows, found ${renderedFiscalYears.length}`);
  }
  for (const [year, count] of expectedFiscalYearsForPage) {
    if (!html.includes(`data-snapshot-fiscal-year="${year}" data-count="${count}"`)) {
      addError(route, `snapshot fiscal year ${year} must equal ${count}`);
    }
  }
  if (!turnoverRecords.length && !html.includes('data-snapshot-fiscal-year-insufficient')) {
    addError(route, 'snapshot with no valid turnover must explain that no fiscal-year mix is available');
  }
  if (turnoverRecords.length && html.includes('data-snapshot-fiscal-year-insufficient')) {
    addError(route, 'snapshot must not claim the fiscal-year mix is unavailable when valid turnover exists');
  }

  if (turnoverRecords.length >= landingSnapshotTurnoverMinimum) {
    const values = turnoverRecords.map(({ turnover }) => turnover.amount);
    const expectedTotal = values.reduce((sum, amount) => sum + amount, 0);
    const expectedMedian = median(values);
    for (const [metric, value] of [['total', expectedTotal], ['median', expectedMedian]]) {
      if (!html.includes(`data-snapshot-turnover-stat="${metric}" data-value="${value}"`)) {
        addError(route, `snapshot turnover ${metric} must have raw value ${value}`);
      }
      if (!html.includes(formatEuro(value))) addError(route, `snapshot turnover ${metric} must show ${formatEuro(value)}`);
    }
    if (html.includes('data-snapshot-turnover-insufficient')) addError(route, 'snapshot must not show a turnover insufficiency notice with at least three valid records');

    const top = [...turnoverRecords].sort((a, b) => b.turnover.amount - a.turnover.amount
      || a.record.trading_name.localeCompare(b.record.trading_name, 'lt'))[0];
    if (!html.includes(`data-snapshot-top-maker="${escapedAttribute(top.record.slug)}" data-amount="${top.turnover.amount}" data-year="${top.turnover.year}"`)) {
      addError(route, `snapshot top maker must be ${top.record.slug} with ${top.turnover.amount} for ${top.turnover.year}`);
    }
    if (!html.includes(`data-snapshot-top-source href="${escapedAttribute(top.turnover.sourceUrl)}"`)) {
      addError(route, `snapshot top maker must link directly to its valid public source ${top.turnover.sourceUrl}`);
    }
    if (!html.includes(formatEuro(top.turnover.amount)) || !html.includes(`${top.turnover.year} finansiniai metai`)) {
      addError(route, 'snapshot top maker must visibly show its amount and fiscal year');
    }
  } else {
    if (!html.includes(`data-snapshot-turnover-insufficient data-count="${turnoverRecords.length}" data-minimum="${landingSnapshotTurnoverMinimum}"`)) {
      addError(route, `snapshot with ${turnoverRecords.length} valid turnover records must render the audited insufficiency notice`);
    }
    if (!visibleText(html).includes('Apyvartos suvestinei duomenų nepakanka') || !visibleText(html).includes('Šie dydžiai nerodomi.')) {
      addError(route, 'snapshot turnover insufficiency notice must explicitly explain that aggregate figures are not shown');
    }
    if (/data-snapshot-turnover-stat=|data-snapshot-top-maker=|data-snapshot-top-source\b/.test(html)) {
      addError(route, 'snapshot must not render turnover aggregates or a top maker with fewer than three valid turnover records');
    }
  }

  const expectedEmployeeDistribution = new Map(expectedEmployeeBands
    .map((band) => [band, employeeRecords.filter((record) => record.employee_count_band === band).length])
    .filter(([, count]) => count > 0));
  const renderedEmployeeBands = [...html.matchAll(/<li data-snapshot-employee-band="([^"]+)" data-count="(\d+)">([\s\S]*?)<\/li>/g)];
  const expectedEmployeeRows = [...expectedEmployeeDistribution];
  if (renderedEmployeeBands.length !== expectedEmployeeRows.length) {
    addError(route, `snapshot expected ${expectedEmployeeRows.length} employee-band rows, found ${renderedEmployeeBands.length}`);
  } else {
    renderedEmployeeBands.forEach(([, band, count, row], index) => {
      const [expectedBand, expectedCount] = expectedEmployeeRows[index];
      if (band !== expectedBand || Number(count) !== expectedCount) {
        addError(route, `snapshot employee row ${index + 1} must be ordered band ${expectedBand} with count ${expectedCount}`);
      }
      if (!visibleText(row).includes(expectedEmployeeBandLabels.get(expectedBand))) {
        addError(route, `snapshot employee band ${expectedBand} is missing its public label`);
      }
    });
  }
  if (!employeeRecords.length && !html.includes('data-snapshot-employee-insufficient')) addError(route, 'snapshot with no employee bands must render an insufficiency notice');
  if (employeeRecords.length && html.includes('data-snapshot-employee-insufficient')) addError(route, 'snapshot must not render an employee insufficiency notice when bands exist');

  if (foundingRecords.length) {
    const oldest = Math.min(...foundingRecords.map((record) => record.founded_year));
    const newest = Math.max(...foundingRecords.map((record) => record.founded_year));
    if (!html.includes(`data-snapshot-founding-range data-oldest="${oldest}" data-newest="${newest}"`)) {
      addError(route, `snapshot founding-year range must be ${oldest}–${newest}`);
    }
    if (html.includes('data-snapshot-founding-insufficient')) addError(route, 'snapshot must not render a founding-year insufficiency notice when valid years exist');
  } else {
    if (!html.includes('data-snapshot-founding-insufficient')) addError(route, 'snapshot with no valid founding years must render an insufficiency notice');
    if (html.includes('data-snapshot-founding-range')) addError(route, 'snapshot must not render a founding-year range without valid years');
  }

  const text = visibleText(html);
  if (!text.includes(landingSnapshotNote)) addError(route, 'snapshot is missing the exact public-source/current-catalogue/fiscal-year limitations note');
  for (const href of ['/baldu-rinkos-apzvalga/', '/atviri-duomenys/']) {
    if (!html.includes(`href="${href}"`)) addError(route, `snapshot is missing required limitations/source link ${href}`);
  }
}

function validateEnglishMakerList(route, html, schemas, expected) {
  const expectedRecords = [...expected.records].sort((a, b) => a.trading_name.localeCompare(b.trading_name, 'en'));
  const rows = [...html.matchAll(/<tr data-en-maker-row="([^"]+)">([\s\S]*?)<\/tr>/g)];
  if (rows.length !== expectedRecords.length) {
    addError(route, `expected ${expectedRecords.length} factual maker rows, found ${rows.length}`);
  } else {
    rows.forEach(([, slug, row], index) => {
      const record = expectedRecords[index];
      if (slug !== record.slug) addError(route, `row ${index + 1} must be ${record.slug}, found ${slug}`);
      if (!row.includes(`data-en-profile-link href="/gamintojas/${record.slug}/"`)) addError(route, `row ${record.slug} must link to its existing Lithuanian profile`);
      if (!row.includes(`<td data-en-city>${escapedAttribute(record.city)}</td>`)) addError(route, `row ${record.slug} must show its exact source city`);

      const employeeLabel = ENGLISH_EMPLOYEE_BAND_LABELS.get(record.employee_count_band);
      if (employeeLabel) {
        if (!row.includes(`data-en-employee="published" data-band="${escapedAttribute(record.employee_count_band)}">${employeeLabel}</span>`)) {
          addError(route, `row ${record.slug} must show its exact employee band`);
        }
        if (row.includes('data-en-employee="not-published"')) addError(route, `row ${record.slug} must not hide a known employee band`);
      } else {
        if (!row.includes(`data-en-employee="not-published">${NOT_PUBLISHED_ENGLISH}</span>`)) addError(route, `row ${record.slug} must clearly mark employee band as not published`);
        if (row.includes('data-en-employee="published"')) addError(route, `row ${record.slug} must not invent an employee band`);
      }

      const turnover = publishedTurnover(record);
      if (turnover) {
        if (!row.includes(`data-en-turnover="published" data-amount="${turnover.amount}" data-year="${turnover.year}"`)) addError(route, `row ${record.slug} must expose the exact published turnover amount and fiscal year`);
        if (!row.includes(formatEuro(turnover.amount, 'en-GB')) || !row.includes(`(${turnover.year} fiscal year)`)) addError(route, `row ${record.slug} must visibly show published turnover with fiscal year`);
        const sourceMatches = [...row.matchAll(/data-en-financial-source href="([^"]+)"/g)].map((match) => match[1]);
        if (sourceMatches.length !== 1 || sourceMatches[0] !== turnover.sourceUrl) addError(route, `row ${record.slug} must contain exactly one direct financial source link`);
        if (row.includes('data-en-turnover="not-published"')) addError(route, `row ${record.slug} must not hide valid published turnover`);
      } else {
        if (!row.includes(`data-en-turnover="not-published">${NOT_PUBLISHED_ENGLISH}</span>`)) addError(route, `row ${record.slug} must clearly mark turnover as not published`);
        if (/data-en-turnover="published"|data-en-financial-source/.test(row)) addError(route, `row ${record.slug} must not invent turnover or a financial source`);
      }

      const foundingYear = Number.isInteger(record.founded_year) && record.founded_year >= 1800 && record.founded_year <= overviewYear
        ? record.founded_year
        : null;
      if (foundingYear) {
        if (!row.includes(`data-en-founded="published">${foundingYear}</span>`)) addError(route, `row ${record.slug} must show its exact founding year`);
        if (row.includes('data-en-founded="not-published"')) addError(route, `row ${record.slug} must not hide a known founding year`);
      } else {
        if (!row.includes(`data-en-founded="not-published">${NOT_PUBLISHED_ENGLISH}</span>`)) addError(route, `row ${record.slug} must clearly mark founding year as not published`);
        if (row.includes('data-en-founded="published"')) addError(route, `row ${record.slug} must not invent a founding year`);
      }
    });
  }

  const text = visibleText(html);
  for (const required of ['Catalogue data cut', 'This is a factual data cut from the current catalogue, not a ranking', NOT_PUBLISHED_ENGLISH, 'positive amount, fiscal year and direct financial source link']) {
    if (!text.includes(required)) addError(route, `missing English list disclosure: ${required}`);
  }
  for (const href of ['/en/', '/en/sourcing-guide/', '/en/lithuanian-furniture-makers-data/', '/atviri-duomenys/']) {
    if (!html.includes(`href="${href}"`)) addError(route, `missing English suite link ${href}`);
  }
  if (expected.kind === 'turnover') {
    if (!text.includes('This is a data cut, not a ranking.') || !text.includes('Fiscal years are mixed')) addError(route, 'turnover shortlist must say it is a data cut, not a ranking, and that fiscal years are mixed');
    if (expectedRecords.some((record) => !publishedTurnover(record))) addError(route, 'turnover shortlist source membership contains a record that fails the published-turnover rule');
  }

  const collectionPages = schemasOfType(schemas, 'CollectionPage');
  if (collectionPages.length !== 1) addError(route, `expected exactly one CollectionPage schema, found ${collectionPages.length}`);
  else {
    const collectionPage = collectionPages[0];
    const expectedKeys = ['@context', '@type', 'description', 'inLanguage', 'mainEntity', 'name', 'url'];
    if (JSON.stringify(Object.keys(collectionPage).sort()) !== JSON.stringify(expectedKeys)) addError(route, 'CollectionPage schema contains missing or undocumented properties');
    if (collectionPage['@context'] !== 'https://schema.org' || collectionPage['@type'] !== 'CollectionPage' || collectionPage.url !== canonicalUrl(route) || collectionPage.inLanguage !== 'en') addError(route, 'CollectionPage schema context, type, URL or language is inaccurate');
    if (collectionPage.mainEntity?.['@id'] !== `${canonicalUrl(route)}#makers`) addError(route, 'CollectionPage mainEntity must reference the page ItemList');
    if (hasEmptySchemaValue(collectionPage)) addError(route, 'CollectionPage schema must not contain empty properties');
  }
  const itemLists = schemasOfType(schemas, 'ItemList');
  if (itemLists.length !== 1) addError(route, `expected exactly one ItemList schema, found ${itemLists.length}`);
  else {
    const itemList = itemLists[0];
    const expectedKeys = ['@context', '@id', '@type', 'itemListElement', 'itemListOrder', 'numberOfItems'];
    if (JSON.stringify(Object.keys(itemList).sort()) !== JSON.stringify(expectedKeys)) addError(route, 'ItemList schema contains missing or undocumented properties');
    if (itemList['@id'] !== `${canonicalUrl(route)}#makers` || itemList.numberOfItems !== expectedRecords.length || itemList.itemListOrder !== 'https://schema.org/ItemListOrderAscending') addError(route, 'ItemList identity, count or order is inaccurate');
    if (!Array.isArray(itemList.itemListElement) || itemList.itemListElement.length !== expectedRecords.length) addError(route, 'ItemList elements must match the factual table count');
    else itemList.itemListElement.forEach((item, index) => {
      const record = expectedRecords[index];
      const expectedItem = { '@type': 'ListItem', position: index + 1, name: record.trading_name, url: canonicalUrl(`/gamintojas/${record.slug}`) };
      if (JSON.stringify(item) !== JSON.stringify(expectedItem)) addError(route, `ItemList entry ${index + 1} must match ${record.slug}`);
    });
    if (hasEmptySchemaValue(itemList)) addError(route, 'ItemList schema must not contain empty properties');
  }
}

const counts = { breadcrumbs: 0, hubs: 0, cityIndexes: 0, profiles: 0, guideArticles: 0, faqPages: 0, marketOverviews: 0, landingSnapshots: 0, englishLists: 0, englishRegions: 0, englishCities: 0, englishTurnoverBands: 0, englishHubs: 0, englishCategories: 0, englishSourcingGuides: 0 };
const englishTitleOwners = new Map();
const englishDescriptionOwners = new Map();

for (const file of files.sort()) {
  const route = routeFor(file);
  const expectedCanonical = canonicalUrl(route);
  const html = await readFile(file, 'utf8');

  const titles = [...html.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)].map((match) => match[1].trim());
  if (titles.length !== 1 || !titles[0]) addError(route, `expected one non-empty title, found ${titles.length}`);
  else {
    const routes = titleRoutes.get(titles[0]) ?? [];
    routes.push(route);
    titleRoutes.set(titles[0], routes);
  }

  const descriptions = tags(html, 'meta').filter((tag) => attribute(tag, 'name').toLowerCase() === 'description').map((tag) => attribute(tag, 'content').trim());
  if (descriptions.length !== 1 || !descriptions[0]) addError(route, `expected one non-empty meta description, found ${descriptions.length}`);
  else {
    const routes = descriptionRoutes.get(descriptions[0]) ?? [];
    routes.push(route);
    descriptionRoutes.set(descriptions[0], routes);
  }

  const htmlTag = /<html\b[^>]*>/i.exec(html)?.[0] ?? '';
  const isEnglishRoute = route === ENGLISH_HUB_PATH || route.startsWith('/en/');
  const expectedLanguage = isEnglishRoute ? 'en' : 'lt';
  const expectedLocale = isEnglishRoute ? 'en_GB' : 'lt_LT';
  if (isEnglishRoute && titles.length === 1 && descriptions.length === 1) {
    const previousTitleRoute = englishTitleOwners.get(titles[0]);
    if (previousTitleRoute) addError(route, `English title duplicates ${previousTitleRoute}: ${titles[0]}`);
    else englishTitleOwners.set(titles[0], route);
    const previousDescriptionRoute = englishDescriptionOwners.get(descriptions[0]);
    if (previousDescriptionRoute) addError(route, `English meta description duplicates ${previousDescriptionRoute}`);
    else englishDescriptionOwners.set(descriptions[0], route);
  }
  if (attribute(htmlTag, 'lang') !== expectedLanguage) addError(route, `html lang must be "${expectedLanguage}"`);

  const canonicals = tags(html, 'link').filter((tag) => attribute(tag, 'rel').toLowerCase() === 'canonical').map((tag) => attribute(tag, 'href'));
  if (canonicals.length !== 1 || canonicals[0] !== expectedCanonical) addError(route, `canonical must be the self www URL ${expectedCanonical}`);

  const alternateLinks = tags(html, 'link').filter((tag) => attribute(tag, 'rel').toLowerCase() === 'alternate');
  const alternates = new Map(alternateLinks.map((tag) => [attribute(tag, 'hreflang'), attribute(tag, 'href')]));
  const englishCategory = expectedEnglishCategoryByRoute.get(route);
  const lithuanianCategory = expectedEnglishCategoryByLithuanianRoute.get(route);
  const englishCity = expectedEnglishCityGroups.find((group) => group.path === route);
  const lithuanianCity = expectedEnglishCityGroups.find((group) => `/baldai-pagal-uzsakyma/${group.slug}` === route);
  let expectedAlternates;
  if (route === MARKET_OVERVIEW_PATH || route === ENGLISH_MARKET_OVERVIEW_PATH) {
    expectedAlternates = new Map([['lt', MARKET_OVERVIEW_URL], ['en', ENGLISH_MARKET_OVERVIEW_URL], ['x-default', ENGLISH_MARKET_OVERVIEW_URL]]);
  } else if (route === '/' || route === ENGLISH_HUB_PATH) {
    expectedAlternates = new Map([['lt', canonicalUrl('/')], ['en', ENGLISH_HUB_URL], ['x-default', canonicalUrl('/')]]);
  } else if (englishCategory) {
    const lithuanianUrl = canonicalUrl(`/baldai-pagal-uzsakyma/${englishCategory.category.slug}`);
    expectedAlternates = new Map([['en', expectedCanonical], ['lt', lithuanianUrl], ['x-default', lithuanianUrl]]);
  } else if (lithuanianCategory) {
    expectedAlternates = new Map([['lt', expectedCanonical], ['en', canonicalUrl(lithuanianCategory.route)], ['x-default', expectedCanonical]]);
  } else if (englishCity) {
    expectedAlternates = new Map([
      ['en', canonicalUrl(englishCity.path)],
      ['lt', canonicalUrl(`/baldai-pagal-uzsakyma/${englishCity.slug}`)],
      ['x-default', canonicalUrl(englishCity.path)],
    ]);
  } else if (lithuanianCity) {
    expectedAlternates = new Map([
      ['lt', canonicalUrl(route)],
      ['en', canonicalUrl(lithuanianCity.path)],
      ['x-default', canonicalUrl(lithuanianCity.path)],
    ]);
  } else if (expectedLanguage === 'en') {
    expectedAlternates = new Map([['en', expectedCanonical], ['x-default', expectedCanonical]]);
  } else {
    expectedAlternates = new Map([['lt', expectedCanonical]]);
  }
  if (alternateLinks.length !== expectedAlternates.size || alternates.size !== expectedAlternates.size) addError(route, `expected ${expectedAlternates.size} unique hreflang alternate link(s)`);
  for (const [hreflang, href] of expectedAlternates) {
    if (alternates.get(hreflang) !== href) addError(route, `hreflang ${hreflang} must point to ${href}`);
  }

  const og = new Map(tags(html, 'meta')
    .filter((tag) => ['og:locale', 'og:title', 'og:description', 'og:url'].includes(attribute(tag, 'property').toLowerCase()))
    .map((tag) => [attribute(tag, 'property').toLowerCase(), attribute(tag, 'content')]));
  if (og.get('og:locale') !== expectedLocale) addError(route, `Open Graph locale must be ${expectedLocale}`);
  if (og.get('og:title') !== titles[0]) addError(route, 'Open Graph title is missing or does not match title');
  if (og.get('og:description') !== descriptions[0]) addError(route, 'Open Graph description is missing or does not match meta description');
  if (og.get('og:url') !== expectedCanonical) addError(route, 'Open Graph URL is missing or does not match canonical');

  const schemas = [];
  for (const script of [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]) {
    if (attribute(`<script ${script[1]}>`, 'type').toLowerCase() !== 'application/ld+json') continue;
    try {
      schemas.push(JSON.parse(script[2]));
    } catch (error) {
      addError(route, `malformed JSON-LD (${error.message})`);
    }
  }
  const types = schemas.flatMap(schemaTypes);
  const hasType = (type) => types.includes(type);
  if (!hasType('BreadcrumbList')) addError(route, 'missing BreadcrumbList schema');
  else counts.breadcrumbs += 1;

  const hasWebsite = hasType('WebSite');
  const hasSearchAction = hasType('SearchAction');
  if (route === '/') {
    if (!hasWebsite || !hasSearchAction) addError(route, 'home page must include WebSite and SearchAction schema');
  } else if (hasWebsite || hasSearchAction) {
    addError(route, 'WebSite and SearchAction schema are allowed only on the home page');
  }

  const expectedEnglishList = expectedEnglishListRoutes.get(route);
  if (expectedEnglishList) {
    counts.englishLists += 1;
    if (expectedEnglishList.kind === 'region') counts.englishRegions += 1;
    if (expectedEnglishList.kind === 'city') counts.englishCities += 1;
    if (expectedEnglishList.kind === 'turnover') counts.englishTurnoverBands += 1;
    validateEnglishMakerList(route, html, schemas, expectedEnglishList);
  }

  if (route === ENGLISH_HUB_PATH) {
    counts.englishHubs += 1;
    const text = visibleText(html);
    for (const required of [
      'Lithuanian furniture makers by category',
      'Source Lithuanian furniture makers from published catalogue data',
      `${manufacturers.length} candidate makers`,
      'existing region labels',
      `at least ${ENGLISH_CITY_MINIMUM} catalogue entries`,
      'four non-overlapping published-turnover bands',
      'without creating English maker-profile copies',
      'unverified public-source candidates',
      'not an endorsement or ranking',
      'does not guarantee identity, accuracy, quality, capacity, pricing, timing, availability, service coverage or suitability for a project',
      'Sodra-derived employee bands',
      'Creative Commons Attribution 4.0 International (CC BY 4.0)',
    ]) {
      if (!text.includes(required)) addError(route, `missing English hub evidence: ${required}`);
    }
    for (const href of ['/', '/atviri-duomenys/', DATASET_LICENSE_URL, ...expectedEnglishHubRoutes.map((expectedRoute) => `${expectedRoute}/`)]) {
      if (!html.includes(`href="${href}"`)) addError(route, `English hub is missing required link ${href}`);
    }
    const expectedCoverage = new Map([
      ['total', manufacturers.length],
      ['turnover', expectedTurnovers.length],
      ['employees', expectedEmployeeRecords.length],
      ['founded', expectedFoundingRecords.length],
    ]);
    for (const [metric, count] of expectedCoverage) {
      if (!html.includes(`data-en-hub-coverage="${metric}" data-count="${count}"`)) addError(route, `English hub coverage ${metric} must equal ${count}`);
      if (!text.includes(formatPercent(count, manufacturers.length, 'en-GB').replace(/\s+/g, ' '))) addError(route, `English hub coverage ${metric} is missing share ${formatPercent(count, manufacturers.length, 'en-GB')}`);
    }
    const categoryRows = [...html.matchAll(/<tr data-en-hub-category="([^"]+)" data-count="(\d+)">([\s\S]*?)<\/tr>/g)];
    if (categoryRows.length !== expectedEnglishCategories.length) addError(route, `expected ${expectedEnglishCategories.length} English category links, found ${categoryRows.length}`);
    else categoryRows.forEach(([, slug, count, row], index) => {
      const expected = expectedEnglishCategories[index];
      if (slug !== expected.category.slug || Number(count) !== expected.records.length) addError(route, `English hub category row ${index + 1} does not match ${expected.category.slug}`);
      if (!row.includes(`href="${expected.route}/"`) || !visibleText(row).includes(expected.label)) addError(route, `English hub category ${expected.category.slug} must link to ${expected.route}/ with its English label`);
    });

    const collectionPages = schemasOfType(schemas, 'CollectionPage');
    const itemLists = schemasOfType(schemas, 'ItemList');
    if (collectionPages.length !== 1) addError(route, `expected exactly one hub CollectionPage schema, found ${collectionPages.length}`);
    else {
      const page = collectionPages[0];
      if (page.name !== 'Lithuanian furniture makers by category and published data cuts' || page.description !== descriptions[0] || page.url !== ENGLISH_HUB_URL || page.inLanguage !== 'en' || page.mainEntity?.['@id'] !== `${ENGLISH_HUB_URL}#sections`) addError(route, 'hub CollectionPage name, description, URL, language or mainEntity is inaccurate');
      if (hasEmptySchemaValue(page)) addError(route, 'hub CollectionPage schema must not contain empty properties');
    }
    if (itemLists.length !== 1) addError(route, `expected exactly one hub ItemList schema, found ${itemLists.length}`);
    else {
      const itemList = itemLists[0];
      const expectedHubUrls = expectedEnglishHubRoutes.map(canonicalUrl);
      const actualHubUrls = Array.isArray(itemList.itemListElement) ? itemList.itemListElement.map((item) => item.url) : [];
      if (itemList['@id'] !== `${ENGLISH_HUB_URL}#sections` || itemList.numberOfItems !== expectedHubUrls.length) addError(route, 'hub ItemList identity or count is inaccurate');
      if (JSON.stringify(actualHubUrls) !== JSON.stringify(expectedHubUrls)) addError(route, 'hub ItemList route order or membership is inaccurate');
      if (hasEmptySchemaValue(itemList)) addError(route, 'hub ItemList schema must not contain empty properties');
    }
  }

  const expectedEnglishCategory = expectedEnglishCategoryByRoute.get(route);
  if (expectedEnglishCategory) {
    counts.englishCategories += 1;
    const { category, label, records } = expectedEnglishCategory;
    const text = visibleText(html);
    for (const required of [
      `${label} makers in Lithuania`,
      `${records.length} candidate makers`,
      'Not published',
      'Alphabetical by company name; not ranked.',
      'Listings are unverified public-source candidates.',
      'not an endorsement or ranking',
      'Creative Commons Attribution 4.0 International (CC BY 4.0)',
    ]) {
      if (!text.includes(required)) addError(route, `missing English category evidence: ${required}`);
    }
    const lithuanianPath = `/baldai-pagal-uzsakyma/${category.slug}/`;
    for (const href of ['/en/', lithuanianPath, '/atviri-duomenys/', DATASET_LICENSE_URL]) {
      if (!html.includes(`href="${href}"`)) addError(route, `missing required English category link ${href}`);
    }
    const makerRows = [...html.matchAll(/<tr data-en-category-maker="([^"]+)">([\s\S]*?)<\/tr>/g)];
    if (makerRows.length !== records.length) addError(route, `expected ${records.length} source-matched maker rows, found ${makerRows.length}`);
    else makerRows.forEach(([, slug, row], index) => {
      const record = records[index];
      const rowText = visibleText(row);
      if (slug !== record.slug) addError(route, `maker row ${index + 1} must be ${record.slug}, found ${slug}`);
      if (!row.includes(`href="/gamintojas/${record.slug}/"`) || !rowText.includes(record.trading_name)) addError(route, `maker ${record.slug} must link to its existing Lithuanian profile`);
      if (!rowText.includes(record.city)) addError(route, `maker ${record.slug} must show city ${record.city}`);
      const expectedRegion = record.region_label?.trim() ? (ENGLISH_REGION_LABELS.get(record.region_label.trim())?.label ?? record.region_label.trim()) : 'Region not published';
      if (!rowText.includes(expectedRegion)) addError(route, `maker ${record.slug} must show its source region or explicit absence`);

      const employeeLabel = expectedEnglishEmployeeBandLabels.get(record.employee_count_band);
      if (employeeLabel) {
        if (!row.includes(`data-en-employee-status="published" data-band="${record.employee_count_band}"`) || !rowText.includes(employeeLabel)) addError(route, `maker ${record.slug} must show employee band ${record.employee_count_band}`);
      } else if (!row.includes('data-en-employee-status="not-published"') || !rowText.includes('Not published')) {
        addError(route, `maker ${record.slug} must explicitly mark employee band not published`);
      }

      const turnover = publishedTurnover(record);
      if (turnover) {
        if (!row.includes(`data-en-turnover-status="published" data-amount="${turnover.amount}" data-year="${turnover.year}"`) || !rowText.includes(formatEuro(turnover.amount, 'en-GB')) || !rowText.includes(`Fiscal year ${turnover.year}`) || !row.includes(`href="${turnover.sourceUrl}"`)) addError(route, `maker ${record.slug} must show valid published turnover amount, year and direct source`);
      } else if (!row.includes('data-en-turnover-status="not-published"') || !rowText.includes('Not published')) {
        addError(route, `maker ${record.slug} must explicitly mark turnover not published`);
      }

      const foundingYear = Number.isInteger(record.founded_year) && record.founded_year >= 1800 && record.founded_year <= overviewYear ? record.founded_year : null;
      if (foundingYear) {
        if (!row.includes(`data-en-founding-status="published" data-year="${foundingYear}"`) || !rowText.includes(String(foundingYear))) addError(route, `maker ${record.slug} must show founding year ${foundingYear}`);
      } else if (!row.includes('data-en-founding-status="not-published"') || !rowText.includes('Not published')) {
        addError(route, `maker ${record.slug} must explicitly mark founding year not published`);
      }
    });

    const collectionPages = schemasOfType(schemas, 'CollectionPage');
    const itemLists = schemasOfType(schemas, 'ItemList');
    if (collectionPages.length !== 1) addError(route, `expected exactly one CollectionPage schema, found ${collectionPages.length}`);
    if (itemLists.length !== 1) addError(route, `expected exactly one ItemList schema, found ${itemLists.length}`);
    const collection = collectionPages[0];
    const itemList = itemLists[0];
    const itemListId = `${expectedCanonical}#makers`;
    if (collection && (collection.name !== `${label} makers in Lithuania` || collection.description !== descriptions[0] || collection.url !== expectedCanonical || collection.inLanguage !== 'en' || collection.mainEntity?.['@id'] !== itemListId)) addError(route, 'English category CollectionPage schema does not match the visible canonical collection');
    if (collection && Object.values(collection).some((value) => value === '' || value == null)) addError(route, 'English category CollectionPage schema contains an empty property');
    if (itemList) {
      if (itemList['@id'] !== itemListId || itemList.numberOfItems !== records.length || !Array.isArray(itemList.itemListElement) || itemList.itemListElement.length !== records.length) addError(route, 'English category ItemList count or identity is inaccurate');
      else itemList.itemListElement.forEach((item, index) => {
        const record = records[index];
        if (item?.['@type'] !== 'ListItem' || item.position !== index + 1 || item.name !== record.trading_name || item.url !== canonicalUrl(`/gamintojas/${record.slug}`)) addError(route, `English category ItemList entry ${index + 1} does not match ${record.slug}`);
      });
    }
  }

  if (route === ENGLISH_SOURCING_GUIDE_PATH) {
    counts.englishSourcingGuides += 1;
    const text = visibleText(html);
    for (const required of [
      'Catalogue scope and limits',
      'Published turnover and fiscal year',
      'positive amount, a fiscal year and a direct financial source link',
      'values from different years are not a like-for-like single-period comparison',
      'Sodra-derived employee bands',
      'not proof of production capacity',
      'Founding year',
      'Build a shortlist without treating the catalogue as a ranking',
      'Questions to ask a maker',
      'does not guarantee identity, current accuracy, product quality, production capacity, price, lead time, availability, service coverage or suitability for a project',
      'Creative Commons Attribution 4.0 International (CC BY 4.0)',
      generatedDatasetMetadata?.attribution,
    ]) {
      if (!required || !text.includes(required)) addError(route, `missing English sourcing-guide evidence: ${String(required)}`);
    }
    for (const href of ['/en/', '/en/lithuanian-furniture-makers-data/', '/atviri-duomenys/', DATASET_LICENSE_URL]) {
      if (!html.includes(`href="${href}"`)) addError(route, `sourcing guide is missing allowed source or suite link ${href}`);
    }
    const articles = schemasOfType(schemas, 'Article');
    const guideArticle = articles.find((article) => article.url === ENGLISH_SOURCING_GUIDE_URL);
    if (!guideArticle) addError(route, 'missing Article schema for the English sourcing guide');
    else {
      const expectedKeys = ['@context', '@type', 'author', 'dateModified', 'datePublished', 'description', 'headline', 'inLanguage', 'mainEntityOfPage', 'publisher', 'url'];
      if (JSON.stringify(Object.keys(guideArticle).sort()) !== JSON.stringify(expectedKeys)) addError(route, 'English sourcing-guide Article schema contains missing or undocumented properties');
      if (guideArticle['@context'] !== 'https://schema.org' || guideArticle['@type'] !== 'Article' || guideArticle.url !== ENGLISH_SOURCING_GUIDE_URL || guideArticle.mainEntityOfPage !== ENGLISH_SOURCING_GUIDE_URL || guideArticle.inLanguage !== 'en') addError(route, 'English sourcing-guide Article schema context, type, URL or language is inaccurate');
      if (!validIsoDate(guideArticle.datePublished) || guideArticle.datePublished !== generatedDatasetMetadata?.generated_date || guideArticle.dateModified !== generatedDatasetMetadata?.generated_date) addError(route, 'English sourcing-guide Article dates must match the generated build date');
      if (hasEmptySchemaValue(guideArticle)) addError(route, 'English sourcing-guide Article schema must not contain empty properties');
    }
  }

  const isCityIndex = route === cityIndexRoute;
  const isHub = route.startsWith('/baldai-pagal-uzsakyma/') && !isCityIndex;
  if (isCityIndex) {
    counts.cityIndexes += 1;
    if (!hasType('ItemList')) addError(route, 'all-cities index is missing ItemList schema');
    const entries = [...html.matchAll(/<li class="city-index-item" data-city-count="(\d+)"><a href="([^"]+)">/g)]
      .map((match) => ({ count: Number(match[1]), href: match[2] }));
    if (entries.length !== expectedCities.length) {
      addError(route, `expected ${expectedCities.length} city index entries, found ${entries.length}`);
    } else {
      entries.forEach((entry, index) => {
        const expected = expectedCities[index];
        const expectedHref = expected.count >= landingConfig.cityThreshold
          ? `/baldai-pagal-uzsakyma/${expected.slug}/`
          : `/gamintojas/${expected.records[0].slug}/`;
        if (entry.count !== expected.count || entry.href !== expectedHref) {
          addError(route, `entry ${index + 1} for ${expected.city} must have count ${expected.count} and href ${expectedHref}`);
        }
      });
    }
  }
  if (isHub) {
    counts.hubs += 1;
    if (lithuanianCategory && !html.includes(`href="${lithuanianCategory.route}/"`)) addError(route, `Lithuanian category page must visibly link to ${lithuanianCategory.route}/`);
    if (!hasType('ItemList')) addError(route, 'category/city hub is missing ItemList schema');
    if (!hasType('FAQPage')) addError(route, 'category/city hub is missing FAQPage schema');

    const guidance = hubGuidance(html);
    const guidanceWords = lithuanianWordCount(guidance);
    if (guidanceWords < 400) addError(route, `buyer guidance has ${guidanceWords} visible words; expected at least 400`);
    if (!/[ąčęėįšųūž]/i.test(guidance) || !/\b(?:kad|ir|yra|bei|ar|su|į|nuo|pagal)\b/i.test(guidance)) {
      addError(route, 'buyer guidance does not appear to be substantive Lithuanian copy');
    }
    if (guidance) {
      const normalized = guidance.toLocaleLowerCase('lt-LT').replace(/\s+/g, ' ').trim();
      const routes = hubGuidanceRoutes.get(normalized) ?? [];
      routes.push(route);
      hubGuidanceRoutes.set(normalized, routes);
    }

    const faqEntries = visibleFaqEntries(html);
    if (faqEntries < 3 || faqEntries > 5) addError(route, `visible FAQ must contain 3–5 complete Q&A entries; found ${faqEntries}`);
    if (faqEntries >= 3 && faqEntries <= 5 && !validFaqPage(schemas, faqEntries)) {
      addError(route, 'FAQPage schema must contain the same number of complete Question/Answer entries as the visible FAQ');
    }

    if (cityRouteSet.has(route)) {
      const intro = /<section\b[^>]*class=(['"])[^'"]*\blanding-hero\b[^'"]*\1[^>]*>[\s\S]*?<p\b[^>]*class=(['"])[^'"]*\blead\b[^'"]*\2[^>]*>([\s\S]*?)<\/p>/i.exec(html)?.[3] ?? '';
      const faq = /<section\b[^>]*class=(['"])[^'"]*\blanding-faq\b[^'"]*\1[^>]*>([\s\S]*?)<\/section>/i.exec(html)?.[2] ?? '';
      addNormalizedRoute(cityIntroRoutes, visibleText(intro), route);
      addNormalizedRoute(cityFaqRoutes, visibleText(faq), route);
    }
  }

  const expectedSnapshot = expectedSnapshotRoutes.get(route);
  if (expectedSnapshot) {
    counts.landingSnapshots += 1;
    validateLandingSnapshot(route, html, expectedSnapshot.records, expectedSnapshot.kind);
  }

  const isProfile = route.startsWith('/gamintojas/');
  if (isProfile) {
    counts.profiles += 1;
    const profileEntity = schemas.find((schema) => {
      const schemaTypes = Array.isArray(schema['@type']) ? schema['@type'] : [schema['@type']];
      return schema['@id'] === `${expectedCanonical}#entity`
        && (schemaTypes.includes('Organization') || schemaTypes.includes('LocalBusiness'));
    });
    if (!profileEntity) addError(route, 'manufacturer profile is missing its Organization or LocalBusiness schema');
    else {
      const slug = route.split('/').filter(Boolean)[1];
      const source = manufacturersBySlug.get(slug);
      if (!source) addError(route, 'profile route has no matching source record');
      else {
        if (profileEntity.url !== expectedCanonical) addError(route, 'profile schema url must be the non-empty canonical profile URL');
        const expectedWebsite = publicUrl(source.website);
        const sameAs = Array.isArray(profileEntity.sameAs) ? profileEntity.sameAs : [];
        if (expectedWebsite && !sameAs.includes(expectedWebsite)) addError(route, 'profile schema must include the valid source website in sameAs');
        if (!expectedWebsite && ('sameAs' in profileEntity || sameAs.some((value) => !String(value).trim()))) addError(route, 'profile schema must omit sameAs when no valid website exists');
        const expectedPhone = source.public_phone?.trim() || '';
        if (expectedPhone && profileEntity.telephone !== expectedPhone) addError(route, 'profile schema telephone must match public_phone');
        if (!expectedPhone && 'telephone' in profileEntity) addError(route, 'profile schema must omit telephone when public_phone is empty');
        const expectedDate = recordVerificationDate(source);
        if (expectedDate && profileEntity.dateModified !== expectedDate) addError(route, 'profile schema dateModified must use an actual source record date');
        if (!expectedDate && 'dateModified' in profileEntity) addError(route, 'profile schema must omit dateModified when no valid source record date exists');

        const turnover = publishedTurnover(source);
        const turnoverRows = [...html.matchAll(/<dt>Apyvarta \((\d{4}) m\.\)<\/dt><dd>([\s\S]*?)<\/dd><\/div>/g)];
        if (!turnover) {
          if (turnoverRows.length) addError(route, 'profile must not render turnover without published positive revenue, a fiscal year, and a public financial source URL');
        } else {
          if (turnoverRows.length !== 1 || Number(turnoverRows[0]?.[1]) !== turnover.year) {
            addError(route, `profile must render exactly one Apyvarta (${turnover.year} m.) row for published turnover`);
          } else {
            const turnoverHtml = turnoverRows[0][2];
            if (!turnoverHtml.includes(formatEuro(turnover.amount))) addError(route, 'profile turnover row must show the formatted published euro amount');
            if (!turnoverHtml.includes(`href="${turnover.sourceUrl}"`) || !/Atverti apyvartos šaltinį/.test(turnoverHtml)) {
              addError(route, 'profile turnover row must link its public financial source with the source label');
            }
          }
        }
      }
    }
  }

  if (route === '/atviri-duomenys') {
    const text = visibleText(html);
    for (const required of ['Atviri Baldininkai.org duomenys', 'JSON duomenų rinkinys', 'CSV duomenų rinkinys', 'no_public_contact_route', 'Ribotumai', 'Licencija ir priskyrimas', DATASET_LICENSE_NAME, 'CC BY 4.0', 'versija 4.0', 'This dataset is licensed under Creative Commons Attribution 4.0 International (CC BY 4.0).', generatedDatasetMetadata?.attribution]) {
      if (!required || !text.includes(required)) addError(route, `missing open-data content: ${String(required)}`);
    }
    if (!html.includes('href="/baldininkai-org-gamintojai.json"') || !html.includes('href="/baldininkai-org-gamintojai.csv"')) addError(route, 'missing dataset download links');
    if (!html.includes('href="/baldu-rinkos-apzvalga"')) addError(route, 'missing market-overview link');
    if (!html.includes('href="/en/lithuanian-furniture-makers-data/"')) addError(route, 'missing English sector-data link');
    if (!html.includes(`href="${DATASET_LICENSE_URL}"`)) addError(route, 'missing direct CC BY 4.0 licence link');

    const datasetSchemas = schemasOfType(schemas, 'Dataset');
    if (datasetSchemas.length !== 1) addError(route, `expected exactly one Dataset schema, found ${datasetSchemas.length}`);
    else {
      const datasetSchema = datasetSchemas[0];
      const expectedKeys = ['@context', '@type', 'creator', 'dateModified', 'datePublished', 'description', 'distribution', 'inLanguage', 'keywords', 'license', 'name', 'publisher', 'spatialCoverage', 'url'];
      if (JSON.stringify(Object.keys(datasetSchema).sort()) !== JSON.stringify(expectedKeys)) addError(route, 'Dataset schema contains missing or undocumented properties');
      if (datasetSchema['@context'] !== 'https://schema.org' || datasetSchema['@type'] !== 'Dataset') addError(route, 'Dataset schema context/type must be schema.org Dataset');
      if (datasetSchema.name !== 'Baldininkai.org viešų šaltinių Lietuvos baldų gamintojų kandidatų katalogas') addError(route, 'Dataset schema name is missing or inaccurate');
      if (typeof datasetSchema.description !== 'string' || !datasetSchema.description.trim()) addError(route, 'Dataset schema description must be non-empty');
      if (datasetSchema.url !== OPEN_DATA_URL) addError(route, `Dataset schema url must be ${OPEN_DATA_URL}`);
      if (datasetSchema.license !== DATASET_LICENSE_URL) addError(route, 'Dataset schema license must be the direct CC BY 4.0 URL');
      for (const role of ['creator', 'publisher']) {
        const organization = datasetSchema[role];
        if (JSON.stringify(organization) !== JSON.stringify({ '@type': 'Organization', name: 'Baldininkai.org', url: SITE_URL })) addError(route, `Dataset schema ${role} must accurately identify Baldininkai.org`);
      }
      if (datasetSchema.inLanguage !== 'lt') addError(route, 'Dataset schema inLanguage must be lt');
      if (datasetSchema.spatialCoverage !== 'Lithuania') addError(route, 'Dataset schema spatialCoverage must be Lithuania');
      if (!Array.isArray(datasetSchema.keywords) || datasetSchema.keywords.length < 3 || datasetSchema.keywords.some((keyword) => typeof keyword !== 'string' || !keyword.trim())) addError(route, 'Dataset schema keywords must be a non-empty list of suitable terms');
      if (!validIsoDate(datasetSchema.dateModified) || datasetSchema.dateModified !== generatedDatasetMetadata?.generated_date) addError(route, 'Dataset schema dateModified must match the generated build date');
      if (!validIsoDate(datasetSchema.datePublished) || datasetSchema.datePublished !== generatedDatasetMetadata?.generated_date) addError(route, 'Dataset schema datePublished must match the generated build date');
      if (!Array.isArray(datasetSchema.distribution) || datasetSchema.distribution.length !== 2) addError(route, 'Dataset schema must contain exactly two DataDownload distributions');
      else {
        const expectedDistributions = new Map([
          [DATASET_JSON_URL, 'application/json'],
          [DATASET_CSV_URL, 'text/csv'],
        ]);
        for (const distribution of datasetSchema.distribution) {
          if (JSON.stringify(Object.keys(distribution).sort()) !== JSON.stringify(['@type', 'contentUrl', 'encodingFormat'])) addError(route, 'DataDownload distribution contains missing or undocumented properties');
          if (distribution['@type'] !== 'DataDownload') addError(route, 'each Dataset distribution must be a DataDownload');
          const expectedFormat = expectedDistributions.get(distribution.contentUrl);
          if (!expectedFormat || distribution.encodingFormat !== expectedFormat) addError(route, `invalid Dataset download URL or encodingFormat: ${String(distribution.contentUrl)}`);
          else expectedDistributions.delete(distribution.contentUrl);
        }
        if (expectedDistributions.size) addError(route, 'Dataset schema is missing a required JSON or CSV download URL');
      }
    }
  }

  if (route === MARKET_OVERVIEW_PATH) {
    counts.marketOverviews += 1;
    const text = visibleText(html);
    for (const required of [
      'Lietuvos baldų gamintojų katalogo rinkos apžvalga',
      'Katalogo aprėptis',
      'Paskelbta apyvarta',
      'Finansinių metų pasiskirstymas',
      'Darbuotojų grupės',
      'Įkūrimo metų grupės',
      'Geografija',
      'Kategorijų pjūvis',
      'Metodika ir ribotumai',
      'vieši registrai ir vieši įmonių puslapiai',
      'nepatvirtinti viešų šaltinių kandidatai',
      'ne oficiali Lietuvos baldų rinkos ar nacionalinė statistika',
      'finansiniai metai yra mišrūs',
      'nėra reitingas ar rekomendacija',
      'Creative Commons Attribution 4.0 International (CC BY 4.0)',
      generatedDatasetMetadata?.attribution,
    ]) {
      if (!required || !text.includes(required)) addError(route, `missing market-overview evidence: ${String(required)}`);
    }

    for (const href of ['/atviri-duomenys/', '/baldininkai-org-gamintojai.json', '/baldininkai-org-gamintojai.csv']) {
      if (!html.includes(`href="${href}"`)) addError(route, `missing required direct data link ${href}`);
    }
    if (!html.includes(`href="${DATASET_LICENSE_URL}"`)) addError(route, 'missing direct CC BY 4.0 licence link');
    if (!html.includes('href="/en/lithuanian-furniture-makers-data/"')) addError(route, 'missing visible English overview link');

    const expectedCoverage = new Map([
      ['total', manufacturers.length],
      ['turnover', expectedTurnovers.length],
      ['employees', expectedEmployeeRecords.length],
      ['founded', expectedFoundingRecords.length],
    ]);
    for (const [metric, count] of expectedCoverage) {
      if (!html.includes(`data-market-coverage="${metric}" data-count="${count}"`)) addError(route, `coverage ${metric} must equal ${count}`);
      if (!text.includes(formatPercent(count, manufacturers.length).replace(/\s+/g, ' '))) addError(route, `coverage ${metric} is missing share ${formatPercent(count, manufacturers.length)}`);
    }

    for (const [metric, amount] of Object.entries(expectedTurnoverStats)) {
      const stat = new RegExp(`<div data-market-turnover-stat="${metric}">[\\s\\S]*?${formatEuro(amount).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?<\\/div>`);
      if (!stat.test(html)) addError(route, `turnover ${metric} must show ${formatEuro(amount)}`);
    }
    for (const [band, count] of expectedTurnoverBands) {
      if (!html.includes(`data-market-turnover-band="${band}" data-count="${count}"`)) addError(route, `turnover band ${band} must equal ${count}`);
    }
    for (const [year, count] of expectedFiscalYears) {
      if (!html.includes(`data-market-fiscal-year="${year}" data-count="${count}"`)) addError(route, `fiscal year ${year} must equal ${count}`);
    }

    const expectedTopTurnovers = [...expectedTurnovers].sort((a, b) => b.turnover.amount - a.turnover.amount).slice(0, 10);
    const topRows = [...html.matchAll(/<tr data-market-top-turnover="([^"]+)">([\s\S]*?)<\/tr>/g)];
    if (topRows.length !== expectedTopTurnovers.length) addError(route, `expected ${expectedTopTurnovers.length} top-turnover rows, found ${topRows.length}`);
    else topRows.forEach(([, slug, row], index) => {
      const expected = expectedTopTurnovers[index];
      if (slug !== expected.record.slug) addError(route, `top-turnover row ${index + 1} must be ${expected.record.slug}`);
      if (!row.includes(formatEuro(expected.turnover.amount)) || !row.includes(`>${expected.turnover.year}<`) || !row.includes(`href="${expected.turnover.sourceUrl}"`)) {
        addError(route, `top-turnover row ${expected.record.slug} must include its amount, fiscal year and direct source`);
      }
    });

    for (const [band, count] of expectedEmployeeDistribution) {
      if (!html.includes(`data-market-employee-band="${band}" data-count="${count}"`)) addError(route, `employee band ${band} must equal ${count}`);
    }
    for (const [cohort, count] of expectedFoundingCohorts) {
      if (!html.includes(`data-market-founding-cohort="${cohort}" data-count="${count}"`)) addError(route, `founding cohort ${cohort} must equal ${count}`);
    }
    if (!html.includes(`data-market-founding-edge="oldest">${expectedOldestFoundingYear}<`) || !html.includes(`data-market-founding-edge="newest">${expectedNewestFoundingYear}<`)) {
      addError(route, `founding-year edges must be ${expectedOldestFoundingYear} and ${expectedNewestFoundingYear}`);
    }
    for (const [region, count] of expectedRegions) {
      const escapedRegion = region.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      if (!html.includes(`data-market-region="${escapedRegion}" data-count="${count}"`)) addError(route, `region ${region} must equal ${count}`);
    }
    for (const [city, count] of expectedLeadingCities) {
      const escapedCity = city.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      if (!html.includes(`data-market-city="${escapedCity}" data-count="${count}"`)) addError(route, `leading city ${city} must equal ${count}`);
      const expectedCity = expectedLandingCities.find((entry) => entry.city === city);
      if (expectedCity && !html.includes(`href="/baldai-pagal-uzsakyma/${expectedCity.slug}"`)) addError(route, `eligible leading city ${city} must link to its current route`);
    }
    for (const category of expectedCategoryMix) {
      const row = new RegExp(`<tr data-market-category="${category.slug}" data-code="${category.code}" data-count="${category.count}">([\\s\\S]*?)<\\/tr>`).exec(html)?.[1] ?? '';
      if (!row || !row.includes(`href="${category.hrefLt}"`)) addError(route, `category ${category.slug} must show count ${category.count} and link to ${category.hrefLt}`);
    }

    const articles = schemasOfType(schemas, 'Article');
    const overviewArticle = articles.find((article) => article.url === MARKET_OVERVIEW_URL);
    if (!overviewArticle) addError(route, 'missing Article schema for the market-overview canonical URL');
    else {
      for (const key of ['headline', 'description', 'inLanguage', 'datePublished', 'dateModified']) {
        if (typeof overviewArticle[key] !== 'string' || !overviewArticle[key].trim()) addError(route, `Article schema ${key} must be non-empty`);
      }
      if (overviewArticle.mainEntityOfPage !== MARKET_OVERVIEW_URL || overviewArticle.inLanguage !== 'lt-LT') addError(route, 'Article schema canonical page or language is inaccurate');
      if (!validIsoDate(overviewArticle.datePublished) || !validIsoDate(overviewArticle.dateModified)) addError(route, 'Article schema dates must be valid ISO dates');
    }
  }

  if (route === ENGLISH_MARKET_OVERVIEW_PATH) {
    counts.marketOverviews += 1;
    const text = visibleText(html);
    for (const required of [
      'Lithuanian furniture makers: catalogue data overview',
      'Browse the English sourcing pages',
      'Catalogue coverage',
      'public registers and public business pages',
      'Combined published turnover',
      'Median',
      'Turnover size bands',
      'Fiscal-year mix',
      'Employee distribution',
      'Founding-year distribution',
      'Regional split',
      'Category split',
      'Top makers by published turnover',
      'factual table',
      'This is catalogue coverage, not official Lithuanian national or furniture-market statistics.',
      'Listings are unverified public-source candidates.',
      'not an endorsement, ranking or guarantee',
      'Creative Commons Attribution 4.0 International (CC BY 4.0)',
      generatedDatasetMetadata?.attribution,
    ]) {
      if (!required || !text.includes(required)) addError(route, `missing English market-overview evidence: ${String(required)}`);
    }

    for (const href of ['/en/', '/en/sourcing-guide/', '/atviri-duomenys/', '/baldu-rinkos-apzvalga/', '/baldininkai-org-gamintojai.json', '/baldininkai-org-gamintojai.csv']) {
      if (!html.includes(`href="${href}"`)) addError(route, `missing required direct data or related-page link ${href}`);
    }
    if (!html.includes(`href="${DATASET_LICENSE_URL}"`)) addError(route, 'missing direct CC BY 4.0 licence link');

    const expectedCoverage = new Map([
      ['total', manufacturers.length],
      ['turnover', expectedTurnovers.length],
      ['employees', expectedEmployeeRecords.length],
      ['founded', expectedFoundingRecords.length],
    ]);
    for (const [metric, count] of expectedCoverage) {
      if (!html.includes(`data-market-coverage="${metric}" data-count="${count}"`)) addError(route, `coverage ${metric} must equal ${count}`);
      if (!text.includes(formatPercent(count, manufacturers.length, 'en-GB').replace(/\s+/g, ' '))) addError(route, `coverage ${metric} is missing share ${formatPercent(count, manufacturers.length, 'en-GB')}`);
    }

    for (const [metric, amount] of Object.entries(expectedTurnoverStats)) {
      const stat = new RegExp(`<div data-market-turnover-stat="${metric}">[\\s\\S]*?${formatEuro(amount, 'en-GB').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?<\\/div>`);
      if (!stat.test(html)) addError(route, `turnover ${metric} must show ${formatEuro(amount, 'en-GB')}`);
    }
    for (const [band, count] of expectedTurnoverBands) {
      if (!html.includes(`data-market-turnover-band="${band}" data-count="${count}"`)) addError(route, `turnover band ${band} must equal ${count}`);
    }
    for (const [year, count] of expectedFiscalYears) {
      if (!html.includes(`data-market-fiscal-year="${year}" data-count="${count}"`)) addError(route, `fiscal year ${year} must equal ${count}`);
    }

    const expectedTopTurnovers = [...expectedTurnovers].sort((a, b) => b.turnover.amount - a.turnover.amount).slice(0, 10);
    const topRows = [...html.matchAll(/<tr data-market-top-turnover="([^"]+)">([\s\S]*?)<\/tr>/g)];
    if (topRows.length !== expectedTopTurnovers.length) addError(route, `expected ${expectedTopTurnovers.length} top-turnover rows, found ${topRows.length}`);
    else topRows.forEach(([, slug, row], index) => {
      const expected = expectedTopTurnovers[index];
      if (slug !== expected.record.slug) addError(route, `top-turnover row ${index + 1} must be ${expected.record.slug}`);
      if (!row.includes(formatEuro(expected.turnover.amount, 'en-GB')) || !row.includes(`>${expected.turnover.year}<`) || !row.includes(`href="${expected.turnover.sourceUrl}"`)) {
        addError(route, `top-turnover row ${expected.record.slug} must include its amount, fiscal year and direct source`);
      }
    });

    for (const [band, count] of expectedEmployeeDistribution) {
      if (!html.includes(`data-market-employee-band="${band}" data-count="${count}"`)) addError(route, `employee band ${band} must equal ${count}`);
    }
    for (const [cohort, count] of expectedFoundingCohorts) {
      if (!html.includes(`data-market-founding-cohort="${cohort}" data-count="${count}"`)) addError(route, `founding cohort ${cohort} must equal ${count}`);
    }
    if (!html.includes(`data-market-founding-edge="oldest">${expectedOldestFoundingYear}<`) || !html.includes(`data-market-founding-edge="newest">${expectedNewestFoundingYear}<`)) {
      addError(route, `founding-year edges must be ${expectedOldestFoundingYear} and ${expectedNewestFoundingYear}`);
    }
    for (const [region, count] of expectedRegions) {
      const escapedRegion = region.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      if (!html.includes(`data-market-region="${escapedRegion}" data-count="${count}"`)) addError(route, `region ${region} must equal ${count}`);
      const englishRegion = expectedEnglishRegionGroups.find((group) => group.sourceLabel === region);
      if (!englishRegion || !html.includes(`href="${englishRegion.path}/"`)) addError(route, `region ${region} must link to its English data-cut route`);
    }
    for (const [city, count] of expectedLeadingCities) {
      const escapedCity = city.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      if (!html.includes(`data-market-city="${escapedCity}" data-count="${count}"`)) addError(route, `leading city ${city} must equal ${count}`);
      const englishCity = expectedEnglishCityGroups.find((group) => group.city === city);
      if (englishCity && !html.includes(`href="${englishCity.path}/"`)) addError(route, `eligible leading city ${city} must link to its English data-cut route`);
    }
    for (const category of expectedCategoryMix) {
      const row = new RegExp(`<tr data-market-category="${category.slug}" data-code="${category.code}" data-count="${category.count}">([\\s\\S]*?)<\\/tr>`).exec(html)?.[1] ?? '';
      if (!row || !row.includes(`href="${category.hrefEn}/"`)) addError(route, `category ${category.slug} must show count ${category.count} and link to ${category.hrefEn}/`);
    }

    const articles = schemasOfType(schemas, 'Article');
    const overviewArticle = articles.find((article) => article.url === ENGLISH_MARKET_OVERVIEW_URL);
    if (!overviewArticle) addError(route, 'missing Article schema for the English market-overview canonical URL');
    else {
      const expectedKeys = ['@context', '@type', 'author', 'dateModified', 'datePublished', 'description', 'headline', 'inLanguage', 'mainEntityOfPage', 'publisher', 'url'];
      if (JSON.stringify(Object.keys(overviewArticle).sort()) !== JSON.stringify(expectedKeys)) addError(route, 'English Article schema contains missing or undocumented properties');
      if (overviewArticle['@context'] !== 'https://schema.org' || overviewArticle['@type'] !== 'Article') addError(route, 'English structured data must be a schema.org Article');
      if (overviewArticle.headline !== 'Lithuanian furniture makers: catalogue data overview' || overviewArticle.description !== descriptions[0]) addError(route, 'English Article headline or description is inaccurate');
      if (overviewArticle.url !== ENGLISH_MARKET_OVERVIEW_URL || overviewArticle.mainEntityOfPage !== ENGLISH_MARKET_OVERVIEW_URL || overviewArticle.inLanguage !== 'en') addError(route, 'English Article canonical page or language is inaccurate');
      if (!validIsoDate(overviewArticle.datePublished) || !validIsoDate(overviewArticle.dateModified) || overviewArticle.datePublished !== generatedDatasetMetadata?.generated_date || overviewArticle.dateModified !== generatedDatasetMetadata?.generated_date) addError(route, 'English Article dates must match the generated build date');
      for (const role of ['author', 'publisher']) {
        if (JSON.stringify(overviewArticle[role]) !== JSON.stringify({ '@id': `${SITE_URL}/#organization` })) addError(route, `English Article ${role} must reference the site organization`);
      }
    }
  }

  if (!/href="\/atviri-duomenys\/?"/.test(html)) addError(route, 'footer is missing the open-data link');
  if (!/href="\/baldu-rinkos-apzvalga\/?"/.test(html)) addError(route, 'navigation is missing the market-overview link');
  if (!html.includes('href="/en/"')) addError(route, 'navigation or footer is missing the English sourcing hub link');

  const isGuideArticle = /<article\b[^>]*\bclass=(["'])[^"']*\bguide-article\b[^"']*\1/i.test(html);
  if (isGuideArticle) {
    counts.guideArticles += 1;
    if (!hasType('Article')) addError(route, 'guide article is missing Article schema');
  }

  if (hasType('FAQPage')) {
    counts.faqPages += 1;
    if (visibleFaqEntries(html) <= 0) addError(route, 'FAQPage schema has no visible FAQ content');
  }
}

for (const [title, routes] of titleRoutes) {
  if (routes.length > 1) errors.push(`duplicate title "${title}" on ${routes.join(', ')}`);
}
for (const [description, routes] of descriptionRoutes) {
  if (routes.length > 1) errors.push(`duplicate meta description "${description}" on ${routes.join(', ')}`);
}
for (const [guidance, routes] of hubGuidanceRoutes) {
  if (routes.length > 1) errors.push(`identical hub guidance on ${routes.join(', ')} (starts "${guidance.slice(0, 90)}…")`);
}
for (const [intro, routes] of cityIntroRoutes) {
  if (routes.length > 1) errors.push(`identical city intro on ${routes.join(', ')} (starts "${intro.slice(0, 90)}…")`);
}
for (const [faq, routes] of cityFaqRoutes) {
  if (routes.length > 1) errors.push(`identical city FAQ on ${routes.join(', ')} (starts "${faq.slice(0, 90)}…")`);
}
if (cityIntroRoutes.size !== expectedLandingCities.length) {
  errors.push(`expected ${expectedLandingCities.length} distinct generated city landing intros, found ${cityIntroRoutes.size}`);
}
if (counts.cityIndexes !== 1) errors.push(`expected exactly one all-cities index, found ${counts.cityIndexes}`);
if (counts.englishHubs !== 1) errors.push(`expected exactly one English sourcing hub, found ${counts.englishHubs}`);
if (counts.englishCategories !== expectedEnglishCategories.length) errors.push(`expected ${expectedEnglishCategories.length} English category routes, found ${counts.englishCategories}`);
if (counts.marketOverviews !== 2) errors.push(`expected exactly two reciprocal-language market-overview routes, found ${counts.marketOverviews}`);
if (counts.landingSnapshots !== expectedSnapshotRoutes.size) errors.push(`expected ${expectedSnapshotRoutes.size} city/category landing snapshots, found ${counts.landingSnapshots}`);
if (counts.englishSourcingGuides !== 1) errors.push(`expected exactly one English sourcing guide, found ${counts.englishSourcingGuides}`);
if (counts.englishRegions !== expectedEnglishRegionGroups.length) errors.push(`expected ${expectedEnglishRegionGroups.length} English region pages, found ${counts.englishRegions}`);
if (counts.englishCities !== expectedEnglishCityGroups.length) errors.push(`expected ${expectedEnglishCityGroups.length} English larger-city pages, found ${counts.englishCities}`);
if (counts.englishTurnoverBands !== 4 || expectedEnglishTurnoverBands.length !== 4) errors.push(`expected exactly four English turnover-band pages, found ${counts.englishTurnoverBands}`);
if (counts.englishLists !== expectedEnglishListRoutes.size) errors.push(`expected ${expectedEnglishListRoutes.size} English factual list pages, found ${counts.englishLists}`);
const turnoverBandSlugs = expectedEnglishTurnoverBands.flatMap((band) => band.records.map((record) => record.slug));
if (turnoverBandSlugs.length !== expectedTurnovers.length || new Set(turnoverBandSlugs).size !== turnoverBandSlugs.length || expectedTurnovers.some(({ record }) => !turnoverBandSlugs.includes(record.slug))) {
  errors.push('English turnover bands must be exhaustive and non-overlapping across all records satisfying the published-turnover rule');
}
const expectedEnglishRouteSet = new Set(expectedEnglishSuiteRoutes);
const actualEnglishRoutes = files.map(routeFor).filter((route) => route === ENGLISH_HUB_PATH || route.startsWith('/en/'));
for (const route of actualEnglishRoutes) if (!expectedEnglishRouteSet.has(route)) errors.push(`unexpected English route ${route}; do not create English maker-profile clones or parallel suites`);
for (const route of expectedEnglishRouteSet) if (!actualEnglishRoutes.includes(route)) errors.push(`missing expected English route ${route}`);
const sitemap = await readFile(join(publicDir, 'sitemap.xml'), 'utf8');
const cityIndexCanonical = canonicalUrl(cityIndexRoute);
if (!sitemap.includes(`<loc>${cityIndexCanonical}</loc>`)) errors.push(`sitemap is missing all-cities index ${cityIndexCanonical}`);
for (const city of expectedLandingCities) {
  const canonical = canonicalUrl(`/baldai-pagal-uzsakyma/${city.slug}`);
  if (!sitemap.includes(`<loc>${canonical}</loc>`)) errors.push(`sitemap is missing city landing ${canonical}`);
}
if (!sitemap.includes(`<loc>${ENGLISH_HUB_URL}</loc>`)) errors.push(`sitemap is missing English sourcing hub ${ENGLISH_HUB_URL}`);
for (const entry of expectedEnglishCategories) {
  const canonical = canonicalUrl(entry.route);
  if (!sitemap.includes(`<loc>${canonical}</loc>`)) errors.push(`sitemap is missing English category ${canonical}`);
}

if (errors.length) {
  console.error(`SEO audit failed: ${errors.length} issue${errors.length === 1 ? '' : 's'} across ${files.length} pages.`);
  for (const error of errors.slice(0, 50)) console.error(`- ${error}`);
  if (errors.length > 50) console.error(`- ...and ${errors.length - 50} more.`);
  process.exit(1);
}

console.log(`SEO audit passed: ${files.length} pages; metadata/lang/canonical/Open Graph/JSON-LD/breadcrumbs passed; ${counts.landingSnapshots} audited city/category maker snapshots; 1 English sourcing hub with ${counts.englishCategories} source-matched category tables, ${counts.englishRegions} region, ${counts.englishCities} larger-city and ${counts.englishTurnoverBands} turnover-band factual lists plus the English sourcing guide; open-data and ${counts.marketOverviews} reciprocal-language market-overview routes, llms.txt, JSON/CSV ${manufacturers.length} rows, sitemap and robots passed; WebSite+SearchAction home-only; CollectionPage + ItemList validated on all English sourcing routes; ItemList ${counts.hubs} Lithuanian hubs plus ${counts.cityIndexes} all-cities index; Organization/LocalBusiness ${counts.profiles} profiles; Article ${counts.guideArticles} guide articles plus market overviews; FAQPage ${counts.faqPages} visible FAQ sections.`);
