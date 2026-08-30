from pathlib import Path

from linker import (
    _extract_title_from_markdown,
    _split_frontmatter,
    build_topic_index,
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
