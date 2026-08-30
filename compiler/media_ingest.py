"""Ingest non-text raw sources: images and generic file attachments.

Images get an LLM-generated caption (vision-capable chat completion) and are
copied into wiki-app/static/media/ so they can be embedded in the compiled
page. Other file types are either text-extracted (PDF, CSV, JSON) or, when we
have no parser for them, registered as an opaque downloadable attachment —
still copied to static/media/ and linked, just without content extraction.

Every public function here returns plain dicts shaped like the chunk dicts
synthesizer.py already works with ({"chunk_index", "text", "source_type"}),
not RawChunk instances — that keeps this module import-free of synthesizer.py
and avoids a circular import.
"""

from __future__ import annotations

import csv
import hashlib
import json
from pathlib import Path

from models import STATIC_MEDIA_DIR
from text_chunking import split_text_into_chunks

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp"}

# File types we can pull text out of directly (no LLM needed for extraction).
TEXT_EXTRACTABLE_FILE_EXTENSIONS = {".pdf", ".csv", ".json"}

# File types we register as a downloadable attachment without parsing content.
OPAQUE_FILE_EXTENSIONS = {".docx", ".xlsx", ".pptx", ".zip"}

FILE_EXTENSIONS = TEXT_EXTRACTABLE_FILE_EXTENSIONS | OPAQUE_FILE_EXTENSIONS

IMAGE_CAPTION_SYSTEM_PROMPT = (
    "You are an assistant describing an image for a personal knowledge wiki. "
    "Describe what the image shows in 2-4 sentences: subject, any visible "
    "text, diagrams, charts, or notable details. Be factual and concise. If "
    "the image is a screenshot, transcribe any clearly readable text."
)

FILE_CONTENT_MAX_CHARS = 6000


def copy_bytes_to_static(data: bytes, filename: str, static_dir: Path | None = None) -> Path:
    """Write bytes into wiki-app/static/media/, deduped by content hash."""
    out_dir = static_dir or STATIC_MEDIA_DIR
    out_dir.mkdir(parents=True, exist_ok=True)

    digest = hashlib.sha256(data).hexdigest()[:10]
    stem = Path(filename).stem or "file"
    suffix = Path(filename).suffix.lower()
    dest = out_dir / f"{stem}-{digest}{suffix}"
    if not dest.exists():
        dest.write_bytes(data)
    return dest


def copy_media_to_static(source: Path, static_dir: Path | None = None) -> Path:
    """Copy a raw media file on disk into wiki-app/static/media/, deduped by hash."""
    return copy_bytes_to_static(source.read_bytes(), source.name, static_dir)


def docs_relative_media_link(dest_path: Path, static_dir: Path | None = None) -> str:
    """Build a markdown-relative link from a wiki-app/docs/*.md page to a static asset.

    wiki-app/docs/ and wiki-app/static/ are sibling directories, so a docs page
    reaches a file at wiki-app/static/media/x.png via "../static/media/x.png".
    Docusaurus's markdown image/link transform resolves relative paths like
    this at build time and rewrites them correctly for the configured baseUrl
    (unlike a leading "/" absolute path, which is NOT baseUrl-prefixed and so
    breaks between local dev and a GitHub Pages subpath deploy).
    """
    out_dir = static_dir or STATIC_MEDIA_DIR
    wiki_app_dir = out_dir.parent.parent  # .../wiki-app/static/media -> .../wiki-app
    rel = dest_path.resolve().relative_to(wiki_app_dir.resolve())
    return f"../{rel.as_posix()}"


def describe_image(path: Path, llm) -> str:
    """Ask the LLM (vision-capable) to caption an image."""
    return llm.describe_image(path, IMAGE_CAPTION_SYSTEM_PROMPT).strip()


def build_image_chunk(path: Path, rel_source: str, llm, static_dir: Path | None = None) -> dict:
    """Build a single chunk dict for an image: caption text + embedded markdown image."""
    dest = copy_media_to_static(path, static_dir)
    link = docs_relative_media_link(dest, static_dir)
    caption = describe_image(path, llm)

    text = (
        f"Image file: `{rel_source}`\n\n"
        f"Description: {caption}\n\n"
        f"![{path.stem}]({link})"
    )
    return {"chunk_index": 0, "text": text, "source_type": "image", "media_link": link}


def _extract_pdf_text(path: Path) -> str | None:
    """Best-effort PDF text extraction. Returns None if pypdf (or one of its
    own dependencies) isn't usable in this environment — deliberately broad
    because a broken transitive dependency (seen in practice: pypdf's
    optional `cryptography` extra failing to import) doesn't raise a plain
    ImportError, and a PDF attachment we can't parse should degrade to an
    opaque attachment rather than crash the whole compile."""
    try:
        from pypdf import PdfReader
    except BaseException:
        # Deliberately catches more than ImportError/Exception: a broken
        # transitive dependency of pypdf (observed in practice — a system
        # `cryptography` install missing its native backend) surfaces as a
        # pyo3_runtime.PanicException, which does not subclass Exception.
        # This is best-effort text extraction; any failure to even import
        # the library should fall back to treating the PDF as an opaque
        # attachment, never crash the compile.
        return None

    try:
        reader = PdfReader(str(path))
        pages_text = [page.extract_text() or "" for page in reader.pages]
    except Exception:
        return None

    text = "\n\n".join(t.strip() for t in pages_text if t.strip())
    return text.strip() or None


def _extract_csv_text(path: Path, *, max_rows: int = 50) -> str:
    with path.open(newline="", encoding="utf-8", errors="replace") as handle:
        rows = list(csv.reader(handle))
    preview = rows[:max_rows]
    lines = [", ".join(cell.strip() for cell in row) for row in preview]
    note = ""
    if len(rows) > max_rows:
        note = f"\n\n… ({len(rows) - max_rows} more row(s) not shown)"
    return "\n".join(lines) + note


def _extract_json_text(path: Path) -> str:
    data = json.loads(path.read_text(encoding="utf-8"))
    return json.dumps(data, indent=2, ensure_ascii=False)[:FILE_CONTENT_MAX_CHARS]


def _opaque_file_chunk(path: Path, rel_source: str, static_dir: Path | None, note: str = "") -> dict:
    dest = copy_media_to_static(path, static_dir)
    link = docs_relative_media_link(dest, static_dir)
    size_kb = path.stat().st_size / 1024
    text = (
        f"Attached file: `{rel_source}` ({path.suffix.lstrip('.').upper()}, {size_kb:.1f} KB)"
        f"{f' — {note}' if note else ''}\n\n"
        f"[Download {path.name}]({link})"
    )
    return {"chunk_index": 0, "text": text, "source_type": "file", "media_link": link}


def build_file_chunks(path: Path, rel_source: str, static_dir: Path | None = None) -> list[dict]:
    """Build chunk dict(s) for a generic file attachment.

    PDF/CSV/JSON get their text extracted (and chunked like any raw text
    source); everything else in FILE_EXTENSIONS becomes a single metadata +
    download-link chunk with no content extraction.
    """
    suffix = path.suffix.lower()

    extracted: str | None = None
    if suffix == ".pdf":
        extracted = _extract_pdf_text(path)
    elif suffix == ".csv":
        extracted = _extract_csv_text(path)
    elif suffix == ".json":
        extracted = _extract_json_text(path)

    if extracted:
        dest = copy_media_to_static(path, static_dir)
        link = docs_relative_media_link(dest, static_dir)
        header = f"Attached file: `{rel_source}` ([download]({link}))\n\n"
        pieces = split_text_into_chunks(extracted, max_chars=FILE_CONTENT_MAX_CHARS)
        if not pieces:
            pieces = [""]
        return [
            {
                "chunk_index": index,
                "text": header + piece if index == 0 else piece,
                "source_type": "file",
                "media_link": link,
            }
            for index, piece in enumerate(pieces)
        ]

    note = "text extraction unavailable" if suffix == ".pdf" else "content not parsed"
    return [_opaque_file_chunk(path, rel_source, static_dir, note=note)]
