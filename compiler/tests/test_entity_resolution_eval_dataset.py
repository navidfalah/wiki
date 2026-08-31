from models import RAW_DIR

from entity_resolution_eval_dataset import GOLD_MENTIONS


def test_every_mention_source_path_exists_and_contains_the_mention():
    """Grounding check, same discipline as trust_eval_dataset.py: every
    claimed (mention, source_path) pair must be real, not invented.

    Case-insensitive on purpose: Mention.name is meant to model what
    synthesizer.py's entity extraction would actually output (a normalized
    "Mira" from a transcript that literally reads "MIRA:"), not a verbatim
    quote — unlike trust_eval_dataset.json's claim quotes, which are exact
    excerpts by design. Emails are handled separately below via
    email_ingest.parse_eml rather than raw (possibly MIME-encoded) bytes.
    """
    for mention, _gold_id in GOLD_MENTIONS:
        path = RAW_DIR / mention.source
        assert path.is_file(), f"missing source: {mention.source}"
        if path.suffix.lower() == ".eml":
            continue  # handled in the email-specific test below
        text = path.read_text(encoding="utf-8")
        assert mention.name.lower() in text.lower(), f"{mention.name!r} not found in {mention.source}"


def test_email_mention_sources_are_grounded_via_email_ingest():
    from email_ingest import parse_eml

    for mention, _gold_id in GOLD_MENTIONS:
        if not mention.source.endswith(".eml"):
            continue
        path = RAW_DIR / mention.source
        parsed = parse_eml(path)
        haystack = f"{parsed.subject}\n{parsed.from_addr}\n{' '.join(parsed.to_addrs)}\n{parsed.body_text}"
        assert mention.name.lower() in haystack.lower(), f"{mention.name!r} not found in {mention.source}"


def test_dataset_contains_a_hard_negative_cluster():
    """The whole point of this dataset: entities that share a name token
    but are NOT the same person/product should have distinct gold ids."""
    gold_ids_by_name = {m.name: gold_id for m, gold_id in GOLD_MENTIONS}
    assert gold_ids_by_name["Alex Kim"] != gold_ids_by_name["Alex Rivera"]
    assert gold_ids_by_name["Alex Rivera"] != gold_ids_by_name["Sam Rivera"]


def test_dataset_has_multiple_positive_clusters_with_more_than_one_mention():
    from collections import Counter

    counts = Counter(gold_id for _mention, gold_id in GOLD_MENTIONS)
    multi_mention_clusters = [gold_id for gold_id, count in counts.items() if count > 1]
    assert len(multi_mention_clusters) >= 3
