#!/usr/bin/env node
import { readFile } from "node:fs/promises";

const HELP = `Usage:
  node scripts/import_deal_signals.mjs <deal-signals.json> --validate
  PB_URL=https://api.example PB_ADMIN_EMAIL=admin@example.com \\
    PB_ADMIN_PASSWORD='...' node scripts/import_deal_signals.mjs <deal-signals.json>

The JSON file must contain an array of deal-signal objects. --validate checks only
that local file and does not require credentials or make network requests. A normal
run authenticates as a PocketBase superuser and creates or updates records by
source_url. It never deletes records.`;

const ALLOWED_COUNTRIES = new Set(["LT", "LV", "EE"]);
const ALLOWED_SECTOR_TAGS = new Set([
  "tic_labs",
  "cleaning_hygiene",
  "facilities_services",
  "furniture",
  "other",
]);
const ALLOWED_SIGNAL_TYPES = new Set([
  "for_sale_listing",
  "broker_mandate",
  "insolvency_restructuring",
  "ownership_change",
  "succession_press",
  "other",
]);
const ALLOWED_MANDATE_FITS = new Set(["high", "medium", "low", "excluded"]);
const ALLOWED_STATUSES = new Set(["new", "triaged", "monitor", "dropped"]);
const KNOWN_FIELDS = new Set([
  "company_name",
  "country",
  "city",
  "company_code",
  "sector_tag",
  "signal_type",
  "signal_date",
  "source_name",
  "source_url",
  "evidence_quote",
  "estimated_revenue_eur",
  "mandate_fit",
  "fit_rationale",
  "matched_shortlist_entry",
  "status",
  "notes",
]);

function fail(index, message) {
  throw new Error(`Record ${index + 1}: ${message}`);
}

function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
}

function validateAllowed(record, field, allowed, index, required = false) {
  if (record[field] === undefined) {
    if (required) fail(index, `${field} is required`);
    return;
  }
  if (typeof record[field] !== "string" || !allowed.has(record[field])) {
    fail(index, `${field} must be one of: ${[...allowed].join(", ")}`);
  }
}

function validateOptionalText(record, field, index) {
  if (record[field] !== undefined && typeof record[field] !== "string") {
    fail(index, `${field} must be a string when supplied`);
  }
}

function validate(records) {
  if (!Array.isArray(records)) {
    throw new Error("Input JSON must be an array of deal-signal objects");
  }

  const sourceUrls = new Set();
  return records.map((record, index) => {
    if (!record || typeof record !== "object" || Array.isArray(record)) {
      fail(index, "must be an object");
    }
    for (const field of Object.keys(record)) {
      if (!KNOWN_FIELDS.has(field)) fail(index, `contains unsupported field ${field}`);
    }

    if (typeof record.company_name !== "string" || !record.company_name.trim()) {
      fail(index, "company_name is required");
    }
    if (typeof record.source_url !== "string" || !record.source_url || record.source_url !== record.source_url.trim()) {
      fail(index, "source_url is required and must not include surrounding whitespace");
    }
    let parsedSourceUrl;
    try {
      parsedSourceUrl = new URL(record.source_url);
    } catch {
      fail(index, "source_url must be a valid HTTPS URL");
    }
    if (parsedSourceUrl.protocol !== "https:") fail(index, "source_url must use HTTPS");
    if (sourceUrls.has(record.source_url)) fail(index, `duplicate source_url ${record.source_url}`);
    sourceUrls.add(record.source_url);

    validateAllowed(record, "country", ALLOWED_COUNTRIES, index, true);
    validateAllowed(record, "sector_tag", ALLOWED_SECTOR_TAGS, index, true);
    validateAllowed(record, "signal_type", ALLOWED_SIGNAL_TYPES, index, true);
    validateAllowed(record, "mandate_fit", ALLOWED_MANDATE_FITS, index, true);

    if (record.status === undefined) {
      record.status = "new";
    }
    validateAllowed(record, "status", ALLOWED_STATUSES, index);

    if (record.signal_date === undefined || !isValidDate(record.signal_date)) {
      fail(index, "signal_date is required and must be a real YYYY-MM-DD date");
    }
    if (
      record.estimated_revenue_eur !== undefined &&
      record.estimated_revenue_eur !== null &&
      (typeof record.estimated_revenue_eur !== "number" ||
        !Number.isFinite(record.estimated_revenue_eur) ||
        record.estimated_revenue_eur < 0)
    ) {
      fail(index, "estimated_revenue_eur must be a nonnegative finite number or null");
    }
    for (const field of [
      "city",
      "company_code",
      "source_name",
      "evidence_quote",
      "fit_rationale",
      "matched_shortlist_entry",
      "notes",
    ]) {
      validateOptionalText(record, field, index);
    }

    // Only copy recognized fields to the API payload so import files cannot set
    // record ids, ownership, or other server-managed values.
    const payload = {};
    for (const field of KNOWN_FIELDS) {
      if (record[field] !== undefined) payload[field] = field === "company_name" ? record[field].trim() : record[field];
    }
    return payload;
  });
}

function parseArguments(args) {
  if (args.includes("--help") || args.includes("-h")) {
    console.log(HELP);
    process.exit(0);
  }
  const unknownOptions = args.filter((arg) => arg.startsWith("-") && arg !== "--validate");
  if (unknownOptions.length) throw new Error(`Unknown option: ${unknownOptions[0]}`);
  const files = args.filter((arg) => !arg.startsWith("-"));
  if (files.length !== 1) throw new Error("Provide exactly one JSON file path as the first positional argument");
  return { filePath: files[0], validateOnly: args.includes("--validate") };
}

async function request(url, options = {}) {
  let response;
  try {
    response = await fetch(url, options);
  } catch (error) {
    throw new Error(`${options.method || "GET"} ${url.toString()} failed: ${error.message}`);
  }

  const body = await response.text();
  let parsed = null;
  if (body) {
    try {
      parsed = JSON.parse(body);
    } catch {
      parsed = body;
    }
  }
  if (!response.ok) {
    const detail = typeof parsed === "string" ? parsed : JSON.stringify(parsed);
    throw new Error(`${options.method || "GET"} ${url.pathname} failed (${response.status}): ${detail}`);
  }
  return parsed;
}

function filterForSourceUrl(sourceUrl) {
  // JSON string escaping is compatible with PocketBase string literals and avoids
  // interpolating an unescaped URL into the filter expression.
  return `source_url = ${JSON.stringify(sourceUrl)}`;
}

const { filePath, validateOnly } = parseArguments(process.argv.slice(2));
let source;
try {
  source = JSON.parse(await readFile(filePath, "utf8"));
} catch (error) {
  throw new Error(`Could not read valid JSON from ${filePath}: ${error.message}`);
}
const records = validate(source);

if (validateOnly) {
  console.log(`Validated ${records.length} deal signals with ${new Set(records.map((record) => record.source_url)).size} unique source URLs.`);
  process.exit(0);
}

const { PB_URL, PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD } = process.env;
if (!PB_URL || !PB_ADMIN_EMAIL || !PB_ADMIN_PASSWORD) {
  console.error(HELP);
  throw new Error("PB_URL, PB_ADMIN_EMAIL, and PB_ADMIN_PASSWORD are required for import");
}

let baseUrl;
try {
  baseUrl = new URL(PB_URL.endsWith("/") ? PB_URL : `${PB_URL}/`);
} catch (error) {
  throw new Error(`PB_URL must be a valid URL: ${error.message}`);
}
if (baseUrl.protocol !== "http:" && baseUrl.protocol !== "https:") {
  throw new Error("PB_URL must use HTTP or HTTPS");
}

const authUrl = new URL("api/collections/_superusers/auth-with-password", baseUrl);
const auth = await request(authUrl, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ identity: PB_ADMIN_EMAIL, password: PB_ADMIN_PASSWORD }),
});
if (!auth || typeof auth.token !== "string" || !auth.token) {
  throw new Error("Superuser authentication response did not include a token");
}

const headers = { authorization: auth.token, "content-type": "application/json" };
const recordsUrl = new URL("api/collections/deal_signals/records", baseUrl);
let created = 0;
let updated = 0;

for (const record of records) {
  const listUrl = new URL(recordsUrl);
  listUrl.searchParams.set("page", "1");
  listUrl.searchParams.set("perPage", "2");
  listUrl.searchParams.set("filter", filterForSourceUrl(record.source_url));
  listUrl.searchParams.set("fields", "id,source_url");
  const result = await request(listUrl, { headers });
  if (!result || !Array.isArray(result.items)) {
    throw new Error(`Unexpected list response while looking up ${record.source_url}`);
  }
  if (result.items.length > 1) {
    throw new Error(`More than one deal_signals record exists for source_url ${record.source_url}; refusing to update`);
  }

  if (result.items.length === 1) {
    const updateUrl = new URL(`api/collections/deal_signals/records/${encodeURIComponent(result.items[0].id)}`, baseUrl);
    await request(updateUrl, { method: "PATCH", headers, body: JSON.stringify(record) });
    updated++;
  } else {
    await request(recordsUrl, { method: "POST", headers, body: JSON.stringify(record) });
    created++;
  }
}

console.log(`Imported ${records.length} deal signals: ${created} created, ${updated} updated.`);
