#!/usr/bin/env python3
"""Audited, cached public-source lookup of official manufacturer websites.

This intentionally fills no live records.  It fetches the current blank-website
baseline through the public PocketBase API, writes raw public pages below /tmp,
and emits the immutable manifest consumed by the later migration.
"""
import hashlib
import html
import json
import re
import time
import unicodedata
import urllib.parse
import urllib.request
from pathlib import Path

API = "https://sn-pb-repo-1293389879-dc1c2f.fly.dev/api/collections/manufacturers/records"
CHECKED_DATE = "2026-08-06"
CACHE = Path("/tmp/morrowglass-website-research-20260806")
CACHE.mkdir(parents=True, exist_ok=True)
USER_AGENT = "Morrowglass public-data website research/1.0 (+https://morrowglass.lt)"
DIRECTORIES = ("rekvizitai.vz.lt", "www.info.lt", "info.lt", "www.visasverslas.lt", "visasverslas.lt", "www.imones.lt", "imones.lt", "1551.lt", "www.1551.lt", "get.data.gov.lt", "data.gov.lt", "registrucentras.lt", "geltoni.lt", "verslorekvizitai.lt", "scoris.lt", "paslaugos.lt", "pigu.lt", "varle.lt", "balticmaps.eu", "manreikia.lt", "imonesverslas.lt")
SOCIAL = ("facebook.com", "instagram.com", "linkedin.com", "tiktok.com", "youtube.com", "x.com", "twitter.com")
FURNITURE = ("bald", "furniture", "kitchen", "virtu", "spint", "interjer", "medien", "woodwork")
# A small, reproducible supplement from the deterministic public-search fallback.
# Each entry was independently fetched by official_candidate; the second value is
# the public directory/search provenance that nominated the candidate.
RESEARCHED_CANDIDATES = {
    "aurimo-baldai": ("https://aurimobaldai.com/", "https://www.info.lt/imones/Aurimo-baldai/2413959"),
    "klaipedos-baldai": ("https://klaipedosbaldai.lt/about-us", "https://rekvizitai.vz.lt/en/company/klaipedos_baldai/"),
    "uab-freda-133386126": ("https://www.freda.eu/apie-mus/", "https://rekvizitai.vz.lt/en/company/freda/"),
    "uab-narbutas-international-300591314": ("https://www.narbutas.com/news/change-of-company-name/", "https://rekvizitai.vz.lt/en/company/narbutas_international/"),
}


def cache_name(url):
    return hashlib.sha256(url.encode()).hexdigest() + ".json"


def fetch(url):
    """Return status, final URL and decoded body; cache both successes and errors."""
    path = CACHE / cache_name(url)
    if path.exists():
        return json.loads(path.read_text())
    result = {"requested_url": url, "status": 0, "final_url": url, "body": ""}
    try:
        request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "text/html,application/xhtml+xml"})
        with urllib.request.urlopen(request, timeout=8) as response:
            result.update({"status": response.status, "final_url": response.geturl(), "body": response.read().decode("utf-8", "replace")})
    except Exception as exc:
        result["error"] = repr(exc)
    path.write_text(json.dumps(result, ensure_ascii=False))
    time.sleep(0.30)  # polite, deterministic rate limit; cache makes reruns read-only
    return result


def normalized(value):
    value = html.unescape(value or "")
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode().lower()
    value = re.sub(r"\b(?:uab|mb|ab|vsi|ii|tub|ltd|llc|uzdaroji|akcine|bendrove|mazoji|bendrija)\b", " ", value)
    return re.sub(r"[^a-z0-9]+", "", value)


def visible_text(page):
    page = re.sub(r"(?is)<(script|style|noscript).*?>.*?</\1>", " ", page)
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"(?s)<[^>]+>", " ", page))).strip()


def identity_on_page(page, record):
    text = normalized(visible_text(page))
    names = [record.get("legal_name", ""), record.get("trading_name", "")]
    # Exact legal/trading name after punctuation and company-form normalization.  A
    # registration code is supporting evidence, never a substitute for the name.
    return any(len(normalized(name)) >= 5 and normalized(name) in text for name in names)


def furniture_on_page(page):
    text = normalized(visible_text(page))
    return any(marker in text for marker in FURNITURE)


def is_directory(url):
    host = urllib.parse.urlparse(url).netloc.lower()
    return any(host == domain or host.endswith("." + domain) for domain in DIRECTORIES)


def is_social(url):
    host = urllib.parse.urlparse(url).netloc.lower()
    return any(host == domain or host.endswith("." + domain) for domain in SOCIAL)


def valid_http_url(url):
    parsed = urllib.parse.urlparse(url)
    return parsed.scheme == "https" and bool(parsed.netloc) and not any(c.isspace() for c in url)


def external_links(page, base):
    links = []
    for raw in re.findall(r'''(?is)href\s*=\s*["']([^"'#]+)''', page):
        url = html.unescape(urllib.parse.urljoin(base, raw.strip()))
        url = url.split("#", 1)[0]
        if valid_http_url(url) and url not in links:
            links.append(url)
    return links


def directory_stem(record):
    name = record.get("legal_name") or record.get("trading_name") or ""
    name = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode().lower()
    name = re.sub(r"\b(?:uab|mb|ab|vsi|ii|tub|uzdaroji\s+akcine\s+bendrove|mazoji\s+bendrija)\b", " ", name)
    return re.sub(r"[^a-z0-9]+", "_", name).strip("_")


def known_candidate_urls(record):
    """Previously captured public-detail URLs can themselves be official sites.

    They are still re-fetched and must pass exactly the same identity/scope tests;
    no historical URL is trusted merely because it was stored on the record.
    """
    urls = []
    for field in ("source_urls", "public_details_source_urls"):
        for url in record.get(field) or []:
            if isinstance(url, str) and valid_http_url(url) and not is_directory(url) and not is_social(url) and url not in urls:
                urls.append(url)
    return urls


def directory_candidates(record):
    urls = []
    for field in ("source_urls", "public_details_source_urls"):
        for url in record.get(field) or []:
            if isinstance(url, str) and valid_http_url(url) and is_directory(url) and url not in urls:
                urls.append(url)
    stem = directory_stem(record)
    if stem:
        url = "https://rekvizitai.vz.lt/en/company/%s/" % stem
        if url not in urls:
            urls.append(url)
    return urls


def search_url(record):
    # A deterministic, public general-search fallback. Its results only nominate
    # candidates; every candidate is independently fetched and verified below.
    query = '"%s" baldai' % (record.get("legal_name") or record.get("trading_name") or "")
    return "https://html.duckduckgo.com/html/?" + urllib.parse.urlencode({"q": query})


def search_candidates(page, base):
    # DuckDuckGo result redirect URLs contain the original public target in uddg.
    candidates = []
    for link in external_links(page, base):
        parsed = urllib.parse.urlparse(link)
        query = urllib.parse.parse_qs(parsed.query)
        target = (query.get("uddg") or [""])[0]
        if target and valid_http_url(target) and target not in candidates:
            candidates.append(target)
        elif valid_http_url(link) and "duckduckgo.com" not in parsed.netloc and link not in candidates:
            candidates.append(link)
    return candidates


def official_candidate(url, record):
    if is_directory(url) or is_social(url):
        return None
    response = fetch(url)
    final_url = response.get("final_url", url)
    if response.get("status") != 200 or not valid_http_url(final_url) or is_directory(final_url) or is_social(final_url):
        return None
    page = response.get("body", "")
    if identity_on_page(page, record) and furniture_on_page(page):
        return final_url
    return None


# Fetch the entire live baseline with API pagination. The target filter deliberately
# includes both PocketBase's empty-string and null representations.
records = []
page = 1
while True:
    query = urllib.parse.urlencode({"filter": "website='' || website=null", "sort": "slug", "page": page, "perPage": 100, "fields": "slug,legal_name,trading_name,company_code,city,website,source_urls,public_details_source_urls"})
    payload = fetch(API + "?" + query)
    if payload["status"] != 200:
        raise RuntimeError("baseline API request failed: %r" % payload)
    response = json.loads(payload["body"])
    records.extend(response["items"])
    if page >= response.get("totalPages", 1):
        break
    page += 1
records.sort(key=lambda item: item["slug"])
if len({item["slug"] for item in records}) != len(records) or any(item.get("website") not in (None, "") for item in records):
    raise RuntimeError("baseline does not consist of unique blank-website rows")
(Path("/tmp/morrowglass-website-baseline-20260806.json")).write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n")

results = []
for index, record in enumerate(records, 1):
    accepted = None
    accepted_source = None
    # Previously stored public-detail URLs are candidates, not presumed facts: they
    # pass the same live HTTP, identity and furniture-scope verification as every
    # directory/search candidate.
    for candidate, provenance in ([RESEARCHED_CANDIDATES[record["slug"]]] if record["slug"] in RESEARCHED_CANDIDATES else []) + [(url, url) for url in known_candidate_urls(record)]:
        accepted = official_candidate(candidate, record)
        if accepted:
            accepted_source = provenance
            break
    # Public business directories nominate URLs only if their page identifies the
    # same legal/trading name. This prevents a generated directory slug from leaking
    # a similarly named company's website into the manifest.
    for directory in ([] if accepted else directory_candidates(record)):
        directory_page = fetch(directory)
        if directory_page["status"] != 200 or not identity_on_page(directory_page["body"], record):
            continue
        for candidate in external_links(directory_page["body"], directory_page["final_url"])[:8]:
            accepted = official_candidate(candidate, record)
            if accepted:
                accepted_source = directory_page["final_url"]
                break
        if accepted:
            break
    # General public search is a fallback only, and remains auditable as the source
    # that nominated the independently verified official page.
    if not accepted:
        search = search_url(record)
        search_page = fetch(search)
        if search_page["status"] == 200:
            for candidate in search_candidates(search_page["body"], search_page["final_url"])[:8]:
                accepted = official_candidate(candidate, record)
                if accepted:
                    accepted_source = search_page["final_url"]
                    break
    found = bool(accepted)
    results.append({
        "slug": record["slug"],
        "legal_name": record.get("legal_name", ""),
        "company_code": record.get("company_code", ""),
        "website": accepted if found else None,
        "website_source_url": accepted_source if found else None,
        "checked_date": CHECKED_DATE,
        "evidence_note": ("Official site returned HTTP 200 and its visible page text contained the exact legal or trading name and furniture/baldai business evidence; public directory/search page cited as candidate provenance." if found else "No candidate from the reviewed public directories and deterministic public-search fallback met all acceptance tests (HTTP 200, exact legal/trading-name identity, and furniture/baldai business evidence)."),
        "status": "found" if found else "not_found",
    })
    print("%03d/%03d %s: %s" % (index, len(records), record["slug"], accepted or "not found"), flush=True)

found_count = sum(item["status"] == "found" for item in results)
manifest = {
    "method": "Bulk paginated public API baseline followed by cached, rate-limited deterministic candidate review. Rekvizitai, info.lt, VisasVerslas, Imones (and already-recorded public directory URLs) nominate candidates; a deterministic DuckDuckGo HTML query is used only as fallback. Directories/aggregators and social networks are never accepted as websites. A candidate is accepted only after a fresh HTTP 200 fetch whose visible text contains the exact normalized legal or trading name and furniture/baldai-business evidence.",
    "baseline": {"filter": "website='' || website=null", "checked_date": CHECKED_DATE, "target_count": len(records), "fields": ["slug", "legal_name", "trading_name", "company_code", "city", "website", "source_urls", "public_details_source_urls"]},
    "counts": {"total": len(results), "found": found_count, "not_found": len(results) - found_count},
    "results": results,
}
out = Path("data/websites_resolved_20260806.json")
out.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
print(json.dumps({"manifest": str(out), "cache": str(CACHE), **manifest["counts"]}, indent=2))
