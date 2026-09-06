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
from dataclasses import asdict

import active_learning
import connectors_service
import email_engine
import rag_engine
import trust_eval_dataset
from entity_graph import entity_graph_payload
from trust_eval_dataset import load_trust_eval_dataset


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


def cmd_review_candidates() -> dict:
    """Active-learning review queue (task #9 / active_learning.py): the
    pilot dataset's claim groups, run through trust propagation (task #2)
    and select_review_candidates_for_dataset(), each candidate annotated
    with whatever correction a human already saved for it (if any) so the
    dashboard can show resolved items instead of re-flagging them forever.
    """
    dataset = load_trust_eval_dataset()
    candidates = active_learning.select_review_candidates_for_dataset(dataset.claim_groups)
    corrections_by_claim = {c.claim_id: c for c in active_learning.load_corrections()}
    return {
        "candidates": [
            {**asdict(candidate), "correction": asdict(corrections_by_claim[candidate.claim_id]) if candidate.claim_id in corrections_by_claim else None}
            for candidate in candidates
        ],
        "total": len(candidates),
    }


def cmd_review_corrections_list() -> dict:
    corrections = active_learning.load_corrections()
    return {"corrections": [asdict(c) for c in corrections], "total": len(corrections)}


def cmd_review_correction_save() -> dict:
    payload = _read_stdin_json()
    claim_id = str(payload.get("claim_id", "")).strip()
    group_id = str(payload.get("group_id", "")).strip()
    verdict = str(payload.get("verdict", "")).strip()
    note = str(payload.get("note", "")).strip()
    quote = str(payload.get("quote", ""))
    if not claim_id:
        raise ValueError("'claim_id' is required")
    if not group_id:
        raise ValueError("'group_id' is required")
    if verdict not in active_learning.VERDICTS:
        raise ValueError(f"Unknown verdict {verdict!r}; must be one of {sorted(active_learning.VERDICTS)}")
    correction = active_learning.Correction(claim_id=claim_id, group_id=group_id, verdict=verdict, note=note, quote_excerpt=quote[:200])
    active_learning.save_correction(correction)
    return {"saved": True, "correction": asdict(correction)}


def cmd_entity_graph() -> dict:
    return entity_graph_payload()


def cmd_connectors_catalog() -> dict:
    return {"connectors": connectors_service.catalog()}


def cmd_connectors_oauth_start() -> dict:
    payload = _read_stdin_json()
    connector_id = str(payload.get("connector_id", "")).strip()
    if not connector_id:
        raise ValueError("'connector_id' is required")
    return connectors_service.start_authorization(connector_id)


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
    return connectors_service.complete_authorization(connector_id, code, state, account_label)


def cmd_connectors_imap_connect() -> dict:
    payload = _read_stdin_json()
    account_label = str(payload.get("account_label", "")).strip()
    host = str(payload.get("host", "")).strip()
    password = str(payload.get("password", ""))
    port = int(payload.get("port") or 993)
    mailbox = str(payload.get("mailbox") or "INBOX").strip()
    return connectors_service.connect_imap(account_label, host, password, port=port, mailbox=mailbox)


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
    return {"items": connectors_service.list_items(connector_id, account_label, query=query, limit=limit)}


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
    return connectors_service.import_item(connector_id, account_label, item_id, item_title=item_title)


def cmd_connectors_disconnect() -> dict:
    payload = _read_stdin_json()
    connector_id = str(payload.get("connector_id", "")).strip()
    account_label = str(payload.get("account_label", "")).strip()
    if not connector_id:
        raise ValueError("'connector_id' is required")
    if not account_label:
        raise ValueError("'account_label' is required")
    return connectors_service.disconnect(connector_id, account_label)


COMMANDS = {
    "chat": cmd_chat,
    "chat-status": cmd_chat_status,
    "chat-stream": cmd_chat_stream,
    "emails-list": cmd_emails_list,
    "email-detail": cmd_email_detail,
    "email-create": cmd_email_create,
    "email-update": cmd_email_update,
    "email-delete": cmd_email_delete,
    "review-queue": cmd_review_queue,
    "review-correct": cmd_review_correct,
    "review-candidates": cmd_review_candidates,
    "review-corrections-list": cmd_review_corrections_list,
    "review-correction-save": cmd_review_correction_save,
    "entity-graph": cmd_entity_graph,
    "connectors-catalog": cmd_connectors_catalog,
    "connectors-oauth-start": cmd_connectors_oauth_start,
    "connectors-oauth-callback": cmd_connectors_oauth_callback,
    "connectors-imap-connect": cmd_connectors_imap_connect,
    "connectors-items-list": cmd_connectors_items_list,
    "connectors-item-import": cmd_connectors_item_import,
    "connectors-disconnect": cmd_connectors_disconnect,
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
    except connectors_service.ConnectorNotConnectedError as exc:
        print(json.dumps({"error": str(exc), "error_type": "not_connected"}))
        return 1
    except connectors_service.ConnectorConfigError as exc:
        print(json.dumps({"error": str(exc), "error_type": "not_configured"}))
        return 1
    except Exception as exc:  # noqa: BLE001 -- surface any failure as JSON, not a traceback
        print(json.dumps({"error": str(exc)}))
        return 1
    if command not in STREAMING_COMMANDS:
        print(json.dumps(result, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
