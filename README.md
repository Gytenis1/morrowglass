# Lithuanian made-to-order furniture manufacturer data

This is a Supernaut-managed PocketBase app containing a provenance-preserving seed directory of 121 Lithuanian manufacturer candidates. The records are unverified candidate inventory, not a claim that every maker is currently active, available, or verified.

The versioned source of truth is [`data/manufacturers.json`](data/manufacturers.json). It was normalized only from these public artifacts:

- [Authoritative 121-record seed artifact](https://prod-agent-artifact-engine-production.up.railway.app/render/6041adaa-cd73-4543-b001-1817e66e7987?share=jiqg4Ia8QAXblbyOi9dRsUxXABDzp_d8)
- [Authoritative taxonomy artifact](https://prod-agent-artifact-engine-production.up.railway.app/render/fbab2759-fc97-4ee3-86c7-8823b0e93074?share=ypCVUgQZwo5C8mnOisvZWKa2nc-dKELi)

No private data or outreach is used. The collection date is `2026-07-27`, and all imported records have verification status `nepatvirtinta`.

## Data model

The `manufacturers` collection contains PocketBase's system `id` field plus:

| Field | Type | Meaning |
| --- | --- | --- |
| `slug` | unique text | Derived, URL-safe stable import key. |
| `legal_name` | text, optional | Public legal name, blank when the artifact says it is unknown. |
| `trading_name` | text | Original public brand/trading name. |
| `source_identity` | text | Original identity string exactly as shown by the seed artifact. |
| `legal_entity_known` | boolean | Whether a legal entity/form is identified in the source. |
| `description_lt` | text, optional | Short Lithuanian description; blank where no separately rendered description was added. |
| `location` | text | City or production-base text from the seed artifact. |
| `region` | single-select | `vilnius-east-south`, `kaunas-north`, or `klaipeda-panevezys-west-central`. |
| `region_label` | text | Lithuanian display label for the source grouping. |
| `category_codes` | multi-select | Seed tags `K`, `W`, `BB`, `OC`, `HR`, `U`, `SW`, and `MM`. |
| `category_labels` | JSON string array | Corresponding Lithuanian taxonomy labels. |
| `audience` | single-select | `buitiniai`, `verslas`, or `abiem`, normalized from H/B/M. |
| `website` | URL, optional | Link marked as `web` in the rendered source. |
| `public_contact_url` | URL, optional | Public contact route when present; currently the source's public web route. |
| `portfolio_status` | single-select | `yra` or `nežinoma`, normalized from P/n/p. |
| `confidence` | single-select | `aukštas` or `vidutinis`, normalized from H/M. |
| `confidence_evidence` | text | Compact source scope and presence/audience/portfolio/confidence evidence. |
| `scope_evidence` | text | Attributable scope/size text from the record. |
| `evidence_source_type` | text | Source-kind text from the record's compact state. |
| `source_urls` | JSON string array | All record-level hrefs retained from the rendered HTML; falls back to the artifact URL if absent. |
| `source_artifact_url` | URL | Artifact-level provenance for every record. |
| `source_collection_date` | `YYYY-MM-DD` text | Authoritative collection date, exactly `2026-07-27`. |
| `verification_status` | single-select | `nepatvirtinta`. |

Category mappings are: `K` → Virtuvės baldai; `W` → Spintos ir įmontuojami baldai; `BB` → Miegamojo ir vonios baldai; `OC` → Biuro ir komerciniai baldai; `HR` → HoReCa ir prekybos baldai; `U` → Minkšti baldai pagal užsakymą; `SW` → Medžio darbai ir medžio masyvo baldai; `MM` → Metalo ir mišrių medžiagų baldai.

## Access policy

Anonymous API list and individual-record reads are public. Public create, update, and delete are closed (`null` rules). Corrections must go through an authenticated superuser import or another controlled administrative workflow.

Example public read:

```sh
curl "$PB_URL/api/collections/manufacturers/records?page=1&perPage=30"
```

## Deploy-time schema and seed

[`pb_migrations/1785155000_create_manufacturers.js`](pb_migrations/1785155000_create_manufacturers.js) safely creates or extends the collection, restores the intended rules and compatible field settings, and creates the unique slug index only when absent. It loads `/pb/data/manufacturers.json`, which is copied by `Dockerfile.supernaut-pocketbase`.

The migration validates the exact 121-row count and uses one SQLite multi-row `INSERT ... ON CONFLICT(slug) DO NOTHING` statement. It does not perform per-record boot-time saves. A retry or a partially populated collection fills missing slugs without duplicating existing records. The down migration intentionally does not delete persistent production data.

## Correct and import data

1. Edit `data/manufacturers.json`. Preserve source URLs, source date, uncertainty, and the original `source_identity`; do not add inferred contact details or claims.
2. Validate locally:

   ```sh
   node scripts/import-manufacturers.mjs --validate
   ```

3. Review and commit the JSON correction.
4. Run the authenticated idempotent importer:

   ```sh
   PB_URL="https://your-pocketbase-api.example" \
   PB_ADMIN_EMAIL="admin@example.com" \
   PB_ADMIN_PASSWORD="..." \
   node scripts/import-manufacturers.mjs
   ```

The script uses Node built-ins and PocketBase REST APIs only. It authenticates through the current `_superusers` endpoint, looks up each record by unique `slug`, creates missing records, and updates existing records. It prints created/updated totals. Credentials are required at runtime and are never stored in the repository. Run `node scripts/import-manufacturers.mjs --help` for usage; `--validate` makes no network request.

## Repository layout

- `data/manufacturers.json` — versioned 121-row source of truth.
- `pb_migrations/` — PocketBase schema and deploy-time bulk seed.
- `scripts/import-manufacturers.mjs` — authenticated correction/upsert utility.
- `pb_hooks/` — PocketBase JavaScript hooks.
- `pb_public/` — optional static fallback files served by PocketBase.
- `public/` — built frontend assets, when present, for the separate Cloudflare static Worker.

PocketBase runtime data lives on the managed Fly.io volume and is not committed.
