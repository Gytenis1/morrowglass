#!/usr/bin/env python3
"""Create the immutable 2026-08-07 SŪSR activity category checkpoint.

The resolver reads only fields already stored in the public manufacturers API.
It neither requests SŪSR records nor uses a company name as an input. Successful
page responses are cached outside the repository, so an interrupted download can
resume without repeating completed public-API requests.
"""
import argparse
import hashlib
import json
import re
import time
import urllib.parse
import urllib.request
from collections import Counter
from pathlib import Path

CHECKED_DATE = "2026-08-07"
API = "https://sn-pb-repo-1293389879-dc1c2f.fly.dev/api/collections/manufacturers/records"
ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "data/category_evrk_20260807.json"
CACHE = Path("/tmp/morrowglass-category-evrk-20260807")
FALLBACK_CODES = ["O"]
FALLBACK_LABELS = ["Kiti nestandartiniai baldai"]
SLUG = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
SUSR_URL = re.compile(
    r"https://get\.data\.gov\.lt/datasets/gov/lsd/cl/ja_asmenys/JuridinisAsmuo/"
    r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"
)
# These are the literal activity wordings stored by the registry-universe import,
# not normalized translations or category labels.
ACTIVITIES = {
    "31.01": {
        "wording": "Įstaigos ir prekybos įmonių (parduotuvių) baldų gamyba",
        "target_codes": ["OC", "HR"],
        "target_labels": ["Biuro ir komerciniai baldai", "HoReCa ir prekybos baldai"],
    },
    "31.02": {
        "wording": "Virtuvės baldų gamyba",
        "target_codes": ["K"],
        "target_labels": ["Virtuvės baldai"],
    },
    "31.03": {
        "wording": "Čiužinių gamyba",
        "target_codes": ["BB"],
        "target_labels": ["Miegamojo ir vonios baldai"],
    },
}
MAX_PAGES = 100
PAGE_SIZE = 200
USER_AGENT = "Morrowglass stored-SUSR-category research/1.0"


def cache_path(url):
    return CACHE / (hashlib.sha256(url.encode("utf-8")).hexdigest() + ".json")


def fetch_json(url):
    """Fetch one public-API page, retaining successful results outside git."""
    CACHE.mkdir(parents=True, exist_ok=True)
    path = cache_path(url)
    if path.exists():
        return json.loads(path.read_text())
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    last_error = None
    for attempt in range(4):
        try:
            with urllib.request.urlopen(request, timeout=45) as response:
                if response.status != 200:
                    raise RuntimeError("unexpected HTTP status %s" % response.status)
                payload = json.loads(response.read().decode("utf-8"))
            path.write_text(json.dumps(payload, ensure_ascii=False) + "\n")
            return payload
        except Exception as exc:  # cache no failures: a resumed run may recover.
            last_error = exc
            if attempt < 3:
                time.sleep(2 ** attempt)
    raise RuntimeError("public API request failed after retries for %s: %r" % (url, last_error))


def live_records():
    """Read every page of the current generic fallback cohort, with a hard bound."""
    records = []
    total_pages = None
    for page in range(1, MAX_PAGES + 1):
        query = urllib.parse.urlencode({
            "page": page,
            "perPage": PAGE_SIZE,
            "sort": "slug",
            "filter": "category_labels~'Kiti nestandartiniai baldai'",
            "fields": "slug,category_codes,category_labels,description_lt,scope_evidence,source_urls,public_details_source_urls",
        })
        payload = fetch_json(API + "?" + query)
        if not isinstance(payload.get("items"), list) or not isinstance(payload.get("totalPages"), int):
            raise RuntimeError("public API returned an invalid paginated response")
        if total_pages is None:
            total_pages = payload["totalPages"]
            if total_pages < 1 or total_pages > MAX_PAGES:
                raise RuntimeError("public API page count is outside the bounded resolver limit")
        elif payload["totalPages"] != total_pages:
            raise RuntimeError("public API pagination changed during checkpoint extraction")
        records.extend(payload["items"])
        if page == total_pages:
            if len(records) != payload.get("totalItems"):
                raise RuntimeError("public API pagination did not return every generic fallback record")
            return records
    raise RuntimeError("public API exceeded the bounded resolver page limit")


def official_url(value):
    """Accept exactly one direct official SŪSR record URL from stored evidence."""
    urls = SUSR_URL.findall(value or "")
    if len(set(urls)) != 1:
        raise ValueError("missing or ambiguous official SŪSR record URL")
    return urls[0]


def stored_activity(record):
    """Parse only an exact literal code/wording pair present in stored text."""
    description = record.get("description_lt")
    scope = record.get("scope_evidence")
    if not isinstance(description, str) or not isinstance(scope, str):
        raise ValueError("description_lt and scope_evidence must be stored text")
    combined = description + "\n" + scope
    found = []
    for code, activity in ACTIVITIES.items():
        phrase = code + " – " + activity["wording"]
        if phrase in combined:
            found.append((code, activity))
    if len(found) != 1:
        raise ValueError("expected exactly one approved stored SŪSR activity pair")
    code, activity = found[0]
    # The source evidence must be an explicit SŪSR primary-activity statement,
    # never an incidental code occurring in other narrative text.
    phrase = code + " – " + activity["wording"]
    if not ("SŪSR" in description and phrase in description) and not ("SŪSR" in scope and phrase in scope):
        raise ValueError("activity pair is not explicitly stored as SŪSR evidence")
    url = official_url(scope)
    return code, activity, url


def resolve(records):
    results = []
    seen = set()
    for record in records:
        # The API filter is deliberately broad. Only this exact prior pair is eligible.
        if record.get("category_codes") != FALLBACK_CODES or record.get("category_labels") != FALLBACK_LABELS:
            continue
        slug = record.get("slug")
        if not isinstance(slug, str) or not SLUG.fullmatch(slug) or slug in seen:
            raise ValueError("missing, invalid, or duplicate slug")
        seen.add(slug)
        try:
            code, activity, url = stored_activity(record)
        except ValueError as exc:
            # An unapproved/missing activity remains untouched rather than inferred.
            if any(marker in (str(record.get("description_lt")) + "\n" + str(record.get("scope_evidence")))
                   for marker in ("31.01", "31.02", "31.03")):
                raise RuntimeError("anomalous target-looking stored evidence for %s: %s" % (slug, exc))
            continue
        results.append({
            "slug": slug,
            "checked_date": CHECKED_DATE,
            "prior_category_codes": FALLBACK_CODES,
            "prior_category_labels": FALLBACK_LABELS,
            "activity_code": code,
            "activity_wording": activity["wording"],
            "official_susr_record_url": url,
            "target_category_codes": activity["target_codes"],
            "target_category_labels": activity["target_labels"],
            "description_lt": record["description_lt"],
            "scope_evidence": record["scope_evidence"],
        })
    return sorted(results, key=lambda item: item["slug"])


def build(records):
    results = resolve(records)
    by_code = Counter(item["activity_code"] for item in results)
    return {
        "manifest_version": 1,
        "checked_date": CHECKED_DATE,
        "research_method": "Visi dabartinio viešo PocketBase manufacturers API bendrosios O kategorijos puslapiai paimti ribotu puslapiavimu. Atrinkti tik įrašai, kurių išsaugotuose description_lt ir/ar scope_evidence pažodžiui yra patvirtinta SŪSR pagrindinės veiklos kodo ir formuluotės pora bei tiesioginis get.data.gov.lt SŪSR JuridinisAsmuo URL. Įmonių pavadinimai nenaudojami. Oficialus SŪSR šaltinis papildomai neklaustas ir nekartotas.",
        "source": {
            "public_manufacturers_api": API,
            "official_susr_url_pattern": SUSR_URL.pattern,
            "stored_fields": ["slug", "category_codes", "category_labels", "description_lt", "scope_evidence", "source_urls", "public_details_source_urls"],
        },
        "baseline": {
            "prior_category_codes": FALLBACK_CODES,
            "prior_category_labels": FALLBACK_LABELS,
            "generic_fallback_records_scanned": sum(1 for item in records if item.get("category_codes") == FALLBACK_CODES and item.get("category_labels") == FALLBACK_LABELS),
            "target_count": len(results),
            "checked_date": CHECKED_DATE,
        },
        "counts": {
            "target_records": len(results),
            "by_activity_code": {code: by_code[code] for code in sorted(ACTIVITIES)},
            "generic_category_decrease": len(results),
        },
        "activities": ACTIVITIES,
        "results": results,
    }


def validate(manifest):
    if not isinstance(manifest, dict) or manifest.get("manifest_version") != 1 or manifest.get("checked_date") != CHECKED_DATE:
        raise ValueError("invalid checkpoint header")
    if manifest.get("activities") != ACTIVITIES or not isinstance(manifest.get("results"), list):
        raise ValueError("invalid checkpoint activity mapping or results")
    baseline, counts, results = manifest.get("baseline"), manifest.get("counts"), manifest["results"]
    if not isinstance(baseline, dict) or baseline.get("prior_category_codes") != FALLBACK_CODES or baseline.get("prior_category_labels") != FALLBACK_LABELS:
        raise ValueError("invalid checkpoint fallback baseline")
    if baseline.get("target_count") != len(results) or counts.get("target_records") != len(results) or counts.get("generic_category_decrease") != len(results):
        raise ValueError("invalid checkpoint total")
    seen, by_code = set(), Counter()
    for item in results:
        if not isinstance(item, dict) or item.get("checked_date") != CHECKED_DATE or item.get("prior_category_codes") != FALLBACK_CODES or item.get("prior_category_labels") != FALLBACK_LABELS:
            raise ValueError("invalid checkpoint prior category pair")
        slug, code = item.get("slug"), item.get("activity_code")
        if not isinstance(slug, str) or not SLUG.fullmatch(slug) or slug in seen or code not in ACTIVITIES:
            raise ValueError("invalid checkpoint slug or activity code")
        seen.add(slug)
        activity = ACTIVITIES[code]
        if item.get("activity_wording") != activity["wording"] or item.get("target_category_codes") != activity["target_codes"] or item.get("target_category_labels") != activity["target_labels"]:
            raise ValueError("invalid checkpoint code-to-category mapping")
        scope, description, url = item.get("scope_evidence"), item.get("description_lt"), item.get("official_susr_record_url")
        phrase = code + " – " + activity["wording"]
        if not isinstance(scope, str) or not isinstance(description, str) or phrase not in (description + "\n" + scope) or not isinstance(url, str) or not SUSR_URL.fullmatch(url) or url not in scope:
            raise ValueError("invalid checkpoint stored SŪSR evidence")
        by_code[code] += 1
    if counts.get("by_activity_code") != {code: by_code[code] for code in sorted(ACTIVITIES)}:
        raise ValueError("invalid checkpoint activity totals")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--validate", action="store_true", help="validate the committed checkpoint without requests")
    parser.add_argument("--input", type=Path, help="prepared paginated-record input (a JSON list), without requests")
    args = parser.parse_args()
    if args.validate:
        manifest = json.loads(MANIFEST.read_text())
    else:
        if args.input:
            records = json.loads(args.input.read_text())
            if not isinstance(records, list):
                raise RuntimeError("prepared input must be a JSON list")
        else:
            records = live_records()
        manifest = build(records)
        validate(manifest)
        MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    validate(manifest)
    print(json.dumps({"manifest": str(MANIFEST), **manifest["counts"]}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
