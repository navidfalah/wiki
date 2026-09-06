from entity_graph import build_entity_graph, entity_graph_payload, load_state, mentions_from_state


def _state(files: dict) -> dict:
    return {"files": files}


def test_mentions_from_state_extracts_every_chunk_entity():
    state = _state(
        {
            "notes/a.md": {
                "chunks": [
                    {"entities": [{"name": "Mira Chen", "description": "PM"}, {"name": "Nova Widget", "description": "product"}]},
                    {"entities": [{"name": "Mira", "description": ""}]},
                ]
            },
            "notes/b.md": {"chunks": [{"entities": [{"name": "mira.chen@auroralabs.example", "description": ""}]}]},
        }
    )
    mentions = mentions_from_state(state)
    names = sorted(m.name for m in mentions)
    assert names == ["Mira", "Mira Chen", "Nova Widget", "mira.chen@auroralabs.example"]
    assert {m.source for m in mentions} == {"notes/a.md", "notes/b.md"}


def test_mentions_from_state_skips_blank_names():
    state = _state({"notes/a.md": {"chunks": [{"entities": [{"name": "   ", "description": "x"}]}]}})
    assert mentions_from_state(state) == []


def test_mentions_from_state_handles_missing_chunks_and_entities_gracefully():
    state = _state({"notes/a.md": {}, "notes/b.md": {"chunks": [{}]}})
    assert mentions_from_state(state) == []


def test_build_entity_graph_merges_name_and_email_variants_across_sources():
    state = _state(
        {
            "notes/a.md": {"chunks": [{"entities": [{"name": "Mira Chen", "description": "PM"}]}]},
            "transcripts/b.txt": {"chunks": [{"entities": [{"name": "Mira", "description": ""}]}]},
            "emails/c.eml": {"chunks": [{"entities": [{"name": "mira.chen@auroralabs.example", "description": ""}]}]},
        }
    )
    clusters = build_entity_graph(state)
    assert len(clusters) == 1
    cluster = clusters[0]
    assert cluster.canonical_name == "Mira Chen"
    assert cluster.aliases == {"Mira Chen", "Mira", "mira.chen@auroralabs.example"}
    assert cluster.sources == {"notes/a.md", "transcripts/b.txt", "emails/c.eml"}


def test_build_entity_graph_keeps_hard_negatives_apart():
    # the repo's own real hard negative (documentation/26-entity-resolution.md):
    # Alex Kim, Alex Rivera, and Sam Rivera are three different people.
    state = _state(
        {
            "notes/a.md": {"chunks": [{"entities": [{"name": "Alex Kim", "description": ""}]}]},
            "notes/b.md": {"chunks": [{"entities": [{"name": "Alex Rivera", "description": ""}]}]},
            "notes/c.md": {"chunks": [{"entities": [{"name": "Sam Rivera", "description": ""}]}]},
        }
    )
    clusters = build_entity_graph(state)
    canonical_names = {c.canonical_name for c in clusters}
    assert canonical_names == {"Alex Kim", "Alex Rivera", "Sam Rivera"}


def test_entity_graph_payload_sorts_by_source_count_then_name():
    state = _state(
        {
            "a.md": {"chunks": [{"entities": [{"name": "Widget", "description": ""}]}]},
            "b.md": {"chunks": [{"entities": [{"name": "Widget", "description": ""}]}]},
            "c.md": {"chunks": [{"entities": [{"name": "Solo Entity", "description": ""}]}]},
        }
    )
    payload = entity_graph_payload(state)
    names = [e["canonical_name"] for e in payload["entities"]]
    assert names[0] == "Widget"  # 2 sources beats 1
    assert payload["counts"] == {
        "total_entities": 2,
        "total_mentions": 3,
        "multi_source_entities": 1,
        "multi_alias_entities": 0,
    }


def test_entity_graph_payload_empty_state_is_not_an_error():
    payload = entity_graph_payload({"files": {}})
    assert payload == {
        "entities": [],
        "counts": {"total_entities": 0, "total_mentions": 0, "multi_source_entities": 0, "multi_alias_entities": 0},
    }


def test_load_state_returns_empty_shape_when_file_missing(tmp_path):
    assert load_state(tmp_path / "does-not-exist.json") == {"files": {}}


def test_load_state_returns_empty_shape_for_malformed_json(tmp_path):
    path = tmp_path / "state.json"
    path.write_text("not json", encoding="utf-8")
    assert load_state(path) == {"files": {}}


def test_load_state_round_trips_real_json(tmp_path):
    path = tmp_path / "state.json"
    path.write_text('{"files": {"a.md": {"chunks": []}}}', encoding="utf-8")
    assert load_state(path) == {"files": {"a.md": {"chunks": []}}}
