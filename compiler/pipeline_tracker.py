"""Persists compiler pipeline run status, step by step, to data/pipeline_runs/.

One JSON file per run (data/pipeline_runs/<run_id>.json), rewritten after
every step so a run's current state is always on disk while it's in
progress -- not just once it finishes. data/pipeline_runs/index.json holds
a lightweight, newest-first summary of the last MAX_RUNS_KEPT runs for
fast listing without reading every run file.
"""

from __future__ import annotations

import json
import uuid
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

PROJECT_ROOT = Path(__file__).resolve().parent.parent
RUNS_DIR = PROJECT_ROOT / "data" / "pipeline_runs"
INDEX_FILE = RUNS_DIR / "index.json"
MAX_RUNS_KEPT = 100


def _utc_now_iso() -> str:
    return datetime.now(UTC).isoformat()


def _atomic_write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(data, indent=2))
    tmp.replace(path)


class PipelineRun:
    """Tracks one compiler run's steps and persists after every change."""

    def __init__(self, run_id: str, *, force: bool) -> None:
        self.id = run_id
        self.force = force
        self.started_at = _utc_now_iso()
        self.finished_at: str | None = None
        self.status = "running"
        self.error: str | None = None
        self.steps: list[dict[str, Any]] = []
        self.token_usage: list[dict[str, Any]] = []
        self._step_index: dict[str, int] = {}

    @classmethod
    def start(cls, *, force: bool) -> "PipelineRun":
        run_id = f"{datetime.now(UTC).strftime('%Y%m%d-%H%M%S')}-{uuid.uuid4().hex[:6]}"
        run = cls(run_id, force=force)
        run._save()
        run._update_index()
        return run

    def start_step(self, name: str) -> None:
        self._step_index[name] = len(self.steps)
        self.steps.append(
            {
                "name": name,
                "status": "running",
                "started_at": _utc_now_iso(),
                "finished_at": None,
                "detail": None,
                "error": None,
                "data": None,
            }
        )
        self._save()

    def finish_step(
        self,
        name: str,
        status: str,
        *,
        detail: str | None = None,
        error: str | None = None,
        data: dict[str, Any] | None = None,
    ) -> None:
        """``data`` is the step's actual input/output (file lists, topic
        names, etc.), shown expanded on the Pipelines page -- ``detail`` stays
        the one-line summary already used for the collapsed row and the CLI.
        """
        idx = self._step_index.get(name)
        if idx is None:
            return
        step = self.steps[idx]
        step["status"] = status
        step["finished_at"] = _utc_now_iso()
        step["detail"] = detail
        step["error"] = error
        step["data"] = data
        self._save()

    def set_token_usage(self, usage: list[dict[str, Any]]) -> None:
        self.token_usage = usage
        self._save()

    def finish(self, status: str, *, error: str | None = None) -> None:
        self.status = status
        self.error = error
        self.finished_at = _utc_now_iso()
        self._save()
        self._update_index()

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "force": self.force,
            "started_at": self.started_at,
            "finished_at": self.finished_at,
            "status": self.status,
            "error": self.error,
            "steps": self.steps,
            "token_usage": self.token_usage,
        }

    def _save(self) -> None:
        _atomic_write_json(RUNS_DIR / f"{self.id}.json", self.to_dict())

    def _update_index(self) -> None:
        entries: list[dict[str, Any]] = []
        if INDEX_FILE.exists():
            try:
                entries = json.loads(INDEX_FILE.read_text())
            except (json.JSONDecodeError, OSError):
                entries = []
        entries = [e for e in entries if e.get("id") != self.id]
        entries.append(
            {
                "id": self.id,
                "started_at": self.started_at,
                "finished_at": self.finished_at,
                "status": self.status,
                "force": self.force,
            }
        )
        entries.sort(key=lambda e: e["started_at"], reverse=True)
        entries = entries[:MAX_RUNS_KEPT]
        _atomic_write_json(INDEX_FILE, entries)
