# Manufacturer static-catalogue coverage

Coverage snapshot: 315 live `manufacturers` records, enumerated from `repo-1293389879` in seven paginated 50-record reads. The versioned `data/manufacturers.json` contains the same 315 unique slugs and the catalogue fields published for every record. The first 200 records are the existing enriched source set; the remaining 115 records are the regional batch formerly held only in `data/regional_manufacturers_20260809.json` and retain its live public-source facts without invented enrichment.

**Exclusions/collisions:** none. Every live record has a non-empty, lowercase, stable URL slug and is published at `/gamintojas/<slug>/`.

The static generator rejects a missing, malformed, or duplicate profile slug; a missing publishable name/city; malformed category inputs; duplicate generated routes; duplicate category/city routes; and duplicate sitemap paths. `scripts/import-manufacturers.mjs --validate` also requires exactly 315 unique source records. Any future unpublishable live record must be recorded here with its slug/record identifier and concrete reason rather than being omitted.
