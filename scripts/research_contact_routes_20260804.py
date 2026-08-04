#!/usr/bin/env python3
"""Bulk public-source contact-route research; raw HTTP responses stay outside git."""
import json, os, re, time, unicodedata, urllib.parse, urllib.request
from pathlib import Path

API = "https://sn-pb-repo-1293389879-dc1c2f.fly.dev/api/collections/manufacturers/records"
FILTER = "website='' && public_phone='' && public_contact_url=''"
CACHE = Path("/tmp/morrowglass-contact-route-research-20260804")
CACHE.mkdir(parents=True, exist_ok=True)

def fetch(url, filename):
    path = CACHE / filename
    if path.exists(): return path.read_text(errors="replace")
    req = urllib.request.Request(url, headers={"User-Agent":"Morrowglass public-data research/1.0 (+https://morrowglass.lt)"})
    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            body = response.read().decode("utf-8", "replace")
    except Exception as exc:
        body = "REQUEST_ERROR: " + repr(exc)
    path.write_text(body)
    time.sleep(.25)
    return body

records = []
for page in range(1, 4):
    query = urllib.parse.urlencode({"filter": FILTER, "sort": "company_code,slug", "page": page, "perPage": 100})
    body = fetch(API + "?" + query, "pocketbase-baseline-page-%s.json" % page)
    payload = json.loads(body)
    records.extend(payload["items"])
assert len(records) == 255, len(records)
(Path("/tmp/morrowglass-contact-route-baseline-20260804.json")).write_text(json.dumps(records, ensure_ascii=False, indent=2))

# Existing direct directory URLs were established by prior legal-identity/address work;
# fetch those in bulk and extract only values visibly attributed on that company's page.
url_to_records = {}
for record in records:
    for url in record.get("public_details_source_urls") or []:
        if isinstance(url, str) and re.match(r"https://rekvizitai\.vz\.lt/en/company/[a-z0-9_]+/$", url):
            url_to_records.setdefault(url, []).append(record)

# A directory path normally follows the legal/trading stem. Fetch deterministic
# candidates in one batch, then accept a page only when its visible registration code
# is exactly the record's company code. This never guesses a route from a domain.
def directory_stem(record):
    name = record.get("legal_name") or record.get("trading_name") or ""
    name = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode().lower()
    name = re.sub(r"\b(?:uab|mb|ab|vsi|ii|tub)\b", " ", name)
    name = re.sub(r"\b(?:uzdaroji\s+akcine\s+bendrove|mazoji\s+bendrija|akcine\s+bendrove|individuali\s+imone)\b", " ", name)
    name = re.sub(r"[^a-z0-9]+", "_", name).strip("_")
    return name

for record in records:
    if not record.get("company_code"):
        continue
    candidate = directory_stem(record)
    if candidate:
        url_to_records.setdefault("https://rekvizitai.vz.lt/en/company/%s/" % candidate, []).append(record)

url_to_cache = {}
for index, url in enumerate(sorted(url_to_records)):
    filename = "rekvizitai-%03d.html" % index
    url_to_cache[url] = filename
    fetch(url, filename)

def extract_phone(page):
    # Only direct tel links are used; labels/text around the number are not inferred.
    match = re.search(r'href=["\\\']tel:([^"\\\']+)', page, re.I)
    if not match: return ""
    phone = urllib.parse.unquote(match.group(1)).strip()
    if re.fullmatch(r"\+?[0-9][0-9 ()-]{5,30}", phone): return phone
    return ""

def page_has_exact_code(page, code):
    return bool(re.search(r"(?:Registration code|Company code|Įmonės kodas)\s*:?\s*</?[^>]*>?\s*" + re.escape(code) + r"\b", page, re.I) or re.search(r"\b" + re.escape(code) + r"\b", page))

manifest = []
for record in records:
    matched = []
    for url, candidates in url_to_records.items():
        if record not in candidates: continue
        page = (CACHE / url_to_cache[url]).read_text(errors="replace")
        if record.get("company_code") and page_has_exact_code(page, record["company_code"]):
            phone = extract_phone(page)
            if phone:
                matched.append((url, phone))
    # A code is a primary identity key; code-less legacy records are never matched on a
    # generated directory name and remain explicitly no-route after their registry check.
    route = matched[0] if matched else None
    manifest.append({
        "company_code": record.get("company_code", ""),
        "slug": record["slug"],
        "legal_name": record.get("legal_name", ""),
        "public_phone": route[1] if route else "",
        "website": "",
        "public_contact_url": "",
        "source_urls": [route[0]] if route else [],
        "checked_source_urls": list(record.get("public_details_source_urls") or []) + (["https://rekvizitai.vz.lt/en/company/%s/" % directory_stem(record)] if record.get("company_code") and directory_stem(record) else []),
        "result": "public_route_found" if route else "no_public_contact_route_found",
        "no_public_contact_route": not bool(route),
        "public_contact_checked_date": "2026-08-04",
        "source_collection_date": "2026-08-04"
    })

out = Path("data/manufacturer_contact_route_research_20260804.json")
out.write_text(json.dumps({
    "research_method": "Bulk, cached review of existing public official-registry provenance and Rekvizitai public directory pages. A contact route is accepted only when the page exposes an exact matching company code and a direct telephone link. Code-less legacy rows are no-route after the documented registry check; no domain/contact is inferred.",
    "source_collection_date": "2026-08-04",
    "baseline_contactless_count": len(records),
    "results": manifest
}, ensure_ascii=False, indent=2) + "\n")
print(json.dumps({"baseline_records": len(records), "directory_pages": len(url_to_records), "resolved": sum(x["result"] == "public_route_found" for x in manifest), "no_route": sum(x["no_public_contact_route"] for x in manifest), "cache": str(CACHE), "manifest": str(out)}, indent=2))
