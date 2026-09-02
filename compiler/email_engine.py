"""Email knowledge engine — browse ingested .eml sources as first-class knowledge.

Sits on top of email_ingest.py (which turns a .eml file into pipeline chunks)
the same way analytics.py sits on top of the compiled docs: this module
answers "what emails do we have and what did each one contribute to the
wiki", independent of whether a compile has run yet. Pure functions, no
FastAPI import, so server.py's routes are a thin wrapper and this stays unit
testable on its own.
"""

from __future__ import annotations

import re
from datetime import datetime, timezone
from email.message import EmailMessage
from email.utils import format_datetime
from pathlib import Path
from typing import Any

from doc_utils import collect_source_metadata, raw_file_status, synthesized_pages_for_topics
from email_ingest import EMAIL_EXTENSIONS, ParsedEmail, parse_eml
from models import OUTPUT_DIR, RAW_DIR
from synthesizer import compute_file_md5, discover_raw_source_files, load_state
from trust import load_trust_config, resolve_trust


class NotAnEmailError(ValueError):
    """Raised when a detail lookup is asked for a non-.eml raw source."""


def _resolve_raw_path(raw_dir: Path, file_path: str) -> Path:
    candidate = (raw_dir / file_path).resolve()
    if not str(candidate).startswith(str(raw_dir.resolve())):
        raise NotAnEmailError(f"Invalid raw file path: {file_path}")
    return candidate


def _slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return slug or "email"


def _unique_eml_path(raw_dir: Path, subject: str) -> Path:
    emails_dir = raw_dir / "emails"
    emails_dir.mkdir(parents=True, exist_ok=True)
    prefix = datetime.now().strftime("%Y-%m-%d")
    slug = _slugify(subject)
    candidate = emails_dir / f"{prefix}-{slug}.eml"
    counter = 2
    while candidate.exists():
        candidate = emails_dir / f"{prefix}-{slug}-{counter}.eml"
        counter += 1
    return candidate


def _build_eml_bytes(
    subject: str,
    from_addr: str,
    to_addrs: list[str],
    cc_addrs: list[str],
    date: str,
    body: str,
) -> bytes:
    msg = EmailMessage()
    msg["Subject"] = subject or "(no subject)"
    msg["From"] = from_addr or "(unknown sender)"
    msg["To"] = ", ".join(to_addrs) or "(unknown recipient)"
    if cc_addrs:
        msg["Cc"] = ", ".join(cc_addrs)
    msg["Date"] = date.strip() if date and date.strip() else format_datetime(datetime.now(timezone.utc))
    msg.set_content(body or "")
    return msg.as_bytes()


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

    candidate = _resolve_raw_path(raw_dir, file_path)
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


def create_email(
    subject: str,
    from_addr: str,
    to_addrs: list[str],
    cc_addrs: list[str],
    date: str,
    body: str,
    raw_dir: Path | None = None,
) -> dict[str, Any]:
    """Write a new .eml source under raw_dir/emails/ and return its detail."""
    raw_dir = raw_dir or RAW_DIR
    target = _unique_eml_path(raw_dir, subject)
    target.write_bytes(_build_eml_bytes(subject, from_addr, to_addrs, cc_addrs, date, body))
    rel = str(target.relative_to(raw_dir)).replace("\\", "/")
    return get_email_detail(rel, raw_dir=raw_dir)


def update_email(
    file_path: str,
    subject: str,
    from_addr: str,
    to_addrs: list[str],
    cc_addrs: list[str],
    date: str,
    body: str,
    raw_dir: Path | None = None,
) -> dict[str, Any]:
    """Overwrite an existing .eml source in place and return its new detail."""
    raw_dir = raw_dir or RAW_DIR
    candidate = _resolve_raw_path(raw_dir, file_path)
    if not candidate.is_file():
        raise FileNotFoundError(f"Raw file not found: {file_path}")
    if candidate.suffix.lower() not in EMAIL_EXTENSIONS:
        raise NotAnEmailError(f"Not an email source: {file_path}")

    candidate.write_bytes(_build_eml_bytes(subject, from_addr, to_addrs, cc_addrs, date, body))
    rel = str(candidate.relative_to(raw_dir)).replace("\\", "/")
    return get_email_detail(rel, raw_dir=raw_dir)


def delete_email(file_path: str, raw_dir: Path | None = None) -> dict[str, Any]:
    """Delete an existing .eml source."""
    raw_dir = raw_dir or RAW_DIR
    candidate = _resolve_raw_path(raw_dir, file_path)
    if not candidate.is_file():
        raise FileNotFoundError(f"Raw file not found: {file_path}")
    if candidate.suffix.lower() not in EMAIL_EXTENSIONS:
        raise NotAnEmailError(f"Not an email source: {file_path}")

    rel = str(candidate.relative_to(raw_dir)).replace("\\", "/")
    candidate.unlink()
    return {"deleted": True, "path": rel}
