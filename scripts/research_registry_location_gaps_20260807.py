#!/usr/bin/env python3
"""Research only the 44 official-location gaps from the 2026-08-07 registry import.

Candidates are selected from the committed universe and address-enrichment checkpoints
by their original (company_code, slug) identity.  Legal names are neither loaded nor
used as keys.  Successful official API responses are cached outside the repository so
an interrupted pass resumes without repeating them.
"""
import argparse
import hashlib
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter
from pathlib import Path

CHECKED_DATE = "2026-08-07"
API_BASE = "https://get.data.gov.lt"
ROOT = Path(__file__).resolve().parents[1]
UNIVERSE = ROOT / "data/registry_universe_20260807.json"
ENRICHMENT = ROOT / "data/registry_address_enrichment_20260807.json"
MANIFEST = ROOT / "data/registry_location_gaps_20260807.json"
# /tmp is intentionally outside git.  Successful responses persist across interrupted
# runs on the same worker, while failures are retried rather than treated as evidence.
CACHE = Path("/tmp/morrowglass-registry-location-gaps-20260807")
USER_AGENT = "Morrowglass official-location-gap research/1.0 (+https://morrowglass.lt)"
MIN_HOST_INTERVAL_SECONDS = 0.4
LAST_REQUEST_BY_HOST = {}

JAR_ENTITY_MODEL = "datasets/gov/rc/jar/iregistruoti/JuridinisAsmuo"
JAR_BUVEINE_MODEL = "datasets/gov/rc/jar/buveines/Buveine"
ADDRESS_MODEL = "datasets/gov/rc/ar/adresai/Adresas"
BUILDING_MODEL = "datasets/gov/rc/ar/pastatas/Pastatas"
PREMISES_MODEL = "datasets/gov/rc/ar/patalpa/Patalpa"
LOCALITY_MODEL = "datasets/gov/rc/ar/gyvenamojivietove/GyvenamojiVietove"
STREET_MODEL = "datasets/gov/rc/ar/gatve/Gatve"
MODELS = [JAR_ENTITY_MODEL, JAR_BUVEINE_MODEL, ADDRESS_MODEL, BUILDING_MODEL, PREMISES_MODEL, LOCALITY_MODEL, STREET_MODEL]


def api_url(model, query=""):
    return API_BASE + "/" + model + ("?" + query if query else "")


def record_url(model, record_id):
    return api_url(model, '_id="%s"&limit(2)' % record_id)


def company_code_url(company_code):
    # ja_kodas is numeric in JAR; preserving its numeric predicate is essential.
    return api_url(JAR_ENTITY_MODEL, "ja_kodas=%s&limit(2)" % str(int(company_code)))


def buveine_relation_url(entity_id):
    return api_url(JAR_BUVEINE_MODEL, 'juridinis_asmuo._id="%s"&limit(1000)' % entity_id)


def cache_paths(url):
    digest = hashlib.sha256(url.encode("utf-8")).hexdigest()
    return CACHE / (digest + ".json"), CACHE / (digest + ".meta.json")


def fetch_json(url):
    """Fetch one official JSON response, serially rate-limited and resumably cached."""
    CACHE.mkdir(parents=True, exist_ok=True)
    body_path, meta_path = cache_paths(url)
    if body_path.exists() and meta_path.exists():
        metadata = json.loads(meta_path.read_text())
        if metadata.get("status") == 200:
            return json.loads(body_path.read_text()), metadata
        body_path.unlink()
        meta_path.unlink()

    host = urllib.parse.urlparse(url).netloc.lower()
    metadata = {"requested_url": url, "effective_url": url, "fetched_at": CHECKED_DATE, "status": None}
    last_error = None
    for attempt in range(5):
        delay = MIN_HOST_INTERVAL_SECONDS - (time.monotonic() - LAST_REQUEST_BY_HOST.get(host, 0.0))
        if delay > 0:
            time.sleep(delay)
        LAST_REQUEST_BY_HOST[host] = time.monotonic()
        try:
            request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
            with urllib.request.urlopen(request, timeout=120) as response:
                payload = json.loads(response.read().decode("utf-8"))
                metadata.update({"status": response.status, "effective_url": response.geturl()})
            body_path.write_text(json.dumps(payload, ensure_ascii=False) + "\n")
            meta_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n")
            return payload, metadata
        except Exception as exc:  # A transport/server failure is never absence evidence.
            last_error = exc
            if attempt < 4:
                retry_after = None
                if isinstance(exc, urllib.error.HTTPError) and exc.headers:
                    value = exc.headers.get("Retry-After")
                    if isinstance(value, str) and value.strip().isdigit():
                        retry_after = min(120, int(value.strip()))
                time.sleep(retry_after if retry_after is not None else min(30, 2 ** attempt))
    metadata["error"] = repr(last_error)
    body_path.write_text(json.dumps({"error": repr(last_error)}, ensure_ascii=False) + "\n")
    meta_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n")
    raise RuntimeError("official API request failed after retries for %s: %r" % (url, last_error))


def rows_for(url):
    payload, _ = fetch_json(url)
    rows = payload.get("_data", [])
    if not isinstance(rows, list):
        raise RuntimeError("official API returned non-list _data for " + url)
    return rows


def one_exact_record(model, record_id):
    rows = [row for row in rows_for(record_url(model, record_id)) if row.get("_id") == record_id]
    return (rows[0], len(rows)) if len(rows) == 1 else (None, len(rows))


def source(model, record_id):
    return {"api_model_path": model, "official_record_url": record_url(model, record_id), "record_id": record_id}


def query_source(model, url, exact_predicate):
    return {"api_model_path": model, "official_query_url": url, "exact_predicate": exact_predicate}


def relation_id(row, field):
    value = row.get(field)
    return value.get("_id") if isinstance(value, dict) and isinstance(value.get("_id"), str) else None


def text(value):
    return value.strip() if isinstance(value, str) and value.strip() else None


def load_gap_candidates():
    """Return only the immutable 44-record no-Būveinė identity set."""
    universe_bytes = UNIVERSE.read_bytes()
    enrichment_bytes = ENRICHMENT.read_bytes()
    universe = json.loads(universe_bytes)
    enrichment = json.loads(enrichment_bytes)
    candidates = universe.get("candidates_to_import")
    universe_results = universe.get("results")
    enrichment_results = enrichment.get("results")
    if not isinstance(candidates, list) or len(candidates) != 983 or not isinstance(universe_results, list):
        raise RuntimeError("universe checkpoint does not contain exactly 983 import candidates")
    if not isinstance(enrichment_results, list) or len(enrichment_results) != 983:
        raise RuntimeError("address-enrichment checkpoint does not contain exactly 983 results")

    originals = {}
    for item in universe_results:
        if item.get("status") != "included":
            continue
        code, slug = str(item.get("company_code", "")), item.get("candidate_slug")
        if not isinstance(slug, str) or (code, slug) in originals:
            raise RuntimeError("universe included identities are malformed or duplicated")
        originals[(code, slug)] = item
    if len(originals) != 983:
        raise RuntimeError("universe included identity baseline is not exactly 983")

    candidate_pairs = set()
    for candidate in candidates:
        code, slug = str(candidate.get("company_code", "")), candidate.get("candidate_slug")
        if not isinstance(slug, str) or (code, slug) in candidate_pairs or (code, slug) not in originals:
            raise RuntimeError("candidate identity does not exactly match the universe checkpoint")
        candidate_pairs.add((code, slug))
    if len(candidate_pairs) != 983:
        raise RuntimeError("candidate identity baseline is not exactly 983")

    gaps = []
    seen = set()
    for item in enrichment_results:
        if item.get("unresolved_reason") != "no_buveine_address_relation_published":
            continue
        code, slug = item.get("company_code"), item.get("slug")
        pair = (code, slug)
        original = originals.get(pair)
        if not isinstance(code, str) or not isinstance(slug, str) or pair in seen or pair not in candidate_pairs or not original:
            raise RuntimeError("gap checkpoint identity is malformed, duplicated, or outside the original import")
        identity = item.get("official_jar_identity") or {}
        original_jar = original.get("jar_entity") or {}
        publication = (original.get("registered_address") or {}).get("address_publication") or {}
        if (identity.get("jar_entity_id") != original_jar.get("id") or identity.get("buveine_id") is not None or
                identity.get("adresas_id") is not None or original_jar.get("company_code_value") != code or
                publication.get("registered_address_identity") != "no_buveine_address_relation_published"):
            raise RuntimeError("gap checkpoint lacks the exact original no-Būveinė evidence for " + code)
        seen.add(pair)
        # Deliberately retain only identifier-derived material, not the legal name.
        gaps.append({"company_code": code, "slug": slug, "jar_entity_id": original_jar["id"]})
    if len(gaps) != 44:
        raise RuntimeError("expected exactly 44 no_buveine_address_relation_published candidates")
    return sorted(gaps, key=lambda item: (item["company_code"], item["slug"])), {
        "universe_sha256": hashlib.sha256(universe_bytes).hexdigest(),
        "enrichment_sha256": hashlib.sha256(enrichment_bytes).hexdigest(),
    }


def address_components(address_id):
    """Resolve only a directly published Address Register relation, never by name."""
    address, count = one_exact_record(ADDRESS_MODEL, address_id)
    paths = [{"path": "Adresas exact UUID", "source": query_source(ADDRESS_MODEL, record_url(ADDRESS_MODEL, address_id), '_id="%s"' % address_id), "matching_rows": count}]
    if count != 1:
        return None, paths
    address_type = address.get("tipas")
    if address_type == 1:
        building_rows = rows_for(api_url(BUILDING_MODEL, 'aob_kodas._id="%s"&limit(2)' % address_id))
        building_rows = [row for row in building_rows if relation_id(row, "aob_kodas") == address_id]
        paths.append({"path": "Adresas.tipas=1 -> Pastatas.aob_kodas._id", "source": query_source(BUILDING_MODEL, api_url(BUILDING_MODEL, 'aob_kodas._id="%s"&limit(2)' % address_id), 'aob_kodas._id="%s"' % address_id), "matching_rows": len(building_rows)})
        building = building_rows[0] if len(building_rows) == 1 else None
    elif address_type == 2:
        premises_rows = rows_for(api_url(PREMISES_MODEL, 'aob_kodas._id="%s"&limit(2)' % address_id))
        premises_rows = [row for row in premises_rows if relation_id(row, "aob_kodas") == address_id]
        paths.append({"path": "Adresas.tipas=2 -> Patalpa.aob_kodas._id", "source": query_source(PREMISES_MODEL, api_url(PREMISES_MODEL, 'aob_kodas._id="%s"&limit(2)' % address_id), 'aob_kodas._id="%s"' % address_id), "matching_rows": len(premises_rows)})
        premises = premises_rows[0] if len(premises_rows) == 1 else None
        building_id = relation_id(premises, "pastatas") if premises else None
        building, building_count = one_exact_record(BUILDING_MODEL, building_id) if building_id else (None, 0)
        if building_id:
            paths.append({"path": "Patalpa.pastatas._id -> Pastatas exact UUID", "source": query_source(BUILDING_MODEL, record_url(BUILDING_MODEL, building_id), '_id="%s"' % building_id), "matching_rows": building_count})
    else:
        paths.append({"path": "Adresas.tipas route", "published_address_type": address_type, "result": "unsupported_or_unpublished"})
        return None, paths
    if not building:
        return None, paths

    locality_id, street_id = relation_id(building, "gyvenamoji_vietove"), relation_id(building, "gatve")
    locality, locality_count = one_exact_record(LOCALITY_MODEL, locality_id) if locality_id else (None, 0)
    if locality_id:
        paths.append({"path": "Pastatas.gyvenamoji_vietove._id -> GyvenamojiVietove exact UUID", "source": query_source(LOCALITY_MODEL, record_url(LOCALITY_MODEL, locality_id), '_id="%s"' % locality_id), "matching_rows": locality_count})
    street, street_count = one_exact_record(STREET_MODEL, street_id) if street_id else (None, 0)
    if street_id:
        paths.append({"path": "Pastatas.gatve._id -> Gatve exact UUID", "source": query_source(STREET_MODEL, record_url(STREET_MODEL, street_id), '_id="%s"' % street_id), "matching_rows": street_count})
    locality_name = text(locality.get("pavadinimas")) if locality else None
    street_name, street_kind = (text(street.get("pavadinimas")), text(street.get("tipo_santrumpa"))) if street else (None, None)
    building_number, postcode = text(building.get("nr")), text(building.get("pasto_kodas"))
    if not locality_name or not street_name or not street_kind or not building_number:
        return None, paths
    components = {
        "locality": {"value": locality_name, "source": source(LOCALITY_MODEL, locality_id)},
        "street_name": {"value": street_name, "source": source(STREET_MODEL, street_id)},
        "street_type_abbreviation": {"value": street_kind, "source": source(STREET_MODEL, street_id)},
        "building_number": {"value": building_number, "source": source(BUILDING_MODEL, building["_id"])},
    }
    if postcode:
        components["postcode"] = {"value": postcode, "source": source(BUILDING_MODEL, building["_id"])}
    return components, paths


def research(candidate):
    code, slug, entity_id = candidate["company_code"], candidate["slug"], candidate["jar_entity_id"]
    entity, uuid_count = one_exact_record(JAR_ENTITY_MODEL, entity_id)
    code_rows = [row for row in rows_for(company_code_url(code)) if str(row.get("ja_kodas")) == code]
    code_entity = code_rows[0] if len(code_rows) == 1 else None
    if uuid_count != 1 or len(code_rows) != 1 or entity.get("_id") != entity_id or code_entity.get("_id") != entity_id or str(entity.get("ja_kodas")) != code:
        raise RuntimeError("exact JAR UUID/company-code identity confirmation failed for " + code)

    uuid_path = {"path": "JAR JuridinisAsmuo exact UUID", "source": query_source(JAR_ENTITY_MODEL, record_url(JAR_ENTITY_MODEL, entity_id), '_id="%s"' % entity_id), "matching_rows": 1,
                 "published_fields": {"pilnas_adresas": entity.get("pilnas_adresas"), "adresas": entity.get("adresas")}}
    code_path = {"path": "JAR JuridinisAsmuo exact company code", "source": query_source(JAR_ENTITY_MODEL, company_code_url(code), "ja_kodas=%s" % str(int(code))), "matching_rows": 1,
                 "confirmed_jar_entity_id": entity_id}
    buveine_rows = rows_for(buveine_relation_url(entity_id))
    if any(relation_id(row, "juridinis_asmuo") != entity_id for row in buveine_rows):
        raise RuntimeError("JAR Buveine relation response escaped exact entity identity for " + code)
    buveine_path = {"path": "JAR Buveine.juridinis_asmuo._id exact relationship", "source": query_source(JAR_BUVEINE_MODEL, buveine_relation_url(entity_id), 'juridinis_asmuo._id="%s"' % entity_id),
                    "matching_rows": len(buveine_rows), "published_relations": [
                        {"buveine_id": row.get("_id"), "adresas_id": relation_id(row, "adresas"), "adresas_nuo": row.get("adresas_nuo")}
                        for row in buveine_rows
                    ]}
    result = {
        "company_code": code,
        "slug": slug,
        "identity_key": {"company_code": code, "slug": slug},
        "check_date": CHECKED_DATE,
        "official_jar_identity": {
            "jar_entity_id": entity_id,
            "jar_entity_source": source(JAR_ENTITY_MODEL, entity_id),
            "company_code_field": "ja_kodas",
            "company_code_value": code,
        },
        "checked_paths": [uuid_path, code_path, buveine_path],
    }

    # A literal entity field is direct evidence.  It is retained as a component exactly
    # as published; this pass never parses locality out of free text.
    direct_text = text(entity.get("pilnas_adresas")) or text(entity.get("adresas"))
    if direct_text:
        field = "pilnas_adresas" if text(entity.get("pilnas_adresas")) else "adresas"
        result.update({"status": "resolved", "location_components": {"published_address_text": {"value": direct_text, "field": "JuridinisAsmuo." + field, "source": source(JAR_ENTITY_MODEL, entity_id)}},
                       "resolution_rule": "Literal JAR entity address text is retained exactly; no locality is parsed or inferred."})
        return result

    address_ids = sorted({relation_id(row, "adresas") for row in buveine_rows if relation_id(row, "adresas")})
    resolved_components = None
    for address_id in address_ids:
        components, paths = address_components(address_id)
        result["checked_paths"].extend(paths)
        if components:
            if resolved_components is not None:
                raise RuntimeError("more than one fully published location path for " + code)
            resolved_components = components
    if resolved_components:
        result.update({"status": "resolved", "location_components": resolved_components,
                       "resolution_rule": "Every component is copied from an exact official JAR-to-Address-Register UUID relation."})
        return result

    result.update({
        "status": "location_not_published",
        "no_inference_rule": "A location is recorded only when an exact official JAR entity field or exact JAR-to-Address-Register relationship directly publishes it. Legal names are never joins and no location is guessed, parsed from an unrelated source, or inferred from a company code.",
    })
    return result


def build_manifest(results, hashes):
    statuses = Counter(item["status"] for item in results)
    return {
        "manifest_version": 1,
        "checked_date": CHECKED_DATE,
        "input": {
            "universe_path": "data/registry_universe_20260807.json",
            "universe_sha256": hashes["universe_sha256"],
            "address_enrichment_path": "data/registry_address_enrichment_20260807.json",
            "address_enrichment_sha256": hashes["enrichment_sha256"],
            "identity_key": ["company_code", "slug"],
            "candidate_selection_rule": "Only original imported identities whose address-enrichment result has unresolved_reason=no_buveine_address_relation_published are included. Legal names are never join keys.",
            "expected_gap_candidate_count": 44,
        },
        "official_sources": {
            "api_base": API_BASE,
            "jar_data_portal_url": "https://data.gov.lt/datasets/1484/",
            "address_data_portal_url": "https://data.gov.lt/datasets/1342/",
            "models": MODELS,
        },
        "research_method": "For each selected identity, the official JAR JuridinisAsmuo record is independently confirmed through an exact entity UUID query and an exact numeric ja_kodas company-code query. The only location-bearing JAR fields checked are pilnas_adresas and adresas. Every JAR Buveine related by the exact juridinis_asmuo._id UUID is checked for its exact Adresas relation. When present, an Adresas relation may be traversed only through the documented exact UUID Address Register routes to a building/premises and locality/street. Uncached calls are serially throttled, retried with backoff, and cached in gitignored /tmp. Failed or ambiguous requests stop the run; they are never treated as absent evidence.",
        "no_inference_rule": "A location is recorded only when an exact official JAR entity field or exact JAR-to-Address-Register relationship directly publishes it. Legal names are never joins and no location is guessed, parsed from an unrelated source, or inferred from a company code.",
        "validation_rules": [
            "Exactly 44 results exist, with no duplicate (company_code, slug) identity.",
            "Every result belongs to the immutable original no_buveine_address_relation_published identity set.",
            "Every result has exact official JAR UUID and company-code confirmation plus all checked official relationship paths.",
            "Every result is either source-backed resolved or source-cited location_not_published.",
        ],
        "accounting": {
            "gap_candidates": len(results),
            "resolved": statuses["resolved"],
            "location_not_published": statuses["location_not_published"],
        },
        "results": results,
    }


def validate(manifest):
    assert manifest["manifest_version"] == 1 and manifest["checked_date"] == CHECKED_DATE
    assert manifest["input"]["identity_key"] == ["company_code", "slug"]
    candidates, hashes = load_gap_candidates()
    expected = {(item["company_code"], item["slug"]): item for item in candidates}
    assert manifest["input"]["universe_sha256"] == hashes["universe_sha256"]
    assert manifest["input"]["address_enrichment_sha256"] == hashes["enrichment_sha256"]
    results = manifest["results"]
    assert len(results) == manifest["accounting"]["gap_candidates"] == len(expected) == 44
    pairs = [(item["company_code"], item["slug"]) for item in results]
    assert len(set(pairs)) == len(pairs) and set(pairs) == set(expected)
    assert manifest["accounting"]["resolved"] == sum(item["status"] == "resolved" for item in results)
    assert manifest["accounting"]["location_not_published"] == sum(item["status"] == "location_not_published" for item in results)
    assert manifest["accounting"]["resolved"] + manifest["accounting"]["location_not_published"] == 44
    for item in results:
        expected_item = expected[(item["company_code"], item["slug"])]
        assert item["identity_key"] == {"company_code": item["company_code"], "slug": item["slug"]}
        assert item["check_date"] == CHECKED_DATE
        identity = item["official_jar_identity"]
        assert identity["jar_entity_id"] == expected_item["jar_entity_id"]
        assert identity["company_code_value"] == item["company_code"]
        assert identity["jar_entity_source"] == source(JAR_ENTITY_MODEL, identity["jar_entity_id"])
        paths = item["checked_paths"]
        assert len(paths) >= 3
        assert paths[0]["path"] == "JAR JuridinisAsmuo exact UUID" and paths[0]["matching_rows"] == 1
        assert paths[1]["path"] == "JAR JuridinisAsmuo exact company code" and paths[1]["matching_rows"] == 1
        assert paths[2]["path"] == "JAR Buveine.juridinis_asmuo._id exact relationship"
        for path in paths:
            source_entry = path.get("source")
            if source_entry:
                assert source_entry["api_model_path"] in MODELS
                assert source_entry["official_query_url"].startswith(API_BASE + "/")
                assert source_entry["exact_predicate"]
        if item["status"] == "location_not_published":
            assert item.get("no_inference_rule") == manifest["no_inference_rule"]
            assert "location_components" not in item
        else:
            components = item.get("location_components")
            assert isinstance(components, dict) and components
            for component in components.values():
                assert text(component.get("value"))
                evidence = component.get("source")
                assert evidence and evidence["official_record_url"].startswith(API_BASE + "/")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--validate", action="store_true", help="validate the committed checkpoint without HTTP requests")
    args = parser.parse_args()
    if args.validate:
        manifest = json.loads(MANIFEST.read_text())
    else:
        candidates, hashes = load_gap_candidates()
        results = []
        for number, candidate in enumerate(candidates, 1):
            results.append(research(candidate))
            print("researched %d/%d" % (number, len(candidates)), file=sys.stderr, flush=True)
        manifest = build_manifest(results, hashes)
        validate(manifest)
        MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    validate(manifest)
    print(json.dumps({"manifest": str(MANIFEST), **manifest["accounting"]}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
