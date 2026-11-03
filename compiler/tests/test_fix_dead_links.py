"""Tests for fix_dead_links.py -- unlinks broken markdown links in place."""

from pathlib import Path

from dead_link_checker import find_broken_links
from fix_dead_links import fix_doc


def test_fix_doc_unlinks_broken_link_keeps_text(tmp_path: Path):
    docs_dir = tmp_path
    page = docs_dir / "a.md"
    page.write_text(
        "---\nid: a\n---\n\n# A\n\nSee [Missing Thing](./missing.md) for details.\n",
        encoding="utf-8",
    )

    fixed = fix_doc(page, docs_dir, dry_run=False)

    assert fixed == 1
    assert page.read_text(encoding="utf-8") == (
        "---\nid: a\n---\n\n# A\n\nSee Missing Thing for details.\n"
    )


def test_fix_doc_leaves_valid_links_untouched(tmp_path: Path):
    docs_dir = tmp_path
    (docs_dir / "b.md").write_text("# B\n", encoding="utf-8")
    page = docs_dir / "a.md"
    original = "# A\n\nSee [B](./b.md) for details.\n"
    page.write_text(original, encoding="utf-8")

    fixed = fix_doc(page, docs_dir, dry_run=False)

    assert fixed == 0
    assert page.read_text(encoding="utf-8") == original


def test_fix_doc_leaves_external_and_anchor_links_untouched(tmp_path: Path):
    docs_dir = tmp_path
    page = docs_dir / "a.md"
    original = "# A\n\n[External](https://example.com) and [Anchor](#section).\n"
    page.write_text(original, encoding="utf-8")

    fixed = fix_doc(page, docs_dir, dry_run=False)

    assert fixed == 0
    assert page.read_text(encoding="utf-8") == original


def test_fix_doc_dry_run_reports_but_does_not_write(tmp_path: Path):
    docs_dir = tmp_path
    page = docs_dir / "a.md"
    original = "---\nid: a\n---\n\nSee [Missing](./missing.md) here.\n"
    page.write_text(original, encoding="utf-8")

    fixed = fix_doc(page, docs_dir, dry_run=True)

    assert fixed == 1
    assert page.read_text(encoding="utf-8") == original


def test_fix_doc_preserves_frontmatter_exactly(tmp_path: Path):
    docs_dir = tmp_path
    page = docs_dir / "a.md"
    page.write_text(
        '---\nid: a\ntitle: "A"\n---\n\nSee [Missing](./missing.md).\n',
        encoding="utf-8",
    )

    fix_doc(page, docs_dir, dry_run=False)

    content = page.read_text(encoding="utf-8")
    assert content.startswith('---\nid: a\ntitle: "A"\n---\n')
    assert "Missing" in content
    assert "](./missing.md)" not in content


def test_fix_doc_skips_files_without_frontmatter(tmp_path: Path):
    docs_dir = tmp_path
    page = docs_dir / "a.md"
    original = "# A\n\nSee [Missing](./missing.md).\n"
    page.write_text(original, encoding="utf-8")

    fixed = fix_doc(page, docs_dir, dry_run=False)

    # no frontmatter -> _split_frontmatter returns None -> function is a no-op
    assert fixed == 0
    assert page.read_text(encoding="utf-8") == original


def test_fix_doc_handles_multiple_broken_links_same_line(tmp_path: Path):
    docs_dir = tmp_path
    page = docs_dir / "a.md"
    page.write_text(
        '---\nid: a\n---\n\nSee [X](./x.md) and [Y](./y.md) both missing.\n',
        encoding="utf-8",
    )

    fixed = fix_doc(page, docs_dir, dry_run=False)

    assert fixed == 2
    content = page.read_text(encoding="utf-8")
    assert "See X and Y both missing." in content


def test_fix_doc_is_idempotent(tmp_path: Path):
    docs_dir = tmp_path
    page = docs_dir / "a.md"
    page.write_text(
        '---\nid: a\n---\n\nSee [Missing](./missing.md).\n', encoding="utf-8"
    )

    fix_doc(page, docs_dir, dry_run=False)
    second_pass = fix_doc(page, docs_dir, dry_run=False)

    assert second_pass == 0


def test_fix_doc_run_against_corpus_leaves_no_broken_links(tmp_path: Path):
    docs_dir = tmp_path
    (docs_dir / "a.md").write_text(
        '---\nid: a\n---\n\nSee [Real](./b.md) and [Fake](./fake.md).\n',
        encoding="utf-8",
    )
    (docs_dir / "b.md").write_text('---\nid: b\n---\n\n# B\n', encoding="utf-8")

    for path in sorted(docs_dir.rglob("*.md")):
        fix_doc(path, docs_dir, dry_run=False)

    assert find_broken_links(docs_dir) == []


def _run_main(monkeypatch, capsys, *args):
    import sys

    import fix_dead_links

    monkeypatch.setattr(sys, "argv", ["fix_dead_links.py", *args])
    code = fix_dead_links.main()
    return code, capsys.readouterr()


def test_main_unlinks_across_the_tree_and_reports(tmp_path: Path, monkeypatch, capsys):
    (tmp_path / "sub").mkdir()
    (tmp_path / "a.md").write_text("---\ntitle: A\n---\nSee [B](./b.md) and [Gone](./gone.md).\n", encoding="utf-8")
    (tmp_path / "b.md").write_text("---\ntitle: B\n---\nNo links.\n", encoding="utf-8")
    (tmp_path / "sub" / "c.md").write_text("---\ntitle: C\n---\n[x](../nope.md) [y](./nope2.md)\n", encoding="utf-8")

    code, out = _run_main(monkeypatch, capsys, "--docs-dir", str(tmp_path), "--dry-run")
    assert code == 0
    assert "would unlink 3 broken link(s) in 2 file(s)" in out.out
    assert "[Gone](./gone.md)" in (tmp_path / "a.md").read_text()

    code, out = _run_main(monkeypatch, capsys, "--docs-dir", str(tmp_path))
    assert "unlinked 3 broken link(s) in 2 file(s)" in out.out
    assert "sub/c.md: unlinked 2 broken link(s)" in out.out
    assert (tmp_path / "a.md").read_text().endswith("See [B](./b.md) and Gone.\n")


def test_main_refuses_a_missing_directory(tmp_path: Path, monkeypatch, capsys):
    code, out = _run_main(monkeypatch, capsys, "--docs-dir", str(tmp_path / "missing"))
    assert code == 1
    assert "Not a directory" in out.err
