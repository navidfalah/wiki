#!/usr/bin/env python3
"""Safe YAML scalar formatting for Docusaurus frontmatter."""

from __future__ import annotations

import json
import re

# Characters that start YAML flow/block structures or aliases
_YAML_START_SPECIAL = frozenset("-?*:!&>|@`#\"'%{},[]")

# Characters that often break unquoted scalars anywhere in the string
_YAML_INLINE_SPECIAL = frozenset(":\n#'\"<>{}[]|&*`")

_YAML_BOOLISH = frozenset(
    {"true", "false", "null", "yes", "no", "on", "off", "~"}
)


def yaml_quote(value: str) -> str:
    """Return a YAML-safe scalar (quoted when needed)."""
    if not value:
        return '""'
    if _needs_yaml_quotes(value):
        return json.dumps(value, ensure_ascii=False)
    return value


def _needs_yaml_quotes(value: str) -> bool:
    stripped = value.lstrip()
    if not stripped:
        return True
    if stripped[0] in _YAML_START_SPECIAL:
        return True
    if value != value.strip():
        return True
    if any(c in value for c in _YAML_INLINE_SPECIAL):
        return True
    if stripped.lower() in _YAML_BOOLISH:
        return True
    if re.fullmatch(r"[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?", stripped):
        return True
    return False
