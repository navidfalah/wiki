"""Aggregate wiki metrics, tag index, and dead-link audit data."""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from dead_link_checker import find_broken_links
from link_overrides import detect_topic_links
from linker import INDEX_JSON, load_topic_index
from models import OUTPUT_DIR, RAW_DIR
from synthesizer import compute_file_md5, discover_raw_source_files, load_state, slugify


@dataclass
class TagBucket:
    tag: str
    label: str
    raw_chunks: list[dict[str, Any]] = field(default_factory=list)
    pages: list[dict[str, Any]] = field(default_factory=list)

    @property
    def count(self) -> int:
        return len(self.raw_chunks) + len(self.pages)


def _normalize_tag(label: str) -> str:
    return slugify(label) or label.lower().strip()


def _chunk_key(source: str, chunk_index: int) -> tuple[str, int]:
    return (source, chunk_index)


def _register_raw_chunk(
    registry: dict[str, TagBucket],
    label: str,
    chunk: dict[str, Any],
    source: str,
) -> None:
    key = _normalize_tag(label)
    if not key:
        return
    bucket = registry.setdefault(
        key,
        TagBucket(tag=key, label=label.strip() or key),
    )
    entry = {
        "source": source,
        "chunk_index": chunk["chunk_index"],
        "preview": chunk.get("text", "")[:240].replace("\n", " "),
        "topics": chunk.get("topics", []),
    }
    dedupe_key = _chunk_key(source, chunk["chunk_index"])
    if any(_chunk_key(item["source"], item["chunk_index"]) == dedupe_key for item in bucket.raw_chunks):
        return
    bucket.raw_chunks.append(entry)


def _register_page(
    registry: dict[str, TagBucket],
    label: str,
    page: dict[str, Any],
) -> None:
    key = _normalize_tag(label)
    if not key:
        return
    bucket = registry.setdefault(
        key,
        TagBucket(tag=key, label=label.strip() or key),
    )
    if any(item["path"] == page["path"] for item in bucket.pages):
        return
    bucket.pages.append(page)


def _parse_frontmatter_tags(content: str) -> list[str]:
    if not content.startswith("---"):
        return []
    parts = content.split("---", 2)
    if len(parts) < 3:
        return []
    tags: list[str] = []
    in_tags = False
    for line in parts[1].splitlines():
        if in_tags:
            if line.startswith("  - "):
                tags.append(line[4:].strip().strip('"').strip("'"))
                continue
            if line.startswith("- "):
                tags.append(line[2:].strip().strip('"').strip("'"))
                continue
            in_tags = False
        if line.strip().startswith("tags:"):
            in_tags = True
    return tags


def _count_processed_raw_files(state: dict) -> tuple[int, int]:
    processed = 0
    total = 0
    files_state = state.get("files", {})

    for path in discover_raw_source_files(RAW_DIR):
        total += 1
        rel = str(path.relative_to(RAW_DIR)).replace("\\", "/")
        md5 = compute_file_md5(path)
        entry = files_state.get(rel)
        if entry and entry.get("md5") == md5:
            processed += 1

    return processed, total


def _build_tag_registry(
    state: dict,
    topic_index: dict[str, str],
    docs_dir: Path,
) -> dict[str, TagBucket]:
    registry: dict[str, TagBucket] = {}

    for source, file_entry in state.get("files", {}).items():
        for chunk in file_entry.get("chunks", []):
            labels: set[str] = set()
            for topic in chunk.get("topics") or []:
                labels.add(topic)
            for entity in chunk.get("entities") or []:
                name = entity.get("name")
                if name:
                    labels.add(name)
            for concept in chunk.get("concepts") or []:
                name = concept.get("name")
                if name:
                    labels.add(name)
            for label in labels:
                _register_raw_chunk(registry, label, chunk, source)

    indexed_files = set(topic_index.values())
    for title, filename in topic_index.items():
        doc_path = docs_dir / filename
        if not doc_path.is_file():
            continue
        raw = doc_path.read_text(encoding="utf-8")
        page = {
            "path": filename,
            "title": title,
            "id": Path(filename).stem,
        }
        _register_page(registry, title, page)
        for tag in _parse_frontmatter_tags(raw):
            _register_page(registry, tag, page)

    for path in sorted(docs_dir.rglob("*.md")):
        rel = str(path.relative_to(docs_dir)).replace("\\", "/")
        if rel == "index.md" or rel in indexed_files:
            continue
        raw = path.read_text(encoding="utf-8")
        title = path.stem.replace("-", " ").title()
        if raw.startswith("---"):
            match = re.search(r"^title:\s*(.+)$", raw, re.MULTILINE)
            if match:
                title = match.group(1).strip().strip('"').strip("'")
        page = {"path": rel, "title": title, "id": Path(rel).stem.replace("/", "-")}
        for tag in _parse_frontmatter_tags(raw):
            _register_page(registry, tag, page)

    return registry


def build_analytics(docs_dir: Path | None = None) -> dict[str, Any]:
    root = docs_dir or OUTPUT_DIR
    state = load_state()

    processed, raw_total = _count_processed_raw_files(state)

    topic_index: dict[str, str] = {}
    if INDEX_JSON.is_file():
        try:
            topic_index = load_topic_index(INDEX_JSON)
        except FileNotFoundError:
            topic_index = {}

    wiki_pages = len(topic_index)
    cross_links = len(detect_topic_links(topic_index, docs_dir=root)) if topic_index else 0

    broken = find_broken_links(root)
    dead_links = [
        {
            "source": str(source),
            "line": line_no,
            "text": link_text,
            "href": href,
            "missing": str(missing.relative_to(root)),
        }
        for source, line_no, link_text, href, missing in broken
    ]

    registry = _build_tag_registry(state, topic_index, root)
    tag_summaries = sorted(
        [
            {
                "tag": bucket.tag,
                "label": bucket.label,
                "count": bucket.count,
                "raw_count": len(bucket.raw_chunks),
                "page_count": len(bucket.pages),
            }
            for bucket in registry.values()
            if bucket.count > 0
        ],
        key=lambda item: (-item["count"], item["label"].lower()),
    )

    tag_details = {
        bucket.tag: {
            "tag": bucket.tag,
            "label": bucket.label,
            "raw_chunks": bucket.raw_chunks,
            "pages": bucket.pages,
        }
        for bucket in registry.values()
        if bucket.count > 0
    }

    return {
        "metrics": {
            "raw_files_processed": processed,
            "raw_files_total": raw_total,
            "wiki_pages_created": wiki_pages,
            "cross_links_established": cross_links,
            "dead_links": len(dead_links),
        },
        "tags": tag_summaries,
        "tag_details": tag_details,
        "dead_links": dead_links,
    }


def get_tag_detail(tag: str, docs_dir: Path | None = None) -> dict[str, Any] | None:
    data = build_analytics(docs_dir=docs_dir)
    normalized = _normalize_tag(tag)
    return data["tag_details"].get(normalized)
