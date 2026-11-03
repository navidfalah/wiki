"""Version history for compiled wiki pages.

Before a page under wiki-app/docs/ is overwritten or deleted, its current
content is copied to data/page_history/<page-stem>/<stamp>-<reason>.md.
Every compile rewrites every relinked page, so a version is only recorded
when the content actually changed; the frontmatter's timestamp lines don't
count. The backend (backend/src/lib/pageHistory.ts) does the same for
manual edits and deletes, lists versions and diffs them. Keep the on-disk
format in sync with that file.
"""

from __future__ import annotations

import re
from datetime import datetime, timezone
from pathlib import Path

from models import PROJECT_ROOT

HISTORY_DIR = PROJECT_ROOT / "data" / "page_history"
MAX_VERSIONS_PER_PAGE = 20
REASONS = ("compile", "edit", "delete", "restore")

_VOLATILE_LINE_RE = re.compile(r"^(last_updated|last_modified):.*$", re.MULTILINE)


def comparable(text: str) -> str:
    return _VOLATILE_LINE_RE.sub("", text)


def version_stamp(now: datetime | None = None) -> str:
    """UTC, sortable, microsecond resolution: 20260927T124500123456Z."""
    return (now or datetime.now(timezone.utc)).strftime("%Y%m%dT%H%M%S%fZ")


def snapshot(
    page_path: Path,
    reason: str,
    new_content: str | None = None,
    *,
    history_dir: Path | None = None,
    now: datetime | None = None,
) -> Path | None:
    """Save `page_path`'s current content as a version before it is replaced
    by `new_content` (or deleted, when `new_content` is None). Returns the
    version file, or None if there was nothing to save or nothing changed."""
    if reason not in REASONS:
        raise ValueError(f"Unknown page history reason: {reason!r}")
    if not page_path.is_file():
        return None
    old = page_path.read_text(encoding="utf-8")
    if new_content is not None and comparable(old) == comparable(new_content):
        return None
    page_dir = (history_dir or HISTORY_DIR) / page_path.stem
    page_dir.mkdir(parents=True, exist_ok=True)
    version = page_dir / f"{version_stamp(now)}-{reason}.md"
    version.write_text(old, encoding="utf-8")
    _prune(page_dir)
    return version


def _prune(page_dir: Path) -> None:
    versions = sorted(page_dir.glob("*.md"))
    for old in versions[: max(0, len(versions) - MAX_VERSIONS_PER_PAGE)]:
        old.unlink()
