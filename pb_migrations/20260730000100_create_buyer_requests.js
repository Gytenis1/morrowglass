/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  let collection
  try {
    collection = app.findCollectionByNameOrId("buyer_requests")
  } catch (_) {
    collection = new Collection({
      name: "buyer_requests",
      type: "base",
    })
  }

  // Only unauthenticated visitors may submit. Reading and moderation stay superuser-only.
  collection.listRule = null
  collection.viewRule = null
  collection.createRule = "@request.auth.id = ''"
  collection.updateRule = null
  collection.deleteRule = null

  const expectedFields = [
    new SelectField({
      name: "project_type",
      required: true,
      maxSelect: 1,
      values: [
        "Virtuvės baldai",
        "Spintos ar įmontuojami baldai",
        "Miegamojo ar vonios baldai",
        "Biuro ar komerciniai baldai",
        "Minkšti baldai",
        "Medžio masyvo ar kiti nestandartiniai baldai",
        "Kitas projektas",
      ],
    }),
    new TextField({ name: "city_region", required: true, min: 2, max: 160 }),
    new SelectField({
      name: "budget_band",
      required: true,
      maxSelect: 1,
      values: [
        "Iki 3 000 €",
        "3 000–6 000 €",
        "6 000–10 000 €",
        "10 000–20 000 €",
        "Daugiau nei 20 000 €",
        "Biudžetas dar nenustatytas",
      ],
    }),
    new SelectField({
      name: "timeline",
      required: true,
      maxSelect: 1,
      values: [
        "Per 1–3 mėnesius",
        "Per 3–6 mėnesius",
        "Vėliau nei po 6 mėnesių",
        "Terminas lankstus",
        "Dar nežinau",
      ],
    }),
    new TextField({ name: "project_brief", required: true, min: 40, max: 3000 }),
    new TextField({ name: "contact_name", required: true, min: 2, max: 120 }),
    new EmailField({ name: "contact_email", required: true }),
    new JSONField({ name: "shortlisted_manufacturer_slugs", required: false, maxSize: 4096 }),
    new SelectField({ name: "status", required: true, maxSelect: 1, values: ["new"] }),
    new TextField({ name: "honeypot", max: 200 }),
  ]

  for (const expected of expectedFields) {
    const existing = collection.fields.getByName(expected.name)
    if (!existing) {
      collection.fields.add(expected)
      continue
    }
    if (existing.type() !== expected.type()) {
      throw new Error("buyer_requests." + expected.name + " exists with incompatible type " + existing.type())
    }

    // Preserve stable field ids while converging safely after a partial migration run.
    existing.required = expected.required
    existing.setHidden(expected.getHidden())
    if (expected.min !== undefined) existing.min = expected.min
    if (expected.max !== undefined) existing.max = expected.max
    if (expected.maxSize !== undefined) existing.maxSize = expected.maxSize
    if (expected.maxSelect !== undefined) existing.maxSelect = expected.maxSelect
    if (expected.values !== undefined) existing.values = expected.values
  }

  const created = collection.fields.getByName("created")
  if (!created) {
    collection.fields.add(new AutodateField({ name: "created", onCreate: true, onUpdate: false }))
  } else {
    if (created.type() !== "autodate") {
      throw new Error("buyer_requests.created exists with incompatible type " + created.type())
    }
    created.onCreate = true
    created.onUpdate = false
  }

  const hasQueueIndex = collection.indexes.some((index) => index.includes("idx_buyer_requests_status_created"))
  if (!hasQueueIndex) {
    collection.addIndex("idx_buyer_requests_status_created", false, "status, created", "")
  }

  app.save(collection)
}, (app) => {
  // Deliberately non-destructive: submitted buyer requests and schema survive rollback.
})
