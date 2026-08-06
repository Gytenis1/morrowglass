/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const collection = app.findCollectionByNameOrId("manufacturers")
  const requiredFields = {
    facts_checked_date: "text",
    financial_source_url: "text",
    financial_verification_status: "select",
    revenue_availability: "select",
    revenue_eur_latest: "number",
    revenue_year: "number",
    verified_at: "text",
  }

  for (const [name, type] of Object.entries(requiredFields)) {
    const field = collection.fields.getByName(name)
    if (!field || field.type() !== type) throw new Error("manufacturers." + name + " must be a " + type + " field")
  }
  for (const [name, requiredValue] of [["financial_verification_status", "patikrinta"], ["revenue_availability", "paskelbta"]]) {
    const field = collection.fields.getByName(name)
    if (field.maxSelect !== 1 || !Array.isArray(field.values) || !field.values.includes(requiredValue)) {
      throw new Error("manufacturers." + name + " must be a compatible single-select field")
    }
  }

  // This bounded update only repairs the missing verification date on the exact
  // audited cohort. Existing dates are retained so reruns are idempotent.
  app.db().newQuery(
    "UPDATE `manufacturers` SET `verified_at` = '2026-08-06' " +
    "WHERE (`verified_at` IS NULL OR trim(`verified_at`) = '') " +
      "AND `facts_checked_date` = '2026-08-06' " +
      "AND trim(`financial_source_url`) <> '' " +
      "AND `financial_verification_status` = 'patikrinta' " +
      "AND `revenue_availability` = 'paskelbta' " +
      "AND `revenue_eur_latest` > 0 " +
      "AND `revenue_year` BETWEEN 1800 AND 2100 " +
      "AND `revenue_year` = CAST(`revenue_year` AS INTEGER)"
  ).execute()
}, (app) => {
  // Deliberately non-destructive: the verification-date backfill survives rollback.
})
