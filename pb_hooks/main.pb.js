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
