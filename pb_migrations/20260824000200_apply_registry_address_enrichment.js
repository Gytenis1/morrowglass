/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  // This checkpoint is deliberately applied only to the immediately preceding
  // 983-row registry import. It is not a general address normalizer.
  const manifest = require(__hooks + "/../data/registry_address_enrichment_20260807.json")
  const checkedDate = "2026-08-07"
  const expectedInputSha256 = "b524fb421c9deb81897aa79ec9cb73ee50e938bccd3922e057878afc97d8927f"
  const expectedCount = 983
  const expectedResolvedAddressCount = 925
  const expectedResolvedCityCount = 939
  const expectedLocalityOnlyCount = 14
  const expectedNoBuveineCount = 44
  const apiBase = "https://get.data.gov.lt"
  const jarModel = "datasets/gov/rc/jar/iregistruoti/JuridinisAsmuo"
  const buveineModel = "datasets/gov/rc/jar/buveines/Buveine"
  const addressModel = "datasets/gov/rc/ar/adresai/Adresas"
  const localityModel = "datasets/gov/rc/ar/gyvenamojivietove/GyvenamojiVietove"
  const buildingModel = "datasets/gov/rc/ar/pastatas/Pastatas"
  const premisesModel = "datasets/gov/rc/ar/patalpa/Patalpa"
  const streetModel = "datasets/gov/rc/ar/gatve/Gatve"
  const nationalCity = "Lietuva"
  const nationalLabel = "Visa Lietuva (miestas nenurodytas oficialiame šaltinyje)"
  const codePattern = /^\d{7,12}$/
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
  const text = (value, maximum) => typeof value === "string" && value.trim().length > 0 && value.length <= maximum
  const uuid = (value) => typeof value === "string" && uuidPattern.test(value)
  const sqlValue = (value) => {
    if (value === null || value === undefined) return "NULL"
    return "'" + String(value).replaceAll("'", "''") + "'"
  }
  const legacyUrl = (model, id) => apiBase + "/" + model + "/" + id
  const queryUrl = (model, id) => apiBase + "/" + model + "?_id=\"" + id + "\"&limit(2)"
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
  const sameJson = (left, right) => JSON.stringify(left) === JSON.stringify(right)
  const get = (record, name) => record.getString(name)
  const citation = (source, model, id) => source && uuid(id) && uuid(source.record_id) && source.api_model_path === model &&
    source.record_id === id && source.official_record_url === queryUrl(model, id)
  const parseJson = (value, label) => {
    try {
      const parsed = JSON.parse(value)
      if (!parsed || typeof parsed !== "object") throw new Error("not an object")
      return parsed
    } catch (_) {
      throw new Error("registry address enrichment requires valid " + label)
    }
  }
  const sourceUrlsContain = (value, url, label) => {
    const parsed = parseJson(value, label)
    if (!Array.isArray(parsed) || !parsed.includes(url)) {
      throw new Error("registry address enrichment lost required JAR URL in " + label)
    }
  }

  // Validate the immutable checkpoint exhaustively before inspecting or changing
  // the collection. This makes a bad, partial, or substituted data file fail closed.
  if (!manifest || manifest.manifest_version !== 1 || manifest.checked_date !== checkedDate ||
      !manifest.input || manifest.input.path !== "data/registry_universe_20260807.json" ||
      manifest.input.sha256 !== expectedInputSha256 || manifest.input.expected_imported_candidate_count !== expectedCount ||
      !Array.isArray(manifest.input.identity_key) || !sameJson(manifest.input.identity_key, ["company_code", "slug"]) ||
      !manifest.official_sources || manifest.official_sources.api_base !== apiBase ||
      manifest.official_sources.address_data_portal_url !== "https://data.gov.lt/datasets/1342/" ||
      manifest.official_sources.jar_data_portal_url !== "https://data.gov.lt/datasets/1484/" ||
      !manifest.official_sources.model_confirmation ||
      !sameJson(manifest.official_sources.model_confirmation.models, [addressModel, buildingModel, premisesModel, localityModel, streetModel]) ||
      !manifest.accounting || manifest.accounting.original_imported_candidates !== expectedCount ||
      manifest.accounting.resolved !== expectedResolvedAddressCount || manifest.accounting.unresolved !== expectedNoBuveineCount + expectedLocalityOnlyCount ||
      manifest.accounting.resolved_city_locality !== expectedResolvedCityCount ||
      manifest.accounting.resolved_formatted_registered_address !== expectedResolvedAddressCount ||
      manifest.accounting.unresolved_no_jar_buveine_relation !== expectedNoBuveineCount ||
      !sameJson(manifest.accounting.unresolved_reason_counts, {
        gatve_exact_uuid_query_returned_0_rows: expectedLocalityOnlyCount,
        no_buveine_address_relation_published: expectedNoBuveineCount,
      }) || !Array.isArray(manifest.results) || manifest.results.length !== expectedCount) {
    throw new Error("registry address enrichment requires the complete official 2026-08-07 checkpoint")
  }

  const rows = []
  const rowsByCode = new Map()
  const rowsById = new Map()
  let fullCount = 0
  let localityOnlyCount = 0
  let noBuveineCount = 0
  for (const result of manifest.results) {
    if (!result || !codePattern.test(result.company_code || "") || !slugPattern.test(result.slug || "") ||
        !result.identity_key || result.identity_key.company_code !== result.company_code || result.identity_key.slug !== result.slug ||
        rowsByCode.has(result.company_code)) {
      throw new Error("registry address enrichment has an invalid or duplicate import identity")
    }
    const identity = result.official_jar_identity
    if (!identity || !uuid(identity.jar_entity_id) || !citation(identity.jar_entity_source, jarModel, identity.jar_entity_id)) {
      throw new Error("registry address enrichment has invalid JAR provenance for " + result.company_code)
    }
    const hasBuveine = identity.buveine_id !== null || identity.buveine_source !== null || identity.adresas_id !== null || identity.adresas_source !== null
    if (hasBuveine && (!uuid(identity.buveine_id) || !citation(identity.buveine_source, buveineModel, identity.buveine_id) ||
        !uuid(identity.adresas_id) || !citation(identity.adresas_source, addressModel, identity.adresas_id))) {
      throw new Error("registry address enrichment has invalid Būveinė/Adresas provenance for " + result.company_code)
    }
    if (!hasBuveine && (identity.buveine_id !== null || identity.buveine_source !== null || identity.adresas_id !== null || identity.adresas_source !== null)) {
      throw new Error("registry address enrichment has inconsistent no-Būveinė identity for " + result.company_code)
    }

    const city = result.city_locality && result.city_locality.value
    if (city !== undefined && (!text(city, 240) || !citation(result.city_locality.source, localityModel, result.city_locality.source && result.city_locality.source.record_id))) {
      throw new Error("registry address enrichment has invalid locality citation for " + result.company_code)
    }
    let formattedAddress = ""
    let postcode = ""
    let kind
    if (result.formatted_registered_address) {
      const formatted = result.formatted_registered_address
      if (!hasBuveine || result.status !== "resolved" || result.unresolved_reason !== undefined || !text(formatted.value, 1000) ||
          !Array.isArray(formatted.component_sources) || formatted.component_sources.length < 3 || !city ||
          !result.address_components || !result.address_components.locality || result.address_components.locality.value !== city ||
          !result.address_components.postcode || !/^LT-\d{5}$/.test(result.address_components.postcode.value || "") ||
          !citation(result.address_components.locality.source, localityModel, result.address_components.locality.source && result.address_components.locality.source.record_id) ||
          !citation(result.address_components.postcode.source, buildingModel, result.address_components.postcode.source && result.address_components.postcode.source.record_id) ||
          formatted.component_sources.some((source) => !source || !uuid(source.record_id) ||
            ![localityModel, streetModel, buildingModel, premisesModel].includes(source.api_model_path) ||
            source.official_record_url !== queryUrl(source.api_model_path, source.record_id))) {
        throw new Error("registry address enrichment has invalid complete address evidence for " + result.company_code)
      }
      formattedAddress = formatted.value
      postcode = result.address_components.postcode.value
      kind = "full"
      fullCount++
    } else if (city !== undefined) {
      if (!hasBuveine || result.status !== "unresolved" || result.unresolved_reason !== "gatve_exact_uuid_query_returned_0_rows" ||
          result.no_inferred_location !== true || !result.address_components || !result.address_components.locality ||
          result.address_components.locality.value !== city || !citation(result.address_components.locality.source, localityModel, result.address_components.locality.source.record_id) ||
          !result.official_building_source || !citation(result.official_building_source, buildingModel, result.official_building_source.record_id)) {
        throw new Error("registry address enrichment has invalid locality-only evidence for " + result.company_code)
      }
      kind = "locality"
      localityOnlyCount++
    } else {
      if (hasBuveine || result.status !== "unresolved" || result.unresolved_reason !== "no_buveine_address_relation_published" ||
          result.no_inferred_location !== true || !result.original_jar_address_publication ||
          result.original_jar_address_publication.rendered_address !== "not_published_in_jar_entity" ||
          result.original_jar_address_publication.city !== "not_published_in_queried_official_models" ||
          result.original_jar_address_publication.registered_address_identity !== "no_buveine_address_relation_published") {
        throw new Error("registry address enrichment has invalid no-Būveinė evidence for " + result.company_code)
      }
      kind = "gap"
      noBuveineCount++
    }

    const addressIdentity = result.address_register_identity
    if (hasBuveine && (!addressIdentity || !addressIdentity.address_type || ![1, 2].includes(addressIdentity.address_type.value) ||
        !citation(addressIdentity.address_type.source, addressModel, identity.adresas_id) || !addressIdentity.address_object_code ||
        !Number.isInteger(addressIdentity.address_object_code.value) || addressIdentity.address_object_code.value <= 0 ||
        !citation(addressIdentity.address_object_code.source, addressModel, identity.adresas_id))) {
      throw new Error("registry address enrichment has invalid Adresas identity evidence for " + result.company_code)
    }

    const id = stableId(result.slug)
    if (rowsById.has(id)) throw new Error("registry address enrichment generated a duplicate target id")
    const enrichment = {
      checkpoint: {
        manifest_version: manifest.manifest_version,
        checked_date: checkedDate,
        input_sha256: expectedInputSha256,
        source_file: "data/registry_address_enrichment_20260807.json",
      },
      result,
    }
    const row = { id, company_code: result.company_code, slug: result.slug, jar_entity_id: identity.jar_entity_id, kind, city: city || "", formatted_address: formattedAddress, postcode, enrichment: JSON.stringify(enrichment), result }
    rows.push(row)
    rowsByCode.set(row.company_code, row)
    rowsById.set(row.id, row)
  }
  if (rows.length !== expectedCount || rowsByCode.size !== expectedCount || rowsById.size !== expectedCount ||
      fullCount !== expectedResolvedAddressCount || localityOnlyCount !== expectedLocalityOnlyCount || noBuveineCount !== expectedNoBuveineCount ||
      fullCount + localityOnlyCount !== expectedResolvedCityCount) {
    throw new Error("registry address enrichment checkpoint accounting does not reconcile")
  }

  const collection = app.findCollectionByNameOrId("manufacturers")
  const requiredFields = {
    company_code: "text", slug: "text", source_collection_date: "text", source_identity: "text",
    city: "text", location: "text", region: "select", region_label: "text", street_address: "text", postcode: "text",
    source_urls: "json", public_details_source_urls: "json",
    legal_name: "text", trading_name: "text", legal_entity_known: "bool", description_lt: "text",
    category_codes: "select", category_labels: "json", audience: "select", website: "url", public_phone: "text",
    public_contact_url: "url", portfolio_status: "select", confidence: "select", confidence_evidence: "text",
    scope_evidence: "text", evidence_source_type: "text", source_artifact_url: "url", verification_status: "select",
    founded_year: "number", financial_source_url: "text", revenue_eur_latest: "number", revenue_year: "number",
    revenue_availability: "select", financial_verification_status: "select", filed_financial_history: "json",
  }
  for (const [name, type] of Object.entries(requiredFields)) {
    const field = collection.fields.getByName(name)
    if (!field || field.type() !== type) throw new Error("manufacturers." + name + " must be a " + type + " field")
  }
  const referenceField = collection.fields.getByName("official_registered_address_reference")
  if (referenceField && referenceField.type() !== "json") {
    throw new Error("manufacturers.official_registered_address_reference must be a json field")
  }

  // Read all target records before any schema or data mutation. Matching requires
  // the immutable date plus exact code/slug/generated-import-ID identity; names are
  // deliberately never used as joins.
  const invariantFields = [
    "id", "slug", "company_code", "legal_name", "trading_name", "source_identity", "legal_entity_known", "description_lt",
    "region", "category_codes", "category_labels", "audience", "website", "public_phone", "public_contact_url", "portfolio_status",
    "confidence", "confidence_evidence", "scope_evidence", "evidence_source_type", "source_urls", "public_details_source_urls",
    "source_artifact_url", "source_collection_date", "verification_status", "founded_year", "financial_source_url", "revenue_eur_latest",
    "revenue_year", "revenue_availability", "financial_verification_status", "filed_financial_history",
  ]
  const snapshots = new Map()
  const preflightBatchSize = 100
  for (let offset = 0; offset < rows.length; offset += preflightBatchSize) {
    const batch = rows.slice(offset, offset + preflightBatchSize)
    const filter = "source_collection_date = " + sqlValue(checkedDate) + " && (" + batch.map((row) => "company_code = " + sqlValue(row.company_code)).join(" || ") + ")"
    const found = app.findRecordsByFilter("manufacturers", filter, "", 1100, 0)
    if (found.length !== batch.length) throw new Error("registry address enrichment could not prove the complete target set")
    for (const record of found) {
      const row = rowsByCode.get(get(record, "company_code"))
      if (!row || record.id !== row.id || get(record, "slug") !== row.slug || get(record, "source_collection_date") !== checkedDate ||
          !get(record, "source_identity").includes("JAR juridinio asmens ID " + row.jar_entity_id) ||
          !get(record, "source_identity").includes("tikslus įmonės kodas " + row.company_code)) {
        throw new Error("registry address enrichment found a non-import target identity")
      }
      const jarUrl = legacyUrl(jarModel, row.jar_entity_id)
      sourceUrlsContain(get(record, "source_urls"), jarUrl, "source_urls")
      sourceUrlsContain(get(record, "public_details_source_urls"), jarUrl, "public_details_source_urls")

      let originalReference = null
      if (referenceField) {
        originalReference = parseJson(get(record, "official_registered_address_reference"), "original registered-address reference")
        if (!originalReference.registered_address || !originalReference.official_record_urls ||
            originalReference.official_record_urls.jar_entity !== jarUrl) {
          throw new Error("registry address enrichment cannot preserve original JAR reference for " + row.company_code)
        }
        if (row.kind === "gap") {
          if (originalReference.registered_address.buveine || originalReference.official_record_urls.buveine || originalReference.official_record_urls.address_registry) {
            throw new Error("registry address enrichment found an unexpected original Būveinė reference")
          }
        } else {
          const identity = row.result.official_jar_identity
          if (!originalReference.registered_address.buveine || !originalReference.registered_address.address_registry ||
              originalReference.registered_address.buveine.id !== identity.buveine_id ||
              originalReference.registered_address.address_registry.id !== identity.adresas_id ||
              originalReference.official_record_urls.buveine !== legacyUrl(buveineModel, identity.buveine_id) ||
              originalReference.official_record_urls.address_registry !== legacyUrl(addressModel, identity.adresas_id)) {
            throw new Error("registry address enrichment found a mismatched original Būveinė reference")
          }
        }
      }

      const currentCity = get(record, "city")
      const currentLocation = get(record, "location")
      const currentLabel = get(record, "region_label")
      if (get(record, "region") !== "national") throw new Error("registry address enrichment target is not in the original national fallback")
      if (row.kind === "gap") {
        if (currentCity !== nationalCity || currentLocation !== nationalCity || currentLabel !== nationalLabel) {
          throw new Error("registry address enrichment must retain the no-Būveinė national fallback")
        }
      } else if (![nationalCity, row.city].includes(currentCity) || ![nationalCity, row.city].includes(currentLocation) || ![nationalLabel, row.city].includes(currentLabel)) {
        throw new Error("registry address enrichment refuses to overwrite a non-fallback locality")
      }
      const currentStreet = get(record, "street_address")
      const currentPostcode = get(record, "postcode")
      if (row.kind === "full" && (currentStreet !== "" && currentStreet !== row.formatted_address || currentPostcode !== "" && currentPostcode !== row.postcode)) {
        throw new Error("registry address enrichment refuses to overwrite a non-checkpoint address")
      }

      const invariants = {}
      for (const field of invariantFields) invariants[field] = field === "id" ? record.id : get(record, field)
      snapshots.set(record.id, {
        invariants,
        originalReference,
        street_address: currentStreet,
        postcode: currentPostcode,
      })
    }
  }
  if (snapshots.size !== expectedCount) throw new Error("registry address enrichment did not preflight every imported record")

  // The predecessor creates this field, but an interrupted historical schema setup
  // may not have. Create it only after all data/input checks and only when absent.
  if (!referenceField) {
    collection.fields.add(new JSONField({ name: "official_registered_address_reference", maxSize: 65536 }))
    app.save(collection)
  }

  const sourceValue = (field) => "(SELECT `" + field + "` FROM `source` WHERE `source`.`company_code` = `manufacturers`.`company_code` AND `source`.`slug` = `manufacturers`.`slug`)"
  const batchSize = 40
  for (let offset = 0; offset < rows.length; offset += batchSize) {
    const batch = rows.slice(offset, offset + batchSize)
    const values = batch.map((row) => "(" + [
      row.company_code, row.slug, row.city, row.formatted_address, row.postcode, row.enrichment,
    ].map(sqlValue).join(", ") + ")").join(", ")
    const sourceCity = sourceValue("city")
    const sourceAddress = sourceValue("formatted_address")
    const sourcePostcode = sourceValue("postcode")
    const sourceEnrichment = sourceValue("enrichment")
    const mergedReference = "CASE WHEN json_valid(`official_registered_address_reference`) = 1 THEN " +
      "json_set(`official_registered_address_reference`, '$.registry_address_enrichment_20260807', json(" + sourceEnrichment + ")) " +
      "ELSE json_object('registry_address_enrichment_20260807', json(" + sourceEnrichment + ")) END"

    // One bounded atomic write per batch. The WHERE clause repeats all import
    // identity predicates, so source data cannot update a similarly-coded row from
    // another import. Only address/locality/reference columns are assignable here.
    app.db().newQuery(
      "WITH `source` (`company_code`, `slug`, `city`, `formatted_address`, `postcode`, `enrichment`) AS (VALUES " + values + ") " +
      "UPDATE `manufacturers` SET " +
        "`city` = CASE WHEN " + sourceCity + " <> '' THEN " + sourceCity + " ELSE `city` END, " +
        "`location` = CASE WHEN " + sourceCity + " <> '' THEN " + sourceCity + " ELSE `location` END, " +
        "`region_label` = CASE WHEN " + sourceCity + " <> '' THEN " + sourceCity + " ELSE `region_label` END, " +
        "`street_address` = CASE WHEN " + sourceAddress + " <> '' THEN " + sourceAddress + " ELSE `street_address` END, " +
        "`postcode` = CASE WHEN " + sourcePostcode + " <> '' THEN " + sourcePostcode + " ELSE `postcode` END, " +
        "`official_registered_address_reference` = " + mergedReference + " " +
      "WHERE `source_collection_date` = " + sqlValue(checkedDate) + " AND EXISTS (SELECT 1 FROM `source` WHERE " +
        "`source`.`company_code` = `manufacturers`.`company_code` AND `source`.`slug` = `manufacturers`.`slug`)"
    ).execute()
  }

  // A retry after a killed boot sees either the old fallback or exact checkpoint
  // values in preflight, then writes the same deterministic values. Validate the
  // full final state rather than relying on affected-row counts.
  const seenPostIds = new Set()
  let postFull = 0
  let postLocality = 0
  let postGap = 0
  for (let offset = 0; offset < rows.length; offset += preflightBatchSize) {
    const batch = rows.slice(offset, offset + preflightBatchSize)
    const filter = "source_collection_date = " + sqlValue(checkedDate) + " && (" + batch.map((row) => "company_code = " + sqlValue(row.company_code)).join(" || ") + ")"
    const found = app.findRecordsByFilter("manufacturers", filter, "", 1100, 0)
    if (found.length !== batch.length) throw new Error("registry address enrichment post-write target cardinality changed")
    for (const record of found) {
      const row = rowsByCode.get(get(record, "company_code"))
      const snapshot = row && snapshots.get(record.id)
      if (!row || !snapshot || seenPostIds.has(record.id) || record.id !== row.id || get(record, "slug") !== row.slug) {
        throw new Error("registry address enrichment post-write identity validation failed")
      }
      seenPostIds.add(record.id)
      for (const field of invariantFields) {
        const actual = field === "id" ? record.id : get(record, field)
        if (actual !== snapshot.invariants[field]) throw new Error("registry address enrichment changed invariant " + field + " for " + row.company_code)
      }
      const reference = parseJson(get(record, "official_registered_address_reference"), "post-write registered-address reference")
      const enrichment = reference.registry_address_enrichment_20260807
      if (!enrichment || !enrichment.checkpoint || enrichment.checkpoint.checked_date !== checkedDate ||
          enrichment.checkpoint.input_sha256 !== expectedInputSha256 || !enrichment.result ||
          !sameJson(enrichment.result, row.result)) {
        throw new Error("registry address enrichment did not retain complete official provenance")
      }
      if (snapshot.originalReference && (!sameJson(reference.registered_address, snapshot.originalReference.registered_address) ||
          !sameJson(reference.official_record_urls, snapshot.originalReference.official_record_urls))) {
        throw new Error("registry address enrichment did not retain original JAR evidence")
      }
      sourceUrlsContain(get(record, "source_urls"), legacyUrl(jarModel, row.jar_entity_id), "post-write source_urls")
      sourceUrlsContain(get(record, "public_details_source_urls"), legacyUrl(jarModel, row.jar_entity_id), "post-write public_details_source_urls")
      if (row.kind === "full") {
        if (get(record, "city") !== row.city || get(record, "location") !== row.city || get(record, "region_label") !== row.city ||
            get(record, "street_address") !== row.formatted_address || get(record, "postcode") !== row.postcode) {
          throw new Error("registry address enrichment did not apply a complete address")
        }
        postFull++
      } else if (row.kind === "locality") {
        if (get(record, "city") !== row.city || get(record, "location") !== row.city || get(record, "region_label") !== row.city ||
            get(record, "street_address") !== snapshot.street_address || get(record, "postcode") !== snapshot.postcode) {
          throw new Error("registry address enrichment manufactured a locality-only address")
        }
        postLocality++
      } else {
        if (get(record, "city") !== nationalCity || get(record, "location") !== nationalCity || get(record, "region_label") !== nationalLabel ||
            get(record, "street_address") !== snapshot.street_address || get(record, "postcode") !== snapshot.postcode) {
          throw new Error("registry address enrichment changed a no-Būveinė gap")
        }
        postGap++
      }
    }
  }
  if (seenPostIds.size !== expectedCount || postFull !== expectedResolvedAddressCount || postLocality !== expectedLocalityOnlyCount || postGap !== expectedNoBuveineCount) {
    throw new Error("registry address enrichment post-write accounting does not reconcile")
  }
}, (app) => {
  // Deliberately non-destructive: official address evidence survives rollback.
})
