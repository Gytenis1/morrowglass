/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  let collection
  try {
    collection = app.findCollectionByNameOrId("owner_enquiries")
  } catch (_) {
    collection = new Collection({
      name: "owner_enquiries",
      type: "base",
    })
  }

  // Visitors may submit confidential enquiries, but only superusers may read or moderate them.
  collection.listRule = null
  collection.viewRule = null
  collection.createRule = "@request.auth.id = ''"
  collection.updateRule = null
  collection.deleteRule = null

  const expectedFields = [
    new TextField({ name: "company_name", required: true, min: 2, max: 160 }),
    new TextField({ name: "city", required: true, min: 2, max: 160 }),
    new TextField({ name: "sector", required: true, min: 2, max: 160 }),
    new SelectField({
      name: "revenue_band",
      required: true,
      maxSelect: 1,
      values: [
        "Iki 1 mln. €",
        "1–3 mln. €",
        "3–10 mln. €",
        "Daugiau nei 10 mln. €",
        "Nenoriu nurodyti",
      ],
    }),
    new SelectField({
      name: "ebitda_band",
      required: true,
      maxSelect: 1,
      values: [
        "Iki 300 tūkst. €",
        "300–750 tūkst. €",
        "750 tūkst.–1,5 mln. €",
        "1,5–2,5 mln. €",
        "Daugiau nei 2,5 mln. €",
        "Nenoriu nurodyti",
      ],
    }),
    new SelectField({
      name: "ownership_succession_situation",
      required: true,
      maxSelect: 1,
      values: [
        "Paveldėjimo ar įpėdinystės planavimas",
        "Savininko pasitraukimas iš kasdienės veiklos",
        "Dalinio ar visiško pardavimo svarstymas",
        "Kita tęstinumo situacija",
      ],
    }),
    new SelectField({
      name: "timeline",
      required: true,
      maxSelect: 1,
      values: [
        "Per artimiausius 6 mėn.",
        "Per 6–18 mėn.",
        "Vėliau nei po 18 mėn.",
        "Noriu pradėti be konkretaus termino",
      ],
    }),
    new TextField({ name: "message", required: true, min: 40, max: 3000 }),
    new TextField({ name: "contact_name", required: true, min: 2, max: 120 }),
    new EmailField({ name: "contact_email", required: true }),
    new TextField({ name: "contact_phone", max: 40 }),
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
      throw new Error("owner_enquiries." + expected.name + " exists with incompatible type " + existing.type())
    }

    // Keep stable field ids while making a partially applied schema converge safely.
    existing.required = expected.required
    existing.setHidden(expected.getHidden())
    if (expected.min !== undefined) existing.min = expected.min
    if (expected.max !== undefined) existing.max = expected.max
    if (expected.maxSelect !== undefined) existing.maxSelect = expected.maxSelect
    if (expected.values !== undefined) existing.values = expected.values
  }

  const created = collection.fields.getByName("created")
  if (!created) {
    collection.fields.add(new AutodateField({ name: "created", onCreate: true, onUpdate: false }))
  } else {
    if (created.type() !== "autodate") {
      throw new Error("owner_enquiries.created exists with incompatible type " + created.type())
    }
    created.onCreate = true
    created.onUpdate = false
  }

  const hasQueueIndex = collection.indexes.some((index) => index.includes("idx_owner_enquiries_status_created"))
  if (!hasQueueIndex) {
    collection.addIndex("idx_owner_enquiries_status_created", false, "status, created", "")
  }

  app.save(collection)
}, (app) => {
  // Deliberately non-destructive: confidential owner enquiries and schema survive rollback.
})
