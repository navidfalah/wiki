#!/usr/bin/env python3
"""Quote unsafe YAML frontmatter string fields in wiki-app/docs."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

from yaml_frontmatter import yaml_quote

COMPILER_DIR = Path(__file__).resolve().parent
DEFAULT_DOCS = COMPILER_DIR.parent / "wiki-app" / "docs"

_SCALAR_FIELDS = ("title", "sidebar_label", "id", "slug", "last_updated", "page_type")


def _split_frontmatter(content: str) -> tuple[str | None, str]:
    if not content.startswith("---"):
        return None, content
    parts = content.split("---", 2)
    if len(parts) < 3:
        return None, content
    return parts[1].strip(), parts[2]


def _parse_scalar(raw: str) -> str:
    value = raw.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
        return value[1:-1]
    return value


def _fix_frontmatter_block(fm: str) -> tuple[str, int]:
    fixes = 0
    lines: list[str] = []
    for line in fm.splitlines():
        matched = False
        for field in _SCALAR_FIELDS:
            prefix = f"{field}:"
            if line.startswith(prefix):
                raw_value = line[len(prefix) :].strip()
                parsed = _parse_scalar(raw_value)
                quoted = yaml_quote(parsed)
                if quoted != raw_value:
                    fixes += 1
                lines.append(f"{field}: {quoted}")
                matched = True
                break
        if not matched:
            lines.append(line)
    return "\n".join(lines), fixes


def fix_doc(path: Path, *, dry_run: bool) -> int:
    content = path.read_text(encoding="utf-8")
    fm, body = _split_frontmatter(content)
    if fm is None:
        return 0
    fixed_fm, fixes = _fix_frontmatter_block(fm)
    if fixes == 0:
        return 0
    if not dry_run:
        path.write_text(f"---\n{fixed_fm}\n---{body}", encoding="utf-8")
    return fixes


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--docs-dir",
        type=Path,
        default=DEFAULT_DOCS,
        help="Directory of markdown docs (default: wiki-app/docs)",
    )
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    docs_dir: Path = args.docs_dir
    if not docs_dir.is_dir():
        print(f"Not a directory: {docs_dir}", file=sys.stderr)
        return 1

    total_fields = 0
    files_touched = 0
    for path in sorted(docs_dir.rglob("*.md")):
        fixes = fix_doc(path, dry_run=args.dry_run)
        if fixes:
            files_touched += 1
            total_fields += fixes
            print(f"{path.relative_to(docs_dir)}: {fixes} field(s)")

    mode = "would fix" if args.dry_run else "fixed"
    print(f"\n{mode} {total_fields} field(s) in {files_touched} file(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
