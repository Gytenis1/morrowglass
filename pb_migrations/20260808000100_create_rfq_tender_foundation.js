/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const ensureCollection = (name) => {
    try {
      const collection = app.findCollectionByNameOrId(name)
      if (collection.type !== "base") {
        throw new Error(name + " exists with incompatible collection type " + collection.type)
      }
      return collection
    } catch (error) {
      if (String(error).includes("incompatible collection type")) throw error
      return new Collection({ name: name, type: "base" })
    }
  }

  const addOrConvergeFields = (collection, expectedFields) => {
    for (const expected of expectedFields) {
      const existing = collection.fields.getByName(expected.name)
      if (!existing) {
        collection.fields.add(expected)
        continue
      }
      if (existing.type() !== expected.type()) {
        throw new Error(collection.name + "." + expected.name + " exists with incompatible type " + existing.type())
      }

      // Preserve existing field ids while making a partially applied migration converge.
      existing.required = expected.required
      existing.setHidden(expected.getHidden())
      if (expected.min !== undefined) existing.min = expected.min
      if (expected.max !== undefined) existing.max = expected.max
      if (expected.pattern !== undefined) existing.pattern = expected.pattern
      if (expected.maxSize !== undefined) existing.maxSize = expected.maxSize
      if (expected.maxSelect !== undefined) existing.maxSelect = expected.maxSelect
      if (expected.values !== undefined) existing.values = expected.values
      if (expected.onlyInt !== undefined) existing.onlyInt = expected.onlyInt
      if (expected.collectionId !== undefined) existing.collectionId = expected.collectionId
      if (expected.cascadeDelete !== undefined) existing.cascadeDelete = expected.cascadeDelete
      if (expected.onCreate !== undefined) existing.onCreate = expected.onCreate
      if (expected.onUpdate !== undefined) existing.onUpdate = expected.onUpdate
    }
  }

  const ensureIndex = (collection, name, unique, columns) => {
    if (!collection.indexes.some((index) => index.includes(name))) {
      collection.addIndex(name, unique, columns, "")
    }
  }

  const ensurePrivateRules = (collection) => {
    // null rules allow only superusers; no RFQ data has a public collection endpoint.
    collection.listRule = null
    collection.viewRule = null
    collection.createRule = null
    collection.updateRule = null
    collection.deleteRule = null
  }

  const manufacturers = app.findCollectionByNameOrId("manufacturers")

  const rfqs = ensureCollection("rfqs")
  ensurePrivateRules(rfqs)
  addOrConvergeFields(rfqs, [
    new TextField({ name: "reference", required: true, min: 8, max: 48, pattern: "^RFQ-[A-Z0-9]+$" }),
    new TextField({ name: "full_name", required: true, min: 2, max: 120 }),
    new EmailField({ name: "email", required: true }),
    new TextField({ name: "phone", max: 40 }),
    new TextField({ name: "category", required: true, min: 2, max: 120 }),
    new TextField({ name: "municipality", required: true, min: 2, max: 160 }),
    new TextField({ name: "service_region", required: true, min: 2, max: 160 }),
    new TextField({ name: "project_stage", required: true, min: 2, max: 120 }),
    new TextField({ name: "project_scope", required: true, min: 10, max: 5000 }),
    new TextField({ name: "dimensions_room_count", required: true, min: 1, max: 1000 }),
    new TextField({ name: "materials_requirements", required: true, min: 1, max: 3000 }),
    new NumberField({ name: "budget_min", required: true, min: 0 }),
    new NumberField({ name: "budget_max", required: true, min: 0 }),
    new DateField({ name: "desired_completion_date", required: true }),
    new TextField({ name: "installation_access_constraints", required: true, min: 1, max: 3000 }),
    new JSONField({ name: "preferred_shortlist", maxSize: 4096 }),
    new SelectField({ name: "status", required: true, maxSelect: 1, values: ["submitted", "under_review", "approved_for_dispatch", "dispatched", "closed", "cancelled"] }),
    new SelectField({ name: "operator_review_state", required: true, maxSelect: 1, values: ["pending", "approved", "rejected"] }),
    new DateField({ name: "consented_at", required: true }),
    new DateField({ name: "submitted_at", required: true }),
    new DateField({ name: "proposal_deadline" }),
    new TextField({ name: "owner_receipt_token", required: true, min: 32, max: 128 }),
    // Only trace metadata is retained; the contract document itself is neither uploaded nor interpreted.
    new JSONField({ name: "contract_source_trace", required: true, maxSize: 2048 }),
    new AutodateField({ name: "created", onCreate: true, onUpdate: false }),
  ])
  ensureIndex(rfqs, "idx_rfqs_reference", true, "reference")
  ensureIndex(rfqs, "idx_rfqs_status_created", false, "status, created")
  app.save(rfqs)

  const rfqEvents = ensureCollection("rfq_events")
  ensurePrivateRules(rfqEvents)
  addOrConvergeFields(rfqEvents, [
    new RelationField({ name: "rfq", required: true, collectionId: rfqs.id, maxSelect: 1, cascadeDelete: false }),
    new TextField({ name: "event_type", required: true, min: 2, max: 80 }),
    new TextField({ name: "actor", required: true, min: 1, max: 100 }),
    new DateField({ name: "occurred_at", required: true }),
    new JSONField({ name: "details", maxSize: 16384 }),
    new AutodateField({ name: "created", onCreate: true, onUpdate: false }),
  ])
  ensureIndex(rfqEvents, "idx_rfq_events_rfq_occurred", false, "rfq, occurred_at")
  app.save(rfqEvents)

  const rfqDispatches = ensureCollection("rfq_dispatches")
  ensurePrivateRules(rfqDispatches)
  addOrConvergeFields(rfqDispatches, [
    new RelationField({ name: "rfq", required: true, collectionId: rfqs.id, maxSelect: 1, cascadeDelete: false }),
    new TextField({ name: "actor", required: true, min: 1, max: 100 }),
    new DateField({ name: "dispatched_at", required: true }),
    new DateField({ name: "proposal_deadline", required: true }),
    new JSONField({ name: "selected_recipient_ids", required: true, maxSize: 4096 }),
    new JSONField({ name: "approved_fields", required: true, maxSize: 16384 }),
    new TextField({ name: "approval_reference", required: true, min: 2, max: 240 }),
    new AutodateField({ name: "created", onCreate: true, onUpdate: false }),
  ])
  ensureIndex(rfqDispatches, "idx_rfq_dispatches_rfq_dispatched", false, "rfq, dispatched_at")
  app.save(rfqDispatches)

  const rfqProposals = ensureCollection("rfq_proposals")
  ensurePrivateRules(rfqProposals)
  addOrConvergeFields(rfqProposals, [
    new RelationField({ name: "rfq", required: true, collectionId: rfqs.id, maxSelect: 1, cascadeDelete: false }),
    new RelationField({ name: "dispatch", required: true, collectionId: rfqDispatches.id, maxSelect: 1, cascadeDelete: false }),
    new RelationField({ name: "manufacturer", required: true, collectionId: manufacturers.id, maxSelect: 1, cascadeDelete: false }),
    new NumberField({ name: "revision_number", required: true, min: 1, onlyInt: true }),
    new NumberField({ name: "total_amount", required: true, min: 0 }),
    new TextField({ name: "currency", required: true, min: 3, max: 3, pattern: "^[A-Z]{3}$" }),
    new NumberField({ name: "vat_amount", required: true, min: 0 }),
    new BoolField({ name: "vat_included", required: true }),
    new TextField({ name: "scope_clarity", max: 5000 }),
    new TextField({ name: "payment_terms", max: 3000 }),
    new TextField({ name: "design_measurements", max: 5000 }),
    new TextField({ name: "materials_fittings", max: 5000 }),
    new TextField({ name: "timeframe", max: 3000 }),
    new TextField({ name: "installation", max: 5000 }),
    new TextField({ name: "warranty", max: 3000 }),
    new TextField({ name: "exclusions", max: 5000 }),
    new TextField({ name: "notes", max: 8000 }),
    new JSONField({ name: "source_evidence", required: true, maxSize: 16384 }),
    new JSONField({ name: "revision_history", required: true, maxSize: 32768 }),
    new SelectField({ name: "status", required: true, maxSelect: 1, values: ["submitted", "withdrawn"] }),
    new AutodateField({ name: "created", onCreate: true, onUpdate: false }),
  ])
  ensureIndex(rfqProposals, "idx_rfq_proposals_rfq_manufacturer", false, "rfq, manufacturer")
  ensureIndex(rfqProposals, "idx_rfq_proposals_dispatch", false, "dispatch")
  app.save(rfqProposals)
}, (app) => {
  // Deliberately non-destructive: RFQs and their audit trail must survive rollback.
})
