/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  // The owner-enquiries collection is created by the preceding migration. Do not
  // create it here: this migration must not change its rules or existing fields.
  const collection = app.findCollectionByNameOrId("owner_enquiries")

  const expectedFields = [
    new NumberField({ name: "valuation_revenue_eur", required: false, min: 0, max: 1000000000000 }),
    new NumberField({ name: "valuation_ebitda_eur", required: false, min: 0, max: 1000000000000 }),
    new SelectField({
      name: "valuation_owner_involvement",
      required: false,
      maxSelect: 1,
      values: [
        "Kasdienis operacinis vaidmuo",
        "Dalinė operacinė veikla",
        "Nedalyvauja kasdienėje veikloje",
      ],
    }),
    new SelectField({
      name: "valuation_customer_concentration",
      required: false,
      maxSelect: 1,
      values: [
        "Nė vienas klientas nesudaro daugiau nei 20 % pajamų",
        "Didžiausias klientas sudaro 20–40 % pajamų",
        "Didžiausias klientas sudaro daugiau nei 40 % pajamų",
      ],
    }),
    new SelectField({
      name: "valuation_order_backlog",
      required: false,
      maxSelect: 1,
      values: [
        "Mažiau nei 3 mėn.",
        "3–6 mėn.",
        "Daugiau nei 6 mėn.",
      ],
    }),
    new NumberField({ name: "valuation_ev_low_eur", required: false, min: 0, max: 20000000000000 }),
    new NumberField({ name: "valuation_ev_high_eur", required: false, min: 0, max: 20000000000000 }),
    new NumberField({ name: "valuation_ebitda_multiple_low", required: false, min: 1, max: 20 }),
    new NumberField({ name: "valuation_ebitda_multiple_high", required: false, min: 1, max: 20 }),
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

    // Preserve the stable field id created by a prior partial run while making
    // the field constraints converge on every retry.
    existing.required = expected.required
    existing.setHidden(expected.getHidden())
    if (expected.min !== undefined) existing.min = expected.min
    if (expected.max !== undefined) existing.max = expected.max
    if (expected.maxSelect !== undefined) existing.maxSelect = expected.maxSelect
    if (expected.values !== undefined) existing.values = expected.values
  }

  return app.save(collection)
}, () => {
  // Deliberately non-destructive: submitted confidential enquiries survive rollback.
})
