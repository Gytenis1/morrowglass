#!/usr/bin/env python3
"""Build an identity-backed furniture-manufacturer research universe from official registers.

Raw responses are cached outside git, making an interrupted run resumable.  The only
identity path is SŪSR kodas -> JAR ja_kodas -> JAR _id -> related official models;
names are evidence returned after a successful identifier join and are never keys.
"""
import argparse
import hashlib
import json
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter
from pathlib import Path

CHECKED_DATE = "2026-08-07"
API_BASE = "https://get.data.gov.lt"
PB_API = "https://sn-pb-repo-1293389879-dc1c2f.fly.dev/api/collections/manufacturers/records"
CACHE = Path("/tmp/morrowglass-registry-universe-20260807")
MANIFEST = Path(__file__).resolve().parents[1] / "data/registry_universe_20260807.json"
USER_AGENT = "Morrowglass official-register universe research/1.0 (+https://morrowglass.lt)"
# One serial request every 0.4 seconds per host (2.5 requests/second).  This is
# deliberately below a short burst rate, and 429/5xx responses are retried with
# exponential backoff (including numeric Retry-After when supplied).  The on-disk cache
# means resumed runs do not repeat successful requests.
MIN_HOST_INTERVAL_SECONDS = 0.4
LAST_REQUEST_BY_HOST = {}

SUSR_PORTAL_URL = "https://data.gov.lt/datasets/2088/"
JAR_PORTAL_URL = "https://data.gov.lt/datasets/1484/"
ADDRESS_PORTAL_URL = "https://data.gov.lt/datasets/1342/"
SUSR_NAMESPACE = "datasets/gov/lsd/cl/ja_asmenys"
SUSR_MODEL = SUSR_NAMESPACE + "/JuridinisAsmuo"
EVRK_NAMESPACE = "datasets/gov/lsd/cl/evrk"
EVRK_MODEL = EVRK_NAMESPACE + "/EkonominesVeiklosRusis"
ENTITY_NAMESPACE = "datasets/gov/rc/jar/iregistruoti"
ENTITY_MODEL = ENTITY_NAMESPACE + "/JuridinisAsmuo"
BUVEINE_NAMESPACE = "datasets/gov/rc/jar/buveines"
BUVEINE_MODEL = BUVEINE_NAMESPACE + "/Buveine"
ADDRESS_NAMESPACE = "datasets/gov/rc/ar/adresai"
ADDRESS_MODEL = ADDRESS_NAMESPACE + "/Adresas"
PNL_NAMESPACE = "datasets/gov/rc/jar/pelno_ataskaitos"
PNL_MODEL = PNL_NAMESPACE + "/PelnoAtaskaita"
TARGET_CODES = ("310100", "310200", "310300", "310900")
DISPLAY_CODES = {"310100": "31.01", "310200": "31.02", "310300": "31.03", "310900": "31.09"}
TARGET_PERIOD_END_YEARS = {"2023", "2024", "2025"}
REVENUE_LINE = "PARDAVIMO PAJAMOS"
PBT_LINE = "PELNAS (NUOSTOLIAI) PRIEŠ APMOKESTINIMĄ"


def cache_paths(url):
    digest = hashlib.sha256(url.encode("utf-8")).hexdigest()
    return CACHE / (digest + ".json"), CACHE / (digest + ".meta.json")


def fetch_json(url):
    """Shared Spinta/PocketBase JSON client pattern used by the financial checkpoint."""
    CACHE.mkdir(parents=True, exist_ok=True)
    body_path, meta_path = cache_paths(url)
    if body_path.exists() and meta_path.exists():
        metadata = json.loads(meta_path.read_text())
        if metadata.get("status") == 200:
            return json.loads(body_path.read_text()), metadata
        # Do not turn transient failures into permanent negative evidence.
        body_path.unlink()
        meta_path.unlink()
    host = urllib.parse.urlparse(url).netloc.lower()
    metadata = {"requested_url": url, "fetched_at": CHECKED_DATE, "status": None, "effective_url": url}
    last_error = None
    for attempt in range(5):
        wait = MIN_HOST_INTERVAL_SECONDS - (time.monotonic() - LAST_REQUEST_BY_HOST.get(host, 0.0))
        if wait > 0:
            time.sleep(wait)
        LAST_REQUEST_BY_HOST[host] = time.monotonic()
        try:
            request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
            with urllib.request.urlopen(request, timeout=120) as response:
                payload = json.loads(response.read().decode("utf-8"))
                metadata.update({"status": response.status, "effective_url": response.geturl()})
            body_path.write_text(json.dumps(payload, ensure_ascii=False) + "\n")
            meta_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n")
            return payload, metadata
        except Exception as exc:
            last_error = exc
            if attempt < 4:
                retry_after = None
                if isinstance(exc, urllib.error.HTTPError):
                    header = exc.headers.get("Retry-After") if exc.headers else None
                    if isinstance(header, str) and header.strip().isdigit():
                        retry_after = min(120, int(header.strip()))
                time.sleep(retry_after if retry_after is not None else min(30, 2 ** attempt))
    metadata["error"] = repr(last_error)
    body_path.write_text(json.dumps({"error": repr(last_error)}, ensure_ascii=False) + "\n")
    meta_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n")
    raise RuntimeError("official API request failed after retries for %s: %r" % (url, last_error))


def api_url(path, query=""):
    # Spinta accepts its query language in the query string.  Do not URL-encode
    # its operators here; identifiers passed to it are generated by this script.
    return API_BASE + "/" + path + ("?" + query if query else "")


def paged_rows(model, query):
    """Follow opaque Spinta pagination and return only rows from the requested model."""
    rows = []
    current = query
    while True:
        payload, _ = fetch_json(api_url(model, current))
        page_rows = payload.get("_data", [])
        if not isinstance(page_rows, list):
            raise RuntimeError("official API returned non-list _data for " + model)
        rows.extend(page_rows)
        next_token = (payload.get("_page") or {}).get("next")
        if not next_token:
            return rows
        current += '&page("%s")' % next_token


def valid_date(value):
    return isinstance(value, str) and len(value) == 10 and value[4] == "-" and value[7] == "-"


def numeric_value(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def preferred_line(rows):
    usable = [row for row in rows if numeric_value(row.get("reiksme")) and valid_date(row.get("reg_date"))]
    if not usable:
        return None
    return sorted(usable, key=lambda row: (row["reg_date"], row.get("_id", "")), reverse=True)[0]


def make_history(entity_id, rows):
    """The exact P&L-line and deterministic newest-filing logic from financial research."""
    periods = {}
    for row in rows:
        start, end = row.get("laikotarpis_nuo"), row.get("laikotarpis_iki")
        if not valid_date(start) or not valid_date(end) or start > end:
            continue
        periods.setdefault((start, end), []).append(row)
    history = []
    for (start, end), period_rows in periods.items():
        revenue = preferred_line([row for row in period_rows if row.get("line_name") == REVENUE_LINE])
        pbt = preferred_line([row for row in period_rows if row.get("line_name") == PBT_LINE])
        selected = [row for row in (revenue, pbt) if row]
        # Do not retain a period merely because some other P&L line exists: the
        # manifest's financial history is evidence for these two exact lines only.
        if not selected:
            continue
        entry = {
            "fiscal_period_start": start,
            "fiscal_period_end": end,
            "filing_registration_date": max(row["reg_date"] for row in selected),
            "source": {"data_portal_url": JAR_PORTAL_URL, "api_model_path": PNL_MODEL, "jar_entity_id": entity_id},
        }
        template_names = sorted({row.get("template_name") for row in selected if isinstance(row.get("template_name"), str) and row["template_name"]})
        standard_names = sorted({row.get("standard_name") for row in selected if isinstance(row.get("standard_name"), str) and row["standard_name"]})
        if template_names:
            entry["template_names"] = template_names
        if standard_names:
            entry["standard_names"] = standard_names
        if revenue:
            entry["revenue_eur"] = revenue["reiksme"]
            entry["revenue_evidence"] = {"line_name": REVENUE_LINE, "api_record_id": revenue["_id"], "registration_date": revenue["reg_date"]}
        if pbt:
            entry["profit_before_tax_eur"] = pbt["reiksme"]
            entry["profit_before_tax_evidence"] = {"line_name": PBT_LINE, "api_record_id": pbt["_id"], "registration_date": pbt["reg_date"]}
        history.append(entry)
    history.sort(key=lambda item: (item["fiscal_period_end"], item["filing_registration_date"], item["fiscal_period_start"]), reverse=True)
    return history[:4]


def has_target_filing(rows):
    return any(valid_date(row.get("laikotarpis_iki")) and row["laikotarpis_iki"][:4] in TARGET_PERIOD_END_YEARS for row in rows)


def confirm_models_and_fields():
    namespaces = [SUSR_NAMESPACE, EVRK_NAMESPACE, ENTITY_NAMESPACE, BUVEINE_NAMESPACE, ADDRESS_NAMESPACE, PNL_NAMESPACE]
    expected = [SUSR_MODEL, EVRK_MODEL, ENTITY_MODEL, BUVEINE_MODEL, ADDRESS_MODEL, PNL_MODEL]
    for namespace, model in zip(namespaces, expected):
        payload, _ = fetch_json(api_url(namespace + "/:ns"))
        if model not in {row.get("name") for row in payload.get("_data", [])}:
            raise RuntimeError("official :ns model confirmation failed for " + model)
    samples = {}
    for model in expected:
        payload, _ = fetch_json(api_url(model, "limit(1)"))
        if not payload.get("_data"):
            raise RuntimeError("official model has no sample: " + model)
        samples[model] = set(payload["_data"][0])
    required = {
        SUSR_MODEL: {"_id", "kodas", "pavadinimas", "veikla", "veiklos_pavadinimas", "evrk_2_1", "evrk_2_1_data", "evrk_2_1_pavadinimas", "veikiantis", "iregistruotas", "isregistruotas"},
        EVRK_MODEL: {"_id", "kodas", "pavadinimas_lt"},
        ENTITY_MODEL: {"_id", "ja_kodas", "ja_pavadinimas", "reg_data", "isreg_data", "statusas", "pilnas_adresas", "adresas"},
        BUVEINE_MODEL: {"_id", "juridinis_asmuo", "adresas", "adresas_nuo"},
        ADDRESS_MODEL: {"_id", "aob_kodas", "aob_data_nuo", "aob_data_iki"},
        PNL_MODEL: {"_id", "juridinis_asmuo", "line_name", "reiksme", "laikotarpis_nuo", "laikotarpis_iki", "reg_date", "template_name", "standard_name"},
    }
    for model, fields in required.items():
        if not fields <= samples[model]:
            raise RuntimeError("official model sample lacks required fields: " + model)
    return {"namespaces_confirmed": [namespace + "/:ns" for namespace in namespaces], "models": expected, "required_fields": {model: sorted(fields) for model, fields in required.items()}}


def fetch_live_catalogue():
    """Read the already-cached live comparison snapshot without contacting PocketBase.

    This research checkpoint is reproducible from its official-register cache and
    the contemporaneous five-page catalogue snapshot.  A later import must perform
    its own live conflict check; this extractor never refreshes or changes live data.
    """
    records, page = [], 1
    while True:
        query = urllib.parse.urlencode({"sort": "slug", "page": page, "perPage": 100, "fields": "slug,company_code"})
        url = PB_API + "?" + query
        body_path, meta_path = cache_paths(url)
        if not body_path.exists() or not meta_path.exists():
            raise RuntimeError("missing cached live catalogue snapshot page %d" % page)
        metadata = json.loads(meta_path.read_text())
        if metadata.get("status") != 200:
            raise RuntimeError("cached live catalogue snapshot page %d is not successful" % page)
        payload = json.loads(body_path.read_text())
        records.extend(payload.get("items", []))
        if page >= payload.get("totalPages", 1):
            break
        page += 1
    codes = {str(row["company_code"]) for row in records if isinstance(row.get("company_code"), (str, int)) and str(row["company_code"])}
    slugs = {row["slug"] for row in records if isinstance(row.get("slug"), str)}
    return codes, slugs, len(records)


def activity_definitions():
    definitions = {}
    for code in TARGET_CODES:
        rows = paged_rows(EVRK_MODEL, 'kodas="%s"&limit(2)' % code)
        exact = [row for row in rows if row.get("kodas") == code and isinstance(row.get("_id"), str)]
        if len(rows) != 1 or len(exact) != 1:
            raise RuntimeError("EVRK code did not resolve uniquely: " + code)
        definitions[code] = exact[0]
    return definitions


def susr_universe(definitions):
    rows = []
    for code, definition in definitions.items():
        activity_id = definition["_id"]
        found = paged_rows(SUSR_MODEL, 'veikla._id="%s"&limit(1000)' % activity_id)
        for row in found:
            if (row.get("veikla") or {}).get("_id") != activity_id:
                raise RuntimeError("SŪSR activity response escaped requested EVRK relation")
            row["_target_evrk_code"] = code
            rows.append(row)
    rows.sort(key=lambda row: (str(row.get("kodas", "")), row.get("_target_evrk_code", ""), row.get("_id", "")))
    return rows


def entity_for_code(company_code):
    lookup_code = str(int(company_code))
    payload, _ = fetch_json(api_url(ENTITY_MODEL, "ja_kodas=%s&limit(2)" % lookup_code))
    rows = payload.get("_data", [])
    exact = [row for row in rows if str(row.get("ja_kodas")) == company_code and isinstance(row.get("_id"), str)]
    return exact[0] if len(rows) == 1 and len(exact) == 1 else None


def pnl_rows_for_entity(entity_id):
    rows = paged_rows(PNL_MODEL, 'juridinis_asmuo._id="%s"&limit(1000)' % entity_id)
    if any((row.get("juridinis_asmuo") or {}).get("_id") != entity_id for row in rows):
        raise RuntimeError("P&L response escaped requested JAR entity " + entity_id)
    return rows


def registered_address(entity_id, jar_entity):
    """Join a current/latest JAR Buveine by ID and report publication limits exactly.

    The published address model exposes address-object identity and validity, not a
    street or locality.  Therefore an address/city is never constructed from an ID,
    postcode, company name, or another source.
    """
    result = {
        "published_address": None,
        "published_city": None,
        "address_publication": {
            "rendered_address": "not_published_in_jar_entity",
            "city": "not_published_in_queried_official_models",
        },
    }
    # Only a literal, rendered JAR entity field is address text evidence.
    for key in ("pilnas_adresas", "adresas"):
        value = jar_entity.get(key)
        if isinstance(value, str) and value.strip():
            result["published_address"] = value.strip()
            result["address_publication"]["rendered_address"] = "published_in_jar_entity.%s" % key
            break
    rows = paged_rows(BUVEINE_MODEL, 'juridinis_asmuo._id="%s"&limit(1000)' % entity_id)
    if any((row.get("juridinis_asmuo") or {}).get("_id") != entity_id for row in rows):
        raise RuntimeError("Buveine response escaped requested JAR entity " + entity_id)
    if not rows:
        result["address_publication"]["registered_address_identity"] = "no_buveine_row_published"
        return result
    rows = [row for row in rows if isinstance((row.get("adresas") or {}).get("_id"), str)]
    if not rows:
        result["address_publication"]["registered_address_identity"] = "no_buveine_address_relation_published"
        return result
    rows.sort(key=lambda row: (row.get("adresas_nuo") or "", row.get("_id", "")), reverse=True)
    buveine = rows[0]
    address_id = buveine["adresas"]["_id"]
    address_payload, _ = fetch_json(api_url(ADDRESS_MODEL, '_id="%s"&limit(2)' % address_id))
    address_rows = [row for row in address_payload.get("_data", []) if row.get("_id") == address_id]
    if len(address_rows) != 1:
        raise RuntimeError("official address did not resolve uniquely: " + address_id)
    address = address_rows[0]
    result["buveine"] = {"id": buveine["_id"], "address_id": address_id, "address_from": buveine.get("adresas_nuo"), "api_model_path": BUVEINE_MODEL}
    result["address_registry"] = {"id": address_id, "address_object_code": address.get("aob_kodas"), "valid_from": address.get("aob_data_nuo"), "valid_to": address.get("aob_data_iki"), "api_model_path": ADDRESS_MODEL}
    result["address_publication"]["registered_address_identity"] = "published_as_buveine_to_adresas_id"
    # The unprojected Adresas sample confirms no rendered street/locality field.
    return result


def slugify(value):
    replacements = str.maketrans({"ą": "a", "č": "c", "ę": "e", "ė": "e", "į": "i", "š": "s", "ų": "u", "ū": "u", "ž": "z", "Ą": "a", "Č": "c", "Ę": "e", "Ė": "e", "Į": "i", "Š": "s", "Ų": "u", "Ū": "u", "Ž": "z"})
    text = value.translate(replacements)
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii").lower()
    text = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    return text[:140].strip("-") or "manufacturer"


def candidate_slug(legal_name, company_code, live_slugs, reserved, collision_stats):
    base = "%s-%s" % (slugify(legal_name), company_code)
    slug = base[:180].strip("-")
    if slug in live_slugs:
        collision_stats["base_slug_matched_live_slug"] += 1
    if slug in reserved:
        collision_stats["base_slug_matched_candidate_slug"] += 1
    if slug in live_slugs or slug in reserved:
        collision_stats["deterministic_jar_suffix_used"] += 1
        slug = (base[:170].strip("-") + "-jar")[:180]
    if slug in live_slugs or slug in reserved:
        collision_stats["manufacturer_code_fallback_used"] += 1
        # The company code keeps this deterministic and identity-backed; this branch is
        # only possible for a pathological normalization collision.
        slug = ("manufacturer-" + company_code)[:180]
    if slug in live_slugs or slug in reserved:
        raise RuntimeError("unable to make collision-free candidate slug for " + company_code)
    reserved.add(slug)
    return slug


def base_item(row):
    code = str(row.get("kodas", ""))
    evrk_code = row["_target_evrk_code"]
    return {
        "company_code": code,
        "legal_name": row.get("pavadinimas") if isinstance(row.get("pavadinimas"), str) else "",
        "activity_evidence": {
            # `veikla` is the SŪSR principal-activity relation used for selection;
            # the newer evrk_2_1 field is retained only as separate returned context.
            "principal_activity_field": "veikla",
            "principal_activity_relation_id": (row.get("veikla") or {}).get("_id"),
            "evrk_2_code": DISPLAY_CODES[evrk_code],
            "evrk_api_code": evrk_code,
            "wording": row.get("veiklos_pavadinimas"),
            "susr_record_id": row.get("_id"),
            "api_model_path": SUSR_MODEL,
            "current_evrk_2_1_returned_by_susr": {
                "relation_id": (row.get("evrk_2_1") or {}).get("_id"),
                "wording": row.get("evrk_2_1_pavadinimas"),
                "effective_date": row.get("evrk_2_1_data"),
            },
        },
        "susr_status_evidence": {"active_value": row.get("veikiantis"), "registered_date": row.get("iregistruotas"), "deregistered_date": row.get("isregistruotas")},
    }


def research(rows, live_codes, live_slugs):
    """Apply mutually-exclusive inclusion reasons in the manifest's stated rule order.

    API failures deliberately abort instead of becoming exclusion evidence.  Successful
    raw responses remain cached, so a later invocation resumes without fabricated gaps.
    """
    results, seen_codes, reserved_slugs, collision_stats = [], set(), set(), Counter()
    for number, row in enumerate(rows, 1):
        item = base_item(row)
        code = item["company_code"]
        if not re.fullmatch(r"\d{7,12}", code):
            item.update({"status": "excluded", "reason": "invalid_company_code"})
        elif code in seen_codes:
            item.update({"status": "excluded", "reason": "duplicate_susr_company_code"})
        else:
            seen_codes.add(code)
            if row.get("veikiantis") != 1:
                item.update({"status": "excluded", "reason": "susr_not_active"})
            else:
                entity = entity_for_code(code)
                if not entity:
                    item.update({"status": "excluded", "reason": "no_exact_company_code_to_jar_entity"})
                if "status" not in item:
                    entity_id = entity["_id"]
                    status_id = (entity.get("statusas") or {}).get("_id")
                    item["jar_entity"] = {"id": entity_id, "company_code_field": "ja_kodas", "company_code_value": str(entity["ja_kodas"]), "status_id": status_id, "registration_date": entity.get("reg_data"), "deregistration_date": entity.get("isreg_data"), "current_registration_evidence": "isreg_data_is_null" if entity.get("isreg_data") is None else "isreg_data_is_published", "api_model_path": ENTITY_MODEL}
                    if not isinstance(status_id, str) or not status_id:
                        item.update({"status": "excluded", "reason": "jar_missing_status_evidence"})
                    elif entity.get("isreg_data") is not None:
                        item.update({"status": "excluded", "reason": "jar_deregistered"})
                    elif code in live_codes:
                        item.update({"status": "excluded", "reason": "already_catalogued_live_company_code"})
                    else:
                        pnl_rows = pnl_rows_for_entity(entity_id)
                        item["financial_history"] = make_history(entity_id, pnl_rows)
                        if not has_target_filing(pnl_rows):
                            item.update({"status": "excluded", "reason": "no_filed_pnl_ending_2023_2025"})
                        else:
                            item["status"] = "included"
                            item["reason"] = "meets_all_inclusion_rules"
                    # Address data is only read after the complete identity and financial
                    # selection path succeeds; no name/address joins are ever performed.
                    if item.get("status") == "included":
                        item["registered_address"] = registered_address(entity_id, entity)
                        item["candidate_slug"] = candidate_slug(item["legal_name"], code, live_slugs, reserved_slugs, collision_stats)
        if "financial_history" not in item:
            item["financial_history"] = []
        results.append(item)
        if number % 25 == 0:
            print("researched %d/%d" % (number, len(rows)), file=sys.stderr, flush=True)
    return results, collision_stats


def build_manifest(results, model_confirmation, raw_universe_size, live_count, live_codes, live_slugs, slug_collisions):
    reasons = Counter(item["reason"] for item in results)
    included = [item for item in results if item["status"] == "included"]
    histories = [entry for item in results for entry in item["financial_history"]]
    candidate_imports = [{"company_code": item["company_code"], "candidate_slug": item["candidate_slug"], "legal_name": item["legal_name"]} for item in included]
    raw_by_evrk = Counter(item["activity_evidence"]["evrk_2_code"] for item in results)
    return {
        "manifest_version": 1,
        "checked_date": CHECKED_DATE,
        "official_sources": {
            "susr_data_portal_url": SUSR_PORTAL_URL,
            "jar_data_portal_url": JAR_PORTAL_URL,
            "address_data_portal_url": ADDRESS_PORTAL_URL,
            "api_base": API_BASE,
            "model_confirmation": model_confirmation,
        },
        "live_catalogue_comparison": {"api": PB_API, "snapshot_only_no_live_request": True, "live_record_count": live_count, "identity_field": "company_code", "slug_field": "slug", "existing_company_codes": sorted(live_codes), "existing_slugs": sorted(live_slugs)},
        "selection_rule": "Included only when SŪSR veikiantis equals 1; a unique exact company code maps to a current JAR JuridinisAsmuo that publishes a statusas relation and has null isreg_data; its SŪSR principal-activity relation veikla resolves exactly to EVRK 2 code 31.01, 31.02, 31.03, or 31.09; a related filed PelnoAtaskaita has fiscal_period_end in 2023, 2024, or 2025; and its company code is absent from the cached contemporaneous live manufacturers catalogue. Names are never join keys.",
        "research_method": "The official :ns endpoints and unprojected samples confirm the models and fields before extraction. SŪSR is filtered with the documented Spinta relationship predicate veikla._id=\"UUID\" using official EVRK codifier IDs; veikla is retained as the principal-activity evidence, while the separately returned current evrk_2_1 context is not substituted for that qualifying relation. SŪSR kodas is matched exactly to numeric JAR ja_kodas and the resulting JAR _id is the sole join key to PelnoAtaskaita and Buveine. Current JAR evidence is recorded exactly as its opaque statusas relation ID plus null isreg_data; no status label is inferred. The latest dated Buveine is joined by JAR _id, then its official address ID is joined to Adresas. The published queried address fields contain no rendered street/locality, so city is explicitly recorded as unpublished and no address text is inferred; literal JAR rendered address text is retained when published. P&L history retains at most four newest fiscal periods having only the exact PARDAVIMO PAJAMOS and PELNAS (NUOSTOLIAI) PRIEŠ APMOKESTINIMĄ lines. Raw JSON responses are cached outside git; successful cache entries make interruption resumable. Uncached official-host calls are serially throttled to one every 0.4 seconds (2.5/s), with retry/backoff; opaque pagination is followed. The live catalogue comparison is read only from its existing cached snapshot and never requested by this extractor.",
        "counts": {
            "raw_universe_size": raw_universe_size,
            "records_manifested": len(results),
            "raw_universe_by_evrk_2_code": {code: raw_by_evrk[DISPLAY_CODES[code]] for code in TARGET_CODES},
            "selection_reason_counts": dict(sorted(reasons.items())),
            "excluded_invalid_company_code": reasons["invalid_company_code"],
            "excluded_duplicate_susr_company_code": reasons["duplicate_susr_company_code"],
            "excluded_susr_not_active": reasons["susr_not_active"],
            "excluded_no_exact_company_code_to_jar_entity": reasons["no_exact_company_code_to_jar_entity"],
            "excluded_jar_missing_status_evidence": reasons["jar_missing_status_evidence"],
            "excluded_jar_deregistered": reasons["jar_deregistered"],
            "already_catalogued_count": reasons["already_catalogued_live_company_code"],
            "excluded_no_filed_pnl_ending_2023_2025": reasons["no_filed_pnl_ending_2023_2025"],
            "candidate_count": len(included),
            "with_published_city": sum(bool((item.get("registered_address") or {}).get("published_city")) for item in included),
            "with_published_address": sum(bool((item.get("registered_address") or {}).get("published_address")) for item in included),
            "with_buveine_address_identity": sum("address_registry" in (item.get("registered_address") or {}) for item in included),
            "with_financial_history": sum(bool(item["financial_history"]) for item in included),
            "financial_history_entries": len(histories),
            "slug_collision_counts": {"base_slug_matched_live_slug": slug_collisions["base_slug_matched_live_slug"], "base_slug_matched_candidate_slug": slug_collisions["base_slug_matched_candidate_slug"], "deterministic_jar_suffix_used": slug_collisions["deterministic_jar_suffix_used"], "manufacturer_code_fallback_used": slug_collisions["manufacturer_code_fallback_used"], "unresolved_candidate_slug_collisions": 0},
        },
        "candidates_to_import": candidate_imports,
        "results": results,
    }


def validate(manifest):
    assert manifest["manifest_version"] == 1 and manifest["checked_date"] == CHECKED_DATE
    assert manifest["official_sources"]["api_base"] == API_BASE
    models = manifest["official_sources"]["model_confirmation"]["models"]
    assert models == [SUSR_MODEL, EVRK_MODEL, ENTITY_MODEL, BUVEINE_MODEL, ADDRESS_MODEL, PNL_MODEL]
    results, counts = manifest["results"], manifest["counts"]
    assert counts["raw_universe_size"] == len(results) == counts["records_manifested"]
    assert sum(item["status"] == "included" for item in results) == counts["candidate_count"]
    included_slugs = {item["candidate_slug"] for item in results if item["status"] == "included"}
    assert len(included_slugs) == counts["candidate_count"]
    reasons = Counter(item["reason"] for item in results)
    assert counts["selection_reason_counts"] == dict(sorted(reasons.items()))
    assert counts["raw_universe_by_evrk_2_code"] == {code: sum(item["activity_evidence"]["evrk_api_code"] == code for item in results) for code in TARGET_CODES}
    assert counts["already_catalogued_count"] == reasons["already_catalogued_live_company_code"]
    assert counts["excluded_susr_not_active"] == reasons["susr_not_active"]
    assert counts["excluded_no_filed_pnl_ending_2023_2025"] == reasons["no_filed_pnl_ending_2023_2025"]
    live = manifest["live_catalogue_comparison"]
    assert live["snapshot_only_no_live_request"] is True
    assert not ({item["company_code"] for item in results if item["status"] == "included"} & set(live["existing_company_codes"]))
    assert not (included_slugs & set(live["existing_slugs"]))
    candidates = manifest["candidates_to_import"]
    assert candidates == [{"company_code": item["company_code"], "candidate_slug": item["candidate_slug"], "legal_name": item["legal_name"]} for item in results if item["status"] == "included"]
    assert counts["slug_collision_counts"]["unresolved_candidate_slug_collisions"] == 0
    all_history = []
    for item in results:
        assert item["status"] in {"included", "excluded"}
        assert item["reason"]
        evidence = item["activity_evidence"]
        assert evidence["evrk_2_code"] in {"31.01", "31.02", "31.03", "31.09"}
        assert evidence["evrk_api_code"] in TARGET_CODES and isinstance(evidence["susr_record_id"], str)
        assert evidence["principal_activity_field"] == "veikla" and isinstance(evidence["principal_activity_relation_id"], str)
        assert isinstance(item["financial_history"], list) and len(item["financial_history"]) <= 4
        if item["status"] == "included":
            assert re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", item["candidate_slug"])
            assert re.fullmatch(r"\d{7,12}", item["company_code"])
            assert item["reason"] == "meets_all_inclusion_rules"
            assert item["susr_status_evidence"]["active_value"] == 1
            assert item["jar_entity"]["company_code_value"] == item["company_code"]
            assert item["jar_entity"]["deregistration_date"] is None
            assert item["jar_entity"]["current_registration_evidence"] == "isreg_data_is_null"
            assert isinstance(item["jar_entity"]["status_id"], str) and item["jar_entity"]["status_id"]
            address = item["registered_address"]
            assert "published_address" in address and "published_city" in address and "address_publication" in address
            assert address["published_city"] is None
        previous = None
        for entry in item["financial_history"]:
            assert valid_date(entry["fiscal_period_start"]) and valid_date(entry["fiscal_period_end"])
            assert entry["fiscal_period_start"] <= entry["fiscal_period_end"]
            assert valid_date(entry["filing_registration_date"])
            assert entry["source"]["api_model_path"] == PNL_MODEL
            assert "revenue_eur" in entry or "profit_before_tax_eur" in entry
            if "revenue_eur" in entry:
                assert numeric_value(entry["revenue_eur"]) and entry["revenue_evidence"]["line_name"] == REVENUE_LINE
            if "profit_before_tax_eur" in entry:
                assert numeric_value(entry["profit_before_tax_eur"]) and entry["profit_before_tax_evidence"]["line_name"] == PBT_LINE
            key = (entry["fiscal_period_end"], entry["filing_registration_date"], entry["fiscal_period_start"])
            assert previous is None or previous >= key
            previous = key
            all_history.append(entry)
    assert counts["financial_history_entries"] == len(all_history)
    included = [item for item in results if item["status"] == "included"]
    assert counts["with_financial_history"] == sum(bool(item["financial_history"]) for item in included)
    assert counts["with_published_city"] == sum(bool((item.get("registered_address") or {}).get("published_city")) for item in included)
    assert counts["with_published_address"] == sum(bool((item.get("registered_address") or {}).get("published_address")) for item in included)
    assert counts["with_buveine_address_identity"] == sum("address_registry" in (item.get("registered_address") or {}) for item in included)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--validate", action="store_true", help="validate the committed manifest without requests")
    args = parser.parse_args()
    if args.validate:
        manifest = json.loads(MANIFEST.read_text())
    else:
        confirmation = confirm_models_and_fields()
        live_codes, live_slugs, live_count = fetch_live_catalogue()
        definitions = activity_definitions()
        rows = susr_universe(definitions)
        results, slug_collisions = research(rows, live_codes, live_slugs)
        manifest = build_manifest(results, confirmation, len(rows), live_count, live_codes, live_slugs, slug_collisions)
        validate(manifest)
        MANIFEST.parent.mkdir(parents=True, exist_ok=True)
        MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    validate(manifest)
    print(json.dumps({"manifest": str(MANIFEST), **manifest["counts"]}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
