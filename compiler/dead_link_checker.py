#!/usr/bin/env python3
"""Scan compiled wiki docs for markdown links that point to missing files."""

from __future__ import annotations

import argparse
import re
from pathlib import Path
from urllib.parse import unquote

from models import OUTPUT_DIR

LINK_RE = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")

SKIP_PREFIXES = ("http://", "https://", "mailto:", "tel:", "data:")
SKIP_EXACT = ("", "#")


def strip_frontmatter(content: str) -> str:
    if not content.startswith("---"):
        return content
    parts = content.split("---", 2)
    return parts[2].lstrip("\n") if len(parts) >= 3 else content


def iter_markdown_files(docs_dir: Path) -> list[Path]:
    return sorted(path for path in docs_dir.rglob("*.md") if path.is_file())


def resolve_href(href: str, source_file: Path, docs_dir: Path) -> Path | None:
    """
    Resolve a markdown href to an expected file path under docs_dir.

    Returns None for external URLs, anchors, and other non-file links.
    """
    href = href.strip()
    if href in SKIP_EXACT or href.startswith("#"):
        return None
    if href.startswith(SKIP_PREFIXES):
        return None

    if href.startswith("/docs/"):
        rel = unquote(href.removeprefix("/docs/").lstrip("/"))
        if not rel:
            return None
        if rel.endswith(".md"):
            return docs_dir / rel
        return docs_dir / f"{rel}.md"

    if not href.endswith(".md"):
        return None

    clean = href.removeprefix("./")
    source_dir = source_file.parent
    resolved = (source_dir / clean).resolve()
    try:
        resolved.relative_to(docs_dir.resolve())
    except ValueError:
        return None
    return resolved


def target_exists(path: Path) -> bool:
    return path.is_file()


def find_broken_links(docs_dir: Path) -> list[tuple[Path, int, str, str, Path]]:
    """
    Return tuples of (source_file, line_no, link_text, href, resolved_path)
    for links whose resolved target file does not exist.
    """
    broken: list[tuple[Path, int, str, str, Path]] = []

    for source_file in iter_markdown_files(docs_dir):
        rel_source = source_file.relative_to(docs_dir)
        body = strip_frontmatter(source_file.read_text(encoding="utf-8"))

        for line_no, line in enumerate(body.splitlines(), start=1):
            for match in LINK_RE.finditer(line):
                link_text = match.group(1)
                href = match.group(2).strip()
                resolved = resolve_href(href, source_file, docs_dir)
                if resolved is None:
                    continue
                if not target_exists(resolved):
                    broken.append((rel_source, line_no, link_text, href, resolved))

    return broken


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Find markdown links in wiki-app/docs that point to missing files"
    )
    parser.add_argument(
        "--docs-dir",
        type=Path,
        default=OUTPUT_DIR,
        help=f"Docs directory to scan (default: {OUTPUT_DIR})",
    )
    args = parser.parse_args()

    docs_dir = args.docs_dir.resolve()
    if not docs_dir.is_dir():
        raise SystemExit(f"Docs directory not found: {docs_dir}")

    broken = find_broken_links(docs_dir)

    if not broken:
        print(f"No broken markdown file links found in {docs_dir}")
        raise SystemExit(0)

    print(f"Broken markdown file links in {docs_dir}: {len(broken)}\n")
    for source_file, line_no, link_text, href, resolved in broken:
        print(f"{source_file}:{line_no}")
        print(f"  [{link_text}]({href})")
        print(f"  -> missing: {resolved.relative_to(docs_dir)}")
        print()

    raise SystemExit(1)


if __name__ == "__main__":
    main()
