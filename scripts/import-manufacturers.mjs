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
const requiredFields = [
  "slug", "trading_name", "source_identity", "description_lt", "location", "city", "region", "region_label",
  "category_codes", "category_labels", "audience", "portfolio_status", "confidence",
  "confidence_evidence", "scope_evidence", "evidence_source_type", "source_urls",
  "source_artifact_url", "source_collection_date", "verification_status",
];
const categoryLabels = new Map([
  ["K", "Virtuvės baldai"],
  ["W", "Spintos ir įmontuojami baldai"],
  ["BB", "Miegamojo ir vonios baldai"],
  ["OC", "Biuro ir komerciniai baldai"],
  ["HR", "HoReCa ir prekybos baldai"],
  ["U", "Minkšti baldai pagal užsakymą"],
  ["SW", "Medžio darbai ir medžio masyvo baldai"],
  ["MM", "Metalo ir mišrių medžiagų baldai"],
]);
const categoryCodes = new Set(categoryLabels.keys());
const regions = new Set(["vilnius-east-south", "kaunas-north", "klaipeda-panevezys-west-central"]);

function validate(records) {
  if (!Array.isArray(records) || records.length === 0) {
    throw new Error(`Expected a non-empty manufacturer array; found ${Array.isArray(records) ? records.length : "non-array JSON"}`);
  }

  const slugs = new Set();
  for (const [index, record] of records.entries()) {
    for (const field of requiredFields) {
      if (record[field] === undefined || record[field] === null || record[field] === "") {
        throw new Error(`Record ${index + 1} (${record.slug || "no slug"}) is missing ${field}`);
      }
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.slug)) throw new Error(`Invalid slug: ${record.slug}`);
    if (slugs.has(record.slug)) throw new Error(`Duplicate slug: ${record.slug}`);
    slugs.add(record.slug);
    if (!regions.has(record.region)) throw new Error(`Invalid region for ${record.slug}: ${record.region}`);
    // An empty category set is intentional when public evidence only says "custom furniture"
    // without naming a taxonomy product, material, or use. Guessing is not validation.
    if (!Array.isArray(record.category_codes) || record.category_codes.some((code) => !categoryCodes.has(code))) {
      throw new Error(`Invalid category_codes for ${record.slug}`);
    }
    if (new Set(record.category_codes).size !== record.category_codes.length) {
      throw new Error(`Duplicate category_codes for ${record.slug}`);
    }
    if (!Array.isArray(record.category_labels) || record.category_labels.length !== record.category_codes.length) {
      throw new Error(`category_labels mismatch for ${record.slug}`);
    }
    record.category_codes.forEach((code, categoryIndex) => {
      if (record.category_labels[categoryIndex] !== categoryLabels.get(code)) {
        throw new Error(`Unexpected label for category ${code} on ${record.slug}`);
      }
    });
    if (typeof record.description_lt !== "string" || !record.description_lt.trim()) throw new Error(`Missing description_lt for ${record.slug}`);
    if (!Array.isArray(record.source_urls) || !record.source_urls.length) throw new Error(`Missing source_urls for ${record.slug}`);
    if (!record.source_urls.some((url) => record.scope_evidence.includes(url))) {
      throw new Error(`scope_evidence must cite a source_urls URL for ${record.slug}`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(record.source_collection_date)) throw new Error(`Invalid source date for ${record.slug}`);
    if (record.verification_status !== "nepatvirtinta") throw new Error(`Unexpected verification status for ${record.slug}`);
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

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(HELP);
  process.exit(0);
}

const records = validate(JSON.parse(await readFile(sourceUrl, "utf8")));
const populatedDescriptions = records.filter((record) => record.description_lt.trim()).length;
const categorizedRecords = records.filter((record) => record.category_codes.length > 0).length;
const categoryDistribution = [...categoryLabels.keys()]
  .map((code) => `${code}:${records.filter((record) => record.category_codes.includes(code)).length}`)
  .join(", ");
const coverage = `Descriptions ${populatedDescriptions}/${records.length}; categories ${categorizedRecords}/${records.length} evidenced, ${records.length - categorizedRecords} intentionally empty; distribution ${categoryDistribution}.`;
if (process.argv.includes("--validate")) {
  console.log(`Validated ${records.length} manufacturer records with ${new Set(records.map((record) => record.slug)).size} unique slugs.`);
  console.log(coverage);
  process.exit(0);
}

const { PB_URL, PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD } = process.env;
if (!PB_URL || !PB_ADMIN_EMAIL || !PB_ADMIN_PASSWORD) {
  console.error(HELP);
  throw new Error("PB_URL, PB_ADMIN_EMAIL, and PB_ADMIN_PASSWORD are required for import");
}

const baseUrl = new URL(PB_URL.endsWith("/") ? PB_URL : `${PB_URL}/`);
const authUrl = new URL("api/collections/_superusers/auth-with-password", baseUrl);
const auth = await request(authUrl, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ identity: PB_ADMIN_EMAIL, password: PB_ADMIN_PASSWORD }),
});
const headers = { authorization: auth.token, "content-type": "application/json" };
let created = 0;
let updated = 0;
let deleted = 0;

for (const record of records) {
  const listUrl = new URL("api/collections/manufacturers/records", baseUrl);
  listUrl.searchParams.set("page", "1");
  listUrl.searchParams.set("perPage", "1");
  listUrl.searchParams.set("filter", `slug = "${record.slug}"`);
  const result = await request(listUrl, { headers });

  if (result.items.length) {
    const updateUrl = new URL(`api/collections/manufacturers/records/${result.items[0].id}`, baseUrl);
    await request(updateUrl, { method: "PATCH", headers, body: JSON.stringify(record) });
    updated++;
  } else {
    const createUrl = new URL("api/collections/manufacturers/records", baseUrl);
    await request(createUrl, { method: "POST", headers, body: JSON.stringify(record) });
    created++;
  }
}

if (process.argv.includes("--prune")) {
  const sourceSlugs = new Set(records.map((record) => record.slug));
  let page = 1;
  let totalPages = 1;
  const staleRecords = [];
  do {
    const listUrl = new URL("api/collections/manufacturers/records", baseUrl);
    listUrl.searchParams.set("page", String(page));
    listUrl.searchParams.set("perPage", "200");
    listUrl.searchParams.set("fields", "id,slug");
    const result = await request(listUrl, { headers });
    staleRecords.push(...result.items.filter((item) => !sourceSlugs.has(item.slug)));
    totalPages = result.totalPages;
    page++;
  } while (page <= totalPages);

  for (const stale of staleRecords) {
    const deleteUrl = new URL(`api/collections/manufacturers/records/${stale.id}`, baseUrl);
    await request(deleteUrl, { method: "DELETE", headers });
    deleted++;
  }
}

console.log(`Imported ${records.length} manufacturers: ${created} created, ${updated} updated, ${deleted} deleted.`);
console.log(coverage);
