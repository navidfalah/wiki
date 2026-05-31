"""Summarization, topic extraction, and wiki page synthesis from raw sources."""

from __future__ import annotations

import hashlib
import json
import re
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path

from llm_client import LLMClient
from models import RAW_DIR, STATE_FILE, WikiPage

COMPILER_DIR = Path(__file__).resolve().parent
TEMP_OUTPUT_DIR = COMPILER_DIR / "temp_output"

SYSTEM_PROMPT = """You are a wiki compiler. Given a raw markdown source, extract structured wiki content.
Return JSON only with this shape:
{
  "source_title": "string",
  "source_summary": "one line",
  "entities": [{"name": "...", "summary": "...", "tags": ["..."]}],
  "concepts": [{"name": "...", "summary": "...", "tags": ["..."]}],
  "key_points": ["bullet", "..."]
}
Use concise prose. Flag contradictions in key_points when present."""


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    return text.strip("-")[:80]


def _relative_raw_path(path: Path) -> str:
    return str(path.relative_to(RAW_DIR)).replace("\\", "/")


def _extract_title(content: str, fallback: str) -> str:
    for line in content.splitlines():
        if line.startswith("# "):
            return line[2:].strip()
    return fallback


def _extract_bold_terms(content: str) -> list[str]:
    terms = re.findall(r"\*\*([^*]+)\*\*", content)
    seen: set[str] = set()
    result: list[str] = []
    for term in terms:
        cleaned = term.strip().rstrip(":")
        if len(cleaned) < 3 or cleaned.lower() in seen:
            continue
        seen.add(cleaned.lower())
        result.append(cleaned)
    return result[:12]


def _extract_headers(content: str) -> list[str]:
    headers: list[str] = []
    for line in content.splitlines():
        if line.startswith("## ") and not line.startswith("### "):
            headers.append(line[3:].strip())
    return headers


SKIP_ENTITY_TERMS = {
    "date",
    "author",
    "published",
    "last edited",
    "status",
    "location",
    "attendees",
    "type",
    "url",
    "blog",
    "mcu",
    "sensors",
    "battery",
    "mesh",
    "mission statement (draft)",
    "default: every 15 minutes",
    "target average current",
    "2 years on cr2032",
}


def _is_entity_candidate(term: str) -> bool:
    lower = term.lower().strip()
    if lower in SKIP_ENTITY_TERMS:
        return False
    if len(term) < 4:
        return False
    keywords = ("labs", "widget", "chen", "park", "sensenode", "aurora", "nova", "mira", "jonah")
    if any(k in lower for k in keywords):
        return True
    return term[0].isupper() and " " in term


def synthesize_with_heuristics(raw_path: Path, content: str) -> list[WikiPage]:
    """Rule-based synthesis when no LLM API key is configured."""
    rel = _relative_raw_path(raw_path)
    stem = raw_path.stem
    title = _extract_title(content, stem)
    bold_terms = _extract_bold_terms(content)
    headers = _extract_headers(content)

    pages: list[WikiPage] = []

    key_points = []
    for header in headers[:6]:
        key_points.append(f"- **{header}** — mentioned in source")
    if not key_points:
        key_points.append("- Source ingested; see raw file for full content.")

    source_body = "\n".join(
        [
            f"# {title}",
            "",
            f"**Raw source:** `{rel}`",
            "",
            "## Summary",
            "",
            f"Auto-compiled from `{rel}`. Key terms: {', '.join(bold_terms[:5]) or 'none detected'}.",
            "",
            "## Key points",
            "",
            *key_points,
            "",
            "## Extracted terms",
            "",
            *[f"- {term}" for term in bold_terms],
        ]
    )
    pages.append(
        WikiPage(
            slug=f"sources/{stem}",
            title=title,
            page_type="source",
            body=source_body,
            tags=["auto-ingest"],
            sources=[rel],
            summary=f"Summary of {title}",
        )
    )

    entity_candidates = [t for t in bold_terms if _is_entity_candidate(t)][:6]

    for name in entity_candidates:
        slug = slugify(name)
        pages.append(
            WikiPage(
                slug=f"entities/{slug}",
                title=name,
                page_type="entity",
                body="\n".join(
                    [
                        f"# {name}",
                        "",
                        f"Entity extracted from [[sources/{stem}]].",
                        "",
                        "## Notes",
                        "",
                        f"Mentioned in `{rel}`. Run with OPENAI_API_KEY for richer synthesis.",
                    ]
                ),
                tags=["entity", "auto-ingest"],
                sources=[rel],
                summary=f"Entity: {name}",
            )
        )

    concept_candidates = [
        t
        for t in bold_terms
        if any(k in t.lower() for k in ("mesh", "battery", "protocol", "power", "sync"))
    ][:4]

    for name in concept_candidates:
        slug = slugify(name)
        pages.append(
            WikiPage(
                slug=f"concepts/{slug}",
                title=name,
                page_type="concept",
                body="\n".join(
                    [
                        f"# {name}",
                        "",
                        f"Concept extracted from [[sources/{stem}]].",
                        "",
                        "## Notes",
                        "",
                        f"Referenced in `{rel}`.",
                    ]
                ),
                tags=["concept", "auto-ingest"],
                sources=[rel],
                summary=f"Concept: {name}",
            )
        )

    return pages


def synthesize_with_llm(raw_path: Path, content: str, llm: LLMClient) -> list[WikiPage]:
    """LLM-powered synthesis with structured JSON output."""
    rel = _relative_raw_path(raw_path)
    stem = raw_path.stem
    data = llm.complete_json(
        SYSTEM_PROMPT,
        f"Raw file: {rel}\n\n---\n\n{content[:12000]}",
    )

    pages: list[WikiPage] = []
    source_title = data.get("source_title", stem)
    key_points = data.get("key_points", [])

    source_body = "\n".join(
        [
            f"# {source_title}",
            "",
            f"**Raw source:** `{rel}`",
            "",
            "## Summary",
            "",
            data.get("source_summary", ""),
            "",
            "## Key points",
            "",
            *[f"- {p}" for p in key_points],
        ]
    )
    pages.append(
        WikiPage(
            slug=f"sources/{stem}",
            title=source_title,
            page_type="source",
            body=source_body,
            tags=["llm-ingest"],
            sources=[rel],
            summary=data.get("source_summary", source_title),
        )
    )

    for entity in data.get("entities", []):
        name = entity["name"]
        slug = slugify(name)
        pages.append(
            WikiPage(
                slug=f"entities/{slug}",
                title=name,
                page_type="entity",
                body=f"# {name}\n\n{entity.get('summary', '')}\n\n## Sources\n\n- `{rel}`",
                tags=entity.get("tags", ["entity"]),
                sources=[rel],
                summary=entity.get("summary", name)[:120],
            )
        )

    for concept in data.get("concepts", []):
        name = concept["name"]
        slug = slugify(name)
        pages.append(
            WikiPage(
                slug=f"concepts/{slug}",
                title=name,
                page_type="concept",
                body=f"# {concept['name']}\n\n{concept.get('summary', '')}\n\n## Sources\n\n- `{rel}`",
                tags=concept.get("tags", ["concept"]),
                sources=[rel],
                summary=concept.get("summary", name)[:120],
            )
        )

    return pages


def synthesize_file(raw_path: Path, llm: LLMClient | None = None) -> list[WikiPage]:
    content = raw_path.read_text(encoding="utf-8")
    if llm and llm.available:
        return synthesize_with_llm(raw_path, content, llm)
    return synthesize_with_heuristics(raw_path, content)


def merge_pages(pages: list[WikiPage]) -> list[WikiPage]:
    """Merge pages that share the same slug, combining sources and body sections."""
    by_slug: dict[str, WikiPage] = {}
    for page in pages:
        existing = by_slug.get(page.slug)
        if existing is None:
            by_slug[page.slug] = page
            continue
        merged_sources = list(dict.fromkeys(existing.sources + page.sources))
        existing.sources = merged_sources
        existing.body += f"\n\n---\n\n_Update from {page.sources[-1]}_\n\n{page.body}"
        existing.tags = list(dict.fromkeys(existing.tags + page.tags))
    return list(by_slug.values())


def build_overview(pages: list[WikiPage]) -> WikiPage:
    entities = [p for p in pages if p.page_type == "entity"]
    concepts = [p for p in pages if p.page_type == "concept"]
    sources = [p for p in pages if p.page_type == "source"]

    lines = [
        "# Aurora Labs Wiki Overview",
        "",
        "Auto-generated synthesis of all compiled sources.",
        "",
        f"- **{len(sources)}** source summaries",
        f"- **{len(entities)}** entity pages",
        f"- **{len(concepts)}** concept pages",
        "",
        "## Entities",
        "",
        *[f"- [[{e.slug}|{e.title}]]" for e in entities[:10]],
        "",
        "## Concepts",
        "",
        *[f"- [[{c.slug}|{c.title}]]" for c in concepts[:10]],
    ]
    return WikiPage(
        slug="overview",
        title="Overview",
        page_type="synthesis",
        body="\n".join(lines),
        tags=["overview"],
        summary="High-level wiki overview",
    )


def build_index(pages: list[WikiPage]) -> WikiPage:
    sections: dict[str, list[WikiPage]] = {}
    for page in sorted(pages, key=lambda p: p.slug):
        bucket = page.page_type + "s" if not page.page_type.endswith("s") else page.page_type
        if page.slug == "index":
            continue
        sections.setdefault(bucket, []).append(page)

    lines = ["# Wiki Index", "", "Content catalog — start here when querying.", ""]
    for section, items in sorted(sections.items()):
        lines.append(f"## {section.title()}")
        lines.append("")
        for item in items:
            lines.append(f"- [[{item.slug}|{item.title}]] — {item.summary or item.title}")
        lines.append("")

    return WikiPage(
        slug="index",
        title="Index",
        page_type="synthesis",
        body="\n".join(lines),
        tags=["index"],
        summary="Master catalog of all wiki pages",
    )


# ---------------------------------------------------------------------------
# Topic extraction & grouped wiki synthesis (raw chunks → topic pages)
# ---------------------------------------------------------------------------

CHUNK_EXTRACTION_SYSTEM_PROMPT = """You are a knowledge extractor for a personal wiki.
Given a text chunk from a raw source file, identify:
- topics: 1-5 main subject headings this chunk belongs to
- entities: people, products, organizations, places (with a one-line role/description)
- concepts: abstract ideas, protocols, constraints, processes (with a one-line summary)

Return JSON only:
{
  "topics": ["Topic Name", "..."],
  "entities": [{"name": "...", "description": "..."}],
  "concepts": [{"name": "...", "description": "..."}]
}
Use concise, canonical topic names so related chunks group together."""

WIKI_PAGE_SYSTEM_PROMPT = """You are a wiki author. Write a comprehensive, well-structured Markdown wiki page
for a single topic by synthesizing multiple raw source chunks.

STRICT OUTPUT FORMAT — the file MUST begin with Docusaurus-compatible YAML frontmatter:

---
id: <slug-safe-id>
title: <Topic Title>
tags:
  - <tag1>
  - <tag2>
last_updated: <ISO-8601 UTC timestamp, e.g. 2026-05-31T19:00:00+00:00>
---

Frontmatter rules:
- `id`: lowercase slug derived from the topic (letters, numbers, hyphens only)
- `title`: exact topic title (quote with double quotes if it contains colons or special characters)
- `tags`: YAML array of 3-8 short lowercase tags extracted from the content (entities, concepts, themes)
- `last_updated`: current UTC timestamp in ISO-8601 format

Body rules (after the closing ---):
- Start with an H1 matching the topic title
- Include sections: Overview, Key Details, Related Entities, Related Concepts, Contradictions (if any), Sources
- Merge overlapping facts; flag contradictions with a blockquote starting with **Contradiction:**
- Use bullet lists and short paragraphs
- End with a ## Sources section listing source file paths

Return ONLY the complete Markdown file (frontmatter + body). No commentary."""


@dataclass
class RawChunk:
    """A slice of text from a raw source file."""

    source_path: str
    chunk_index: int
    text: str


@dataclass
class ChunkExtraction:
    """LLM/heuristic extraction results for one chunk."""

    source_path: str
    chunk_index: int
    text: str
    topics: list[str] = field(default_factory=list)
    entities: list[dict[str, str]] = field(default_factory=list)
    concepts: list[dict[str, str]] = field(default_factory=list)


@dataclass
class FileChangeSet:
    """Raw files classified by MD5 comparison against state.json."""

    new: list[str] = field(default_factory=list)
    modified: list[str] = field(default_factory=list)
    deleted: list[str] = field(default_factory=list)
    unchanged: list[str] = field(default_factory=list)

    @property
    def to_process(self) -> list[str]:
        return self.new + self.modified

    @property
    def has_changes(self) -> bool:
        return bool(self.new or self.modified or self.deleted)


def compute_file_md5(path: Path) -> str:
    """Return hex MD5 digest of a raw source file."""
    digest = hashlib.md5()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(8192), b""):
            digest.update(block)
    return digest.hexdigest()


def load_state() -> dict:
    """Load compiler state from data/state.json."""
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    return {"version": 1, "files": {}, "runs": []}


def save_state(state: dict) -> None:
    """Persist compiler state to data/state.json."""
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(json.dumps(state, indent=2, ensure_ascii=False), encoding="utf-8")


def scan_raw_file_changes(
    raw_dir: Path | None = None,
    state: dict | None = None,
    *,
    force: bool = False,
) -> FileChangeSet:
    """
    Compare MD5 hashes of data/raw/ files against state.json.

    Returns which files are new, modified, deleted, or unchanged.
    """
    root = raw_dir or RAW_DIR
    state = state if state is not None else load_state()
    files_state: dict = state.setdefault("files", {})

    current: dict[str, Path] = {}
    for path in discover_raw_text_files(root):
        rel = str(path.relative_to(root)).replace("\\", "/")
        current[rel] = path

    changes = FileChangeSet()

    for rel, path in sorted(current.items()):
        md5 = compute_file_md5(path)
        prev = files_state.get(rel)
        if force or prev is None:
            (changes.new if prev is None else changes.modified).append(rel)
        elif prev.get("md5") != md5:
            changes.modified.append(rel)
        else:
            changes.unchanged.append(rel)

    for rel in sorted(files_state.keys()):
        if rel not in current:
            changes.deleted.append(rel)

    return changes


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _chunks_for_file(path: Path, raw_dir: Path) -> list[RawChunk]:
    rel = str(path.relative_to(raw_dir)).replace("\\", "/")
    content = path.read_text(encoding="utf-8")
    return [
        RawChunk(source_path=rel, chunk_index=index, text=text)
        for index, text in enumerate(split_text_into_chunks(content))
    ]


def _chunk_dicts_from_extractions(extractions: list[ChunkExtraction]) -> list[dict]:
    return [
        {
            "chunk_index": ext.chunk_index,
            "text": ext.text,
            "topics": ext.topics,
            "entities": ext.entities,
            "concepts": ext.concepts,
        }
        for ext in extractions
    ]


def _extractions_from_cached_chunks(source_path: str, chunks: list[dict]) -> list[ChunkExtraction]:
    return [
        ChunkExtraction(
            source_path=source_path,
            chunk_index=chunk["chunk_index"],
            text=chunk["text"],
            topics=chunk.get("topics", []),
            entities=chunk.get("entities", []),
            concepts=chunk.get("concepts", []),
        )
        for chunk in chunks
    ]


def _build_extractions_payload(
    files_state: dict[str, dict],
    raw_dir: Path,
) -> dict:
    """Assemble the full extractions dict from all entries in state."""
    files_map: dict[str, list[dict]] = {}
    all_chunks: list[ChunkExtraction] = []

    for source in sorted(files_state.keys()):
        cached = files_state[source].get("chunks", [])
        files_map[source] = cached
        all_chunks.extend(_extractions_from_cached_chunks(source, cached))

    return {
        "raw_dir": str(raw_dir.resolve()),
        "chunk_count": len(all_chunks),
        "file_count": len(files_map),
        "files": [
            {"source": source, "chunks": chunks}
            for source, chunks in sorted(files_map.items())
        ],
        "chunks": [asdict(ext) for ext in all_chunks],
    }


def topics_affected_by_sources(
    grouped_topics: dict[str, list[dict]],
    sources: set[str],
) -> set[str]:
    """Return topic names that include chunks from any of the given sources."""
    affected: set[str] = set()
    for topic, entries in grouped_topics.items():
        if any(entry["source"] in sources for entry in entries):
            affected.add(topic)
    return affected


def cleanup_stale_drafts(
    grouped_topics: dict[str, list[dict]],
    output_dir: Path | None = None,
) -> list[Path]:
    """Remove draft pages in temp_output/ for topics no longer in the grouping."""
    out_dir = output_dir or TEMP_OUTPUT_DIR
    if not out_dir.exists():
        return []

    active_slugs = {slugify(topic) or "untitled-topic" for topic in grouped_topics}
    skip_names = {"index.md"}
    removed: list[Path] = []

    for path in out_dir.glob("*.md"):
        if path.name in skip_names:
            continue
        if path.stem not in active_slugs:
            path.unlink()
            removed.append(path)

    return removed


def discover_raw_text_files(raw_dir: Path | None = None) -> list[Path]:
    """Return all .txt and .md files under data/raw/."""
    root = raw_dir or RAW_DIR
    files: list[Path] = []
    for pattern in ("*.txt", "*.md"):
        files.extend(root.rglob(pattern))
    return sorted(set(files))


def split_text_into_chunks(content: str, *, max_chars: int = 2000) -> list[str]:
    """Split file content into paragraph-based chunks for extraction."""
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", content) if p.strip()]
    if not paragraphs:
        return [content.strip()] if content.strip() else []

    chunks: list[str] = []
    current: list[str] = []
    current_len = 0

    for para in paragraphs:
        para_len = len(para)
        if current and current_len + para_len + 2 > max_chars:
            chunks.append("\n\n".join(current))
            current = [para]
            current_len = para_len
        else:
            current.append(para)
            current_len += para_len + 2

    if current:
        chunks.append("\n\n".join(current))

    return chunks


def read_raw_chunks(raw_dir: Path | None = None) -> list[RawChunk]:
    """Read every raw text file and split it into chunks."""
    root = raw_dir or RAW_DIR
    chunks: list[RawChunk] = []

    for path in discover_raw_text_files(root):
        rel = str(path.relative_to(root)).replace("\\", "/")
        content = path.read_text(encoding="utf-8")
        for index, text in enumerate(split_text_into_chunks(content)):
            chunks.append(RawChunk(source_path=rel, chunk_index=index, text=text))

    return chunks


def _parse_extraction_json(raw: str) -> dict:
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if not match:
        raise ValueError("LLM response did not contain JSON")
    return json.loads(match.group())


def _extract_chunk_heuristic(chunk: RawChunk) -> ChunkExtraction:
    """Fallback extraction when no LLM API key is available."""
    bold = _extract_bold_terms(chunk.text)
    headers = _extract_headers(chunk.text)

    topics: list[str] = []
    for header in headers[:3]:
        topics.append(header)
    if not topics and chunk.text:
        first_line = chunk.text.splitlines()[0].strip().lstrip("#").strip()
        if first_line:
            topics.append(first_line[:80])

    entities = [
        {"name": name, "description": f"Mentioned in {chunk.source_path}"}
        for name in (t for t in bold if _is_entity_candidate(t))
    ][:5]

    concepts = [
        {"name": name, "description": f"Referenced in {chunk.source_path}"}
        for name in bold
        if any(k in name.lower() for k in ("mesh", "battery", "protocol", "power", "sync", "wiki"))
    ][:5]

    if not topics:
        topics = ["General Notes"]

    return ChunkExtraction(
        source_path=chunk.source_path,
        chunk_index=chunk.chunk_index,
        text=chunk.text,
        topics=topics,
        entities=entities,
        concepts=concepts,
    )


def extract_chunk_topics(
    chunk: RawChunk,
    llm: LLMClient | None = None,
) -> ChunkExtraction:
    """Extract topics, entities, and concepts from a single text chunk."""
    if llm is None or not llm.available:
        return _extract_chunk_heuristic(chunk)

    prompt = (
        f"Source file: {chunk.source_path}\n"
        f"Chunk index: {chunk.chunk_index}\n\n"
        f"---\n\n{chunk.text[:8000]}"
    )
    raw = llm.generate_response(prompt, CHUNK_EXTRACTION_SYSTEM_PROMPT)
    data = _parse_extraction_json(raw)

    return ChunkExtraction(
        source_path=chunk.source_path,
        chunk_index=chunk.chunk_index,
        text=chunk.text,
        topics=[str(t).strip() for t in data.get("topics", []) if str(t).strip()],
        entities=[
            {"name": e["name"], "description": e.get("description", e.get("role", ""))}
            for e in data.get("entities", [])
            if isinstance(e, dict) and e.get("name")
        ],
        concepts=[
            {"name": c["name"], "description": c.get("description", c.get("summary", ""))}
            for c in data.get("concepts", [])
            if isinstance(c, dict) and c.get("name")
        ],
    )


def extract_topics_from_raw_files(
    llm: LLMClient | None = None,
    raw_dir: Path | None = None,
    *,
    force: bool = False,
) -> dict:
    """
    Read text files from data/raw/ and extract topics per chunk.

    Uses MD5 hashes stored in data/state.json to skip unchanged files on
    subsequent runs. Only new or modified files are sent to the LLM.
    """
    llm = llm or LLMClient()
    root = raw_dir or RAW_DIR
    state = load_state()
    files_state: dict[str, dict] = state.setdefault("files", {})
    changes = scan_raw_file_changes(root, state, force=force)

    path_by_rel = {
        str(p.relative_to(root)).replace("\\", "/"): p
        for p in discover_raw_text_files(root)
    }

    for rel in changes.deleted:
        files_state.pop(rel, None)

    for rel in changes.to_process:
        path = path_by_rel[rel]
        md5 = compute_file_md5(path)
        file_chunks = _chunks_for_file(path, root)
        extractions = [extract_chunk_topics(chunk, llm) for chunk in file_chunks]
        files_state[rel] = {
            "md5": md5,
            "chunks": _chunk_dicts_from_extractions(extractions),
            "processed_at": _utc_now_iso(),
        }

    state["runs"].append(
        {
            "at": _utc_now_iso(),
            "new": changes.new,
            "modified": changes.modified,
            "deleted": changes.deleted,
            "skipped": changes.unchanged,
            "force": force,
        }
    )
    save_state(state)

    payload = _build_extractions_payload(files_state, root)
    payload["incremental"] = {
        "new": changes.new,
        "modified": changes.modified,
        "deleted": changes.deleted,
        "unchanged": changes.unchanged,
        "processed": len(changes.to_process),
        "skipped": len(changes.unchanged),
    }
    return payload


def group_chunks_by_topic(extractions: dict) -> dict[str, list[dict]]:
    """
    Group all raw text chunks by their extracted topic names.

    Returns:
        {
          "Topic Name": [
            {
              "source": "notes/foo.txt",
              "chunk_index": 0,
              "text": "...",
              "entities": [...],
              "concepts": [...]
            },
            ...
          ],
          ...
        }
    """
    grouped: dict[str, list[dict]] = {}

    for file_entry in extractions.get("files", []):
        source = file_entry["source"]
        for chunk in file_entry.get("chunks", []):
            topics = chunk.get("topics") or ["General Notes"]
            payload = {
                "source": source,
                "chunk_index": chunk["chunk_index"],
                "text": chunk["text"],
                "entities": chunk.get("entities", []),
                "concepts": chunk.get("concepts", []),
            }
            for topic in topics:
                topic_key = topic.strip()
                if not topic_key:
                    continue
                grouped.setdefault(topic_key, []).append(payload)

    return dict(sorted(grouped.items(), key=lambda item: item[0].lower()))


def _yaml_scalar(value: str) -> str:
    """Format a string for safe use in YAML frontmatter."""
    if any(c in value for c in ":\n#'\"<>{}[]|&"):
        return json.dumps(value, ensure_ascii=False)
    return value


def _derive_tags(topic: str, entries: list[dict]) -> list[str]:
    """Extract tag strings from topic name and chunk metadata."""
    tags: set[str] = {"wiki"}
    slug = slugify(topic)
    if slug:
        tags.add(slug)
    for entry in entries:
        for entity in entry.get("entities", []):
            tag = slugify(entity.get("name", ""))
            if tag:
                tags.add(tag)
        for concept in entry.get("concepts", []):
            tag = slugify(concept.get("name", ""))
            if tag:
                tags.add(tag)
    return sorted(t for t in tags if t)[:8]


def build_docusaurus_frontmatter(
    *,
    doc_id: str,
    title: str,
    tags: list[str],
    last_updated: str | None = None,
) -> str:
    """Build Docusaurus-compatible YAML frontmatter block."""
    ts = last_updated or _utc_now_iso()
    tag_lines = "\n".join(f"  - {_yaml_scalar(t)}" for t in tags) or "  - wiki"
    return (
        f"---\n"
        f"id: {_yaml_scalar(doc_id)}\n"
        f"title: {_yaml_scalar(title)}\n"
        f"tags:\n{tag_lines}\n"
        f"last_updated: {_yaml_scalar(ts)}\n"
        f"---"
    )


def _dedupe_chunk_entries(entries: list[dict]) -> list[dict]:
    seen: set[tuple[str, int]] = set()
    unique: list[dict] = []
    for entry in entries:
        key = (entry["source"], entry["chunk_index"])
        if key in seen:
            continue
        seen.add(key)
        unique.append(entry)
    return unique


def synthesize_topic_wiki_pages(
    grouped_topics: dict[str, list[dict]],
    llm: LLMClient | None = None,
    output_dir: Path | None = None,
    *,
    dirty_topics: set[str] | None = None,
) -> tuple[list[Path], list[str]]:
    """
    For each unique topic, write a Markdown wiki page synthesizing related chunks.

    When dirty_topics is set, only those topics are regenerated; existing drafts
    for unchanged topics are kept to save API calls.
    """
    llm = llm or LLMClient()
    out_dir = output_dir or TEMP_OUTPUT_DIR
    out_dir.mkdir(parents=True, exist_ok=True)

    written: list[Path] = []
    skipped: list[str] = []

    for topic, entries in grouped_topics.items():
        entries = _dedupe_chunk_entries(entries)
        topic_slug = slugify(topic) or "untitled-topic"
        out_path = out_dir / f"{topic_slug}.md"

        if dirty_topics is not None and topic not in dirty_topics and out_path.exists():
            skipped.append(topic)
            continue

        if llm.available:
            chunk_blocks = []
            for entry in entries:
                chunk_blocks.append(
                    f"### Source: `{entry['source']}` (chunk {entry['chunk_index']})\n\n"
                    f"{entry['text']}"
                )
            prompt = (
                f"Topic: {topic}\n"
                f"Suggested id: {topic_slug}\n"
                f"Suggested tags: {json.dumps(_derive_tags(topic, entries))}\n"
                f"Required last_updated: {_utc_now_iso()}\n\n"
                f"Synthesize the following {len(entries)} raw chunk(s) into one wiki page:\n\n"
                + "\n\n---\n\n".join(chunk_blocks)
            )
            body = llm.generate_response(prompt, WIKI_PAGE_SYSTEM_PROMPT)
        else:
            body = _heuristic_topic_page(topic, entries)

        out_path.write_text(body.strip() + "\n", encoding="utf-8")
        written.append(out_path)

    return written, skipped


def _heuristic_topic_page(topic: str, entries: list[dict]) -> str:
    """Draft wiki page without LLM when no API key is configured."""
    doc_id = slugify(topic) or "untitled-topic"
    frontmatter = build_docusaurus_frontmatter(
        doc_id=doc_id,
        title=topic,
        tags=_derive_tags(topic, entries),
    )
    lines = [
        frontmatter,
        "",
        f"# {topic}",
        "",
        "## Overview",
        "",
        f"Synthesized from **{len(entries)}** raw chunk(s) (heuristic mode — set OPENAI_API_KEY for LLM drafts).",
        "",
        "## Key Details",
        "",
    ]
    for entry in entries:
        preview = entry["text"][:300].replace("\n", " ")
        lines.append(f"- `{entry['source']}` (chunk {entry['chunk_index']}): {preview}...")
    lines.extend(["", "## Sources", ""])
    for entry in entries:
        lines.append(f"- `{entry['source']}` — chunk {entry['chunk_index']}")
    return "\n".join(lines)


def run_topic_synthesis_pipeline(
    llm: LLMClient | None = None,
    raw_dir: Path | None = None,
    output_dir: Path | None = None,
    *,
    force: bool = False,
    save_extractions_json: bool = True,
) -> dict:
    """
    End-to-end: extract topics → group by topic → write wiki drafts to temp_output/.

    Respects MD5 state in data/state.json unless force=True.
    """
    llm = llm or LLMClient()
    out_dir = output_dir or TEMP_OUTPUT_DIR
    out_dir.mkdir(parents=True, exist_ok=True)

    extractions = extract_topics_from_raw_files(llm=llm, raw_dir=raw_dir, force=force)
    grouped = group_chunks_by_topic(extractions)

    incremental = extractions.get("incremental", {})
    changed_sources = set(
        incremental.get("new", [])
        + incremental.get("modified", [])
        + incremental.get("deleted", [])
    )

    if force:
        dirty_topics: set[str] | None = None
    elif changed_sources:
        dirty_topics = topics_affected_by_sources(grouped, changed_sources)
    else:
        dirty_topics = set()

    removed = cleanup_stale_drafts(grouped, out_dir)
    written, skipped = synthesize_topic_wiki_pages(
        grouped,
        llm=llm,
        output_dir=out_dir,
        dirty_topics=dirty_topics,
    )

    extractions_path: Path | None = None
    grouped_path: Path | None = None

    if save_extractions_json:
        extractions_path = out_dir / "extractions.json"
        extractions_path.write_text(
            json.dumps(extractions, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )
        grouped_path = out_dir / "grouped_by_topic.json"
        grouped_path.write_text(
            json.dumps(grouped, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )

    return {
        "chunk_count": extractions["chunk_count"],
        "topic_count": len(grouped),
        "pages_written": len(written),
        "pages_skipped": len(skipped),
        "drafts_removed": len(removed),
        "incremental": incremental,
        "output_dir": str(out_dir.resolve()),
        "state_file": str(STATE_FILE.resolve()),
        "extractions_json": str(extractions_path.resolve()) if extractions_path else None,
        "grouped_json": str(grouped_path.resolve()) if grouped_path else None,
        "wiki_pages": [str(p.resolve()) for p in written],
    }


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Extract topics from raw files and synthesize grouped wiki drafts"
    )
    parser.add_argument(
        "--heuristic-only",
        action="store_true",
        help="Skip LLM even when OPENAI_API_KEY is set",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Reprocess all raw files regardless of MD5 state",
    )
    args = parser.parse_args()

    client = LLMClient(api_key="") if args.heuristic_only else LLMClient()
    result = run_topic_synthesis_pipeline(llm=client, force=args.force)
    print(json.dumps(result, indent=2))

