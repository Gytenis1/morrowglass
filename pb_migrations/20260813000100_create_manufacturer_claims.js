/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  let collection;
  try {
    collection = app.findCollectionByNameOrId("manufacturer_claims");
  } catch (_) {
    collection = new Collection({
      name: "manufacturer_claims",
      type: "base",
    });
  }

  if (collection.type !== "base") {
    throw new Error("manufacturer_claims exists with incompatible collection type " + collection.type);
  }

  // Only anonymous visitors can submit claims. Submitted records are private to
  // operators, who bypass API rules when reviewing the controlled status.
  collection.listRule = null;
  collection.viewRule = null;
  collection.createRule = "@request.auth.id = ''";
  collection.updateRule = null;
  collection.deleteRule = null;

  const expectedFields = [
    new TextField({
      name: "manufacturer_slug",
      required: true,
      min: 1,
      max: 180,
      pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
    }),
    new TextField({ name: "company_name", required: true, min: 1, max: 240 }),
    new TextField({ name: "claimant_name", required: true, min: 2, max: 120 }),
    new TextField({ name: "role", required: true, min: 2, max: 160 }),
    new EmailField({ name: "email", required: true }),
    new TextField({ name: "phone", max: 40 }),
    new TextField({ name: "message", required: true, min: 10, max: 5000 }),
    new BoolField({ name: "consent", required: true }),
    new TextField({ name: "honeypot", max: 200 }),
    new SelectField({
      name: "status",
      required: true,
      maxSelect: 1,
      values: ["new", "in_review", "resolved", "rejected"],
    }),
  ];

  for (const expected of expectedFields) {
    const existing = collection.fields.getByName(expected.name);
    if (!existing) {
      collection.fields.add(expected);
      continue;
    }
    if (existing.type() !== expected.type()) {
      throw new Error("manufacturer_claims." + expected.name + " exists with incompatible type " + existing.type());
    }

    // Preserve stable field ids while converging a schema that was only partly saved.
    existing.required = expected.required;
    if (expected.min !== undefined) existing.min = expected.min;
    if (expected.max !== undefined) existing.max = expected.max;
    if (expected.pattern !== undefined) existing.pattern = expected.pattern;
    if (expected.maxSelect !== undefined) existing.maxSelect = expected.maxSelect;
    if (expected.values !== undefined) existing.values = expected.values;
  }

  const created = collection.fields.getByName("created");
  if (!created) {
    collection.fields.add(new AutodateField({ name: "created", onCreate: true, onUpdate: false }));
  } else {
    if (created.type() !== "autodate") {
      throw new Error("manufacturer_claims.created exists with incompatible type " + created.type());
    }
    created.onCreate = true;
    created.onUpdate = false;
  }

  const hasQueueIndex = collection.indexes.some((index) => index.includes("idx_manufacturer_claims_status_created"));
  if (!hasQueueIndex) {
    collection.addIndex("idx_manufacturer_claims_status_created", false, "status, created", "");
  }

  return app.save(collection);
}, () => {
  // Deliberately non-destructive: submitted claims and moderation history survive rollback.
});
