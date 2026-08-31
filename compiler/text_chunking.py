"""Paragraph-based text chunking shared by every raw-source ingestor.

Kept dependency-free (stdlib only) so synthesizer.py, media_ingest.py, and
email_ingest.py can all import it without risking circular imports.
"""

from __future__ import annotations

import re


def split_text_into_chunks(
    content: str, *, max_chars: int = 2000, overlap_chars: int | None = None
) -> list[str]:
    """Split text into paragraph-based chunks for extraction.

    Consecutive chunks overlap by carrying the trailing paragraph(s) of one
    chunk forward into the start of the next, up to `overlap_chars` (default:
    ~12.5% of max_chars). Without this, a fact whose supporting context
    straddles a chunk boundary gets extracted from a truncated view of it —
    the sentence right before the cut is invisible to whichever chunk starts
    after it. Pass overlap_chars=0 to disable and get the old
    zero-overlap behavior.
    """
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", content) if p.strip()]
    if not paragraphs:
        return [content.strip()] if content.strip() else []

    if overlap_chars is None:
        overlap_chars = max(0, round(max_chars * 0.125))

    def _overlap_prefix(prev_paragraphs: list[str]) -> list[str]:
        prefix: list[str] = []
        total = 0
        for para in reversed(prev_paragraphs):
            candidate_total = total + len(para) + 2
            if candidate_total > overlap_chars:
                break
            prefix.insert(0, para)
            total = candidate_total
        return prefix

    chunk_groups: list[list[str]] = []
    current: list[str] = []
    current_len = 0

    for para in paragraphs:
        para_len = len(para)
        if current and current_len + para_len + 2 > max_chars:
            chunk_groups.append(current)
            carry = _overlap_prefix(current) if overlap_chars > 0 else []
            current = [*carry, para]
            current_len = sum(len(p) + 2 for p in current)
        else:
            current.append(para)
            current_len += para_len + 2

    if current:
        chunk_groups.append(current)

    return ["\n\n".join(group) for group in chunk_groups]
