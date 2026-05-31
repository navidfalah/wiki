#!/usr/bin/env python3
"""Escape patterns in markdown bodies that break MDX compilation."""

from __future__ import annotations

import re

_MD_SEGMENT_RE = re.compile(
    r"(\[[^\]]*\]\([^)]*\)|```[\s\S]*?```|`[^`\n]+`)"
)


def _escape_mdx_outside_segments(text: str, *, escape_braces: bool) -> str:
    text = re.sub(r"<([^<>\s]+@[^<>\s]+)>", r"&lt;\1&gt;", text)
    text = text.replace("<", "&lt;").replace(">", "&gt;")
    if escape_braces:
        text = text.replace("{", "&#123;").replace("}", "&#125;")
    return text


def sanitize_for_mdx(body: str) -> str:
    """Escape characters MDX would misparse as JSX or expressions."""
    parts: list[str] = []
    for index, segment in enumerate(_MD_SEGMENT_RE.split(body)):
        if index % 2 == 1:
            parts.append(segment)
        else:
            parts.append(_escape_mdx_outside_segments(segment, escape_braces=True))
    return "".join(parts) if parts else _escape_mdx_outside_segments(body, escape_braces=True)
