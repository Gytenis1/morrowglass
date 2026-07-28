/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const seed = require(__hooks + "/../data/deal-signals-first-sweep.json")

  if (!Array.isArray(seed) || seed.length < 40) {
    throw new Error("The first Baltic deal-signal sweep must contain at least 40 records")
  }

  const countries = new Set()
  const sourceUrls = new Set()
  let highFitCount = 0
  const allowedCountries = new Set(["LT", "LV", "EE"])
  const allowedSectors = new Set(["tic_labs", "cleaning_hygiene", "facilities_services", "furniture", "other"])
  const allowedTypes = new Set(["for_sale_listing", "broker_mandate", "insolvency_restructuring", "ownership_change", "succession_press", "other"])
  const allowedFits = new Set(["high", "medium", "low", "excluded"])

  for (const [index, record] of seed.entries()) {
    if (!record || typeof record !== "object") throw new Error("Signal " + index + " must be an object")
    if (!record.company_name || !record.source_url || !record.signal_date || !record.evidence_quote) {
      throw new Error("Signal " + index + " is missing required evidence fields")
    }
    if (!/^https:\/\//.test(record.source_url) || sourceUrls.has(record.source_url)) {
      throw new Error("Signal " + index + " must have a unique HTTPS source URL")
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(record.signal_date)) throw new Error("Signal " + index + " has an invalid date")
    if (!allowedCountries.has(record.country) || !allowedSectors.has(record.sector_tag) || !allowedTypes.has(record.signal_type) || !allowedFits.has(record.mandate_fit)) {
      throw new Error("Signal " + index + " has an unsupported classification")
    }
    sourceUrls.add(record.source_url)
    countries.add(record.country)
    if (record.mandate_fit === "high") highFitCount++
  }

  if (!["LT", "LV", "EE"].every((country) => countries.has(country))) {
    throw new Error("The first sweep must cover Lithuania, Latvia, and Estonia")
  }
  if (highFitCount === 0 || highFitCount > 8) {
    throw new Error("The first sweep must have between 1 and 8 high-fit records")
  }

  const stableId = (sourceUrl) => {
    let first = 2166136261
    let second = 2246822507
    for (let index = 0; index < sourceUrl.length; index++) {
      const code = sourceUrl.charCodeAt(index)
      first = Math.imul(first ^ code, 16777619)
      second = Math.imul(second ^ (code + index), 3266489917)
    }
    return "d" + (first >>> 0).toString(36).padStart(7, "0") + (second >>> 0).toString(36).padStart(7, "0")
  }

  const ids = new Set()
  const sqlValue = (value) => {
    if (value === null || value === undefined) return "''"
    if (typeof value === "number") return String(value)
    return "'" + String(value).replaceAll("'", "''") + "'"
  }

  const columns = [
    "id", "company_name", "country", "city", "company_code", "sector_tag", "signal_type", "signal_date",
    "source_name", "source_url", "evidence_quote", "estimated_revenue_eur", "mandate_fit", "fit_rationale",
    "matched_shortlist_entry", "status", "notes",
  ]

  const rows = seed.map((record) => {
    const id = stableId(record.source_url)
    if (ids.has(id)) throw new Error("Generated duplicate stable id for " + record.source_url)
    ids.add(id)
    return "(" + [
      id,
      record.company_name,
      record.country,
      record.city || "",
      record.company_code || "",
      record.sector_tag,
      record.signal_type,
      record.signal_date + " 00:00:00.000Z",
      record.source_name || "",
      record.source_url,
      record.evidence_quote,
      Number.isFinite(record.estimated_revenue_eur) ? record.estimated_revenue_eur : 0,
      record.mandate_fit,
      record.fit_rationale || "",
      record.matched_shortlist_entry || "",
      record.status || "new",
      record.notes || "",
    ].map(sqlValue).join(",") + ")"
  })

  // The collection's unique source_url index is the idempotency key. This handles a
  // partial migration retry without creating a second signal and refreshes only this
  // curated batch when the same migration is resumed.
  const assignments = columns.filter((name) => name !== "id" && name !== "source_url").map((name) => "`" + name + "` = excluded.`" + name + "`").join(", ")
  const sql = "INSERT INTO `deal_signals` (" + columns.map((name) => "`" + name + "`").join(",") + ") VALUES " + rows.join(",") + " ON CONFLICT(`source_url`) DO UPDATE SET " + assignments
  app.db().newQuery(sql).execute()

  // Bulk SQL is intentionally used above so a slow one-by-one seed cannot hold up
  // startup. Emit one concise, inspectable dashboard alert for the highest-priority
  // lead because bulk migration inserts do not pass through request create hooks.
  const eventsUrl = $os.getenv("SUPERNAUT_EVENTS_URL")
  const top = seed.find((record) => record.mandate_fit === "high")
  if (eventsUrl && top) {
    try {
      const response = $http.send({
        method: "POST",
        url: eventsUrl,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "deal_signal_high_fit_created",
          subject: "New high-fit deal signal",
          text: [
            "Company: " + top.company_name,
            "Country: " + top.country,
            "Sector: " + top.sector_tag,
            "Signal: " + top.signal_type,
            "Source: " + top.source_url,
            "Fit rationale: " + top.fit_rationale,
          ].join("\n"),
        }),
        timeout: 15,
      })
      if (response.statusCode < 200 || response.statusCode >= 300) {
        app.logger().error("First deal-signal sweep alert failed", "status", response.statusCode)
      }
    } catch (err) {
      app.logger().error("First deal-signal sweep alert failed", "error", String(err))
    }
  }
}, (app) => {
  // Deliberately non-destructive: researched deal intelligence survives rollback.
})
