from datetime import datetime, timezone

import pytest

import page_history

PAGE = "---\ntitle: Aurora Labs\nlast_updated: 2026-01-01T00:00:00+00:00\n---\n\nBody v1\n"


def _page(tmp_path, content=PAGE):
    docs = tmp_path / "docs"
    docs.mkdir(exist_ok=True)
    path = docs / "aurora-labs.md"
    path.write_text(content, encoding="utf-8")
    return path


def test_snapshot_saves_the_old_content_before_a_real_change(tmp_path):
    page = _page(tmp_path)
    version = page_history.snapshot(page, "compile", PAGE.replace("Body v1", "Body v2"), history_dir=tmp_path / "h")
    assert version.parent == tmp_path / "h" / "aurora-labs"
    assert version.name.endswith("-compile.md")
    assert version.read_text(encoding="utf-8") == PAGE


def test_timestamp_only_changes_are_not_versions(tmp_path):
    page = _page(tmp_path)
    rewritten = PAGE.replace("2026-01-01T00:00:00", "2026-09-27T12:00:00")
    assert page_history.snapshot(page, "compile", rewritten, history_dir=tmp_path / "h") is None
    assert not (tmp_path / "h").exists()


def test_delete_snapshots_unconditionally(tmp_path):
    page = _page(tmp_path)
    assert page_history.snapshot(page, "delete", history_dir=tmp_path / "h").name.endswith("-delete.md")


def test_missing_page_is_a_no_op(tmp_path):
    assert page_history.snapshot(tmp_path / "nope.md", "compile", "x", history_dir=tmp_path / "h") is None


def test_unknown_reason_is_rejected(tmp_path):
    with pytest.raises(ValueError):
        page_history.snapshot(_page(tmp_path), "oops", "x", history_dir=tmp_path / "h")


def test_keeps_only_the_newest_versions(tmp_path, monkeypatch):
    monkeypatch.setattr(page_history, "MAX_VERSIONS_PER_PAGE", 3)
    page = _page(tmp_path)
    for i in range(5):
        page.write_text(f"Body {i}\n", encoding="utf-8")
        page_history.snapshot(page, "edit", f"Body {i + 1}\n", history_dir=tmp_path / "h",
                              now=datetime(2026, 1, 1, 0, 0, i, tzinfo=timezone.utc))
    kept = sorted((tmp_path / "h" / "aurora-labs").glob("*.md"))
    assert [v.read_text(encoding="utf-8") for v in kept] == ["Body 2\n", "Body 3\n", "Body 4\n"]


def test_version_stamp_is_sortable_utc_with_microseconds():
    assert page_history.version_stamp(datetime(2026, 9, 27, 12, 45, 0, 123456, tzinfo=timezone.utc)) == "20260927T124500123456Z"


def test_history_dir_is_isolated_in_tests(tmp_path):
    assert tmp_path in page_history.HISTORY_DIR.parents
