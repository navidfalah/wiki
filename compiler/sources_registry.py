"""Registry of external source folders symlinked into data/raw/.

Lets a user register additional folders that live elsewhere on disk (an
email export, a synced Drive folder, a notes vault) without moving or
copying anything. Each registered folder becomes a symlink under
RAW_DIR/<slug>/ pointing at the real path -- discover_raw_source_files()
already walks RAW_DIR recursively (synthesizer.py), so a registered folder
is picked up by the existing pipeline with no changes to extraction,
synthesis, or linking. This module only manages the registry file and the
symlinks; it never touches pipeline logic.
"""

from __future__ import annotations

import json
import re
import time
import uuid
from pathlib import Path
from typing import Any

from models import PROJECT_ROOT, RAW_DIR

SOURCES_FILE = PROJECT_ROOT / "data" / "sources.json"


def _slugify_label(label: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", label.strip().lower()).strip("-")
    return slug or "source"


def _unique_link_name(label: str, existing_names: set[str]) -> str:
    base = _slugify_label(label)
    name = base
    counter = 2
    while name in existing_names:
        name = f"{base}-{counter}"
        counter += 1
    return name


def _load() -> dict[str, Any]:
    if not SOURCES_FILE.is_file():
        return {"version": 1, "sources": []}
    try:
        data = json.loads(SOURCES_FILE.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {"version": 1, "sources": []}
    data.setdefault("sources", [])
    return data


def _save(data: dict[str, Any]) -> None:
    SOURCES_FILE.parent.mkdir(parents=True, exist_ok=True)
    SOURCES_FILE.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


def _count_files(path: Path) -> int:
    if not path.is_dir():
        return 0
    try:
        return sum(1 for p in path.rglob("*") if p.is_file() and not p.name.startswith("."))
    except OSError:
        return 0


def list_sources() -> list[dict[str, Any]]:
    """Registered source folders, enriched with live existence/file-count."""
    sources = _load()["sources"]
    enriched = []
    for entry in sources:
        target = Path(entry["path"])
        enriched.append(
            {
                **entry,
                "exists": target.is_dir(),
                "file_count": _count_files(target),
            }
        )
    return enriched


def add_source(path: str, label: str | None = None) -> dict[str, Any]:
    if not path or not path.strip():
        raise ValueError("Path is required")

    resolved = Path(path).expanduser().resolve()
    if not resolved.is_dir():
        raise ValueError(f"Not a directory: {resolved}")

    raw_resolved = RAW_DIR.resolve()
    if resolved == raw_resolved or raw_resolved in resolved.parents:
        raise ValueError("Cannot add data/raw/ (or a folder inside it) as a source")
    if resolved in raw_resolved.parents:
        raise ValueError("Cannot add a folder that contains data/raw/ as a source")

    data = _load()
    sources = data["sources"]
    if any(Path(entry["path"]).resolve() == resolved for entry in sources):
        raise ValueError("This folder is already registered")

    existing_names = {entry["link_name"] for entry in sources}
    link_name = _unique_link_name(label or resolved.name, existing_names)

    entry = {
        "id": uuid.uuid4().hex[:12],
        "label": (label or resolved.name).strip() or resolved.name,
        "path": str(resolved),
        "link_name": link_name,
        "enabled": True,
        "added_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    sources.append(entry)
    _save(data)
    sync_symlinks()
    return entry


def remove_source(source_id: str) -> bool:
    data = _load()
    sources = data["sources"]
    removed_entry = next((entry for entry in sources if entry["id"] == source_id), None)
    if removed_entry is None:
        return False
    data["sources"] = [entry for entry in sources if entry["id"] != source_id]
    _save(data)
    _remove_mirror(RAW_DIR / removed_entry["link_name"])
    sync_symlinks()
    return True


def set_enabled(source_id: str, enabled: bool) -> dict[str, Any] | None:
    data = _load()
    for entry in data["sources"]:
        if entry["id"] == source_id:
            entry["enabled"] = enabled
            _save(data)
            sync_symlinks()
            return entry
    return None


def _remove_mirror(root: Path) -> None:
    """Remove only the symlinks (and now-empty directories) this module
    created under `root` -- never a real file, and never a directory that
    still has something else in it."""
    if root.is_symlink():
        root.unlink()
        return
    if not root.is_dir():
        return
    for path in sorted(root.rglob("*"), key=lambda p: len(p.parts), reverse=True):
        if path.is_symlink():
            path.unlink()
        elif path.is_dir():
            try:
                path.rmdir()  # no-op (raises, caught) if anything real remains
            except OSError:
                pass
    try:
        root.rmdir()
    except OSError:
        pass


def _mirror_source(link_root: Path, target: Path) -> None:
    """Recreate link_root as a directory of per-file symlinks mirroring
    target's tree.

    A single symlink to an external directory is invisible to
    discover_raw_source_files()'s Path.rglob() scan, which does not descend
    into symlinked directories -- so each file gets its own symlink instead,
    inside a real (or already-existing) directory at link_root. Re-running
    this brings link_root back in sync with target: new files in target get
    a new symlink, files removed from target lose their mirrored symlink.
    """
    link_root.mkdir(parents=True, exist_ok=True)
    live_rel_paths: set[Path] = set()

    for path in target.rglob("*"):
        if not path.is_file():
            continue
        rel = path.relative_to(target)
        live_rel_paths.add(rel)
        dest = link_root / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        if dest.is_symlink():
            try:
                if dest.resolve() == path.resolve():
                    continue
            except OSError:
                pass
            dest.unlink()
        elif dest.exists():
            continue  # a real file already occupies this relative path
        try:
            dest.symlink_to(path)
        except OSError:
            continue

    for path in sorted(link_root.rglob("*"), key=lambda p: len(p.parts), reverse=True):
        rel = path.relative_to(link_root)
        if path.is_symlink():
            if rel not in live_rel_paths:
                path.unlink()
        elif path.is_dir():
            try:
                path.rmdir()
            except OSError:
                pass


def sync_symlinks() -> None:
    """Make RAW_DIR's managed source mirrors match the registry exactly.

    Only ever creates/removes symlinks (and the directories that hold them)
    under names tracked in the registry -- real files and directories a
    user placed in data/raw/ directly are never touched.
    """
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    data = _load()
    sources = data["sources"]
    all_names = {entry["link_name"] for entry in sources}
    wanted = {
        entry["link_name"]: Path(entry["path"])
        for entry in sources
        if entry.get("enabled", True)
    }

    for child in RAW_DIR.iterdir():
        if child.name in all_names and child.name not in wanted:
            _remove_mirror(child)

    for name, target in wanted.items():
        link_root = RAW_DIR / name
        if link_root.is_symlink():
            link_root.unlink()  # replace a top-level symlink (e.g. from an older layout) with a mirror directory
        elif link_root.exists() and not link_root.is_dir():
            continue  # a real file already occupies this name -- don't clobber it
        if not target.is_dir():
            continue
        _mirror_source(link_root, target)
