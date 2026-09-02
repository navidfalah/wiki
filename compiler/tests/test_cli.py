import io
import json

import pytest

import active_learning
import cli


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
