#!/usr/bin/env python3
"""Repair broken markdown links in wiki-app/docs by unlinking them.

dead_link_checker.py only reports broken links; this neutralizes them.
A link whose target file doesn't exist is rewritten from
`[Link Text](./missing.md)` to plain `Link Text` -- the surviving prose is
kept, only the guaranteed-404 link wrapper is removed. Frontmatter is left
untouched. Safe to re-run: already-plain text is never touched again.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

from dead_link_checker import LINK_RE, resolve_href, target_exists
from models import OUTPUT_DIR


def _split_frontmatter(content: str) -> tuple[str | None, str]:
    if not content.startswith("---"):
        return None, content
    parts = content.split("---", 2)
    if len(parts) < 3:
        return None, content
    return parts[1], parts[2]


def fix_doc(path: Path, docs_dir: Path, *, dry_run: bool) -> int:
    content = path.read_text(encoding="utf-8")
    fm, body = _split_frontmatter(content)
    if fm is None:
        return 0

    fixed = 0

    def repl(match: "re.Match[str]") -> str:
        nonlocal fixed
        link_text, href = match.group(1), match.group(2).strip()
        resolved = resolve_href(href, path, docs_dir)
        if resolved is None or target_exists(resolved):
            return match.group(0)
        fixed += 1
        return link_text

    new_body = LINK_RE.sub(repl, body)
    if fixed and not dry_run:
        path.write_text(f"---{fm}---{new_body}", encoding="utf-8")
    return fixed


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--docs-dir",
        type=Path,
        default=OUTPUT_DIR,
        help=f"Docs directory to repair (default: {OUTPUT_DIR})",
    )
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    docs_dir: Path = args.docs_dir.resolve()
    if not docs_dir.is_dir():
        print(f"Not a directory: {docs_dir}", file=sys.stderr)
        return 1

    total_links = 0
    files_touched = 0
    for path in sorted(docs_dir.rglob("*.md")):
        fixed = fix_doc(path, docs_dir, dry_run=args.dry_run)
        if fixed:
            files_touched += 1
            total_links += fixed
            print(f"{path.relative_to(docs_dir)}: unlinked {fixed} broken link(s)")

    mode = "would unlink" if args.dry_run else "unlinked"
    print(f"\n{mode} {total_links} broken link(s) in {files_touched} file(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
