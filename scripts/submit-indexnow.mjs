#!/usr/bin/env node
import { INDEXNOW_KEY, INDEXNOW_KEY_FILENAME } from './indexnow-key.mjs';

const DEFAULT_SITEMAP_URL = 'https://www.baldininkai.org/sitemap.xml';
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const MAX_URLS_PER_BATCH = 10_000;
const defaultSitemap = new URL(DEFAULT_SITEMAP_URL);

function parseSitemapUrl(value) {
  let sitemapUrl;
  try {
    sitemapUrl = new URL(value);
  } catch {
    throw new Error(`Sitemap URL is invalid: ${value}`);
  }

  if (sitemapUrl.protocol !== 'https:' || sitemapUrl.username || sitemapUrl.password || sitemapUrl.port) {
    throw new Error('SITEMAP_URL must be an HTTPS URL without credentials or a port.');
  }

  if (sitemapUrl.hostname.toLowerCase() !== defaultSitemap.hostname) {
    throw new Error(`SITEMAP_URL must use the public host ${defaultSitemap.hostname}.`);
  }

  return sitemapUrl;
}

function decodeXmlEntities(value) {
  const namedEntities = { amp: '&', apos: "'", gt: '>', lt: '<', quot: '"' };
  return value.replace(/&(#x[0-9a-f]+|#\d+|amp|apos|gt|lt|quot);/gi, (entity, encoded) => {
    const normalized = encoded.toLowerCase();
    if (normalized in namedEntities) return namedEntities[normalized];

    const codePoint = normalized.startsWith('#x')
      ? Number.parseInt(normalized.slice(2), 16)
      : Number.parseInt(normalized.slice(1), 10);

    try {
      return String.fromCodePoint(codePoint);
    } catch {
      throw new Error(`Sitemap contains an invalid XML entity: ${entity}`);
    }
  });
}

function extractLocations(xml) {
  const locations = [];
  const locPattern = /<(?:[A-Za-z_][\w.-]*:)?loc(?:\s[^>]*)?>([\s\S]*?)<\/(?:[A-Za-z_][\w.-]*:)?loc\s*>/gi;

  for (const match of xml.matchAll(locPattern)) {
    const rawValue = match[1].trim().replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, '$1').trim();
    if (!rawValue) throw new Error('Sitemap contains an empty <loc> value.');
    locations.push(decodeXmlEntities(rawValue));
  }

  return locations;
}

function validateAndDeduplicateUrls(locations, host) {
  const urls = new Set();

  for (const location of locations) {
    let url;
    try {
      url = new URL(location);
    } catch {
      throw new Error(`Sitemap contains an invalid URL: ${location}`);
    }

    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.port || url.hostname.toLowerCase() !== host) {
      throw new Error(`Sitemap URL is outside the expected host ${host}: ${location}`);
    }

    url.hash = '';
    urls.add(url.href);
  }

  if (urls.size === 0) throw new Error('Sitemap did not contain any URLs to submit.');
  return [...urls];
}

async function fetchSitemap(sitemapUrl) {
  let response;
  try {
    response = await fetch(sitemapUrl, { headers: { Accept: 'application/xml,text/xml;q=0.9,*/*;q=0.1' } });
  } catch (error) {
    throw new Error(`Failed to fetch sitemap: ${error.message}`);
  }

  if (!response.ok) throw new Error(`Failed to fetch sitemap: HTTP ${response.status} ${response.statusText}`);

  try {
    return await response.text();
  } catch (error) {
    throw new Error(`Failed to read sitemap response: ${error.message}`);
  }
}

async function submitBatch(batch, batchNumber, totalBatches, host, keyLocation) {
  let response;
  try {
    response = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ host, key: INDEXNOW_KEY, keyLocation, urlList: batch }),
    });
  } catch (error) {
    throw new Error(`IndexNow batch ${batchNumber}/${totalBatches} request failed: ${error.message}`);
  }

  let body;
  try {
    body = await response.text();
  } catch (error) {
    throw new Error(`Could not read IndexNow batch ${batchNumber}/${totalBatches} response: ${error.message}`);
  }

  console.log(`IndexNow batch ${batchNumber}/${totalBatches}: HTTP ${response.status}\n${body || '(empty response body)'}`);
  if (response.status !== 200 && response.status !== 202) {
    throw new Error(`IndexNow batch ${batchNumber}/${totalBatches} was not accepted (HTTP ${response.status}).`);
  }
}

async function main() {
  const sitemapUrl = parseSitemapUrl(process.env.SITEMAP_URL ?? DEFAULT_SITEMAP_URL);
  const host = sitemapUrl.hostname.toLowerCase();
  const keyLocation = `https://${host}/${INDEXNOW_KEY_FILENAME}`;

  console.log(`Sitemap: ${sitemapUrl.href}`);
  const sitemapXml = await fetchSitemap(sitemapUrl);
  const urls = validateAndDeduplicateUrls(extractLocations(sitemapXml), host);
  const totalBatches = Math.ceil(urls.length / MAX_URLS_PER_BATCH);
  console.log(`URLs to submit: ${urls.length}`);
  console.log(`Batches: ${totalBatches}`);

  for (let start = 0, batchNumber = 1; start < urls.length; start += MAX_URLS_PER_BATCH, batchNumber += 1) {
    const batch = urls.slice(start, start + MAX_URLS_PER_BATCH);
    console.log(`Submitting batch ${batchNumber}/${totalBatches} (${batch.length} URLs)...`);
    await submitBatch(batch, batchNumber, totalBatches, host, keyLocation);
  }
}

main().catch((error) => {
  console.error(`IndexNow submission failed: ${error.message}`);
  process.exitCode = 1;
});
