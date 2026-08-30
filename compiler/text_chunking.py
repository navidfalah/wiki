"""Paragraph-based text chunking shared by every raw-source ingestor.

Kept dependency-free (stdlib only) so synthesizer.py, media_ingest.py, and
email_ingest.py can all import it without risking circular imports.
"""

from __future__ import annotations

import re


def split_text_into_chunks(content: str, *, max_chars: int = 2000) -> list[str]:
    """Split text into paragraph-based chunks for extraction."""
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
