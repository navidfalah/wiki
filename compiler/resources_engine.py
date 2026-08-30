"""Resources engine — every cited source, deduped and browsable on its own.

Every synthesized page already carries a deterministic '## References &
Trust' table (trust.py). This module inverts that: instead of "what does
this page cite", it answers "what cites this source" — so a resource (an
email thread, a note, an image) is reusable and inspectable independently of
whichever page happened to reference it first.
"""

from __future__ import annotations

import re
from pathlib import Path
from typing import Any

from doc_utils import parse_frontmatter
from models import OUTPUT_DIR, RAW_DIR

REFERENCES_ROW_RE = re.compile(
    r"^\|\s*\d+\s*\|\s*`([^`]+)`\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*$",
    re.MULTILINE,
)


def parse_references_table(body: str) -> list[dict[str, str]]:
    return [
        {
            "source": match.group(1),
            "source_type": match.group(2).strip(),
            "trust": match.group(3).strip(),
        }
        for match in REFERENCES_ROW_RE.finditer(body)
    ]


def list_resources(
    docs_dir: Path | None = None,
    q: str | None = None,
    source_type: str | None = None,
    trust: str | None = None,
) -> dict[str, Any]:
    docs_dir = docs_dir or OUTPUT_DIR
    resources: dict[str, dict[str, Any]] = {}

    if docs_dir.is_dir():
        for path in sorted(docs_dir.rglob("*.md")):
            rel = str(path.relative_to(docs_dir)).replace("\\", "/")
            raw = path.read_text(encoding="utf-8")
            meta = parse_frontmatter(raw)
            title = meta.get("title") or path.stem.replace("-", " ").title()
            for row in parse_references_table(raw):
                entry = resources.setdefault(
                    row["source"],
                    {
                        "source": row["source"],
                        "source_type": row["source_type"],
                        "trust": row["trust"],
                        "citing_pages": [],
                    },
                )
                entry["citing_pages"].append({"doc_path": rel, "title": title})

    items = list(resources.values())
    for item in items:
        item["citing_pages"].sort(key=lambda page: page["title"].lower())
        item["citation_count"] = len(item["citing_pages"])

    needle = (q or "").strip().lower()
    if needle:
        items = [item for item in items if needle in item["source"].lower()]
    if source_type:
        items = [item for item in items if item["source_type"] == source_type]
    if trust:
        items = [item for item in items if item["trust"].lower() == trust.lower()]

    items.sort(key=lambda item: (-item["citation_count"], item["source"]))
    return {"total": len(items), "resources": items}


def get_resource_detail(
    source_path: str,
    docs_dir: Path | None = None,
    raw_dir: Path | None = None,
) -> dict[str, Any] | None:
    """One resource's citing pages plus a raw content preview when available."""
    docs_dir = docs_dir or OUTPUT_DIR
    raw_dir = raw_dir or RAW_DIR

    match = next(
        (item for item in list_resources(docs_dir)["resources"] if item["source"] == source_path),
        None,
    )
    if match is None:
        return None

    preview = None
    candidate = (raw_dir / source_path).resolve()
    if str(candidate).startswith(str(raw_dir.resolve())) and candidate.is_file():
        try:
            preview = candidate.read_text(encoding="utf-8")[:4000]
        except (UnicodeDecodeError, OSError):
            preview = None

    return {**match, "preview": preview}
