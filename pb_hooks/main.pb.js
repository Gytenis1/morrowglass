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
    const summary = [
      "Įmonė: " + companyName,
      "Miestas: " + city,
      "Sektorius: " + sector,
      "Pajamų riba: " + revenueBand,
      "EBITDA riba: " + ebitdaBand,
      "Situacija: " + ownershipSuccessionSituation,
      "Laikotarpis: " + timeline,
    ].join("\n");
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
