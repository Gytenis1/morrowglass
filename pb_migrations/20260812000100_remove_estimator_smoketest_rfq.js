/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  // This is deliberately bounded by every observed smoke-test identifier. If the
  // record was already removed, DELETE simply affects zero rows; no other RFQ can match.
  app.db().newQuery("DELETE FROM `rfqs` WHERE `id` = '6gazlmx0p4i2u62' AND `reference` = 'RFQ-QXRYRFAYIX4BT8SFXJ' AND `email` = 'smoketest@pocketbase-check.invalid'").execute()
}, () => {
  // Deliberately non-destructive: the smoke-test RFQ is not recreated on rollback.
})
