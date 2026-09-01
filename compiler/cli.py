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
    return rag_engine.answer_question(message, history=history)


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


COMMANDS = {
    "chat": cmd_chat,
    "chat-status": cmd_chat_status,
    "emails-list": cmd_emails_list,
    "email-detail": cmd_email_detail,
}


def main() -> int:
    if len(sys.argv) != 2 or sys.argv[1] not in COMMANDS:
        print(json.dumps({"error": f"Usage: cli.py <{'|'.join(COMMANDS)}>"}))
        return 1
    try:
        result = COMMANDS[sys.argv[1]]()
    except email_engine.NotAnEmailError as exc:
        print(json.dumps({"error": str(exc), "error_type": "not_an_email"}))
        return 1
    except FileNotFoundError as exc:
        print(json.dumps({"error": str(exc), "error_type": "not_found"}))
        return 1
    except Exception as exc:  # noqa: BLE001 -- surface any failure as JSON, not a traceback
        print(json.dumps({"error": str(exc)}))
        return 1
    print(json.dumps(result, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
