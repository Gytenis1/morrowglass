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
