migrate((app) => {
  let readings;
  try {
    readings = app.findCollectionByNameOrId("readings");
  } catch {
    readings = new Collection({
      name: "readings",
      type: "base",
    });
  }

  readings.listRule = null;
  readings.viewRule = "";
  readings.createRule = "";
  readings.updateRule = null;
  readings.deleteRule = null;
  readings.fields.add(
    new TextField({ name: "email", required: true }),
    new TextField({ name: "birth_date", required: true }),
    new TextField({ name: "birth_time", required: false }),
    new TextField({ name: "birth_place", required: true }),
    new TextField({ name: "sun_sign", required: true }),
    new TextField({ name: "moon_sign", required: true }),
    new TextField({ name: "rising_sign", required: true }),
    new JSONField({ name: "teaser_json", required: true }),
    new JSONField({
      name: "face_traits_json",
      required: false,
      help: "Optional non-identifying face-reading descriptors only. Do not store biometric identifiers or images.",
    }),
    new TextField({ name: "referral_code", required: true }),
    new TextField({ name: "referred_by", required: false }),
    new AutodateField({ name: "created", onCreate: true, onUpdate: false })
  );
  app.save(readings);

  let faceConsents;
  try {
    faceConsents = app.findCollectionByNameOrId("face_consents");
  } catch {
    faceConsents = new Collection({
      name: "face_consents",
      type: "base",
    });
  }

  faceConsents.listRule = null;
  faceConsents.viewRule = null;
  faceConsents.createRule = "";
  faceConsents.updateRule = "";
  faceConsents.deleteRule = null;
  faceConsents.fields.add(
    new TextField({ name: "reading_id", required: true }),
    new TextField({ name: "email", required: true }),
    new BoolField({ name: "consented", required: false }),
    new TextField({ name: "consent_text_version", required: true }),
    new DateField({ name: "consented_at", required: true }),
    new DateField({ name: "revoked_at", required: false })
  );
  app.save(faceConsents);

  let referrals;
  try {
    referrals = app.findCollectionByNameOrId("referrals");
  } catch {
    referrals = new Collection({
      name: "referrals",
      type: "base",
    });
  }

  referrals.listRule = "code = @request.query.code";
  referrals.viewRule = "code = @request.query.code";
  referrals.createRule = "";
  referrals.updateRule = null;
  referrals.deleteRule = null;
  referrals.fields.add(
    new TextField({ name: "code", required: true }),
    new TextField({ name: "owner_email", required: true }),
    new NumberField({ name: "uses", required: false, min: 0, onlyInt: true }),
    new BoolField({ name: "unlocked", required: false })
  );
  app.save(referrals);
}, (app) => {
  for (const name of ["face_consents", "referrals", "readings"]) {
    try {
      const collection = app.findCollectionByNameOrId(name);
      app.delete(collection);
    } catch {
      // already absent
    }
  }
});
