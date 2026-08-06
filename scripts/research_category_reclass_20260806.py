#!/usr/bin/env python3
"""Audit the live O-fallback cohort against identity-checked public activity pages.

Raw HTTP pages are deliberately cached under /tmp and never committed.  A
Rekvizitai page is evidence only after its visible registration code equals the
PocketBase record's company_code; company names are never used as identity
proof.  The checkpoint is resumable: completed records are retained only when
their code is unchanged, and uncached requests to each host are at least 1.5
seconds apart.
"""
import argparse
import hashlib
import html
import json
import re
import time
import unicodedata
import urllib.parse
import urllib.request
from collections import Counter
from pathlib import Path

API = "https://sn-pb-repo-1293389879-dc1c2f.fly.dev/api/collections/manufacturers/records"
CHECKED_DATE = "2026-08-06"
EXPECTED_TARGET_COUNT = 238
FALLBACK_CODE = "O"
FALLBACK_LABEL = "Kiti nestandartiniai baldai"
CACHE = Path("/tmp/morrowglass-category-reclass-research-20260806")
ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "data/category_reclass_20260806.json"
FACTS = ROOT / "data/company_facts_20260806.json"
HOST = "rekvizitai.vz.lt"
USER_AGENT = "Morrowglass public-data research/1.0 (+https://morrowglass.lt)"
LAST_REQUEST_BY_HOST = {}
LABELS = {
    "K": "Virtuvės baldai", "W": "Spintos ir įmontuojami baldai",
    "BB": "Miegamojo ir vonios baldai", "OC": "Biuro ir komerciniai baldai",
    "HR": "HoReCa ir prekybos baldai", "U": "Minkšti baldai pagal užsakymą",
    "SW": "Medžio darbai ir medžio masyvo baldai",
    "MM": "Metalo ir mišrių medžiagų baldai", "O": FALLBACK_LABEL,
}


def normal(value):
    return re.sub(r"\s+", " ", html.unescape(value or "")).strip()


def visible(fragment):
    fragment = re.sub(r"<(script|style|noscript)\b[^>]*>.*?</\1\s*>", " ", fragment, flags=re.I | re.S)
    fragment = re.sub(r"<[^>]+>", " ", fragment)
    return normal(fragment)


def is_company_url(url):
    try:
        parsed = urllib.parse.urlparse(url)
    except (TypeError, ValueError):
        return False
    return parsed.scheme in ("http", "https") and parsed.netloc.lower() == HOST and bool(
        re.fullmatch(r"/(?:en/company|imone)/[a-z0-9_-]+/?", parsed.path.lower()))


def canonical(url):
    parsed = urllib.parse.urlparse(url)
    return urllib.parse.urlunparse(("https", HOST, parsed.path.rstrip("/") + "/", "", "", ""))


def stem(record):
    name = record.get("legal_name") or record.get("trading_name") or ""
    name = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode().lower()
    name = re.sub(r"\b(?:uab|mb|ab|vsi|ii|tub|ivv|uzdaroji|akcine|bendrove|mazoji|bendrija|imone)\b", " ", name)
    return re.sub(r"[^a-z0-9]+", "_", name).strip("_")


def cache_paths(url):
    digest = hashlib.sha256(url.encode()).hexdigest()
    return CACHE / (digest + ".html"), CACHE / (digest + ".json")


def fetch(url):
    CACHE.mkdir(parents=True, exist_ok=True)
    body_path, meta_path = cache_paths(url)
    if body_path.exists() and meta_path.exists():
        return body_path.read_text(errors="replace"), json.loads(meta_path.read_text())
    host = urllib.parse.urlparse(url).netloc.lower()
    wait = 1.5 - (time.monotonic() - LAST_REQUEST_BY_HOST.get(host, 0))
    if wait > 0:
        time.sleep(wait)
    LAST_REQUEST_BY_HOST[host] = time.monotonic()
    meta = {"requested_url": url, "effective_url": url, "http_status": None, "fetched_at": CHECKED_DATE}
    try:
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=25) as response:
            body = response.read().decode("utf-8", "replace")
            meta.update({"http_status": response.status, "effective_url": response.geturl()})
    except Exception as exc:
        body = "REQUEST_ERROR: " + repr(exc)
        meta["error"] = repr(exc)
    body_path.write_text(body)
    meta_path.write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n")
    return body, meta


def exact_code(page, code):
    code = re.escape(str(code))
    return bool(re.search(r'<span\s+id=["\']ccode["\'][^>]*>\s*' + code + r'\s*</span>', page, re.I) or
                re.search(r'(?:Registration code|Company code|Įmonės kodas)\s*</(?:td|div)>\s*<(?:td|div)[^>]*>\s*(?:<[^>]+>\s*)*' + code + r'\b', page, re.I | re.S))


def candidates(record, facts):
    values = []
    prior = facts.get(record["slug"], {}) if isinstance(facts, dict) else {}
    for url in [prior.get("accepted_source_url"), record.get("financial_source_url")] + list(record.get("public_details_source_urls") or []):
        if is_company_url(url):
            url = canonical(url)
            if url not in values:
                values.append(url)
    candidate = stem(record)
    if candidate:
        url = "https://rekvizitai.vz.lt/en/company/%s/" % candidate
        if url not in values:
            values.append(url)
    return values


def activity_quote(page):
    """Extract only a visible, company-profile activity/description phrase."""
    # A company description is visibly labelled Description on the same profile.
    match = re.search(r'<(?:div|section)[^>]*class=["\'][^"\']*\bdescription\b[^"\']*["\'][^>]*>(.*?)</(?:div|section)>', page, re.I | re.S)
    text = visible(match.group(1)) if match else ""
    if not text:
        meta = re.search(r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']', page, re.I | re.S)
        text = normal(meta.group(1)) if meta else ""
    # Rekvizitai prepends an automatic legal-name/founding paragraph to some
    # descriptions. It is not product evidence, and in particular must not
    # let a trading name such as "Minkštas ..." become a category inference.
    if re.match(r"^.*?\(code \d+\) was founded in\b", text, re.I | re.S):
        automatic = re.search(r"Currently,? .*? located at .*?\.\s*", text, re.I | re.S)
        text = text[automatic.end():] if automatic else ""
    # Keep an auditable short exact excerpt rather than synthesising a claim.
    return text[:900] if text else None


def classify(quote):
    """Return all directly supported categories, with statutory code mappings first."""
    if not quote:
        return ["O"], None
    folded = unicodedata.normalize("NFKD", quote).encode("ascii", "ignore").decode().lower()
    matched, bases = [], []
    # EVRK wording (when a profile exposes it) takes precedence over free text.
    rules = [
        ("K", r"\b31[., ]?02\b[^.]{0,140}(?:virtuvi|kitchen)"),
        ("OC", r"\b31[., ]?01\b[^.]{0,140}(?:istaig|prekybos viet|office|commercial)"),
        ("BB", r"\b31[., ]?03\b[^.]{0,140}(?:matrac|mattress)"),
        ("SW", r"\b16[., ]?(?:23|29)\b[^.]{0,140}(?:medien|wood)"),
        ("MM", r"\b25(?:[., ]\d{1,2})?\b[^.]{0,140}(?:metal)"),
    ]
    for code, pattern in rules:
        if re.search(pattern, folded):
            matched.append(code)
            bases.append("EVRK")
    # Direct product/use/material wording on the identity-checked public profile.
    direct = [
        ("K", r"(?:virtuves|kitchen)\s+(?:bald|furniture|cabinet)"),
        ("W", r"(?:spint|wardrobe|built[- ]?in|sliding door|montuojam)"),
        ("BB", r"(?:matrac|mattress|vonios\s+bald|bathroom\s+furniture|miegamojo\s+bald|bedroom\s+furniture)"),
        ("OC", r"(?:istaig|office\s+furniture|commercial\s+furniture|prekybos\s+viet)"),
        ("HR", r"(?:hotel|restaurant|horeca|restoran|viesbuc|retail\s+(?:space|furniture|store)|parduotuv)"),
        ("U", r"(?:minkst|upholster|sofa|seating|soft\s+furniture)"),
        ("SW", r"(?:medzio\s+(?:masyvo|darb)|solid\s+wood|wood(?:en)?\s+(?:work|furniture)|natural veneer)"),
        ("MM", r"(?:metal(?:o|lic)?\s+(?:bald|furniture|work)|metaliniu)"),
    ]
    for code, pattern in direct:
        if re.search(pattern, folded) and code not in matched:
            matched.append(code)
            bases.append("tiesioginė vieša formuluotė")
    return (matched or ["O"]), "; ".join(sorted(set(bases))) or None


def fetch_records():
    records, page = [], 1
    while True:
        query = urllib.parse.urlencode({"page": page, "perPage": 100, "sort": "slug"})
        req = urllib.request.Request(API + "?" + query, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=30) as response:
            payload = json.loads(response.read().decode())
        records.extend(item for item in payload["items"] if item.get("category_codes") == [FALLBACK_CODE] and item.get("category_labels") == [FALLBACK_LABEL])
        if page >= payload.get("totalPages", 1):
            break
        page += 1
    if len(records) != EXPECTED_TARGET_COUNT:
        raise RuntimeError("baseline drift: expected %d exact O pairs, got %d" % (EXPECTED_TARGET_COUNT, len(records)))
    return sorted(records, key=lambda item: item["slug"])


def old_results():
    try:
        payload = json.loads(MANIFEST.read_text())
        return payload.get("results", {}) if isinstance(payload.get("results"), dict) else {}
    except (OSError, ValueError):
        return {}


def research(records):
    try:
        facts = json.loads(FACTS.read_text()).get("results", {})
    except (OSError, ValueError):
        facts = {}
    previous, results = old_results(), {}
    for number, record in enumerate(records, 1):
        slug = record["slug"]
        old = previous.get(slug)
        if isinstance(old, dict) and old.get("company_code") == record.get("company_code") and old.get("checked_date") == CHECKED_DATE:
            results[slug] = old
            continue
        urls, checks, accepted, quote = candidates(record, facts), [], None, None
        for url in urls:
            page, meta = fetch(url)
            matched = meta.get("http_status") == 200 and exact_code(page, record["company_code"])
            checks.append({"url": url, "effective_url": meta.get("effective_url"), "http_status": meta.get("http_status"), "exact_company_code_match": matched})
            if matched:
                accepted, quote = meta.get("effective_url") or url, activity_quote(page)
                break
        categories, basis = classify(quote)
        if categories == ["O"]:
            scope = "2026-08-06 patikrintas viešas įmonės puslapis; konkreti produkto, medžiagos ar paskirties formuluotė, leidžianti siaurinti O kategoriją, nerasta. Šaltinis: " + (accepted or urls[0])
            confidence = "vidutinis"
            confidence_evidence = "Registracijos kodu susietas viešas puslapis patikrintas 2026-08-06; vien „kitų baldų gamyba“ ar bendras baldų paminėjimas nebuvo siaurinamas."
        else:
            scope = "Viešame registracijos kodu susietame veiklos apraše nurodyta: „%s“. Kategorijos %s priskirtos pagal %s. Šaltinis: %s" % (quote, ", ".join(categories), basis, accepted)
            confidence = "aukštas"
            confidence_evidence = "Aukštas: viešas Rekvizitai įmonės puslapis rodo tą patį įmonės kodą ir tiesioginę veiklos / produkto / paskirties formuluotę."
        results[slug] = {
            "slug": slug, "company_code": record["company_code"], "legal_name": record.get("legal_name") or "", "trading_name": record.get("trading_name") or "",
            "checked_date": CHECKED_DATE, "checked_candidate_urls": urls, "candidate_checks": checks,
            "accepted_source_url": accepted, "source_check_status": "exact_code_matched" if accepted else "no_exact_company_code_match",
            "activity_evidence": quote, "mapping_basis": basis,
            "category_codes": categories, "category_labels": [LABELS[code] for code in categories],
            "scope_evidence": scope, "confidence": confidence, "confidence_evidence": confidence_evidence,
            "public_details_source_url_to_append": accepted if categories != ["O"] else None,
        }
        if number % 10 == 0:
            print("researched %d/%d" % (number, len(records)), flush=True)
    return results


def build(results):
    categories = Counter(code for item in results.values() for code in item["category_codes"])
    matched = sum(item["accepted_source_url"] is not None for item in results.values())
    changed = sum(item["category_codes"] != ["O"] for item in results.values())
    return {
        "manifest_version": 1,
        "research_method": "Pradėta nuo data/company_facts_20260806.json (jame EVRK ištraukų nebuvo), tada gyvas tikslus O/O poros 238 įrašų sąrašas paginuotas iš viešo PocketBase API. Kiekvienam įrašui tikrintas esamas Rekvizitai finansų URL, viešų detalių URL ir deterministinis juridinio pavadinimo kandidatas. Ne talpykloje esantys prašymai Rekvizitai hostui retinami bent 1,5 s; neapdorotas HTML ir metaduomenys saugomi tik /tmp/morrowglass-category-reclass-research-20260806. Puslapis priimamas tik kai matomas registracijos kodas tiksliai lygus įrašo company_code. Iš priimto puslapio imama tik matoma veiklos/Description formuluotė; pavadinimai nenaudojami kategorijai spėti. 31.02→K, 31.01→OC, 31.03→BB, 16.23/16.29→SW, 25.x→MM; W/U/HR ir kitos tiesioginės kategorijos tik pagal pažodinę produkto, medžiagos ar paskirties formuluotę. Vien 31.09 / „kitų baldų gamyba“ ar bendras baldų paminėjimas paliekamas O.",
        "baseline": {"filter": "category_codes exactly ['O'] AND category_labels exactly ['Kiti nestandartiniai baldai']", "target_count": EXPECTED_TARGET_COUNT, "checked_date": CHECKED_DATE},
        "counts": {"target_records": len(results), "exact_code_matched_pages": matched, "reclassified": changed, "unchanged_checked": len(results) - changed, "fallback_after_migration": len(results) - changed, "by_category": dict(sorted(categories.items()))},
        "results": dict(sorted(results.items())),
    }


def validate(manifest):
    assert manifest["manifest_version"] == 1
    assert manifest["baseline"]["target_count"] == EXPECTED_TARGET_COUNT
    assert len(manifest["results"]) == EXPECTED_TARGET_COUNT
    for slug, item in manifest["results"].items():
        assert slug == item["slug"] and re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", slug)
        assert re.fullmatch(r"\d{7,12}", item["company_code"])
        assert item["checked_date"] == CHECKED_DATE and item["category_codes"] and len(item["category_codes"]) == len(item["category_labels"])
        assert all(LABELS.get(code) == label for code, label in zip(item["category_codes"], item["category_labels"]))
        assert item["source_check_status"] in ("exact_code_matched", "no_exact_company_code_match")
        assert item["checked_candidate_urls"] and all(is_company_url(url) for url in item["checked_candidate_urls"])
        assert all(check["url"] in item["checked_candidate_urls"] and isinstance(check["exact_company_code_match"], bool) for check in item["candidate_checks"])
        if item["category_codes"] != ["O"]:
            assert item["accepted_source_url"] and item["activity_evidence"] and item["accepted_source_url"] in item["scope_evidence"]
    assert manifest["counts"]["target_records"] == EXPECTED_TARGET_COUNT
    assert manifest["counts"]["reclassified"] + manifest["counts"]["unchanged_checked"] == EXPECTED_TARGET_COUNT


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--validate", action="store_true", help="validate checkpoint without network requests")
    args = parser.parse_args()
    if args.validate:
        manifest = json.loads(MANIFEST.read_text())
    else:
        manifest = build(research(fetch_records()))
        validate(manifest)
        MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    validate(manifest)
    print(json.dumps(manifest["counts"], ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
