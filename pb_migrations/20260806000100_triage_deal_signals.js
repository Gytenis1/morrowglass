/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const collection = app.findCollectionByNameOrId("deal_signals")
  const statusValues = ["new", "pursue", "monitor", "reject"]

  // The original field was a text field. Replace only that field with a select
  // field; SQLite retains the same column and its already-valid `new` values.
  const status = collection.fields.getByName("status")
  if (!status) {
    collection.fields.add(new SelectField({ name: "status", required: true, maxSelect: 1, values: statusValues }))
  } else if (status.type() === "select") {
    status.required = true
    status.maxSelect = 1
    status.values = statusValues
  } else if (status.type() === "text") {
    collection.fields.removeByName("status")
    collection.fields.add(new SelectField({ name: "status", required: true, maxSelect: 1, values: statusValues }))
  } else {
    throw new Error("deal_signals.status exists with incompatible type " + status.type())
  }

  const rationale = collection.fields.getByName("triage_rationale")
  if (!rationale) {
    collection.fields.add(new TextField({ name: "triage_rationale", max: 500 }))
  } else {
    if (rationale.type() !== "text") {
      throw new Error("deal_signals.triage_rationale exists with incompatible type " + rationale.type())
    }
    rationale.required = false
    rationale.max = 500
  }
  app.save(collection)

  // Source URLs are the primary, stable triage key. Rationales state only the
  // source-supported mandate screen; they do not infer revenue or EBITDA.
  const triage = {
    "https://verslopardavimas.lt/skelbimai/parduodama-irengta-siuvykla-kalvariju-g-vilnius": ["reject", "Workshop/equipment offer with no identified operating company; light manufacturing is outside the priority sectors."],
    "https://verslopardavimas.lt/skelbimai/parduodama-veikianti-konditerijos-imone-uab-riesutukas": ["reject", "Confectionery operating company; food manufacturing is outside the mandate."],
    "https://verslopardavimas.lt/skelbimai/parduodamas-laivu-remonto-ir-statybos-verslas": ["monitor", "Long-established technical B2B repair business adjacent to the mandate; identity, scale and economics require research."],
    "https://verslopardavimas.lt/skelbimai/parduodama-veikianti-gamybine-imone-malku-gamyba-ir-eksportas": ["monitor", "Operating wood-products business adjacent to the wood-manufacturing screen; identity, scale and economics are undisclosed."],
    "https://verslopardavimas.lt/skelbimai/parduodamas-kurybinis-verslas-mb-oler-interjero-dekoro-ir-zvakiu-gamyba": ["reject", "Small consumer decor and candle business, outside the target sectors."],
    "https://verslopardavimas.lt/skelbimai/parduodama-zuvininkystes-imone": ["reject", "Aquaculture and food processing are excluded agricultural/food activities."],
    "https://verslopardavimas.lt/skelbimai/mb-tomas-ra": ["reject", "Priority cleaning activity, but the source discloses 2025 revenue of €67,283, clearly below scale."],
    "https://verslopardavimas.lt/skelbimai/parduodama-akredituota-laboratorija": ["monitor", "ISO 17025-accredited TIC laboratory; legal entity, financial scale, EBITDA and price are unresolved."],
    "https://verslopardavimas.lt/skelbimai/parduodamas-stabiliai-veikiantis-ir-pelningas-el-prekybos-b2b-verslas": ["reject", "B2B packaging e-commerce is excluded; the source discloses 2025 turnover of €54,000, also below scale."],
    "https://verslopardavimas.lt/skelbimai/parduodamas-veikiantis-sausmedziu-ukis-su-gamyba-statiniais-ir-infrastruktura": ["reject", "Agricultural holding with land and buildings; agriculture and asset/property-led deals are excluded."],
    "https://verslopardavimas.lt/skelbimai/parduodama-termo-medienos-gamybos-iranga-medienos-termomodifikacijos-kameros": ["reject", "Thermo-wood equipment offer, not a confirmed operating-company sale; asset-led opportunities are excluded."],
    "https://verslopardavimas.lt/skelbimai/parduodu-ledu-gamybos-iranga": ["reject", "Ice-cream production equipment sale, not an operating-company transaction and outside the target sectors."],
    "https://verslopardavimas.lt/skelbimai/parduodamas-tvarus-seimos-kurtas-verslas": ["reject", "Consumer clothing e-commerce brand, outside the target sectors."],
    "https://verslopardavimas.lt/skelbimai/sekmingas-14-metu-e-shop-su-45k-auditorija": ["reject", "Consumer apparel e-commerce brand, outside the target sectors."],
    "https://verslopardavimas.lt/skelbimai/architekturos-studija": ["monitor", "Architecture/design practice is a facilities-services adjacency; identity, scale, EBITDA and price are undisclosed."],
    "https://verslopardavimas.lt/skelbimai/parduodama-atestuota-statybu-imone-su-nekilnojamu-turtu": ["monitor", "Licensed construction operator is a facilities-services adjacency; operating scale and the property component require research."],
    "https://verslopardavimas.lt/skelbimai/parduodamas-tarptautinis-lininiu-drabuziu-prekes-zenklas-wavy-linen": ["reject", "Consumer clothing brand, outside the target sectors."],
    "https://ariportaal.ee/en/established-aesthetic-bubble-tea-caf%c3%a9-and-brand-for-sale-in-central-of-riga-latvia/": ["reject", "Bubble-tea café and brand; hospitality is excluded."],
    "https://ariportaal.ee/en/gruzoperevozki/": ["monitor", "Freight operator is a B2B-services adjacency; the source lists five trucks and two trailers, but scale and economics remain unresolved."],
    "https://ariportaal.ee/en/muua-automaalri-tookoda/": ["monitor", "Automotive paint workshop is a technical B2B-services adjacency; mandate fit and economics require research."],
    "https://ariportaal.ee/en/ceramic-boss-muua-garaaz-jalaka-77-7-jalaka-tanav-77-7-ropka-toostusrajoon-tartu-linn-tartu-tartumaa/": ["monitor", "Specialist cleaning/detailing signal; B2B exposure, scale, EBITDA and transaction terms are unresolved."],
    "https://ariportaal.ee/en/muua-kasvupotentsiaaliga-moobli-e-pood-dropshipping/": ["reject", "Furniture dropshipping e-commerce, not a furniture or wood manufacturing operating company."],
    "https://ariportaal.ee/en/muua-taaskasutatud-kaupade-kaupluse-kett/": ["reject", "Retail store chain, which is excluded."],
    "https://ariportaal.ee/en/nishevyj-b2b-biznes-gruzovaya-gps-navigacziya-rekurrentnaya-usluga-obnovleniya-kart-15-let-svoya-linejka-povtornaya-vyruchka-ot-avtoparkov-baltii/": ["monitor", "Recurring fleet-technology B2B business adjacent to the mandate; sector fit, scale and economics require research."],
    "https://ariportaal.ee/en/selling-company-alumicor-ou-with-vat-number-ee102215010-profitable-in-previous-years/": ["monitor", "Named profitable company sale, but its sector, operating scale, EBITDA and price are unresolved."],
    "https://ariportaal.ee/en/muua-rendiari-iseseisvalt-tootav-ule-10-a-tegutsenud/": ["reject", "Unspecified rental business with no demonstrated priority-sector fit."],
    "https://ariportaal.ee/en/toimiv-smart-home-nutilukkude-%c3%a4ri-laovaru-10-000%e2%82%ac-partnerid-2/": ["reject", "Smart-lock e-commerce business; the source discloses last-year turnover of €57,000, below scale."],
    "https://ariportaal.ee/en/m%c3%bc%c3%bca-3333-osalus-edukas-metallifirmas-gs-inox-o%c3%bc/": ["reject", "33.33% minority stake, which is excluded."],
    "https://ariportaal.ee/en/ehitusliku-insener-tehnilise-projekteerimise-ja-n%c3%b5ustamisega-tegelev-ettev%c3%b5te/": ["pursue", "Direct facilities technical-services operator for sale; source turnover is €200k–€1m, with EBITDA and entry multiple to verify."],
    "https://ariportaal.ee/en/messikorralduse-t%c3%a4isteenuseid-pakkuv-ettev%c3%b5te/": ["reject", "Event-services business, outside the target sectors."],
    "https://ariportaal.ee/en/spirt-zavod-vesy-60-ton-zheleznaya-doroga-skvazhiny-prirodnyj-gaz/": ["reject", "Alcohol production and industrial assets are excluded."],
    "https://ariportaal.ee/en/muua-valmis-led-valgustuse-e-pood-ledvalgustid-ee-ladu-soodne-rendiuigus/": ["reject", "LED product e-commerce, not a facilities technical-services operating company."],
    "https://ariportaal.ee/en/m%c3%bc%c3%bca-globaalne-kasutatud-autovaruosade-e-kauplus-ei-vaja-f%c3%bc%c3%bcsilist-asukohta/": ["reject", "Automotive-parts e-commerce, which is excluded."],
    "https://ariportaal.ee/en/8-aastane-n%c3%b5ustamisettev%c3%b5te-km-kohuslane/": ["monitor", "Established B2B consultancy adjacent to the mandate; priority-sector fit, scale and economics require research."],
    "https://ariportaal.ee/en/m%c3%bc%c3%bca-automatiseeritud-elektroonika-e-pood-250-000-toodet-koos-ettev%c3%b5ttega/": ["reject", "Electronics e-commerce, which is excluded."],
    "https://ariportaal.ee/en/stabiilselt-tegutsev-puidut%c3%b6%c3%b6stusettev%c3%b5te-mille-p%c3%b5hitegevuseks-on-puidust-ehitusdetailide-ja-tisleritoodete-valmistamine/": ["pursue", "Direct wood/joinery operating-company sale with owner retirement; source discloses €900,000 last-year turnover, with EBITDA and entry multiple to verify."],
    "https://ariportaal.ee/en/m%c3%bc%c3%bca-toimiv-autoremondit%c3%b6%c3%b6koda-kaasaegse-tehnika-t%c3%b6%c3%b6riistade-ja-seadmetega-ning-kehtiva-%c3%bc%c3%bcrilepinguga/": ["monitor", "Operating technical workshop adjacent to B2B facilities services; sector fit, scale and economics require research."],
    "https://ariportaal.ee/en/muua-toimiv-ari-koos-e-poodiga-tallinnas/": ["reject", "E-commerce business; the source discloses annual turnover of about €40,000, below scale."],
    "https://ariportaal.ee/en/m%c3%bc%c3%bca-kolimis-ja-transpordiettev%c3%b5tte-tallinnas/": ["monitor", "Operating logistics service adjacent to the mandate; priority-sector fit, scale and economics require research."],
    "https://ariportaal.ee/en/m%c3%bc%c3%bca-chargenet-akupankade-rendiv%c3%b5rgustik-kaubam%c3%a4rk-ja-seadmed-2/": ["monitor", "Technical rental platform adjacent to facilities services; operating scale, EBITDA and transaction terms are unresolved."],
    "https://ariportaal.ee/en/professionaalne-survepesu-meetodil-teostavate-puhastust%C3%B6%C3%B6de-pakkuja/": ["reject", "Priority specialist cleaning activity, but the source discloses last-year turnover of €100,000, clearly below scale."],
  }

  if (Object.keys(triage).length !== 41) {
    throw new Error("Deal-signal triage map must contain exactly 41 source URLs")
  }

  // A unique country/company-name match is used only if a curated record's URL
  // was normalized after the first sweep. It cannot match an unrecognised record.
  const seed = require(__hooks + "/../data/deal-signals-first-sweep.json")
  const fallbackByIdentity = {}
  for (const item of seed) {
    if (!triage[item.source_url]) continue
    const key = item.country + "\u0000" + item.company_name
    if (fallbackByIdentity[key]) {
      throw new Error("Ambiguous deal-signal triage fallback for " + key)
    }
    fallbackByIdentity[key] = { sourceUrl: item.source_url, decision: triage[item.source_url] }
  }

  const records = app.findRecordsByFilter("deal_signals", "", "", 500, 0)
  const assignments = []
  const matchedSourceUrls = new Set()
  for (const record of records) {
    const sourceUrl = record.getString("source_url").trim()
    let decision = triage[sourceUrl]
    let matchedSourceUrl = sourceUrl
    if (!decision) {
      const fallback = fallbackByIdentity[record.getString("country") + "\u0000" + record.getString("company_name")]
      if (fallback) {
        decision = fallback.decision
        matchedSourceUrl = fallback.sourceUrl
      }
    }
    if (!decision) {
      throw new Error("No triage decision for deal signal " + record.id + " (" + sourceUrl + ")")
    }
    matchedSourceUrls.add(matchedSourceUrl)
    assignments.push({ id: record.id, status: decision[0], rationale: decision[1] })
  }

  if (assignments.length !== 41 || matchedSourceUrls.size !== 41) {
    throw new Error("Deal-signal triage must resolve exactly 41 current records")
  }

  const sqlValue = (value) => "'" + String(value).replaceAll("'", "''") + "'"
  const ids = assignments.map((assignment) => sqlValue(assignment.id)).join(",")
  const statusCases = assignments.map((assignment) => "WHEN " + sqlValue(assignment.id) + " THEN " + sqlValue(assignment.status)).join(" ")
  const rationaleCases = assignments.map((assignment) => "WHEN " + sqlValue(assignment.id) + " THEN " + sqlValue(assignment.rationale)).join(" ")
  app.db().newQuery(
    "UPDATE `deal_signals` SET `status` = CASE `id` " + statusCases + " END, " +
    "`triage_rationale` = CASE `id` " + rationaleCases + " END WHERE `id` IN (" + ids + ")"
  ).execute()

  const remainingNew = app.findRecordsByFilter("deal_signals", "status = 'new'", "", 1, 0)
  if (remainingNew.length > 0) {
    throw new Error("Deal-signal triage left a record with status new")
  }
}, (app) => {
  // Deliberately non-destructive: triage decisions survive rollback.
})
