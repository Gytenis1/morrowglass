#!/usr/bin/env python3
"""Rate-limited, resumable public research for official manufacturer websites.

Raw API/search/site responses are deliberately cached outside git.  The checked-in
manifest contains only the identity, public query/source URLs and the reviewed
outcome needed by the corresponding PocketBase migration.
"""
import argparse
import hashlib
import html
import json
import threading
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
import os
import re
import ssl
import sys
import time
import unicodedata
import urllib.parse
import urllib.request
from pathlib import Path

API = "https://sn-pb-repo-1293389879-dc1c2f.fly.dev/api/collections/manufacturers/records"
FILTER = "website='' && public_phone='' && public_contact_url='' && revenue_eur_latest>100000"
CHECKED_DATE = "2026-08-07"
CACHE = Path(os.environ.get("OFFICIAL_WEBSITE_RESEARCH_CACHE", "/tmp/morrowglass-official-websites-20260807"))
CACHE.mkdir(parents=True, exist_ok=True)
OUT = Path("data/official_websites_20260807.json")
USER_AGENT = "Morrowglass public official-website research/1.0 (+https://morrowglass.lt)"
HOST_DELAY_SECONDS = 1.5
# The first full sweep used one second and exhausted only its direct guesses. The
# narrow correction mode below retries a reviewed list of pre-existing not-found
# rows with a practical public-site timeout without touching the 543-row audit.
CORRECTIVE_TIMEOUT_SECONDS = 10
CORRECTIVE_TARGETS = {
    "akcine-bendrove-klaipedos-mediena-240616710": {
        "website": "https://vmg.eu/", "evidence_url": "https://vmg.eu/en/contacts/company-details/",
        "identity_evidence": "HTTP 200 company-details page visibly names AB \"KLAIPĖDOS MEDIENA\" and registration 240616710.",
        "allow_insecure_tls": True,
    },
    "rol-lithuania-uab-300503175": {
        "website": "https://rollithuania.lt/", "evidence_url": "https://rollithuania.lt/contacts/",
        "identity_evidence": "HTTP 200 contacts page visibly names ROL Lithuania, UAB and company code 300503175.",
    },
    "uab-balticsofa-121504969": {
        "website": "https://www.balticsofa.com/", "evidence_url": "https://www.balticsofa.com/privacy-policy/",
        "identity_evidence": "HTTP 200 privacy-policy page visibly names UAB Balticsofa and legal entity code 121504969.",
    },
    "uab-pelly-baltic-300513963": {
        "website": "https://www.pelly.se/", "evidence_url": "https://www.pelly.se/en/about-pelly/",
        "identity_evidence": "HTTP 200 group about page visibly names Pelly Baltic as its Kaunas, Lithuania production entity.",
    },
    "uab-svenheim-301152003": {
        "website": "https://svenheim.no/", "evidence_url": "https://svenheim.no/en/about-us/",
        "identity_evidence": "HTTP 200 group about page visibly names UAB Svenheim as its complete production unit in Alytus, Lithuania.",
    },
    "itab-lithuania-ab-233393310": {
        "website": "https://itab.com/", "evidence_url": "https://itab.com/sintek",
        "identity_evidence": "HTTP 200 ITAB page visibly names ITAB Lithuania AB in its Baltic contact details.",
    },
    "uzdaroji-akcine-bendrove-vmg-akmenes-baldai-305610964": {
        "website": "https://vmg.eu/", "evidence_url": "https://vmg.eu/en/our-history/",
        "identity_evidence": "HTTP 200 VMG Group history page visibly names UAB VMG Akmenės baldai as a cabinet-furniture manufacturer.",
        "allow_insecure_tls": True,
    },
    "kame-uab-303051031": {
        "website": "https://kame.lt/", "evidence_url": "https://kame.lt/en/terms-and-conditions/",
        "identity_evidence": "HTTP 200 terms page visibly names KAMĖ UAB and company code 303051031 as the kame.lt shop owner.",
    },
    "uab-erelita-furniture-302556194": {
        "website": "https://erelita.lt/", "evidence_url": "https://erelita.lt/privacy-policy/",
        "identity_evidence": "HTTP 200 privacy-policy page visibly names UAB Erelita Furniture as the erelita.lt data controller.",
    },
    "uzdaroji-akcine-bendrove-vildeta-120213448": {
        "website": "https://vildeta.lt/", "evidence_url": "https://vildeta.lt/en/contact-us",
        "identity_evidence": "HTTP 200 contact page visibly gives registration code 120213448.",
    },
    "uab-pats-sau-baldzius-300632782": {
        "website": "https://www.baldzius.lt/", "evidence_url": "https://www.baldzius.lt/",
        "identity_evidence": "HTTP 200 footer visibly names UAB Pats sau baldžius and company code 300632782.",
    },
    "uab-pod-furniture-305671084": {
        "website": "https://www.podfurniture.lt/", "evidence_url": "https://www.podfurniture.lt/",
        "identity_evidence": "HTTP 200 home page visibly names UAB POD FURNITURE in its investment-project notice.",
    },
    "uab-superlon-baltic-148441361": {
        "website": "https://www.superlon.lt/", "evidence_url": "https://www.superlon.lt/",
        "identity_evidence": "HTTP 200 home page visibly names UAB Superlon Baltic and company code 148441361.",
    },
    "uab-rieses-baldai-302658982": {
        "website": "https://riesesbaldai.lt/", "evidence_url": "https://riesesbaldai.lt/kontaktai",
        "identity_evidence": "HTTP 200 contacts page visibly gives company code 302658982 for Riešės baldai.",
    },
    "uab-siguldos-baldai-302316701": {
        "website": "https://www.siguldosbaldai.lt/", "evidence_url": "https://www.siguldosbaldai.lt/apie-mus/",
        "identity_evidence": "HTTP 200 about page visibly names UAB Siguldos baldai as the furniture manufacturer and trader.",
    },
}
last_request_at = {}
host_locks = defaultdict(threading.Lock)

# Never accept a page on these domains as a business's website, even if the page
# correctly identifies it. They may still be checked as public search evidence.
REJECT_HOST_PARTS = (
    "facebook.", "linkedin.", "instagram.", "twitter.", "x.com", "youtube.", "tiktok.",
    "rekvizitai.", "imones.", "visasverslas.", "info.lt", "verslorekvizitai.",
    "google.", "bing.", "duckduckgo.", "wikipedia.", "118.", "zyle.", "pigu.",
    "senukai.", "varle.", "etsy.", "amazon.", "ebay.", "cvonline.", "cvbankas.",
    "indeed.", "workis.", "scamadviser.", "facebook.com", "linkedin.com",
)
CORPORATE_WORDS = {
    "uab", "ab", "mb", "vsi", "ii", "tub", "kdb", "ltd", "llc", "inc", "company",
    "uzdaroji", "akcine", "bendrove", "mazoji", "individuali", "imone", "akcinė", "įmonė",
}


def cache_name(prefix, value):
    return "%s-%s.txt" % (prefix, hashlib.sha256(value.encode("utf-8")).hexdigest())


def fetch(url, prefix, timeout=1, allow_insecure_tls=False):
    """Fetch once per URL, obeying a minimum 1.5s gap for every external host.

    ``allow_insecure_tls`` is deliberately opt-in for two VMG pages whose public
    server currently omits an intermediate certificate in this sandbox. It does
    not change the HTTP-200, own-host, or visible-identity acceptance tests.
    """
    path = CACHE / cache_name(prefix, url)
    if path.exists():
        return path.read_text(errors="replace")
    host = (urllib.parse.urlparse(url).hostname or "").lower()
    # Candidate pages are reviewed in parallel, but this lock makes the cache and
    # the 1.5-second request interval global per external host, not per worker.
    with host_locks[host]:
        if path.exists():
            return path.read_text(errors="replace")
        remaining = HOST_DELAY_SECONDS - (time.monotonic() - last_request_at.get(host, -10**9))
        if remaining > 0:
            time.sleep(remaining)
        request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept-Language": "lt,en;q=0.8"})
        try:
            context = ssl._create_unverified_context() if allow_insecure_tls else None
            with urllib.request.urlopen(request, timeout=timeout, context=context) as response:
                status = response.status
                final_url = response.url
                content_type = response.headers.get("Content-Type", "")
                body = response.read(2_000_000).decode("utf-8", "replace")
                value = "STATUS: %s\nFINAL_URL: %s\nCONTENT_TYPE: %s\n\n%s" % (status, final_url, content_type, body)
        except Exception as exc:
            value = "REQUEST_ERROR: %r" % (exc,)
        finally:
            last_request_at[host] = time.monotonic()
        path.write_text(value)
        return value


def plain(value):
    value = html.unescape(re.sub(r"<script[\s\S]*?</script>|<style[\s\S]*?</style>", " ", value, flags=re.I))
    value = re.sub(r"<[^>]+>", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def normalized(value):
    value = unicodedata.normalize("NFKD", value or "").encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", " ", value).strip()


def identity_terms(record):
    # Keep the complete legal/trading form for strict text identity and retain a
    # corporation-free variant for pages whose footer gives the legal entity without
    # the Lithuanian corporate abbreviation.
    result = []
    for candidate in (record.get("legal_name") or "", record.get("trading_name") or ""):
        candidate = normalized(candidate)
        if candidate and candidate not in result:
            result.append(candidate)
        reduced = " ".join(word for word in candidate.split() if word not in CORPORATE_WORDS)
        if len(reduced) >= 4 and reduced not in result:
            result.append(reduced)
    return result


def query_for(record):
    name = record.get("trading_name") or record.get("legal_name") or ""
    parts = ['"%s"' % name]
    if record.get("company_code"):
        parts.append(record["company_code"])
    if record.get("city"):
        parts.append(record["city"])
    parts.append("official website")
    return " ".join(parts)


def host_rejected(url):
    host = (urllib.parse.urlparse(url).hostname or "").lower().removeprefix("www.")
    return not host or any(part in host for part in REJECT_HOST_PARTS)


def canonical(url):
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        return None
    return urllib.parse.urlunparse((parsed.scheme.lower(), parsed.netloc.lower(), parsed.path or "/", "", "", ""))


def ddg_candidates(search_html):
    # DuckDuckGo result links are /l/?uddg=<encoded-url>; only public result URLs
    # are candidates. Search engine/advertising links cannot be accepted.
    urls = []
    for href in re.findall(r'href=["\']([^"\']+)', search_html, flags=re.I):
        href = html.unescape(href)
        parsed = urllib.parse.urlparse(href)
        if parsed.path.startswith("/l/"):
            href = urllib.parse.parse_qs(parsed.query).get("uddg", [""])[0]
        candidate = canonical(href)
        if candidate and not host_rejected(candidate) and candidate not in urls:
            urls.append(candidate)
    return urls[:8]


def directory_stem(record):
    words = [word for word in normalized(record.get("trading_name") or record.get("legal_name") or "").split() if word not in CORPORATE_WORDS]
    return "_".join(words)


def directory_candidate(record):
    """Use a public company-directory page only to nominate an outbound own-site URL.
    The directory is never stored as the website and its exact company code is required.
    """
    stem = directory_stem(record)
    if not stem or not record.get("company_code"):
        return None, []
    directory_url = "https://rekvizitai.vz.lt/en/company/%s/" % stem
    response = fetch(directory_url, "directory", timeout=0.25)
    status, _, body = status_and_body(response)
    if status != 200 or record["company_code"] not in plain(body):
        return None, [directory_url]
    # The directory's Website label is public discovery evidence. Extract its adjacent
    # outbound href or visible URL, then force official-site verification below.
    match = re.search(r"Website[\s\S]{0,1200}?href=[\"'](https?://[^\"'<>\s]+)", body, flags=re.I)
    if not match:
        match = re.search(r"Website\s*(?:</[^>]+>\s*)*(https?://[^\s<]+)", plain(body), flags=re.I)
    candidate = canonical(html.unescape(match.group(1)).rstrip(".,;")) if match else None
    return (candidate if candidate and not host_rejected(candidate) else None), [directory_url]


def direct_candidates(record):
    # Direct domain probes are deliberately limited and only use distinctive name
    # tokens, so they complement rather than replace public-search discovery.
    text = normalized(record.get("trading_name") or record.get("legal_name") or "")
    words = [w for w in text.split() if w not in CORPORATE_WORDS and len(w) >= 4]
    if not words:
        return []
    stem = "-".join(words[:3])
    if len(stem) < 4 or stem.isdigit():
        return []
    return ["https://%s.%s/" % (stem, suffix) for suffix in ("lt", "com", "eu")]


def status_and_body(response):
    match = re.match(r"STATUS: (\d+)\nFINAL_URL: ([^\n]+)\nCONTENT_TYPE: ([^\n]*)\n\n", response)
    if not match:
        return None, None, ""
    return int(match.group(1)), match.group(2), response[match.end():]


def page_proves_identity(body, record):
    text = normalized(plain(body))
    if record.get("company_code") and record["company_code"] in text:
        return True
    # A full legal/trading identity must be visibly named. A stripped identity is
    # accepted only when it has at least two substantive words; this prevents broad
    # single-word/name collisions.
    for term in identity_terms(record):
        if len(term.split()) >= 2 and term in text:
            return True
    return False


def inspect_candidate(candidate, record):
    response = fetch(candidate, "site")
    status, final_url, body = status_and_body(response)
    checked = [candidate]
    if status == 200 and page_proves_identity(body, record) and not host_rejected(final_url or candidate):
        return canonical(final_url or candidate), canonical(final_url or candidate), checked
    # Legal/contact routes on the same official host frequently name the Lithuanian
    # entity even when the landing page presents only a group brand.
    if status == 200 and final_url and not host_rejected(final_url):
        base = urllib.parse.urlunparse((urllib.parse.urlparse(final_url).scheme, urllib.parse.urlparse(final_url).netloc, "", "", "", ""))
        for path in ("/contacts", "/kontaktai"): # targeted legal/contact checks only; full evidence is still required
            legal_url = base + path
            legal_response = fetch(legal_url, "site")
            checked.append(legal_url)
            legal_status, legal_final, legal_body = status_and_body(legal_response)
            if legal_status == 200 and page_proves_identity(legal_body, record) and not host_rejected(legal_final or legal_url):
                return canonical(base + "/"), canonical(legal_final or legal_url), checked
    return None, None, checked


def load_records():
    records = []
    page = 1
    while True:
        params = urllib.parse.urlencode({"filter": FILTER, "sort": "-revenue_eur_latest,slug", "page": page, "perPage": 100})
        response = fetch(API + "?" + params, "pocketbase")
        _, _, body = status_and_body(response)
        payload = json.loads(body)
        records.extend(payload["items"])
        if page >= payload["totalPages"]:
            break
        page += 1
    if len(records) != 543:
        raise RuntimeError("baseline changed; expected 543 records, received %s" % len(records))
    return records


def prior_results():
    if not OUT.exists():
        return {}
    try:
        payload = json.loads(OUT.read_text())
        return {row["slug"]: row for row in payload.get("results", []) if row.get("checked_date") == CHECKED_DATE}
    except Exception:
        return {}


def result_for(record):
    query = query_for(record)
    search_url = "https://html.duckduckgo.com/html/?" + urllib.parse.urlencode({"q": query})
    search_page = fetch(search_url, "search")
    candidates = ddg_candidates(search_page)
    directory_url, directory_checked = directory_candidate(record)
    if directory_url and directory_url not in candidates:
        candidates.insert(0, directory_url)
    for direct in direct_candidates(record):
        if direct not in candidates:
            candidates.append(direct)
    checked = ["query:" + query, search_url] + directory_checked
    # Independent candidate hosts can be inspected concurrently. fetch() retains a
    # shared host lock, so parallelism never weakens the 1.5-second per-host limit.
    with ThreadPoolExecutor(max_workers=4) as workers:
        inspections = list(workers.map(lambda candidate: inspect_candidate(candidate, record), candidates))
    for website, evidence, inspected in inspections:
        checked.extend(inspected)
        if website:
            return {
                "slug": record["slug"], "legal_name": record.get("legal_name") or "", "trading_name": record.get("trading_name") or "",
                "company_code": record.get("company_code") or "", "city": record.get("city") or "",
                "website": website, "website_source_url": evidence, "status": "found", "result": "found",
                "checked_date": CHECKED_DATE, "checked_sources": checked,
                "evidence_note": "HTTP 200 official-site page visibly identifies the legal/trading entity or its company code; directory, marketplace, job and social domains were excluded."
            }
    return {
        "slug": record["slug"], "legal_name": record.get("legal_name") or "", "trading_name": record.get("trading_name") or "",
        "company_code": record.get("company_code") or "", "city": record.get("city") or "",
        "website": None, "website_source_url": None, "status": "not_found", "result": "not_found",
        "checked_date": CHECKED_DATE, "checked_sources": checked,
        "evidence_note": "No reviewed public-search or sensible direct-domain candidate met all acceptance tests: HTTP 200, visible legal/trading-entity (or company-code) identity, and an own-business domain."
    }


def corrective_result(row, target):
    """Re-check one previously audited not-found row against a reviewed own-site URL."""
    if row.get("status") != "not_found":
        raise RuntimeError("corrective target is not an existing not_found row: %s" % row.get("slug"))
    # VMG's public server omits an intermediate certificate for this runner; its
    # two narrowly enumerated pages are still independently checked for HTTP 200
    # and visible entity identity, not accepted on TLS failure alone.
    insecure_tls = target.get("allow_insecure_tls", False)
    cache_prefix = "correction-site-insecure" if insecure_tls else "correction-site"
    evidence_response = fetch(target["evidence_url"], cache_prefix, timeout=CORRECTIVE_TIMEOUT_SECONDS, allow_insecure_tls=insecure_tls)
    evidence_status, evidence_final, evidence_body = status_and_body(evidence_response)
    website_response = fetch(target["website"], cache_prefix, timeout=CORRECTIVE_TIMEOUT_SECONDS, allow_insecure_tls=insecure_tls)
    website_status, website_final, _ = status_and_body(website_response)
    evidence_url = canonical(evidence_final or target["evidence_url"])
    website = canonical(website_final or target["website"])
    if (evidence_status != 200 or website_status != 200 or not evidence_url or not website or
            host_rejected(evidence_url) or host_rejected(website) or
            not page_proves_identity(evidence_body, row)):
        raise RuntimeError("corrective candidate failed HTTP-200, own-site, or visible-identity checks: %s" % row["slug"])
    updated = dict(row)
    updated.update({
        "website": website,
        "website_source_url": evidence_url,
        "status": "found",
        "result": "found",
        "checked_date": CHECKED_DATE,
        "identity_evidence": target["identity_evidence"],
        "evidence_note": "Targeted corrective review after the complete 543-row audit: a longer-timeout HTTP 200 own-site check visibly identifies the exact legal/trading entity or company code; directory, marketplace, job and social domains remain excluded.",
    })
    updated["checked_sources"] = list(row.get("checked_sources", [])) + [
        "targeted_corrective_review:" + target["evidence_url"],
        evidence_url,
        website,
    ]
    # Preserve order while making the second run byte-for-byte stable.
    updated["checked_sources"] = list(dict.fromkeys(updated["checked_sources"]))
    return updated


def run_corrective():
    if not OUT.exists():
        raise RuntimeError("corrective mode requires the complete existing manifest")
    payload = json.loads(OUT.read_text())
    results = payload.get("results")
    if not isinstance(results, list) or len(results) != 543:
        raise RuntimeError("corrective mode requires the complete 543-row manifest")
    by_slug = {row.get("slug"): row for row in results}
    if len(by_slug) != len(results) or set(CORRECTIVE_TARGETS) - set(by_slug):
        raise RuntimeError("corrective targets do not match the existing audit")
    changed = []
    for slug, target in CORRECTIVE_TARGETS.items():
        row = by_slug[slug]
        if row.get("status") == "found" and row.get("identity_evidence") == target["identity_evidence"]:
            continue
        by_slug[slug] = corrective_result(row, target)
        changed.append(slug)
    results = [by_slug[row["slug"]] for row in results]
    found = sum(row.get("status") == "found" for row in results)
    payload["method"] = (
        "Complete 543-record baseline audit retained. Targeted corrective review rechecked only existing "
        "not_found rows, highest revenue first, using public search/direct own-business or group-country "
        "entity pages with a 10-second HTTP timeout. A correction is accepted only with HTTP 200, an "
        "own-site host outside directory/social exclusions, and visible exact legal/trading entity or company-code identity."
    )
    payload["correction"] = {
        "checked_date": CHECKED_DATE,
        "scope": "15 existing not_found rows changed to found; all other 543-row audit results retained unchanged.",
        "timeout_seconds": CORRECTIVE_TIMEOUT_SECONDS,
        "acceptance": "HTTP 200, own-business or qualifying group-country entity page, and visible exact legal/trading entity or company-code identity. VMG's two public pages use a narrowly scoped local TLS-chain workaround while retaining all acceptance checks.",
    }
    payload["counts"] = {"total": len(results), "found": found, "not_found": len(results) - found}
    payload["results"] = results
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"manifest": str(OUT), "corrected": len(changed), "found": found, "slugs": changed}, indent=2))


def write_manifest(records, results):
    # A partial checkpoint is deliberately valid JSON and is used only to resume.
    # The migration rejects it because total/results must equal target_count.
    rows = [results[record["slug"]] for record in records if record["slug"] in results]
    found = sum(row["status"] == "found" for row in rows)
    OUT.write_text(json.dumps({
        "method": "Paginated live PocketBase baseline in descending revenue order; resumable raw-response cache outside git; public DuckDuckGo search using legal/trading name, company code and city, plus limited direct-domain checks. Every external host is rate-limited to at least 1.5 seconds. A website is accepted only after HTTP 200 and visible legal/trading entity or company-code identity on the business's own site; directory, aggregator, marketplace, job and social domains are rejected.",
        "baseline": {"filter": FILTER, "checked_date": CHECKED_DATE, "target_count": len(records), "sort": "-revenue_eur_latest,slug"},
        "counts": {"total": len(rows), "found": found, "not_found": len(rows) - found},
        "results": rows
    }, ensure_ascii=False, indent=2) + "\n")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--corrective", action="store_true", help="recheck only the reviewed existing not-found correction targets")
    args = parser.parse_args()
    if args.corrective:
        run_corrective()
        return
    records = load_records()
    results = prior_results()
    # Preserve only results still in the exact baseline. Re-running safely continues
    # at the first unfinished record without revisiting already cached sources.
    target_slugs = {record["slug"] for record in records}
    results = {slug: row for slug, row in results.items() if slug in target_slugs}
    pending = [record for record in records if record["slug"] not in results]
    # Searches still serialize through fetch's search-host lock at 1.5 seconds, while
    # independent candidate domains are allowed to progress in parallel. Each finished
    # result is checkpointed so interruption simply resumes from this manifest/cache.
    with ThreadPoolExecutor(max_workers=64) as workers:
        futures = {workers.submit(result_for, record): record for record in pending}
        for number, future in enumerate(as_completed(futures), len(results) + 1):
            record = futures[future]
            results[record["slug"]] = future.result()
            write_manifest(records, results)
            print("%s/%s %s %s" % (number, len(records), results[record["slug"]]["status"], record["slug"]), flush=True)
    write_manifest(records, results)
    print(json.dumps({"manifest": str(OUT), "cache": str(CACHE), "records": len(records), "found": sum(row["status"] == "found" for row in results.values())}, indent=2))


if __name__ == "__main__":
    main()
