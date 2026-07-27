/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  // Fixed IDs keep this cleanup bounded; repeating DELETEs after a partial run is safe.
  app.db().newQuery("DELETE FROM `buyer_requests` WHERE `id` IN ('o22qoubksmwlwrt')").execute()
  app.db().newQuery("DELETE FROM `owner_enquiries` WHERE `id` IN ('m7q67m3l3vznyz3', '4uwayeu7geawqka', 'l1ypmza5ngugy8s')").execute()
}, () => {
  // Deliberately non-destructive: deleted internal test enquiries are not recreated on rollback.
})
