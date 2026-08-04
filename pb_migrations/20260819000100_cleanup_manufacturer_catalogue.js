/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const manifest = require(__hooks + "/../data/manufacturer_catalogue_cleanup_20260804.json")
  const expectedDate = "2026-08-04"
  const expectedMergeCount = 12
  const expectedRemovalCount = 1
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  const validUrl = (url) => typeof url === "string" && /^https:\/\/[^\s]+$/i.test(url)

  if (!manifest || manifest.manifest_version !== 1 || manifest.decision_date !== expectedDate ||
      manifest.catalogue_total_before !== 450 || typeof manifest.low_completeness_criteria !== "string" ||
      !Array.isArray(manifest.merges) || manifest.merges.length !== expectedMergeCount ||
      !Array.isArray(manifest.removals) || manifest.removals.length !== expectedRemovalCount ||
      !Array.isArray(manifest.low_completeness_flags)) {
    throw new Error("manufacturer catalogue cleanup requires its immutable 2026-08-04 manifest")
  }

  const allDecisionSlugs = new Set()
  const removedMergeSlugs = new Set()
  for (const merge of manifest.merges) {
    if (!merge || !slugPattern.test(merge.kept_slug || "") || !slugPattern.test(merge.removed_slug || "") ||
        merge.kept_slug === merge.removed_slug || typeof merge.reason !== "string" || !merge.reason ||
        !Array.isArray(merge.source_urls) || merge.source_urls.length === 0 || !merge.source_urls.every(validUrl) ||
        allDecisionSlugs.has(merge.kept_slug) || allDecisionSlugs.has(merge.removed_slug)) {
      throw new Error("manufacturer catalogue cleanup has an invalid merge decision")
    }
    allDecisionSlugs.add(merge.kept_slug)
    allDecisionSlugs.add(merge.removed_slug)
    removedMergeSlugs.add(merge.removed_slug)
  }
  for (const removal of manifest.removals) {
    if (!removal || !slugPattern.test(removal.slug || "") || typeof removal.reason !== "string" || !removal.reason ||
        !Array.isArray(removal.source_urls) || removal.source_urls.length === 0 || !removal.source_urls.every(validUrl) ||
        allDecisionSlugs.has(removal.slug)) {
      throw new Error("manufacturer catalogue cleanup has an invalid removal decision")
    }
    allDecisionSlugs.add(removal.slug)
  }
  for (const flag of manifest.low_completeness_flags) {
    if (!flag || !slugPattern.test(flag.slug || "") || typeof flag.reason !== "string" || !flag.reason ||
        !Array.isArray(flag.source_urls) || !flag.source_urls.every(validUrl) || allDecisionSlugs.has(flag.slug)) {
      throw new Error("manufacturer catalogue cleanup has an invalid low-completeness decision")
    }
    allDecisionSlugs.add(flag.slug)
  }

  const collection = app.findCollectionByNameOrId("manufacturers")
  const requiredFields = {
    slug: ["text"],
    company_code: ["text"],
    legal_name: ["text"],
    trading_name: ["text"],
    city: ["text"],
    website: ["url"],
    public_phone: ["text"],
    public_contact_url: ["url"],
    description_lt: ["text"],
    scope_evidence: ["text"],
    source_urls: ["json"],
    public_details_source_urls: ["json"],
    source_artifact_url: ["url"],
    registry_match_status: ["text", "select"],
  }
  for (const [name, types] of Object.entries(requiredFields)) {
    const field = collection.fields.getByName(name)
    if (!field || !types.includes(field.type())) {
      throw new Error("manufacturers." + name + " has an incompatible type")
    }
  }

  let schemaChanged = false
  const lowCompleteness = collection.fields.getByName("low_completeness")
  if (!lowCompleteness) {
    collection.fields.add(new BoolField({ name: "low_completeness" }))
    schemaChanged = true
  } else if (lowCompleteness.type() !== "bool") {
    throw new Error("manufacturers.low_completeness must be a bool field")
  }
  if (schemaChanged) app.save(collection)

  const sqlValue = (value) => "'" + String(value).replaceAll("'", "''") + "'"
  const sourceRows = manifest.merges.map((merge) =>
    "(" + [merge.kept_slug, merge.removed_slug].map(sqlValue).join(", ") + ")"
  ).join(", ")
  const sourceForKept = "(SELECT `removed_slug` FROM `source` WHERE `source`.`kept_slug` = `kept`.`slug` LIMIT 1)"
  const weak = (column) => "(SELECT `weak`.`" + column + "` FROM `manufacturers` AS `weak` WHERE `weak`.`slug` = " + sourceForKept + " LIMIT 1)"
  const blank = (expression) => "(" + expression + " IS NULL OR trim(" + expression + ") = '')"
  const fillBlank = (column) => "CASE WHEN " + blank("`kept`.`" + column + "`") +
    " AND NOT " + blank(weak(column)) + " THEN " + weak(column) + " ELSE `kept`.`" + column + "` END"
  const mergedJson = (column) => {
    const kept = "`kept`.`" + column + "`"
    const weaker = weak(column)
    return "CASE " +
      "WHEN " + blank(kept) + " THEN CASE WHEN json_valid(" + weaker + ") = 1 AND json_type(" + weaker + ") = 'array' THEN " + weaker + " ELSE " + kept + " END " +
      "WHEN json_valid(" + kept + ") = 1 AND json_type(" + kept + ") = 'array' AND json_valid(" + weaker + ") = 1 AND json_type(" + weaker + ") = 'array' THEN " +
        "COALESCE((SELECT json_group_array(`value`) FROM (SELECT `value` FROM json_each(" + kept + ") UNION SELECT `value` FROM json_each(" + weaker + "))), " + kept + ") " +
      "ELSE " + kept + " END"
  }

  // One bounded statement handles every confirmed pair. It only fills blank scalar
  // values, unions valid provenance arrays without duplicates, and leaves a retained
  // record untouched when a prior attempt has already deleted its weaker counterpart.
  app.db().newQuery(
    "WITH `source` (`kept_slug`, `removed_slug`) AS (VALUES " + sourceRows + ") " +
    "UPDATE `manufacturers` AS `kept` SET " +
      "`company_code` = " + fillBlank("company_code") + ", " +
      "`legal_name` = " + fillBlank("legal_name") + ", " +
      "`trading_name` = " + fillBlank("trading_name") + ", " +
      "`city` = " + fillBlank("city") + ", " +
      "`website` = " + fillBlank("website") + ", " +
      "`public_phone` = " + fillBlank("public_phone") + ", " +
      "`public_contact_url` = " + fillBlank("public_contact_url") + ", " +
      "`description_lt` = " + fillBlank("description_lt") + ", " +
      "`scope_evidence` = " + fillBlank("scope_evidence") + ", " +
      "`registry_match_status` = " + fillBlank("registry_match_status") + ", " +
      "`source_artifact_url` = " + fillBlank("source_artifact_url") + ", " +
      "`source_urls` = " + mergedJson("source_urls") + ", " +
      "`public_details_source_urls` = " + mergedJson("public_details_source_urls") + " " +
    "WHERE `kept`.`slug` IN (SELECT `kept_slug` FROM `source`)"
  ).execute()

  const weakSlugs = manifest.merges.map((merge) => sqlValue(merge.removed_slug)).join(", ")
  const removalSlugs = manifest.removals.map((removal) => sqlValue(removal.slug)).join(", ")
  // Deleting only the manifest's weaker/off-topic rows is safe after an interrupted
  // migration: absent rows make both bounded deletes no-ops on retry.
  app.db().newQuery("DELETE FROM `manufacturers` WHERE `slug` IN (" + weakSlugs + ")").execute()
  app.db().newQuery("DELETE FROM `manufacturers` WHERE `slug` IN (" + removalSlugs + ")").execute()

  if (manifest.low_completeness_flags.length > 0) {
    const flagSlugs = manifest.low_completeness_flags.map((flag) => sqlValue(flag.slug)).join(", ")
    app.db().newQuery("UPDATE `manufacturers` SET `low_completeness` = 1 WHERE `slug` IN (" + flagSlugs + ") AND (`low_completeness` IS NULL OR `low_completeness` = 0)").execute()
  }
}, (app) => {
  // Deliberately non-destructive: catalogue cleanup decisions and completeness flags survive rollback.
})
