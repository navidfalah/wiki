"""Tests for fix_mdx_body.py -- re-applies MDX sanitization to compiled doc bodies."""

from pathlib import Path

from fix_mdx_body import _split_frontmatter, fix_doc, main


def test_split_frontmatter_no_leading_dashes_returns_none():
    content = "# Just a heading\n\n<UnescapedTag> here.\n"
    assert _split_frontmatter(content) == (None, content)


def test_split_frontmatter_truncated_returns_none():
    content = "---\ntitle: Battery\n"
    assert _split_frontmatter(content) == (None, content)


def test_split_frontmatter_splits_header_and_body():
    content = "---\ntitle: Battery\n---\nBody text.\n"
    fm, body = _split_frontmatter(content)
    assert fm == "title: Battery"
    assert body == "\nBody text.\n"


def test_fix_doc_sanitizes_body_after_frontmatter(tmp_path: Path):
    page = tmp_path / "a.md"
    page.write_text(
        "---\ntitle: Battery\n---\nvalue < 5 and > 2\n",
        encoding="utf-8",
    )

    touched = fix_doc(page, dry_run=False)

    assert touched is True
    assert page.read_text(encoding="utf-8") == (
        "---\ntitle: Battery\n---\nvalue &lt; 5 and &gt; 2\n"
    )


def test_fix_doc_sanitizes_whole_content_when_no_frontmatter(tmp_path: Path):
    page = tmp_path / "a.md"
    page.write_text("value < 5 and > 2\n", encoding="utf-8")

    touched = fix_doc(page, dry_run=False)

    assert touched is True
    assert page.read_text(encoding="utf-8") == "value &lt; 5 and &gt; 2\n"


def test_fix_doc_no_change_needed_returns_false(tmp_path: Path):
    page = tmp_path / "a.md"
    original = "---\ntitle: Battery\n---\nAlready clean body.\n"
    page.write_text(original, encoding="utf-8")

    assert fix_doc(page, dry_run=False) is False
    assert page.read_text(encoding="utf-8") == original


def test_fix_doc_dry_run_reports_but_does_not_write(tmp_path: Path):
    page = tmp_path / "a.md"
    original = "---\ntitle: Battery\n---\nvalue < 5\n"
    page.write_text(original, encoding="utf-8")

    touched = fix_doc(page, dry_run=True)

    assert touched is True
    assert page.read_text(encoding="utf-8") == original


def test_main_not_a_directory_reports_error(monkeypatch, tmp_path, capsys):
    missing = tmp_path / "missing"
    monkeypatch.setattr("sys.argv", ["fix_mdx_body.py", "--docs-dir", str(missing)])

    assert main() == 1
    assert "Not a directory" in capsys.readouterr().err


def test_main_fixes_files_in_docs_dir(monkeypatch, tmp_path, capsys):
    (tmp_path / "a.md").write_text(
        "---\ntitle: Battery\n---\nvalue < 5\n", encoding="utf-8"
    )
    (tmp_path / "b.md").write_text(
        "---\ntitle: Clean\n---\nAlready clean.\n", encoding="utf-8"
    )
    monkeypatch.setattr("sys.argv", ["fix_mdx_body.py", "--docs-dir", str(tmp_path)])

    assert main() == 0

    out = capsys.readouterr().out
    assert "a.md" in out
    assert "updated 1 file(s)" in out
    assert (tmp_path / "a.md").read_text(encoding="utf-8") == (
        "---\ntitle: Battery\n---\nvalue &lt; 5\n"
    )


def test_main_dry_run_does_not_touch_files(monkeypatch, tmp_path, capsys):
    original = "---\ntitle: Battery\n---\nvalue < 5\n"
    (tmp_path / "a.md").write_text(original, encoding="utf-8")
    monkeypatch.setattr(
        "sys.argv", ["fix_mdx_body.py", "--docs-dir", str(tmp_path), "--dry-run"]
    )

    assert main() == 0

    assert "would update 1 file(s)" in capsys.readouterr().out
    assert (tmp_path / "a.md").read_text(encoding="utf-8") == original
