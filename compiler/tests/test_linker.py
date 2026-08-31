from pathlib import Path

from linker import (
    _extract_title_from_markdown,
    _split_frontmatter,
    build_topic_index,
    link_and_export_pages,
    update_topic_index,
)


def test_extract_title_from_frontmatter():
    content = '---\ntitle: "MeshSync Protocol"\n---\n\n# Something else\n'
    assert _extract_title_from_markdown(content, "fallback") == "MeshSync Protocol"


def test_extract_title_falls_back_to_h1():
    content = "# Battery Life\n\nSome body text."
    assert _extract_title_from_markdown(content, "fallback") == "Battery Life"


def test_extract_title_falls_back_to_default():
    content = "no heading here"
    assert _extract_title_from_markdown(content, "fallback") == "fallback"


def test_split_frontmatter_present():
    content = "---\nid: foo\n---\n\nBody text\n"
    fm, body = _split_frontmatter(content)
    assert fm == "id: foo"
    assert body == "Body text\n"


def test_split_frontmatter_absent():
    content = "# Just a heading\n"
    fm, body = _split_frontmatter(content)
    assert fm is None
    assert body == content


def _write_draft(temp_dir: Path, filename: str, title: str) -> None:
    (temp_dir / filename).write_text(f"# {title}\n\nBody.\n", encoding="utf-8")


def test_build_topic_index_full_rebuild(tmp_path: Path):
    _write_draft(tmp_path, "meshsync.md", "MeshSync")
    _write_draft(tmp_path, "battery.md", "Battery")

    index, delta = build_topic_index(tmp_path, tmp_path / "index.json")

    assert index == {"MeshSync": "meshsync.md", "Battery": "battery.md"}
    assert delta.added == index
    assert (tmp_path / "index.json").is_file()


def test_update_topic_index_incremental_add(tmp_path: Path):
    _write_draft(tmp_path, "meshsync.md", "MeshSync")
    index_path = tmp_path / "index.json"
    build_topic_index(tmp_path, index_path)

    _write_draft(tmp_path, "battery.md", "Battery")
    index, delta = update_topic_index(
        tmp_path,
        index_path,
        dirty_filenames={"battery.md"},
        removed_filenames=set(),
        force=False,
    )

    assert index["Battery"] == "battery.md"
    assert index["MeshSync"] == "meshsync.md"
    assert delta.added == {"Battery": "battery.md"}


def test_update_topic_index_incremental_removal(tmp_path: Path):
    _write_draft(tmp_path, "meshsync.md", "MeshSync")
    _write_draft(tmp_path, "battery.md", "Battery")
    index_path = tmp_path / "index.json"
    build_topic_index(tmp_path, index_path)

    (tmp_path / "battery.md").unlink()
    index, delta = update_topic_index(
        tmp_path,
        index_path,
        dirty_filenames=set(),
        removed_filenames={"battery.md"},
        force=False,
    )

    assert "Battery" not in index
    assert delta.removed == {"Battery": "battery.md"}


class _RecordingLinkerLLM:
    """Records every prompt it's called with, so a test can assert on
    exactly what topic_index content actually reached the linker prompt --
    a FakeLLM that just echoes the page back (as test_generated_banner_pipeline.py's
    does) can't catch a bug where the wrong object gets passed as
    topic_index, since it never looks at the prompt content."""

    available = True

    def __init__(self):
        self.prompts: list[str] = []

    def generate_response(self, prompt: str, system_prompt: str) -> str:
        self.prompts.append(prompt)
        marker = "Markdown page:\n\n"
        return prompt.split(marker, 1)[1] if marker in prompt else prompt


def test_link_and_export_pages_sends_the_real_topic_index_to_the_llm(tmp_path: Path):
    """Regression test for a variable-shadowing bug: link_and_export_pages()
    used to have a `for index, draft_path in enumerate(...)` loop that
    shadowed the outer `index` variable holding the real topic_index dict,
    so link_page_with_llm() received the loop counter (an int) instead of
    the actual title->filename mapping -- silently breaking the LLM's
    ability to see what pages exist to link to, for every page, on every
    compile. This asserts the real topic titles are actually present in
    the prompt the LLM receives."""
    temp_dir = tmp_path / "temp_output"
    docs_dir = tmp_path / "docs"
    temp_dir.mkdir()
    docs_dir.mkdir()

    _write_draft(temp_dir, "meshsync.md", "MeshSync")
    _write_draft(temp_dir, "battery.md", "Battery")
    topic_index, _ = build_topic_index(temp_dir, temp_dir / "index.json")

    llm = _RecordingLinkerLLM()
    written, _skipped = link_and_export_pages(
        topic_index,
        temp_dir=temp_dir,
        output_dir=docs_dir,
        llm=llm,
        dirty_filenames={"meshsync.md", "battery.md"},
        removed_filenames=set(),
        force=True,
    )

    assert len(written) == 2
    assert len(llm.prompts) == 2
    for prompt in llm.prompts:
        assert "Topic index" in prompt
        assert "meshsync.md" in prompt
        assert "battery.md" in prompt
        # The bug would have put an integer (e.g. "1" or "2") in place of
        # the real JSON-encoded index -- a bare digit line, not a mapping.
        assert '"MeshSync"' in prompt or "MeshSync" in prompt
