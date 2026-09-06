"""Tests for fix_frontmatter.py -- quotes unsafe YAML scalar frontmatter fields."""

from pathlib import Path

from fix_frontmatter import _fix_frontmatter_block, _parse_scalar, _split_frontmatter, fix_doc, main


def test_split_frontmatter_no_leading_dashes_returns_none():
    content = "# Just a heading\n\nNo frontmatter here.\n"
    assert _split_frontmatter(content) == (None, content)


def test_split_frontmatter_truncated_returns_none():
    content = "---\ntitle: Battery\n"
    assert _split_frontmatter(content) == (None, content)


def test_split_frontmatter_splits_header_and_body():
    content = "---\ntitle: Battery\n---\nBody text.\n"
    fm, body = _split_frontmatter(content)
    assert fm == "title: Battery"
    assert body == "\nBody text.\n"


def test_parse_scalar_strips_matching_double_quotes():
    assert _parse_scalar('"Battery: Power"') == "Battery: Power"


def test_parse_scalar_strips_matching_single_quotes():
    assert _parse_scalar("'Battery'") == "Battery"


def test_parse_scalar_leaves_unquoted_value_untouched():
    assert _parse_scalar("Battery") == "Battery"


def test_parse_scalar_leaves_mismatched_quotes_untouched():
    assert _parse_scalar("\"Battery'") == "\"Battery'"


def test_fix_frontmatter_block_quotes_unsafe_title():
    fm = "title: Battery: Power\nid: battery"
    fixed, fixes = _fix_frontmatter_block(fm)
    assert fixes == 1
    assert 'title: "Battery: Power"' in fixed
    assert "id: battery" in fixed


def test_fix_frontmatter_block_leaves_safe_scalars_untouched():
    fm = "title: Battery\nid: battery\nslug: /entities/battery"
    fixed, fixes = _fix_frontmatter_block(fm)
    assert fixes == 0
    assert fixed == fm


def test_fix_frontmatter_block_ignores_fields_outside_scalar_list():
    fm = "title: Battery\ntags:\n  - power: budget"
    fixed, fixes = _fix_frontmatter_block(fm)
    assert fixes == 0
    assert fixed == fm


def test_fix_frontmatter_block_re_quotes_already_quoted_value_unchanged():
    fm = 'title: "Battery: Power"'
    fixed, fixes = _fix_frontmatter_block(fm)
    assert fixes == 0
    assert fixed == fm


def test_fix_doc_no_frontmatter_returns_zero(tmp_path: Path):
    page = tmp_path / "a.md"
    page.write_text("# A\n\nNo frontmatter.\n", encoding="utf-8")
    assert fix_doc(page, dry_run=False) == 0


def test_fix_doc_writes_fixed_frontmatter(tmp_path: Path):
    page = tmp_path / "a.md"
    page.write_text(
        "---\ntitle: Battery: Power\nid: battery\n---\nBody text.\n",
        encoding="utf-8",
    )

    fixes = fix_doc(page, dry_run=False)

    assert fixes == 1
    assert page.read_text(encoding="utf-8") == (
        '---\ntitle: "Battery: Power"\nid: battery\n---\nBody text.\n'
    )


def test_fix_doc_dry_run_reports_but_does_not_write(tmp_path: Path):
    page = tmp_path / "a.md"
    original = "---\ntitle: Battery: Power\n---\nBody text.\n"
    page.write_text(original, encoding="utf-8")

    fixes = fix_doc(page, dry_run=True)

    assert fixes == 1
    assert page.read_text(encoding="utf-8") == original


def test_fix_doc_no_fixes_needed_returns_zero(tmp_path: Path):
    page = tmp_path / "a.md"
    original = "---\ntitle: Battery\n---\nBody text.\n"
    page.write_text(original, encoding="utf-8")

    assert fix_doc(page, dry_run=False) == 0
    assert page.read_text(encoding="utf-8") == original


def test_main_not_a_directory_reports_error(monkeypatch, tmp_path, capsys):
    missing = tmp_path / "missing"
    monkeypatch.setattr("sys.argv", ["fix_frontmatter.py", "--docs-dir", str(missing)])

    assert main() == 1
    assert "Not a directory" in capsys.readouterr().err


def test_main_fixes_files_in_docs_dir(monkeypatch, tmp_path, capsys):
    (tmp_path / "a.md").write_text(
        "---\ntitle: Battery: Power\n---\nBody.\n", encoding="utf-8"
    )
    (tmp_path / "b.md").write_text("---\ntitle: Clean\n---\nBody.\n", encoding="utf-8")
    monkeypatch.setattr("sys.argv", ["fix_frontmatter.py", "--docs-dir", str(tmp_path)])

    assert main() == 0

    out = capsys.readouterr().out
    assert "a.md: 1 field(s)" in out
    assert "fixed 1 field(s) in 1 file(s)" in out
    assert (tmp_path / "a.md").read_text(encoding="utf-8") == (
        '---\ntitle: "Battery: Power"\n---\nBody.\n'
    )


def test_main_dry_run_does_not_touch_files(monkeypatch, tmp_path, capsys):
    original = "---\ntitle: Battery: Power\n---\nBody.\n"
    (tmp_path / "a.md").write_text(original, encoding="utf-8")
    monkeypatch.setattr(
        "sys.argv", ["fix_frontmatter.py", "--docs-dir", str(tmp_path), "--dry-run"]
    )

    assert main() == 0

    assert "would fix 1 field(s) in 1 file(s)" in capsys.readouterr().out
    assert (tmp_path / "a.md").read_text(encoding="utf-8") == original
