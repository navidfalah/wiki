"""Integration check that main.py's step_synthesize() actually wires
--web-search into synthesis: web results only get fetched for dirty
topics, respect max_topics, and end up in the returned grouped mapping
(and therefore in what gets synthesized) -- not just that web_search.py's
own unit tests pass in isolation."""

from pathlib import Path

import main
import web_search


class FakeLLM:
    """Echoes back a minimal valid page, ignoring the prompt (see
    test_generated_banner_pipeline.py for the same pattern)."""

    available = True

    def generate_response(self, prompt: str, system_prompt: str) -> str:
        return (
            "---\n"
            "id: page\n"
            "title: Page\n"
            "tags:\n  - wiki\n"
            "last_updated: 2026-01-01T00:00:00+00:00\n"
            "---\n\n# Page\n\nSynthesized content.\n"
        )


def _extractions(topic: str = "MeshSync", source: str = "notes/a.md") -> dict:
    return {
        "chunk_count": 1,
        "incremental": {"new": [source], "modified": [], "deleted": [], "unchanged": []},
        "files": [
            {
                "source": source,
                "chunks": [
                    {
                        "chunk_index": 0,
                        "text": "Some raw chunk text.",
                        "topics": [topic],
                        "entities": [],
                        "concepts": [],
                        "source_type": "text",
                    }
                ],
            }
        ],
    }


def test_step_synthesize_adds_web_results_to_dirty_topic_only(tmp_path: Path, monkeypatch):
    monkeypatch.setattr(main, "TEMP_OUTPUT_DIR", tmp_path / "temp_output")

    calls = []

    def fake_web_search(query, **kwargs):
        calls.append(query)
        return [web_search.WebSearchResult(title=query, url="https://example.com", snippet="A web hit.")]

    monkeypatch.setattr(web_search, "web_search", fake_web_search)

    result = main.step_synthesize(
        _extractions(),
        FakeLLM(),
        force=False,
        web_search_enabled=True,
    )

    assert calls == ["MeshSync"]  # only the dirty topic was searched
    assert result["web_added"] == 1
    assert any(entry["source_type"] == "web" for entry in result["grouped"]["MeshSync"])

    draft = (tmp_path / "temp_output" / "meshsync.md").read_text(encoding="utf-8")
    assert "Synthesized content" in draft


def test_step_synthesize_skips_web_search_when_no_changes(tmp_path: Path, monkeypatch):
    monkeypatch.setattr(main, "TEMP_OUTPUT_DIR", tmp_path / "temp_output")
    (tmp_path / "temp_output").mkdir()

    calls = []
    monkeypatch.setattr(web_search, "web_search", lambda query, **kwargs: calls.append(query) or [])

    extractions = _extractions()
    extractions["incremental"] = {"new": [], "modified": [], "deleted": [], "unchanged": ["notes/a.md"]}

    result = main.step_synthesize(extractions, FakeLLM(), force=False, web_search_enabled=True)

    assert calls == []
    assert result["web_added"] == 0


def test_step_synthesize_respects_max_topics(tmp_path: Path, monkeypatch):
    monkeypatch.setattr(main, "TEMP_OUTPUT_DIR", tmp_path / "temp_output")

    extractions = {
        "chunk_count": 2,
        "incremental": {"new": ["notes/a.md", "notes/b.md"], "modified": [], "deleted": [], "unchanged": []},
        "files": [
            {
                "source": "notes/a.md",
                "chunks": [{"chunk_index": 0, "text": "a", "topics": ["Topic A"], "entities": [], "concepts": [], "source_type": "text"}],
            },
            {
                "source": "notes/b.md",
                "chunks": [{"chunk_index": 0, "text": "b", "topics": ["Topic B"], "entities": [], "concepts": [], "source_type": "text"}],
            },
        ],
    }

    calls = []

    def fake_web_search(query, **kwargs):
        calls.append(query)
        return []

    monkeypatch.setattr(web_search, "web_search", fake_web_search)

    main.step_synthesize(extractions, FakeLLM(), force=False, web_search_enabled=True, web_search_max_topics=1)

    assert len(calls) == 1


def test_step_synthesize_web_search_disabled_by_default(tmp_path: Path, monkeypatch):
    monkeypatch.setattr(main, "TEMP_OUTPUT_DIR", tmp_path / "temp_output")

    calls = []
    monkeypatch.setattr(web_search, "web_search", lambda query, **kwargs: calls.append(query) or [])

    result = main.step_synthesize(_extractions(), FakeLLM(), force=False)

    assert calls == []
    assert result["web_added"] == 0
