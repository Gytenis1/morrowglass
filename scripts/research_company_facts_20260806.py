#!/usr/bin/env python3
"""Audited public-company-facts research for the 2026-08-06 revenue gap.

The committed manifest is the migration input; HTTP bodies deliberately live in
/tmp so that a rerun is reproducible without committing third-party content.
Only a Rekvizitai company page whose visible registration code exactly matches
the PocketBase record's company_code is accepted as evidence.
"""
import argparse
import hashlib
import html
import json
import re
import sys
import time
import unicodedata
import urllib.parse
import urllib.request
from collections import Counter
from pathlib import Path

API = "https://sn-pb-repo-1293389879-dc1c2f.fly.dev/api/collections/manufacturers/records"
FILTER = "company_code != '' && revenue_eur_latest = 0"
CHECKED_DATE = "2026-08-06"
EXPECTED_TARGET_COUNT = 216
BASELINE_EMPTY_EMPLOYEE_BAND_COUNT = 254
BASELINE_ZERO_FOUNDED_YEAR_COUNT = 253
CACHE = Path("/tmp/morrowglass-company-facts-research-20260806")
MANIFEST = Path(__file__).resolve().parents[1] / "data/company_facts_20260806.json"
REKVIZITAI_HOST = "rekvizitai.vz.lt"
BAND_VOCABULARY = ("0", "1-9", "10-49", "50-249", "250+")
USER_AGENT = "Morrowglass public-data research/1.0 (+https://morrowglass.lt)"
LAST_REQUEST_BY_HOST = {}


def normalize_space(value):
    return re.sub(r"\s+", " ", html.unescape(value or "")).strip()


def visible_text(fragment):
    """Return text from markup after removing non-visible scripts/styles."""
    fragment = re.sub(r"<(script|style|noscript)\b[^>]*>.*?</\1\s*>", " ", fragment, flags=re.I | re.S)
    fragment = re.sub(r"<[^>]+>", " ", fragment)
    return normalize_space(fragment)


def visible_body_text(page):
    """Exclude document metadata and explicitly hidden body nodes."""
    body = re.search(r"<body\b[^>]*>(.*)</body\s*>", page, re.I | re.S)
    fragment = body.group(1) if body else page
    fragment = re.sub(r"<([a-z0-9]+)\b[^>]*\bhidden\b[^>]*>.*?</\1\s*>", " ", fragment, flags=re.I | re.S)
    return visible_text(fragment)


def is_rekvizitai_company_url(url):
    try:
        parsed = urllib.parse.urlparse(url)
    except (TypeError, ValueError):
        return False
    return (
        parsed.scheme in ("http", "https")
        and parsed.netloc.lower() == REKVIZITAI_HOST
        and bool(re.fullmatch(r"/(?:en/company|imone)/[a-z0-9_\-]+/?", parsed.path.lower()))
    )


def canonical_company_url(url):
    """Normalise a listed public company page without changing its route."""
    parsed = urllib.parse.urlparse(url)
    return urllib.parse.urlunparse(("https", REKVIZITAI_HOST, parsed.path.rstrip("/") + "/", "", "", ""))


def directory_stem(record):
    # This mirrors the previous contact-route checkpoint: legal name is used
    # first, trading name only when a legal name is absent. It creates one
    # deterministic candidate and never treats a name match as acceptance.
    name = record.get("legal_name") or record.get("trading_name") or ""
    name = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode().lower()
    name = re.sub(r"\b(?:uab|mb|ab|vsi|ii|tub|ivv)\b", " ", name)
    name = re.sub(
        r"\b(?:uzdaroji\s+akcine\s+bendrove|mazoji\s+bendrija|akcine\s+bendrove|individuali\s+imone|individual\s+activity)\b",
        " ",
        name,
    )
    return re.sub(r"[^a-z0-9]+", "_", name).strip("_")


def cache_paths(url):
    digest = hashlib.sha256(url.encode("utf-8")).hexdigest()
    return CACHE / (digest + ".html"), CACHE / (digest + ".json")


def fetch_rekvizitai(url):
    """Fetch/cache a raw response, spacing uncached same-host calls by >=1.5 s."""
    CACHE.mkdir(parents=True, exist_ok=True)
    html_path, meta_path = cache_paths(url)
    if html_path.exists() and meta_path.exists():
        return html_path.read_text(errors="replace"), json.loads(meta_path.read_text())

    host = urllib.parse.urlparse(url).netloc.lower()
    wait = 1.5 - (time.monotonic() - LAST_REQUEST_BY_HOST.get(host, 0.0))
    if wait > 0:
        time.sleep(wait)
    requested_at = time.monotonic()
    LAST_REQUEST_BY_HOST[host] = requested_at
    meta = {"requested_url": url, "fetched_at": CHECKED_DATE, "status": None, "effective_url": url}
    try:
        request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(request, timeout=8) as response:
            body = response.read().decode("utf-8", "replace")
            meta.update({"status": response.status, "effective_url": response.geturl()})
    except Exception as exc:  # cache failures too: retry only after cache removal
        body = "REQUEST_ERROR: " + repr(exc)
        meta["error"] = repr(exc)
    html_path.write_text(body)
    meta_path.write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n")
    return body, meta


def fetch_target_records():
    records = []
    page = 1
    while True:
        query = urllib.parse.urlencode({"filter": FILTER, "sort": "company_code,slug", "page": page, "perPage": 100})
        request = urllib.request.Request(API + "?" + query, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(request, timeout=30) as response:
            payload = json.loads(response.read().decode("utf-8"))
        records.extend(payload["items"])
        if page >= payload.get("totalPages", 1):
            break
        page += 1
    records.sort(key=lambda item: item["slug"])
    if len(records) != EXPECTED_TARGET_COUNT:
        raise RuntimeError("baseline drift: expected %d records, API returned %d" % (EXPECTED_TARGET_COUNT, len(records)))
    return records


def candidate_urls(record):
    candidates = []
    # Preserve the required precedence while de-duplicating only identical URLs.
    financial = record.get("financial_source_url")
    if isinstance(financial, str) and is_rekvizitai_company_url(financial):
        candidates.append(canonical_company_url(financial))
    for url in record.get("public_details_source_urls") or []:
        if isinstance(url, str) and is_rekvizitai_company_url(url):
            url = canonical_company_url(url)
            if url not in candidates:
                candidates.append(url)
    stem = directory_stem(record)
    if stem:
        url = "https://rekvizitai.vz.lt/en/company/%s/" % stem
        if url not in candidates:
            candidates.append(url)
    return candidates


def page_has_exact_code(page, company_code):
    # ccode is the visible value in the company details table. The fallback
    # deliberately requires a code-label neighbourhood, not an arbitrary
    # occurrence (which could be a related company or a script payload).
    code = re.escape(str(company_code))
    return bool(
        re.search(r'<span\s+id=["\']ccode["\'][^>]*>\s*' + code + r'\s*</span>', page, re.I)
        or re.search(r'(?:Registration code|Company code|Įmonės kodas)\s*</(?:td|div)>\s*<(?:td|div)[^>]*>\s*(?:<[^>]+>\s*)*' + code + r'\b', page, re.I | re.S)
    )


def labelled_value(page, label):
    """Read one visible table-style value immediately after a visible label."""
    pattern = (
        r'<td[^>]*class=["\'][^"\']*\bname\b[^"\']*["\'][^>]*>\s*'
        + re.escape(label)
        + r'\s*</td>\s*<td[^>]*class=["\'][^"\']*\bvalue\b[^"\']*["\'][^>]*>(.*?)</td>'
    )
    match = re.search(pattern, page, re.I | re.S)
    return visible_text(match.group(1)) if match else None


def info_value(page, label):
    pattern = (
        r'<div[^>]*class=["\'][^"\']*\bname\b[^"\']*["\'][^>]*>\s*'
        + re.escape(label)
        + r'\s*</div>\s*<div[^>]*class=["\'][^"\']*\bvalue\b[^"\']*["\'][^>]*>(.*?)</div>'
    )
    match = re.search(pattern, page, re.I | re.S)
    return visible_text(match.group(1)) if match else None


def employee_band(count):
    if count == 0:
        return "0"
    if 1 <= count <= 9:
        return "1-9"
    if 10 <= count <= 49:
        return "10-49"
    if 50 <= count <= 249:
        return "50-249"
    if count >= 250:
        return "250+"
    return None


def snippets(page):
    """Only direct, visible-profile markup needed to audit extracted facts."""
    patterns = {
        "registration_code": r'<span\s+id=["\']ccode["\'][^>]*>.*?</span>',
        "sales_revenue": r'<div[^>]*class=["\'][^"\']*\binfo-item\b[^"\']*["\'][^>]*>\s*<div[^>]*>\s*Sales revenue\s*</div>.*?</div>\s*</div>',
        "employees": r'<td[^>]*class=["\'][^"\']*\bname\b[^"\']*["\'][^>]*>\s*Employees\s*</td>\s*<td[^>]*class=["\'][^"\']*\bvalue\b[^"\']*["\'][^>]*>.*?</td>',
        "manager": r'<td[^>]*class=["\'][^"\']*\bname\b[^"\']*["\'][^>]*>\s*Manager\s*</td>\s*<td[^>]*class=["\'][^"\']*\bvalue\b[^"\']*["\'][^>]*>.*?</td>',
        "founded": r'<div[^>]*class=["\'][^"\']*\bdescription\b[^"\']*["\'][^>]*>.*?was founded in.*?</div>',
    }
    evidence = {}
    for key, pattern in patterns.items():
        match = re.search(pattern, page, re.I | re.S)
        if match:
            evidence[key] = match.group(0)[:1800]
    return evidence


def extract_facts(page):
    revenue_raw = info_value(page, "Sales revenue")
    revenue = year = None
    if revenue_raw:
        amount = re.search(r"([0-9][0-9\s\u00a0,.]*)\s*(?:€|&euro;|Eur)", revenue_raw, re.I)
        year_match = re.search(r"\((20\d{2})\s+year\)", revenue_raw, re.I)
        if amount and year_match:
            digits = re.sub(r"[^0-9]", "", amount.group(1))
            if digits:
                revenue, year = int(digits), int(year_match.group(1))

    employees_raw = labelled_value(page, "Employees")
    employee_count = None
    employee_reference_month = None
    if employees_raw:
        count_match = re.search(r"\b(\d+)\s+insured\s+individuals\b", employees_raw, re.I)
        if count_match:
            employee_count = int(count_match.group(1))
        month_match = re.search(r"\b(20\d{2}[-./](?:0[1-9]|1[0-2]))\b", employees_raw)
        if month_match:
            employee_reference_month = month_match.group(1)

    manager = labelled_value(page, "Manager")
    if manager:
        manager = re.sub(r"\s*More\s*›?\s*$", "", manager, flags=re.I).strip() or None

    # This wording appears in the visible public company description. Do not use
    # JSON-LD or metadata: those are not visible page facts.
    founded_year = None
    founded = re.search(r"\bwas founded in\s+(19\d{2}|20\d{2})(?:[-./]\d{2}[-./]\d{2})?\b", visible_body_text(page), re.I)
    if founded:
        founded_year = int(founded.group(1))

    # Rekvizitai's English public profile pages currently show category labels,
    # not EVRK codes/Lithuanian descriptions. Keep an explicitly empty array
    # unless an exact visible code + Lithuanian description is present.
    activities = []
    for code, description in re.findall(r"\b((?:EVRK|NACE)\s*[0-9]{2}(?:\.[0-9]{1,2})?)\s*[-:–]\s*([^<\n]{2,180})", page, re.I):
        description = visible_text(description)
        if re.search(r"[ąčęėįšųūž]", description, re.I):
            activities.append({"code": normalize_space(code), "description_lt": description})

    return {
        "revenue_eur_latest": revenue,
        "revenue_year": year,
        "revenue_availability": "paskelbta" if revenue is not None and year is not None else "nepaskelbta",
        "employee_count": employee_count,
        "employee_count_band": employee_band(employee_count) if employee_count is not None else None,
        "employee_reference_month": employee_reference_month,
        "founded_year": founded_year,
        "owner_manager_name": manager,
        "evrk_activities": activities,
    }


def usable_existing(record):
    return {
        "revenue_eur_latest": record.get("revenue_eur_latest") if isinstance(record.get("revenue_eur_latest"), (int, float)) and record.get("revenue_eur_latest") > 0 else None,
        "revenue_year": record.get("revenue_year") if isinstance(record.get("revenue_year"), int) and record.get("revenue_year") > 0 else None,
        "employee_count_band": record.get("employee_count_band") if record.get("employee_count_band") in BAND_VOCABULARY else None,
        "founded_year": record.get("founded_year") if isinstance(record.get("founded_year"), int) and record.get("founded_year") > 0 else None,
        "owner_manager_name": record.get("owner_manager_name") or None,
    }


def migration_values(existing, extracted):
    # A later migration can apply only these non-destructive values. Existing
    # values win when this public page supplied no value for that fact.
    return {
        "revenue_eur_latest": existing["revenue_eur_latest"] if existing["revenue_eur_latest"] is not None else extracted["revenue_eur_latest"],
        "revenue_year": existing["revenue_year"] if existing["revenue_year"] is not None else extracted["revenue_year"],
        "revenue_availability": extracted["revenue_availability"],
        "employee_count_band": existing["employee_count_band"] or extracted["employee_count_band"],
        "founded_year": existing["founded_year"] or extracted["founded_year"],
        "owner_manager_name": existing["owner_manager_name"] or extracted["owner_manager_name"],
        "evrk_activities": extracted["evrk_activities"],
    }


def prior_results():
    if not MANIFEST.exists():
        return {}
    try:
        results = json.loads(MANIFEST.read_text()).get("results", {})
        return results if isinstance(results, dict) else {}
    except (OSError, ValueError):
        return {}


def research(records):
    previous = prior_results()
    results = {}
    for number, record in enumerate(records, 1):
        slug = record["slug"]
        # Successful identity-backed work must not be weakened by a rerun. It
        # remains in the manifest while raw cache makes initial work resumable.
        old = previous.get(slug)
        if isinstance(old, dict) and old.get("facts_lookup_status") in ("found", "partial") and old.get("company_code") == record.get("company_code"):
            results[slug] = old
            continue

        checked_urls = candidate_urls(record)
        accepted_url = None
        accepted_page = None
        request_log = []
        for url in checked_urls:
            page, metadata = fetch_rekvizitai(url)
            exact = metadata.get("status") == 200 and page_has_exact_code(page, record["company_code"])
            request_log.append({
                "url": url,
                "effective_url": metadata.get("effective_url"),
                "http_status": metadata.get("status"),
                "exact_company_code_match": exact,
            })
            if exact:
                accepted_url, accepted_page = metadata.get("effective_url") or url, page
                break

        extracted = extract_facts(accepted_page) if accepted_page else {
            "revenue_eur_latest": None, "revenue_year": None, "revenue_availability": "nepaskelbta",
            "employee_count": None, "employee_count_band": None, "employee_reference_month": None,
            "founded_year": None, "owner_manager_name": None, "evrk_activities": [],
        }
        fact_count = sum(value is not None and value != [] for key, value in extracted.items() if key not in ("revenue_availability",))
        status = "found" if extracted["revenue_availability"] == "paskelbta" else ("partial" if accepted_page else "not_found")
        existing = usable_existing(record)
        results[slug] = {
            "slug": slug,
            "company_code": record["company_code"],
            "legal_name": record.get("legal_name") or "",
            "trading_name": record.get("trading_name") or "",
            "facts_checked_date": CHECKED_DATE,
            "facts_lookup_status": status,
            "accepted_source_url": accepted_url,
            "checked_candidate_urls": checked_urls,
            "candidate_checks": request_log,
            "existing_verified_values": existing,
            "extracted_facts": extracted,
            "migration_values": migration_values(existing, extracted),
            "evidence": snippets(accepted_page) if accepted_page else {},
        }
        if number % 10 == 0:
            print("researched %d/%d" % (number, len(records)), file=sys.stderr, flush=True)
    return results


def build_manifest(records, results):
    statuses = Counter(item["facts_lookup_status"] for item in results.values())
    exact_pages = sum(bool(item["accepted_source_url"]) for item in results.values())
    return {
        "manifest_version": 1,
        "baseline": {
            "filter": FILTER,
            "target_count": EXPECTED_TARGET_COUNT,
            "checked_date": CHECKED_DATE,
            "listing_gap_observations": {
                "employee_count_band_empty_count": BASELINE_EMPTY_EMPLOYEE_BAND_COUNT,
                "founded_year_zero_count": BASELINE_ZERO_FOUNDED_YEAR_COUNT,
            },
        },
        "research_method": (
            "The target list is paginated from the public manufacturers API. For each record, the existing Rekvizitai financial URL is checked first, then Rekvizitai public-details URLs, then one deterministic legal-name (or trading-name fallback) candidate. "
            "A page is accepted only where its visible registration code exactly equals company_code; names are never identity evidence. Cached raw HTML and request metadata are outside git at /tmp/morrowglass-company-facts-research-20260806. Uncached Rekvizitai requests are spaced at least 1.5 seconds per host. "
            "Only visibly published facts are extracted; sales revenue is published only with both numeric amount and fiscal year. No figures, dates, activity codes, or descriptions are inferred. Existing usable values are retained in migration_values when the page lacks a fact."
        ),
        "counts": {
            "target_records": len(results),
            "exact_code_matched_pages": exact_pages,
            "found": statuses["found"],
            "partial": statuses["partial"],
            "not_found": statuses["not_found"],
            "revenue_paskelbta": sum(item["extracted_facts"]["revenue_availability"] == "paskelbta" for item in results.values()),
            "employee_band_extracted": sum(item["extracted_facts"]["employee_count_band"] in BAND_VOCABULARY for item in results.values()),
            "founded_year_extracted": sum(item["extracted_facts"]["founded_year"] is not None for item in results.values()),
            "manager_extracted": sum(item["extracted_facts"]["owner_manager_name"] is not None for item in results.values()),
            "evrk_activities_extracted": sum(len(item["extracted_facts"]["evrk_activities"]) for item in results.values()),
        },
        "results": dict(sorted(results.items())),
    }


def validate(manifest):
    assert manifest["manifest_version"] == 1
    assert manifest["baseline"]["target_count"] == EXPECTED_TARGET_COUNT
    assert manifest["baseline"]["listing_gap_observations"] == {
        "employee_count_band_empty_count": BASELINE_EMPTY_EMPLOYEE_BAND_COUNT,
        "founded_year_zero_count": BASELINE_ZERO_FOUNDED_YEAR_COUNT,
    }
    results = manifest["results"]
    assert len(results) == EXPECTED_TARGET_COUNT
    assert manifest["counts"]["target_records"] == EXPECTED_TARGET_COUNT
    for slug, item in results.items():
        assert slug == item["slug"] and item["company_code"]
        assert item["facts_checked_date"] == CHECKED_DATE
        assert item["facts_lookup_status"] in ("found", "partial", "not_found")
        assert isinstance(item["checked_candidate_urls"], list)
        extracted = item["extracted_facts"]
        if extracted["revenue_availability"] == "paskelbta":
            assert isinstance(extracted["revenue_eur_latest"], int) and extracted["revenue_eur_latest"] >= 0
            assert isinstance(extracted["revenue_year"], int) and 1900 <= extracted["revenue_year"] <= 2100
        else:
            assert extracted["revenue_eur_latest"] is None and extracted["revenue_year"] is None
        assert extracted["employee_count_band"] in BAND_VOCABULARY or extracted["employee_count_band"] is None
        assert all(set(activity) == {"code", "description_lt"} and activity["description_lt"] for activity in extracted["evrk_activities"])
        if item["accepted_source_url"]:
            assert any(check["exact_company_code_match"] for check in item["candidate_checks"])
    assert manifest["counts"]["found"] + manifest["counts"]["partial"] + manifest["counts"]["not_found"] == EXPECTED_TARGET_COUNT


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--validate", action="store_true", help="validate the committed manifest without fetching")
    args = parser.parse_args()
    if args.validate:
        manifest = json.loads(MANIFEST.read_text())
    else:
        records = fetch_target_records()
        manifest = build_manifest(records, research(records))
        validate(manifest)
        MANIFEST.parent.mkdir(parents=True, exist_ok=True)
        MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    validate(manifest)
    print(json.dumps({"manifest": str(MANIFEST), **manifest["counts"]}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
