#!/usr/bin/env python3
"""Enrich the 2026-08-07 JAR import candidates from official Address Register IDs.

The input is deliberately the committed universe checkpoint, not names or a live
catalogue.  A result is identified by the original (company_code, candidate_slug)
pair and may only traverse the recorded JAR Buveine -> Adresas identity.  Raw official
responses are cached in /tmp so an interrupted run is resumable without repeating
successful requests.
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
CACHE = Path("/tmp/morrowglass-registry-addresses-20260807")
ROOT = Path(__file__).resolve().parents[1]
UNIVERSE = ROOT / "data/registry_universe_20260807.json"
MANIFEST = ROOT / "data/registry_address_enrichment_20260807.json"
USER_AGENT = "Morrowglass official-address enrichment/1.0 (+https://morrowglass.lt)"
# One uncached request every 0.4 seconds is serial, intentionally below a short burst
# rate, and combined with cache + retry/backoff to keep this resumable and polite.
MIN_HOST_INTERVAL_SECONDS = 0.4
LAST_REQUEST_BY_HOST = {}

JAR_ENTITY_MODEL = "datasets/gov/rc/jar/iregistruoti/JuridinisAsmuo"
JAR_BUVEINE_MODEL = "datasets/gov/rc/jar/buveines/Buveine"
ADDRESS_MODEL = "datasets/gov/rc/ar/adresai/Adresas"
BUILDING_MODEL = "datasets/gov/rc/ar/pastatas/Pastatas"
PREMISES_MODEL = "datasets/gov/rc/ar/patalpa/Patalpa"
LOCALITY_MODEL = "datasets/gov/rc/ar/gyvenamojivietove/GyvenamojiVietove"
STREET_MODEL = "datasets/gov/rc/ar/gatve/Gatve"
MODELS = [ADDRESS_MODEL, BUILDING_MODEL, PREMISES_MODEL, LOCALITY_MODEL, STREET_MODEL]
NAMESPACES = ["/".join(model.split("/")[:-1]) for model in MODELS]

# These two identities were observed from the official API during route exploration.
# They are confirmation probes only; candidates are never joined to either of them.
TYPE_1_PROBE_ADDRESS_ID = "323594d7-5dea-4b2c-a34a-a79db5387867"
TYPE_2_PROBE_ADDRESS_ID = "c076f65e-7c07-4831-b6ac-f5a9dce78dcb"


def api_url(model, query=""):
    return API_BASE + "/" + model + ("?" + query if query else "")


def record_url(model, record_id):
    """An official, directly reproducible URL for exactly one UUID record."""
    return api_url(model, '_id="%s"&limit(2)' % record_id)


def cache_paths(url):
    digest = hashlib.sha256(url.encode("utf-8")).hexdigest()
    return CACHE / (digest + ".json"), CACHE / (digest + ".meta.json")


def fetch_json(url):
    CACHE.mkdir(parents=True, exist_ok=True)
    body_path, meta_path = cache_paths(url)
    if body_path.exists() and meta_path.exists():
        metadata = json.loads(meta_path.read_text())
        if metadata.get("status") == 200:
            return json.loads(body_path.read_text()), metadata
        # A prior temporary failure is never evidence of an absent official record.
        body_path.unlink()
        meta_path.unlink()

    host = urllib.parse.urlparse(url).netloc.lower()
    metadata = {"requested_url": url, "fetched_at": CHECKED_DATE, "status": None, "effective_url": url}
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
        except Exception as exc:  # Retry only transport/rate/server failures, then stop.
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


def exact_rows(model, field, value):
    """Use one exact UUID predicate and independently verify every returned UUID."""
    payload, _ = fetch_json(api_url(model, '%s="%s"&limit(2)' % (field, value)))
    rows = payload.get("_data", [])
    if not isinstance(rows, list):
        raise RuntimeError("official API returned non-list _data for " + model)
    if field == "_id":
        return [row for row in rows if row.get("_id") == value]
    relation, _, subfield = field.partition(".")
    return [row for row in rows if isinstance(row.get(relation), dict) and row[relation].get(subfield) == value]


def one_exact(model, field, value):
    rows = exact_rows(model, field, value)
    return rows[0] if len(rows) == 1 else None, len(rows)


def source(model, record_id):
    return {"api_model_path": model, "official_record_url": record_url(model, record_id), "record_id": record_id}


def value_with_source(value, model, record_id):
    return {"value": value, "source": source(model, record_id)}


def relation_id(row, field):
    value = row.get(field)
    return value.get("_id") if isinstance(value, dict) and isinstance(value.get("_id"), str) else None


def nonempty_string(value):
    return value.strip() if isinstance(value, str) and value.strip() else None


def confirm_models_and_fields():
    """Confirm official namespaces, fields, and both documented resolution routes first."""
    for namespace, model in zip(NAMESPACES, MODELS):
        payload, _ = fetch_json(api_url(namespace + "/:ns"))
        if model not in {row.get("name") for row in payload.get("_data", [])}:
            raise RuntimeError("official :ns model confirmation failed for " + model)

    required = {
        ADDRESS_MODEL: {"_id", "tipas", "aob_kodas"},
        BUILDING_MODEL: {"_id", "aob_kodas", "gyvenamoji_vietove", "gatve", "nr", "korpuso_nr", "pasto_kodas"},
        PREMISES_MODEL: {"_id", "aob_kodas", "pastatas", "patalpos_nr"},
        LOCALITY_MODEL: {"_id", "pavadinimas"},
        STREET_MODEL: {"_id", "pavadinimas", "tipo_santrumpa", "gyvenamoji_vietove"},
    }
    for model, fields in required.items():
        payload, _ = fetch_json(api_url(model, "limit(1)"))
        rows = payload.get("_data", [])
        if not rows or not fields <= set(rows[0]):
            raise RuntimeError("official model sample lacks required fields: " + model)

    # Confirm type 1: Adresas ID -> Pastatas.aob_kodas._id -> locality/street IDs.
    type_1, count = one_exact(ADDRESS_MODEL, "_id", TYPE_1_PROBE_ADDRESS_ID)
    if count != 1 or type_1.get("tipas") != 1:
        raise RuntimeError("official type-1 Adresas probe did not resolve uniquely")
    type_1_building, count = one_exact(BUILDING_MODEL, "aob_kodas._id", TYPE_1_PROBE_ADDRESS_ID)
    if count != 1 or relation_id(type_1_building, "aob_kodas") != TYPE_1_PROBE_ADDRESS_ID:
        raise RuntimeError("official type-1 Pastatas route did not resolve uniquely")

    # Confirm type 2: Adresas ID -> Patalpa.aob_kodas._id -> Patalpa.pastatas._id -> Pastatas._id.
    type_2, count = one_exact(ADDRESS_MODEL, "_id", TYPE_2_PROBE_ADDRESS_ID)
    if count != 1 or type_2.get("tipas") != 2:
        raise RuntimeError("official type-2 Adresas probe did not resolve uniquely")
    premises, count = one_exact(PREMISES_MODEL, "aob_kodas._id", TYPE_2_PROBE_ADDRESS_ID)
    building_id = relation_id(premises, "pastatas") if count == 1 else None
    building, building_count = one_exact(BUILDING_MODEL, "_id", building_id) if building_id else (None, 0)
    if count != 1 or not building_id or building_count != 1:
        raise RuntimeError("official type-2 Patalpa to Pastatas route did not resolve uniquely")

    # Check text relations on an actual official Pastatas response, not merely a schema.
    locality_id, street_id = relation_id(type_1_building, "gyvenamoji_vietove"), relation_id(type_1_building, "gatve")
    locality, locality_count = one_exact(LOCALITY_MODEL, "_id", locality_id) if locality_id else (None, 0)
    street, street_count = one_exact(STREET_MODEL, "_id", street_id) if street_id else (None, 0)
    if locality_count != 1 or street_count != 1 or not nonempty_string(locality.get("pavadinimas")) or not nonempty_string(street.get("pavadinimas")):
        raise RuntimeError("official Pastatas locality/street text route did not resolve uniquely")

    return {
        "namespaces_confirmed": [namespace + "/:ns" for namespace in NAMESPACES],
        "models": MODELS,
        "required_fields": {model: sorted(fields) for model, fields in required.items()},
        "route_probes": {
            "type_1": "Adresas.tipas=1 -> Pastatas.aob_kodas._id -> Pastatas.gyvenamoji_vietove._id and Pastatas.gatve._id",
            "type_2": "Adresas.tipas=2 -> Patalpa.aob_kodas._id -> Patalpa.pastatas._id -> Pastatas._id",
            "text": "GyvenamojiVietove._id and Gatve._id exact UUID filters provide pavadinimas",
        },
    }


def load_candidates():
    universe_bytes = UNIVERSE.read_bytes()
    universe = json.loads(universe_bytes)
    candidates = universe.get("candidates_to_import")
    results = universe.get("results")
    if not isinstance(candidates, list) or len(candidates) != 983 or not isinstance(results, list):
        raise RuntimeError("expected exactly 983 candidates_to_import in the immutable universe manifest")
    by_slug = {item.get("candidate_slug"): item for item in results if item.get("status") == "included"}
    if len(by_slug) != 983:
        raise RuntimeError("universe included-result identity baseline is not 983 unique slugs")

    loaded = []
    seen_pairs = set()
    for candidate in candidates:
        slug, company_code = candidate.get("candidate_slug"), str(candidate.get("company_code", ""))
        original = by_slug.get(slug)
        if not isinstance(slug, str) or not original or original.get("company_code") != company_code:
            raise RuntimeError("candidate is not exactly backed by its imported universe result")
        pair = (company_code, slug)
        if pair in seen_pairs:
            raise RuntimeError("duplicate company_code/slug identity in universe manifest")
        seen_pairs.add(pair)
        loaded.append((candidate, original))
    return loaded, hashlib.sha256(universe_bytes).hexdigest()


def base_result(candidate, original):
    jar = original.get("jar_entity") or {}
    address = original.get("registered_address") or {}
    buveine = address.get("buveine") or {}
    address_id = buveine.get("address_id")
    return {
        "company_code": str(candidate["company_code"]),
        "slug": candidate["candidate_slug"],
        "identity_key": {"company_code": str(candidate["company_code"]), "slug": candidate["candidate_slug"]},
        "official_jar_identity": {
            "jar_entity_id": jar.get("id"),
            "jar_entity_source": source(JAR_ENTITY_MODEL, jar["id"]) if isinstance(jar.get("id"), str) else None,
            "buveine_id": buveine.get("id"),
            "buveine_source": source(JAR_BUVEINE_MODEL, buveine["id"]) if isinstance(buveine.get("id"), str) else None,
            "adresas_id": address_id if isinstance(address_id, str) else None,
            "adresas_source": source(ADDRESS_MODEL, address_id) if isinstance(address_id, str) else None,
        },
    }


def unresolved(result, reason, **details):
    result["status"] = "unresolved"
    result["unresolved_reason"] = reason
    result["no_inferred_location"] = True
    result.update(details)
    return result


def building_components(building):
    building_id = building["_id"]
    values = {}
    locality_id = relation_id(building, "gyvenamoji_vietove")
    street_id = relation_id(building, "gatve")
    locality, locality_count = one_exact(LOCALITY_MODEL, "_id", locality_id) if locality_id else (None, 0)
    if locality_count != 1:
        return None, "gyvenamoji_vietove_exact_uuid_query_returned_%d_rows" % locality_count
    locality_name = nonempty_string(locality.get("pavadinimas"))
    if not locality_name:
        return None, "gyvenamoji_vietove_pavadinimas_not_published"
    # Keep a verified locality even if a separate street relation is absent from the
    # published Address Register.  It is sourced evidence, not an inferred address.
    values["locality"] = value_with_source(locality_name, LOCALITY_MODEL, locality["_id"])
    street, street_count = one_exact(STREET_MODEL, "_id", street_id) if street_id else (None, 0)
    if street_count != 1:
        return values, "gatve_exact_uuid_query_returned_%d_rows" % street_count
    street_name = nonempty_string(street.get("pavadinimas"))
    street_kind = nonempty_string(street.get("tipo_santrumpa"))
    building_number = nonempty_string(building.get("nr"))
    if not street_name or not street_kind:
        return values, "gatve_pavadinimas_or_tipo_santrumpa_not_published"
    if not building_number:
        return values, "pastatas_nr_not_published"
    values["street_name"] = value_with_source(street_name, STREET_MODEL, street["_id"])
    values["street_type_abbreviation"] = value_with_source(street_kind, STREET_MODEL, street["_id"])
    values["building_number"] = value_with_source(building_number, BUILDING_MODEL, building_id)
    corpus = nonempty_string(building.get("korpuso_nr"))
    postcode = nonempty_string(building.get("pasto_kodas"))
    if corpus:
        values["building_corpus_number"] = value_with_source(corpus, BUILDING_MODEL, building_id)
    if postcode:
        values["postcode"] = value_with_source(postcode, BUILDING_MODEL, building_id)
    return values, None


def format_address(components, premises_number=None):
    """Render only published Lithuanian components; no names, geocoding, or guesses."""
    street = "%s %s" % (components["street_name"]["value"], components["street_type_abbreviation"]["value"])
    number = components["building_number"]["value"]
    if "building_corpus_number" in components:
        number += " korp. " + components["building_corpus_number"]["value"]
    if premises_number:
        number += "-" + premises_number
    tail = components["locality"]["value"]
    if "postcode" in components:
        tail = components["postcode"]["value"] + " " + tail
    return ", ".join((street + " " + number, tail))


def resolve_candidate(candidate, original):
    result = base_result(candidate, original)
    original_address = original.get("registered_address") or {}
    original_publication = original_address.get("address_publication") or {}
    address_id = result["official_jar_identity"]["adresas_id"]
    if not address_id:
        # Preserve the original JAR publication state exactly; never fill it from a name
        # or any other source.  The known baseline contains 44 of this exact state.
        return unresolved(result, original_publication.get("registered_address_identity", "no_recorded_jar_buveine_address_identity"), original_jar_address_publication=original_publication)

    address, address_count = one_exact(ADDRESS_MODEL, "_id", address_id)
    if address_count != 1:
        return unresolved(result, "adresas_exact_uuid_query_returned_%d_rows" % address_count)
    address_type = address.get("tipas")
    result["address_register_identity"] = {
        "address_type": value_with_source(address_type, ADDRESS_MODEL, address_id),
        "address_object_code": value_with_source(address.get("aob_kodas"), ADDRESS_MODEL, address_id),
    }

    premises = None
    if address_type == 1:
        building, building_count = one_exact(BUILDING_MODEL, "aob_kodas._id", address_id)
        building_route = "Adresas.tipas=1 -> Pastatas.aob_kodas._id"
        if building_count != 1:
            return unresolved(result, "pastatas_for_adresas_exact_uuid_query_returned_%d_rows" % building_count, resolution_route=building_route)
    elif address_type == 2:
        premises, premises_count = one_exact(PREMISES_MODEL, "aob_kodas._id", address_id)
        building_route = "Adresas.tipas=2 -> Patalpa.aob_kodas._id -> Patalpa.pastatas._id -> Pastatas._id"
        if premises_count != 1:
            return unresolved(result, "patalpa_for_adresas_exact_uuid_query_returned_%d_rows" % premises_count, resolution_route=building_route)
        building_id = relation_id(premises, "pastatas")
        if not building_id:
            return unresolved(result, "patalpa_pastatas_relation_not_published", resolution_route=building_route)
        building, building_count = one_exact(BUILDING_MODEL, "_id", building_id)
        if building_count != 1:
            return unresolved(result, "pastatas_for_patalpa_exact_uuid_query_returned_%d_rows" % building_count, resolution_route=building_route)
    else:
        return unresolved(result, "unsupported_adresas_tipas_%r" % address_type)

    components, component_reason = building_components(building)
    if not components:
        return unresolved(result, component_reason, resolution_route=building_route,
                          official_building_source=source(BUILDING_MODEL, building["_id"]))
    if component_reason:
        return unresolved(result, component_reason, resolution_route=building_route,
                          official_building_source=source(BUILDING_MODEL, building["_id"]),
                          address_components=components, city_locality=components["locality"])

    result["status"] = "resolved"
    result["resolution_route"] = building_route
    result["address_components"] = components
    result["city_locality"] = components["locality"]
    if premises is not None:
        premises_number = nonempty_string(premises.get("patalpos_nr"))
        if premises_number:
            result["address_components"]["premises_number"] = value_with_source(premises_number, PREMISES_MODEL, premises["_id"])
        else:
            # A building-derived address is still official; do not invent a room number.
            premises_number = None
        result["patalpa_source"] = source(PREMISES_MODEL, premises["_id"])
    else:
        premises_number = None
    formatted = format_address(components, premises_number)
    result["formatted_registered_address"] = {
        "value": formatted,
        "format": "{street_name} {street_type_abbreviation} {building_number}[ korp. {building_corpus_number}][-{premises_number}], [{postcode} ]{locality}",
        "component_sources": [value["source"] for value in result["address_components"].values()],
    }
    return result


def build_manifest(results, model_confirmation, universe_hash):
    statuses = Counter(item["status"] for item in results)
    unresolved_reasons = Counter(item.get("unresolved_reason") for item in results if item["status"] == "unresolved")
    no_buveine = sum(item.get("unresolved_reason") == "no_buveine_address_relation_published" for item in results)
    resolved_city = sum(bool(item.get("city_locality", {}).get("value")) for item in results)
    resolved_address = sum(bool(item.get("formatted_registered_address", {}).get("value")) for item in results)
    return {
        "manifest_version": 1,
        "checked_date": CHECKED_DATE,
        "input": {
            "path": "data/registry_universe_20260807.json",
            "sha256": universe_hash,
            "expected_imported_candidate_count": 983,
            "identity_key": ["company_code", "slug"],
            "identity_rule": "Every result is keyed only by the original company_code/slug pair and can traverse only the JAR Buveine Adresas UUID already recorded in that pair's imported universe result. Legal names are never joins.",
        },
        "official_sources": {
            "api_base": API_BASE,
            "address_data_portal_url": "https://data.gov.lt/datasets/1342/",
            "jar_data_portal_url": "https://data.gov.lt/datasets/1484/",
            "model_confirmation": model_confirmation,
        },
        "research_method": "Before candidate extraction, official get.data.gov.lt namespace listings, unprojected samples, and actual type-1/type-2 route probes confirmed every model, field, and relation used. Each recorded JAR Buveine Adresas UUID is read from Adresas using an exact UUID filter. tipas 1 resolves only through Pastatas.aob_kodas._id; tipas 2 resolves only through Patalpa.aob_kodas._id, Patalpa.pastatas._id, then Pastatas._id. Pastatas.gyvenamoji_vietove._id and Pastatas.gatve._id resolve only through exact UUID filters to pavadinimas. Output text is formatted solely from official published components. Uncached requests are serially throttled to one per second, retried with backoff, and cached under /tmp; any failed/ambiguous/missing official relation remains explicit unresolved evidence rather than an inference.",
        "validation_rules": [
            "There is exactly one result for every original imported candidate and no other identity key.",
            "A result may use only its recorded JAR Adresas UUID; names are never used as joins.",
            "Resolved city/locality is exactly GyvenamojiVietove.pavadinimas from an exact UUID result.",
            "Resolved street is exactly Gatve.pavadinimas plus Gatve.tipo_santrumpa from an exact UUID result.",
            "Formatted addresses contain only source-cited official components; unresolved records contain no inferred location.",
            "The 44 original no_buveine_address_relation_published records remain unresolved with that exact official reason.",
            "Every published value has an official model path, UUID, and direct get.data.gov.lt record URL.",
        ],
        "accounting": {
            "original_imported_candidates": len(results),
            "resolved": statuses["resolved"],
            "unresolved": statuses["unresolved"],
            "resolved_city_locality": resolved_city,
            "resolved_formatted_registered_address": resolved_address,
            "unresolved_no_jar_buveine_relation": no_buveine,
            "unresolved_reason_counts": dict(sorted((reason, count) for reason, count in unresolved_reasons.items() if reason)),
        },
        "results": results,
    }


def validate(manifest):
    assert manifest["manifest_version"] == 1 and manifest["checked_date"] == CHECKED_DATE
    assert manifest["input"]["expected_imported_candidate_count"] == 983
    assert manifest["official_sources"]["api_base"] == API_BASE
    confirmation = manifest["official_sources"]["model_confirmation"]
    assert confirmation["models"] == MODELS
    candidates, actual_universe_hash = load_candidates()
    assert manifest["input"]["sha256"] == actual_universe_hash
    expected = {(str(candidate["company_code"]), candidate["candidate_slug"]): original for candidate, original in candidates}
    results, accounting = manifest["results"], manifest["accounting"]
    assert len(results) == accounting["original_imported_candidates"] == len(expected) == 983
    pairs = [(item["company_code"], item["slug"]) for item in results]
    assert len(set(pairs)) == len(pairs) and set(pairs) == set(expected)
    assert accounting["resolved"] == sum(item["status"] == "resolved" for item in results)
    assert accounting["unresolved"] == sum(item["status"] == "unresolved" for item in results)
    assert accounting["resolved"] + accounting["unresolved"] == 983
    assert accounting["resolved_city_locality"] == sum(bool(item.get("city_locality", {}).get("value")) for item in results)
    assert accounting["resolved_formatted_registered_address"] == sum(bool(item.get("formatted_registered_address", {}).get("value")) for item in results)
    reasons = Counter(item.get("unresolved_reason") for item in results if item["status"] == "unresolved")
    assert accounting["unresolved_reason_counts"] == dict(sorted((reason, count) for reason, count in reasons.items() if reason))
    assert accounting["unresolved_no_jar_buveine_relation"] == reasons["no_buveine_address_relation_published"] == 44
    for item in results:
        assert item["identity_key"] == {"company_code": item["company_code"], "slug": item["slug"]}
        assert item["status"] in {"resolved", "unresolved"}
        original = expected[(item["company_code"], item["slug"])]
        original_address = original.get("registered_address") or {}
        original_buveine = original_address.get("buveine") or {}
        identity = item["official_jar_identity"]
        assert identity["jar_entity_id"] == (original.get("jar_entity") or {}).get("id")
        assert identity["buveine_id"] == original_buveine.get("id")
        assert identity["adresas_id"] == original_buveine.get("address_id")
        if identity["adresas_id"]:
            assert identity["adresas_source"]["api_model_path"] == ADDRESS_MODEL
            assert identity["adresas_source"]["record_id"] == identity["adresas_id"]
        for evidence in (item.get("address_register_identity") or {}).values():
            assert evidence["source"]["api_model_path"] == ADDRESS_MODEL
            assert evidence["source"]["official_record_url"].startswith(API_BASE + "/")
        for component in (item.get("address_components") or {}).values():
            evidence = component["source"]
            assert component["value"] and evidence["record_id"] and evidence["api_model_path"] in MODELS
            assert evidence["official_record_url"].startswith(API_BASE + "/")
        if item["status"] == "unresolved":
            assert item["no_inferred_location"] is True and item.get("unresolved_reason")
            assert "formatted_registered_address" not in item
            if not identity["adresas_id"]:
                exact_reason = ((original_address.get("address_publication") or {}).get("registered_address_identity"))
                assert item["unresolved_reason"] == exact_reason
            if "city_locality" in item:
                assert item["city_locality"]["value"] == item["address_components"]["locality"]["value"]
                city_source = item["city_locality"]["source"]
                assert city_source["api_model_path"] == LOCALITY_MODEL
                assert city_source["official_record_url"].startswith(API_BASE + "/")
            continue
        assert item["city_locality"]["value"] == item["address_components"]["locality"]["value"]
        assert item["formatted_registered_address"]["value"]
        assert item["address_register_identity"]["address_type"]["value"] in {1, 2}
        component_sources = item["formatted_registered_address"]["component_sources"]
        assert component_sources and all(source_entry["official_record_url"].startswith(API_BASE + "/") for source_entry in component_sources)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--validate", action="store_true", help="validate the committed manifest without HTTP requests")
    args = parser.parse_args()
    if args.validate:
        manifest = json.loads(MANIFEST.read_text())
    else:
        candidates, universe_hash = load_candidates()
        confirmation = confirm_models_and_fields()
        results = []
        for number, (candidate, original) in enumerate(candidates, 1):
            results.append(resolve_candidate(candidate, original))
            if number % 25 == 0 or number == len(candidates):
                print("researched %d/%d" % (number, len(candidates)), file=sys.stderr, flush=True)
        manifest = build_manifest(results, confirmation, universe_hash)
        validate(manifest)
        MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    validate(manifest)
    print(json.dumps({"manifest": str(MANIFEST), **manifest["accounting"]}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
