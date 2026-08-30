"""Shared path constants for the LLM Wiki compiler."""

from __future__ import annotations

from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = PROJECT_ROOT / "data" / "raw"
OUTPUT_DIR = PROJECT_ROOT / "wiki-app" / "docs"
STATE_FILE = PROJECT_ROOT / "data" / "state.json"

# Where copies of ingested images/files/email attachments are published so
# Docusaurus can serve them (referenced from docs/*.md with a relative link).
STATIC_DIR = PROJECT_ROOT / "wiki-app" / "static"
STATIC_MEDIA_DIR = STATIC_DIR / "media"

# Per-source trustworthiness overrides (glob rules); see trust.py.
TRUST_CONFIG_FILE = PROJECT_ROOT / "data" / "source_trust.json"
