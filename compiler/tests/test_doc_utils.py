import json

import doc_utils
from doc_utils import (
    collect_source_metadata,
    extract_links,
    load_topic_index,
    normalize_topic,
    parse_frontmatter,
    raw_file_status,
    read_doc_payload,
    strip_frontmatter,
    synthesized_pages_for_topics,
    topic_filename,
)


def test_parse_frontmatter_basic_fields():
    content = '---\nid: battery\ntitle: "Battery"\nslug: /entities/battery\n---\nBody text.\n'
    meta = parse_frontmatter(content)
    assert meta["id"] == "battery"
    assert meta["title"] == "Battery"
    assert meta["slug"] == "/entities/battery"


def test_parse_frontmatter_no_frontmatter_returns_empty():
    assert parse_frontmatter("# Just a heading\n\nNo frontmatter here.\n") == {}


def test_parse_frontmatter_truncated_returns_empty():
    assert parse_frontmatter("---\nid: battery\n") == {}


def test_parse_frontmatter_tags_dash_space_form():
    content = "---\ntitle: Battery\ntags:\n  - power\n  - hardware\n---\nBody.\n"
    meta = parse_frontmatter(content)
    assert meta["tags_list"] == ["power", "hardware"]


def test_parse_frontmatter_tags_bare_dash_form():
    content = "---\ntitle: Battery\ntags:\n- power\n- hardware\n---\nBody.\n"
    meta = parse_frontmatter(content)
    assert meta["tags_list"] == ["power", "hardware"]


def test_parse_frontmatter_tags_strips_quotes():
    content = "---\ntags:\n  - 'power'\n  - \"hardware\"\n---\nBody.\n"
    meta = parse_frontmatter(content)
    assert meta["tags_list"] == ["power", "hardware"]


def test_strip_frontmatter_removes_header():
    content = "---\ntitle: Battery\n---\nBody text.\n"
    assert strip_frontmatter(content) == "Body text.\n"


def test_strip_frontmatter_no_frontmatter_returns_unchanged():
    content = "Just body, no frontmatter.\n"
    assert strip_frontmatter(content) == content


def test_extract_links_finds_all_markdown_links():
    body = "See [Battery](./battery.md) and [Power](./power.md) for details."
    links = extract_links(body)
    assert links == [
        {"text": "Battery", "href": "./battery.md"},
        {"text": "Power", "href": "./power.md"},
    ]


def test_extract_links_no_links_returns_empty():
    assert extract_links("No links in this text.") == []


def test_normalize_topic_strips_escaped_quotes_and_whitespace():
    assert normalize_topic('  \\"Aurora Labs\\"  ') == '"Aurora Labs"'
    assert normalize_topic("  Battery  ") == "Battery"


def test_load_topic_index_missing_file_returns_empty(tmp_path, monkeypatch):
    monkeypatch.setattr(doc_utils, "INDEX_JSON_PATH", tmp_path / "missing.json")
    assert load_topic_index() == {}


def test_load_topic_index_reads_topics_dict(tmp_path, monkeypatch):
    index_path = tmp_path / "index.json"
    index_path.write_text(json.dumps({"topics": {"Battery": "battery.md"}}), encoding="utf-8")
    monkeypatch.setattr(doc_utils, "INDEX_JSON_PATH", index_path)
    assert load_topic_index() == {"Battery": "battery.md"}


def test_load_topic_index_non_dict_topics_returns_empty(tmp_path, monkeypatch):
    index_path = tmp_path / "index.json"
    index_path.write_text(json.dumps({"topics": ["not", "a", "dict"]}), encoding="utf-8")
    monkeypatch.setattr(doc_utils, "INDEX_JSON_PATH", index_path)
    assert load_topic_index() == {}


def test_topic_filename_direct_match():
    topic_index = {"Battery": "battery.md"}
    assert topic_filename(topic_index, "Battery") == "battery.md"


def test_topic_filename_normalized_match():
    topic_index = {'\\"Aurora Labs\\"': "aurora-labs.md"}
    assert topic_filename(topic_index, '"Aurora Labs"') == "aurora-labs.md"


def test_topic_filename_falls_back_to_slug_when_file_exists(tmp_path):
    (tmp_path / "new-topic.md").write_text("# New Topic\n", encoding="utf-8")
    assert topic_filename({}, "New Topic", docs_dir=tmp_path) == "new-topic.md"


def test_topic_filename_returns_none_when_not_found(tmp_path):
    assert topic_filename({}, "Nonexistent Topic", docs_dir=tmp_path) is None


def test_collect_source_metadata_dedupes_across_chunks():
    state_entry = {
        "chunks": [
            {
                "topics": ["Battery", "Battery"],
                "entities": [{"name": "Aurora Labs"}],
                "concepts": [{"name": "Power Budgeting"}],
            },
            {
                "topics": ["Battery", "Power"],
                "entities": [{"name": "Aurora Labs"}, {"name": "Nova Corp"}],
                "concepts": [],
            },
        ]
    }
    result = collect_source_metadata(state_entry)
    assert result["topics"] == ["Battery", "Power"]
    assert result["entities"] == [{"name": "Aurora Labs"}, {"name": "Nova Corp"}]
    assert result["concepts"] == [{"name": "Power Budgeting"}]
    assert len(result["chunks"]) == 2


def test_collect_source_metadata_handles_missing_chunks():
    assert collect_source_metadata({}) == {
        "topics": [],
        "entities": [],
        "concepts": [],
        "chunks": [],
    }


def test_read_doc_payload(tmp_path):
    doc_path = tmp_path / "battery.md"
    doc_path.write_text(
        '---\ntitle: Battery\nid: battery\nslug: /entities/battery\ntags:\n  - power\n---\n'
        "See [Power](./power.md).\n",
        encoding="utf-8",
    )
    payload = read_doc_payload(doc_path, docs_dir=tmp_path)
    assert payload["path"] == "battery.md"
    assert payload["title"] == "Battery"
    assert payload["id"] == "battery"
    assert payload["slug"] == "/entities/battery"
    assert payload["tags"] == ["power"]
    assert payload["links"] == [{"text": "Power", "href": "./power.md"}]


def test_read_doc_payload_falls_back_to_filename_title(tmp_path):
    doc_path = tmp_path / "power-budgeting.md"
    doc_path.write_text("No frontmatter here.\n", encoding="utf-8")
    payload = read_doc_payload(doc_path, docs_dir=tmp_path)
    assert payload["title"] == "Power Budgeting"
    assert payload["tags"] == []


def test_synthesized_pages_for_topics(tmp_path, monkeypatch):
    index_path = tmp_path / "index.json"
    index_path.write_text(
        json.dumps({"topics": {"Battery": "battery.md"}}), encoding="utf-8"
    )
    monkeypatch.setattr(doc_utils, "INDEX_JSON_PATH", index_path)

    (tmp_path / "battery.md").write_text(
        "---\ntitle: Battery\n---\nSee [Power](./power.md).\n", encoding="utf-8"
    )

    pages = synthesized_pages_for_topics(
        ["Battery", "Unknown Topic"],
        entities=[{"name": "Aurora Labs"}],
        concepts=[],
        docs_dir=tmp_path,
    )
    assert len(pages) == 1
    assert pages[0]["topic"] == "Battery"
    assert pages[0]["doc_path"] == "battery.md"
    assert pages[0]["title"] == "Battery"
    assert pages[0]["entities"] == [{"name": "Aurora Labs"}]
    assert pages[0]["links"] == [{"text": "Power", "href": "./power.md"}]


def test_raw_file_status_processed_when_md5_matches():
    state = {"files": {"notes.txt": {"md5": "abc123"}}}
    assert raw_file_status("notes.txt", "abc123", state) == "Processed"


def test_raw_file_status_unprocessed_when_md5_differs():
    state = {"files": {"notes.txt": {"md5": "abc123"}}}
    assert raw_file_status("notes.txt", "def456", state) == "Unprocessed"


def test_raw_file_status_unprocessed_when_missing():
    assert raw_file_status("notes.txt", "abc123", {"files": {}}) == "Unprocessed"
