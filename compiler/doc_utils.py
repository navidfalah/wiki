"""Shared helpers for reading compiled wiki pages and compiler state.

Split out of server.py so each "engine" module (email_engine.py,
resources_engine.py, rag_engine.py) can read frontmatter, look up which page
a topic compiled to, and pull entities/concepts off a raw source's state
entry without importing server.py itself (which would be circular, since
server.py is the thing wiring all the engines together as routes).
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from models import OUTPUT_DIR
from synthesizer import slugify

COMPILER_DIR = Path(__file__).resolve().parent
INDEX_JSON_PATH = COMPILER_DIR / "temp_output" / "index.json"
LINK_RE = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")


def parse_frontmatter(content: str) -> dict[str, Any]:
    if not content.startswith("---"):
        return {}
    parts = content.split("---", 2)
    if len(parts) < 3:
        return {}
    meta: dict[str, Any] = {}
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
        match = re.match(r"^(\w+):\s*(.+)$", line)
        if match:
            key = match.group(1)
            value = match.group(2).strip()
            if key == "tags" and value in ("[]", ""):
                in_tags = True
                continue
            if (value.startswith('"') and value.endswith('"')) or (
                value.startswith("'") and value.endswith("'")
            ):
                value = value[1:-1]
            meta[key] = value
            if key == "tags":
                in_tags = True
    if tags:
        meta["tags_list"] = tags
    return meta


def strip_frontmatter(content: str) -> str:
    if not content.startswith("---"):
        return content
    parts = content.split("---", 2)
    return parts[2].lstrip("\n") if len(parts) >= 3 else content


def extract_links(markdown_body: str) -> list[dict[str, str]]:
    return [
        {"text": match.group(1), "href": match.group(2)}
        for match in LINK_RE.finditer(markdown_body)
    ]


def normalize_topic(title: str) -> str:
    return re.sub(r'\\(["\'])', r"\1", title).strip()


def load_topic_index() -> dict[str, str]:
    if not INDEX_JSON_PATH.is_file():
        return {}
    data = json.loads(INDEX_JSON_PATH.read_text(encoding="utf-8"))
    topics = data.get("topics", {})
    return topics if isinstance(topics, dict) else {}


def topic_filename(topic_index: dict[str, str], topic: str, docs_dir: Path | None = None) -> str | None:
    docs_dir = docs_dir or OUTPUT_DIR
    if topic in topic_index:
        return topic_index[topic]
    normalized = normalize_topic(topic)
    for key, filename in topic_index.items():
        if normalize_topic(key) == normalized:
            return filename
    slug = slugify(normalized)
    candidate = f"{slug}.md"
    if (docs_dir / candidate).is_file():
        return candidate
    return None


def collect_source_metadata(state_entry: dict) -> dict[str, Any]:
    """Dedupe the topics/entities/concepts a raw source's chunks were tagged with."""
    topics: list[str] = []
    entities: list[dict[str, str]] = []
    concepts: list[dict[str, str]] = []
    seen_topics: set[str] = set()
    seen_entities: set[str] = set()
    seen_concepts: set[str] = set()

    for chunk in state_entry.get("chunks", []):
        for topic in chunk.get("topics") or []:
            normalized = normalize_topic(topic)
            if normalized and normalized not in seen_topics:
                seen_topics.add(normalized)
                topics.append(normalized)
        for entity in chunk.get("entities") or []:
            name = entity.get("name", "")
            if name and name not in seen_entities:
                seen_entities.add(name)
                entities.append(entity)
        for concept in chunk.get("concepts") or []:
            name = concept.get("name", "")
            if name and name not in seen_concepts:
                seen_concepts.add(name)
                concepts.append(concept)

    return {
        "topics": topics,
        "entities": entities,
        "concepts": concepts,
        "chunks": state_entry.get("chunks", []),
    }


def synthesized_pages_for_topics(
    topics: list[str],
    entities: list[dict[str, str]],
    concepts: list[dict[str, str]],
    docs_dir: Path | None = None,
) -> list[dict[str, Any]]:
    """The compiled wiki pages a source's extracted topics ended up on."""
    docs_dir = docs_dir or OUTPUT_DIR
    topic_index = load_topic_index()
    pages: list[dict[str, Any]] = []
    seen_docs: set[str] = set()

    for topic in topics:
        filename = topic_filename(topic_index, topic, docs_dir)
        if not filename or filename in seen_docs:
            continue
        doc_path = docs_dir / filename
        if not doc_path.is_file():
            continue
        seen_docs.add(filename)
        raw = doc_path.read_text(encoding="utf-8")
        meta = parse_frontmatter(raw)
        body = strip_frontmatter(raw)
        tags = meta.get("tags_list") or []
        pages.append(
            {
                "topic": topic,
                "doc_path": filename,
                "title": meta.get("title") or topic,
                "tags": tags,
                "entities": entities,
                "concepts": concepts,
                "body": body,
                "links": extract_links(body),
            }
        )

    return pages


def read_doc_payload(doc_path: Path, docs_dir: Path | None = None) -> dict[str, Any]:
    docs_dir = docs_dir or OUTPUT_DIR
    rel = str(doc_path.relative_to(docs_dir)).replace("\\", "/")
    raw = doc_path.read_text(encoding="utf-8")
    meta = parse_frontmatter(raw)
    body = strip_frontmatter(raw)
    tags = meta.get("tags_list") or []
    return {
        "path": rel,
        "title": meta.get("title") or doc_path.stem.replace("-", " ").title(),
        "id": meta.get("id"),
        "slug": meta.get("slug"),
        "tags": tags,
        "body": body,
        "links": extract_links(body),
    }


def raw_file_status(rel_path: str, current_md5: str, state: dict) -> str:
    entry = state.get("files", {}).get(rel_path)
    if entry and entry.get("md5") == current_md5:
        return "Processed"
    return "Unprocessed"
