/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  // This is deliberately restricted to the 44 original registry-import rows whose
  // address enrichment had no published JAR Būveinė-to-Adresas relationship.
  const manifest = require(__hooks + "/../data/registry_location_gaps_20260807.json")
  const checkedDate = "2026-08-07"
  const expectedUniverseSha256 = "b524fb421c9deb81897aa79ec9cb73ee50e938bccd3922e057878afc97d8927f"
  const expectedEnrichmentSha256 = "2d4eaf7756cb3d1de0375ceb7d788d237429616d6b750bd96f44cc17593cccd3"
  const expectedCount = 44
  const apiBase = "https://get.data.gov.lt"
  const jarModel = "datasets/gov/rc/jar/iregistruoti/JuridinisAsmuo"
  const buveineModel = "datasets/gov/rc/jar/buveines/Buveine"
  const addressModel = "datasets/gov/rc/ar/adresai/Adresas"
  const buildingModel = "datasets/gov/rc/ar/pastatas/Pastatas"
  const premisesModel = "datasets/gov/rc/ar/patalpa/Patalpa"
  const localityModel = "datasets/gov/rc/ar/gyvenamojivietove/GyvenamojiVietove"
  const streetModel = "datasets/gov/rc/ar/gatve/Gatve"
  const sourceModels = [jarModel, buveineModel, addressModel, buildingModel, premisesModel, localityModel, streetModel]
  const nationalCity = "Lietuva"
  const nationalLabel = "Visa Lietuva (miestas nenurodytas oficialiame šaltinyje)"
  const statusFieldName = "official_location_status"
  const checkedDateFieldName = "official_location_checked_date"
  const referenceKey = "registry_location_gap_status_20260807"
  const codePattern = /^\d{7,12}$/
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
  const sameJson = (left, right) => JSON.stringify(left) === JSON.stringify(right)
  const validText = (value, maximum) => typeof value === "string" && value.trim().length > 0 && value.length <= maximum
  const validUuid = (value) => typeof value === "string" && uuidPattern.test(value)
  const sqlValue = (value) => {
    if (value === null || value === undefined) return "NULL"
    return "'" + String(value).replaceAll("'", "''") + "'"
  }
  const get = (record, name) => record.getString(name)
  const stableId = (slug) => {
    let first = 2166136261
    let second = 2246822507
    for (let index = 0; index < slug.length; index++) {
      const code = slug.charCodeAt(index)
      first = Math.imul(first ^ code, 16777619)
      second = Math.imul(second ^ (code + index), 3266489917)
    }
    return "r" + (first >>> 0).toString(36).padStart(7, "0") + (second >>> 0).toString(36).padStart(7, "0")
  }
  const recordUrl = (model, id) => apiBase + "/" + model + "?_id=\"" + id + "\"&limit(2)"
  const codeUrl = (code) => apiBase + "/" + jarModel + "?ja_kodas=" + String(Number(code)) + "&limit(2)"
  const buveineUrl = (id) => apiBase + "/" + buveineModel + "?juridinis_asmuo._id=\"" + id + "\"&limit(1000)"
  const legacyUrl = (model, id) => apiBase + "/" + model + "/" + id
  const parseJson = (value, label) => {
    try {
      const parsed = JSON.parse(value)
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("not an object")
      return parsed
    } catch (_) {
      throw new Error("registry location-gap status requires valid " + label)
    }
  }
  const sourceCitation = (source, model, id) => source && source.api_model_path === model && source.record_id === id &&
    source.official_record_url === recordUrl(model, id)
  const queryCitation = (source, model, url, predicate) => source && source.api_model_path === model &&
    source.official_query_url === url && source.exact_predicate === predicate

  // The entire committed checkpoint is checked before the collection is even read.
  // This fails closed on a substituted/truncated file and never uses legal names.
  if (!manifest || manifest.manifest_version !== 1 || manifest.checked_date !== checkedDate ||
      !manifest.input || manifest.input.universe_path !== "data/registry_universe_20260807.json" ||
      manifest.input.universe_sha256 !== expectedUniverseSha256 ||
      manifest.input.address_enrichment_path !== "data/registry_address_enrichment_20260807.json" ||
      manifest.input.address_enrichment_sha256 !== expectedEnrichmentSha256 ||
      !sameJson(manifest.input.identity_key, ["company_code", "slug"]) ||
      manifest.input.expected_gap_candidate_count !== expectedCount ||
      !manifest.official_sources || manifest.official_sources.api_base !== apiBase ||
      manifest.official_sources.jar_data_portal_url !== "https://data.gov.lt/datasets/1484/" ||
      manifest.official_sources.address_data_portal_url !== "https://data.gov.lt/datasets/1342/" ||
      !sameJson(manifest.official_sources.models, sourceModels) ||
      !manifest.accounting || manifest.accounting.gap_candidates !== expectedCount ||
      manifest.accounting.resolved !== 0 || manifest.accounting.location_not_published !== expectedCount ||
      !Array.isArray(manifest.results) || manifest.results.length !== expectedCount ||
      !validText(manifest.no_inference_rule, 2400)) {
    throw new Error("registry location-gap status requires the complete 44-row official 2026-08-07 checkpoint")
  }

  const rows = []
  const rowsByCode = new Map()
  const rowsById = new Map()
  for (const result of manifest.results) {
    if (!result || !codePattern.test(result.company_code || "") || !slugPattern.test(result.slug || "") ||
        !result.identity_key || result.identity_key.company_code !== result.company_code || result.identity_key.slug !== result.slug ||
        rowsByCode.has(result.company_code)) {
      throw new Error("registry location-gap status has an invalid or duplicate import identity")
    }
    const identity = result.official_jar_identity
    if (!identity || !validUuid(identity.jar_entity_id) || identity.company_code_field !== "ja_kodas" ||
        identity.company_code_value !== result.company_code || !sourceCitation(identity.jar_entity_source, jarModel, identity.jar_entity_id)) {
      throw new Error("registry location-gap status has invalid official JAR identity evidence for " + result.company_code)
    }
    if (result.check_date !== checkedDate || !Array.isArray(result.checked_paths) || result.checked_paths.length < 3) {
      throw new Error("registry location-gap status has incomplete official checks for " + result.company_code)
    }
    const entityPath = result.checked_paths[0]
    const codePath = result.checked_paths[1]
    const relationshipPath = result.checked_paths[2]
    if (!entityPath || entityPath.path !== "JAR JuridinisAsmuo exact UUID" || entityPath.matching_rows !== 1 ||
        !queryCitation(entityPath.source, jarModel, recordUrl(jarModel, identity.jar_entity_id), "_id=\"" + identity.jar_entity_id + "\"") ||
        !entityPath.published_fields || entityPath.published_fields.pilnas_adresas !== null || entityPath.published_fields.adresas !== null ||
        !codePath || codePath.path !== "JAR JuridinisAsmuo exact company code" || codePath.matching_rows !== 1 ||
        codePath.confirmed_jar_entity_id !== identity.jar_entity_id ||
        !queryCitation(codePath.source, jarModel, codeUrl(result.company_code), "ja_kodas=" + String(Number(result.company_code))) ||
        !relationshipPath || relationshipPath.path !== "JAR Buveine.juridinis_asmuo._id exact relationship" ||
        !Number.isInteger(relationshipPath.matching_rows) || relationshipPath.matching_rows < 0 ||
        !queryCitation(relationshipPath.source, buveineModel, buveineUrl(identity.jar_entity_id), "juridinis_asmuo._id=\"" + identity.jar_entity_id + "\"") ||
        !Array.isArray(relationshipPath.published_relations) || relationshipPath.matching_rows !== relationshipPath.published_relations.length ||
        relationshipPath.published_relations.some((relation) => !relation || !validUuid(relation.buveine_id) || relation.adresas_id !== null)) {
      throw new Error("registry location-gap status has invalid exact JAR entity/code/Būveinė evidence for " + result.company_code)
    }
    for (const path of result.checked_paths) {
      if (!path || !path.source || !sourceModels.includes(path.source.api_model_path) ||
          typeof path.source.official_query_url !== "string" || !path.source.official_query_url.startsWith(apiBase + "/") ||
          !validText(path.source.exact_predicate, 500)) {
        throw new Error("registry location-gap status has malformed official source URL structure for " + result.company_code)
      }
    }

    if (result.status === "location_not_published") {
      if (result.no_inference_rule !== manifest.no_inference_rule || Object.prototype.hasOwnProperty.call(result, "location_components")) {
        throw new Error("registry location-gap status has unsupported unpublished-location evidence for " + result.company_code)
      }
    } else if (result.status === "resolved") {
      if (!validText(result.resolution_rule, 2400) || !result.location_components || typeof result.location_components !== "object" ||
          !Object.keys(result.location_components).length || Object.values(result.location_components).some((component) =>
            !component || !validText(component.value, 1000) || !component.source || !sourceModels.includes(component.source.api_model_path) ||
            !validUuid(component.source.record_id) || !sourceCitation(component.source, component.source.api_model_path, component.source.record_id))) {
        throw new Error("registry location-gap status has unsupported resolved official evidence for " + result.company_code)
      }
    } else {
      throw new Error("registry location-gap status has an unsupported status for " + result.company_code)
    }

    const id = stableId(result.slug)
    if (rowsById.has(id)) throw new Error("registry location-gap status generated duplicate deterministic import IDs")
    const evidence = {
      checkpoint: {
        manifest_version: manifest.manifest_version,
        checked_date: checkedDate,
        universe_sha256: expectedUniverseSha256,
        address_enrichment_sha256: expectedEnrichmentSha256,
        source_file: "data/registry_location_gaps_20260807.json",
      },
      result,
    }
    const row = { id, company_code: result.company_code, slug: result.slug, jar_entity_id: identity.jar_entity_id, status: result.status, evidence: JSON.stringify(evidence) }
    rows.push(row)
    rowsByCode.set(row.company_code, row)
    rowsById.set(row.id, row)
  }
  if (rows.length !== expectedCount || rowsByCode.size !== expectedCount || rowsById.size !== expectedCount ||
      rows.some((row) => row.status !== "location_not_published")) {
    throw new Error("registry location-gap status checkpoint accounting does not reconcile to 44 unpublished locations")
  }

  const collection = app.findCollectionByNameOrId("manufacturers")
  const requiredFields = {
    company_code: "text", slug: "text", source_collection_date: "text", source_identity: "text",
    city: "text", location: "text", region: "select", region_label: "text", street_address: "text", postcode: "text",
    source_urls: "json", public_details_source_urls: "json", official_registered_address_reference: "json",
    revenue_eur_latest: "number", revenue_year: "number", revenue_availability: "select",
    financial_verification_status: "select", filed_financial_history: "json",
  }
  for (const [name, type] of Object.entries(requiredFields)) {
    const field = collection.fields.getByName(name)
    if (!field || field.type() !== type) throw new Error("manufacturers." + name + " must be a " + type + " field")
  }

  // Only absent fields are added; a pre-existing incompatible or narrower field is
  // unsafe and stops this migration rather than rewriting unrelated schema.
  let schemaChanged = false
  const statusField = collection.fields.getByName(statusFieldName)
  if (!statusField) {
    collection.fields.add(new SelectField({ name: statusFieldName, maxSelect: 1, values: ["resolved", "location_not_published"] }))
    schemaChanged = true
  } else if (statusField.type() !== "select" || statusField.maxSelect !== 1 || !Array.isArray(statusField.values) ||
             !["resolved", "location_not_published"].every((value) => statusField.values.includes(value))) {
    throw new Error("manufacturers." + statusFieldName + " must be a compatible single-select field")
  }
  const dateField = collection.fields.getByName(checkedDateFieldName)
  if (!dateField) {
    // The checkpoint supplies a calendar day, not a timestamp; retain that exact
    // precision and formatting as all other registry checked-date fields do.
    collection.fields.add(new TextField({ name: checkedDateFieldName, min: 10, max: 10, pattern: "^\\d{4}-\\d{2}-\\d{2}$" }))
    schemaChanged = true
  } else if (dateField.type() !== "text") {
    throw new Error("manufacturers." + checkedDateFieldName + " must be a text field")
  }

  // Read and prove every target before a schema/data write. The date, original
  // company code, slug, and deterministic import ID must all agree; names are never
  // read or used as a join condition.
  const invariantCandidates = [
    "id", "created", "updated", "slug", "company_code", "legal_name", "trading_name", "source_identity", "legal_entity_known", "description_lt",
    "location", "city", "region", "region_label", "category_codes", "category_labels", "audience", "website", "public_phone",
    "public_contact_url", "street_address", "postcode", "portfolio_status", "confidence", "confidence_evidence", "scope_evidence",
    "evidence_source_type", "source_urls", "public_details_source_urls", "source_artifact_url", "source_collection_date",
    "verification_status", "founded_year", "financial_source_url", "revenue_eur_latest", "revenue_year", "revenue_availability",
    "financial_verification_status", "filed_financial_history", "verified_at", "registry_match_status", "registry_match_checked_date",
    "no_public_contact_route", "public_contact_checked_date", "low_completeness", "website_lookup_status", "website_checked_date",
    "facts_lookup_status", "facts_checked_date", "owner_manager_name", "employee_count_band", "registry_financials_checked_date",
  ]
  const invariantFields = invariantCandidates.filter((name) => name === "id" || name === "created" || name === "updated" || collection.fields.getByName(name))
  const snapshots = new Map()
  const preflightBatchSize = 44
  for (let offset = 0; offset < rows.length; offset += preflightBatchSize) {
    const batch = rows.slice(offset, offset + preflightBatchSize)
    const filter = "source_collection_date = " + sqlValue(checkedDate) + " && (" + batch.map((row) => "company_code = " + sqlValue(row.company_code)).join(" || ") + ")"
    const found = app.findRecordsByFilter("manufacturers", filter, "", 100, 0)
    if (found.length !== batch.length) throw new Error("registry location-gap status could not prove the complete 44-record target set")
    for (const record of found) {
      const row = rowsByCode.get(get(record, "company_code"))
      if (!row || record.id !== row.id || get(record, "slug") !== row.slug || get(record, "source_collection_date") !== checkedDate ||
          !get(record, "source_identity").includes("JAR juridinio asmens ID " + row.jar_entity_id) ||
          !get(record, "source_identity").includes("tikslus įmonės kodas " + row.company_code)) {
        throw new Error("registry location-gap status found a non-import target identity")
      }
      const jarUrl = legacyUrl(jarModel, row.jar_entity_id)
      const sourceUrls = parseJson(get(record, "source_urls"), "source_urls")
      const publicSourceUrls = parseJson(get(record, "public_details_source_urls"), "public_details_source_urls")
      if (!Array.isArray(sourceUrls) || !sourceUrls.includes(jarUrl) || !Array.isArray(publicSourceUrls) || !publicSourceUrls.includes(jarUrl)) {
        throw new Error("registry location-gap status cannot prove original official JAR provenance for " + row.company_code)
      }
      const reference = parseJson(get(record, "official_registered_address_reference"), "registered-address reference")
      if (!reference.registered_address || !reference.official_record_urls || reference.official_record_urls.jar_entity !== jarUrl ||
          reference.registered_address.buveine || reference.registered_address.address_registry ||
          reference.official_record_urls.buveine || reference.official_record_urls.address_registry) {
        throw new Error("registry location-gap status cannot preserve original no-Būveinė address evidence for " + row.company_code)
      }
      const existingEvidence = reference[referenceKey]
      if (existingEvidence && !sameJson(existingEvidence, JSON.parse(row.evidence))) {
        throw new Error("registry location-gap status found conflicting prior checkpoint evidence for " + row.company_code)
      }
      if (get(record, "region") !== "national" || get(record, "city") !== nationalCity || get(record, "location") !== nationalCity ||
          get(record, "region_label") !== nationalLabel || get(record, "street_address") !== "" || get(record, "postcode") !== "") {
        throw new Error("registry location-gap status refuses to change the national fallback or blank address fields for " + row.company_code)
      }
      const invariants = {}
      for (const field of invariantFields) invariants[field] = field === "id" ? record.id : get(record, field)
      const referenceBase = JSON.parse(JSON.stringify(reference))
      delete referenceBase[referenceKey]
      snapshots.set(record.id, { invariants, referenceBase })
    }
  }
  if (snapshots.size !== expectedCount) throw new Error("registry location-gap status did not preflight every checkpoint identity")

  // Saving the guarded fields once is safe after a killed boot: a retry finds the
  // same compatible fields, then repeats the deterministic target-only updates.
  if (schemaChanged) app.save(collection)

  const sourceValue = (field) => "(SELECT `" + field + "` FROM `source` WHERE `source`.`id` = `manufacturers`.`id` AND `source`.`company_code` = `manufacturers`.`company_code` AND `source`.`slug` = `manufacturers`.`slug`)"
  const batchSize = 44
  for (let offset = 0; offset < rows.length; offset += batchSize) {
    const batch = rows.slice(offset, offset + batchSize)
    const values = batch.map((row) => "(" + [row.id, row.company_code, row.slug, row.status, checkedDate, row.evidence].map(sqlValue).join(", ") + ")").join(", ")
    const sourceStatus = sourceValue("status")
    const sourceDate = sourceValue("checked_date")
    const sourceEvidence = sourceValue("evidence")
    const mergedReference = "json_set(`official_registered_address_reference`, '$." + referenceKey + "', json(" + sourceEvidence + "))"
    // This bounded atomic update has all four immutable identity predicates in both
    // the CTE lookup and WHERE clause. It writes only the two outcome fields and the
    // checkpoint-owned evidence object; it cannot manufacture a locality or address.
    app.db().newQuery(
      "WITH `source` (`id`, `company_code`, `slug`, `status`, `checked_date`, `evidence`) AS (VALUES " + values + ") " +
      "UPDATE `manufacturers` SET " +
        "`" + statusFieldName + "` = " + sourceStatus + ", " +
        "`" + checkedDateFieldName + "` = " + sourceDate + ", " +
        "`official_registered_address_reference` = " + mergedReference + " " +
      "WHERE `source_collection_date` = " + sqlValue(checkedDate) + " AND EXISTS (SELECT 1 FROM `source` WHERE " +
        "`source`.`id` = `manufacturers`.`id` AND `source`.`company_code` = `manufacturers`.`company_code` AND `source`.`slug` = `manufacturers`.`slug`)"
    ).execute()
  }

  // Full post-write proof makes both fresh runs and retries converge: every target
  // has the explicit status/date/full evidence while fallback, financial, and every
  // other snapshotted field retains its pre-write value.
  const seenPostIds = new Set()
  let postUnpublished = 0
  for (let offset = 0; offset < rows.length; offset += preflightBatchSize) {
    const batch = rows.slice(offset, offset + preflightBatchSize)
    const filter = "source_collection_date = " + sqlValue(checkedDate) + " && (" + batch.map((row) => "company_code = " + sqlValue(row.company_code)).join(" || ") + ")"
    const found = app.findRecordsByFilter("manufacturers", filter, "", 100, 0)
    if (found.length !== batch.length) throw new Error("registry location-gap status post-write target cardinality changed")
    for (const record of found) {
      const row = rowsByCode.get(get(record, "company_code"))
      const snapshot = row && snapshots.get(record.id)
      if (!row || !snapshot || seenPostIds.has(record.id) || record.id !== row.id || get(record, "slug") !== row.slug) {
        throw new Error("registry location-gap status post-write identity validation failed")
      }
      seenPostIds.add(record.id)
      for (const field of invariantFields) {
        const actual = field === "id" ? record.id : get(record, field)
        if (actual !== snapshot.invariants[field]) throw new Error("registry location-gap status changed invariant " + field + " for " + row.company_code)
      }
      if (get(record, statusFieldName) !== "location_not_published" || get(record, checkedDateFieldName) !== checkedDate ||
          get(record, "city") !== nationalCity || get(record, "location") !== nationalCity || get(record, "region_label") !== nationalLabel ||
          get(record, "street_address") !== "" || get(record, "postcode") !== "") {
        throw new Error("registry location-gap status did not retain the explicit unpublished national fallback for " + row.company_code)
      }
      const reference = parseJson(get(record, "official_registered_address_reference"), "post-write registered-address reference")
      if (!sameJson(reference[referenceKey], JSON.parse(row.evidence))) {
        throw new Error("registry location-gap status did not retain complete source-cited checkpoint evidence for " + row.company_code)
      }
      const referenceBase = JSON.parse(JSON.stringify(reference))
      delete referenceBase[referenceKey]
      if (!sameJson(referenceBase, snapshot.referenceBase)) {
        throw new Error("registry location-gap status changed pre-existing registered-address evidence for " + row.company_code)
      }
      postUnpublished++
    }
  }
  if (seenPostIds.size !== expectedCount || postUnpublished !== expectedCount) {
    throw new Error("registry location-gap status post-write accounting does not reconcile")
  }
}, (app) => {
  // Deliberately non-destructive: official evidence and explicit unpublished status survive rollback.
})
