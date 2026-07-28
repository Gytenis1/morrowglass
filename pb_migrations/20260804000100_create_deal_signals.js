/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  let collection
  try {
    collection = app.findCollectionByNameOrId("deal_signals")
  } catch (_) {
    collection = new Collection({
      name: "deal_signals",
      type: "base",
    })
  }

  if (collection.type !== "base") {
    throw new Error("deal_signals exists with incompatible collection type " + collection.type)
  }

  // Deal intelligence is confidential and available only to superusers.
  collection.listRule = null
  collection.viewRule = null
  collection.createRule = null
  collection.updateRule = null
  collection.deleteRule = null

  const expectedFields = [
    new TextField({ name: "company_name", required: true, min: 1, max: 300 }),
    new SelectField({ name: "country", required: true, maxSelect: 1, values: ["LT", "LV", "EE"] }),
    new TextField({ name: "city", max: 240 }),
    new TextField({ name: "company_code", max: 120 }),
    new SelectField({
      name: "sector_tag",
      required: true,
      maxSelect: 1,
      values: ["tic_labs", "cleaning_hygiene", "facilities_services", "furniture", "other"],
    }),
    new SelectField({
      name: "signal_type",
      required: true,
      maxSelect: 1,
      values: ["for_sale_listing", "broker_mandate", "insolvency_restructuring", "ownership_change", "succession_press", "other"],
    }),
    new DateField({ name: "signal_date", required: true }),
    new TextField({ name: "source_name", max: 500 }),
    new TextField({ name: "source_url", required: true, min: 1, max: 4096 }),
    new TextField({ name: "evidence_quote", max: 12000 }),
    new NumberField({ name: "estimated_revenue_eur", min: 0 }),
    new SelectField({ name: "mandate_fit", required: true, maxSelect: 1, values: ["high", "medium", "low", "excluded"] }),
    new TextField({ name: "fit_rationale", max: 4000 }),
    new TextField({ name: "matched_shortlist_entry", max: 500 }),
    // TextField autogeneration gives new records a valid default while its pattern
    // keeps all persisted status values within the supported workflow states.
    new TextField({
      name: "status",
      required: true,
      min: 3,
      max: 7,
      pattern: "^(new|triaged|monitor|dropped)$",
      autogeneratePattern: "new",
    }),
    new TextField({ name: "notes", max: 12000 }),
  ]

  for (const expected of expectedFields) {
    const existing = collection.fields.getByName(expected.name)
    if (!existing) {
      collection.fields.add(expected)
      continue
    }
    if (existing.type() !== expected.type()) {
      throw new Error("deal_signals." + expected.name + " exists with incompatible type " + existing.type())
    }

    // Preserve stable field ids while converging a collection left by a partial run.
    existing.required = expected.required
    existing.setHidden(expected.getHidden())
    if (expected.min !== undefined) existing.min = expected.min
    if (expected.max !== undefined) existing.max = expected.max
    if (expected.pattern !== undefined) existing.pattern = expected.pattern
    if (expected.autogeneratePattern !== undefined) existing.autogeneratePattern = expected.autogeneratePattern
    if (expected.maxSelect !== undefined) existing.maxSelect = expected.maxSelect
    if (expected.values !== undefined) existing.values = expected.values
  }

  const created = collection.fields.getByName("created")
  if (!created) {
    collection.fields.add(new AutodateField({ name: "created", onCreate: true, onUpdate: false }))
  } else {
    if (created.type() !== "autodate") {
      throw new Error("deal_signals.created exists with incompatible type " + created.type())
    }
    created.onCreate = true
    created.onUpdate = false
  }

  const hasSourceUrlIndex = collection.indexes.some((index) => index.includes("idx_deal_signals_source_url"))
  if (!hasSourceUrlIndex) {
    collection.addIndex("idx_deal_signals_source_url", true, "source_url", "")
  }

  const hasCompanySignalDateIndex = collection.indexes.some((index) => index.includes("idx_deal_signals_company_signal_date"))
  if (!hasCompanySignalDateIndex) {
    collection.addIndex("idx_deal_signals_company_signal_date", true, "company_name, signal_type, signal_date", "")
  }

  return app.save(collection)
}, (app) => {
  // Deliberately non-destructive: confidential deal intelligence survives rollback.
})
