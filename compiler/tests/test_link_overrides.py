from link_overrides import (
    apply_connection_overrides,
    detect_topic_links,
    merge_effective_links,
    normalize_connection,
    override_source_topics,
    validate_connections,
)


def test_normalize_connection_defaults():
    conn = normalize_connection({"source_topic": " A ", "target_topic": " B "})
    assert conn["source_topic"] == "A"
    assert conn["target_topic"] == "B"
    assert conn["rule"] == "require"
    assert conn["enabled"] is True
    assert conn["id"]


def test_normalize_connection_invalid_rule_defaults_to_require():
    conn = normalize_connection({"source_topic": "A", "target_topic": "B", "rule": "nonsense"})
    assert conn["rule"] == "require"


def test_validate_connections_drops_unknown_topics():
    topic_index = {"A": "a.md", "B": "b.md"}
    connections = [
        {"source_topic": "A", "target_topic": "B"},
        {"source_topic": "A", "target_topic": "Unknown"},
    ]
    cleaned = validate_connections(connections, topic_index)
    assert len(cleaned) == 1
    assert cleaned[0]["target_topic"] == "B"


def test_validate_connections_drops_self_links():
    topic_index = {"A": "a.md"}
    connections = [{"source_topic": "A", "target_topic": "A"}]
    assert validate_connections(connections, topic_index) == []


def test_validate_connections_dedupes():
    topic_index = {"A": "a.md", "B": "b.md"}
    connections = [
        {"source_topic": "A", "target_topic": "B", "rule": "require"},
        {"source_topic": "A", "target_topic": "B", "rule": "require"},
    ]
    assert len(validate_connections(connections, topic_index)) == 1


def test_override_source_topics_ignores_disabled():
    connections = [
        {"source_topic": "A", "enabled": True},
        {"source_topic": "B", "enabled": False},
    ]
    assert override_source_topics(connections) == {"A"}


def test_apply_connection_overrides_require_adds_link():
    body = "# Battery\n\nSome content about power.\n"
    topic_index = {"Battery": "battery.md", "Power Budgeting": "power-budgeting.md"}
    connections = [
        {
            "source_topic": "Battery",
            "target_topic": "Power Budgeting",
            "rule": "require",
            "enabled": True,
        }
    ]
    result = apply_connection_overrides(
        body, page_title="Battery", topic_index=topic_index, connections=connections
    )
    assert "[Power Budgeting](./power-budgeting.md)" in result


def test_apply_connection_overrides_block_removes_link():
    body = "See [Power Budgeting](./power-budgeting.md) for details.\n"
    topic_index = {"Battery": "battery.md", "Power Budgeting": "power-budgeting.md"}
    connections = [
        {
            "source_topic": "Battery",
            "target_topic": "Power Budgeting",
            "rule": "block",
            "enabled": True,
        }
    ]
    result = apply_connection_overrides(
        body, page_title="Battery", topic_index=topic_index, connections=connections
    )
    assert "](./power-budgeting.md)" not in result
    assert "Power Budgeting" in result


def test_detect_topic_links(tmp_path):
    topic_index = {"Battery": "battery.md", "Power": "power.md"}
    (tmp_path / "battery.md").write_text(
        "# Battery\n\nSee [Power](./power.md) for details.\n", encoding="utf-8"
    )
    (tmp_path / "power.md").write_text("# Power\n\nNo links here.\n", encoding="utf-8")

    links = detect_topic_links(topic_index, docs_dir=tmp_path)
    assert links == [
        {
            "source_topic": "Battery",
            "target_topic": "Power",
            "source_id": "battery",
            "target_id": "power",
            "origin": "detected",
        }
    ]


def test_merge_effective_links_block_removes_detected():
    detected = [
        {"source_topic": "A", "target_topic": "B", "source_id": "a", "target_id": "b", "origin": "detected"}
    ]
    connections = [{"source_topic": "A", "target_topic": "B", "rule": "block", "enabled": True}]
    merged = merge_effective_links(detected, connections, {"A": "a.md", "B": "b.md"})
    assert merged == []


def test_merge_effective_links_require_adds_override():
    connections = [
        {"source_topic": "A", "target_topic": "B", "rule": "require", "enabled": True, "id": "x"}
    ]
    merged = merge_effective_links([], connections, {"A": "a.md", "B": "b.md"})
    assert len(merged) == 1
    assert merged[0]["origin"] == "override"
