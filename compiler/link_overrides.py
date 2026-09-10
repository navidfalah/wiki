"""Load, save, and apply manual topic connection overrides for the linker."""

from __future__ import annotations

import json
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from models import OUTPUT_DIR, PROJECT_ROOT
from synthesizer import slugify

LINK_OVERRIDES_PATH = PROJECT_ROOT / "data" / "link_overrides.json"
LINK_RE = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")

DEFAULT_OVERRIDES: dict[str, Any] = {
    "version": 1,
    "connections": [],
}


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def load_link_overrides(path: Path | None = None) -> dict[str, Any]:
    target = path or LINK_OVERRIDES_PATH
    if not target.is_file():
        return json.loads(json.dumps(DEFAULT_OVERRIDES))
    data = json.loads(target.read_text(encoding="utf-8"))
    data.setdefault("version", 1)
    data.setdefault("connections", [])
    return data


def save_link_overrides(
    data: dict[str, Any],
    path: Path | None = None,
) -> Path:
    target = path or LINK_OVERRIDES_PATH
    target.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "version": data.get("version", 1),
        "updated_at": _utc_now_iso(),
        "connections": data.get("connections", []),
    }
    target.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    return target


def normalize_connection(connection: dict[str, Any]) -> dict[str, Any]:
    rule = connection.get("rule", "require")
    if rule not in {"require", "block"}:
        rule = "require"
    return {
        "id": connection.get("id") or str(uuid.uuid4()),
        "source_topic": connection["source_topic"].strip(),
        "target_topic": connection["target_topic"].strip(),
        "rule": rule,
        "enabled": bool(connection.get("enabled", True)),
        "note": connection.get("note", "").strip(),
    }


def validate_connections(
    connections: list[dict[str, Any]],
    topic_index: dict[str, str],
) -> list[dict[str, Any]]:
    topics = set(topic_index.keys())
    cleaned: list[dict[str, Any]] = []
    seen: set[tuple[str, str, str]] = set()

    for raw in connections:
        if not raw.get("source_topic") or not raw.get("target_topic"):
            continue
        conn = normalize_connection(raw)
        if conn["source_topic"] not in topics or conn["target_topic"] not in topics:
            continue
        if conn["source_topic"] == conn["target_topic"]:
            continue
        key = (conn["source_topic"], conn["target_topic"], conn["rule"])
        if key in seen:
            continue
        seen.add(key)
        cleaned.append(conn)

    return cleaned


def strip_frontmatter(content: str) -> str:
    if not content.startswith("---"):
        return content
    parts = content.split("---", 2)
    return parts[2].lstrip("\n") if len(parts) >= 3 else content


def _topic_id(topic_index: dict[str, str], topic: str) -> str:
    filename = topic_index.get(topic)
    if filename:
        return Path(filename).stem
    return slugify(topic)


def _resolve_md_href(href: str, source_filename: str) -> str | None:
    href = href.strip()
    if href.startswith("http://") or href.startswith("https://") or href.startswith("#"):
        return None
    if href.startswith("/docs/"):
        stem = href.removeprefix("/docs/").strip("/")
        return f"{stem}.md" if stem else None
    clean = href.removeprefix("./")
    if clean.endswith(".md"):
        source_dir = Path(source_filename).parent
        resolved = (source_dir / clean).as_posix()
        return str(Path(resolved)).replace("\\", "/")
    return None


def detect_topic_links(
    topic_index: dict[str, str],
    docs_dir: Path | None = None,
) -> list[dict[str, Any]]:
    """Scan indexed topic pages and return cross-links between them."""
    root = docs_dir or OUTPUT_DIR
    filename_to_topic = {filename: title for title, filename in topic_index.items()}
    indexed_files = set(topic_index.values())
    links: list[dict[str, Any]] = []
    seen: set[tuple[str, str]] = set()

    for source_topic, source_filename in topic_index.items():
        doc_path = root / source_filename
        if not doc_path.is_file():
            continue
        body = strip_frontmatter(doc_path.read_text(encoding="utf-8"))
        source_id = _topic_id(topic_index, source_topic)

        for match in LINK_RE.finditer(body):
            target_file = _resolve_md_href(match.group(2), source_filename)
            if not target_file:
                continue
            target_file = Path(target_file).name
            if target_file not in indexed_files:
                continue
            target_topic = filename_to_topic[target_file]
            key = (source_topic, target_topic)
            if key in seen:
                continue
            seen.add(key)
            links.append(
                {
                    "source_topic": source_topic,
                    "target_topic": target_topic,
                    "source_id": source_id,
                    "target_id": _topic_id(topic_index, target_topic),
                    "origin": "detected",
                }
            )

    return sorted(links, key=lambda item: (item["source_topic"].lower(), item["target_topic"].lower()))


def merge_effective_links(
    detected_links: list[dict[str, Any]],
    connections: list[dict[str, Any]],
    topic_index: dict[str, str],
) -> list[dict[str, Any]]:
    effective: dict[tuple[str, str], dict[str, Any]] = {
        (link["source_topic"], link["target_topic"]): link for link in detected_links
    }

    for conn in connections:
        if not conn.get("enabled", True):
            continue
        key = (conn["source_topic"], conn["target_topic"])
        if conn["rule"] == "block":
            effective.pop(key, None)
            continue
        effective[key] = {
            "source_topic": conn["source_topic"],
            "target_topic": conn["target_topic"],
            "source_id": _topic_id(topic_index, conn["source_topic"]),
            "target_id": _topic_id(topic_index, conn["target_topic"]),
            "origin": "override",
            "rule": "require",
            "override_id": conn.get("id"),
        }

    return sorted(
        effective.values(),
        key=lambda item: (item["source_topic"].lower(), item["target_topic"].lower()),
    )


def override_source_topics(connections: list[dict[str, Any]]) -> set[str]:
    return {
        conn["source_topic"]
        for conn in connections
        if conn.get("enabled", True)
    }


def _strip_link_to_target(body: str, target_title: str, target_file: str) -> str:
    patterns = [
        rf"\[{re.escape(target_title)}\]\(\./{re.escape(target_file)}\)",
        rf"\[{re.escape(target_title)}\]\({re.escape(target_file)}\)",
    ]
    for pattern in patterns:
        body = re.sub(pattern, target_title, body, flags=re.IGNORECASE)
    return body


def _ensure_link_to_target(body: str, target_title: str, target_file: str) -> str:
    if f"](./{target_file})" in body or f"]({target_file})" in body:
        return body

    link = f"[{target_title}](./{target_file})"
    related_heading = re.search(r"^## Related(?: links)?\s*$", body, re.MULTILINE | re.IGNORECASE)
    if related_heading:
        return body.rstrip() + f"\n- {link}\n"

    return body.rstrip() + f"\n\n## Related links\n\n- {link}\n"


def apply_connection_overrides(
    body: str,
    *,
    page_title: str,
    topic_index: dict[str, str],
    connections: list[dict[str, Any]],
) -> str:
    """Apply manual require/block connection rules to a linked page body."""
    updated = body

    for conn in connections:
        if not conn.get("enabled", True):
            continue
        if conn.get("source_topic") != page_title:
            continue

        target_topic = conn.get("target_topic")
        target_file = topic_index.get(target_topic or "")
        if not target_topic or not target_file:
            continue

        if conn.get("rule") == "block":
            updated = _strip_link_to_target(updated, target_topic, target_file)
        elif conn.get("rule") == "require":
            updated = _ensure_link_to_target(updated, target_topic, target_file)

    return updated


def build_knowledge_graph_payload(
    topic_index: dict[str, str],
    docs_dir: Path | None = None,
) -> dict[str, Any]:
    overrides = load_link_overrides()
    connections = overrides.get("connections", [])
    detected = detect_topic_links(topic_index, docs_dir=docs_dir)
    effective = merge_effective_links(detected, connections, topic_index)

    topics = [
        {
            "title": title,
            "filename": filename,
            "id": _topic_id(topic_index, title),
        }
        for title, filename in sorted(topic_index.items(), key=lambda item: item[0].lower())
    ]

    outgoing: dict[str, list[dict[str, Any]]] = {topic["title"]: [] for topic in topics}
    for link in effective:
        outgoing.setdefault(link["source_topic"], []).append(link)

    return {
        "topics": topics,
        "detected_links": detected,
        "connections": connections,
        "effective_links": effective,
        "outgoing_by_topic": outgoing,
        "overrides_path": str(LINK_OVERRIDES_PATH),
        "updated_at": overrides.get("updated_at"),
    }
