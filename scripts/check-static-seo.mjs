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
const manufacturers = JSON.parse(await readFile(join(rootDir, 'data/manufacturers.json'), 'utf8'));
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
    .replace(/&(?:apos|#39);/gi, "'")
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
    for (const required of ['Baldininkai.org', OPEN_DATA_URL, DATASET_JSON_URL, DATASET_CSV_URL, `${SITE_URL}/sitemap.xml`, 'English summary', 'nepatvirtinti viešų šaltinių kandidatai', DATASET_LICENSE_NAME, 'CC BY 4.0', DATASET_LICENSE_URL, expectedAttribution]) {
      if (!llms.includes(required)) addError('/llms.txt', `missing required content: ${required}`);
    }
  } catch (error) {
    addError('/llms.txt', `missing or unreadable (${error.message})`);
  }

  try {
    const sitemap = await readFile(join(publicDir, 'sitemap.xml'), 'utf8');
    if (!sitemap.includes(`<loc>${SITE_URL}/atviri-duomenys/</loc>`)) addError('/sitemap.xml', 'missing open-data route');
  } catch (error) {
    addError('/sitemap.xml', `missing or unreadable (${error.message})`);
  }

  try {
    const robots = await readFile(join(publicDir, 'robots.txt'), 'utf8');
    if (/^\s*Disallow\s*:/im.test(robots)) addError('/robots.txt', 'must not disallow any crawler path');
    for (const required of ['User-agent: *', 'Allow: /', 'Allow: /llms.txt', 'Allow: /atviri-duomenys/', 'Allow: /baldininkai-org-gamintojai.json', 'Allow: /baldininkai-org-gamintojai.csv', `Sitemap: ${SITE_URL}/sitemap.xml`]) {
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
const expectedLandingCities = expectedCities.filter((entry) => entry.count >= 2);
const cityRouteSet = new Set(expectedLandingCities.map((entry) => `/baldai-pagal-uzsakyma/${entry.slug}`));
const cityIndexRoute = '/baldai-pagal-uzsakyma/miestai';

const counts = { breadcrumbs: 0, hubs: 0, cityIndexes: 0, profiles: 0, guideArticles: 0, faqPages: 0 };

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
  if (attribute(htmlTag, 'lang') !== 'lt') addError(route, 'html lang must be "lt"');

  const canonicals = tags(html, 'link').filter((tag) => attribute(tag, 'rel').toLowerCase() === 'canonical').map((tag) => attribute(tag, 'href'));
  if (canonicals.length !== 1 || canonicals[0] !== expectedCanonical) addError(route, `canonical must be the self www URL ${expectedCanonical}`);

  const og = new Map(tags(html, 'meta')
    .filter((tag) => ['og:title', 'og:description', 'og:url'].includes(attribute(tag, 'property').toLowerCase()))
    .map((tag) => [attribute(tag, 'property').toLowerCase(), attribute(tag, 'content')]));
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
        const expectedHref = expected.count >= 2
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
      }
    }
  }

  if (route === '/atviri-duomenys') {
    const text = visibleText(html);
    for (const required of ['Atviri Baldininkai.org duomenys', 'JSON duomenų rinkinys', 'CSV duomenų rinkinys', 'no_public_contact_route', 'Ribotumai', 'Licencija ir priskyrimas', DATASET_LICENSE_NAME, 'CC BY 4.0', 'versija 4.0', 'This dataset is licensed under Creative Commons Attribution 4.0 International (CC BY 4.0).', generatedDatasetMetadata?.attribution]) {
      if (!required || !text.includes(required)) addError(route, `missing open-data content: ${String(required)}`);
    }
    if (!html.includes('href="/baldininkai-org-gamintojai.json"') || !html.includes('href="/baldininkai-org-gamintojai.csv"')) addError(route, 'missing dataset download links');
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

  if (!html.includes('href="/atviri-duomenys"')) addError(route, 'footer is missing the open-data link');

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
const sitemap = await readFile(join(publicDir, 'sitemap.xml'), 'utf8');
const cityIndexCanonical = canonicalUrl(cityIndexRoute);
if (!sitemap.includes(`<loc>${cityIndexCanonical}</loc>`)) errors.push(`sitemap is missing all-cities index ${cityIndexCanonical}`);
for (const city of expectedLandingCities) {
  const canonical = canonicalUrl(`/baldai-pagal-uzsakyma/${city.slug}`);
  if (!sitemap.includes(`<loc>${canonical}</loc>`)) errors.push(`sitemap is missing city landing ${canonical}`);
}

if (errors.length) {
  console.error(`SEO audit failed: ${errors.length} issue${errors.length === 1 ? '' : 's'} across ${files.length} pages.`);
  for (const error of errors.slice(0, 50)) console.error(`- ${error}`);
  if (errors.length > 50) console.error(`- ...and ${errors.length - 50} more.`);
  process.exit(1);
}

console.log(`SEO audit passed: ${files.length} pages; metadata/lang/canonical/Open Graph/JSON-LD/breadcrumbs passed; open-data route, llms.txt, JSON/CSV ${manufacturers.length} rows, sitemap and robots passed; WebSite+SearchAction home-only; ItemList ${counts.hubs} hubs plus ${counts.cityIndexes} all-cities index; Organization/LocalBusiness ${counts.profiles} profiles; Article ${counts.guideArticles} guide articles; FAQPage ${counts.faqPages} visible FAQ sections.`);
