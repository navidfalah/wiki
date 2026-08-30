"""End-to-end check that draft/final AUTO-GENERATED banners don't leak into each
other: temp_output/ drafts get the draft note, wiki-app/docs/ gets the final
note, and neither file ends up with both (or the wrong one)."""

from pathlib import Path

from linker import link_and_export_pages
from synthesizer import synthesize_topic_wiki_pages


class FakeLLM:
    """Echoes back a minimal valid page/linked body, ignoring the prompt."""

    available = True

    def generate_response(self, prompt: str, system_prompt: str) -> str:
        if "wiki author" in system_prompt.lower():
            return (
                "---\n"
                "id: meshsync\n"
                "title: MeshSync\n"
                "tags:\n  - wiki\n"
                "last_updated: 2026-01-01T00:00:00+00:00\n"
                "---\n\n"
                "# MeshSync\n\n"
                "## Overview\nSome synthesized content.\n"
            )
        # Linker: return the markdown page verbatim from the prompt tail.
        marker = "Markdown page:\n\n"
        return prompt.split(marker, 1)[1]


def test_draft_and_final_banners_do_not_leak(tmp_path: Path):
    temp_dir = tmp_path / "temp_output"
    docs_dir = tmp_path / "docs"
    temp_dir.mkdir()
    docs_dir.mkdir()

    grouped = {
        "MeshSync": [
            {"source": "notes/a.md", "chunk_index": 0, "text": "Some raw chunk text."},
        ]
    }

    llm = FakeLLM()
    written, _ = synthesize_topic_wiki_pages(grouped, llm=llm, output_dir=temp_dir)
    assert len(written) == 1

    draft_content = written[0].read_text(encoding="utf-8")
    assert "AUTO-GENERATED DRAFT" in draft_content
    assert draft_content.count("AUTO-GENERATED") == 1

    from linker import build_topic_index

    topic_index, _ = build_topic_index(temp_dir, temp_dir / "index.json")

    exported, _ = link_and_export_pages(
        topic_index,
        temp_dir=temp_dir,
        output_dir=docs_dir,
        llm=llm,
        dirty_filenames={"meshsync.md"},
        removed_filenames=set(),
        force=True,
    )
    assert len(exported) == 1

    final_content = exported[0].read_text(encoding="utf-8")
    assert "AUTO-GENERATED DRAFT" not in final_content
    assert final_content.count("AUTO-GENERATED") == 1
    assert "compiled by the LLM Wiki compiler" in final_content
