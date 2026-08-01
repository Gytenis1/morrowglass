/// <reference path="../pb_data/types.d.ts" />

routerAdd("GET", "/api/supernaut/ready", (event) => {
  return event.json(200, { ok: true });
});


onRecordAfterUpdateSuccess((event) => {
  event.next();

  const revokedAt = event.record.get("revoked_at");
  if (!revokedAt) {
    return;
  }

  const readingId = event.record.getString("reading_id");
  if (!readingId) {
    return;
  }

  try {
    const reading = event.app.findRecordById("readings", readingId);
    reading.set("face_traits_json", null);
    event.app.save(reading);
  } catch (err) {
    console.log("face consent revocation cleanup skipped: " + err);
  }
}, "face_consents");

onRecordAfterCreateSuccess((event) => {
  event.next();

  const referredBy = event.record.getString("referred_by");
  if (!referredBy) {
    return;
  }

  try {
    const referral = event.app.findFirstRecordByFilter(
      "referrals",
      "code = {:code}",
      { code: referredBy }
    );

    const uses = referral.getInt("uses") + 1;
    referral.set("uses", uses);
    if (uses >= 1) {
      referral.set("unlocked", true);
    }
    event.app.save(referral);
  } catch (err) {
    console.log("referral increment skipped: " + err);
  }
}, "readings");

onRecordEnrich((event) => {
  if (!event.requestInfo.auth || !event.requestInfo.auth.isSuperuser()) {
    event.record.hide("contact_name", "contact_email", "honeypot");
  }
  event.next();
}, "buyer_requests");

onRecordCreateRequest((event) => {
  const fail = (field, code, message) => {
    const data = {};
    data[field] = new ValidationError(code, message);
    throw new BadRequestError("Patikrinkite pateiktus duomenis.", data);
  };

  const honeypot = event.record.getString("honeypot").trim();
  if (honeypot) {
    fail("honeypot", "invalid_honeypot", "Pateikimas atmestas.");
  }

  const trimField = (name) => {
    event.record.set(name, event.record.getString(name).trim());
  };
  trimField("project_type");
  trimField("city_region");
  trimField("budget_band");
  trimField("timeline");
  trimField("project_brief");
  trimField("contact_name");
  const contactEmail = event.record.getString("contact_email").trim().toLowerCase();
  if (contactEmail.length > 254) {
    fail("contact_email", "email_too_long", "El. pašto adresas per ilgas.");
  }
  event.record.set("contact_email", contactEmail);
  event.record.set("status", "new");
  event.record.set("honeypot", "");

  const body = event.requestInfo().body;
  let submitted = body.shortlisted_manufacturer_slugs;
  if (submitted === undefined || submitted === null || submitted === "") {
    submitted = [];
  } else if (Array.isArray(submitted) && submitted.every((value) => typeof value === "number")) {
    // RequestInfo exposes JSONField input as JSONRaw bytes in the JSVM.
    try {
      submitted = JSON.parse(toString(submitted));
    } catch (_) {
      fail("shortlisted_manufacturer_slugs", "invalid_shortlist", "Gamintojų pasirinkimas turi būti tinkamas JSON sąrašas.");
    }
  }
  if (!Array.isArray(submitted)) {
    fail("shortlisted_manufacturer_slugs", "invalid_shortlist", "Gamintojų pasirinkimas turi būti sąrašas.");
  }
  if (submitted.length > 12) {
    fail("shortlisted_manufacturer_slugs", "shortlist_too_large", "Galima pasirinkti ne daugiau kaip 12 gamintojų.");
  }

  const normalized = [];
  const seen = {};
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  for (const value of submitted) {
    if (typeof value !== "string") {
      fail("shortlisted_manufacturer_slugs", "invalid_shortlist", "Kiekvienas gamintojo identifikatorius turi būti tekstas.");
    }
    const slug = value.trim();
    if (!slug || slug.length > 180 || !slugPattern.test(slug)) {
      fail("shortlisted_manufacturer_slugs", "invalid_slug", "Pateiktas netinkamas gamintojo identifikatorius.");
    }
    if (seen[slug]) {
      continue;
    }
    try {
      event.app.findFirstRecordByData("manufacturers", "slug", slug);
    } catch (_) {
      fail("shortlisted_manufacturer_slugs", "unknown_manufacturer", "Pasirinktas gamintojas kataloge nerastas.");
    }
    seen[slug] = true;
    normalized.push(slug);
  }
  event.record.set("shortlisted_manufacturer_slugs", normalized);

  event.next();
}, "buyer_requests");

onRecordAfterCreateSuccess((event) => {
  event.next();

  const record = event.record;
  const contactEmail = record.getString("contact_email");
  const projectType = record.getString("project_type");
  const cityRegion = record.getString("city_region");
  const budgetBand = record.getString("budget_band");
  const timeline = record.getString("timeline");
  const shortlisted = record.getStringSlice("shortlisted_manufacturer_slugs");

  const { sendOperatorEmail } = require(__hooks + "/operator_email.js");
  sendOperatorEmail(event, record, "Nauja pirkėjo projekto užklausa", [
    ["Projekto rūšis", projectType],
    ["Miestas / regionas", cityRegion],
    ["Biudžetas", budgetBand],
    ["Pageidaujamas laikas", timeline],
    ["Projekto aprašymas", record.getString("project_brief")],
    ["Kontaktinis vardas", record.getString("contact_name")],
    ["Kontaktinis el. paštas", contactEmail],
    ["Pasirinkti katalogo įrašai", shortlisted.length ? shortlisted.join(", ") : "Nėra"],
  ]);

  const agentMailKey = $os.getenv("AGENTMAIL_API_KEY");
  const agentMailInbox = $os.getenv("AGENTMAIL_INBOX_ID");
  if (!agentMailKey || !agentMailInbox) {
    event.app.logger().error(
      "Buyer request confirmation email skipped because AgentMail environment is unavailable",
      "recordId",
      record.id
    );
  } else {
    try {
      const escapeHtml = (value) => String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
      const plainText = [
        "Jūsų baldų projekto užklausa gauta.",
        "",
        "Projekto rūšis: " + projectType,
        "Miestas / regionas: " + cityRegion,
        "Biudžetas: " + budgetBand,
        "Pageidaujamas laikas: " + timeline,
        "Pasirinktų katalogo įrašų: " + shortlisted.length,
        "",
        "Užklausa išsaugota katalogo operatoriaus peržiūrai. Ji nėra automatiškai siunčiama gamintojams, o pateikimas nėra gamintojo patikra ar pasiūlymo garantija.",
      ].join("\n");
      const html = [
        "<p>Jūsų baldų projekto užklausa gauta.</p>",
        "<ul>",
        "<li><strong>Projekto rūšis:</strong> " + escapeHtml(projectType) + "</li>",
        "<li><strong>Miestas / regionas:</strong> " + escapeHtml(cityRegion) + "</li>",
        "<li><strong>Biudžetas:</strong> " + escapeHtml(budgetBand) + "</li>",
        "<li><strong>Pageidaujamas laikas:</strong> " + escapeHtml(timeline) + "</li>",
        "<li><strong>Pasirinktų katalogo įrašų:</strong> " + shortlisted.length + "</li>",
        "</ul>",
        "<p>Užklausa išsaugota katalogo operatoriaus peržiūrai. Ji nėra automatiškai siunčiama gamintojams, o pateikimas nėra gamintojo patikra ar pasiūlymo garantija.</p>",
      ].join("");
      const response = $http.send({
        method: "POST",
        url: "https://api.agentmail.to/v0/inboxes/" + encodeURIComponent(agentMailInbox) + "/messages/send",
        headers: {
          "Authorization": "Bearer " + agentMailKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: [contactEmail],
          subject: "Jūsų baldų projekto užklausa gauta",
          text: plainText,
          html: html,
          labels: ["app"],
        }),
        timeout: 15,
      });
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw new Error("AgentMail returned HTTP " + response.statusCode);
      }
    } catch (err) {
      event.app.logger().error(
        "Buyer request confirmation email failed",
        "recordId",
        record.id,
        "error",
        String(err)
      );
    }
  }

  const eventsUrl = $os.getenv("SUPERNAUT_EVENTS_URL");
  if (!eventsUrl) {
    event.app.logger().error(
      "Buyer request dashboard notification skipped because SUPERNAUT_EVENTS_URL is unavailable",
      "recordId",
      record.id
    );
    return;
  }

  try {
    const summary = "Nauja pirkėjo projekto užklausa: " + [
      projectType,
      cityRegion,
      budgetBand,
      timeline,
      shortlisted.length + " pasirinkti katalogo įrašai",
    ].join(" · ");
    const response = $http.send({
      method: "POST",
      url: eventsUrl,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "buyer_request_created",
        subject: "Nauja pirkėjo projekto užklausa",
        text: summary,
      }),
      timeout: 15,
    });
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new Error("SUPERNAUT_EVENTS_URL returned HTTP " + response.statusCode);
    }
  } catch (err) {
    event.app.logger().error(
      "Buyer request dashboard notification failed",
      "recordId",
      record.id,
      "error",
      String(err)
    );
  }
}, "buyer_requests");

onRecordAfterCreateSuccess((event) => {
  event.next();

  const record = event.record;
  if (record.getString("mandate_fit") !== "high") {
    return;
  }

  const eventsUrl = $os.getenv("SUPERNAUT_EVENTS_URL");
  if (!eventsUrl) {
    return;
  }

  try {
    const oneLine = (value) => String(value || "").replace(/\s+/g, " ").trim();
    const summary = [
      "Company: " + oneLine(record.getString("company_name")),
      "Country: " + oneLine(record.getString("country")),
      "Sector: " + oneLine(record.getString("sector_tag")),
      "Signal: " + oneLine(record.getString("signal_type")),
      "Source: " + oneLine(record.getString("source_url")),
      "Fit rationale: " + (oneLine(record.getString("fit_rationale")) || "Not provided"),
    ].join("\n");
    const response = $http.send({
      method: "POST",
      url: eventsUrl,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "deal_signal_high_fit_created",
        subject: "New high-fit deal signal",
        text: summary,
      }),
      timeout: 15,
    });
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new Error("SUPERNAUT_EVENTS_URL returned HTTP " + response.statusCode);
    }
  } catch (err) {
    event.app.logger().error(
      "High-fit deal signal dashboard notification failed",
      "recordId",
      record.id,
      "error",
      String(err)
    );
  }
}, "deal_signals");

onRecordEnrich((event) => {
  if (!event.requestInfo.auth || !event.requestInfo.auth.isSuperuser()) {
    event.record.hide(
      "company_name",
      "city",
      "sector",
      "revenue_band",
      "ebitda_band",
      "ownership_succession_situation",
      "timeline",
      "message",
      "contact_name",
      "contact_email",
      "contact_phone",
      "valuation_revenue_eur",
      "valuation_ebitda_eur",
      "valuation_owner_involvement",
      "valuation_customer_concentration",
      "valuation_order_backlog",
      "valuation_ev_low_eur",
      "valuation_ev_high_eur",
      "valuation_multiple_low",
      "valuation_multiple_high",
      // Legacy field names remain confidential but are not part of the request contract.
      "valuation_ebitda_multiple_low",
      "valuation_ebitda_multiple_high",
      "honeypot"
    );
  }
  event.next();
}, "owner_enquiries");

onRecordCreateRequest((event) => {
  const fail = (field, code, message) => {
    const data = {};
    data[field] = new ValidationError(code, message);
    throw new BadRequestError("Patikrinkite pateiktus duomenis.", data);
  };

  const honeypot = event.record.getString("honeypot").trim();
  if (honeypot) {
    fail("honeypot", "invalid_honeypot", "Pateikimas atmestas.");
  }

  const trimField = (name) => {
    event.record.set(name, event.record.getString(name).trim());
  };
  trimField("company_name");
  trimField("city");
  trimField("sector");
  trimField("revenue_band");
  trimField("ebitda_band");
  trimField("ownership_succession_situation");
  trimField("timeline");
  trimField("message");
  trimField("contact_name");

  const contactEmail = event.record.getString("contact_email").trim().toLowerCase();
  if (contactEmail.length > 254) {
    fail("contact_email", "email_too_long", "El. pašto adresas per ilgas.");
  }
  event.record.set("contact_email", contactEmail);
  event.record.set("contact_phone", event.record.getString("contact_phone").trim().replace(/\s+/g, " "));

  const body = event.requestInfo().body || {};
  const valuationFields = [
    "valuation_revenue_eur",
    "valuation_ebitda_eur",
    "valuation_owner_involvement",
    "valuation_customer_concentration",
    "valuation_order_backlog",
    "valuation_ev_low_eur",
    "valuation_ev_high_eur",
    "valuation_multiple_low",
    "valuation_multiple_high",
  ];
  const valuationNumberFields = [
    "valuation_revenue_eur",
    "valuation_ebitda_eur",
    "valuation_ev_low_eur",
    "valuation_ev_high_eur",
    "valuation_multiple_low",
    "valuation_multiple_high",
  ];
  const valuationSelectFields = [
    "valuation_owner_involvement",
    "valuation_customer_concentration",
    "valuation_order_backlog",
  ];
  const isAbsent = (value) => value === undefined || value === null || (typeof value === "string" && value.trim() === "");
  const submittedValuationFields = valuationFields.filter((name) => !isAbsent(body[name]));

  if (submittedValuationFields.length === 0) {
    // Keep the legacy owner form fully optional, including when it submits blank fields.
    for (const name of valuationNumberFields) {
      event.record.set(name, null);
    }
    for (const name of valuationSelectFields) {
      event.record.set(name, "");
    }
  } else {
    if (submittedValuationFields.length !== valuationFields.length) {
      fail("valuation_revenue_eur", "incomplete_valuation_context", "Nurodykite visą vertės orientyro informaciją arba jos nepildykite.");
    }

    const maxCurrencyEur = 1000000000000;
    const maxEvEur = 20000000000000;
    const readCurrency = (name, mustBePositive, maximum) => {
      const value = body[name];
      if (typeof value !== "number" || !Number.isFinite(value)) {
        fail(name, "invalid_valuation_number", "Nurodykite galiojantį skaičių eurais.");
      }
      if (value < 0) {
        fail(name, "negative_valuation_number", "Suma eurais negali būti neigiama.");
      }
      if (mustBePositive && value <= 0) {
        const message = name === "valuation_ebitda_eur"
          ? "EBITDA turi būti didesnė už nulį."
          : "Įmonės vertė turi būti didesnė už nulį.";
        fail(name, "nonpositive_valuation_number", message);
      }
      if (value > maximum) {
        fail(name, "valuation_number_too_large", "Suma eurais yra per didelė.");
      }
      event.record.set(name, value);
      return value;
    };
    const readMultiple = (name) => {
      const value = body[name];
      if (typeof value !== "number" || !Number.isFinite(value) || value < 1 || value > 20) {
        fail(name, "invalid_valuation_multiple", "EBITDA daugiklis turi būti nuo 1 iki 20.");
      }
      event.record.set(name, value);
      return value;
    };
    const readChoice = (name, values) => {
      const value = body[name];
      if (typeof value !== "string") {
        fail(name, "invalid_valuation_choice", "Pasirinkite tinkamą vertės orientyro variantą.");
      }
      const normalized = value.trim();
      if (!values.includes(normalized)) {
        fail(name, "invalid_valuation_choice", "Pasirinkite tinkamą vertės orientyro variantą.");
      }
      event.record.set(name, normalized);
      return normalized;
    };

    readCurrency("valuation_revenue_eur", false, maxCurrencyEur);
    const ebitdaEur = readCurrency("valuation_ebitda_eur", true, maxCurrencyEur);
    readChoice("valuation_owner_involvement", [
      "Kasdienis operacinis vaidmuo",
      "Dalinė operacinė veikla",
      "Nedalyvauja kasdienėje veikloje",
    ]);
    readChoice("valuation_customer_concentration", [
      "Nė vienas klientas nesudaro daugiau nei 20 % pajamų",
      "Didžiausias klientas sudaro 20–40 % pajamų",
      "Didžiausias klientas sudaro daugiau nei 40 % pajamų",
    ]);
    readChoice("valuation_order_backlog", [
      "Mažiau nei 3 mėn.",
      "3–6 mėn.",
      "Daugiau nei 6 mėn.",
    ]);
    const evLowEur = readCurrency("valuation_ev_low_eur", true, maxEvEur);
    const evHighEur = readCurrency("valuation_ev_high_eur", true, maxEvEur);
    const multipleLow = readMultiple("valuation_multiple_low");
    const multipleHigh = readMultiple("valuation_multiple_high");

    if (multipleLow > multipleHigh) {
      fail("valuation_multiple_low", "unordered_valuation_multiples", "Apatinis EBITDA daugiklis negali būti didesnis už viršutinį.");
    }
    if (evLowEur > evHighEur) {
      fail("valuation_ev_low_eur", "unordered_valuation_range", "Apatinė įmonės vertė negali būti didesnė už viršutinę.");
    }

    // The indicator stores EUR values rounded to whole euros. Do not trust a
    // client-side range unless it matches the submitted EBITDA and multiples.
    const roundingToleranceEur = 1;
    if (Math.abs(evLowEur - ebitdaEur * multipleLow) > roundingToleranceEur) {
      fail("valuation_ev_low_eur", "inconsistent_valuation_range", "Apskaičiuota apatinė įmonės vertė neatitinka EBITDA ir daugiklio.");
    }
    if (Math.abs(evHighEur - ebitdaEur * multipleHigh) > roundingToleranceEur) {
      fail("valuation_ev_high_eur", "inconsistent_valuation_range", "Apskaičiuota viršutinė įmonės vertė neatitinka EBITDA ir daugiklio.");
    }
  }

  event.record.set("status", "new");
  event.record.set("honeypot", "");

  event.next();
}, "owner_enquiries");

onRecordAfterCreateSuccess((event) => {
  event.next();

  const record = event.record;
  const contactEmail = record.getString("contact_email");
  const companyName = record.getString("company_name");
  const city = record.getString("city");
  const sector = record.getString("sector");
  const revenueBand = record.getString("revenue_band");
  const ebitdaBand = record.getString("ebitda_band");
  const ownershipSuccessionSituation = record.getString("ownership_succession_situation");
  const timeline = record.getString("timeline");

  const operatorFields = [
    ["Įmonė", companyName],
    ["Miestas", city],
    ["Sektorius", sector],
    ["Pajamų riba", revenueBand],
    ["EBITDA riba", ebitdaBand],
    ["Nuosavybės / perėmimo situacija", ownershipSuccessionSituation],
    ["Laikotarpis", timeline],
    ["Žinutė", record.getString("message")],
    ["Kontaktinis vardas", record.getString("contact_name")],
    ["Kontaktinis el. paštas", contactEmail],
    ["Kontaktinis telefonas", record.getString("contact_phone")],
  ];
  const valuationEbitdaEurForEmail = Number(record.get("valuation_ebitda_eur"));
  if (Number.isFinite(valuationEbitdaEurForEmail) && valuationEbitdaEurForEmail > 0) {
    operatorFields.push(
      ["Vertinimo pajamos", record.get("valuation_revenue_eur") + " €"],
      ["Vertinimo EBITDA", valuationEbitdaEurForEmail + " €"],
      ["Savininko vaidmuo", record.getString("valuation_owner_involvement")],
      ["Klientų koncentracija", record.getString("valuation_customer_concentration")],
      ["Užsakymų portfelis", record.getString("valuation_order_backlog")],
      ["Vertės intervalas", record.get("valuation_ev_low_eur") + " €–" + record.get("valuation_ev_high_eur") + " €"],
      ["EBITDA daugiklis", record.get("valuation_multiple_low") + "–" + record.get("valuation_multiple_high") + "×"],
    );
  }
  const { sendOperatorEmail } = require(__hooks + "/operator_email.js");
  sendOperatorEmail(event, record, "Nauja konfidenciali savininko užklausa", operatorFields);

  const agentMailKey = $os.getenv("AGENTMAIL_API_KEY");
  const agentMailInbox = $os.getenv("AGENTMAIL_INBOX_ID");
  if (!agentMailKey || !agentMailInbox) {
    event.app.logger().error(
      "Owner enquiry confirmation email skipped because AgentMail environment is unavailable",
      "recordId",
      record.id
    );
  } else {
    try {
      const plainText = [
        "Jūsų konfidenciali savininko užklausa gauta.",
        "",
        "Ją gavo Lietuvos ETA, kad galėtume pradėti tiesioginę privačią diskusiją su pirkėju.",
        "Užklausa nebus persiųsta jokiai kataloge nurodytai įmonei.",
        "Pateikimas nėra pasiūlymas ar vertinimas.",
      ].join("\n");
      const html = [
        "<p>Jūsų konfidenciali savininko užklausa gauta.</p>",
        "<p>Ją gavo Lietuvos ETA, kad galėtume pradėti tiesioginę privačią diskusiją su pirkėju.</p>",
        "<p>Užklausa nebus persiųsta jokiai kataloge nurodytai įmonei.</p>",
        "<p>Pateikimas nėra pasiūlymas ar vertinimas.</p>",
      ].join("");
      const response = $http.send({
        method: "POST",
        url: "https://api.agentmail.to/v0/inboxes/" + encodeURIComponent(agentMailInbox) + "/messages/send",
        headers: {
          "Authorization": "Bearer " + agentMailKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: [contactEmail],
          subject: "Jūsų konfidenciali savininko užklausa gauta",
          text: plainText,
          html: html,
          labels: ["app"],
        }),
        timeout: 15,
      });
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw new Error("AgentMail returned HTTP " + response.statusCode);
      }
    } catch (err) {
      event.app.logger().error(
        "Owner enquiry confirmation email failed",
        "recordId",
        record.id,
        "error",
        String(err)
      );
    }
  }

  const eventsUrl = $os.getenv("SUPERNAUT_EVENTS_URL");
  if (!eventsUrl) {
    event.app.logger().error(
      "Owner enquiry dashboard notification skipped because SUPERNAUT_EVENTS_URL is unavailable",
      "recordId",
      record.id
    );
    return;
  }

  try {
    const summaryLines = [
      "Įmonė: " + companyName,
      "Miestas: " + city,
      "Sektorius: " + sector,
      "Pajamų riba: " + revenueBand,
      "EBITDA riba: " + ebitdaBand,
      "Situacija: " + ownershipSuccessionSituation,
      "Laikotarpis: " + timeline,
    ];
    const valuationEbitdaEur = Number(record.get("valuation_ebitda_eur"));
    if (Number.isFinite(valuationEbitdaEur) && valuationEbitdaEur > 0) {
      const valuationRevenueEur = Number(record.get("valuation_revenue_eur"));
      const valuationEvLowEur = Number(record.get("valuation_ev_low_eur"));
      const valuationEvHighEur = Number(record.get("valuation_ev_high_eur"));
      const valuationMultipleLow = Number(record.get("valuation_multiple_low"));
      const valuationMultipleHigh = Number(record.get("valuation_multiple_high"));
      const ownerInvolvement = record.getString("valuation_owner_involvement");
      const customerConcentration = record.getString("valuation_customer_concentration");
      const orderBacklog = record.getString("valuation_order_backlog");
      const formatEur = (value) => Math.round(value) + " €";

      if (
        Number.isFinite(valuationRevenueEur) &&
        Number.isFinite(valuationEvLowEur) &&
        Number.isFinite(valuationEvHighEur) &&
        Number.isFinite(valuationMultipleLow) &&
        Number.isFinite(valuationMultipleHigh) &&
        ownerInvolvement &&
        customerConcentration &&
        orderBacklog
      ) {
        summaryLines.push(
          "Vertinimo kontekstas: pajamos " + formatEur(valuationRevenueEur) +
          "; EBITDA " + formatEur(valuationEbitdaEur) +
          "; savininko vaidmuo: " + ownerInvolvement +
          "; klientų koncentracija: " + customerConcentration +
          "; užsakymų portfelis: " + orderBacklog
        );
        summaryLines.push(
          "Vertės intervalas: " + formatEur(valuationEvLowEur) + "–" + formatEur(valuationEvHighEur) +
          " (" + valuationMultipleLow + "–" + valuationMultipleHigh + "× EBITDA)"
        );
      }
    }
    const summary = summaryLines.join("\n");
    const response = $http.send({
      method: "POST",
      url: eventsUrl,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "owner_enquiry_created",
        subject: "Nauja konfidenciali savininko užklausa",
        text: summary,
      }),
      timeout: 15,
    });
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new Error("SUPERNAUT_EVENTS_URL returned HTTP " + response.statusCode);
    }
  } catch (err) {
    event.app.logger().error(
      "Owner enquiry dashboard notification failed",
      "recordId",
      record.id,
      "error",
      String(err)
    );
  }
}, "owner_enquiries");

onRecordEnrich((event) => {
  if (!event.requestInfo.auth || !event.requestInfo.auth.isSuperuser()) {
    event.record.hide("contact_email", "honeypot");
  }
  event.next();
}, "manufacturer_reviews");

onRecordCreateRequest((event) => {
  const fail = (field, code, message) => {
    const data = {};
    data[field] = new ValidationError(code, message);
    throw new BadRequestError("Patikrinkite pateiktus duomenis.", data);
  };

  const honeypot = event.record.getString("honeypot").trim();
  if (honeypot) {
    fail("honeypot", "invalid_honeypot", "Pateikimas atmestas.");
  }

  const trimText = (name, min, max, required) => {
    const value = event.record.getString(name).trim();
    if ((required && !value) || value.length < min || value.length > max) {
      fail(name, "invalid_length", "Patikrinkite pateikto teksto ilgį.");
    }
    event.record.set(name, value);
  };

  trimText("display_name", 1, 80, true);
  trimText("review_text", 10, 2000, true);
  trimText("project_type", 0, 120, false);

  const contactEmail = event.record.getString("contact_email").trim().toLowerCase();
  if (!contactEmail || contactEmail.length > 254) {
    fail("contact_email", "invalid_email", "Nurodykite galiojantį el. pašto adresą.");
  }
  event.record.set("contact_email", contactEmail);

  const rating = event.record.get("rating");
  if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    fail("rating", "invalid_rating", "Įvertinimas turi būti sveikasis skaičius nuo 1 iki 5.");
  }
  event.record.set("rating", rating);

  const manufacturerId = event.record.getString("manufacturer").trim();
  if (!manufacturerId) {
    fail("manufacturer", "missing_manufacturer", "Pasirinkite kataloge esantį gamintoją.");
  }
  try {
    event.app.findRecordById("manufacturers", manufacturerId);
  } catch (_) {
    fail("manufacturer", "unknown_manufacturer", "Pasirinktas gamintojas kataloge nerastas.");
  }
  event.record.set("manufacturer", manufacturerId);

  // Never trust a status or trap value supplied by the public client.
  event.record.set("status", "pending");
  event.record.set("honeypot", "");

  event.next();
}, "manufacturer_reviews");

onRecordAfterCreateSuccess((event) => {
  event.next();

  const record = event.record;
  const manufacturerId = record.getString("manufacturer");
  let manufacturerName = "Nenurodyta";
  let manufacturerSlug = "Nenurodyta";
  try {
    const manufacturer = event.app.findRecordById("manufacturers", manufacturerId);
    manufacturerName = manufacturer.getString("trading_name");
    manufacturerSlug = manufacturer.getString("slug");
  } catch (err) {
    event.app.logger().error(
      "Manufacturer review operator notification could not load manufacturer context",
      "recordId",
      record.id,
      "manufacturerId",
      manufacturerId,
      "error",
      String(err)
    );
  }

  const { sendOperatorEmail } = require(__hooks + "/operator_email.js");
  sendOperatorEmail(event, record, "Naujas gamintojo atsiliepimas peržiūrai", [
    ["Gamintojas", manufacturerName],
    ["Gamintojo slug", manufacturerSlug],
    ["Gamintojo įrašo ID", manufacturerId],
    ["Įvertinimas", record.get("rating") + " / 5"],
    ["Pateikėjo vardas", record.getString("display_name")],
    ["Projekto rūšis", record.getString("project_type")],
    ["Kontaktinis el. paštas", record.getString("contact_email")],
    ["Atsiliepimas", record.getString("review_text")],
  ]);
}, "manufacturer_reviews");

onRecordAfterCreateSuccess((event) => {
  event.next();

  const record = event.record;
  const requestKind = record.getString("request_kind");
  const requestKindLabel = requestKind === "claim"
    ? "Patvirtinti atstovavimą įrašui"
    : "Pataisyti duomenis arba pranešti apie problemą";

  const { sendOperatorEmail } = require(__hooks + "/operator_email.js");
  sendOperatorEmail(event, record, "Naujas katalogo " + (requestKind === "claim" ? "atstovavimo" : "pataisos") + " prašymas", [
    ["Įrašo pavadinimas", record.getString("manufacturer_display_name")],
    ["Gamintojo slug", record.getString("manufacturer_slug")],
    ["Prašymo rūšis", requestKindLabel],
    ["Kontaktinis el. paštas", record.getString("contact_email")],
    ["Prašymas", record.getString("report_text")],
  ]);
}, "correction_requests");

onRecordCreateRequest((event) => {
  const fail = (field, code, message) => {
    const data = {};
    data[field] = new ValidationError(code, message);
    throw new BadRequestError("Patikrinkite pateiktus duomenis.", data);
  };

  const honeypot = event.record.getString("honeypot").trim();
  if (honeypot) {
    fail("honeypot", "invalid_honeypot", "Pateikimas atmestas.");
  }

  const trimText = (name, min, max, required) => {
    const value = event.record.getString(name).trim();
    if ((required && !value) || value.length < min || value.length > max) {
      fail(name, "invalid_length", "Patikrinkite pateikto teksto ilgį.");
    }
    event.record.set(name, value);
    return value;
  };

  const manufacturerSlug = trimText("manufacturer_slug", 1, 180, true);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(manufacturerSlug)) {
    fail("manufacturer_slug", "invalid_slug", "Nurodykite tinkamą gamintojo identifikatorių.");
  }
  try {
    event.app.findFirstRecordByData("manufacturers", "slug", manufacturerSlug);
  } catch (_) {
    fail("manufacturer_slug", "unknown_manufacturer", "Gamintojas kataloge nerastas.");
  }

  trimText("company_name", 1, 240, true);
  trimText("claimant_name", 2, 120, true);
  trimText("role", 2, 160, true);
  trimText("message", 10, 5000, true);

  const email = event.record.getString("email").trim().toLowerCase();
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fail("email", "invalid_email", "Nurodykite galiojantį el. pašto adresą.");
  }
  event.record.set("email", email);

  const phone = event.record.getString("phone").trim().replace(/\s+/g, " ");
  if (phone.length > 40 || (phone && !/^[0-9+().\-\s]+$/.test(phone))) {
    fail("phone", "invalid_phone", "Nurodykite galiojantį telefono numerį.");
  }
  event.record.set("phone", phone);

  if (!event.record.getBool("consent")) {
    fail("consent", "consent_required", "Būtinas sutikimas susisiekti dėl prašymo.");
  }

  // Workflow state and trap values are controlled by the server, not the visitor.
  event.record.set("consent", true);
  event.record.set("status", "new");
  event.record.set("honeypot", "");
  event.next();
}, "manufacturer_claims");

onRecordAfterCreateSuccess((event) => {
  event.next();

  const record = event.record;
  const { sendOperatorEmail } = require(__hooks + "/operator_email.js");
  sendOperatorEmail(event, record, "Naujas gamintojo atstovavimo ar pataisos prašymas", [
    ["Gamintojo slug", record.getString("manufacturer_slug")],
    ["Įmonės pavadinimas", record.getString("company_name")],
    ["Pateikėjo vardas", record.getString("claimant_name")],
    ["Pareigos", record.getString("role")],
    ["Kontaktinis el. paštas", record.getString("email")],
    ["Telefonas", record.getString("phone")],
    ["Prašymas", record.getString("message")],
  ]);

  const eventsUrl = $os.getenv("SUPERNAUT_EVENTS_URL");
  if (!eventsUrl) {
    event.app.logger().error(
      "Manufacturer claim dashboard notification skipped because SUPERNAUT_EVENTS_URL is unavailable",
      "recordId",
      record.id
    );
    return;
  }

  try {
    const summary = "Naujas gamintojo atstovavimo ar pataisos prašymas: " + [
      record.getString("company_name"),
      record.getString("claimant_name") + " (" + record.getString("role") + ")",
      record.getString("manufacturer_slug"),
    ].join(" · ");
    const response = $http.send({
      method: "POST",
      url: eventsUrl,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "manufacturer_claim_created",
        subject: "Naujas gamintojo atstovavimo ar pataisos prašymas",
        text: summary,
      }),
      timeout: 15,
    });
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new Error("SUPERNAUT_EVENTS_URL returned HTTP " + response.statusCode);
    }
  } catch (err) {
    event.app.logger().error(
      "Manufacturer claim dashboard notification failed",
      "recordId",
      record.id,
      "error",
      String(err)
    );
  }
}, "manufacturer_claims");

// RFQ tender foundation: the public API is intentionally limited to a single
// submission route. Collections remain superuser-only; dispatching and proposal
// handling have no public endpoint and never send external messages from hooks.
onRecordAfterCreateSuccess((event) => {
  event.next();

  const record = event.record;
  const reference = record.getString("reference");
  // Keep this alert operational only: buyer and provider contact details, the
  // preferred shortlist, and any dispatch data must remain out of notifications.
  const oneLine = (value) => String(value || "Nenurodyta").replace(/\s+/g, " ").trim();
  const summary = [
    "RFQ " + reference,
    "Kategorija: " + oneLine(record.getString("category")),
    "Savivaldybė: " + oneLine(record.getString("municipality")),
    "Regionas: " + oneLine(record.getString("service_region")),
    "Etapas: " + oneLine(record.getString("project_stage")),
    "Biudžetas: " + record.get("budget_min") + "–" + record.get("budget_max") + " EUR",
    "Pageidaujamas terminas: " + oneLine(record.getString("desired_completion_date")),
  ].join(" · ");

  const agentMailKey = $os.getenv("AGENTMAIL_API_KEY");
  const agentMailInbox = $os.getenv("AGENTMAIL_INBOX_ID");
  if (!agentMailKey || !agentMailInbox) {
    event.app.logger().error(
      "RFQ operator notification email skipped because AgentMail environment is unavailable",
      "recordId",
      record.id
    );
  } else {
    try {
      const response = $http.send({
        method: "POST",
        url: "https://api.agentmail.to/v0/inboxes/" + encodeURIComponent(agentMailInbox) + "/messages/send",
        headers: {
          "Authorization": "Bearer " + agentMailKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: ["info@baldininkai.org"],
          subject: "Nauja RFQ užklausa: " + reference,
          text: [
            "Nauja RFQ užklausa priimta operatoriaus peržiūrai.",
            "",
            summary,
            "",
            "Užklausa nėra automatiškai siunčiama gamintojams.",
          ].join("\n"),
          labels: ["app"],
        }),
        timeout: 15,
      });
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw new Error("AgentMail returned HTTP " + response.statusCode);
      }
    } catch (err) {
      event.app.logger().error(
        "RFQ operator notification email failed",
        "recordId",
        record.id,
        "error",
        String(err)
      );
    }
  }

  const eventsUrl = $os.getenv("SUPERNAUT_EVENTS_URL");
  if (!eventsUrl) {
    event.app.logger().error(
      "RFQ dashboard notification skipped because SUPERNAUT_EVENTS_URL is unavailable",
      "recordId",
      record.id
    );
    return;
  }

  try {
    const response = $http.send({
      method: "POST",
      url: eventsUrl,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "rfq_submitted",
        subject: "Nauja RFQ užklausa: " + reference,
        text: summary,
      }),
      timeout: 15,
    });
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new Error("SUPERNAUT_EVENTS_URL returned HTTP " + response.statusCode);
    }
  } catch (err) {
    event.app.logger().error(
      "RFQ dashboard notification failed",
      "recordId",
      record.id,
      "error",
      String(err)
    );
  }
}, "rfqs");

routerAdd("POST", "/api/public/rfqs", (event) => {
  const fail = (field, code, message) => {
    const data = {};
    data[field] = new ValidationError(code, message);
    throw new BadRequestError("Patikrinkite pateiktus RFQ duomenis.", data);
  };
  const requestInfo = event.requestInfo();
  const body = requestInfo.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    fail("body", "invalid_body", "Pateikite JSON objektą.");
  }

  const trimText = (name, min, max, required) => {
    const submitted = body[name];
    if (submitted === undefined || submitted === null) {
      if (required) fail(name, "required", "Laukas yra privalomas.");
      return "";
    }
    if (typeof submitted !== "string") {
      fail(name, "invalid_type", "Laukas turi būti tekstas.");
    }
    const value = submitted.trim();
    if ((required && !value) || value.length < min || value.length > max) {
      fail(name, "invalid_length", "Patikrinkite pateikto teksto ilgį.");
    }
    return value;
  };
  const parseAmount = (name) => {
    const value = body[name];
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 100000000) {
      fail(name, "invalid_amount", "Nurodykite ne neigiamą biudžeto sumą.");
    }
    return value;
  };
  const parseDate = (name) => {
    const value = body[name];
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      fail(name, "invalid_date", "Nurodykite datą YYYY-MM-DD formatu.");
    }
    const date = new Date(value + "T00:00:00.000Z");
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
      fail(name, "invalid_date", "Nurodykite galiojančią datą.");
    }
    return value;
  };

  const fullName = trimText("full_name", 2, 120, true);
  const email = trimText("email", 3, 254, true).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fail("email", "invalid_email", "Nurodykite galiojantį el. pašto adresą.");
  }
  const phone = trimText("phone", 0, 40, false);
  if (phone && !/^[0-9+().\-\s]+$/.test(phone)) {
    fail("phone", "invalid_phone", "Nurodykite galiojantį telefono numerį.");
  }

  const budgetMin = parseAmount("budget_min");
  const budgetMax = parseAmount("budget_max");
  if (budgetMax < budgetMin) {
    fail("budget_max", "invalid_budget_range", "Didžiausias biudžetas negali būti mažesnis už mažiausią.");
  }

  let shortlist = body.preferred_shortlist;
  if (shortlist === undefined || shortlist === null || shortlist === "") {
    shortlist = [];
  } else if (!Array.isArray(shortlist)) {
    fail("preferred_shortlist", "invalid_shortlist", "Pageidaujamas sąrašas turi būti masyvas.");
  }
  if (shortlist.length > 8) {
    fail("preferred_shortlist", "shortlist_too_large", "Galima pasirinkti ne daugiau kaip 8 gamintojus.");
  }
  const normalizedShortlist = [];
  const seen = {};
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  for (const submitted of shortlist) {
    if (typeof submitted !== "string") {
      fail("preferred_shortlist", "invalid_shortlist", "Kiekvienas gamintojo identifikatorius turi būti tekstas.");
    }
    const identifier = submitted.trim();
    if (!identifier || identifier.length > 180) {
      fail("preferred_shortlist", "invalid_shortlist", "Pateiktas netinkamas gamintojo identifikatorius.");
    }
    let manufacturer;
    try {
      manufacturer = event.app.findRecordById("manufacturers", identifier);
    } catch (_) {
      if (!slugPattern.test(identifier)) {
        fail("preferred_shortlist", "invalid_shortlist", "Pateiktas netinkamas gamintojo identifikatorius.");
      }
      try {
        manufacturer = event.app.findFirstRecordByData("manufacturers", "slug", identifier);
      } catch (_) {
        fail("preferred_shortlist", "unknown_manufacturer", "Pasirinktas gamintojas kataloge nerastas.");
      }
    }
    if (!seen[manufacturer.id]) {
      seen[manufacturer.id] = true;
      normalizedShortlist.push(manufacturer.id);
    }
  }

  const timestamp = new Date().toISOString().replace("T", " ");
  const rfqs = event.app.findCollectionByNameOrId("rfqs");
  const rfq = new Record(rfqs);
  const reference = "RFQ-" + $security.randomString(18).toUpperCase();
  const ownerReceiptToken = $security.randomString(64);
  rfq.set("reference", reference);
  rfq.set("full_name", fullName);
  rfq.set("email", email);
  rfq.set("phone", phone);
  rfq.set("category", trimText("category", 2, 120, true));
  rfq.set("municipality", trimText("municipality", 2, 160, true));
  rfq.set("service_region", trimText("service_region", 2, 160, true));
  rfq.set("project_stage", trimText("project_stage", 2, 120, true));
  rfq.set("project_scope", trimText("project_scope", 10, 5000, true));
  rfq.set("dimensions_room_count", trimText("dimensions_room_count", 1, 1000, true));
  rfq.set("materials_requirements", trimText("materials_requirements", 1, 3000, true));
  rfq.set("budget_min", budgetMin);
  rfq.set("budget_max", budgetMax);
  rfq.set("desired_completion_date", parseDate("desired_completion_date"));
  rfq.set("installation_access_constraints", trimText("installation_access_constraints", 1, 3000, true));
  rfq.set("preferred_shortlist", normalizedShortlist);
  // Client-supplied workflow, deadline, recipient, contact-sharing, and scoring values are ignored.
  rfq.set("status", "submitted");
  rfq.set("operator_review_state", "pending");
  rfq.set("consented_at", timestamp);
  rfq.set("submitted_at", timestamp);
  rfq.set("owner_receipt_token", ownerReceiptToken);
  rfq.set("contract_source_trace", {
    filename: "Pirkimo-pardavimo_sutartis_sablonas_B2C.docx",
    sha256: "318cfa797be46ed395d968211a03949125caed35d5c223f8e05a7548970656b8",
    size_bytes: 14608,
    classification: "informational_not_legal_advice",
  });
  event.app.save(rfq);

  const events = event.app.findCollectionByNameOrId("rfq_events");
  const submittedEvent = new Record(events);
  submittedEvent.set("rfq", rfq.id);
  submittedEvent.set("event_type", "submitted");
  submittedEvent.set("actor", "public_submission");
  submittedEvent.set("occurred_at", timestamp);
  submittedEvent.set("details", { reference: reference, status: "submitted" });
  event.app.save(submittedEvent);

  return event.json(201, {
    reference: reference,
    status: "submitted",
    submitted_at: timestamp,
    next_step: "operator_review",
    owner_receipt_token: ownerReceiptToken,
  });
});

onRecordCreateRequest((event) => {
  const fail = (field, code, message) => {
    const data = {};
    data[field] = new ValidationError(code, message);
    throw new BadRequestError("Netinkamas RFQ siuntimo auditas.", data);
  };
  const requestInfo = event.requestInfo();
  const actor = requestInfo.auth;
  if (!actor || !actor.isSuperuser()) {
    throw new ForbiddenError("RFQ siuntimus gali įrašyti tik operatorius.");
  }

  const rfqId = event.record.getString("rfq");
  let rfq;
  try {
    rfq = event.app.findRecordById("rfqs", rfqId);
  } catch (_) {
    fail("rfq", "unknown_rfq", "RFQ nerastas.");
  }
  if (rfq.getString("operator_review_state") !== "approved" || rfq.getString("status") !== "approved_for_dispatch") {
    fail("rfq", "dispatch_not_approved", "Siuntimui būtinas atskirai patvirtintas RFQ.");
  }
  if (rfq.getString("proposal_deadline")) {
    fail("rfq", "already_dispatched", "RFQ jau turi pasiūlymų pateikimo terminą.");
  }

  const body = requestInfo.body || {};
  // PocketBase exposes JSONField request input as JSONRaw bytes in JS hooks.
  const parseJsonInput = (value, field) => {
    if (Array.isArray(value) && value.every((item) => typeof item === "number")) {
      try {
        return JSON.parse(toString(value));
      } catch (_) {
        fail(field, "invalid_json", "Pateikite tinkamą JSON reikšmę.");
      }
    }
    return value;
  };
  const submittedRecipients = parseJsonInput(body.selected_recipient_ids, "selected_recipient_ids");
  if (!Array.isArray(submittedRecipients) || submittedRecipients.length < 1 || submittedRecipients.length > 8) {
    fail("selected_recipient_ids", "invalid_recipients", "Pasirinkite nuo 1 iki 8 katalogo gamintojų.");
  }
  const recipientIds = [];
  const seenRecipients = {};
  for (const submitted of submittedRecipients) {
    if (typeof submitted !== "string" || !submitted.trim()) {
      fail("selected_recipient_ids", "invalid_recipient", "Gamintojo identifikatorius netinkamas.");
    }
    const id = submitted.trim();
    try {
      event.app.findRecordById("manufacturers", id);
    } catch (_) {
      fail("selected_recipient_ids", "unknown_recipient", "Pasirinktas gamintojas kataloge nerastas.");
    }
    if (!seenRecipients[id]) {
      seenRecipients[id] = true;
      recipientIds.push(id);
    }
  }

  const approvedFields = parseJsonInput(body.approved_fields, "approved_fields");
  const allowedApprovedFields = {
    category: true,
    municipality: true,
    service_region: true,
    project_stage: true,
    project_scope: true,
    dimensions_room_count: true,
    materials_requirements: true,
    budget_min: true,
    budget_max: true,
    desired_completion_date: true,
    installation_access_constraints: true,
  };
  if (!Array.isArray(approvedFields) || approvedFields.length < 1) {
    fail("approved_fields", "invalid_approved_fields", "Nurodykite patvirtintus projekto laukus.");
  }
  const normalizedApprovedFields = [];
  const seenFields = {};
  for (const submitted of approvedFields) {
    if (typeof submitted !== "string" || !allowedApprovedFields[submitted] || seenFields[submitted]) {
      fail("approved_fields", "invalid_approved_field", "Patvirtintų laukų sąraše yra neleistina reikšmė.");
    }
    seenFields[submitted] = true;
    normalizedApprovedFields.push(submitted);
  }

  const approvalReference = typeof body.approval_reference === "string" ? body.approval_reference.trim() : "";
  if (approvalReference.length < 2 || approvalReference.length > 240) {
    fail("approval_reference", "invalid_approval_reference", "Nurodykite patvirtinimo nuorodą.");
  }

  const dispatchedAt = new Date();
  const deadline = new Date(dispatchedAt.getTime() + 5 * 24 * 60 * 60 * 1000);
  event.record.set("actor", actor.id);
  event.record.set("dispatched_at", dispatchedAt.toISOString().replace("T", " "));
  event.record.set("proposal_deadline", deadline.toISOString().replace("T", " "));
  event.record.set("selected_recipient_ids", recipientIds);
  event.record.set("approved_fields", normalizedApprovedFields);
  event.record.set("approval_reference", approvalReference);
  event.next();
}, "rfq_dispatches");

onRecordAfterCreateSuccess((event) => {
  event.next();
  const dispatch = event.record;
  const rfq = event.app.findRecordById("rfqs", dispatch.getString("rfq"));
  rfq.set("proposal_deadline", dispatch.getString("proposal_deadline"));
  rfq.set("status", "dispatched");
  event.app.save(rfq);

  const events = event.app.findCollectionByNameOrId("rfq_events");
  const auditEvent = new Record(events);
  auditEvent.set("rfq", rfq.id);
  auditEvent.set("event_type", "dispatch_recorded");
  auditEvent.set("actor", dispatch.getString("actor"));
  auditEvent.set("occurred_at", dispatch.getString("dispatched_at"));
  auditEvent.set("details", {
    dispatch_id: dispatch.id,
    selected_recipient_ids: dispatch.getStringSlice("selected_recipient_ids"),
    approved_fields: dispatch.getStringSlice("approved_fields"),
    approval_reference: dispatch.getString("approval_reference"),
    proposal_deadline: dispatch.getString("proposal_deadline"),
  });
  event.app.save(auditEvent);
}, "rfq_dispatches");

onRecordUpdateRequest((event) => {
  throw new BadRequestError("RFQ siuntimo auditų keisti negalima.");
}, "rfq_dispatches");

onRecordDeleteRequest((event) => {
  throw new BadRequestError("RFQ siuntimo auditų trinti negalima.");
}, "rfq_dispatches");

onRecordCreateRequest((event) => {
  const { guardProposalWindow } = require(__hooks + "/rfq_utils.js");
  guardProposalWindow(event);
}, "rfq_proposals");

onRecordUpdateRequest((event) => {
  const { guardProposalWindow } = require(__hooks + "/rfq_utils.js");
  guardProposalWindow(event);
}, "rfq_proposals");
