"""Tests for reviewer.py -- a standalone spot-check CLI (not wired into
main.py's compile pipeline) that had zero test coverage before this. All
of these exercise the pure/offline logic (frontmatter parsing, topic-key
normalization, chunk grouping/deduping, page discovery, and the
no-source-entries fallback); the actual live-model judgment quality of
review_page_with_llm's LLM call is out of scope here, same "mechanism vs
judgment quality" split as the rest of this project's LLM-touching code."""

from pathlib import Path

from reviewer import (
    _dedupe_chunk_entries,
    _normalize_topic,
    _parse_review_json,
    build_grouped_from_state,
    discover_pages,
    format_source_chunks,
    parse_frontmatter,
    review_page_with_llm,
    strip_frontmatter,
)


def test_strip_frontmatter_removes_yaml_block():
    content = "---\nid: foo\ntitle: Foo\n---\n\nBody text here.\n"
    assert strip_frontmatter(content) == "Body text here.\n"


def test_strip_frontmatter_no_frontmatter_returns_unchanged():
    content = "# Just a heading\n\nBody.\n"
    assert strip_frontmatter(content) == content


def test_parse_frontmatter_extracts_key_values():
    content = '---\nid: foo\ntitle: "Foo Bar"\n---\n\nBody.\n'
    meta = parse_frontmatter(content)
    assert meta["id"] == "foo"
    assert meta["title"] == "Foo Bar"


def test_parse_frontmatter_strips_quotes():
    content = "---\ntitle: 'Single Quoted'\n---\n"
    meta = parse_frontmatter(content)
    assert meta["title"] == "Single Quoted"


def test_parse_frontmatter_no_frontmatter_returns_empty_dict():
    assert parse_frontmatter("# Heading\n\nBody.") == {}


def test_normalize_topic_unescapes_backslash_quotes():
    assert _normalize_topic('MeshSync \\"Beta\\"') == 'meshsync "beta"'


def test_normalize_topic_is_case_insensitive():
    assert _normalize_topic("MeshSync") == _normalize_topic("meshsync")
    assert _normalize_topic("Nova Widget") == _normalize_topic("NOVA WIDGET")


def test_normalize_topic_collapses_internal_whitespace():
    assert _normalize_topic("Nova   Widget") == _normalize_topic("Nova Widget")


def test_normalize_topic_strips_outer_whitespace():
    assert _normalize_topic("  MeshSync  ") == "meshsync"


def test_normalize_topic_makes_grouped_lookup_resilient_to_title_drift():
    """The real-world case this normalization exists for: state.json's
    extraction-time topic tag and index.json's post-synthesis page title
    can drift in case/whitespace even though the synthesis prompt asks the
    model to reproduce the topic exactly -- this shouldn't cause a
    well-sourced page to be falsely reported as having no source chunks."""
    state = {
        "files": {
            "notes/a.md": {
                "chunks": [
                    {
                        "chunk_index": 0,
                        "text": "MeshSync uses a custom protocol.",
                        "topics": ["MeshSync  Protocol"],  # extra internal space
                    }
                ]
            }
        }
    }
    grouped = build_grouped_from_state(state)
    # Page title as the LLM actually wrote it: different case, single space.
    page_title = "meshsync protocol"
    assert grouped.get(_normalize_topic(page_title)) is not None
    assert len(grouped[_normalize_topic(page_title)]) == 1


def test_build_grouped_from_state_defaults_to_general_notes_when_no_topics():
    state = {
        "files": {
            "notes/a.md": {
                "chunks": [{"chunk_index": 0, "text": "Some text.", "topics": []}]
            }
        }
    }
    grouped = build_grouped_from_state(state)
    assert _normalize_topic("General Notes") in grouped


def test_build_grouped_from_state_one_chunk_can_belong_to_multiple_topics():
    state = {
        "files": {
            "notes/a.md": {
                "chunks": [
                    {"chunk_index": 0, "text": "Shared text.", "topics": ["Alpha", "Beta"]}
                ]
            }
        }
    }
    grouped = build_grouped_from_state(state)
    assert _normalize_topic("Alpha") in grouped
    assert _normalize_topic("Beta") in grouped


def test_dedupe_chunk_entries_removes_duplicates_by_source_and_index():
    entries = [
        {"source": "a.md", "chunk_index": 0, "text": "x"},
        {"source": "a.md", "chunk_index": 0, "text": "x"},
        {"source": "a.md", "chunk_index": 1, "text": "y"},
    ]
    deduped = _dedupe_chunk_entries(entries)
    assert len(deduped) == 2


def test_format_source_chunks_includes_source_and_index():
    entries = [{"source": "notes/a.md", "chunk_index": 2, "text": "Some content."}]
    formatted = format_source_chunks(entries)
    assert "notes/a.md" in formatted
    assert "chunk 2" in formatted
    assert "Some content." in formatted


def test_format_source_chunks_truncates_long_text():
    entries = [{"source": "notes/a.md", "chunk_index": 0, "text": "x" * 9000}]
    formatted = format_source_chunks(entries)
    assert "truncated for review" in formatted


def test_parse_review_json_fills_defaults():
    data = _parse_review_json('{"severity": "clean"}', topic="MeshSync")
    assert data["topic"] == "MeshSync"
    assert data["severity"] == "clean"
    assert data["structural_issues"] == []
    assert data["dubious_claims"] == []


def test_parse_review_json_raises_on_no_json():
    import pytest

    with pytest.raises(ValueError):
        _parse_review_json("not json at all", topic="X")


def test_review_page_with_llm_flags_missing_source_entries_as_major():
    class UnusedLLM:
        available = True

        def generate_response(self, *args, **kwargs):
            raise AssertionError("should not be called when there are no source entries")

    review = review_page_with_llm(
        topic="Orphan Topic", wiki_body="# Orphan\n\nSome content.", source_entries=[], llm=UnusedLLM()
    )
    assert review.severity == "major"
    assert review.structural_issues
    assert review.structural_issues[0]["type"] == "attribution"


def test_review_page_with_llm_parses_a_real_response():
    class FakeReviewLLM:
        available = True

        def generate_response(self, prompt, system_prompt, temperature=0.1):
            assert "MeshSync" in prompt
            return '{"severity": "clean", "structural_issues": [], "dubious_claims": [], "summary": "Looks good."}'

    review = review_page_with_llm(
        topic="MeshSync",
        wiki_body="# MeshSync\n\nDetails.",
        source_entries=[{"source": "notes/a.md", "chunk_index": 0, "text": "MeshSync details."}],
        llm=FakeReviewLLM(),
    )
    assert review.severity == "clean"
    assert review.summary == "Looks good."


def test_discover_pages_uses_topic_index_when_indexed_only(tmp_path: Path):
    docs_dir = tmp_path / "docs"
    docs_dir.mkdir()
    (docs_dir / "meshsync.md").write_text("# MeshSync\n", encoding="utf-8")
    topic_index = {"MeshSync": "meshsync.md", "Missing Page": "missing.md"}

    pages = discover_pages(docs_dir, topic_index, indexed_only=True)
    assert pages == [("MeshSync", docs_dir / "meshsync.md")]  # missing.md skipped, doesn't exist


def test_discover_pages_falls_back_to_scanning_docs_dir(tmp_path: Path):
    docs_dir = tmp_path / "docs"
    docs_dir.mkdir()
    (docs_dir / "index.md").write_text("# Index\n", encoding="utf-8")
    (docs_dir / "battery.md").write_text('---\ntitle: "Battery Life"\n---\n\n# Battery Life\n', encoding="utf-8")

    pages = discover_pages(docs_dir, {}, indexed_only=False)
    names = [p.name for _title, p in pages]
    assert "index.md" not in names
    assert "battery.md" in names
    title = next(t for t, p in pages if p.name == "battery.md")
    assert title == "Battery Life"
