/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  // The collection may not exist in databases that have not applied its creation migration.
  try {
    app.findCollectionByNameOrId("manufacturer_claims");
  } catch (_) {
    return;
  }

  // Repeating this fixed-email delete is safe and removes only smoke-test residue.
  app.db().newQuery("DELETE FROM `manufacturer_claims` WHERE `email` = 'smoketest@pocketbase-check.invalid'").execute();
}, () => {
  // Deliberately non-destructive: smoke-test claims are not recreated on rollback.
});
