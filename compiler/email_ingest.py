"""Dedicated module for ingesting email (.eml) raw sources.

Emails get their own module rather than being squeezed into the generic text
path because they have real structure worth preserving — headers (From/To/
Cc/Date/Subject), a body that may be text or HTML, and attachments — and
because that structure is exactly what makes an email a distinct kind of
source for trust scoring (see trust.py): an email thread is a different kind
of evidence than a scraped article or a scribbled note.

Parsing uses only the Python standard library (`email` + `email.policy`), so
there's no new dependency for the common case of a single .eml file per
message (as exported by Gmail's "Show original > Download", Outlook's "Save
as .eml", Apple Mail's drag-out-to-Finder, etc.). mbox archives (multiple
messages in one file) are out of scope here — split them into individual
.eml files first if you have one.

Like media_ingest.py, every public builder here returns plain chunk dicts
({"chunk_index", "text", "source_type": "email"}), not RawChunk instances,
to avoid a circular import with synthesizer.py.
"""

from __future__ import annotations

import email
import re
from dataclasses import dataclass, field
from email import policy
from email.message import EmailMessage
from pathlib import Path

from media_ingest import copy_bytes_to_static, docs_relative_media_link
from text_chunking import split_text_into_chunks

EMAIL_EXTENSIONS = {".eml"}

EMAIL_CHUNK_MAX_CHARS = 3000

_TAG_RE = re.compile(r"<[^>]+>")
_SCRIPT_STYLE_RE = re.compile(r"<(script|style)\b[^>]*>.*?</\1>", re.DOTALL | re.IGNORECASE)
_WHITESPACE_RE = re.compile(r"[ \t]+")
_BLANK_LINES_RE = re.compile(r"\n{3,}")


@dataclass
class ParsedEmail:
    """Structured contents of a single .eml message."""

    subject: str
    from_addr: str
    to_addrs: list[str]
    cc_addrs: list[str]
    date: str
    body_text: str
    attachments: list[tuple[str, bytes]] = field(default_factory=list)


def _split_addrs(header_value: str | None) -> list[str]:
    if not header_value:
        return []
    return [addr.strip() for addr in str(header_value).split(",") if addr.strip()]


def _strip_html(html: str) -> str:
    """Very small HTML->text fallback for messages with no text/plain part."""
    text = _SCRIPT_STYLE_RE.sub("", html)
    text = _TAG_RE.sub(" ", text)
    text = text.replace("&nbsp;", " ").replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
    text = _WHITESPACE_RE.sub(" ", text)
    text = _BLANK_LINES_RE.sub("\n\n", text)
    return text.strip()


def _extract_body_text(msg: EmailMessage) -> str:
    part = msg.get_body(preferencelist=("plain", "html")) if hasattr(msg, "get_body") else msg
    if part is None:
        return ""
    try:
        content = part.get_content()
    except Exception:
        return ""
    if not isinstance(content, str):
        return ""
    if part.get_content_type() == "text/html":
        content = _strip_html(content)
    return content.strip()


def _extract_attachments(msg: EmailMessage) -> list[tuple[str, bytes]]:
    attachments: list[tuple[str, bytes]] = []
    if not hasattr(msg, "iter_attachments"):
        return attachments
    for part in msg.iter_attachments():
        filename = part.get_filename() or "attachment"
        try:
            payload = part.get_content()
        except Exception:
            continue
        if isinstance(payload, str):
            payload = payload.encode("utf-8", errors="replace")
        if not isinstance(payload, (bytes, bytearray)):
            continue
        attachments.append((filename, bytes(payload)))
    return attachments


def parse_eml(path: Path) -> ParsedEmail:
    """Parse a single .eml file into headers + body text + attachments."""
    raw = path.read_bytes()
    msg = email.message_from_bytes(raw, policy=policy.default)

    return ParsedEmail(
        subject=str(msg.get("Subject", "")).strip(),
        from_addr=str(msg.get("From", "")).strip(),
        to_addrs=_split_addrs(msg.get("To")),
        cc_addrs=_split_addrs(msg.get("Cc")),
        date=str(msg.get("Date", "")).strip(),
        body_text=_extract_body_text(msg),
        attachments=_extract_attachments(msg),
    )


def _render_email_text(parsed: ParsedEmail, attachment_links: list[str]) -> str:
    header_lines = [
        f"Subject: {parsed.subject or '(no subject)'}",
        f"From: {parsed.from_addr or '(unknown sender)'}",
        f"To: {', '.join(parsed.to_addrs) or '(unknown recipient)'}",
    ]
    if parsed.cc_addrs:
        header_lines.append(f"Cc: {', '.join(parsed.cc_addrs)}")
    header_lines.append(f"Date: {parsed.date or '(unknown date)'}")

    body_parts = ["\n".join(header_lines), "", parsed.body_text.strip() or "(empty body)"]
    if attachment_links:
        body_parts += ["", "**Attachments:**", *attachment_links]

    return "\n".join(body_parts).strip()


def build_email_chunks(path: Path, rel_source: str, static_dir: Path | None = None) -> list[dict]:
    """Build chunk dicts (source_type='email') for one .eml file.

    The first chunk always carries the full header block, so a chunk that
    gets split across multiple pieces (long threads) never loses the
    From/To/Subject/Date context that matters for trust and citation.
    """
    parsed = parse_eml(path)

    attachment_links: list[str] = []
    for filename, payload in parsed.attachments:
        dest = copy_bytes_to_static(payload, filename, static_dir)
        link = docs_relative_media_link(dest, static_dir)
        attachment_links.append(f"- [{filename}]({link})")

    text = _render_email_text(parsed, attachment_links)
    pieces = split_text_into_chunks(text, max_chars=EMAIL_CHUNK_MAX_CHARS)
    if not pieces:
        pieces = [text]

    return [
        {"chunk_index": index, "text": piece, "source_type": "email"}
        for index, piece in enumerate(pieces)
    ]
