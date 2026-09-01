"""Tests for analytics.py -- the dashboard's live aggregation module
(server.py wires build_analytics()/get_tag_detail() straight into its API),
which had zero test coverage before this. Fully deterministic, no LLM."""

from pathlib import Path

import analytics
from analytics import (
    TagBucket,
    _build_tag_registry,
    _chunk_key,
    _count_processed_raw_files,
    _normalize_tag,
    _parse_frontmatter_tags,
    _register_page,
    _register_raw_chunk,
    build_analytics,
    get_tag_detail,
)


def test_normalize_tag_slugifies():
    assert _normalize_tag("Nova Widget") == "nova-widget"


def test_normalize_tag_falls_back_when_slugify_empty():
    # slugify() strips all-punctuation input down to "" (no letters/digits
    # to build a slug from) -- _normalize_tag() falls back to a
    # lowercased/stripped version of the original label instead of
    # dropping the tag key entirely.
    assert _normalize_tag("!!!") == "!!!"
    # Pure whitespace has nothing for either the slug or the fallback to
    # keep -- correctly normalizes to "" (registration callers skip it).
    assert _normalize_tag("   ") == ""


def test_chunk_key_is_a_simple_tuple():
    assert _chunk_key("notes/a.md", 3) == ("notes/a.md", 3)


def test_register_raw_chunk_adds_new_bucket():
    registry: dict[str, TagBucket] = {}
    chunk = {"chunk_index": 0, "text": "MeshSync uses a custom protocol.", "topics": ["MeshSync"]}
    _register_raw_chunk(registry, "MeshSync", chunk, "notes/a.md")
    assert "meshsync" in registry
    bucket = registry["meshsync"]
    assert bucket.label == "MeshSync"
    assert len(bucket.raw_chunks) == 1
    assert bucket.raw_chunks[0]["source"] == "notes/a.md"


def test_register_raw_chunk_dedupes_same_source_and_chunk_index():
    registry: dict[str, TagBucket] = {}
    chunk = {"chunk_index": 0, "text": "x", "topics": []}
    _register_raw_chunk(registry, "MeshSync", chunk, "notes/a.md")
    _register_raw_chunk(registry, "MeshSync", chunk, "notes/a.md")
    assert len(registry["meshsync"].raw_chunks) == 1


def test_register_raw_chunk_skips_empty_label():
    registry: dict[str, TagBucket] = {}
    chunk = {"chunk_index": 0, "text": "x"}
    _register_raw_chunk(registry, "   ", chunk, "notes/a.md")
    assert registry == {}


def test_register_page_adds_new_bucket():
    registry: dict[str, TagBucket] = {}
    page = {"path": "meshsync.md", "title": "MeshSync", "id": "meshsync"}
    _register_page(registry, "MeshSync", page)
    assert "meshsync" in registry
    assert registry["meshsync"].pages[0]["path"] == "meshsync.md"


def test_register_page_dedupes_by_path():
    registry: dict[str, TagBucket] = {}
    page = {"path": "meshsync.md", "title": "MeshSync", "id": "meshsync"}
    _register_page(registry, "MeshSync", page)
    _register_page(registry, "MeshSync", page)
    assert len(registry["meshsync"].pages) == 1


def test_tag_bucket_count_combines_raw_and_page_entries():
    bucket = TagBucket(tag="meshsync", label="MeshSync")
    bucket.raw_chunks.append({"source": "a.md", "chunk_index": 0})
    bucket.pages.append({"path": "meshsync.md"})
    assert bucket.count == 2


def test_parse_frontmatter_tags_block_style():
    content = "---\nid: foo\ntags:\n  - meshsync\n  - nova-widget\n---\n\nBody.\n"
    assert _parse_frontmatter_tags(content) == ["meshsync", "nova-widget"]


def test_parse_frontmatter_tags_strips_quotes():
    content = '---\ntags:\n  - "meshsync"\n  - \'nova-widget\'\n---\n'
    assert _parse_frontmatter_tags(content) == ["meshsync", "nova-widget"]


def test_parse_frontmatter_tags_no_frontmatter_returns_empty():
    assert _parse_frontmatter_tags("# Just a heading\n") == []


def test_parse_frontmatter_tags_stops_at_next_key():
    content = "---\ntags:\n  - meshsync\ntitle: MeshSync\n---\n"
    assert _parse_frontmatter_tags(content) == ["meshsync"]


def test_parse_frontmatter_tags_no_tags_key_returns_empty():
    content = "---\nid: foo\ntitle: Foo\n---\n"
    assert _parse_frontmatter_tags(content) == []


def test_count_processed_raw_files_against_real_repo():
    """discover_raw_source_files(RAW_DIR) isn't injectable, so this reads
    against the repo's own real data/raw/ -- read-only, and a safe way to
    prove the function runs against the actual corpus without mutating
    anything. An empty state means nothing is "processed"."""
    processed, total = _count_processed_raw_files({"files": {}})
    assert total > 0  # this repo's data/raw/ is non-empty
    assert processed == 0  # nothing in the (empty) state matches


def test_build_tag_registry_collects_raw_chunk_labels():
    state = {
        "files": {
            "notes/a.md": {
                "chunks": [
                    {
                        "chunk_index": 0,
                        "text": "MeshSync details.",
                        "topics": ["MeshSync"],
                        "entities": [{"name": "Mira Chen"}],
                        "concepts": [{"name": "Mesh Networking"}],
                    }
                ]
            }
        }
    }
    registry = _build_tag_registry(state, {}, Path("/nonexistent"))
    assert "meshsync" in registry
    assert "mira-chen" in registry
    assert "mesh-networking" in registry


def test_build_tag_registry_collects_indexed_page_tags(tmp_path: Path):
    docs_dir = tmp_path
    (docs_dir / "meshsync.md").write_text(
        "---\nid: meshsync\ntitle: MeshSync\ntags:\n  - meshsync\n  - protocol\n---\n\n# MeshSync\n",
        encoding="utf-8",
    )
    topic_index = {"MeshSync": "meshsync.md"}
    registry = _build_tag_registry({"files": {}}, topic_index, docs_dir)

    assert "meshsync" in registry
    assert registry["meshsync"].pages[0]["title"] == "MeshSync"
    assert "protocol" in registry
    assert registry["protocol"].pages[0]["path"] == "meshsync.md"


def test_build_tag_registry_collects_unindexed_pages_too(tmp_path: Path):
    docs_dir = tmp_path
    (docs_dir / "index.md").write_text("# Index\n", encoding="utf-8")
    (docs_dir / "extra.md").write_text(
        '---\ntitle: "Extra Page"\ntags:\n  - misc\n---\n\nBody.\n', encoding="utf-8"
    )
    registry = _build_tag_registry({"files": {}}, {}, docs_dir)
    assert "misc" in registry
    assert registry["misc"].pages[0]["title"] == "Extra Page"
    # index.md itself is never registered as a tagged page
    assert all(p["path"] != "index.md" for bucket in registry.values() for p in bucket.pages)


def test_build_tag_registry_skips_missing_indexed_files(tmp_path: Path):
    topic_index = {"Ghost Page": "ghost.md"}  # file doesn't exist
    registry = _build_tag_registry({"files": {}}, topic_index, tmp_path)
    assert registry == {}


def _patch_analytics_globals(monkeypatch, *, state: dict, raw_dir: Path, index_json: Path):
    monkeypatch.setattr(analytics, "load_state", lambda: state)
    monkeypatch.setattr(analytics, "RAW_DIR", raw_dir)
    monkeypatch.setattr(analytics, "INDEX_JSON", index_json)


def test_build_analytics_end_to_end(tmp_path: Path, monkeypatch):
    raw_dir = tmp_path / "raw"
    raw_dir.mkdir()
    (raw_dir / "a.md").write_text("Some raw note about MeshSync.\n", encoding="utf-8")

    docs_dir = tmp_path / "docs"
    docs_dir.mkdir()
    (docs_dir / "meshsync.md").write_text(
        "---\nid: meshsync\ntitle: MeshSync\ntags:\n  - meshsync\n---\n\n# MeshSync\n\nDetails.\n",
        encoding="utf-8",
    )

    index_json = tmp_path / "index.json"
    index_json.write_text('{"topics": {"MeshSync": "meshsync.md"}}', encoding="utf-8")

    state = {
        "files": {
            "a.md": {
                "chunks": [
                    {"chunk_index": 0, "text": "MeshSync note.", "topics": ["MeshSync"], "entities": [], "concepts": []}
                ]
            }
        }
    }
    _patch_analytics_globals(monkeypatch, state=state, raw_dir=raw_dir, index_json=index_json)

    result = build_analytics(docs_dir=docs_dir)

    assert result["metrics"]["raw_files_total"] == 1
    assert result["metrics"]["wiki_pages_created"] == 1
    assert result["metrics"]["dead_links"] == 0
    tag_labels = {t["label"] for t in result["tags"]}
    assert "MeshSync" in tag_labels


def test_build_analytics_detects_dead_links(tmp_path: Path, monkeypatch):
    raw_dir = tmp_path / "raw"
    raw_dir.mkdir()
    docs_dir = tmp_path / "docs"
    docs_dir.mkdir()
    (docs_dir / "a.md").write_text("# A\n\nSee [B](./missing.md).\n", encoding="utf-8")
    index_json = tmp_path / "index.json"
    index_json.write_text('{"topics": {}}', encoding="utf-8")

    _patch_analytics_globals(monkeypatch, state={"files": {}}, raw_dir=raw_dir, index_json=index_json)

    result = build_analytics(docs_dir=docs_dir)
    assert result["metrics"]["dead_links"] == 1
    assert result["dead_links"][0]["href"] == "./missing.md"


def test_get_tag_detail_returns_none_for_unknown_tag(tmp_path: Path, monkeypatch):
    raw_dir = tmp_path / "raw"
    raw_dir.mkdir()
    docs_dir = tmp_path / "docs"
    docs_dir.mkdir()
    index_json = tmp_path / "index.json"
    index_json.write_text('{"topics": {}}', encoding="utf-8")
    _patch_analytics_globals(monkeypatch, state={"files": {}}, raw_dir=raw_dir, index_json=index_json)

    assert get_tag_detail("nonexistent-tag", docs_dir=docs_dir) is None


def test_get_tag_detail_returns_matching_bucket(tmp_path: Path, monkeypatch):
    raw_dir = tmp_path / "raw"
    raw_dir.mkdir()
    docs_dir = tmp_path / "docs"
    docs_dir.mkdir()
    (docs_dir / "meshsync.md").write_text(
        "---\nid: meshsync\ntitle: MeshSync\ntags:\n  - meshsync\n---\n\n# MeshSync\n",
        encoding="utf-8",
    )
    index_json = tmp_path / "index.json"
    index_json.write_text('{"topics": {"MeshSync": "meshsync.md"}}', encoding="utf-8")
    _patch_analytics_globals(monkeypatch, state={"files": {}}, raw_dir=raw_dir, index_json=index_json)

    detail = get_tag_detail("MeshSync", docs_dir=docs_dir)
    assert detail is not None
    assert detail["label"] == "MeshSync"
