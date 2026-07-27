/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  let collection
  try {
    collection = app.findCollectionByNameOrId("correction_requests")
  } catch (_) {
    collection = new Collection({
      name: "correction_requests",
      type: "base",
    })
  }

  // Visitors may submit reports, but only superusers may read or moderate them.
  collection.listRule = null
  collection.viewRule = null
  // PocketBase evaluates create rules before text autogeneration, so allow the empty
  // incoming value that is immediately normalized to "new" by the status field.
  collection.createRule = "status = '' || status = 'new'"
  collection.updateRule = null
  collection.deleteRule = null

  const expectedFields = [
    new TextField({
      name: "manufacturer_slug",
      required: true,
      min: 1,
      max: 180,
      pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
    }),
    new TextField({ name: "manufacturer_display_name", max: 240 }),
    new SelectField({
      name: "request_kind",
      required: true,
      maxSelect: 1,
      values: ["correction", "claim"],
    }),
    new TextField({ name: "report_text", required: true, min: 1, max: 5000 }),
    new EmailField({ name: "contact_email" }),
    new TextField({
      name: "status",
      required: true,
      min: 3,
      max: 9,
      pattern: "^(new|in_review|resolved|rejected)$",
      autogeneratePattern: "new",
    }),
  ]

  for (const expected of expectedFields) {
    const existing = collection.fields.getByName(expected.name)
    if (!existing) {
      collection.fields.add(expected)
      continue
    }
    if (existing.type() !== expected.type()) {
      throw new Error("correction_requests." + expected.name + " exists with incompatible type " + existing.type())
    }

    // Keep stable field ids while making a partially applied schema converge safely.
    existing.required = expected.required
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
      throw new Error("correction_requests.created exists with incompatible type " + created.type())
    }
    created.onCreate = true
    created.onUpdate = false
  }

  const hasQueueIndex = collection.indexes.some((index) => index.includes("idx_correction_requests_status_created"))
  if (!hasQueueIndex) {
    collection.addIndex("idx_correction_requests_status_created", false, "status, created", "")
  }

  app.save(collection)
}, (app) => {
  // Deliberately non-destructive: submitted correction reports and schema survive rollback.
})
