"""Tests for pipeline_tracker's per-run persistence and run-index bookkeeping."""

from __future__ import annotations

import json

import pipeline_tracker
from pipeline_tracker import PipelineRun


def _use_tmp_runs_dir(tmp_path, monkeypatch):
    runs_dir = tmp_path / "pipeline_runs"
    monkeypatch.setattr(pipeline_tracker, "RUNS_DIR", runs_dir)
    monkeypatch.setattr(pipeline_tracker, "INDEX_FILE", runs_dir / "index.json")
    return runs_dir


def test_start_creates_run_file_and_index_entry(tmp_path, monkeypatch):
    runs_dir = _use_tmp_runs_dir(tmp_path, monkeypatch)

    run = PipelineRun.start(force=True)

    run_file = runs_dir / f"{run.id}.json"
    assert run_file.is_file()
    saved = json.loads(run_file.read_text())
    assert saved["id"] == run.id
    assert saved["force"] is True
    assert saved["status"] == "running"
    assert saved["steps"] == []

    index = json.loads((runs_dir / "index.json").read_text())
    assert len(index) == 1
    assert index[0]["id"] == run.id
    assert index[0]["status"] == "running"


def test_start_step_then_finish_step_updates_saved_state(tmp_path, monkeypatch):
    runs_dir = _use_tmp_runs_dir(tmp_path, monkeypatch)
    run = PipelineRun.start(force=False)

    run.start_step("extract")
    mid = json.loads((runs_dir / f"{run.id}.json").read_text())
    assert mid["steps"] == [
        {
            "name": "extract",
            "status": "running",
            "started_at": mid["steps"][0]["started_at"],
            "finished_at": None,
            "detail": None,
            "error": None,
            "data": None,
        }
    ]

    run.finish_step("extract", "success", detail="12 files", data={"count": 12})
    saved = json.loads((runs_dir / f"{run.id}.json").read_text())
    step = saved["steps"][0]
    assert step["status"] == "success"
    assert step["detail"] == "12 files"
    assert step["data"] == {"count": 12}
    assert step["finished_at"] is not None


def test_finish_step_on_unknown_step_name_is_noop(tmp_path, monkeypatch):
    _use_tmp_runs_dir(tmp_path, monkeypatch)
    run = PipelineRun.start(force=False)
    run.start_step("extract")

    run.finish_step("nonexistent", "success")

    assert len(run.steps) == 1
    assert run.steps[0]["name"] == "extract"
    assert run.steps[0]["status"] == "running"


def test_multiple_steps_tracked_independently(tmp_path, monkeypatch):
    _use_tmp_runs_dir(tmp_path, monkeypatch)
    run = PipelineRun.start(force=False)

    run.start_step("extract")
    run.finish_step("extract", "success")
    run.start_step("synthesize")
    run.finish_step("synthesize", "failed", error="boom")

    assert [s["name"] for s in run.steps] == ["extract", "synthesize"]
    assert run.steps[0]["status"] == "success"
    assert run.steps[1]["status"] == "failed"
    assert run.steps[1]["error"] == "boom"


def test_set_token_usage_persists(tmp_path, monkeypatch):
    runs_dir = _use_tmp_runs_dir(tmp_path, monkeypatch)
    run = PipelineRun.start(force=False)

    run.set_token_usage([{"model": "gpt-4", "tokens": 100}])

    saved = json.loads((runs_dir / f"{run.id}.json").read_text())
    assert saved["token_usage"] == [{"model": "gpt-4", "tokens": 100}]


def test_finish_updates_status_and_index(tmp_path, monkeypatch):
    runs_dir = _use_tmp_runs_dir(tmp_path, monkeypatch)
    run = PipelineRun.start(force=False)

    run.finish("success")

    saved = json.loads((runs_dir / f"{run.id}.json").read_text())
    assert saved["status"] == "success"
    assert saved["finished_at"] is not None
    assert saved["error"] is None

    index = json.loads((runs_dir / "index.json").read_text())
    assert len(index) == 1
    assert index[0]["status"] == "success"
    assert index[0]["finished_at"] is not None


def test_finish_with_error_records_error(tmp_path, monkeypatch):
    runs_dir = _use_tmp_runs_dir(tmp_path, monkeypatch)
    run = PipelineRun.start(force=False)

    run.finish("failed", error="LLM timed out")

    saved = json.loads((runs_dir / f"{run.id}.json").read_text())
    assert saved["status"] == "failed"
    assert saved["error"] == "LLM timed out"


def test_index_replaces_stale_entry_for_same_run(tmp_path, monkeypatch):
    runs_dir = _use_tmp_runs_dir(tmp_path, monkeypatch)
    run = PipelineRun.start(force=False)

    run.finish("success")

    index = json.loads((runs_dir / "index.json").read_text())
    assert len(index) == 1
    assert index[0]["id"] == run.id
    assert index[0]["status"] == "success"


def test_index_sorts_newest_first(tmp_path, monkeypatch):
    runs_dir = _use_tmp_runs_dir(tmp_path, monkeypatch)

    older = PipelineRun("20260101-000000-aaaaaa", force=False)
    older.started_at = "2026-01-01T00:00:00+00:00"
    older._save()
    older._update_index()

    newer = PipelineRun("20260102-000000-bbbbbb", force=False)
    newer.started_at = "2026-01-02T00:00:00+00:00"
    newer._save()
    newer._update_index()

    index = json.loads((runs_dir / "index.json").read_text())
    assert [e["id"] for e in index] == [newer.id, older.id]


def test_index_trims_to_max_runs_kept(tmp_path, monkeypatch):
    _use_tmp_runs_dir(tmp_path, monkeypatch)
    monkeypatch.setattr(pipeline_tracker, "MAX_RUNS_KEPT", 3)

    for i in range(5):
        run = PipelineRun(f"run-{i}", force=False)
        run.started_at = f"2026-01-0{i + 1}T00:00:00+00:00"
        run._save()
        run._update_index()

    index = json.loads((pipeline_tracker.RUNS_DIR / "index.json").read_text())
    assert len(index) == 3
    assert [e["id"] for e in index] == ["run-4", "run-3", "run-2"]


def test_update_index_recovers_from_corrupt_index_file(tmp_path, monkeypatch):
    runs_dir = _use_tmp_runs_dir(tmp_path, monkeypatch)
    runs_dir.mkdir(parents=True, exist_ok=True)
    (runs_dir / "index.json").write_text("not valid json{{{")

    run = PipelineRun.start(force=False)

    index = json.loads((runs_dir / "index.json").read_text())
    assert len(index) == 1
    assert index[0]["id"] == run.id


def test_to_dict_shape():
    run = PipelineRun("run-x", force=True)
    run.start_step("extract")

    data = run.to_dict()

    assert data["id"] == "run-x"
    assert data["force"] is True
    assert data["status"] == "running"
    assert data["finished_at"] is None
    assert data["error"] is None
    assert len(data["steps"]) == 1
    assert data["token_usage"] == []
