"""Tests for dead_link_checker.py -- a standalone diagnostic CLI (not
wired into main.py's pipeline) that had zero test coverage before this.
Fully deterministic, no LLM involved."""

from pathlib import Path

from dead_link_checker import (
    find_broken_links,
    iter_markdown_files,
    resolve_href,
    strip_frontmatter,
    target_exists,
)


def test_strip_frontmatter_removes_yaml_block():
    content = "---\nid: foo\n---\n\nBody text.\n"
    assert strip_frontmatter(content) == "Body text.\n"


def test_strip_frontmatter_no_frontmatter_returns_unchanged():
    content = "# Heading\n\nBody.\n"
    assert strip_frontmatter(content) == content


def test_resolve_href_skips_external_urls(tmp_path: Path):
    source = tmp_path / "a.md"
    assert resolve_href("https://example.com", source, tmp_path) is None
    assert resolve_href("http://example.com", source, tmp_path) is None
    assert resolve_href("mailto:x@example.com", source, tmp_path) is None
    assert resolve_href("tel:+15551234567", source, tmp_path) is None


def test_resolve_href_skips_empty_and_anchor_only():
    source = Path("/docs/a.md")
    assert resolve_href("", source, Path("/docs")) is None
    assert resolve_href("#", source, Path("/docs")) is None
    assert resolve_href("#section", source, Path("/docs")) is None


def test_resolve_href_skips_non_markdown_targets():
    source = Path("/docs/a.md")
    assert resolve_href("./image.png", source, Path("/docs")) is None


def test_resolve_href_resolves_relative_md_link():
    docs_dir = Path("/docs")
    source = docs_dir / "a.md"
    resolved = resolve_href("./b.md", source, docs_dir)
    assert resolved == docs_dir / "b.md"


def test_resolve_href_resolves_docs_absolute_link():
    docs_dir = Path("/docs")
    source = docs_dir / "sub" / "a.md"
    resolved = resolve_href("/docs/b.md", source, docs_dir)
    assert resolved == docs_dir / "b.md"


def test_resolve_href_docs_absolute_link_without_extension():
    docs_dir = Path("/docs")
    source = docs_dir / "a.md"
    resolved = resolve_href("/docs/battery-life", source, docs_dir)
    assert resolved == docs_dir / "battery-life.md"


def test_resolve_href_rejects_link_escaping_docs_dir(tmp_path: Path):
    docs_dir = tmp_path / "docs"
    docs_dir.mkdir()
    source = docs_dir / "a.md"
    resolved = resolve_href("../../etc/passwd.md", source, docs_dir)
    assert resolved is None


def test_target_exists(tmp_path: Path):
    existing = tmp_path / "a.md"
    existing.write_text("# A\n", encoding="utf-8")
    assert target_exists(existing) is True
    assert target_exists(tmp_path / "missing.md") is False


def test_iter_markdown_files_finds_nested_files(tmp_path: Path):
    (tmp_path / "a.md").write_text("# A\n", encoding="utf-8")
    sub = tmp_path / "entities"
    sub.mkdir()
    (sub / "b.md").write_text("# B\n", encoding="utf-8")
    (tmp_path / "c.txt").write_text("not markdown\n", encoding="utf-8")

    files = iter_markdown_files(tmp_path)
    names = {f.relative_to(tmp_path).as_posix() for f in files}
    assert names == {"a.md", "entities/b.md"}


def test_find_broken_links_detects_missing_target(tmp_path: Path):
    (tmp_path / "a.md").write_text(
        "# A\n\nSee [B](./b.md) for details.\n", encoding="utf-8"
    )
    broken = find_broken_links(tmp_path)
    assert len(broken) == 1
    source, line_no, link_text, href, resolved = broken[0]
    assert source == Path("a.md")
    assert link_text == "B"
    assert href == "./b.md"
    assert resolved == tmp_path / "b.md"


def test_find_broken_links_ignores_valid_links(tmp_path: Path):
    (tmp_path / "b.md").write_text("# B\n", encoding="utf-8")
    (tmp_path / "a.md").write_text("# A\n\nSee [B](./b.md).\n", encoding="utf-8")
    assert find_broken_links(tmp_path) == []


def test_find_broken_links_ignores_external_and_anchor_links(tmp_path: Path):
    (tmp_path / "a.md").write_text(
        "# A\n\n[External](https://example.com) and [Anchor](#section) here.\n",
        encoding="utf-8",
    )
    assert find_broken_links(tmp_path) == []


def test_find_broken_links_reports_correct_line_number(tmp_path: Path):
    (tmp_path / "a.md").write_text(
        "# A\n\nLine two.\n\nSee [Missing](./missing.md) here on line four.\n",
        encoding="utf-8",
    )
    broken = find_broken_links(tmp_path)
    assert len(broken) == 1
    assert broken[0][1] == 5  # 1-indexed line number


def test_find_broken_links_skips_frontmatter_content(tmp_path: Path):
    # A link-shaped string in frontmatter shouldn't be scanned.
    (tmp_path / "a.md").write_text(
        '---\nid: a\ntitle: "[Fake](./nonexistent.md)"\n---\n\nReal body.\n',
        encoding="utf-8",
    )
    assert find_broken_links(tmp_path) == []


def test_find_broken_links_multiple_files(tmp_path: Path):
    (tmp_path / "a.md").write_text("[X](./missing1.md)\n", encoding="utf-8")
    (tmp_path / "b.md").write_text("[Y](./missing2.md)\n", encoding="utf-8")
    broken = find_broken_links(tmp_path)
    assert len(broken) == 2
