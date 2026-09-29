"""Plain text of one raw source file, read the way the pipeline reads it.

The offline evals compare wiki pages and answers against their raw
sources. Reading every source with Path.read_text() works for notes and
Markdown, but a PDF, DOCX, XLSX or PPTX source then contributes its raw
bytes, and an .eml its MIME encoding -- so a page built from a grant
application PDF could never count as grounded. This module returns the
same text the compiler extracts: the parsed email body, the library-
extracted document text, and the file's own text for everything else.
Images and audio need an LLM to describe, so they contribute nothing.
"""

from __future__ import annotations

from pathlib import Path

from media_ingest import AUDIO_EXTENSIONS, IMAGE_EXTENSIONS, extract_text

EMAIL_EXTENSIONS = {".eml"}


def read_source_text(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix in EMAIL_EXTENSIONS:
        from email_ingest import parse_eml

        parsed = parse_eml(path)
        return f"{parsed.subject}\n{parsed.from_addr}\n{parsed.body_text}"
    if suffix in IMAGE_EXTENSIONS or suffix in AUDIO_EXTENSIONS:
        return ""
    extracted = extract_text(path)
    if extracted is not None:
        return extracted
    return path.read_text(encoding="utf-8", errors="replace")
