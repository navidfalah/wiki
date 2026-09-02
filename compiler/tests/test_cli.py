import io
import json

import active_learning
import cli


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
