/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const manifest = require(__hooks + "/../data/manufacturer_contact_route_research_20260804.json")
  const batch = manifest && manifest.results
  const expectedCount = 255
  const collectionDate = "2026-08-04"

  if (!manifest || manifest.source_collection_date !== collectionDate ||
      manifest.baseline_contactless_count !== expectedCount || !Array.isArray(batch) || batch.length !== expectedCount) {
    throw new Error("manufacturer contact-route backfill requires the immutable 255-record research manifest")
  }

  const seenSlugs = new Set()
  let routeCount = 0
  for (const record of batch) {
    if (!record || typeof record.slug !== "string" || !record.slug || seenSlugs.has(record.slug) ||
        (record.company_code !== "" && !/^\d{7,12}$/.test(record.company_code || "")) ||
        record.source_collection_date !== collectionDate || record.public_contact_checked_date !== collectionDate ||
        typeof record.no_public_contact_route !== "boolean" ||
        !Array.isArray(record.source_urls) || !Array.isArray(record.checked_source_urls) ||
        !record.source_urls.every((url) => typeof url === "string" && /^https:\/\//.test(url))) {
      throw new Error("manufacturer contact-route backfill has invalid research metadata")
    }
    seenSlugs.add(record.slug)
    const hasRoute = record.result === "public_route_found"
    if (hasRoute !== !record.no_public_contact_route ||
        (hasRoute && (!/^\+?[0-9][0-9 ()-]{5,30}$/.test(record.public_phone || "") || record.source_urls.length !== 1)) ||
        (!hasRoute && (record.result !== "no_public_contact_route_found" || record.public_phone || record.website || record.public_contact_url || record.source_urls.length !== 0))) {
      throw new Error("manufacturer contact-route backfill has an invalid route result for " + record.slug)
    }
    if (hasRoute) routeCount++
  }
  if (routeCount < 100) {
    throw new Error("manufacturer contact-route backfill requires at least 100 directly sourced routes")
  }

  const collection = app.findCollectionByNameOrId("manufacturers")
  const requiredExisting = {
    slug: "text",
    company_code: "text",
    website: "url",
    public_phone: "text",
    public_contact_url: "url",
    public_details_source_urls: "json",
    source_collection_date: "text",
  }
  for (const [name, type] of Object.entries(requiredExisting)) {
    const field = collection.fields.getByName(name)
    if (!field || field.type() !== type) {
      throw new Error("manufacturers." + name + " must be a " + type + " field")
    }
  }

  let schemaChanged = false
  const marker = collection.fields.getByName("no_public_contact_route")
  if (!marker) {
    collection.fields.add(new BoolField({ name: "no_public_contact_route" }))
    schemaChanged = true
  } else if (marker.type() !== "bool") {
    throw new Error("manufacturers.no_public_contact_route must be a bool field")
  }
  const checkedDate = collection.fields.getByName("public_contact_checked_date")
  if (!checkedDate) {
    collection.fields.add(new TextField({ name: "public_contact_checked_date", min: 10, max: 10, pattern: "^\\d{4}-\\d{2}-\\d{2}$" }))
    schemaChanged = true
  } else if (checkedDate.type() !== "text") {
    throw new Error("manufacturers.public_contact_checked_date must be a text field")
  }
  if (schemaChanged) app.save(collection)

  const sqlValue = (value) => "'" + String(value).replaceAll("'", "''") + "'"
  const values = batch.map((record) => "(" + [
    record.company_code || "",
    record.slug,
    record.public_phone || "",
    record.source_urls[0] || "",
    record.no_public_contact_route ? 0 : 1,
  ].map(sqlValue).join(", ") + ")").join(", ")

  // Code is the primary match key. Slug narrows duplicate/historical code rows so a
  // route from one legal-name history cannot leak to another record sharing its code;
  // code-less legacy rows use their stable slug. The one bounded statement only fills
  // blank routes, appends the concrete public page when it fills one, and marks only
  // records which still have no route. It is consequently safe after a partial retry.
  const match = "`source`.`slug` = `manufacturers`.`slug` AND (" +
    "`source`.`company_code` = '' OR `source`.`company_code` = `manufacturers`.`company_code`)"
  const source = (column) => "(SELECT `" + column + "` FROM `source` WHERE " + match + " LIMIT 1)"
  const routeFill = "(" + source("is_route") + " = '1' AND (`public_phone` IS NULL OR trim(`public_phone`) = ''))"
  const noRouteNeedsMark = "(" + source("is_route") + " = '0' AND " +
    "(`website` IS NULL OR trim(`website`) = '') AND (`public_phone` IS NULL OR trim(`public_phone`) = '') AND " +
    "(`public_contact_url` IS NULL OR trim(`public_contact_url`) = '') AND " +
    "(`no_public_contact_route` IS NULL OR `no_public_contact_route` = 0 OR `public_contact_checked_date` IS NULL OR `public_contact_checked_date` <> " + sqlValue(collectionDate) + "))"
  const sourceUrl = source("source_url")
  const existingSources = "`public_details_source_urls`"
  const mergedSources = "CASE " +
    "WHEN " + existingSources + " IS NULL OR trim(" + existingSources + ") IN ('', '[]', 'null') THEN json_array(" + sourceUrl + ") " +
    "WHEN json_valid(" + existingSources + ") = 1 THEN CASE json_type(" + existingSources + ") " +
      "WHEN 'array' THEN CASE WHEN EXISTS (SELECT 1 FROM json_each(" + existingSources + ") WHERE value = " + sourceUrl + ") " +
        "THEN " + existingSources + " ELSE json_insert(" + existingSources + ", '$[#]', " + sourceUrl + ") END " +
      "ELSE json_array(json_extract(" + existingSources + ", '$'), " + sourceUrl + ") END " +
    "ELSE json_array(" + sourceUrl + ") END"

  app.db().newQuery(
    "WITH `source` (`company_code`, `slug`, `public_phone`, `source_url`, `is_route`) AS (VALUES " + values + ") " +
    "UPDATE `manufacturers` SET " +
      "`public_phone` = CASE WHEN " + routeFill + " THEN " + source("public_phone") + " ELSE `public_phone` END, " +
      "`public_details_source_urls` = CASE WHEN " + routeFill + " THEN " + mergedSources + " ELSE `public_details_source_urls` END, " +
      "`no_public_contact_route` = CASE WHEN " + routeFill + " THEN 0 WHEN " + noRouteNeedsMark + " THEN 1 ELSE `no_public_contact_route` END, " +
      "`public_contact_checked_date` = CASE WHEN " + routeFill + " OR " + noRouteNeedsMark + " THEN " + sqlValue(collectionDate) + " ELSE `public_contact_checked_date` END, " +
      "`source_collection_date` = CASE WHEN " + routeFill + " OR " + noRouteNeedsMark + " THEN " + sqlValue(collectionDate) + " ELSE `source_collection_date` END " +
    "WHERE EXISTS (SELECT 1 FROM `source` WHERE " + match + ") AND (" + routeFill + " OR " + noRouteNeedsMark + ")"
  ).execute()
}, (app) => {
  // Deliberately non-destructive: public contact research and check markers survive rollback.
})
