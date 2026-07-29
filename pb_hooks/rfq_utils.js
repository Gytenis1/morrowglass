// This module is required inside each PocketBase request handler. Do not load it
// at hook-file scope: PocketBase runs request callbacks in isolated JS VMs.
module.exports.guardProposalWindow = (event) => {
  const fail = (field, code, message) => {
    const data = {};
    data[field] = new ValidationError(code, message);
    throw new BadRequestError("Pasiūlymo pateikti negalima.", data);
  };
  const requestInfo = event.requestInfo();
  const actor = requestInfo.auth;
  if (!actor || !actor.isSuperuser()) {
    throw new ForbiddenError("RFQ pasiūlymus gali tvarkyti tik operatorius.");
  }
  const rfqId = event.record.getString("rfq");
  const dispatchId = event.record.getString("dispatch");
  let rfq;
  let dispatch;
  try {
    rfq = event.app.findRecordById("rfqs", rfqId);
    dispatch = event.app.findRecordById("rfq_dispatches", dispatchId);
  } catch (_) {
    fail("rfq", "unknown_rfq_or_dispatch", "RFQ arba siuntimo auditas nerastas.");
  }
  if (dispatch.getString("rfq") !== rfq.id) {
    fail("dispatch", "dispatch_rfq_mismatch", "Siuntimo auditas nepriklauso RFQ.");
  }
  const deadlineText = dispatch.getString("proposal_deadline");
  const deadline = new Date(deadlineText.replace(" ", "T"));
  if (
    !deadlineText ||
    Number.isNaN(deadline.getTime()) ||
    Date.now() >= deadline.getTime() ||
    rfq.getString("status") === "closed" ||
    rfq.getString("status") === "cancelled"
  ) {
    fail("rfq", "proposal_window_closed", "Pasiūlymų langas uždarytas.");
  }

  const manufacturerId = event.record.getString("manufacturer");
  if (!dispatch.getStringSlice("selected_recipient_ids").includes(manufacturerId)) {
    fail("manufacturer", "manufacturer_not_dispatched", "Gamintojas nebuvo pasirinktas patvirtintame siuntime.");
  }
  const currency = event.record.getString("currency").trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) {
    fail("currency", "invalid_currency", "Nurodykite trijų raidžių valiutos kodą.");
  }
  event.record.set("currency", currency);

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
  const sourceEvidence = parseJsonInput(body.source_evidence, "source_evidence");
  const revisionHistory = parseJsonInput(body.revision_history, "revision_history");
  if (!sourceEvidence || typeof sourceEvidence !== "object" || Array.isArray(sourceEvidence)) {
    fail("source_evidence", "invalid_source_evidence", "Pateikite pasiūlymo šaltinio įrodymą kaip objektą.");
  }
  if (!Array.isArray(revisionHistory) || revisionHistory.length < 1) {
    fail("revision_history", "invalid_revision_history", "Pateikite pasiūlymo pakeitimų istoriją.");
  }
  event.next();
};
