// Require this module inside each PocketBase request handler. Request callbacks
// run in isolated JS VMs and cannot access helpers declared in main.pb.js.
module.exports.sendOperatorEmail = (event, record, subject, fields) => {
  const agentMailKey = $os.getenv("AGENTMAIL_API_KEY");
  const agentMailInbox = $os.getenv("AGENTMAIL_INBOX_ID");
  if (!agentMailKey || !agentMailInbox) {
    event.app.logger().error(
      "Operator notification email skipped because AgentMail environment is unavailable",
      "recordId",
      record.id
    );
    return;
  }

  const textValue = (value) => String(value === undefined || value === null || value === "" ? "Nenurodyta" : value)
    .replace(/\r\n?/g, "\n");
  const escapeHtml = (value) => textValue(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
    .replaceAll("\n", "<br>");
  const plainText = fields.map(([label, value]) => label + ": " + textValue(value)).join("\n");
  const html = "<p>Gauta nauja viešos svetainės forma.</p><ul>" + fields
    .map(([label, value]) => "<li><strong>" + escapeHtml(label) + ":</strong> " + escapeHtml(value) + "</li>")
    .join("") + "</ul>";

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
        subject: subject,
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
      "Operator notification email failed",
      "recordId",
      record.id,
      "error",
      String(err)
    );
  }
};
