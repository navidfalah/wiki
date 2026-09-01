"""Tests for sources_registry.py -- registers external folders under
data/raw/ as a mirrored tree of per-file symlinks, so the existing
pipeline (discover_raw_source_files, which walks RAW_DIR with
Path.rglob()) picks every file up with no other changes.

A single symlink pointing straight at the external directory was tried
first and doesn't work: Path.rglob() does not descend into a symlinked
directory on this Python version, so a file placed under that kind of
link would be silently invisible to the compiler -- confirmed directly
(see test_discover_raw_source_files_sees_files_inside_a_registered_source,
which exercises the real synthesizer.py function, not a mock)."""

from pathlib import Path

import pytest

import sources_registry as sr
from synthesizer import discover_raw_source_files


@pytest.fixture(autouse=True)
def _isolated_registry(tmp_path: Path, monkeypatch):
    raw_dir = tmp_path / "raw"
    raw_dir.mkdir()
    sources_file = tmp_path / "sources.json"
    monkeypatch.setattr(sr, "RAW_DIR", raw_dir)
    monkeypatch.setattr(sr, "SOURCES_FILE", sources_file)
    yield raw_dir, sources_file


def test_list_sources_empty_by_default(_isolated_registry):
    assert sr.list_sources() == []


def test_add_source_creates_entry_and_symlink(tmp_path: Path, _isolated_registry):
    raw_dir, _ = _isolated_registry
    external = tmp_path / "external"
    external.mkdir()
    (external / "note.md").write_text("hi\n", encoding="utf-8")

    entry = sr.add_source(str(external), label="My Notes")

    assert entry["label"] == "My Notes"
    assert entry["link_name"] == "my-notes"
    assert entry["enabled"] is True

    link_root = raw_dir / "my-notes"
    assert link_root.is_dir()
    mirrored = link_root / "note.md"
    assert mirrored.is_symlink()
    assert mirrored.resolve() == (external / "note.md").resolve()
    assert mirrored.read_text(encoding="utf-8") == "hi\n"


def test_add_source_rejects_missing_directory(_isolated_registry, tmp_path: Path):
    with pytest.raises(ValueError, match="Not a directory"):
        sr.add_source(str(tmp_path / "nonexistent"))


def test_add_source_rejects_duplicate_path(tmp_path: Path, _isolated_registry):
    external = tmp_path / "external"
    external.mkdir()
    sr.add_source(str(external), label="First")
    with pytest.raises(ValueError, match="already registered"):
        sr.add_source(str(external), label="Second")


def test_add_source_rejects_raw_dir_itself(_isolated_registry):
    raw_dir, _ = _isolated_registry
    with pytest.raises(ValueError, match="Cannot add"):
        sr.add_source(str(raw_dir))


def test_add_source_rejects_folder_inside_raw_dir(_isolated_registry):
    raw_dir, _ = _isolated_registry
    nested = raw_dir / "nested"
    nested.mkdir()
    with pytest.raises(ValueError, match="Cannot add"):
        sr.add_source(str(nested))


def test_add_source_dedupes_link_names(tmp_path: Path, _isolated_registry):
    a = tmp_path / "a"
    a.mkdir()
    b = tmp_path / "b"
    b.mkdir()

    first = sr.add_source(str(a), label="Notes")
    second = sr.add_source(str(b), label="Notes")

    assert first["link_name"] == "notes"
    assert second["link_name"] == "notes-2"


def test_list_sources_reports_file_count_and_existence(tmp_path: Path, _isolated_registry):
    external = tmp_path / "external"
    external.mkdir()
    (external / "a.md").write_text("x", encoding="utf-8")
    (external / "b.md").write_text("y", encoding="utf-8")
    entry = sr.add_source(str(external), label="Docs")

    listed = sr.list_sources()
    assert len(listed) == 1
    assert listed[0]["id"] == entry["id"]
    assert listed[0]["exists"] is True
    assert listed[0]["file_count"] == 2


def test_remove_source_deletes_symlink(tmp_path: Path, _isolated_registry):
    raw_dir, _ = _isolated_registry
    external = tmp_path / "external"
    external.mkdir()
    (external / "a.md").write_text("hi\n", encoding="utf-8")
    entry = sr.add_source(str(external), label="Docs")
    assert (raw_dir / "docs" / "a.md").is_symlink()

    removed = sr.remove_source(entry["id"])

    assert removed is True
    assert not (raw_dir / "docs").exists()
    assert sr.list_sources() == []


def test_remove_source_returns_false_for_unknown_id(_isolated_registry):
    assert sr.remove_source("nonexistent") is False


def test_set_enabled_false_removes_symlink_but_keeps_entry(tmp_path: Path, _isolated_registry):
    raw_dir, _ = _isolated_registry
    external = tmp_path / "external"
    external.mkdir()
    (external / "a.md").write_text("hi\n", encoding="utf-8")
    entry = sr.add_source(str(external), label="Docs")

    updated = sr.set_enabled(entry["id"], False)

    assert updated["enabled"] is False
    assert not (raw_dir / "docs").exists()
    assert len(sr.list_sources()) == 1


def test_set_enabled_true_restores_symlink(tmp_path: Path, _isolated_registry):
    raw_dir, _ = _isolated_registry
    external = tmp_path / "external"
    external.mkdir()
    (external / "a.md").write_text("hi\n", encoding="utf-8")
    entry = sr.add_source(str(external), label="Docs")
    sr.set_enabled(entry["id"], False)

    sr.set_enabled(entry["id"], True)

    assert (raw_dir / "docs" / "a.md").is_symlink()


def test_set_enabled_unknown_id_returns_none(_isolated_registry):
    assert sr.set_enabled("nonexistent", True) is None


def test_discover_raw_source_files_sees_files_inside_a_registered_source(
    tmp_path: Path, _isolated_registry
):
    raw_dir, _ = _isolated_registry
    external = tmp_path / "external"
    (external / "nested").mkdir(parents=True)
    (external / "top.md").write_text("top\n", encoding="utf-8")
    (external / "nested" / "deep.md").write_text("deep\n", encoding="utf-8")

    sr.add_source(str(external), label="Notes")

    found = {str(p.relative_to(raw_dir)) for p in discover_raw_source_files(raw_dir)}
    assert "notes/top.md" in found
    assert "notes/nested/deep.md" in found


def test_mirror_picks_up_a_file_added_to_the_source_after_registration(
    tmp_path: Path, _isolated_registry
):
    raw_dir, _ = _isolated_registry
    external = tmp_path / "external"
    external.mkdir()
    sr.add_source(str(external), label="Notes")
    assert not (raw_dir / "notes" / "late.md").exists()

    (external / "late.md").write_text("late\n", encoding="utf-8")
    sr.sync_symlinks()

    assert (raw_dir / "notes" / "late.md").is_symlink()


def test_mirror_drops_a_symlink_for_a_file_removed_from_the_source(
    tmp_path: Path, _isolated_registry
):
    raw_dir, _ = _isolated_registry
    external = tmp_path / "external"
    external.mkdir()
    (external / "gone.md").write_text("bye\n", encoding="utf-8")
    sr.add_source(str(external), label="Notes")
    assert (raw_dir / "notes" / "gone.md").is_symlink()

    (external / "gone.md").unlink()
    sr.sync_symlinks()

    assert not (raw_dir / "notes" / "gone.md").exists()


def test_sync_symlinks_replaces_a_stale_top_level_symlink_with_a_mirror(
    tmp_path: Path, _isolated_registry
):
    """A leftover single-symlink-to-directory (e.g. from an older on-disk
    layout, or a half-applied migration) must not be treated as an
    already-correct mirror -- Path.rglob() can't see through it, so files
    added since would otherwise stay permanently invisible."""
    raw_dir, sources_file = _isolated_registry
    external = tmp_path / "external"
    external.mkdir()
    (external / "a.md").write_text("hi\n", encoding="utf-8")

    # Simulate the stale state directly: a registry entry plus a raw top-level
    # symlink standing in for what a mirror directory should be.
    sources_file.write_text(
        '{"version": 1, "sources": [{"id": "x", "label": "Notes", '
        f'"path": "{external}", "link_name": "notes", "enabled": true, '
        '"added_at": "2020-01-01T00:00:00Z"}]}',
        encoding="utf-8",
    )
    (raw_dir / "notes").symlink_to(external, target_is_directory=True)
    assert (raw_dir / "notes").is_symlink()

    sr.sync_symlinks()

    assert not (raw_dir / "notes").is_symlink()
    assert (raw_dir / "notes").is_dir()
    assert (raw_dir / "notes" / "a.md").is_symlink()
    found = {str(p.relative_to(raw_dir)) for p in discover_raw_source_files(raw_dir)}
    assert "notes/a.md" in found


def test_sync_symlinks_never_touches_unmanaged_files(tmp_path: Path, _isolated_registry):
    raw_dir, _ = _isolated_registry
    manual_dir = raw_dir / "manual-notes"
    manual_dir.mkdir()
    (manual_dir / "keep.md").write_text("keep me\n", encoding="utf-8")

    sr.sync_symlinks()

    assert (manual_dir / "keep.md").read_text(encoding="utf-8") == "keep me\n"


def test_sync_symlinks_does_not_clobber_name_collision(tmp_path: Path, _isolated_registry):
    raw_dir, _ = _isolated_registry
    # A real directory named "docs" already exists in data/raw/.
    (raw_dir / "docs").mkdir()
    (raw_dir / "docs" / "existing.md").write_text("mine\n", encoding="utf-8")

    external = tmp_path / "external"
    external.mkdir()
    sr.add_source(str(external), label="Docs")

    # add_source's own _unique_link_name only checks the registry, not the
    # filesystem, so this is the second-order guarantee: sync_symlinks
    # itself refuses to overwrite something real that owns the name.
    assert (raw_dir / "docs" / "existing.md").read_text(encoding="utf-8") == "mine\n"
