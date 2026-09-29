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

import io
import json
import os
import sys
from dataclasses import asdict

import active_learning
import email_engine
import rag_engine
import synthesizer
import temporal_model
import trust_eval_dataset
from entity_graph import entity_graph_payload


class ConnectorsUnavailableError(RuntimeError):
    pass


def _connectors():
    """Import connectors_service on first use. It pulls in `cryptography`
    (credential encryption), and a broken native install of that package
    used to crash cli.py at import time -- taking down every command,
    including emails, chat and the review queue, not just connectors."""
    try:
        import connectors_service
    except (KeyboardInterrupt, SystemExit):
        raise
    except BaseException as exc:  # noqa: BLE001 -- pyo3's PanicException derives from BaseException
        raise ConnectorsUnavailableError(f"Connectors are unavailable: {type(exc).__name__}: {exc}") from exc
    return connectors_service


def _connector_error_type(exc: BaseException) -> str | None:
    svc = sys.modules.get("connectors_service")
    if svc is None:
        return None
    if isinstance(exc, svc.ConnectorNotConnectedError):
        return "not_connected"
    if isinstance(exc, svc.ConnectorConfigError):
        return "not_configured"
    return None


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
    source = str(payload.get("corpus_source") or "wiki")
    return rag_engine.answer_question(message, history=history, doc_scope=doc_scope, source=source)


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
    source = str(payload.get("corpus_source") or "wiki")
    try:
        if not message:
            raise ValueError("'message' is required")
        for event in rag_engine.answer_question_stream(message, history=history, doc_scope=doc_scope, source=source):
            print(json.dumps(event, ensure_ascii=False), flush=True)
    except Exception as exc:  # noqa: BLE001 -- surface any failure as a stream event
        print(json.dumps({"type": "error", "message": str(exc)}), flush=True)


def cmd_chat_status() -> dict:
    corpus = rag_engine.build_corpus()
    raw_files = synthesizer.discover_raw_source_files()
    return {
        "corpus_pages": len({p.doc_path for p in corpus}),
        "corpus_passages": len(corpus),
        "raw_source_files": len(raw_files),
        "llm_available": rag_engine.LLMClient.for_purpose("chat").available,
    }


def cmd_emails_list() -> dict:
    """Optional input {"include_body": true} adds each email's full body
    text (the cross-corpus search index uses it)."""
    payload = _read_stdin_json()
    return email_engine.list_emails(include_body=bool(payload.get("include_body")))


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


SOURCE_TEXT_MAX_CHARS = 200_000


def cmd_source_text() -> dict:
    """The text of one raw source file as the pipeline extracts it
    (source_text.read_source_text): parsed .eml body, PDF/DOCX/XLSX/PPTX
    text, a ZIP's listing and small text members. Input {"path": "<relative
    to data/raw>"}. Lets API clients such as the MCP server read sources the
    raw-file endpoint only offers as a download."""
    from models import RAW_DIR
    from source_text import read_source_text

    payload = _read_stdin_json()
    rel = str(payload.get("path", "")).strip()
    if not rel:
        raise ValueError("'path' is required")
    raw_dir = RAW_DIR.resolve()
    candidate = (raw_dir / rel).resolve()
    # is_relative_to, not a string prefix: "raw" is a prefix of a sibling "raw_old".
    if not candidate.is_relative_to(raw_dir) or candidate == raw_dir:
        raise ValueError("Path escapes data/raw/")
    if not candidate.is_file():
        raise FileNotFoundError(f"Raw file not found: {rel}")
    text = read_source_text(candidate)
    return {
        "path": candidate.relative_to(raw_dir).as_posix(),
        "text": text[:SOURCE_TEXT_MAX_CHARS],
        "chars": len(text),
        "truncated": len(text) > SOURCE_TEXT_MAX_CHARS,
    }


def cmd_review_queue() -> dict:
    """Active-learning review queue (active_learning.py, task #9): claims
    trust_propagation.py scored as low-confidence or an unresolved
    contradiction, run against data/trust_eval_dataset.json -- the same
    pilot dataset select_review_candidates_for_dataset() is demonstrated on
    in documentation/29-active-learning.md. Merges in any correction a
    human already recorded, so a re-opened queue shows what's been handled.
    """
    dataset = trust_eval_dataset.load_trust_eval_dataset()
    claims_by_id = {claim.id: claim for group in dataset.claim_groups for claim in group.claims}
    candidates = active_learning.select_review_candidates_for_dataset(dataset.claim_groups)
    corrections_by_claim = {c.claim_id: asdict(c) for c in active_learning.load_corrections()}

    items = []
    for candidate in candidates:
        claim = claims_by_id.get(candidate.claim_id)
        items.append(
            {
                **asdict(candidate),
                "source_type": claim.source_type if claim else None,
                "date": claim.date if claim else None,
                "correction": corrections_by_claim.get(candidate.claim_id),
            }
        )
    return {"candidates": items, "verdicts": sorted(active_learning.VERDICTS)}


def cmd_review_correct() -> dict:
    payload = _read_stdin_json()
    claim_id = str(payload.get("claim_id", "")).strip()
    group_id = str(payload.get("group_id", "")).strip()
    verdict = str(payload.get("verdict", "")).strip()
    note = str(payload.get("note", "")).strip()
    quote = str(payload.get("quote", ""))
    if not claim_id or not group_id:
        raise ValueError("'claim_id' and 'group_id' are required")
    correction = active_learning.Correction(
        claim_id=claim_id,
        group_id=group_id,
        verdict=verdict,
        note=note,
        quote_excerpt=quote[:200],
    )
    active_learning.save_correction(correction)
    return {"saved": asdict(correction)}


def cmd_entity_graph() -> dict:
    return entity_graph_payload()


def cmd_temporal_facts() -> dict:
    """Read-only bi-temporal view of the claim graph (temporal_model.py,
    documentation/27-temporal-modeling.md): for every claim group, when
    each claim was valid and which ones are still current -- derived
    purely from each claim's `date` field and the group's `supersedes`
    edges, no gold_label involved. Same "run against the live
    data/trust_eval_dataset.json" posture as cmd_review_queue().
    """
    dataset = trust_eval_dataset.load_trust_eval_dataset()
    groups = []
    for group in dataset.claim_groups:
        timeline = temporal_model.build_group_timeline(group)
        claims_by_id = {claim.id: claim for claim in group.claims}
        facts = [
            {
                "claim_id": claim_id,
                "value": claims_by_id[claim_id].value,
                "source_path": claims_by_id[claim_id].source_path,
                "date": claims_by_id[claim_id].date,
                "valid_from": fact.valid_from.isoformat() if fact.valid_from else None,
                "valid_until": fact.valid_until.isoformat() if fact.valid_until else None,
                "is_current": fact.is_current,
            }
            for claim_id, fact in timeline.items()
        ]
        facts.sort(key=lambda f: (f["valid_from"] is None, f["valid_from"] or "", f["claim_id"]))
        groups.append(
            {
                "group_id": group.id,
                "domain": group.domain,
                "subject": group.subject,
                "facts": facts,
            }
        )
    return {"groups": groups}


def cmd_connectors_catalog() -> dict:
    return {"connectors": _connectors().catalog()}


def cmd_connectors_oauth_start() -> dict:
    payload = _read_stdin_json()
    connector_id = str(payload.get("connector_id", "")).strip()
    if not connector_id:
        raise ValueError("'connector_id' is required")
    return _connectors().start_authorization(connector_id)


def cmd_connectors_oauth_callback() -> dict:
    payload = _read_stdin_json()
    connector_id = str(payload.get("connector_id", "")).strip()
    code = str(payload.get("code", "")).strip()
    state = str(payload.get("state", "")).strip()
    account_label = str(payload.get("account_label", "")).strip()
    if not connector_id:
        raise ValueError("'connector_id' is required")
    if not code:
        raise ValueError("'code' is required")
    if not state:
        raise ValueError("'state' is required")
    return _connectors().complete_authorization(connector_id, code, state, account_label)


def cmd_connectors_imap_connect() -> dict:
    payload = _read_stdin_json()
    account_label = str(payload.get("account_label", "")).strip()
    host = str(payload.get("host", "")).strip()
    password = str(payload.get("password", ""))
    port = int(payload.get("port") or 993)
    mailbox = str(payload.get("mailbox") or "INBOX").strip()
    return _connectors().connect_imap(account_label, host, password, port=port, mailbox=mailbox)


def cmd_connectors_postgres_connect() -> dict:
    payload = _read_stdin_json()
    account_label = str(payload.get("account_label", "")).strip()
    host = str(payload.get("host", "")).strip()
    password = str(payload.get("password", ""))
    port = int(payload.get("port") or 5432)
    dbname = str(payload.get("dbname", "")).strip()
    user = str(payload.get("user", "")).strip()
    schema = str(payload.get("schema") or "public").strip()
    return _connectors().connect_postgres(account_label, host, password, port=port, dbname=dbname, user=user, schema=schema)


def cmd_connectors_sqlite_connect() -> dict:
    payload = _read_stdin_json()
    account_label = str(payload.get("account_label", "")).strip()
    db_path = str(payload.get("db_path", "")).strip()
    return _connectors().connect_sqlite(account_label, db_path)


def cmd_connectors_ensure_defaults() -> dict:
    return _connectors().ensure_default_connections()


def cmd_connectors_items_list() -> dict:
    payload = _read_stdin_json()
    connector_id = str(payload.get("connector_id", "")).strip()
    account_label = str(payload.get("account_label", "")).strip()
    query = str(payload.get("query", ""))
    limit = int(payload.get("limit") or 20)
    if not connector_id:
        raise ValueError("'connector_id' is required")
    if not account_label:
        raise ValueError("'account_label' is required")
    return {"items": _connectors().list_items(connector_id, account_label, query=query, limit=limit)}


def cmd_connectors_item_import() -> dict:
    payload = _read_stdin_json()
    connector_id = str(payload.get("connector_id", "")).strip()
    account_label = str(payload.get("account_label", "")).strip()
    item_id = str(payload.get("item_id", "")).strip()
    item_title = str(payload.get("item_title", ""))
    if not connector_id:
        raise ValueError("'connector_id' is required")
    if not account_label:
        raise ValueError("'account_label' is required")
    if not item_id:
        raise ValueError("'item_id' is required")
    return _connectors().import_item(connector_id, account_label, item_id, item_title=item_title)


def cmd_connectors_disconnect() -> dict:
    payload = _read_stdin_json()
    connector_id = str(payload.get("connector_id", "")).strip()
    account_label = str(payload.get("account_label", "")).strip()
    if not connector_id:
        raise ValueError("'connector_id' is required")
    if not account_label:
        raise ValueError("'account_label' is required")
    return _connectors().disconnect(connector_id, account_label)


COMMANDS = {
    "chat": cmd_chat,
    "chat-status": cmd_chat_status,
    "chat-stream": cmd_chat_stream,
    "emails-list": cmd_emails_list,
    "source-text": cmd_source_text,
    "email-detail": cmd_email_detail,
    "email-create": cmd_email_create,
    "email-update": cmd_email_update,
    "email-delete": cmd_email_delete,
    "review-queue": cmd_review_queue,
    "review-correct": cmd_review_correct,
    "entity-graph": cmd_entity_graph,
    "temporal-facts": cmd_temporal_facts,
    "connectors-catalog": cmd_connectors_catalog,
    "connectors-oauth-start": cmd_connectors_oauth_start,
    "connectors-oauth-callback": cmd_connectors_oauth_callback,
    "connectors-imap-connect": cmd_connectors_imap_connect,
    "connectors-postgres-connect": cmd_connectors_postgres_connect,
    "connectors-sqlite-connect": cmd_connectors_sqlite_connect,
    "connectors-ensure-defaults": cmd_connectors_ensure_defaults,
    "connectors-items-list": cmd_connectors_items_list,
    "connectors-item-import": cmd_connectors_item_import,
    "connectors-disconnect": cmd_connectors_disconnect,
}

# Commands that write their own stdout (NDJSON events) instead of returning
# a single result dict for main() to print as one JSON blob.
STREAMING_COMMANDS = {"chat-stream"}


def _run_command(command: str) -> tuple[dict, int]:
    """Run one command; returns (payload, exit code). Shared by the one-shot
    and --serve modes so both report errors identically."""
    try:
        return COMMANDS[command](), 0
    except email_engine.NotAnEmailError as exc:
        return {"error": str(exc), "error_type": "not_an_email"}, 1
    except FileNotFoundError as exc:
        return {"error": str(exc), "error_type": "not_found"}, 1
    except Exception as exc:  # noqa: BLE001 -- surface any failure as JSON, not a traceback
        error_type = _connector_error_type(exc)
        return {"error": str(exc), **({"error_type": error_type} if error_type else {})}, 1


def serve() -> int:
    """Long-lived worker for backend/src/lib/pythonWorker.ts: one JSON request
    per stdin line ({"id", "command", "input", "env"}), one JSON response per
    line ({"id", "code", "payload"}). Saves the ~0.6 s of imports every
    one-shot `cli.py <command>` pays.

    - `env` holds the backend's per-request LLM settings; they are applied for
      that request only and then restored.
    - The response channel is a private duplicate of the original stdout;
      fd 1 itself is pointed at stderr, so a stray print() or a C extension
      writing to stdout can't corrupt the protocol.
    - A BaseException (e.g. pyo3's PanicException) is reported and ends the
      worker, so the backend restarts a clean process.
    """
    protocol = os.fdopen(os.dup(1), "w", buffering=1, encoding="utf-8")
    os.dup2(2, 1)
    sys.stdout = sys.stderr
    requests = sys.stdin

    def respond(request_id, code: int, payload: dict) -> None:
        try:
            line = json.dumps({"id": request_id, "code": code, "payload": payload}, ensure_ascii=False)
        except (TypeError, ValueError) as exc:
            line = json.dumps({"id": request_id, "code": 1, "payload": {"error": f"Unserializable result: {exc}"}})
        protocol.write(line + "\n")

    for line in requests:
        if not line.strip():
            continue
        try:
            request = json.loads(line)
            request_id = request.get("id")
            command = request["command"]
        except (ValueError, KeyError, AttributeError) as exc:
            respond(None, 1, {"error": f"Bad worker request: {exc}"})
            continue
        if command not in COMMANDS or command in STREAMING_COMMANDS:
            respond(request_id, 1, {"error": f"Unsupported worker command: {command}"})
            continue

        env = {str(k): str(v) for k, v in (request.get("env") or {}).items()}
        saved = {k: os.environ.get(k) for k in env}
        os.environ.update(env)
        sys.stdin = io.StringIO("" if request.get("input") is None else json.dumps(request["input"]))
        try:
            payload, code = _run_command(command)
        except (KeyboardInterrupt, SystemExit):
            raise
        except BaseException as exc:  # noqa: BLE001 -- report, then exit so the backend restarts us clean
            respond(request_id, 1, {"error": f"Worker crashed: {type(exc).__name__}: {exc}"})
            return 1
        finally:
            sys.stdin = requests
            for key, value in saved.items():
                if value is None:
                    os.environ.pop(key, None)
                else:
                    os.environ[key] = value
        respond(request_id, code, payload)
    return 0


def main() -> int:
    if sys.argv[1:] == ["--serve"]:
        return serve()
    if len(sys.argv) != 2 or sys.argv[1] not in COMMANDS:
        print(json.dumps({"error": f"Usage: cli.py <{'|'.join(COMMANDS)}> | --serve"}))
        return 1
    command = sys.argv[1]
    payload, code = _run_command(command)
    if code != 0 or command not in STREAMING_COMMANDS:
        print(json.dumps(payload, ensure_ascii=False))
    return code


if __name__ == "__main__":
    raise SystemExit(main())
