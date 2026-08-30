#!/usr/bin/env python3
"""Re-apply MDX sanitization to wiki-app/docs bodies."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from mdx_sanitize import sanitize_for_mdx


def _split_frontmatter(content: str) -> tuple[str | None, str]:
    if not content.startswith("---"):
        return None, content
    parts = content.split("---", 2)
    if len(parts) < 3:
        return None, content
    return parts[1].strip(), parts[2]

COMPILER_DIR = Path(__file__).resolve().parent
DEFAULT_DOCS = COMPILER_DIR.parent / "wiki-app" / "docs"


def fix_doc(path: Path, *, dry_run: bool) -> bool:
    content = path.read_text(encoding="utf-8")
    fm, body = _split_frontmatter(content)
    if fm is None:
        sanitized_body = sanitize_for_mdx(content)
        if sanitized_body == content:
            return False
        if not dry_run:
            path.write_text(sanitized_body, encoding="utf-8")
        return True

    sanitized_body = sanitize_for_mdx(body)
    if sanitized_body == body:
        return False
    if not dry_run:
        path.write_text(f"---\n{fm}\n---{sanitized_body}", encoding="utf-8")
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--docs-dir", type=Path, default=DEFAULT_DOCS)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    docs_dir: Path = args.docs_dir
    if not docs_dir.is_dir():
        print(f"Not a directory: {docs_dir}", file=sys.stderr)
        return 1

    touched = 0
    for path in sorted(docs_dir.rglob("*.md")):
        if fix_doc(path, dry_run=args.dry_run):
            touched += 1
            print(path.relative_to(docs_dir))

    mode = "would update" if args.dry_run else "updated"
    print(f"\n{mode} {touched} file(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
