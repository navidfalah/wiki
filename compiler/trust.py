"""Source trustworthiness scoring and citation/reference tracking.

This is a deliberately separate concern from extraction/synthesis: as more
source types get ingested (plain notes, emails, images, PDFs...) a wiki page
synthesized from them needs a way to say *how much to trust* each fact and
*where it came from* — independent of whatever the LLM chose to write in its
own prose. Two things live here:

1. Trust scoring (`resolve_trust`) — a small, human-editable rule engine
   (glob patterns against the source's relative path, falling back to a
   default per `source_type`) that assigns a level from `TRUST_LEVELS`.
   Configured via data/source_trust.json, following the same
   human-overridable-JSON pattern as data/link_overrides.json.

2. Reference building (`build_references` / `render_references_markdown`) —
   turns a topic's chunk entries into a deduped, numbered citation list with
   each source's trust level, rendered as a deterministic markdown table.
   This is appended to every synthesized page by synthesizer.py *after* the
   LLM call, so the reference list is always accurate and present regardless
   of whether the LLM remembered to cite its sources.
"""

from __future__ import annotations

import fnmatch
import json
from dataclasses import dataclass
from pathlib import Path

from models import TRUST_CONFIG_FILE

# Ordered low -> high; index doubles as a numeric score for sorting/comparison.
TRUST_LEVELS = ["unverified", "low", "medium", "high", "verified"]
TRUST_SCORES = {level: index for index, level in enumerate(TRUST_LEVELS)}

TRUST_LABELS = {
    "unverified": "Unverified",
    "low": "Low",
    "medium": "Medium",
    "high": "High",
    "verified": "Verified",
}

# Sensible defaults per source_type — a raw note is unverified prose from the
# user, an email is a real (if informal) record, a caption is a model's guess
# at what an image shows, and an extracted document sits in between.
DEFAULT_TRUST_BY_SOURCE_TYPE = {
    "text": "medium",
    "email": "medium",
    "image": "low",
    "file": "medium",
}

DEFAULT_CONFIG: dict = {
    "version": 1,
    "default_by_source_type": dict(DEFAULT_TRUST_BY_SOURCE_TYPE),
    "rules": [],
}


@dataclass(frozen=True)
class TrustInfo:
    level: str
    score: int
    reason: str


def _default_config() -> dict:
    return json.loads(json.dumps(DEFAULT_CONFIG))


def load_trust_config(path: Path | None = None) -> dict:
    """Load data/source_trust.json, falling back to defaults if absent/invalid."""
    target = path or TRUST_CONFIG_FILE
    if not target.is_file():
        return _default_config()
    try:
        data = json.loads(target.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return _default_config()
    data.setdefault("version", 1)
    data.setdefault("default_by_source_type", {})
    data.setdefault("rules", [])
    return data


def save_trust_config(config: dict, path: Path | None = None) -> Path:
    target = path or TRUST_CONFIG_FILE
    target.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "version": config.get("version", 1),
        "default_by_source_type": config.get("default_by_source_type", {}),
        "rules": config.get("rules", []),
    }
    target.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    return target


def _normalize_level(level: str | None) -> str:
    level = (level or "").strip().lower()
    return level if level in TRUST_SCORES else "medium"


def resolve_trust(source_path: str, source_type: str, config: dict | None = None) -> TrustInfo:
    """Resolve a trust level for a raw source.

    First glob rule (in config["rules"], in order) whose "pattern" matches the
    source's forward-slash relative path wins. Falls back to
    config["default_by_source_type"][source_type], then the built-in default
    for that source_type, then "medium".
    """
    cfg = config if config is not None else DEFAULT_CONFIG
    normalized_path = source_path.replace("\\", "/")

    for rule in cfg.get("rules", []):
        pattern = rule.get("pattern", "")
        if pattern and fnmatch.fnmatch(normalized_path, pattern):
            level = _normalize_level(rule.get("level"))
            reason = rule.get("reason") or f"Matched rule pattern: {pattern}"
            return TrustInfo(level=level, score=TRUST_SCORES[level], reason=reason)

    defaults = {**DEFAULT_TRUST_BY_SOURCE_TYPE, **cfg.get("default_by_source_type", {})}
    level = _normalize_level(defaults.get(source_type, "medium"))
    return TrustInfo(
        level=level,
        score=TRUST_SCORES[level],
        reason=f"Default trust for source_type={source_type!r}",
    )


@dataclass(frozen=True)
class ReferenceEntry:
    index: int
    source_path: str
    source_type: str
    chunk_index: int
    trust: TrustInfo


def build_references(entries: list[dict], config: dict | None = None) -> list[ReferenceEntry]:
    """Build a deduped, numbered reference list from a topic's chunk entries.

    One entry per distinct source path (first chunk_index seen wins), numbered
    in the order sources first appear.
    """
    cfg = config if config is not None else load_trust_config()
    seen: dict[str, ReferenceEntry] = {}

    for entry in entries:
        source = entry.get("source", "")
        if not source or source in seen:
            continue
        source_type = entry.get("source_type", "text")
        trust = resolve_trust(source, source_type, cfg)
        seen[source] = ReferenceEntry(
            index=len(seen) + 1,
            source_path=source,
            source_type=source_type,
            chunk_index=entry.get("chunk_index", 0),
            trust=trust,
        )

    return sorted(seen.values(), key=lambda ref: ref.index)


def render_references_markdown(references: list[ReferenceEntry]) -> str:
    """Render a deterministic '## References & Trust' markdown section."""
    if not references:
        return ""

    lines = [
        "## References & Trust",
        "",
        "| # | Source | Type | Trust |",
        "|---|--------|------|-------|",
    ]
    for ref in references:
        label = TRUST_LABELS.get(ref.trust.level, ref.trust.level.title())
        lines.append(f"| {ref.index} | `{ref.source_path}` | {ref.source_type} | {label} |")

    return "\n".join(lines) + "\n"
