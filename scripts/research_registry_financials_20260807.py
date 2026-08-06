#!/usr/bin/env python3
"""Research filed P&L history from Lithuania's official Register of Legal Entities API.

The committed manifest contains only resolved, identity-backed facts and evidence.
Raw API responses live under /tmp, so interrupted extraction resumes without another
request. A company is joined only as company_code -> JAR ja_kodas -> JAR _id ->
PelnoAtaskaita juridinis_asmuo._id; legal names are never used for a join.
"""
import argparse
import hashlib
import json
import sys
import time
import urllib.error
import urllib.request
from collections import Counter
from pathlib import Path

PB_API = "https://sn-pb-repo-1293389879-dc1c2f.fly.dev/api/collections/manufacturers/records"
PB_FILTER = "company_code != ''"
CHECKED_DATE = "2026-08-07"
EXPECTED_TARGET_COUNT = 386
API_BASE = "https://get.data.gov.lt"
ENTITY_NAMESPACE = "datasets/gov/rc/jar/iregistruoti"
ENTITY_MODEL = ENTITY_NAMESPACE + "/JuridinisAsmuo"
PNL_NAMESPACE = "datasets/gov/rc/jar/pelno_ataskaitos"
PNL_MODEL = PNL_NAMESPACE + "/PelnoAtaskaita"
DATA_PORTAL_CITATION = "https://data.gov.lt/datasets/1484/"
CACHE = Path("/tmp/morrowglass-registry-financials-20260807")
MANIFEST = Path(__file__).resolve().parents[1] / "data/registry_financials_20260807.json"
USER_AGENT = "Morrowglass official-register financial research/1.0 (+https://morrowglass.lt)"
MIN_HOST_INTERVAL_SECONDS = 0.8
LAST_REQUEST_BY_HOST = {}

# These are the exact filed P&L labels accepted for the two named measures. Do not
# use gross profit, net profit, operating profit, or other similarly named lines.
REVENUE_LINE = "PARDAVIMO PAJAMOS"
PBT_LINE = "PELNAS (NUOSTOLIAI) PRIEŠ APMOKESTINIMĄ"


def cache_paths(url):
    digest = hashlib.sha256(url.encode("utf-8")).hexdigest()
    return CACHE / (digest + ".json"), CACHE / (digest + ".meta.json")


def fetch_json(url):
    """Fetch a JSON response once, cache both successes and failures, and rate-limit."""
    CACHE.mkdir(parents=True, exist_ok=True)
    body_path, meta_path = cache_paths(url)
    if body_path.exists() and meta_path.exists():
        metadata = json.loads(meta_path.read_text())
        if metadata.get("status") == 200:
            return json.loads(body_path.read_text()), metadata
        # Transient 429/5xx responses are diagnostic cache entries, not permanent
        # negative facts. A later resumable run retries them.
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
                body = response.read().decode("utf-8")
                metadata.update({"status": response.status, "effective_url": response.geturl()})
                payload = json.loads(body)
            body_path.write_text(json.dumps(payload, ensure_ascii=False) + "\n")
            meta_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n")
            return payload, metadata
        except Exception as exc:
            last_error = exc
            if attempt < 4:
                time.sleep(min(30, 2 ** attempt))
    metadata["error"] = repr(last_error)
    body_path.write_text(json.dumps({"error": repr(last_error)}, ensure_ascii=False) + "\n")
    meta_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n")
    raise RuntimeError("official API request failed after retries for %s: %r" % (url, last_error))


def api_url(path, query=""):
    return API_BASE + "/" + path + "/" + ("?" + query if query else "")


def fetch_targets():
    records = []
    page = 1
    while True:
        url = PB_API + "?" + urllib.parse.urlencode({"filter": PB_FILTER, "sort": "company_code,slug", "page": page, "perPage": 100})
        request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
        with urllib.request.urlopen(request, timeout=60) as response:
            payload = json.loads(response.read().decode("utf-8"))
        records.extend(payload["items"])
        if page >= payload.get("totalPages", 1):
            break
        page += 1
    records.sort(key=lambda item: item["slug"])
    if len(records) != EXPECTED_TARGET_COUNT:
        raise RuntimeError("baseline drift: expected %d company-code manufacturers, got %d" % (EXPECTED_TARGET_COUNT, len(records)))
    return records


def confirm_models_and_fields():
    """Confirm namespace model names first, then fields from unprojected model records."""
    entity_ns, _ = fetch_json(api_url(ENTITY_NAMESPACE + "/:ns"))
    pnl_ns, _ = fetch_json(api_url(PNL_NAMESPACE + "/:ns"))
    entity_names = {item.get("name") for item in entity_ns.get("_data", [])}
    pnl_names = {item.get("name") for item in pnl_ns.get("_data", [])}
    if ENTITY_MODEL not in entity_names or PNL_MODEL not in pnl_names:
        raise RuntimeError("official :ns model confirmation failed")

    entity_sample, _ = fetch_json(api_url(ENTITY_MODEL, "limit(1)"))
    pnl_sample, _ = fetch_json(api_url(PNL_MODEL, "limit(1)"))
    if not entity_sample.get("_data") or not pnl_sample.get("_data"):
        raise RuntimeError("official API returned no sample data")
    entity_fields = set(entity_sample["_data"][0])
    pnl_fields = set(pnl_sample["_data"][0])
    required_entity = {"_id", "ja_kodas"}
    required_pnl = {"_id", "juridinis_asmuo", "line_name", "reiksme", "laikotarpis_nuo", "laikotarpis_iki", "reg_date", "template_name", "standard_name"}
    if not required_entity <= entity_fields or not required_pnl <= pnl_fields:
        raise RuntimeError("official model sample lacks required fields")
    relationship = pnl_sample["_data"][0].get("juridinis_asmuo")
    if not isinstance(relationship, dict) or "_id" not in relationship:
        raise RuntimeError("official P&L relationship is not juridinis_asmuo._id")
    return {
        "entity_namespace": ENTITY_NAMESPACE + "/:ns",
        "pnl_namespace": PNL_NAMESPACE + "/:ns",
        "entity_model": ENTITY_MODEL,
        "pnl_model": PNL_MODEL,
        "entity_fields_confirmed": sorted(required_entity),
        "pnl_fields_confirmed": sorted(required_pnl),
    }


def entity_for_code(company_code):
    # ja_kodas is numeric in the source. Strip leading zeroes only to make a
    # syntactically valid numeric lookup; acceptance below still compares the
    # original company_code exactly, so formatting differences never join.
    lookup_code = str(int(str(company_code)))
    payload, _ = fetch_json(api_url(ENTITY_MODEL, "ja_kodas=%s&limit(2)" % lookup_code))
    rows = payload.get("_data", [])
    exact = [row for row in rows if str(row.get("ja_kodas")) == str(company_code) and isinstance(row.get("_id"), str)]
    if len(rows) != 1 or len(exact) != 1:
        return None
    return exact[0]


def pnl_rows_for_entity(entity_id):
    # This source has a local relationship index. Read each joined entity in a
    # bounded page (then follow its opaque paging token if unusually large).
    query = 'juridinis_asmuo._id="%s"&limit(1000)' % entity_id
    rows = []
    while True:
        payload, _ = fetch_json(api_url(PNL_MODEL, query))
        page_rows = payload.get("_data", [])
        rows.extend(page_rows)
        next_token = (payload.get("_page") or {}).get("next")
        if not next_token:
            break
        query += '&page("%s")' % next_token
    # The relation constraint in both query and result is mandatory evidence.
    if any((row.get("juridinis_asmuo") or {}).get("_id") != entity_id for row in rows):
        raise RuntimeError("P&L response escaped requested JAR entity %s" % entity_id)
    return rows


def valid_date(value):
    return isinstance(value, str) and len(value) == 10 and value[4] == "-" and value[7] == "-"


def numeric_value(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def preferred_line(rows):
    """Use latest filing for the exact line; deterministic ID resolves exact ties."""
    usable = [row for row in rows if numeric_value(row.get("reiksme")) and valid_date(row.get("reg_date"))]
    if not usable:
        return None
    return sorted(usable, key=lambda row: (row["reg_date"], row.get("_id", "")), reverse=True)[0]


def make_history(entity_id, rows):
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
        filing_dates = [row["reg_date"] for row in period_rows if valid_date(row.get("reg_date"))]
        if not filing_dates:
            continue
        selected = [row for row in (revenue, pbt) if row]
        template_names = sorted({row.get("template_name") for row in selected if isinstance(row.get("template_name"), str) and row["template_name"]})
        standard_names = sorted({row.get("standard_name") for row in selected if isinstance(row.get("standard_name"), str) and row["standard_name"]})
        entry = {
            "fiscal_period_start": start,
            "fiscal_period_end": end,
            "filing_registration_date": max(filing_dates),
            "source": {
                "data_portal_url": DATA_PORTAL_CITATION,
                "api_model_path": PNL_MODEL,
                "jar_entity_id": entity_id,
            },
        }
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
    # A later registration date breaks fiscal-end ties without inferring chronology.
    history.sort(key=lambda entry: (entry["fiscal_period_end"], entry["filing_registration_date"], entry["fiscal_period_start"]), reverse=True)
    return history[:4]


def prior_results():
    if not MANIFEST.exists():
        return {}
    try:
        results = json.loads(MANIFEST.read_text()).get("results", {})
        return results if isinstance(results, dict) else {}
    except (OSError, ValueError):
        return {}


def research(records):
    old_results = prior_results()
    results = {}
    for number, record in enumerate(records, 1):
        slug, company_code = record["slug"], str(record["company_code"])
        old = old_results.get(slug)
        if isinstance(old, dict) and old.get("company_code") == company_code and old.get("registry_checked_date") == CHECKED_DATE:
            results[slug] = old
            continue
        entity = entity_for_code(company_code)
        if not entity:
            results[slug] = {
                "slug": slug, "legal_name": record.get("legal_name") or "", "company_code": company_code,
                "registry_checked_date": CHECKED_DATE, "join_status": "no_exact_jar_entity", "financial_history": [],
            }
        else:
            entity_id = entity["_id"]
            history = make_history(entity_id, pnl_rows_for_entity(entity_id))
            results[slug] = {
                "slug": slug,
                "legal_name": record.get("legal_name") or "",
                "company_code": company_code,
                "registry_checked_date": CHECKED_DATE,
                "join_status": "exact_company_code_to_jar_id",
                "jar_entity": {"id": entity_id, "company_code_field": "ja_kodas", "company_code_value": str(entity["ja_kodas"])},
                "financial_history": history,
                "source_citations": {"data_portal_url": DATA_PORTAL_CITATION, "api_model_path": PNL_MODEL},
            }
        if number % 10 == 0:
            print("researched %d/%d" % (number, len(records)), file=sys.stderr, flush=True)
    return results


def build_manifest(results, model_confirmation):
    counts = Counter()
    histories = [item["financial_history"] for item in results.values()]
    for item in results.values():
        counts[item["join_status"]] += 1
    return {
        "manifest_version": 1,
        "baseline": {"filter": PB_FILTER, "target_count": EXPECTED_TARGET_COUNT, "checked_date": CHECKED_DATE},
        "official_source": {"data_portal_url": DATA_PORTAL_CITATION, "api_base": API_BASE, "model_confirmation": model_confirmation},
        "research_method": (
            "Before extraction, the official :ns endpoints confirmed both model names and unprojected model samples confirmed the required fields. "
            "Each manufacturer is mapped strictly by company_code to JuridinisAsmuo.ja_kodas, then by that exact JAR record _id to PelnoAtaskaita.juridinis_asmuo._id. "
            "No legal-name join is performed. API responses are cached outside git at /tmp/morrowglass-registry-financials-20260807, uncached calls are rate-limited per host, and P&L pages use the relationship index plus opaque API pagination. "
            "At most four newest filed fiscal periods are retained. Revenue is retained only for the exact PARDAVIMO PAJAMOS line; profit before tax is retained only for the exact PELNAS (NUOSTOLIAI) PRIEŠ APMOKESTINIMĄ line."
        ),
        "counts": {
            "target_records": len(results),
            "exact_company_code_to_jar_id": counts["exact_company_code_to_jar_id"],
            "no_exact_jar_entity": counts["no_exact_jar_entity"],
            "with_financial_history": sum(bool(history) for history in histories),
            "with_two_or_more_periods": sum(len(history) >= 2 for history in histories),
            "history_entries": sum(len(history) for history in histories),
            "entries_with_revenue": sum("revenue_eur" in entry for history in histories for entry in history),
            "entries_with_profit_before_tax": sum("profit_before_tax_eur" in entry for history in histories for entry in history),
        },
        "results": dict(sorted(results.items())),
    }


def validate(manifest):
    assert manifest["manifest_version"] == 1
    assert manifest["baseline"] == {"filter": PB_FILTER, "target_count": EXPECTED_TARGET_COUNT, "checked_date": CHECKED_DATE}
    assert manifest["official_source"]["data_portal_url"] == DATA_PORTAL_CITATION
    confirm = manifest["official_source"]["model_confirmation"]
    assert confirm["entity_model"] == ENTITY_MODEL and confirm["pnl_model"] == PNL_MODEL
    assert len(manifest["results"]) == EXPECTED_TARGET_COUNT
    assert manifest["counts"]["target_records"] == EXPECTED_TARGET_COUNT
    entries = []
    for slug, item in manifest["results"].items():
        assert slug == item["slug"] and item["company_code"] and item["registry_checked_date"] == CHECKED_DATE
        assert item["join_status"] in ("exact_company_code_to_jar_id", "no_exact_jar_entity")
        history = item["financial_history"]
        assert isinstance(history, list) and len(history) <= 4
        if item["join_status"] == "exact_company_code_to_jar_id":
            assert item["jar_entity"]["company_code_value"] == item["company_code"]
            assert item["source_citations"] == {"data_portal_url": DATA_PORTAL_CITATION, "api_model_path": PNL_MODEL}
        else:
            assert not history
        prior_key = None
        for entry in history:
            assert valid_date(entry["fiscal_period_start"]) and valid_date(entry["fiscal_period_end"])
            assert entry["fiscal_period_start"] <= entry["fiscal_period_end"] and valid_date(entry["filing_registration_date"])
            assert entry["source"]["data_portal_url"] == DATA_PORTAL_CITATION and entry["source"]["api_model_path"] == PNL_MODEL
            assert entry["source"]["jar_entity_id"] == item["jar_entity"]["id"]
            if "revenue_eur" in entry:
                assert numeric_value(entry["revenue_eur"]) and entry["revenue_evidence"]["line_name"] == REVENUE_LINE
            else:
                assert "revenue_evidence" not in entry
            if "profit_before_tax_eur" in entry:
                assert numeric_value(entry["profit_before_tax_eur"]) and entry["profit_before_tax_evidence"]["line_name"] == PBT_LINE
            else:
                assert "profit_before_tax_evidence" not in entry
            key = (entry["fiscal_period_end"], entry["filing_registration_date"], entry["fiscal_period_start"])
            assert prior_key is None or prior_key >= key
            prior_key = key
            entries.append(entry)
    counts = manifest["counts"]
    assert counts["exact_company_code_to_jar_id"] + counts["no_exact_jar_entity"] == EXPECTED_TARGET_COUNT
    assert counts["history_entries"] == len(entries)
    assert counts["with_financial_history"] == sum(bool(item["financial_history"]) for item in manifest["results"].values())
    assert counts["with_two_or_more_periods"] == sum(len(item["financial_history"]) >= 2 for item in manifest["results"].values())
    assert counts["entries_with_revenue"] == sum("revenue_eur" in entry for entry in entries)
    assert counts["entries_with_profit_before_tax"] == sum("profit_before_tax_eur" in entry for entry in entries)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--validate", action="store_true", help="validate committed manifest without requests")
    args = parser.parse_args()
    if args.validate:
        manifest = json.loads(MANIFEST.read_text())
    else:
        records = fetch_targets()
        manifest = build_manifest(research(records), confirm_models_and_fields())
        validate(manifest)
        MANIFEST.parent.mkdir(parents=True, exist_ok=True)
        MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    validate(manifest)
    print(json.dumps({"manifest": str(MANIFEST), **manifest["counts"]}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
