"""Plain folder management for data/raw/ -- create, delete, and move files
between subdirectories, backing the dashboard's file-explorer UI.

Deliberately kept separate from sources_registry.py: a *registered source*
(sources_registry.py) is a mirror of an external directory, resynced from
that external directory on every sync_symlinks() call, so reorganizing
inside it would just get undone. This module only ever touches the plain
part of data/raw/ that a user placed there directly (or the module itself
created) -- any path whose top-level segment is a registered source's
link_name is refused, and any operation whose target is itself a symlink
is refused (all mirrored source files are symlinks; every operand here is
checked before, not after, resolving symlinks, so a symlink is never
silently swapped for the real file it points at).
"""

from __future__ import annotations

import shutil
from pathlib import Path

_ARCHIVE_DIR_NAME = "_archive"


class FolderError(ValueError):
    """Raised for any invalid or disallowed folder/move operation."""


def _top_segment(rel_path: str) -> str:
    return rel_path.split("/", 1)[0]


def _assert_within(raw_dir: Path, candidate: Path) -> None:
    """Validate `candidate` resolves inside raw_dir. Only used for the
    escape check -- never use the resolved path as the operand, since
    resolving follows symlinks and would silently swap in whatever a
    symlink points at."""
    resolved = candidate.resolve()
    raw_resolved = raw_dir.resolve()
    if resolved != raw_resolved and raw_resolved not in resolved.parents:
        raise FolderError("Path escapes data/raw/")


def _check_not_managed(rel_path: str, managed_names: set[str]) -> None:
    if rel_path and _top_segment(rel_path) in managed_names:
        raise FolderError(
            "This path belongs to a registered source folder -- "
            "edit files there directly, or in the Source folders panel."
        )


def discover_raw_folders(raw_dir: Path) -> list[str]:
    """Every directory under raw_dir (including empty ones), as relative
    posix paths, excluding _archive/ and dotfolders."""
    if not raw_dir.is_dir():
        return []
    folders: list[str] = []
    for path in raw_dir.rglob("*"):
        if not path.is_dir():
            continue
        if path.name.startswith(".") or _ARCHIVE_DIR_NAME in path.parts:
            continue
        folders.append(str(path.relative_to(raw_dir)).replace("\\", "/"))
    return sorted(folders)


def create_folder(
    raw_dir: Path, parent: str, name: str, managed_names: set[str]
) -> str:
    name = (name or "").strip()
    if not name:
        raise FolderError("Folder name is required")
    if "/" in name or "\\" in name or name in (".", "..") or name.startswith("."):
        raise FolderError("Invalid folder name")

    parent = (parent or "").strip().strip("/")
    _check_not_managed(parent, managed_names)
    parent_dir = raw_dir / parent if parent else raw_dir
    _assert_within(raw_dir, parent_dir)
    if parent and not parent_dir.is_dir():
        raise FolderError(f"Parent folder not found: {parent}")

    rel_path = f"{parent}/{name}" if parent else name
    _check_not_managed(rel_path, managed_names)
    new_dir = raw_dir / rel_path
    _assert_within(raw_dir, new_dir)
    if new_dir.exists():
        raise FolderError(f"Already exists: {rel_path}")

    new_dir.mkdir(parents=False)
    return rel_path


def delete_folder(raw_dir: Path, rel_path: str, managed_names: set[str]) -> None:
    rel_path = (rel_path or "").strip().strip("/")
    if not rel_path:
        raise FolderError("Cannot delete data/raw/ itself")
    _check_not_managed(rel_path, managed_names)
    target = raw_dir / rel_path
    _assert_within(raw_dir, target)
    if target.is_symlink() or not target.is_dir():
        raise FolderError(f"Folder not found: {rel_path}")
    if any(target.iterdir()):
        raise FolderError("Folder is not empty")
    target.rmdir()


def move_file(
    raw_dir: Path, source_rel: str, destination_dir_rel: str, managed_names: set[str]
) -> str:
    source_rel = (source_rel or "").strip().strip("/")
    destination_dir_rel = (destination_dir_rel or "").strip().strip("/")
    if not source_rel:
        raise FolderError("Source path is required")

    _check_not_managed(source_rel, managed_names)
    _check_not_managed(destination_dir_rel, managed_names)

    source = raw_dir / source_rel
    _assert_within(raw_dir, source)
    if source.is_symlink() or not source.is_file():
        raise FolderError(f"Source file not found: {source_rel}")

    dest_dir = raw_dir / destination_dir_rel if destination_dir_rel else raw_dir
    _assert_within(raw_dir, dest_dir)
    if not dest_dir.is_dir():
        raise FolderError(f"Destination folder not found: {destination_dir_rel}")

    destination = dest_dir / source.name
    if destination.exists():
        raise FolderError(f"A file named {source.name} already exists there")

    shutil.move(str(source), str(destination))
    new_rel = f"{destination_dir_rel}/{source.name}" if destination_dir_rel else source.name
    return new_rel
