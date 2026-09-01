"""Tests for raw_folders.py -- create/delete folders and move files inside
data/raw/, backing the dashboard's file-explorer UI. Fully deterministic,
no LLM, no server."""

from pathlib import Path

import pytest

from raw_folders import FolderError, create_folder, delete_folder, discover_raw_folders, move_file


def test_discover_raw_folders_empty_dir(tmp_path: Path):
    assert discover_raw_folders(tmp_path) == []


def test_discover_raw_folders_finds_nested_dirs(tmp_path: Path):
    (tmp_path / "a" / "b").mkdir(parents=True)
    (tmp_path / "c").mkdir()
    assert discover_raw_folders(tmp_path) == ["a", "a/b", "c"]


def test_discover_raw_folders_skips_archive_and_dotdirs(tmp_path: Path):
    (tmp_path / "_archive").mkdir()
    (tmp_path / ".hidden").mkdir()
    (tmp_path / "visible").mkdir()
    assert discover_raw_folders(tmp_path) == ["visible"]


def test_create_folder_at_root(tmp_path: Path):
    rel = create_folder(tmp_path, "", "Notes", set())
    assert rel == "Notes"
    assert (tmp_path / "Notes").is_dir()


def test_create_folder_nested(tmp_path: Path):
    (tmp_path / "parent").mkdir()
    rel = create_folder(tmp_path, "parent", "child", set())
    assert rel == "parent/child"
    assert (tmp_path / "parent" / "child").is_dir()


def test_create_folder_rejects_empty_name(tmp_path: Path):
    with pytest.raises(FolderError, match="required"):
        create_folder(tmp_path, "", "  ", set())


def test_create_folder_rejects_slash_in_name(tmp_path: Path):
    with pytest.raises(FolderError, match="Invalid"):
        create_folder(tmp_path, "", "a/b", set())


def test_create_folder_rejects_dotdot(tmp_path: Path):
    with pytest.raises(FolderError, match="Invalid"):
        create_folder(tmp_path, "", "..", set())


def test_create_folder_rejects_duplicate(tmp_path: Path):
    create_folder(tmp_path, "", "Notes", set())
    with pytest.raises(FolderError, match="Already exists"):
        create_folder(tmp_path, "", "Notes", set())


def test_create_folder_rejects_missing_parent(tmp_path: Path):
    with pytest.raises(FolderError, match="Parent folder not found"):
        create_folder(tmp_path, "nonexistent", "child", set())


def test_create_folder_rejects_managed_source_name(tmp_path: Path):
    with pytest.raises(FolderError, match="registered source"):
        create_folder(tmp_path, "", "demo-folder", {"demo-folder"})


def test_create_folder_rejects_nesting_inside_managed_source(tmp_path: Path):
    (tmp_path / "demo-folder").mkdir()
    with pytest.raises(FolderError, match="registered source"):
        create_folder(tmp_path, "demo-folder", "child", {"demo-folder"})


def test_delete_folder_removes_empty_folder(tmp_path: Path):
    (tmp_path / "empty").mkdir()
    delete_folder(tmp_path, "empty", set())
    assert not (tmp_path / "empty").exists()


def test_delete_folder_rejects_nonempty(tmp_path: Path):
    (tmp_path / "full").mkdir()
    (tmp_path / "full" / "a.md").write_text("x", encoding="utf-8")
    with pytest.raises(FolderError, match="not empty"):
        delete_folder(tmp_path, "full", set())


def test_delete_folder_rejects_root(tmp_path: Path):
    with pytest.raises(FolderError, match="Cannot delete"):
        delete_folder(tmp_path, "", set())


def test_delete_folder_rejects_missing(tmp_path: Path):
    with pytest.raises(FolderError, match="not found"):
        delete_folder(tmp_path, "nonexistent", set())


def test_delete_folder_rejects_managed_source(tmp_path: Path):
    (tmp_path / "demo-folder").mkdir()
    with pytest.raises(FolderError, match="registered source"):
        delete_folder(tmp_path, "demo-folder", {"demo-folder"})


def test_move_file_into_subfolder(tmp_path: Path):
    (tmp_path / "a.md").write_text("hi\n", encoding="utf-8")
    (tmp_path / "notes").mkdir()

    new_rel = move_file(tmp_path, "a.md", "notes", set())

    assert new_rel == "notes/a.md"
    assert (tmp_path / "notes" / "a.md").read_text(encoding="utf-8") == "hi\n"
    assert not (tmp_path / "a.md").exists()


def test_move_file_back_to_root(tmp_path: Path):
    (tmp_path / "notes").mkdir()
    (tmp_path / "notes" / "a.md").write_text("hi\n", encoding="utf-8")

    new_rel = move_file(tmp_path, "notes/a.md", "", set())

    assert new_rel == "a.md"
    assert (tmp_path / "a.md").is_file()


def test_move_file_rejects_missing_source(tmp_path: Path):
    with pytest.raises(FolderError, match="Source file not found"):
        move_file(tmp_path, "nonexistent.md", "", set())


def test_move_file_rejects_missing_destination(tmp_path: Path):
    (tmp_path / "a.md").write_text("hi\n", encoding="utf-8")
    with pytest.raises(FolderError, match="Destination folder not found"):
        move_file(tmp_path, "a.md", "nonexistent", set())


def test_move_file_rejects_name_collision(tmp_path: Path):
    (tmp_path / "a.md").write_text("one\n", encoding="utf-8")
    (tmp_path / "notes").mkdir()
    (tmp_path / "notes" / "a.md").write_text("two\n", encoding="utf-8")

    with pytest.raises(FolderError, match="already exists"):
        move_file(tmp_path, "a.md", "notes", set())


def test_move_file_rejects_symlinked_source(tmp_path: Path):
    real = tmp_path / "real.md"
    real.write_text("hi\n", encoding="utf-8")
    link = tmp_path / "link.md"
    link.symlink_to(real)

    with pytest.raises(FolderError, match="Source file not found"):
        move_file(tmp_path, "link.md", "", set())


def test_move_file_rejects_source_inside_managed_source(tmp_path: Path):
    managed = tmp_path / "demo-folder"
    managed.mkdir()
    (managed / "a.md").write_text("hi\n", encoding="utf-8")

    with pytest.raises(FolderError, match="registered source"):
        move_file(tmp_path, "demo-folder/a.md", "", {"demo-folder"})


def test_move_file_rejects_destination_inside_managed_source(tmp_path: Path):
    (tmp_path / "a.md").write_text("hi\n", encoding="utf-8")
    (tmp_path / "demo-folder").mkdir()

    with pytest.raises(FolderError, match="registered source"):
        move_file(tmp_path, "a.md", "demo-folder", {"demo-folder"})


def test_create_folder_and_move_reject_path_traversal(tmp_path: Path):
    with pytest.raises(FolderError, match="escapes"):
        create_folder(tmp_path, "../outside", "x", set())
