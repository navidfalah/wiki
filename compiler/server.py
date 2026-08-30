#!/usr/bin/env python3
"""Lightweight API server for the LLM Wiki compiler frontend."""

from __future__ import annotations

import asyncio
import json
import re
from pathlib import Path
from typing import Any, Literal

from fastapi import Body, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from analytics import build_analytics, get_tag_detail
from build_runner import stream_compiler_build
from link_overrides import (
    LINK_OVERRIDES_PATH,
    build_knowledge_graph_payload,
    load_link_overrides,
    save_link_overrides,
    validate_connections,
)
from linker import INDEX_JSON, load_topic_index
from models import OUTPUT_DIR, RAW_DIR, STATE_FILE
from synthesizer import compute_file_md5, discover_raw_source_files, load_state, slugify

COMPILER_DIR = Path(__file__).resolve().parent
REVIEW_REPORT_PATH = COMPILER_DIR / "review_report.txt"
INDEX_JSON_PATH = COMPILER_DIR / "temp_output" / "index.json"
LINK_RE = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")
_build_lock = asyncio.Lock()

app = FastAPI(
    title="LLM Wiki API",
    description="Read-only endpoints for raw sources, generated docs, and compiler state.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["GET", "PUT", "POST"],
    allow_headers=["*"],
)


def _parse_frontmatter(content: str) -> dict[str, Any]:
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


def _normalize_topic(title: str) -> str:
    return re.sub(r'\\(["\'])', r"\1", title).strip()


def _load_topic_index() -> dict[str, str]:
    if not INDEX_JSON_PATH.is_file():
        return {}
    data = json.loads(INDEX_JSON_PATH.read_text(encoding="utf-8"))
    topics = data.get("topics", {})
    return topics if isinstance(topics, dict) else {}


def _topic_filename(topic_index: dict[str, str], topic: str) -> str | None:
    if topic in topic_index:
        return topic_index[topic]
    normalized = _normalize_topic(topic)
    for key, filename in topic_index.items():
        if _normalize_topic(key) == normalized:
            return filename
    slug = slugify(normalized)
    candidate = f"{slug}.md"
    if (OUTPUT_DIR / candidate).is_file():
        return candidate
    return None


def _safe_raw_path(rel_path: str) -> Path:
    candidate = (RAW_DIR / rel_path).resolve()
    if not str(candidate).startswith(str(RAW_DIR.resolve())):
        raise HTTPException(status_code=400, detail="Invalid raw file path")
    if not candidate.is_file():
        raise HTTPException(status_code=404, detail=f"Raw file not found: {rel_path}")
    return candidate


def _safe_doc_path(rel_path: str) -> Path:
    candidate = (OUTPUT_DIR / rel_path).resolve()
    if not str(candidate).startswith(str(OUTPUT_DIR.resolve())):
        raise HTTPException(status_code=400, detail="Invalid doc path")
    if not candidate.is_file():
        raise HTTPException(status_code=404, detail=f"Doc not found: {rel_path}")
    return candidate


def _extract_links(markdown_body: str) -> list[dict[str, str]]:
    return [
        {"text": match.group(1), "href": match.group(2)}
        for match in LINK_RE.finditer(markdown_body)
    ]


def _collect_source_metadata(state_entry: dict) -> dict[str, Any]:
    topics: list[str] = []
    entities: list[dict[str, str]] = []
    concepts: list[dict[str, str]] = []
    seen_topics: set[str] = set()
    seen_entities: set[str] = set()
    seen_concepts: set[str] = set()

    for chunk in state_entry.get("chunks", []):
        for topic in chunk.get("topics") or []:
            normalized = _normalize_topic(topic)
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


def _synthesized_pages_for_topics(
    topics: list[str],
    entities: list[dict[str, str]],
    concepts: list[dict[str, str]],
) -> list[dict[str, Any]]:
    topic_index = _load_topic_index()
    pages: list[dict[str, Any]] = []
    seen_docs: set[str] = set()

    for topic in topics:
        filename = _topic_filename(topic_index, topic)
        if not filename or filename in seen_docs:
            continue
        doc_path = OUTPUT_DIR / filename
        if not doc_path.is_file():
            continue
        seen_docs.add(filename)
        raw = doc_path.read_text(encoding="utf-8")
        meta = _parse_frontmatter(raw)
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
                "links": _extract_links(body),
            }
        )

    return pages


def _read_doc_payload(doc_path: Path) -> dict[str, Any]:
    rel = str(doc_path.relative_to(OUTPUT_DIR)).replace("\\", "/")
    raw = doc_path.read_text(encoding="utf-8")
    meta = _parse_frontmatter(raw)
    body = strip_frontmatter(raw)
    tags = meta.get("tags_list") or []
    return {
        "path": rel,
        "title": meta.get("title") or doc_path.stem.replace("-", " ").title(),
        "id": meta.get("id"),
        "slug": meta.get("slug"),
        "tags": tags,
        "body": body,
        "links": _extract_links(body),
    }


def _raw_file_status(rel_path: str, current_md5: str, state: dict) -> Literal["Processed", "Unprocessed"]:
    entry = state.get("files", {}).get(rel_path)
    if entry and entry.get("md5") == current_md5:
        return "Processed"
    return "Unprocessed"


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/raw-files")
def list_raw_files() -> dict[str, Any]:
    """List files under data/raw/ with Processed or Unprocessed status."""
    state = load_state()
    files: list[dict[str, Any]] = []

    for path in discover_raw_source_files(RAW_DIR):
        rel = str(path.relative_to(RAW_DIR)).replace("\\", "/")
        md5 = compute_file_md5(path)
        status = _raw_file_status(rel, md5, state)
        entry = state.get("files", {}).get(rel, {})
        files.append(
            {
                "path": rel,
                "status": status,
                "size_bytes": path.stat().st_size,
                "md5": md5,
                "processed_at": entry.get("processed_at"),
                "chunk_count": len(entry.get("chunks", [])),
            }
        )

    processed = sum(1 for item in files if item["status"] == "Processed")
    return {
        "directory": str(RAW_DIR),
        "total": len(files),
        "processed": processed,
        "unprocessed": len(files) - processed,
        "files": files,
    }


@app.get("/api/docs")
def list_generated_docs() -> dict[str, Any]:
    """List markdown pages under wiki-app/docs/."""
    if not OUTPUT_DIR.is_dir():
        raise HTTPException(status_code=404, detail=f"Docs directory not found: {OUTPUT_DIR}")

    pages: list[dict[str, Any]] = []
    for path in sorted(OUTPUT_DIR.rglob("*.md")):
        rel = str(path.relative_to(OUTPUT_DIR)).replace("\\", "/")
        raw = path.read_text(encoding="utf-8")
        meta = _parse_frontmatter(raw)
        title = meta.get("title") or path.stem.replace("-", " ").title()
        pages.append(
            {
                "path": rel,
                "title": title,
                "id": meta.get("id"),
                "slug": meta.get("slug"),
                "size_bytes": path.stat().st_size,
            }
        )

    return {
        "directory": str(OUTPUT_DIR),
        "total": len(pages),
        "pages": pages,
    }


@app.get("/api/raw-files/{file_path:path}")
def get_raw_file_detail(file_path: str) -> dict[str, Any]:
    """Return raw junk text plus synthesized wiki pages derived from this source."""
    path = _safe_raw_path(file_path)
    rel = str(path.relative_to(RAW_DIR)).replace("\\", "/")
    content = path.read_text(encoding="utf-8")
    md5 = compute_file_md5(path)
    state = load_state()
    status = _raw_file_status(rel, md5, state)
    state_entry = state.get("files", {}).get(rel, {})
    metadata = _collect_source_metadata(state_entry)
    synthesized_pages = _synthesized_pages_for_topics(
        metadata["topics"],
        metadata["entities"],
        metadata["concepts"],
    )

    return {
        "path": rel,
        "status": status,
        "size_bytes": path.stat().st_size,
        "md5": md5,
        "processed_at": state_entry.get("processed_at"),
        "content": content,
        "topics": metadata["topics"],
        "entities": metadata["entities"],
        "concepts": metadata["concepts"],
        "chunks": metadata["chunks"],
        "synthesized_pages": synthesized_pages,
    }


@app.get("/api/docs/{doc_path:path}")
def get_doc_detail(doc_path: str) -> dict[str, Any]:
    """Return a single generated markdown page."""
    path = _safe_doc_path(doc_path)
    return _read_doc_payload(path)


@app.get("/api/state")
def get_state() -> dict[str, Any]:
    """
    Return compiler state from data/state.json.

    Note: state is stored at data/state.json (repo root), not under compiler/.
    """
    if not STATE_FILE.is_file():
        return {
            "path": str(STATE_FILE),
            "exists": False,
            "content": {"version": 1, "files": {}, "runs": []},
        }

    try:
        content = json.loads(STATE_FILE.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=500, detail=f"Invalid state.json: {exc}") from exc

    return {
        "path": str(STATE_FILE),
        "exists": True,
        "content": content,
    }


@app.get("/api/build/status")
async def build_status() -> dict[str, bool]:
    return {"running": _build_lock.locked()}


@app.get("/api/build/stream")
async def build_stream(force: bool = False) -> StreamingResponse:
    """Run main.py and stream compiler logs via Server-Sent Events."""
    if _build_lock.locked():
        raise HTTPException(status_code=409, detail="A build is already running")

    async def event_generator():
        async with _build_lock:
            async for event in stream_compiler_build(
                force=force,
            ):
                yield event

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


def _load_index_or_empty() -> dict[str, str]:
    if not INDEX_JSON.exists():
        return {}
    try:
        return load_topic_index(INDEX_JSON)
    except FileNotFoundError:
        return {}


@app.get("/api/knowledge-graph")
def get_knowledge_graph() -> dict[str, Any]:
    """Topics from index.json, detected cross-links, and manual connection overrides."""
    topic_index = _load_index_or_empty()
    if not topic_index:
        overrides = load_link_overrides()
        return {
            "topics": [],
            "detected_links": [],
            "connections": overrides.get("connections", []),
            "effective_links": [],
            "outgoing_by_topic": {},
            "overrides_path": str(LINK_OVERRIDES_PATH),
            "updated_at": overrides.get("updated_at"),
        }
    return build_knowledge_graph_payload(topic_index, docs_dir=OUTPUT_DIR)


@app.put("/api/knowledge-graph/overrides")
def put_knowledge_graph_overrides(
    payload: dict[str, Any] = Body(...),
) -> dict[str, Any]:
    """Validate and save manual connection rules to data/link_overrides.json."""
    topic_index = _load_index_or_empty()
    if not topic_index:
        raise HTTPException(
            status_code=400,
            detail="index.json has no topics. Run the compiler pipeline first.",
        )

    raw_connections = payload.get("connections", [])
    if not isinstance(raw_connections, list):
        raise HTTPException(status_code=400, detail="'connections' must be a list")

    connections = validate_connections(raw_connections, topic_index)
    saved_path = save_link_overrides({"version": 1, "connections": connections})
    graph = build_knowledge_graph_payload(topic_index, docs_dir=OUTPUT_DIR)

    return {
        "saved": True,
        "path": str(saved_path),
        "connection_count": len(connections),
        "graph": graph,
    }


@app.get("/api/analytics")
def get_analytics() -> dict[str, Any]:
    """Summary metrics, tag index, and dead-link audit data."""
    return build_analytics(docs_dir=OUTPUT_DIR)


@app.get("/api/analytics/tags/{tag}")
def get_analytics_tag(tag: str) -> dict[str, Any]:
    """Return raw chunks and compiled pages associated with a tag."""
    detail = get_tag_detail(tag, docs_dir=OUTPUT_DIR)
    if detail is None:
        raise HTTPException(status_code=404, detail=f"Tag not found: {tag}")
    return detail


@app.get("/api/review-report")
def get_review_report() -> dict[str, Any]:
    """Return the contents of compiler/review_report.txt."""
    if not REVIEW_REPORT_PATH.is_file():
        return {
            "path": str(REVIEW_REPORT_PATH),
            "exists": False,
            "content": "",
        }

    return {
        "path": str(REVIEW_REPORT_PATH),
        "exists": True,
        "content": REVIEW_REPORT_PATH.read_text(encoding="utf-8"),
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_dirs=[str(COMPILER_DIR)],
    )
