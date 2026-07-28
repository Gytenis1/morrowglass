/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  let collection
  try {
    collection = app.findCollectionByNameOrId("manufacturer_reviews")
  } catch (_) {
    collection = new Collection({
      name: "manufacturer_reviews",
      type: "base",
    })
  }

  if (collection.type !== "base") {
    throw new Error("manufacturer_reviews exists with incompatible collection type " + collection.type)
  }

  const manufacturers = app.findCollectionByNameOrId("manufacturers")

  // Reviews are submitted anonymously and enter moderation before public visibility.
  // Superusers bypass API rules to review and change the controlled status.
  collection.listRule = "status = 'approved'"
  collection.viewRule = "status = 'approved'"
  // The request hook always overwrites client-supplied status with pending.
  collection.createRule = "@request.auth.id = ''"
  collection.updateRule = null
  collection.deleteRule = null

  // These fields must remain writable by an anonymous submission. The request
  // hook removes them from every non-superuser response instead of marking the
  // schema fields hidden (which would discard public create input).
  const contactEmail = new EmailField({ name: "contact_email", required: true })
  const honeypot = new TextField({ name: "honeypot", max: 200 })

  const expectedFields = [
    new RelationField({
      name: "manufacturer",
      required: true,
      collectionId: manufacturers.id,
      maxSelect: 1,
      cascadeDelete: false,
    }),
    new NumberField({ name: "rating", required: true, min: 1, max: 5, onlyInt: true }),
    new TextField({ name: "display_name", required: true, min: 1, max: 80 }),
    new TextField({ name: "review_text", required: true, min: 10, max: 2000 }),
    new TextField({ name: "project_type", max: 120 }),
    contactEmail,
    new SelectField({
      name: "status",
      required: true,
      maxSelect: 1,
      values: ["pending", "approved", "rejected"],
    }),
    honeypot,
  ]

  for (const expected of expectedFields) {
    const existing = collection.fields.getByName(expected.name)
    if (!existing) {
      collection.fields.add(expected)
      continue
    }
    if (existing.type() !== expected.type()) {
      throw new Error("manufacturer_reviews." + expected.name + " exists with incompatible type " + existing.type())
    }

    // Preserve stable field ids while allowing a migration interrupted after a
    // partial save to converge safely on the next boot.
    existing.required = expected.required
    existing.setHidden(expected.getHidden())
    if (expected.min !== undefined) existing.min = expected.min
    if (expected.max !== undefined) existing.max = expected.max
    if (expected.onlyInt !== undefined) existing.onlyInt = expected.onlyInt
    if (expected.maxSelect !== undefined) existing.maxSelect = expected.maxSelect
    if (expected.values !== undefined) existing.values = expected.values
    if (expected.collectionId !== undefined) existing.collectionId = expected.collectionId
    if (expected.cascadeDelete !== undefined) existing.cascadeDelete = expected.cascadeDelete
  }

  const created = collection.fields.getByName("created")
  if (!created) {
    collection.fields.add(new AutodateField({ name: "created", onCreate: true, onUpdate: false }))
  } else {
    if (created.type() !== "autodate") {
      throw new Error("manufacturer_reviews.created exists with incompatible type " + created.type())
    }
    created.onCreate = true
    created.onUpdate = false
  }

  const hasPublicReviewsIndex = collection.indexes.some((index) => index.includes("idx_manufacturer_reviews_manufacturer_status_created"))
  if (!hasPublicReviewsIndex) {
    collection.addIndex("idx_manufacturer_reviews_manufacturer_status_created", false, "manufacturer, status, created", "")
  }

  return app.save(collection)
}, () => {
  // Deliberately non-destructive: submitted reviews and moderation history survive rollback.
})
