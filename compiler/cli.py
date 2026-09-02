#!/usr/bin/env python3
"""CLI bridge for the Express+TypeScript backend.

rag_engine.py (hybrid retrieval + LLM chat) and email_engine.py (.eml
parsing + trust resolution) stay Python -- retrieval/embeddings and MIME
parsing are exactly the kind of logic that shouldn't be reimplemented from
scratch in a rewrite, so the Node backend shells out to this instead.
Each subcommand reads JSON from stdin (if it needs input) and writes one
JSON object to stdout; a non-zero exit code means the stdout body is
`{"error": "..."}`.
"""

from __future__ import annotations

import json
import sys

import email_engine
import rag_engine


def _read_stdin_json() -> dict:
    raw = sys.stdin.read()
    return json.loads(raw) if raw.strip() else {}


def cmd_chat() -> dict:
    payload = _read_stdin_json()
    message = str(payload.get("message", "")).strip()
    if not message:
        raise ValueError("'message' is required")
    history = payload.get("history")
    doc_scope = payload.get("doc_scope")
    return rag_engine.answer_question(message, history=history, doc_scope=doc_scope)


def cmd_chat_stream() -> None:
    """Unlike every other command, this writes one JSON object per line to
    stdout as rag_engine.answer_question_stream() yields, flushing after
    each -- the Node bridge reads this as a live stream, not one parse. An
    exception mid-stream is reported as a final {"type": "error"} line
    instead of the module's usual nonzero-exit-with-error-blob convention.
    """
    payload = _read_stdin_json()
    message = str(payload.get("message", "")).strip()
    history = payload.get("history")
    doc_scope = payload.get("doc_scope")
    try:
        if not message:
            raise ValueError("'message' is required")
        for event in rag_engine.answer_question_stream(message, history=history, doc_scope=doc_scope):
            print(json.dumps(event, ensure_ascii=False), flush=True)
    except Exception as exc:  # noqa: BLE001 -- surface any failure as a stream event
        print(json.dumps({"type": "error", "message": str(exc)}), flush=True)


def cmd_chat_status() -> dict:
    corpus = rag_engine.build_corpus()
    return {
        "corpus_pages": len({p.doc_path for p in corpus}),
        "corpus_passages": len(corpus),
        "llm_available": rag_engine.LLMClient().available,
    }


def cmd_emails_list() -> dict:
    return email_engine.list_emails()


def cmd_email_detail() -> dict:
    payload = _read_stdin_json()
    file_path = str(payload.get("path", ""))
    return email_engine.get_email_detail(file_path)


def _email_fields(payload: dict) -> tuple[str, str, list[str], list[str], str, str]:
    subject = str(payload.get("subject", "")).strip()
    from_addr = str(payload.get("from", "")).strip()
    to_addrs = [str(addr).strip() for addr in (payload.get("to") or []) if str(addr).strip()]
    cc_addrs = [str(addr).strip() for addr in (payload.get("cc") or []) if str(addr).strip()]
    date = str(payload.get("date", "")).strip()
    body = str(payload.get("body", ""))
    if not subject:
        raise ValueError("'subject' is required")
    if not from_addr:
        raise ValueError("'from' is required")
    return subject, from_addr, to_addrs, cc_addrs, date, body


def cmd_email_create() -> dict:
    payload = _read_stdin_json()
    subject, from_addr, to_addrs, cc_addrs, date, body = _email_fields(payload)
    return email_engine.create_email(subject, from_addr, to_addrs, cc_addrs, date, body)


def cmd_email_update() -> dict:
    payload = _read_stdin_json()
    file_path = str(payload.get("path", ""))
    if not file_path:
        raise ValueError("'path' is required")
    subject, from_addr, to_addrs, cc_addrs, date, body = _email_fields(payload)
    return email_engine.update_email(file_path, subject, from_addr, to_addrs, cc_addrs, date, body)


def cmd_email_delete() -> dict:
    payload = _read_stdin_json()
    file_path = str(payload.get("path", ""))
    if not file_path:
        raise ValueError("'path' is required")
    return email_engine.delete_email(file_path)


COMMANDS = {
    "chat": cmd_chat,
    "chat-status": cmd_chat_status,
    "chat-stream": cmd_chat_stream,
    "emails-list": cmd_emails_list,
    "email-detail": cmd_email_detail,
    "email-create": cmd_email_create,
    "email-update": cmd_email_update,
    "email-delete": cmd_email_delete,
}

# Commands that write their own stdout (NDJSON events) instead of returning
# a single result dict for main() to print as one JSON blob.
STREAMING_COMMANDS = {"chat-stream"}


def main() -> int:
    if len(sys.argv) != 2 or sys.argv[1] not in COMMANDS:
        print(json.dumps({"error": f"Usage: cli.py <{'|'.join(COMMANDS)}>"}))
        return 1
    command = sys.argv[1]
    try:
        result = COMMANDS[command]()
    except email_engine.NotAnEmailError as exc:
        print(json.dumps({"error": str(exc), "error_type": "not_an_email"}))
        return 1
    except FileNotFoundError as exc:
        print(json.dumps({"error": str(exc), "error_type": "not_found"}))
        return 1
    except Exception as exc:  # noqa: BLE001 -- surface any failure as JSON, not a traceback
        print(json.dumps({"error": str(exc)}))
        return 1
    if command not in STREAMING_COMMANDS:
        print(json.dumps(result, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
