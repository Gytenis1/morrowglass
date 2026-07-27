#!/usr/bin/env node
import { readFile } from "node:fs/promises";

const HELP = `Usage:
  PB_URL=https://api.example PB_ADMIN_EMAIL=admin@example.com \\
    PB_ADMIN_PASSWORD='...' node scripts/import-manufacturers.mjs
  node scripts/import-manufacturers.mjs --validate
  node scripts/import-manufacturers.mjs --help

The normal command authenticates as a PocketBase superuser, then creates or updates
all data/manufacturers.json records by unique slug. --validate only checks the local
source file and does not require credentials or make network requests.`;

const sourceUrl = new URL("../data/manufacturers.json", import.meta.url);
const requiredFields = [
  "slug", "trading_name", "source_identity", "location", "city", "region", "region_label",
  "category_codes", "category_labels", "audience", "portfolio_status", "confidence",
  "confidence_evidence", "scope_evidence", "evidence_source_type", "source_urls",
  "source_artifact_url", "source_collection_date", "verification_status",
];
const categoryCodes = new Set(["K", "W", "BB", "OC", "HR", "U", "SW", "MM"]);
const regions = new Set(["vilnius-east-south", "kaunas-north", "klaipeda-panevezys-west-central"]);

function validate(records) {
  if (!Array.isArray(records) || records.length !== 121) {
    throw new Error(`Expected exactly 121 manufacturer records; found ${Array.isArray(records) ? records.length : "non-array JSON"}`);
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
    if (!Array.isArray(record.category_codes) || !record.category_codes.length || record.category_codes.some((code) => !categoryCodes.has(code))) {
      throw new Error(`Invalid category_codes for ${record.slug}`);
    }
    if (!Array.isArray(record.category_labels) || record.category_labels.length !== record.category_codes.length) {
      throw new Error(`category_labels mismatch for ${record.slug}`);
    }
    if (!Array.isArray(record.source_urls) || !record.source_urls.length) throw new Error(`Missing source_urls for ${record.slug}`);
    if (record.source_collection_date !== "2026-07-27") throw new Error(`Unexpected source date for ${record.slug}`);
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
if (process.argv.includes("--validate")) {
  console.log(`Validated ${records.length} manufacturer records with ${new Set(records.map((record) => record.slug)).size} unique slugs.`);
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

console.log(`Imported ${records.length} manufacturers: ${created} created, ${updated} updated.`);
