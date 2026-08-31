"""Summarization, topic extraction, and wiki page synthesis from raw sources."""

from __future__ import annotations

import hashlib
import json
import re
from collections.abc import Callable
from dataclasses import asdict, dataclass, field
from datetime import UTC, datetime
from pathlib import Path

import email_ingest
import media_ingest
import pii_redaction
import trust
from extraction_critic import DEFAULT_SAMPLE_TEMPERATURE, apply_critic_pass
from llm_client import LLMClient, require_llm
from models import RAW_DIR, STATE_FILE
from text_chunking import split_text_into_chunks
from yaml_frontmatter import DRAFT_GENERATED_NOTE, insert_generated_banner, yaml_quote

EMAIL_EXTENSIONS = email_ingest.EMAIL_EXTENSIONS
IMAGE_EXTENSIONS = media_ingest.IMAGE_EXTENSIONS
FILE_EXTENSIONS = media_ingest.FILE_EXTENSIONS
TEXT_EXTENSIONS = {".txt", ".md"}
ALL_SOURCE_EXTENSIONS = TEXT_EXTENSIONS | EMAIL_EXTENSIONS | IMAGE_EXTENSIONS | FILE_EXTENSIONS

ProgressCallback = Callable[[int, int, str], None]

COMPILER_DIR = Path(__file__).resolve().parent
TEMP_OUTPUT_DIR = COMPILER_DIR / "temp_output"


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    return text.strip("-")[:80]


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
- Include sections: Overview, Key Details, Related Entities, Related Concepts, Contradictions (if any)
- Merge overlapping facts; flag contradictions with a blockquote starting with **Contradiction:**
- Use bullet lists and short paragraphs
- Some source chunks may themselves be an image caption, an email, or an
  extracted file/PDF excerpt rather than a plain note — treat them as
  first-class content, and preserve any embedded ![...](...) image or
  [...](...) download links from the source chunks verbatim
- Do NOT add your own "Sources" or "References" section — one is appended
  automatically after your content, listing every source with its trust level

Return ONLY the complete Markdown file (frontmatter + body). No commentary."""


# "text" (a .txt/.md note), "email" (a .eml message), "image" (a captioned
# image), or "file" (an extracted/attached PDF, CSV, JSON, or opaque file).
# See media_ingest.py / email_ingest.py for how non-text chunks are built,
# and trust.py for how source_type feeds into the default trust level.
SourceType = str


@dataclass
class RawChunk:
    """A slice of text from a raw source file."""

    source_path: str
    chunk_index: int
    text: str
    source_type: SourceType = "text"


@dataclass
class ChunkExtraction:
    """LLM extraction results for one chunk."""

    source_path: str
    chunk_index: int
    text: str
    topics: list[str] = field(default_factory=list)
    entities: list[dict[str, str]] = field(default_factory=list)
    concepts: list[dict[str, str]] = field(default_factory=list)
    source_type: SourceType = "text"


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
    for path in discover_raw_source_files(root):
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
    return datetime.now(UTC).isoformat()


def _raw_chunk_from_dict(rel_source: str, chunk_dict: dict) -> RawChunk:
    """Wrap a media_ingest/email_ingest chunk dict into a RawChunk.

    Those modules return plain dicts (not RawChunk) to stay import-free of
    this module; ``media_link`` is metadata for callers that want the asset
    URL directly (unused here since it's already embedded in ``text``).
    """
    return RawChunk(
        source_path=rel_source,
        chunk_index=chunk_dict["chunk_index"],
        text=chunk_dict["text"],
        source_type=chunk_dict.get("source_type", "file"),
    )


def _chunks_for_file(path: Path, raw_dir: Path, llm: LLMClient | None = None) -> list[RawChunk]:
    """Build RawChunks for one raw source file, dispatching by extension.

    Text/markdown files are chunked directly; everything else is delegated to
    the dedicated ingestor for that source type (email_ingest.py for .eml,
    media_ingest.py for images and other file attachments), which returns
    plain chunk dicts that get wrapped into RawChunk here. This keeps
    email_ingest.py/media_ingest.py free of any dependency on synthesizer.py.
    """
    rel = str(path.relative_to(raw_dir)).replace("\\", "/")
    suffix = path.suffix.lower()

    if suffix in {".txt", ".md"}:
        content = path.read_text(encoding="utf-8")
        return [
            RawChunk(source_path=rel, chunk_index=index, text=text, source_type="text")
            for index, text in enumerate(split_text_into_chunks(content))
        ]

    if suffix in EMAIL_EXTENSIONS:
        chunk_dicts = email_ingest.build_email_chunks(path, rel)
        return [_raw_chunk_from_dict(rel, cd) for cd in chunk_dicts]

    if suffix in IMAGE_EXTENSIONS:
        client = require_llm(llm)
        chunk_dict = media_ingest.build_image_chunk(path, rel, client)
        return [_raw_chunk_from_dict(rel, chunk_dict)]

    if suffix in FILE_EXTENSIONS:
        chunk_dicts = media_ingest.build_file_chunks(path, rel)
        return [_raw_chunk_from_dict(rel, cd) for cd in chunk_dicts]

    # Unrecognized extension shouldn't reach here given discover_raw_source_files
    # filters to known extensions, but degrade gracefully rather than crash.
    return []


def _chunk_dicts_from_extractions(extractions: list[ChunkExtraction]) -> list[dict]:
    return [
        {
            "chunk_index": ext.chunk_index,
            "text": ext.text,
            "topics": ext.topics,
            "entities": ext.entities,
            "concepts": ext.concepts,
            "source_type": ext.source_type,
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
            source_type=chunk.get("source_type", "text"),
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


def discover_raw_source_files(raw_dir: Path | None = None) -> list[Path]:
    """Return every recognized raw source file under data/raw/, excluding _archive/.

    Covers plain text/markdown notes, .eml emails, images, and the file types
    listed in media_ingest.FILE_EXTENSIONS (PDF/CSV/JSON/DOCX/XLSX/PPTX/ZIP).
    Hidden files (dotfiles like .gitkeep) and unrecognized extensions are
    skipped rather than ingested as opaque noise.
    """
    root = raw_dir or RAW_DIR
    files: list[Path] = []
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        if "_archive" in path.parts:
            continue
        if path.name.startswith("."):
            continue
        if path.suffix.lower() not in ALL_SOURCE_EXTENSIONS:
            continue
        files.append(path)
    return sorted(set(files))


def read_raw_chunks(raw_dir: Path | None = None, llm: LLMClient | None = None) -> list[RawChunk]:
    """Read every raw source file (text, email, image, file) and chunk it.

    ``llm`` is required only if images are present (for captioning) — pass it
    whenever the caller already has one, since the compiler is LLM-only
    anyway and there's no cheaper fallback for describing an image.
    """
    root = raw_dir or RAW_DIR
    chunks: list[RawChunk] = []

    for path in discover_raw_source_files(root):
        chunks.extend(_chunks_for_file(path, root, llm))

    return chunks


def _parse_extraction_json(raw: str) -> dict:
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if not match:
        raise ValueError("LLM response did not contain JSON")
    return json.loads(match.group())


def extract_chunk_topics(
    chunk: RawChunk,
    llm: LLMClient | None = None,
    *,
    extra_system_context: str = "",
    redact_pii: bool = False,
) -> ChunkExtraction:
    """Extract topics, entities, and concepts from a single text chunk.

    extra_system_context, when non-empty, is appended to
    CHUNK_EXTRACTION_SYSTEM_PROMPT — active_learning.py's
    render_fewshot_block() is the intended source: human corrections from a
    prior compile's review queue, fed back as a few-shot block so the same
    mistake is less likely to repeat.

    redact_pii=True runs pii_redaction.py's default policy over the chunk
    text sent to the LLM (SSNs, credit cards, API keys, phone numbers, IPv4
    addresses — see pii_redaction.py's module docstring for why email
    addresses and names are NOT redacted by default: they matter to entity
    resolution and the email-knowledge engine). The stored ChunkExtraction
    still reports the original, unredacted chunk.text — only what actually
    leaves the machine in the prompt is redacted.
    """
    client = require_llm(llm)

    system_prompt = CHUNK_EXTRACTION_SYSTEM_PROMPT
    if extra_system_context:
        system_prompt = f"{system_prompt}\n\n{extra_system_context}"

    chunk_text = chunk.text[:8000]
    if redact_pii:
        chunk_text = pii_redaction.redact_text(chunk_text).text

    prompt = f"Source file: {chunk.source_path}\nChunk index: {chunk.chunk_index}\n\n---\n\n{chunk_text}"
    # temperature=0: this is structured fact extraction (topics/entities/
    # concepts as JSON), not prose generation — it should return the same
    # answer for the same input, not sample creatively.
    raw = client.generate_response(prompt, system_prompt, temperature=0.0)
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
        source_type=chunk.source_type,
    )


def extract_topics_from_raw_files(
    llm: LLMClient | None = None,
    raw_dir: Path | None = None,
    *,
    force: bool = False,
    on_progress: ProgressCallback | None = None,
    extra_system_context: str = "",
    redact_pii: bool = False,
) -> dict:
    """
    Read text files from data/raw/ and extract topics per chunk.

    Uses MD5 hashes stored in data/state.json to skip unchanged files on
    subsequent runs. Only new or modified files are sent to the LLM.
    """
    llm = require_llm(llm)
    root = raw_dir or RAW_DIR
    state = load_state()
    files_state: dict[str, dict] = state.setdefault("files", {})
    changes = scan_raw_file_changes(root, state, force=force)

    path_by_rel = {
        str(p.relative_to(root)).replace("\\", "/"): p
        for p in discover_raw_source_files(root)
    }

    for rel in changes.deleted:
        files_state.pop(rel, None)

    to_process = changes.to_process
    total_files = len(to_process)
    for index, rel in enumerate(to_process, start=1):
        path = path_by_rel[rel]
        md5 = compute_file_md5(path)
        file_chunks = _chunks_for_file(path, root, llm)
        extractions = []
        chunk_count = len(file_chunks)
        for chunk_index, chunk in enumerate(file_chunks, start=1):
            extractions.append(
                extract_chunk_topics(
                    chunk, llm, extra_system_context=extra_system_context, redact_pii=redact_pii
                )
            )
            if on_progress and chunk_count > 1:
                on_progress(
                    index,
                    total_files,
                    f"{rel} (chunk {chunk_index}/{chunk_count})",
                )
        files_state[rel] = {
            "md5": md5,
            "chunks": _chunk_dicts_from_extractions(extractions),
            "processed_at": _utc_now_iso(),
        }
        save_state(state)
        if on_progress:
            on_progress(index, total_files, rel)

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
              "concepts": [...],
              "source_type": "text"
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
                "source_type": chunk.get("source_type", "text"),
            }
            for topic in topics:
                topic_key = topic.strip()
                if not topic_key:
                    continue
                grouped.setdefault(topic_key, []).append(payload)

    return dict(sorted(grouped.items(), key=lambda item: item[0].lower()))


def _yaml_scalar(value: str) -> str:
    """Format a string for safe use in YAML frontmatter."""
    return yaml_quote(value)


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


_LLM_SOURCES_SECTION_RE = re.compile(
    r"\n#{2,3}\s*(Sources|References)\b.*?(?=\n#{1,3}\s|\Z)",
    re.DOTALL | re.IGNORECASE,
)


def _strip_llm_authored_sources_section(body: str) -> str:
    """Safety net: drop any Sources/References section the LLM wrote anyway.

    WIKI_PAGE_SYSTEM_PROMPT tells the model not to add one (the deterministic
    one from trust.py is appended right after this runs), but models don't
    always follow instructions — this keeps the page from ending up with two.
    """
    return _LLM_SOURCES_SECTION_RE.sub("", body)


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
    on_progress: ProgressCallback | None = None,
    apply_critic: bool = False,
    extra_system_context: str = "",
    critic_samples: int = 1,
    critic_sample_temperature: float = DEFAULT_SAMPLE_TEMPERATURE,
) -> tuple[list[Path], list[str]]:
    """
    For each unique topic, write a Markdown wiki page synthesizing related chunks.

    When dirty_topics is set, only those topics are regenerated; existing drafts
    for unchanged topics are kept to save API calls.

    apply_critic=True runs a second LLM pass (extraction_critic.py) over each
    draft before it's written, stripping any sentence the critic can't ground
    in that topic's source chunks. Off by default: it roughly doubles the
    per-page LLM cost, so it's an explicit opt-in (main.py's --critic-pass /
    WIKI_CRITIC_PASS), not a silent behavior change for existing users.

    critic_samples>1 (only meaningful with apply_critic=True) runs the critic
    multiple times per page and only strips a sentence a majority of passes
    flagged — see extraction_critic.review_draft_for_grounding() for why.

    extra_system_context, when non-empty, is appended to both
    WIKI_PAGE_SYSTEM_PROMPT and (when apply_critic=True) the critic's system
    prompt — active_learning.py's render_fewshot_block() is the intended
    source. Synthesis (freeform page writing) is the stage most prone to
    adding an unsupported detail, and the critic is what's meant to catch
    that, so both need the same corrections extract_chunk_topics() already
    gets, not just extraction.
    """
    llm = require_llm(llm)
    out_dir = output_dir or TEMP_OUTPUT_DIR
    out_dir.mkdir(parents=True, exist_ok=True)
    trust_config = trust.load_trust_config()

    written: list[Path] = []
    skipped: list[str] = []

    work: list[tuple[str, list[dict]]] = []
    for topic, entries in grouped_topics.items():
        entries = _dedupe_chunk_entries(entries)
        topic_slug = slugify(topic) or "untitled-topic"
        out_path = out_dir / f"{topic_slug}.md"
        if dirty_topics is not None and topic not in dirty_topics and out_path.exists():
            skipped.append(topic)
            continue
        work.append((topic, entries))

    total = len(work)
    for index, (topic, entries) in enumerate(work, start=1):
        topic_slug = slugify(topic) or "untitled-topic"
        out_path = out_dir / f"{topic_slug}.md"

        chunk_blocks = []
        for entry in entries:
            source_type = entry.get("source_type", "text")
            chunk_blocks.append(
                f"### Source: `{entry['source']}` (chunk {entry['chunk_index']}, type: {source_type})\n\n"
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
        system_prompt = WIKI_PAGE_SYSTEM_PROMPT
        if extra_system_context:
            system_prompt = f"{system_prompt}\n\n{extra_system_context}"
        body = llm.generate_response(prompt, system_prompt)
        body = _strip_llm_authored_sources_section(body.strip())

        if apply_critic:
            source_text = "\n\n---\n\n".join(chunk_blocks)
            body, critic_report = apply_critic_pass(
                source_text,
                body,
                llm,
                extra_system_context=extra_system_context,
                samples=critic_samples,
                sample_temperature=critic_sample_temperature,
            )
            if critic_report.flagged:
                removed_count = sum(1 for f in critic_report.flagged if f.removed)
                console_note = (
                    f"critic flagged {len(critic_report.flagged)} sentence(s) in '{topic}' "
                    f"({removed_count} removed)"
                )
                if on_progress:
                    on_progress(index, total, console_note)

        references = trust.build_references(entries, trust_config)
        references_md = trust.render_references_markdown(references)
        if references_md:
            body = body.rstrip() + "\n\n" + references_md

        body = insert_generated_banner(body.strip(), DRAFT_GENERATED_NOTE)

        out_path.write_text(body.strip() + "\n", encoding="utf-8")
        written.append(out_path)
        if on_progress:
            on_progress(index, total, topic)

    return written, skipped


def run_topic_synthesis_pipeline(
    llm: LLMClient | None = None,
    raw_dir: Path | None = None,
    output_dir: Path | None = None,
    *,
    force: bool = False,
    save_extractions_json: bool = True,
    apply_critic: bool = False,
) -> dict:
    """
    End-to-end: extract topics → group by topic → write wiki drafts to temp_output/.

    Respects MD5 state in data/state.json unless force=True.
    """
    llm = require_llm(llm)
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
        apply_critic=apply_critic,
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
        "--force",
        action="store_true",
        help="Reprocess all raw files regardless of MD5 state",
    )
    args = parser.parse_args()

    result = run_topic_synthesis_pipeline(force=args.force)
    print(json.dumps(result, indent=2))

