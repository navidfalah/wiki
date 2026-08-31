"""Email knowledge engine — browse ingested .eml sources as first-class knowledge.

Sits on top of email_ingest.py (which turns a .eml file into pipeline chunks)
the same way analytics.py sits on top of the compiled docs: this module
answers "what emails do we have and what did each one contribute to the
wiki", independent of whether a compile has run yet. Pure functions, no
FastAPI import, so server.py's routes are a thin wrapper and this stays unit
testable on its own.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

from doc_utils import collect_source_metadata, raw_file_status, synthesized_pages_for_topics
from email_ingest import EMAIL_EXTENSIONS, ParsedEmail, parse_eml
from models import OUTPUT_DIR, RAW_DIR
from synthesizer import compute_file_md5, discover_raw_source_files, load_state
from trust import load_trust_config, resolve_trust


class NotAnEmailError(ValueError):
    """Raised when a detail lookup is asked for a non-.eml raw source."""


def _summary(parsed: ParsedEmail, rel: str) -> dict[str, Any]:
    trust = resolve_trust(rel, "email", load_trust_config())
    return {
        "path": rel,
        "subject": parsed.subject or "(no subject)",
        "from": parsed.from_addr,
        "to": parsed.to_addrs,
        "cc": parsed.cc_addrs,
        "date": parsed.date,
        "attachment_count": len(parsed.attachments),
        "trust": {"level": trust.level, "reason": trust.reason},
    }


def list_emails(raw_dir: Path | None = None) -> dict[str, Any]:
    """Every ingested .eml source with parsed headers and pipeline status."""
    raw_dir = raw_dir or RAW_DIR
    state = load_state()
    emails: list[dict[str, Any]] = []

    for path in discover_raw_source_files(raw_dir):
        if path.suffix.lower() not in EMAIL_EXTENSIONS:
            continue
        rel = str(path.relative_to(raw_dir)).replace("\\", "/")
        try:
            parsed = parse_eml(path)
        except Exception:
            continue
        md5 = compute_file_md5(path)
        status = raw_file_status(rel, md5, state)
        state_entry = state.get("files", {}).get(rel, {})
        metadata = collect_source_metadata(state_entry)
        summary = _summary(parsed, rel)
        summary.update(
            {
                "status": status,
                "processed_at": state_entry.get("processed_at"),
                "topic_count": len(metadata["topics"]),
                "body_preview": parsed.body_text.strip()[:220],
            }
        )
        emails.append(summary)

    emails.sort(key=lambda item: item["date"] or "", reverse=True)
    return {"total": len(emails), "emails": emails}


def get_email_detail(
    file_path: str,
    raw_dir: Path | None = None,
    docs_dir: Path | None = None,
) -> dict[str, Any]:
    """Full parsed email plus the topics/entities/pages it fed into the wiki.

    Raises NotAnEmailError for a non-.eml path and FileNotFoundError for a
    missing one — server.py translates both into the matching HTTP status.
    """
    raw_dir = raw_dir or RAW_DIR
    docs_dir = docs_dir or OUTPUT_DIR

    candidate = (raw_dir / file_path).resolve()
    if not str(candidate).startswith(str(raw_dir.resolve())):
        raise NotAnEmailError(f"Invalid raw file path: {file_path}")
    if not candidate.is_file():
        raise FileNotFoundError(f"Raw file not found: {file_path}")
    if candidate.suffix.lower() not in EMAIL_EXTENSIONS:
        raise NotAnEmailError(f"Not an email source: {file_path}")

    rel = str(candidate.relative_to(raw_dir)).replace("\\", "/")
    parsed = parse_eml(candidate)
    md5 = compute_file_md5(candidate)
    state = load_state()
    status = raw_file_status(rel, md5, state)
    state_entry = state.get("files", {}).get(rel, {})
    metadata = collect_source_metadata(state_entry)
    synthesized_pages = synthesized_pages_for_topics(
        metadata["topics"],
        metadata["entities"],
        metadata["concepts"],
        docs_dir,
    )

    summary = _summary(parsed, rel)
    summary.update(
        {
            "status": status,
            "processed_at": state_entry.get("processed_at"),
            "body": parsed.body_text,
            "attachments": [name for name, _ in parsed.attachments],
            "topics": metadata["topics"],
            "entities": metadata["entities"],
            "concepts": metadata["concepts"],
            "synthesized_pages": synthesized_pages,
        }
    )
    return summary
