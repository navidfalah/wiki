import io
import json

import active_learning
import cli
import connectors_service
from connectors.credential_store import CredentialStore, generate_secret_key


def _stdin(monkeypatch, payload: dict) -> None:
    monkeypatch.setattr(cli.sys, "stdin", io.StringIO(json.dumps(payload)))


def test_review_candidates_runs_end_to_end_on_the_real_dataset():
    result = cli.cmd_review_candidates()
    assert result["total"] == len(result["candidates"])
    assert result["total"] > 0
    for candidate in result["candidates"]:
        assert candidate["reason"] in ("low_confidence", "unresolved_contradiction")
        assert candidate["correction"] is None


def test_review_correction_save_and_list_round_trip(tmp_path, monkeypatch):
    monkeypatch.setattr(active_learning, "CORRECTIONS_PATH", tmp_path / "review_corrections.json")
    _stdin(
        monkeypatch,
        {
            "claim_id": "nri-1",
            "group_id": "nova_read_interval",
            "verdict": "confirm_superseded",
            "note": "fixed in the changelog",
            "quote": "the hourly claim",
        },
    )
    saved = cli.cmd_review_correction_save()
    assert saved["saved"] is True
    assert saved["correction"]["claim_id"] == "nri-1"
    assert saved["correction"]["verdict"] == "confirm_superseded"

    listed = cli.cmd_review_corrections_list()
    assert listed["total"] == 1
    assert listed["corrections"][0]["claim_id"] == "nri-1"


def test_review_correction_save_rejects_unknown_verdict(tmp_path, monkeypatch):
    monkeypatch.setattr(active_learning, "CORRECTIONS_PATH", tmp_path / "review_corrections.json")
    _stdin(monkeypatch, {"claim_id": "a", "group_id": "g", "verdict": "nonsense", "note": "", "quote": ""})
    try:
        cli.cmd_review_correction_save()
        assert False, "expected ValueError"
    except ValueError as exc:
        assert "Unknown verdict" in str(exc)


def test_review_correction_save_requires_claim_id(monkeypatch):
    _stdin(monkeypatch, {})
    try:
        cli.cmd_review_correction_save()
        assert False, "expected ValueError"
    except ValueError as exc:
        assert "claim_id" in str(exc)


def test_review_candidates_reflects_saved_corrections(tmp_path, monkeypatch):
    monkeypatch.setattr(active_learning, "CORRECTIONS_PATH", tmp_path / "review_corrections.json")

    first = cli.cmd_review_candidates()
    some_claim = first["candidates"][0]
    active_learning.save_correction(
        active_learning.Correction(
            claim_id=some_claim["claim_id"],
            group_id=some_claim["group_id"],
            verdict="confirm_correct",
            note="checked",
            quote_excerpt=some_claim["quote"][:200],
        )
    )

    second = cli.cmd_review_candidates()
    annotated = next(c for c in second["candidates"] if c["claim_id"] == some_claim["claim_id"])
    assert annotated["correction"] is not None
    assert annotated["correction"]["verdict"] == "confirm_correct"


def _isolate_connectors(tmp_path, monkeypatch):
    store = CredentialStore(store_dir=tmp_path / "store", secret_key=generate_secret_key())
    monkeypatch.setattr(connectors_service, "_credential_store", lambda: store)
    monkeypatch.setattr(connectors_service, "PENDING_DIR", tmp_path / "pending")
    monkeypatch.setattr(connectors_service, "IMPORT_DIR", tmp_path / "raw" / "connectors")
    return store


def test_connectors_catalog_lists_the_known_connectors(tmp_path, monkeypatch):
    _isolate_connectors(tmp_path, monkeypatch)
    result = cli.cmd_connectors_catalog()
    assert [c["id"] for c in result["connectors"]] == ["gmail", "google_drive", "imap"]


def test_connectors_oauth_start_requires_connector_id(monkeypatch):
    _stdin(monkeypatch, {})
    try:
        cli.cmd_connectors_oauth_start()
        assert False, "expected ValueError"
    except ValueError as exc:
        assert "connector_id" in str(exc)


def test_connectors_oauth_start_reports_missing_config(tmp_path, monkeypatch):
    _isolate_connectors(tmp_path, monkeypatch)
    for var in ("GMAIL_CLIENT_ID", "GMAIL_CLIENT_SECRET", "GMAIL_REDIRECT_URI"):
        monkeypatch.delenv(var, raising=False)
    _stdin(monkeypatch, {"connector_id": "gmail"})
    try:
        cli.cmd_connectors_oauth_start()
        assert False, "expected ConnectorConfigError"
    except connectors_service.ConnectorConfigError:
        pass


def test_connectors_imap_connect_and_disconnect_round_trip(tmp_path, monkeypatch):
    _isolate_connectors(tmp_path, monkeypatch)
    _stdin(monkeypatch, {"account_label": "me@example.com", "host": "imap.example.com", "password": "app-pw"})
    connected = cli.cmd_connectors_imap_connect()
    assert connected["connected"] is True

    _stdin(monkeypatch, {"connector_id": "imap", "account_label": "me@example.com"})
    disconnected = cli.cmd_connectors_disconnect()
    assert disconnected["disconnected"] is True


def test_connectors_items_list_reports_not_connected(tmp_path, monkeypatch):
    _isolate_connectors(tmp_path, monkeypatch)
    _stdin(monkeypatch, {"connector_id": "imap", "account_label": "nobody@example.com"})
    try:
        cli.cmd_connectors_items_list()
        assert False, "expected ConnectorNotConnectedError"
    except connectors_service.ConnectorNotConnectedError:
        pass
