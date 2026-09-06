import io
import json

import pytest

import active_learning
import cli
import connectors_service
from connectors.credential_store import CredentialStore, generate_secret_key


def test_review_queue_runs_end_to_end_on_the_real_pilot_dataset(monkeypatch, tmp_path):
    monkeypatch.setattr(active_learning, "CORRECTIONS_PATH", tmp_path / "review_corrections.json")

    result = cli.cmd_review_queue()

    assert result["candidates"]  # the pilot dataset has real disputes
    assert set(result["verdicts"]) == active_learning.VERDICTS
    first = result["candidates"][0]
    assert {"claim_id", "group_id", "reason", "score", "quote", "source_path", "correction"} <= first.keys()
    assert first["correction"] is None  # nothing recorded yet


def test_review_queue_merges_in_an_existing_correction(monkeypatch, tmp_path):
    corrections_path = tmp_path / "review_corrections.json"
    monkeypatch.setattr(active_learning, "CORRECTIONS_PATH", corrections_path)

    queue = cli.cmd_review_queue()
    target = queue["candidates"][0]
    active_learning.save_correction(
        active_learning.Correction(
            claim_id=target["claim_id"],
            group_id=target["group_id"],
            verdict="confirm_superseded",
            note="handled",
            quote_excerpt=target["quote"][:200],
        )
    )

    refreshed = cli.cmd_review_queue()
    matching = next(c for c in refreshed["candidates"] if c["claim_id"] == target["claim_id"])
    assert matching["correction"]["verdict"] == "confirm_superseded"
    assert matching["correction"]["note"] == "handled"


def test_review_correct_saves_a_correction(monkeypatch, tmp_path):
    corrections_path = tmp_path / "review_corrections.json"
    monkeypatch.setattr(active_learning, "CORRECTIONS_PATH", corrections_path)
    monkeypatch.setattr(
        "sys.stdin",
        io.StringIO(
            json.dumps(
                {
                    "claim_id": "nri-1",
                    "group_id": "nova_read_interval",
                    "verdict": "confirm_superseded",
                    "note": "fixed in firmware 2.1",
                    "quote": "the old hourly claim",
                }
            )
        ),
    )

    result = cli.cmd_review_correct()

    assert result["saved"]["claim_id"] == "nri-1"
    assert result["saved"]["verdict"] == "confirm_superseded"
    loaded = active_learning.load_corrections(corrections_path)
    assert len(loaded) == 1
    assert loaded[0].note == "fixed in firmware 2.1"


def test_review_correct_requires_claim_id_and_group_id(monkeypatch):
    monkeypatch.setattr("sys.stdin", io.StringIO(json.dumps({"verdict": "confirm_correct"})))
    with pytest.raises(ValueError, match="claim_id"):
        cli.cmd_review_correct()


def test_review_correct_rejects_unknown_verdict(monkeypatch, tmp_path):
    monkeypatch.setattr(active_learning, "CORRECTIONS_PATH", tmp_path / "review_corrections.json")
    monkeypatch.setattr(
        "sys.stdin",
        io.StringIO(json.dumps({"claim_id": "a", "group_id": "g", "verdict": "nonsense", "note": "x"})),
    )
    with pytest.raises(ValueError, match="Unknown verdict"):
        cli.cmd_review_correct()


def test_main_reports_unknown_verdict_as_a_json_error(monkeypatch, tmp_path, capsys):
    monkeypatch.setattr(active_learning, "CORRECTIONS_PATH", tmp_path / "review_corrections.json")
    monkeypatch.setattr("sys.argv", ["cli.py", "review-correct"])
    monkeypatch.setattr(
        "sys.stdin",
        io.StringIO(json.dumps({"claim_id": "a", "group_id": "g", "verdict": "nonsense", "note": "x"})),
    )

    exit_code = cli.main()

    assert exit_code == 1
    assert json.loads(capsys.readouterr().out) == {"error": "Unknown verdict 'nonsense'; must be one of ['confirm_correct', 'confirm_incorrect', 'confirm_scope_dependent', 'confirm_superseded']"}


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


def test_entity_graph_reflects_the_real_state_file():
    result = cli.cmd_entity_graph()
    assert "entities" in result
    assert "counts" in result
    assert result["counts"]["total_entities"] == len(result["entities"])


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
