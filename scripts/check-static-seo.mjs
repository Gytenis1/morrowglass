#!/usr/bin/env node
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const publicDir = join(rootDir, 'public');
const SITE_URL = 'https://www.baldininkai.org';
const errors = [];
const titleRoutes = new Map();
const descriptionRoutes = new Map();

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

function visibleFaq(html) {
  const rendered = html.replace(/<script\b[\s\S]*?<\/script>/gi, '');
  const sections = [...rendered.matchAll(/<section\b([^>]*)>([\s\S]*?)<\/section>/gi)];
  return sections.some(([, attributes, content]) => {
    const classes = attribute(`<section ${attributes}>`, 'class');
    const hidden = /\bhidden\b|aria-hidden\s*=\s*["']true["']|display\s*:\s*none/i.test(attributes);
    return !hidden
      && /(?:landing-faq|article-faq)/.test(classes)
      && /<h2\b[^>]*>\s*Dažniausi klausimai\s*<\/h2>/i.test(content)
      && /<dt\b[^>]*>\s*\S[\s\S]*?<\/dt>/i.test(content)
      && /<dd\b[^>]*>\s*\S[\s\S]*?<\/dd>/i.test(content);
  });
}

function addError(route, message) {
  errors.push(`${route}: ${message}`);
}

const files = await htmlFiles(publicDir);
if (!files.length) {
  console.error('SEO audit failed: no public/**/index.html files found. Run npm run build first.');
  process.exit(1);
}

const counts = { breadcrumbs: 0, hubs: 0, profiles: 0, guideArticles: 0, faqPages: 0 };

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

  const isHub = route.startsWith('/baldai-pagal-uzsakyma/');
  if (isHub) {
    counts.hubs += 1;
    if (!hasType('ItemList')) addError(route, 'category/city hub is missing ItemList schema');
  }

  const isProfile = route.startsWith('/gamintojas/');
  if (isProfile) {
    counts.profiles += 1;
    const hasProfileEntity = schemas.some((schema) => {
      const schemaTypes = Array.isArray(schema['@type']) ? schema['@type'] : [schema['@type']];
      return schema['@id'] === `${expectedCanonical}#entity`
        && (schemaTypes.includes('Organization') || schemaTypes.includes('LocalBusiness'));
    });
    if (!hasProfileEntity) addError(route, 'manufacturer profile is missing its Organization or LocalBusiness schema');
  }

  const isGuideArticle = /<article\b[^>]*\bclass=(["'])[^"']*\bguide-article\b[^"']*\1/i.test(html);
  if (isGuideArticle) {
    counts.guideArticles += 1;
    if (!hasType('Article')) addError(route, 'guide article is missing Article schema');
  }

  if (hasType('FAQPage')) {
    counts.faqPages += 1;
    if (!visibleFaq(html)) addError(route, 'FAQPage schema has no visible FAQ content');
  }
}

for (const [title, routes] of titleRoutes) {
  if (routes.length > 1) errors.push(`duplicate title "${title}" on ${routes.join(', ')}`);
}
for (const [description, routes] of descriptionRoutes) {
  if (routes.length > 1) errors.push(`duplicate meta description "${description}" on ${routes.join(', ')}`);
}

if (errors.length) {
  console.error(`SEO audit failed: ${errors.length} issue${errors.length === 1 ? '' : 's'} across ${files.length} pages.`);
  for (const error of errors.slice(0, 50)) console.error(`- ${error}`);
  if (errors.length > 50) console.error(`- ...and ${errors.length - 50} more.`);
  process.exit(1);
}

console.log(`SEO audit passed: ${files.length} pages; metadata/lang/canonical/Open Graph/JSON-LD/breadcrumbs passed; WebSite+SearchAction home-only; ItemList ${counts.hubs} hubs; Organization/LocalBusiness ${counts.profiles} profiles; Article ${counts.guideArticles} guide articles; FAQPage ${counts.faqPages} visible FAQ sections.`);
