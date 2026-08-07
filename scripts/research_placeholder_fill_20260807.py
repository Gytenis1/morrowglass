#!/usr/bin/env python3
"""Create the bounded, source-audited placeholder-fill manifest.

Only URLs already stored on each live manufacturer record are considered. Raw
third-party responses are cached under /tmp and are never committed. A date is
accepted only from a JAR JuridinisAsmuo registration-date field or a visibly
published Rekvizitai company profile; a locality is accepted only from an
explicit address/locality field on one of those existing public URLs or an
exact GyvenamojiVietove record. Street text is never used to infer a locality.
"""
import argparse
import hashlib
import html
import json
import re
import time
import urllib.parse
import urllib.request
from collections import Counter
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "data/placeholder_fill_20260807.json"
CACHE = Path("/tmp/morrowglass-placeholder-fill-20260807")
API = "https://sn-pb-repo-1293389879-dc1c2f.fly.dev/api/collections/manufacturers/records"
CHECKED_DATE = "2026-08-07"
BASELINE = {"founded_year_zero_count": 96, "city_lietuva_count": 53}
USER_AGENT = "Morrowglass placeholder research/1.0 (+https://www.baldininkai.org)"
LAST_REQUEST = {}


def public_urls(record):
    """Return the recorded source URLs, in deterministic order, without guesses."""
    values = []
    for field in ("source_urls", "public_details_source_urls"):
        values.extend(record.get(field) or [])
    values.append(record.get("source_artifact_url"))
    output = []
    for value in values:
        if not isinstance(value, str) or value in output:
            continue
        try:
            parsed = urllib.parse.urlparse(value)
        except ValueError:
            continue
        if parsed.scheme == "https" and parsed.netloc in {"get.data.gov.lt", "data.gov.lt", "rekvizitai.vz.lt"}:
            output.append(value)
    return output


def cache_paths(url):
    digest = hashlib.sha256(url.encode("utf-8")).hexdigest()
    return CACHE / (digest + ".body"), CACHE / (digest + ".meta.json")


def fetch(url):
    """Cache successful public fetches; serially space uncached calls per host."""
    CACHE.mkdir(parents=True, exist_ok=True)
    body_path, meta_path = cache_paths(url)
    if body_path.exists() and meta_path.exists():
        return body_path.read_text(errors="replace"), json.loads(meta_path.read_text())
    host = urllib.parse.urlparse(url).netloc.lower()
    minimum = 1.5 if host == "rekvizitai.vz.lt" else 0.4
    wait = minimum - (time.monotonic() - LAST_REQUEST.get(host, 0.0))
    if wait > 0:
        time.sleep(wait)
    LAST_REQUEST[host] = time.monotonic()
    metadata = {"requested_url": url, "effective_url": url, "http_status": None, "checked_date": CHECKED_DATE}
    body = ""
    try:
        request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json,text/html;q=0.9"})
        with urllib.request.urlopen(request, timeout=45) as response:
            body = response.read().decode("utf-8", "replace")
            metadata.update({"effective_url": response.geturl(), "http_status": response.status})
    except Exception as exc:
        metadata["error"] = repr(exc)
    body_path.write_text(body)
    meta_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n")
    return body, metadata


def fetch_records(filter_value):
    records, page = [], 1
    while True:
        query = urllib.parse.urlencode({"filter": filter_value, "sort": "slug", "page": page, "perPage": 100,
            "fields": "slug,trading_name,legal_name,company_code,founded_year,city,source_urls,public_details_source_urls,source_artifact_url"})
        request = urllib.request.Request(API + "?" + query, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
        with urllib.request.urlopen(request, timeout=45) as response:
            payload = json.loads(response.read().decode("utf-8"))
        records.extend(payload["items"])
        if page >= payload["totalPages"]:
            break
        page += 1
    return records


def plain_text(value):
    value = re.sub(r"<(script|style|noscript)\b[^>]*>.*?</\1\s*>", " ", value, flags=re.I | re.S)
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", value))).strip()


def json_rows(body):
    try:
        parsed = json.loads(body)
    except ValueError:
        return []
    if isinstance(parsed, dict):
        rows = parsed.get("_data", parsed.get("data", []))
        return rows if isinstance(rows, list) else [parsed]
    return []


def registration_year_from_jar(body):
    """Accept only explicitly named registration-date fields on JAR records."""
    for row in json_rows(body):
        if not isinstance(row, dict):
            continue
        for key, value in row.items():
            normalized = key.lower().replace("_", "")
            if normalized not in {"iregistravimodata", "registravimodata", "registracijosdata"}:
                continue
            match = re.match(r"\s*((?:19|20)\d{2})[-./]", str(value))
            if match:
                year = int(match.group(1))
                if 1900 <= year <= date.today().year:
                    return year
    return None


def locality_from_official_url(url, body):
    if "/GyvenamojiVietove/" not in urllib.parse.urlparse(url).path:
        return None
    for row in json_rows(body):
        value = row.get("pavadinimas") if isinstance(row, dict) else None
        if isinstance(value, str) and value.strip() and value.strip().casefold() not in {"lietuva", "lithuania"}:
            return value.strip()
    return None


def rekvizitai_founded_year(body):
    text = plain_text(body)
    match = re.search(r"\b(?:was founded in|įregistruota|įkurta)\s+((?:19|20)\d{2})(?:[-./]\d{2}[-./]\d{2})?\b", text, re.I)
    if match:
        year = int(match.group(1))
        if 1900 <= year <= date.today().year:
            return year
    return None


def rekvizitai_locality(body):
    """Read only an explicit visible address field, never a street-name deduction."""
    text = plain_text(body)
    # Public English profiles label the full registered address. A Lithuanian
    # postcode plus the comma-separated locality is a published address value.
    match = re.search(r"(?:Address|Registered address|Adresas)\s*[:\-]?\s*([^|]{3,260}?)(?=(?:Phone|Email|Website|Manager|Employees|Company code|$))", text, re.I)
    if not match:
        return None
    address = match.group(1)
    match = re.search(r"\bLT[- ]?\d{5}\s*,?\s*([A-Za-zĄČĘĖĮŠŲŪŽąčęėįšųūž][A-Za-zĄČĘĖĮŠŲŪŽąčęėįšųūž '\\.-]{1,80})", address)
    if match:
        value = match.group(1).strip(" ,.")
        forbidden = {"lietuva", "lithuania", "registration code", "company code", "employees", "manager", "website"}
        normalized = value.casefold()
        if normalized not in forbidden and not any(label in normalized for label in {"registration code", "company code", "employees", "manager", "website"}):
            return value
    return None


def is_jar_record(url):
    path = urllib.parse.urlparse(url).path
    return "/datasets/gov/rc/jar/" in path and "/JuridinisAsmuo/" in path and bool(re.search(r"/[0-9a-f-]{36}$", path, re.I))


def is_rekvizitai_company(url):
    parsed = urllib.parse.urlparse(url)
    return parsed.netloc == "rekvizitai.vz.lt" and bool(re.fullmatch(r"/(?:en/company|imone)/[a-z0-9_-]+/?", parsed.path, re.I))


def result_for(record, year_target, city_target):
    checked = []
    year_fill = None
    city_fill = None
    for url in public_urls(record):
        allowed = is_jar_record(url) or is_rekvizitai_company(url) or "/GyvenamojiVietove/" in urllib.parse.urlparse(url).path
        if not allowed:
            checked.append({"url": url, "checked_date": CHECKED_DATE, "outcome": "not_an_allowed_fact_source"})
            continue
        body, meta = fetch(url)
        check = {"url": url, "effective_url": meta.get("effective_url"), "checked_date": CHECKED_DATE, "http_status": meta.get("http_status"), "outcome": "checked"}
        if is_jar_record(url):
            value = registration_year_from_jar(body)
            if value is not None and year_fill is None:
                year_fill = {"value": value, "source_url": url, "checked_date": CHECKED_DATE, "source_kind": "JAR JuridinisAsmuo actual registration date"}
                check["published_registration_year"] = value
        elif "/GyvenamojiVietove/" in urllib.parse.urlparse(url).path:
            value = locality_from_official_url(url, body)
            if value and city_fill is None:
                city_fill = {"value": value, "source_url": url, "checked_date": CHECKED_DATE, "source_kind": "Address Register GyvenamojiVietove.pavadinimas"}
                check["published_locality"] = value
        elif is_rekvizitai_company(url):
            value = rekvizitai_founded_year(body)
            if value is not None and year_fill is None:
                year_fill = {"value": value, "source_url": url, "checked_date": CHECKED_DATE, "source_kind": "visible Rekvizitai company profile"}
                check["published_founded_year"] = value
            value = rekvizitai_locality(body)
            if value and city_fill is None:
                city_fill = {"value": value, "source_url": url, "checked_date": CHECKED_DATE, "source_kind": "visible Rekvizitai registered-address locality"}
                check["published_locality"] = value
        checked.append(check)
    def outcome(target, fill):
        if not target:
            return {"targeted": False, "outcome": "not_targeted", "proposed_fill": None}
        return {"targeted": True, "outcome": "accepted" if fill else "not_found_unfilled", "proposed_fill": fill}
    return {
        "slug": record["slug"], "name": record.get("trading_name") or record.get("legal_name") or "", "company_code": record.get("company_code") or "",
        "original": {"founded_year": record.get("founded_year"), "city": record.get("city")},
        "checked_source_urls": checked,
        "founded_year": outcome(year_target, year_fill),
        "city": outcome(city_target, city_fill),
    }


def build_manifest(years, cities):
    year_slugs, city_slugs = {r["slug"] for r in years}, {r["slug"] for r in cities}
    if len(years) != BASELINE["founded_year_zero_count"] or len(cities) != BASELINE["city_lietuva_count"]:
        raise RuntimeError("live placeholder baseline drifted; do not create a partial manifest")
    combined = {r["slug"]: r for r in years + cities}
    results = {slug: result_for(combined[slug], slug in year_slugs, slug in city_slugs) for slug in sorted(combined)}
    counts = {
        "targeted_unique_slugs": len(results), "founded_year_targeted": len(year_slugs), "city_targeted": len(city_slugs),
        "founded_year_filled": sum(r["founded_year"]["outcome"] == "accepted" for r in results.values()),
        "founded_year_unfilled": sum(r["founded_year"]["outcome"] == "not_found_unfilled" for r in results.values()),
        "city_filled": sum(r["city"]["outcome"] == "accepted" for r in results.values()),
        "city_unfilled": sum(r["city"]["outcome"] == "not_found_unfilled" for r in results.values()),
    }
    return {"manifest_version": 1, "checked_date": CHECKED_DATE, "baseline": {**BASELINE, "source": "LIVE PocketBase manufacturers collection", "target_filters": ["founded_year=0", "city='Lietuva'"]},
        "research_method": "The live target cohorts are fetched from the public manufacturers API. For each record, only its already-stored source_urls, public_details_source_urls, and source_artifact_url values are checked. Raw HTTP responses are cached outside git under /tmp with polite per-host spacing. Years are accepted only from an actual JAR JuridinisAsmuo registration date or a visible existing Rekvizitai profile; localities only from a direct Address Register GyvenamojiVietove.pavadinimas record or a visible existing Rekvizitai registered-address value. Financial filing dates and street-name inferences are explicitly excluded. Every target has an accepted source-backed fill or an explicit not_found_unfilled result.",
        "counts": counts, "results": results}


def validate(manifest):
    assert manifest["manifest_version"] == 1 and manifest["checked_date"] == CHECKED_DATE
    assert manifest["baseline"]["founded_year_zero_count"] == 96 and manifest["baseline"]["city_lietuva_count"] == 53
    results = manifest["results"]
    assert len(results) == manifest["counts"]["targeted_unique_slugs"]
    for slug, item in results.items():
        # Some legacy candidates have no permitted existing public fact URL; their
        # explicit empty check list is the auditable not_found_unfilled outcome.
        assert slug == item["slug"]
        for field in ("founded_year", "city"):
            outcome = item[field]
            assert outcome["outcome"] in {"accepted", "not_found_unfilled", "not_targeted"}
            fill = outcome["proposed_fill"]
            if outcome["outcome"] == "accepted":
                assert fill and fill["source_url"] and fill["checked_date"] == CHECKED_DATE
                if field == "founded_year": assert isinstance(fill["value"], int) and 1900 <= fill["value"] <= date.today().year
                else: assert isinstance(fill["value"], str) and fill["value"].strip() and fill["value"].casefold() not in {"lietuva", "lithuania"}
            else: assert fill is None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--validate", action="store_true")
    args = parser.parse_args()
    if args.validate:
        manifest = json.loads(MANIFEST.read_text())
    else:
        manifest = build_manifest(fetch_records("founded_year=0"), fetch_records("city='Lietuva'"))
        validate(manifest)
        MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    validate(manifest)
    print(json.dumps(manifest["counts"], ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
