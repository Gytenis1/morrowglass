/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const collection = app.findCollectionByNameOrId("owner_enquiries")
  const expectedFields = [
    new NumberField({ name: "valuation_multiple_low", required: false, min: 1, max: 20 }),
    new NumberField({ name: "valuation_multiple_high", required: false, min: 1, max: 20 }),
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

    // Preserve a field id from a partial prior run while converging constraints.
    existing.required = expected.required
    existing.setHidden(expected.getHidden())
    existing.min = expected.min
    existing.max = expected.max
  }

  return app.save(collection)
}, () => {
  // Deliberately non-destructive: existing fields and submitted enquiries survive rollback.
})
