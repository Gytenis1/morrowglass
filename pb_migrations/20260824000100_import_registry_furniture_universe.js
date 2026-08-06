/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const manifest = require(__hooks + "/../data/registry_universe_20260807.json")
  const checkedDate = "2026-08-07"
  const expectedRawSize = 2748
  const expectedCandidateCount = 983
  const expectedCounts = {
    raw_universe_size: expectedRawSize,
    records_manifested: expectedRawSize,
    candidate_count: expectedCandidateCount,
    with_published_city: 0,
    with_published_address: 0,
    with_buveine_address_identity: 939,
    with_financial_history: 975,
    financial_history_entries: 3474,
  }
  const expectedReasons = {
    already_catalogued_live_company_code: 307,
    meets_all_inclusion_rules: expectedCandidateCount,
    no_filed_pnl_ending_2023_2025: 85,
    susr_not_active: 1373,
  }
  const expectedRawByActivity = { "310100": 308, "310200": 367, "310300": 28, "310900": 2045 }
  const dataPortalUrl = "https://data.gov.lt/datasets/1484/"
  const apiBase = "https://get.data.gov.lt"
  const susrModel = "datasets/gov/lsd/cl/ja_asmenys/JuridinisAsmuo"
  const jarModel = "datasets/gov/rc/jar/iregistruoti/JuridinisAsmuo"
  const buveineModel = "datasets/gov/rc/jar/buveines/Buveine"
  const addressModel = "datasets/gov/rc/ar/adresai/Adresas"
  const pnlModel = "datasets/gov/rc/jar/pelno_ataskaitos/PelnoAtaskaita"
  const nationalLabel = "Visa Lietuva (miestas nenurodytas oficialiame šaltinyje)"
  const fallbackCategoryLabel = "Kiti nestandartiniai baldai"
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  const codePattern = /^\d{7,12}$/
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
  const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key)
  const validText = (value, maximum) => typeof value === "string" && value.trim().length > 0 && value.length <= maximum
  const validDate = (value) => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
    const date = new Date(value + "T00:00:00.000Z")
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  }
  const validUuid = (value) => typeof value === "string" && uuidPattern.test(value)
  const validNumber = (value) => typeof value === "number" && Number.isFinite(value)
  const directUrl = (model, id) => apiBase + "/" + model + "/" + id
  const slugify = (value) => {
    const replacements = {
      "ą": "a", "č": "c", "ę": "e", "ė": "e", "į": "i", "š": "s", "ų": "u", "ū": "u", "ž": "z",
      "Ą": "a", "Č": "c", "Ę": "e", "Ė": "e", "Į": "i", "Š": "s", "Ų": "u", "Ū": "u", "Ž": "z",
    }
    const transliterated = String(value).split("").map((character) => replacements[character] || character).join("")
    const normalized = transliterated.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    return normalized.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 140).replace(/-+$/g, "") || "manufacturer"
  }
  const expectedSlug = (legalName, companyCode) => (slugify(legalName) + "-" + companyCode).slice(0, 180).replace(/-+$/g, "")
  const stableId = (slug) => {
    // A distinct prefix separates this import from the historical `m`-prefixed
    // seed IDs. Every generated ID is checked against the live primary-key set
    // before schema mutation and rechecked by INSERT ... ON CONFLICT at write time.
    let first = 2166136261
    let second = 2246822507
    for (let index = 0; index < slug.length; index++) {
      const code = slug.charCodeAt(index)
      first = Math.imul(first ^ code, 16777619)
      second = Math.imul(second ^ (code + index), 3266489917)
    }
    return "r" + (first >>> 0).toString(36).padStart(7, "0") + (second >>> 0).toString(36).padStart(7, "0")
  }

  // Validate the entire immutable checkpoint, including the non-candidate rows and
  // the contemporaneous live-code/slug snapshot, before changing schema or data.
  if (!manifest || manifest.manifest_version !== 1 || manifest.checked_date !== checkedDate ||
      !manifest.official_sources || manifest.official_sources.api_base !== apiBase ||
      manifest.official_sources.jar_data_portal_url !== dataPortalUrl ||
      !manifest.official_sources.model_confirmation || !Array.isArray(manifest.official_sources.model_confirmation.models) ||
      JSON.stringify(manifest.official_sources.model_confirmation.models) !== JSON.stringify([
        susrModel, "datasets/gov/lsd/cl/evrk/EkonominesVeiklosRusis", jarModel, buveineModel, addressModel, pnlModel,
      ]) || !manifest.counts || !Array.isArray(manifest.results) || !Array.isArray(manifest.candidates_to_import) ||
      manifest.results.length !== expectedRawSize || manifest.candidates_to_import.length !== expectedCandidateCount) {
    throw new Error("registry universe import requires the complete 2026-08-07 2748-record manifest")
  }
  for (const [name, value] of Object.entries(expectedCounts)) {
    if (manifest.counts[name] !== value) throw new Error("registry universe import has invalid " + name)
  }
  if (JSON.stringify(manifest.counts.raw_universe_by_evrk_2_code) !== JSON.stringify(expectedRawByActivity) ||
      JSON.stringify(manifest.counts.selection_reason_counts) !== JSON.stringify(expectedReasons) ||
      !manifest.counts.slug_collision_counts || manifest.counts.slug_collision_counts.unresolved_candidate_slug_collisions !== 0 ||
      manifest.counts.slug_collision_counts.base_slug_matched_live_slug !== 0 ||
      manifest.counts.slug_collision_counts.base_slug_matched_candidate_slug !== 0 ||
      manifest.counts.slug_collision_counts.deterministic_jar_suffix_used !== 0 ||
      manifest.counts.slug_collision_counts.manufacturer_code_fallback_used !== 0) {
    throw new Error("registry universe import has invalid checkpoint accounting")
  }

  const live = manifest.live_catalogue_comparison
  if (!live || live.snapshot_only_no_live_request !== true || live.live_record_count !== 437 ||
      live.identity_field !== "company_code" || live.slug_field !== "slug" ||
      !Array.isArray(live.existing_company_codes) || live.existing_company_codes.length !== 386 ||
      !Array.isArray(live.existing_slugs) || live.existing_slugs.length !== 437 ||
      new Set(live.existing_company_codes).size !== live.existing_company_codes.length ||
      new Set(live.existing_slugs).size !== live.existing_slugs.length ||
      live.existing_company_codes.some((code) => !codePattern.test(code)) ||
      live.existing_slugs.some((slug) => !slugPattern.test(slug))) {
    throw new Error("registry universe import has an invalid live catalogue checkpoint")
  }
  const liveCodes = new Set(live.existing_company_codes)
  const liveSlugs = new Set(live.existing_slugs)
  const candidatesByCode = new Map()
  const candidateSlugs = new Set()
  for (const candidate of manifest.candidates_to_import) {
    if (!candidate || !codePattern.test(candidate.company_code || "") || !validText(candidate.legal_name, 240) ||
        !slugPattern.test(candidate.candidate_slug || "") || candidate.candidate_slug !== expectedSlug(candidate.legal_name, candidate.company_code) ||
        candidatesByCode.has(candidate.company_code) || candidateSlugs.has(candidate.candidate_slug) ||
        liveCodes.has(candidate.company_code) || liveSlugs.has(candidate.candidate_slug)) {
      throw new Error("registry universe import has a malformed or colliding candidate")
    }
    candidatesByCode.set(candidate.company_code, candidate)
    candidateSlugs.add(candidate.candidate_slug)
  }

  const sourceRows = []
  const allCodes = new Set()
  const reasonCounts = {}
  const rawByActivity = {}
  const matchesExpectedCounts = (actual, expected) =>
    Object.keys(actual).length === Object.keys(expected).length &&
    Object.entries(expected).every(([name, value]) => actual[name] === value)
  let includedCount = 0
  let historyRows = 0
  let candidatesWithHistory = 0
  let candidatesWithAddressIdentity = 0
  for (const result of manifest.results) {
    if (!result || !codePattern.test(result.company_code || "") || allCodes.has(result.company_code) ||
        !validText(result.legal_name, 240) || !result.activity_evidence || !result.susr_status_evidence ||
        !Array.isArray(result.financial_history) || result.financial_history.length > 4 ||
        !["included", "excluded"].includes(result.status) || typeof result.reason !== "string" || !result.reason) {
      throw new Error("registry universe import has malformed raw result evidence")
    }
    allCodes.add(result.company_code)
    reasonCounts[result.reason] = (reasonCounts[result.reason] || 0) + 1
    const activity = result.activity_evidence
    if (activity.principal_activity_field !== "veikla" || !validUuid(activity.principal_activity_relation_id) ||
        !["31.01", "31.02", "31.03", "31.09"].includes(activity.evrk_2_code) ||
        !hasOwn(expectedRawByActivity, activity.evrk_api_code) ||
        activity.evrk_2_code !== ({ "310100": "31.01", "310200": "31.02", "310300": "31.03", "310900": "31.09" })[activity.evrk_api_code] ||
        !validText(activity.wording, 900) || !validUuid(activity.susr_record_id) || activity.api_model_path !== susrModel) {
      throw new Error("registry universe import has malformed principal-activity evidence for " + result.company_code)
    }
    rawByActivity[activity.evrk_api_code] = (rawByActivity[activity.evrk_api_code] || 0) + 1
    let rawPreviousHistoryKey = null
    for (const entry of result.financial_history) {
      if (!entry || !validDate(entry.fiscal_period_start) || !validDate(entry.fiscal_period_end) ||
          entry.fiscal_period_start > entry.fiscal_period_end || !validDate(entry.filing_registration_date) || !entry.source ||
          entry.source.data_portal_url !== dataPortalUrl || entry.source.api_model_path !== pnlModel || !validUuid(entry.source.jar_entity_id) ||
          (!hasOwn(entry, "revenue_eur") && !hasOwn(entry, "profit_before_tax_eur"))) {
        throw new Error("registry universe import has malformed complete financial history")
      }
      const rawHistoryKey = entry.fiscal_period_end + "|" + entry.filing_registration_date + "|" + entry.fiscal_period_start
      if (rawPreviousHistoryKey !== null && rawPreviousHistoryKey < rawHistoryKey) {
        throw new Error("registry universe import complete financial history is not newest-first")
      }
      rawPreviousHistoryKey = rawHistoryKey
      if (hasOwn(entry, "revenue_eur") &&
          (!validNumber(entry.revenue_eur) || !entry.revenue_evidence || entry.revenue_evidence.line_name !== "PARDAVIMO PAJAMOS" ||
           !validUuid(entry.revenue_evidence.api_record_id) || !validDate(entry.revenue_evidence.registration_date))) {
        throw new Error("registry universe import has malformed complete revenue history")
      }
      if (hasOwn(entry, "profit_before_tax_eur") &&
          (!validNumber(entry.profit_before_tax_eur) || !entry.profit_before_tax_evidence ||
           entry.profit_before_tax_evidence.line_name !== "PELNAS (NUOSTOLIAI) PRIEŠ APMOKESTINIMĄ" ||
           !validUuid(entry.profit_before_tax_evidence.api_record_id) || !validDate(entry.profit_before_tax_evidence.registration_date))) {
        throw new Error("registry universe import has malformed complete profit history")
      }
      historyRows++
    }
    if (result.status !== "included") continue

    includedCount++
    const candidate = candidatesByCode.get(result.company_code)
    const jar = result.jar_entity
    const address = result.registered_address
    if (!candidate || result.reason !== "meets_all_inclusion_rules" || result.candidate_slug !== candidate.candidate_slug ||
        result.legal_name !== candidate.legal_name || result.susr_status_evidence.active_value !== 1 ||
        !jar || !validUuid(jar.id) || jar.company_code_field !== "ja_kodas" || jar.company_code_value !== result.company_code ||
        !validUuid(jar.status_id) || jar.deregistration_date !== null || jar.current_registration_evidence !== "isreg_data_is_null" ||
        jar.api_model_path !== jarModel || !validDate(jar.registration_date) ||
        !address || address.published_address !== null || address.published_city !== null || !address.address_publication ||
        address.address_publication.rendered_address !== "not_published_in_jar_entity" ||
        address.address_publication.city !== "not_published_in_queried_official_models") {
      throw new Error("registry universe import has invalid exact JAR identity evidence for " + result.company_code)
    }

    const sourceUrls = [directUrl(susrModel, activity.susr_record_id), directUrl(jarModel, jar.id)]
    const addressUrls = { jar_entity: directUrl(jarModel, jar.id) }
    if (hasOwn(address, "buveine") || hasOwn(address, "address_registry")) {
      const buveine = address.buveine
      const addressRegistry = address.address_registry
      if (!buveine || !addressRegistry || !validUuid(buveine.id) || !validUuid(buveine.address_id) ||
          buveine.address_id !== addressRegistry.id || !validUuid(addressRegistry.id) ||
          !Number.isInteger(addressRegistry.address_object_code) || addressRegistry.address_object_code <= 0 ||
          !validDate(buveine.address_from) || !validDate(addressRegistry.valid_from) || addressRegistry.valid_to !== null ||
          buveine.api_model_path !== buveineModel || addressRegistry.api_model_path !== addressModel ||
          address.address_publication.registered_address_identity !== "published_as_buveine_to_adresas_id") {
        throw new Error("registry universe import has invalid registered-address identity evidence for " + result.company_code)
      }
      addressUrls.buveine = directUrl(buveineModel, buveine.id)
      addressUrls.address_registry = directUrl(addressModel, addressRegistry.id)
      sourceUrls.push(addressUrls.buveine, addressUrls.address_registry)
      candidatesWithAddressIdentity++
    } else if (address.address_publication.registered_address_identity !== "no_buveine_row_published" &&
               address.address_publication.registered_address_identity !== "no_buveine_address_relation_published") {
      throw new Error("registry universe import has unsupported missing-address evidence for " + result.company_code)
    }

    let previousHistoryKey = null
    let newestRevenue = null
    for (const entry of result.financial_history) {
      if (!entry || !validDate(entry.fiscal_period_start) || !validDate(entry.fiscal_period_end) ||
          entry.fiscal_period_start > entry.fiscal_period_end || !validDate(entry.filing_registration_date) || !entry.source ||
          entry.source.data_portal_url !== dataPortalUrl || entry.source.api_model_path !== pnlModel || entry.source.jar_entity_id !== jar.id ||
          (!hasOwn(entry, "revenue_eur") && !hasOwn(entry, "profit_before_tax_eur"))) {
        throw new Error("registry universe import has invalid filed-financial evidence for " + result.company_code)
      }
      const historyKey = entry.fiscal_period_end + "|" + entry.filing_registration_date + "|" + entry.fiscal_period_start
      if (previousHistoryKey !== null && previousHistoryKey < historyKey) {
        throw new Error("registry universe import financial history is not newest-first for " + result.company_code)
      }
      previousHistoryKey = historyKey
      if (hasOwn(entry, "revenue_eur")) {
        if (!validNumber(entry.revenue_eur) || !entry.revenue_evidence || entry.revenue_evidence.line_name !== "PARDAVIMO PAJAMOS" ||
            !validUuid(entry.revenue_evidence.api_record_id) || !validDate(entry.revenue_evidence.registration_date)) {
          throw new Error("registry universe import has unsupported revenue evidence for " + result.company_code)
        }
        // The history is newest-first, so the first exact revenue line is the only
        // value allowed to populate the summary fields.
        if (newestRevenue === null) {
          newestRevenue = { value: entry.revenue_eur, year: Number(entry.fiscal_period_end.slice(0, 4)) }
        }
      }
      if (hasOwn(entry, "profit_before_tax_eur") &&
          (!validNumber(entry.profit_before_tax_eur) || !entry.profit_before_tax_evidence ||
           entry.profit_before_tax_evidence.line_name !== "PELNAS (NUOSTOLIAI) PRIEŠ APMOKESTINIMĄ" ||
           !validUuid(entry.profit_before_tax_evidence.api_record_id) || !validDate(entry.profit_before_tax_evidence.registration_date))) {
        throw new Error("registry universe import has unsupported profit evidence for " + result.company_code)
      }
    }
    if (result.financial_history.length > 0) candidatesWithHistory++

    const registeredAddressReference = {
      // Keep the manifest's exact identity-only evidence. It deliberately contains
      // no made-up street or city text; the direct record URLs make the ID trail auditable.
      registered_address: address,
      official_record_urls: addressUrls,
    }
    const activityUrl = directUrl(susrModel, activity.susr_record_id)
    const description = "SŪSR registre nurodyta pagrindinė veikla: " + activity.evrk_2_code + " – " + activity.wording + "."
    const scopeEvidence = "SŪSR pagrindinės veiklos laukas „veikla“: " + activity.evrk_2_code + " – " + activity.wording + ". Oficialus įrašo URL: " + activityUrl
    const confidenceEvidence = "Tapatybė patikrinta pagal tikslų įmonės kodą SŪSR → JAR (JAR ID " + jar.id + "). Viešo oficialaus šaltinio duomenys nepatvirtinti tiesioginiu įmonės kontaktu."
    const sourceIdentity = "SŪSR įrašo ID " + activity.susr_record_id + "; JAR juridinio asmens ID " + jar.id + "; tikslus įmonės kodas " + result.company_code + "."
    if (!validText(description, 1200) || !validText(scopeEvidence, 2000) || !validText(confidenceEvidence, 2400) || !validText(sourceIdentity, 500)) {
      throw new Error("registry universe import generated an overlong source-backed field for " + result.company_code)
    }
    const id = stableId(candidate.candidate_slug)
    sourceRows.push({
      id,
      slug: candidate.candidate_slug,
      company_code: result.company_code,
      legal_name: result.legal_name,
      trading_name: result.legal_name,
      source_identity: sourceIdentity,
      description_lt: description,
      scope_evidence: scopeEvidence,
      confidence_evidence: confidenceEvidence,
      source_urls: JSON.stringify(sourceUrls),
      public_details_source_urls: JSON.stringify(sourceUrls),
      source_artifact_url: directUrl(jarModel, jar.id),
      filed_financial_history: JSON.stringify(result.financial_history),
      official_registered_address_reference: JSON.stringify(registeredAddressReference),
      founded_year: Number(jar.registration_date.slice(0, 4)),
      revenue_eur_latest: newestRevenue ? newestRevenue.value : 0,
      revenue_year: newestRevenue ? newestRevenue.year : 0,
      revenue_availability: newestRevenue ? "paskelbta" : "nepaskelbta",
    })
  }
  if (allCodes.size !== expectedRawSize || includedCount !== expectedCandidateCount || sourceRows.length !== expectedCandidateCount ||
      !matchesExpectedCounts(reasonCounts, expectedReasons) || !matchesExpectedCounts(rawByActivity, expectedRawByActivity) ||
      historyRows !== expectedCounts.financial_history_entries || candidatesWithHistory !== expectedCounts.with_financial_history ||
      candidatesWithAddressIdentity !== expectedCounts.with_buveine_address_identity ||
      sourceRows.some((row) => !candidatesByCode.has(row.company_code))) {
    throw new Error("registry universe import checkpoint totals do not match candidate evidence")
  }
  if (new Set(sourceRows.map((row) => row.slug)).size !== expectedCandidateCount ||
      new Set(sourceRows.map((row) => row.company_code)).size !== expectedCandidateCount ||
      new Set(sourceRows.map((row) => row.id)).size !== expectedCandidateCount) {
    throw new Error("registry universe import generated duplicate slugs, codes, or record IDs")
  }

  const collection = app.findCollectionByNameOrId("manufacturers")
  const requiredFields = {
    slug: "text", company_code: "text", legal_name: "text", trading_name: "text", source_identity: "text",
    legal_entity_known: "bool", description_lt: "text", location: "text", city: "text", region: "select",
    region_label: "text", category_codes: "select", category_labels: "json", audience: "select", website: "url",
    public_phone: "text", public_contact_url: "url", street_address: "text", postcode: "text", portfolio_status: "select",
    confidence: "select", confidence_evidence: "text", scope_evidence: "text", evidence_source_type: "text",
    source_urls: "json", public_details_source_urls: "json", source_artifact_url: "url", source_collection_date: "text",
    verification_status: "select", founded_year: "number", revenue_eur_latest: "number", revenue_year: "number",
    financial_source_url: "text", revenue_availability: "select", financial_verification_status: "select",
    filed_financial_history: "json",
  }
  for (const [name, type] of Object.entries(requiredFields)) {
    const field = collection.fields.getByName(name)
    if (!field || field.type() !== type) throw new Error("manufacturers." + name + " must be a " + type + " field")
  }

  // `national` is an established stored mapping from the preceding official batch.
  // Add only that missing vocabulary item on an otherwise compatible field, then
  // validate every select option this import writes. Any incompatible select shape
  // stops before a record insert.
  const region = collection.fields.getByName("region")
  let schemaChanged = false
  if (region.maxSelect !== 1 || !Array.isArray(region.values)) throw new Error("manufacturers.region must be a compatible single-select field")
  if (!region.values.includes("national")) {
    region.values = [...region.values, "national"]
    schemaChanged = true
  }
  const requiredSelectValues = [
    ["region", "national"], ["category_codes", "O"], ["audience", "nežinoma"],
    ["portfolio_status", "nežinoma"], ["confidence", "vidutinis"],
    ["revenue_availability", "paskelbta"], ["revenue_availability", "nepaskelbta"],
    ["financial_verification_status", "patikrinta"], ["verification_status", "nepatvirtinta"],
  ]
  for (const [name, value] of requiredSelectValues) {
    const field = collection.fields.getByName(name)
    if (field.maxSelect < 1 || !Array.isArray(field.values) || !field.values.includes(value)) {
      throw new Error("manufacturers." + name + " must support " + value)
    }
  }

  const addressReferenceField = collection.fields.getByName("official_registered_address_reference")
  if (!addressReferenceField) {
    collection.fields.add(new JSONField({ name: "official_registered_address_reference", maxSize: 65536 }))
    schemaChanged = true
  } else if (addressReferenceField.type() !== "json") {
    throw new Error("manufacturers.official_registered_address_reference must be a json field")
  }

  // Reject a generated-ID collision before schema/data mutation. A row from an
  // interrupted prior attempt is acceptable only when its id, slug, and code all
  // identify this exact candidate; any other primary-key collision is unsafe.
  const expectedById = new Map(sourceRows.map((row) => [row.id, row]))
  const sqlValue = (value) => {
    if (value === null || value === undefined) return "NULL"
    if (typeof value === "number") return String(value)
    if (typeof value === "boolean") return value ? "1" : "0"
    return "'" + String(value).replaceAll("'", "''") + "'"
  }
  const idBatchSize = 100
  for (let offset = 0; offset < sourceRows.length; offset += idBatchSize) {
    const ids = sourceRows.slice(offset, offset + idBatchSize)
    // findRecordsByFilter is one bounded indexed read per 100 generated ids, rather
    // than a record-by-record lookup. It is used only for preflight collision proof.
    const filter = ids.map((row) => "id = " + sqlValue(row.id)).join(" || ")
    const existingRows = app.findRecordsByFilter("manufacturers", filter, "", ids.length, 0)
    for (const existing of existingRows) {
      const expected = expectedById.get(existing.id)
      if (!expected || existing.getString("slug") !== expected.slug || existing.getString("company_code") !== expected.company_code) {
        throw new Error("registry universe import generated a primary-key collision at " + existing.id)
      }
    }
  }

  // Field creation is guarded. Saving once after all checks makes a killed process
  // retry safely: it finds the field/vocabulary already present and reaches the
  // idempotent anti-join inserts below.
  if (schemaChanged) app.save(collection)

  const columns = [
    "id", "slug", "company_code", "legal_name", "trading_name", "source_identity", "legal_entity_known",
    "description_lt", "location", "city", "region", "region_label", "category_codes", "category_labels",
    "audience", "website", "public_phone", "public_contact_url", "street_address", "postcode", "portfolio_status",
    "confidence", "confidence_evidence", "scope_evidence", "evidence_source_type", "source_urls",
    "public_details_source_urls", "source_artifact_url", "source_collection_date", "verification_status", "founded_year",
    "financial_source_url", "revenue_eur_latest", "revenue_year", "revenue_availability", "financial_verification_status",
    "filed_financial_history", "official_registered_address_reference",
  ]
  const batchSize = 25
  for (let offset = 0; offset < sourceRows.length; offset += batchSize) {
    const batch = sourceRows.slice(offset, offset + batchSize)
    const values = batch.map((row) => "(" + [
      row.id, row.slug, row.company_code, row.legal_name, row.trading_name, row.source_identity, true,
      row.description_lt, "Lietuva", "Lietuva", "national", nationalLabel, "[\"O\"]", JSON.stringify([fallbackCategoryLabel]),
      "nežinoma", "", "", "", "", "", "nežinoma", "vidutinis", row.confidence_evidence, row.scope_evidence,
      "Lietuvos atvirų duomenų portalas (SŪSR ir Registrų centras)", row.source_urls, row.public_details_source_urls,
      row.source_artifact_url, checkedDate, "nepatvirtinta", row.founded_year, dataPortalUrl, row.revenue_eur_latest,
      row.revenue_year, row.revenue_availability, "patikrinta", row.filed_financial_history, row.official_registered_address_reference,
    ].map(sqlValue).join(", ") + ")").join(", ")

    // The source CTE is a code/slug/id anti-join: records with a contemporaneous
    // collision are skipped, never updated. ON CONFLICT DO NOTHING covers a race on
    // the table's unique keys (including primary key) between the anti-join and
    // insert; PocketBase's boot migration has no public create route, but this keeps
    // an interrupted or concurrently-administered startup non-destructive as well.
    app.db().newQuery(
      "WITH `source` (" + columns.map((column) => "`" + column + "`").join(", ") + ") AS (VALUES " + values + ") " +
      "INSERT INTO `manufacturers` (" + columns.map((column) => "`" + column + "`").join(", ") + ") " +
      "SELECT " + columns.map((column) => "`source`.`" + column + "`").join(", ") + " FROM `source` " +
      "WHERE NOT EXISTS (SELECT 1 FROM `manufacturers` AS `existing` WHERE " +
        "`existing`.`company_code` = `source`.`company_code` OR `existing`.`slug` = `source`.`slug` OR `existing`.`id` = `source`.`id`) " +
      "ON CONFLICT DO NOTHING"
    ).execute()
  }
}, (app) => {
  // Deliberately non-destructive: imported official-register rows and audit evidence survive rollback.
})
