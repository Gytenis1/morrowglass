#!/usr/bin/env python3
"""Crawl validated stored manufacturer websites for concrete profile evidence.

The stored ``website`` field was separately audited as the official website.  This
script does not nominate alternative sites: it reads that validated root and up to
six relevant same-site pages. HTTP responses are cached below /tmp, making a
stopped run restartable without repeating polite web
requests.  The JSON manifest is intended as input to a later, separately reviewed
migration; this script never writes to the live API.
"""
import hashlib
import html
import json
import os
import re
import time
import urllib.parse
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

API = "https://sn-pb-repo-1293389879-dc1c2f.fly.dev/api/collections/manufacturers/records"
CHECKED_DATE = "2026-08-06"
TARGET_LABEL = "Kiti nestandartiniai baldai"
CACHE = Path(os.environ.get("PROFILE_CONTENT_WEBSITES_CACHE", "/tmp/morrowglass-profile-content-websites-20260806"))
OUT = Path("data/profile_content_websites_20260806.json")
USER_AGENT = "Morrowglass validated-website profile research/1.0 (+https://morrowglass.lt)"
REQUEST_PAUSE_SECONDS = 0.45
MAX_INTERNAL_PAGES = 6

# Keep this taxonomy exactly aligned with research_profile_content_20260806.py.
CATEGORY_LABELS = {
    "K": "Virtuvės baldai", "W": "Spintos ir įmontuojami baldai",
    "BB": "Miegamojo ir vonios baldai", "OC": "Biuro ir komerciniai baldai",
    "HR": "HoReCa ir prekybos baldai", "U": "Minkšti baldai pagal užsakymą",
    "SW": "Medžio darbai ir medžio masyvo baldai", "MM": "Metalo ir mišrių medžiagų baldai",
    "O": TARGET_LABEL,
}
CATEGORY_PATTERNS = [
    ("K", r"(?:\bvirtuv\w*.{0,70}\bbald\w*|\bbald\w*.{0,70}\bvirtuv\w*|\bkitchen.{0,70}\bfurniture)"),
    ("W", r"(?:\bspint\w*.{0,70}\bbald\w*|\bbald\w*.{0,70}\bspint\w*|\bwardrobe.{0,70}\bfurniture|\bcabinet furniture)"),
    ("BB", r"(?:\bmiegam\w*.{0,70}\bbald\w*|\bvonios.{0,70}\bbald\w*|\bbedroom furniture|\bbathroom furniture)"),
    ("OC", r"(?:\bbiur\w*.{0,70}\bbald\w*|\bbald\w*.{0,70}\bbiur\w*|\boffice furniture|\bcommercial furniture)"),
    ("HR", r"(?:\bho\s*re\s*ca.{0,70}\bbald\w*|\brestoran\w*.{0,70}\bbald\w*|\bviesbuč\w*.{0,70}\bbald\w*|\bprekyb\w*.{0,70}\bbald\w*|\bretail furniture)"),
    ("U", r"(?:\bminkšt\w*.{0,70}\bbald\w*|\bsofa\w*.{0,70}\bfurniture|\bupholstered furniture)"),
    ("SW", r"(?:\bmedžio.{0,70}\bbald\w*|\bmedin\w*.{0,70}\bbald\w*|\bwood.{0,70}\bfurniture|\bmasyvo.{0,70}\bbald\w*|\bstaliaus.{0,70}\bbald\w*)"),
    ("MM", r"(?:\bmetal\w*.{0,70}\bbald\w*|\bbald\w*.{0,70}\bmetal\w*|\bmetal furniture)"),
]
LINK_HINT = re.compile(r"produkc|gamin|bald|paslaug|katalog|apie|about|products?|services?|portfolio|galerij", re.I)
# Stored URLs on public catalogues and social platforms are retained for an auditable
# crawl, but they are not a maker's owned website and may never provide profile
# evidence. Keep this boundary aligned with research_profile_content_20260806.py.
DIRECTORY_HOSTS = (
    "info.lt", "rekvizitai.vz.lt", "1551.lt", "imones.lt", "geltoni.lt",
    "scoris.lt", "visasverslas.lt", "paslaugos.lt", "paslaugos24.lt",
    "balticmaps.eu", "get.data.gov.lt", "data.gov.lt", "baldai.com",
)
SOCIAL_HOSTS = ("facebook.com", "instagram.com", "linkedin.com", "tiktok.com", "youtube.com", "x.com", "twitter.com")


class PageParser(HTMLParser):
    """Extract visible text plus anchor destinations/text without third-party HTML tools."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.hidden_depth = 0
        self.text = []
        self.anchors = []
        self._href = None
        self._anchor_text = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag.lower() in {"script", "style", "noscript", "svg", "template", "nav", "footer"}:
            self.hidden_depth += 1
        if tag.lower() == "a":
            self._href = attrs.get("href")
            self._anchor_text = []

    def handle_startendtag(self, tag, attrs):
        return None

    def handle_endtag(self, tag):
        if tag.lower() in {"script", "style", "noscript", "svg", "template", "nav", "footer"} and self.hidden_depth:
            self.hidden_depth -= 1
        if tag.lower() == "a" and self._href is not None:
            self.anchors.append((self._href, " ".join(self._anchor_text)))
            self._href = None
            self._anchor_text = []

    def handle_data(self, data):
        if not self.hidden_depth:
            # Anchor labels drive crawling only.  They are navigation/listing text,
            # not product evidence for a company profile.
            if self._href is None:
                self.text.append(data)
            else:
                self._anchor_text.append(data)


def cache_key(value):
    return hashlib.sha256(value.encode("utf-8")).hexdigest() + ".json"


def fetch(url):
    """Cache successful and failed HTTP responses before observing the global pause."""
    path = CACHE / "responses" / cache_key(url)
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8", errors="replace"))
    result = {"requested_url": url, "final_url": url, "status": 0, "body": ""}
    try:
        request = urllib.request.Request(
            url, headers={"User-Agent": USER_AGENT, "Accept": "text/html,application/xhtml+xml"}
        )
        with urllib.request.urlopen(request, timeout=12) as response:
            result.update({
                "status": response.status,
                "final_url": response.geturl(),
                "content_type": response.headers.get("Content-Type", ""),
                "body": response.read(1_500_000).decode("utf-8", "replace"),
            })
    except Exception as exc:  # failures are auditable and should not be retried on resume
        result["error"] = repr(exc)
    path.write_text(json.dumps(result, ensure_ascii=False), encoding="utf-8")
    time.sleep(REQUEST_PAUSE_SECONDS)
    return result


def http_url(value):
    parsed = urllib.parse.urlparse((value or "").strip())
    return parsed.scheme in ("http", "https") and bool(parsed.netloc) and not any(ch.isspace() for ch in value)


def clean_url(value):
    parsed = urllib.parse.urlsplit(value)
    return urllib.parse.urlunsplit((parsed.scheme.lower(), parsed.netloc.lower(), parsed.path or "/", parsed.query, ""))


def host(url):
    return urllib.parse.urlsplit(url).hostname.lower() if urllib.parse.urlsplit(url).hostname else ""


def host_is(url, domains):
    current = host(url).removeprefix("www.")
    return any(current == domain or current.endswith("." + domain) for domain in domains)


def source_type(url):
    if host_is(url, SOCIAL_HOSTS):
        return "social_business_page"
    if host_is(url, DIRECTORY_HOSTS):
        return "public_business_page"
    return "official_website"


def same_site(candidate, root):
    """Allow the usual www/non-www equivalent but do not leave the validated site."""
    candidate_host, root_host = host(candidate), host(root)
    if candidate_host.startswith("www."):
        candidate_host = candidate_host[4:]
    if root_host.startswith("www."):
        root_host = root_host[4:]
    return bool(candidate_host) and candidate_host == root_host


def parse_page(body):
    parser = PageParser()
    try:
        parser.feed(body)
        parser.close()
    except Exception:
        pass
    text = re.sub(r"\s+", " ", " ".join(parser.text)).strip()
    return text, parser.anchors


def selected_internal_links(anchors, base_url, root_url, already):
    output = []
    for raw_href, anchor_text in anchors:
        raw_href = html.unescape((raw_href or "").strip())
        if not raw_href or raw_href.startswith(("#", "mailto:", "tel:", "javascript:")):
            continue
        candidate = clean_url(urllib.parse.urljoin(base_url, raw_href))
        # Link destination OR visible anchor label must identify a likely details page.
        if not http_url(candidate) or not same_site(candidate, root_url):
            continue
        if not LINK_HINT.search(candidate + " " + anchor_text):
            continue
        if candidate in already or candidate in output:
            continue
        output.append(candidate)
        if len(output) >= MAX_INTERNAL_PAGES:
            break
    return output


def excerpt_for(text, match):
    start = max(0, match.start() - 150)
    end = min(len(text), match.end() + 260)
    return re.sub(r"\s+", " ", text[start:end]).strip(" -:;|,.")[:500]


def classify(text):
    """Return only categories backed by concrete visible text, never generic gamyba alone."""
    found = []
    for code, pattern in CATEGORY_PATTERNS:
        for match in re.finditer(pattern, text, re.I):
            excerpt = excerpt_for(text, match)
            # Prevent a navigation-only match or the disallowed generic 'baldų gamyba'.
            if len(excerpt) < 60:
                continue
            if not re.search(r"bald\w*|furniture", excerpt, re.I):
                continue
            if code not in [entry["code"] for entry in found]:
                found.append({"code": code, "excerpt": excerpt})
            break
    return found


def listing_contexts(text, record):
    """Keep a directory listing's evidence local to the named company entry."""
    candidates = [record.get("legal_name", ""), record.get("trading_name", "")]
    contexts = []
    for candidate in candidates:
        candidate = re.sub(r"(?i)\b(?:uab|mb|ab|všį|ii|tub)\b", " ", candidate or "")
        candidate = re.sub(r"\s+", " ", candidate).strip()
        if len(candidate) < 4:
            continue
        for match in re.finditer(re.escape(candidate), text, re.I):
            contexts.append(text[max(0, match.start() - 250):min(len(text), match.end() + 900)])
    return contexts


def description(name, evidence):
    labels = ", ".join(CATEGORY_LABELS[item["code"]].lower() for item in evidence)
    quotes = " ".join("„%s“" % item["excerpt"] for item in evidence)
    # Four factual, source-scoped sentences; the quotes provide the concrete evidence.
    return (
        f"{name} svetainės matomame tekste nurodoma: {quotes}. "
        f"Šiame puslapyje tiesiogiai minima informacija, susijusi su {labels}. "
        "Aprašyme pateikiama tik puslapio tekste įvardyta produkto, paslaugos, medžiagos arba klientų aplinkos informacija. "
        "Kitos veiklos ar kategorijos čia nepridedamos, nes jų šis nurodytas šaltinis tiesiogiai nepatvirtina."
    )


def research(record):
    root = (record.get("website") or "").strip()
    name = record.get("legal_name") or record.get("trading_name") or record["slug"]
    crawled = []
    checked_urls = []
    pages = []

    if http_url(root):
        root = clean_url(root)
        response = fetch(root)
        final = clean_url(response.get("final_url", root)) if http_url(response.get("final_url", "")) else root
        crawled.append({"requested_url": root, "final_url": final, "status": response.get("status", 0)})
        checked_urls.extend([root, final])
        if response.get("status") == 200:
            text, anchors = parse_page(response.get("body", ""))
            pages.append({"url": final, "text": text, "source_type": source_type(final)})
            for internal in selected_internal_links(anchors, final, final, set(checked_urls)):
                response = fetch(internal)
                final_internal = clean_url(response.get("final_url", internal)) if http_url(response.get("final_url", "")) else internal
                crawled.append({"requested_url": internal, "final_url": final_internal, "status": response.get("status", 0)})
                checked_urls.extend([internal, final_internal])
                if response.get("status") == 200 and same_site(final_internal, final):
                    text, _ = parse_page(response.get("body", ""))
                    pages.append({"url": final_internal, "text": text, "source_type": source_type(final_internal)})
    else:
        # Keep an auditable non-fetchable stored value while retaining the full cohort.
        checked_urls.append(root)

    checked_urls = list(dict.fromkeys(url for url in checked_urls if url))
    evidence = []
    # Prefer a selected internal details page when it supplies the same category;
    # the stored root remains a fallback source when that is the only concrete text.
    # Public directory/catalogue and social pages are audit-only: even a local company
    # listing cannot enrich this own-site-only manifest.
    for page in pages[1:] + pages[:1]:
        if page["source_type"] != "official_website":
            continue
        for hit in classify(page["text"]):
            hit["source_url"] = page["url"]
            if not any(previous["code"] == hit["code"] for previous in evidence):
                evidence.append(hit)

    if not evidence:
        source = pages[0]["url"] if pages else (checked_urls[0] if checked_urls else "")
        return {
            "slug": record["slug"], "legal_name": record.get("legal_name") or "", "company_code": record.get("company_code") or "",
            "checked_date": CHECKED_DATE, "status": "no_specifics", "source_url": source,
            "source_type": source_type(source) if source else "no_fetchable_website",
            "checked_source_urls": checked_urls, "crawled_pages": crawled,
            "evidence": "Po visų pasiekiamų atrinktų svetainės puslapių peržiūros nerasta konkretaus, kategoriją pagrindžiančio produkto, paslaugos, medžiagos ar klientų aplinkos įrodymo.",
            "product_service_evidence": [], "description_lt": None,
            "category_codes": ["O"], "category_labels": [TARGET_LABEL], "scope_evidence": None,
            "confidence": "vidutinis",
            "confidence_evidence": "Išsaugoma esama O atsarginė klasifikacija, nes visas atliktas svetainės nuskaitymas nepateikė pakankamai konkretaus įrodymo.",
            "provenance_updates": {"source_urls": [], "public_details_source_urls": []},
        }

    codes = [item["code"] for item in evidence]
    labels = [CATEGORY_LABELS[code] for code in codes]
    source_urls = list(dict.fromkeys(item["source_url"] for item in evidence))
    evidence_text = [item["excerpt"] for item in evidence]
    scope = " ".join(
        f"Matomas fragmentas „{item['excerpt']}“ pagrindžia kategoriją {CATEGORY_LABELS[item['code']]}. Šaltinis: {item['source_url']}"
        for item in evidence
    )
    return {
        "slug": record["slug"], "legal_name": record.get("legal_name") or "", "company_code": record.get("company_code") or "",
        "checked_date": CHECKED_DATE, "status": "evidence_backed", "source_url": source_urls[0], "source_type": source_type(source_urls[0]),
        "checked_source_urls": checked_urls, "crawled_pages": crawled,
        "evidence": evidence_text[0], "product_service_evidence": evidence_text,
        "description_lt": description(name, evidence), "category_codes": codes, "category_labels": labels,
        "scope_evidence": scope, "confidence": "aukštas",
        "confidence_evidence": "Kiekvienai priskirtai kategorijai pateiktas konkretus matomo svetainės teksto fragmentas ir jo tikslus puslapio URL.",
        "provenance_updates": {"source_urls": source_urls, "public_details_source_urls": source_urls},
    }


def validate_manifest(manifest):
    results = manifest["results"]
    counts = manifest["counts"]
    if len(results) != manifest["baseline"]["target_count"]:
        raise RuntimeError("manifest total does not equal target count")
    if len({row["slug"] for row in results}) != len(results):
        raise RuntimeError("manifest has duplicate slugs")
    evidence_rows = [row for row in results if row["status"] == "evidence_backed"]
    no_specifics_rows = [row for row in results if row["status"] == "no_specifics"]
    if len(evidence_rows) + len(no_specifics_rows) != len(results):
        raise RuntimeError("manifest has an unknown status")
    if counts["evidence_backed"] != len(evidence_rows) or counts["no_specifics"] != len(no_specifics_rows):
        raise RuntimeError("manifest status counts are inconsistent")
    reclassified = sum(row["category_codes"] != ["O"] for row in results)
    if counts["reclassified_away_from_O"] != reclassified or counts["fallback_after_migration"] != len(results) - reclassified:
        raise RuntimeError("manifest category counts are inconsistent")
    for row in results:
        if row["source_url"] and row["source_url"] not in row["checked_source_urls"]:
            raise RuntimeError("source URL was not crawled for %s" % row["slug"])
        expected_source_type = source_type(row["source_url"]) if row["source_url"] else "no_fetchable_website"
        if row["source_type"] != expected_source_type:
            raise RuntimeError("source type is inconsistent: %s" % row["slug"])
        if row["status"] == "no_specifics":
            if row["category_codes"] != ["O"] or row["description_lt"] is not None:
                raise RuntimeError("no_specifics row changed category or padded prose: %s" % row["slug"])
            continue
        if row["source_type"] != "official_website":
            raise RuntimeError("non-owned source supplied evidence: %s" % row["slug"])
        if not row["product_service_evidence"] or row["category_codes"] == ["O"]:
            raise RuntimeError("evidence row lacks category evidence: %s" % row["slug"])
        if len(re.findall(r"\S+", row["description_lt"])) < 40:
            raise RuntimeError("short evidence description: %s" % row["slug"])
        if len(row["category_codes"]) != len(row["product_service_evidence"]):
            raise RuntimeError("unsupported category count: %s" % row["slug"])
        for url in row["provenance_updates"]["source_urls"]:
            if url not in row["checked_source_urls"]:
                raise RuntimeError("provenance URL was not crawled: %s" % row["slug"])


def main():
    CACHE.mkdir(parents=True, exist_ok=True)
    records, page = [], 1
    while True:
        query = urllib.parse.urlencode({
            "filter": 'category_labels~"Kiti nestandartiniai baldai"', "sort": "slug", "page": page, "perPage": 100,
            "fields": "slug,legal_name,trading_name,company_code,website,category_codes,category_labels",
        })
        payload = fetch(API + "?" + query)
        if payload.get("status") != 200:
            raise RuntimeError("live baseline API request failed: %r" % payload)
        page_data = json.loads(payload["body"])
        records.extend(page_data["items"])
        if page >= page_data.get("totalPages", 1):
            break
        page += 1
    # Target only the live fallback cohort and retain every non-empty stored website.
    records = [row for row in records if row.get("category_labels") == [TARGET_LABEL] and (row.get("website") or "").strip()]
    records.sort(key=lambda row: row["slug"])
    if len({row["slug"] for row in records}) != len(records):
        raise RuntimeError("live target cohort has duplicate slugs")
    (CACHE / "live-fallback-website-baseline.json").write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    results = []
    for index, record in enumerate(records, 1):
        result = research(record)
        results.append(result)
        # Cached responses make an interrupted long crawl safe to restart.
        print("%03d/%03d %s: %s" % (index, len(records), record["slug"], result["status"]), flush=True)

    evidence_rows = [row for row in results if row["status"] == "evidence_backed"]
    reclassified = sum(row["category_codes"] != ["O"] for row in results)
    manifest = {
        "manifest_version": 1,
        "research_method": "Paginuotas gyvo PocketBase tik skaitymo API bazės nuskaitymas; tik esamas audituotas fallback įrašų website laukas; šakninis URL ir iki šešių pagal nuorodos URL arba matomą inkaro tekstą atrinktų tos pačios svetainės produktų, gamybos, baldų, paslaugų, katalogo, apie, portfolio ar galerijos puslapių nuskaitymas. Viešų katalogų ir socialinių platformų URL paliekami tik nuskaitymo auditui ir niekada neteikia profilio įrodymų; kategorijos keičiamos tik pagal gamintojo nuosavos svetainės konkretų matomą puslapio tekstą. HTTP atsakymai saugomi /tmp talpykloje, užklausos ribojamos iki vienos kas 0,45 s.",
        "baseline": {
            "target_count": len(records), "checked_date": CHECKED_DATE,
            "filter": 'category_labels exactly ["Kiti nestandartiniai baldai"] and website is non-empty',
            "api_filter": 'category_labels~"Kiti nestandartiniai baldai"',
        },
        "counts": {
            "total": len(results), "evidence_backed": len(evidence_rows), "no_specifics": len(results) - len(evidence_rows),
            "descriptions_40_words_or_more": sum(len(re.findall(r"\S+", row["description_lt"])) >= 40 for row in evidence_rows),
            "reclassified_away_from_O": reclassified,
            "fallback_after_migration": len(results) - reclassified,
        },
        "results": results,
    }
    validate_manifest(manifest)
    OUT.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"manifest": str(OUT), "cache": str(CACHE), **manifest["counts"]}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
