#!/usr/bin/env python3
"""Lightweight API server for the LLM Wiki compiler frontend.

Routes are a thin layer over dedicated engine modules — each section of the
frontend (raw files, emails, resources, chat) is backed by its own
pure-Python module (email_engine.py, resources_engine.py, rag_engine.py,
analytics.py, link_overrides.py) that does the real work and is unit
testable without a running server.
"""

from __future__ import annotations

import asyncio
import json
from pathlib import Path
from typing import Any

from fastapi import Body, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

import email_engine
import rag_engine
import resources_engine
from analytics import build_analytics, get_tag_detail
from build_runner import stop_current_build, stream_compiler_build
from doc_utils import (
    collect_source_metadata,
    parse_frontmatter,
    raw_file_status,
    read_doc_payload,
    synthesized_pages_for_topics,
)
from link_overrides import (
    LINK_OVERRIDES_PATH,
    build_knowledge_graph_payload,
    load_link_overrides,
    save_link_overrides,
    validate_connections,
)
from linker import INDEX_JSON, load_topic_index
from models import OUTPUT_DIR, RAW_DIR, STATE_FILE
from raw_folders import FolderError, create_folder, delete_folder, discover_raw_folders, move_file
from sources_registry import add_source, list_sources, remove_source, set_enabled, sync_symlinks
from synthesizer import compute_file_md5, discover_raw_source_files, load_state

COMPILER_DIR = Path(__file__).resolve().parent
REVIEW_REPORT_PATH = COMPILER_DIR / "review_report.txt"
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
    allow_methods=["GET", "PUT", "POST", "DELETE"],
    allow_headers=["*"],
)


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


@app.on_event("startup")
def _sync_source_symlinks_on_startup() -> None:
    sync_symlinks()


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


# --- Source folder registry ------------------------------------------------


@app.get("/api/sources")
def get_sources() -> dict[str, Any]:
    """Registered external source folders symlinked into data/raw/."""
    return {"raw_dir": str(RAW_DIR), "sources": list_sources()}


@app.post("/api/sources")
def post_source(payload: dict[str, Any] = Body(...)) -> dict[str, Any]:
    """Register a new external folder as a source (creates a symlink in data/raw/)."""
    path = payload.get("path", "")
    label = payload.get("label") or None
    try:
        entry = add_source(path, label=label)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return entry


@app.delete("/api/sources/{source_id}")
def delete_source(source_id: str) -> dict[str, Any]:
    """Unregister a source folder and remove its symlink from data/raw/."""
    removed = remove_source(source_id)
    if not removed:
        raise HTTPException(status_code=404, detail=f"Source not found: {source_id}")
    return {"removed": True, "id": source_id}


@app.put("/api/sources/{source_id}")
def put_source(source_id: str, payload: dict[str, Any] = Body(...)) -> dict[str, Any]:
    """Enable or disable a source folder without unregistering it."""
    if "enabled" not in payload:
        raise HTTPException(status_code=400, detail="'enabled' is required")
    entry = set_enabled(source_id, bool(payload["enabled"]))
    if entry is None:
        raise HTTPException(status_code=404, detail=f"Source not found: {source_id}")
    return entry


def _source_label_for(rel_path: str, sources: list[dict[str, Any]]) -> str | None:
    top = rel_path.split("/", 1)[0]
    for entry in sources:
        if entry["link_name"] == top:
            return entry["label"]
    return None


def _managed_source_names() -> set[str]:
    return {entry["link_name"] for entry in list_sources()}


@app.get("/api/raw-files")
def list_raw_files() -> dict[str, Any]:
    """List files and folders under data/raw/ with Processed or Unprocessed status."""
    state = load_state()
    sources = list_sources()
    files: list[dict[str, Any]] = []

    for path in discover_raw_source_files(RAW_DIR):
        rel = str(path.relative_to(RAW_DIR)).replace("\\", "/")
        md5 = compute_file_md5(path)
        status = raw_file_status(rel, md5, state)
        entry = state.get("files", {}).get(rel, {})
        files.append(
            {
                "path": rel,
                "status": status,
                "size_bytes": path.stat().st_size,
                "md5": md5,
                "processed_at": entry.get("processed_at"),
                "chunk_count": len(entry.get("chunks", [])),
                "source": _source_label_for(rel, sources),
            }
        )

    processed = sum(1 for item in files if item["status"] == "Processed")
    managed_names = {entry["link_name"] for entry in sources}
    return {
        "directory": str(RAW_DIR),
        "total": len(files),
        "processed": processed,
        "unprocessed": len(files) - processed,
        "files": files,
        "folders": discover_raw_folders(RAW_DIR),
        "managed_folders": sorted(managed_names),
    }


@app.post("/api/raw-files/folders")
def post_raw_folder(payload: dict[str, Any] = Body(...)) -> dict[str, Any]:
    """Create a new subfolder under data/raw/ (or nested inside one)."""
    try:
        rel_path = create_folder(
            RAW_DIR,
            payload.get("parent", ""),
            payload.get("name", ""),
            _managed_source_names(),
        )
    except FolderError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"path": rel_path}


@app.delete("/api/raw-files/folders/{folder_path:path}")
def delete_raw_folder(folder_path: str) -> dict[str, Any]:
    """Delete an empty subfolder under data/raw/."""
    try:
        delete_folder(RAW_DIR, folder_path, _managed_source_names())
    except FolderError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"removed": True, "path": folder_path}


@app.post("/api/raw-files/move")
def post_move_raw_file(payload: dict[str, Any] = Body(...)) -> dict[str, Any]:
    """Move a raw file into a different folder under data/raw/."""
    try:
        new_path = move_file(
            RAW_DIR,
            payload.get("path", ""),
            payload.get("destination", ""),
            _managed_source_names(),
        )
    except FolderError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"path": new_path}


@app.get("/api/raw-files/{file_path:path}")
def get_raw_file_detail(file_path: str) -> dict[str, Any]:
    """Return raw junk text plus synthesized wiki pages derived from this source."""
    path = _safe_raw_path(file_path)
    rel = str(path.relative_to(RAW_DIR)).replace("\\", "/")
    content = path.read_text(encoding="utf-8")
    md5 = compute_file_md5(path)
    state = load_state()
    status = raw_file_status(rel, md5, state)
    state_entry = state.get("files", {}).get(rel, {})
    metadata = collect_source_metadata(state_entry)
    synthesized_pages = synthesized_pages_for_topics(
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


# --- Email knowledge engine -------------------------------------------------


@app.get("/api/emails")
def list_emails() -> dict[str, Any]:
    """List ingested .eml sources as first-class knowledge items."""
    return email_engine.list_emails()


@app.get("/api/emails/{file_path:path}")
def get_email_detail(file_path: str) -> dict[str, Any]:
    """Full parsed email plus the topics/entities/pages it fed into the wiki."""
    try:
        return email_engine.get_email_detail(file_path)
    except email_engine.NotAnEmailError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


# --- Docs --------------------------------------------------------------


@app.get("/api/docs")
def list_generated_docs() -> dict[str, Any]:
    """List markdown pages under wiki-app/docs/."""
    if not OUTPUT_DIR.is_dir():
        raise HTTPException(status_code=404, detail=f"Docs directory not found: {OUTPUT_DIR}")

    pages: list[dict[str, Any]] = []
    for path in sorted(OUTPUT_DIR.rglob("*.md")):
        rel = str(path.relative_to(OUTPUT_DIR)).replace("\\", "/")
        raw = path.read_text(encoding="utf-8")
        meta = parse_frontmatter(raw)
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


@app.get("/api/docs/{doc_path:path}")
def get_doc_detail(doc_path: str) -> dict[str, Any]:
    """Return a single generated markdown page."""
    path = _safe_doc_path(doc_path)
    return read_doc_payload(path)


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


@app.post("/api/build/stop")
async def build_stop() -> dict[str, bool]:
    """Kill the in-flight compiler build, if any.

    Lets a stuck or merely unwanted build be cancelled immediately instead of
    waiting out the full timeout — the running `stream_compiler_build` call
    detects the kill, reports it as a `done` event, and releases
    `_build_lock` itself.
    """
    stopped = await stop_current_build()
    return {"stopped": stopped}


@app.get("/api/build/stream")
async def build_stream(force: bool = False, timeout_seconds: float | None = None) -> StreamingResponse:
    """Run main.py and stream compiler logs via Server-Sent Events.

    `timeout_seconds` overrides the default build timeout (see
    `build_runner.DEFAULT_BUILD_TIMEOUT_SECONDS`); the run is killed and
    reported as failed if it's exceeded, so a hung pipeline can't hold the
    build lock forever.

    The lock is acquired here, synchronously, rather than inside the
    generator: `_build_lock.locked()` and `_build_lock.acquire()` on an
    unlocked `asyncio.Lock` both resolve without yielding to the event loop,
    so no other request can slip in between the check and the acquire.
    Acquiring lazily inside the generator (only once something iterates it)
    would leave that window open across FastAPI's own await points, letting
    two concurrent requests both see "not running" and both start a build.
    """
    if _build_lock.locked():
        raise HTTPException(status_code=409, detail="A build is already running")
    await _build_lock.acquire()

    async def event_generator():
        try:
            async for event in stream_compiler_build(
                force=force,
                timeout_seconds=timeout_seconds,
            ):
                yield event
        finally:
            _build_lock.release()

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


# --- Resources engine ----------------------------------------------------


@app.get("/api/resources")
def list_resources(
    q: str | None = None,
    source_type: str | None = None,
    trust: str | None = None,
) -> dict[str, Any]:
    """Every source cited anywhere in the wiki, deduped to one row each —
    browsable independently of which page(s) happen to reference it."""
    return resources_engine.list_resources(q=q, source_type=source_type, trust=trust)


@app.get("/api/resources/{source_path:path}")
def get_resource_detail(source_path: str) -> dict[str, Any]:
    """One resource's citing pages plus a raw content preview when available."""
    detail = resources_engine.get_resource_detail(source_path)
    if detail is None:
        raise HTTPException(status_code=404, detail=f"Resource not found: {source_path}")
    return detail


# --- Chat / RAG engine -----------------------------------------------------


@app.post("/api/chat")
def post_chat(payload: dict[str, Any] = Body(...)) -> dict[str, Any]:
    """Answer a question over the compiled wiki (retrieval + optional LLM).

    Body: {"message": str, "history": [{"role": "user"|"assistant", "content": str}, ...]}
    """
    message = str(payload.get("message", "")).strip()
    if not message:
        raise HTTPException(status_code=400, detail="'message' is required")

    history = payload.get("history")
    if history is not None and not isinstance(history, list):
        raise HTTPException(status_code=400, detail="'history' must be a list")

    return rag_engine.answer_question(message, history=history)


@app.get("/api/chat/status")
def get_chat_status() -> dict[str, Any]:
    """Whether the wiki has been compiled (there's a corpus to chat over)
    and whether an LLM is configured for generated (vs. extractive) answers."""
    corpus = rag_engine.build_corpus()
    return {
        "corpus_pages": len({p.doc_path for p in corpus}),
        "corpus_passages": len(corpus),
        "llm_available": rag_engine.LLMClient().available,
    }


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
