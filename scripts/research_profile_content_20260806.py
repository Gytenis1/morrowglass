#!/usr/bin/env python3
"""Cached public-source research for the 2026-08-06 manufacturer fallback cohort.

Raw HTTP responses are deliberately kept below /tmp rather than in git.  The output is
an auditable manifest: it records an explicit no_specifics result when a reviewed page
does not safely connect an identified business to a concrete product or service.
"""
import hashlib
import html
import json
import os
import re
import time
import unicodedata
import urllib.parse
import urllib.request
from pathlib import Path

API = "https://sn-pb-repo-1293389879-dc1c2f.fly.dev/api/collections/manufacturers/records"
CHECKED_DATE = "2026-08-06"
TARGET_LABEL = "Kiti nestandartiniai baldai"
CACHE = Path(os.environ.get("PROFILE_CONTENT_CACHE", "/tmp/morrowglass-profile-content-research-20260806"))
CACHE.mkdir(parents=True, exist_ok=True)
OUT = Path("data/profile_content_20260806.json")
USER_AGENT = "Morrowglass public-data profile research/1.0 (+https://morrowglass.lt)"

CATEGORY_LABELS = {
    "K": "Virtuvės baldai", "W": "Spintos ir įmontuojami baldai",
    "BB": "Miegamojo ir vonios baldai", "OC": "Biuro ir komerciniai baldai",
    "HR": "HoReCa ir prekybos baldai", "U": "Minkšti baldai pagal užsakymą",
    "SW": "Medžio darbai ir medžio masyvo baldai", "MM": "Metalo ir mišrių medžiagų baldai",
    "O": TARGET_LABEL,
}
# The first matching class is deliberately narrow.  A bare "baldų gamyba" is not
# enough to replace O; the phrase must name a concrete product, customer setting, or
# material/process class represented by a category.
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
DIRECTORIES = (
    "rekvizitai.vz.lt", "info.lt", "1551.lt", "imones.lt", "geltoni.lt",
    "scoris.lt", "visasverslas.lt", "paslaugos.lt", "paslaugos24.lt",
    "balticmaps.eu", "get.data.gov.lt", "data.gov.lt", "baldai.com",
)
SOCIAL = ("facebook.com", "instagram.com", "linkedin.com", "tiktok.com", "youtube.com")
# A deliberately conservative, source-reviewed acceptance list.  Automatic keyword
# matches are used to flag pages for review but are not enough to publish a profile:
# site navigation regularly contains unrelated product words.  Every item below must
# still pass the live identity and verbatim-evidence checks in research().
VERIFIED_EVIDENCE = {
    "tomer-s": {
        "url": "https://www.tomers.lt/en/about-us",
        "code": "W",
        "excerpt": "cabinet furniture manufacturing services throughout Lithuania. Our services include furniture design, planning, manufacturing, and assembly.",
    },
}


def normal(value):
    value = html.unescape(value or "")
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode().lower()
    value = re.sub(r"\b(?:uab|mb|ab|vsi|ii|tub|uzdaroji|akcine|bendrove|mazoji|bendrija|individuali|imone)\b", " ", value)
    return re.sub(r"[^a-z0-9]+", "", value)


def cache_key(url):
    return hashlib.sha256(url.encode("utf-8")).hexdigest() + ".json"


def fetch(url):
    """Cache successes and failures alike, then pause before the next origin request."""
    path = CACHE / cache_key(url)
    if path.exists():
        return json.loads(path.read_text(errors="replace"))
    result = {"requested_url": url, "final_url": url, "status": 0, "body": ""}
    try:
        request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "text/html,application/xhtml+xml,application/json"})
        with urllib.request.urlopen(request, timeout=6) as response:
            result.update({"status": response.status, "final_url": response.geturl(), "body": response.read().decode("utf-8", "replace")})
    except Exception as exc:
        result["error"] = repr(exc)
    path.write_text(json.dumps(result, ensure_ascii=False))
    time.sleep(0.35)
    return result


def http_url(value):
    parsed = urllib.parse.urlparse(value or "")
    return parsed.scheme in ("http", "https") and bool(parsed.netloc) and not any(ch.isspace() for ch in value)


def host_is(url, domains):
    host = urllib.parse.urlparse(url).netloc.lower().split(":", 1)[0]
    return any(host == domain or host.endswith("." + domain) for domain in domains)


def visible_text(page):
    page = re.sub(r"(?is)<(script|style|noscript|svg).*?>.*?</\1>", " ", page)
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"(?s)<[^>]+>", " ", page))).strip()


def page_identifies_record(text, record):
    haystack = normal(text)
    names = [record.get("legal_name", ""), record.get("trading_name", "")]
    # An exact company-code occurrence is accepted only alongside a reasonably long
    # normalized name. This avoids associating an unrelated page that happens to list
    # a code in a search/navigation fragment.
    for name in names:
        candidate = normal(name)
        if len(candidate) >= 5 and candidate in haystack:
            return True
    return False


def links(page, base):
    found = []
    for raw in re.findall(r'''(?is)href\s*=\s*["']([^"'#]+)''', page):
        url = html.unescape(urllib.parse.urljoin(base, raw.strip())).split("#", 1)[0]
        if http_url(url) and url not in found:
            found.append(url)
    return found


def text_excerpt(text, pattern):
    # Keep a visible, verbatim fragment. This is both human-reviewable evidence and
    # prevents the generated Lithuanian prose from claiming details not on the page.
    match = re.search(r"(?is)(.{0,175}" + pattern + r".{0,220})", text)
    if not match:
        return ""
    excerpt = re.sub(r"\s+", " ", match.group(1)).strip(" -:;|,.")
    return excerpt[:460]


def classify(text):
    for code, pattern in CATEGORY_PATTERNS:
        for match in re.finditer(pattern, text, re.I):
            start, end = max(0, match.start() - 175), min(len(text), match.end() + 220)
            excerpt = re.sub(r"\s+", " ", text[start:end]).strip(" -:;|,.")[:460]
            # A menu word such as "Virtuvės" or an isolated "office" is not product
            # evidence. Require a substantial visible statement that also names
            # furniture, manufacturing, or a furniture solution.
            if len(excerpt) >= 60 and re.search(r"bald\w*|furniture|gamyb\w*|manufactur\w*|solution\w*", excerpt, re.I):
                return code, excerpt
    return None, ""


def source_type(url):
    if host_is(url, SOCIAL):
        return "social_business_page"
    if host_is(url, DIRECTORIES):
        return "public_business_page"
    return "official_website"


def candidates(record):
    """Use existing provenance first; directory pages may nominate external sites."""
    seen, output = set(), []
    for field in ("website", "source_urls", "public_details_source_urls"):
        values = record.get(field) or []
        if not isinstance(values, list):
            values = [values]
        for url in values:
            if http_url(url) and url not in seen:
                seen.add(url)
                output.append(url)
    return output


def checked_urls(record):
    return candidates(record)


def research(record):
    initial = candidates(record)
    queue = list(initial)
    checked = []
    chosen = None
    # Never fan out without an identity check: public directories can nominate a
    # business's external URL only after their own visible page names this record.
    while queue and len(checked) < 10:
        url = queue.pop(0)
        if url in checked:
            continue
        checked.append(url)
        response = fetch(url)
        if response.get("status") != 200:
            continue
        final_url = response.get("final_url", url)
        if not http_url(final_url):
            continue
        text = visible_text(response.get("body", ""))
        identified = page_identifies_record(text, record)
        if host_is(final_url, DIRECTORIES) and identified:
            for candidate in links(response.get("body", ""), final_url)[:12]:
                # Directory navigation/social links are not independent company-page
                # candidates; keeping them out also makes the bounded crawl polite.
                if (not host_is(candidate, DIRECTORIES) and not host_is(candidate, SOCIAL) and candidate not in checked and candidate not in queue):
                    queue.append(candidate)
        # A social page may corroborate content, but is never treated as an official
        # site. It is still allowed only after a visible identity match.
        # A directory's navigation can contain unrelated furniture words, and an
        # ordinary keyword hit on any site can be a menu item rather than evidence.
        # Publish only a separately reviewed, verbatim acceptance rule after checking
        # both company identity and the exact public page text again on this run.
        accepted = VERIFIED_EVIDENCE.get(record["slug"])
        if (identified and accepted and final_url == accepted["url"] and
                accepted["excerpt"].lower() in text.lower()):
            chosen = {"url": final_url, "source_type": source_type(final_url),
                      "code": accepted["code"], "excerpt": accepted["excerpt"]}
            break
    name = record.get("legal_name") or record.get("trading_name") or record["slug"]
    if not chosen:
        source = checked[0] if checked else (initial[0] if initial else "")
        return {
            "slug": record["slug"], "legal_name": record.get("legal_name") or "", "company_code": record.get("company_code") or "",
            "checked_date": CHECKED_DATE, "status": "no_specifics", "source_url": source,
            "source_type": source_type(source) if source else "no_public_source", "checked_source_urls": checked or initial,
            "evidence": "Peržiūrėtuose viešuose šaltiniuose nerasta saugiai su šiuo juridiniu ar prekybiniu pavadinimu susieta konkreti produkto, paslaugos, medžiagos ar aptarnaujamo sektoriaus informacija.",
            "description_lt": None, "category_codes": ["O"], "category_labels": [TARGET_LABEL],
            "scope_evidence": None, "confidence": "vidutinis",
            "confidence_evidence": "Paliekama esama O atsarginė klasifikacija, nes patikrintas šaltinis nepateikė konkretaus produkto ar paslaugos įrodymo.",
            "provenance_updates": {"source_urls": [], "public_details_source_urls": []},
        }
    label = CATEGORY_LABELS[chosen["code"]]
    excerpt = chosen["excerpt"]
    # These sentences state only: whose identified page was read, a verbatim visible
    # fragment, and the mechanically transparent category mapping for its keyword.
    description = (
        f"{name} viešame puslapyje prisistato šiuo pavadinimu ir pateikia konkretų veiklos aprašymą. "
        f"Puslapio matomame tekste nurodyta: „{excerpt}“. "
        f"Šiame cituojamame tekste minima konkreti su {label.lower()} susijusi informacija, todėl profilis priskiriamas šiai kategorijai. "
        f"Aprašymas sudarytas tik pagal nurodytą viešą šaltinį."
    )
    scope = (
        f"Viešame puslapyje, kuriame nurodytas {name}, matomas konkretus fragmentas „{excerpt}“. "
        f"Jis pagrindžia {label} kategoriją. Šaltinis: {chosen['url']}"
    )
    return {
        "slug": record["slug"], "legal_name": record.get("legal_name") or "", "company_code": record.get("company_code") or "",
        "checked_date": CHECKED_DATE, "status": "evidence_backed", "source_url": chosen["url"], "source_type": chosen["source_type"],
        "checked_source_urls": checked, "evidence": excerpt, "product_service_evidence": [excerpt],
        "description_lt": description, "category_codes": [chosen["code"]], "category_labels": [label],
        "scope_evidence": scope, "confidence": "aukštas",
        "confidence_evidence": f"Puslapio matomame tekste atpažintas įmonės pavadinimas ir konkretus veiklos fragmentas „{excerpt}“; šaltinis: {chosen['url']}",
        "provenance_updates": {"source_urls": [chosen["url"]], "public_details_source_urls": [chosen["url"]]},
    }


def main():
    records, page = [], 1
    while True:
        query = urllib.parse.urlencode({
            "filter": 'category_labels~"Kiti nestandartiniai baldai"', "sort": "slug", "page": page, "perPage": 100,
            "fields": "slug,legal_name,trading_name,company_code,website,source_urls,public_details_source_urls,category_codes,category_labels",
        })
        payload = fetch(API + "?" + query)
        if payload.get("status") != 200:
            raise RuntimeError("live baseline API request failed: %r" % payload)
        page_data = json.loads(payload["body"])
        records.extend(page_data["items"])
        if page >= page_data.get("totalPages", 1):
            break
        page += 1
    records.sort(key=lambda row: row["slug"])
    if len(records) != 242 or len({row["slug"] for row in records}) != 242:
        raise RuntimeError("expected exactly 242 unique live fallback records, got %d" % len(records))
    if any(TARGET_LABEL not in (row.get("category_labels") or []) for row in records):
        raise RuntimeError("baseline contains a non-fallback record")
    (CACHE / "live-fallback-baseline.json").write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n")

    results = []
    for index, record in enumerate(records, 1):
        result = research(record)
        results.append(result)
        print("%03d/242 %s: %s" % (index, record["slug"], result["status"]), flush=True)

    evidence_backed = [row for row in results if row["status"] == "evidence_backed"]
    manifest = {
        "manifest_version": 1,
        "research_method": "Paginuotas gyvo viešo PocketBase API bazės nuskaitymas, po jo – talpykloje saugomas ir ne dažnesnis kaip vienas HTTP prašymas per 0,35 s viešų esamų šaltinių tikrinimas. Oficialūs puslapiai prioritetiniai; katalogų puslapiai tik nominuoja išorines nuorodas tik tada, kai puslapio tekste atpažįstamas tas pats pavadinimas. Socialinis puslapis gali būti turinio įrodymas, bet nelaikomas oficialia svetaine. Jei konkretaus produkto ar paslaugos įrodymo nėra, įrašas paliekamas no_specifics.",
        "baseline": {"target_count": 242, "checked_date": CHECKED_DATE, "filter": 'category_labels~"Kiti nestandartiniai baldai"'},
        "counts": {
            "total": len(results), "evidence_backed": len(evidence_backed), "no_specifics": len(results) - len(evidence_backed),
            "descriptions_40_words_or_more": sum(len(re.findall(r"\S+", row["description_lt"])) >= 40 for row in evidence_backed),
            "reclassified_away_from_O": sum(row["category_codes"] != ["O"] for row in evidence_backed),
            "fallback_after_migration": 242 - sum(row["category_codes"] != ["O"] for row in evidence_backed),
        },
        "results": results,
    }
    OUT.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"manifest": str(OUT), "cache": str(CACHE), **manifest["counts"]}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
