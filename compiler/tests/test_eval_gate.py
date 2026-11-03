import json
import math

import eval_gate

BASELINE = {
    "tolerance": 0.02,
    "tolerances": {"loose": 0.10},
    "metrics": {"f1": 0.80, "loose": 0.60},
    "minimums": {"pages": 10},
}


def test_passes_at_or_above_baseline():
    assert eval_gate.compare({"f1": 0.80, "loose": 0.61, "pages": 10}, BASELINE) == []


def test_small_drop_within_tolerance_passes():
    assert eval_gate.compare({"f1": 0.79, "loose": 0.60, "pages": 10}, BASELINE) == []


def test_drop_beyond_tolerance_fails():
    failures = eval_gate.compare({"f1": 0.70, "loose": 0.60, "pages": 10}, BASELINE)
    assert len(failures) == 1 and failures[0].startswith("f1:")


def test_per_metric_tolerance_override():
    assert eval_gate.compare({"f1": 0.80, "loose": 0.52, "pages": 10}, BASELINE) == []
    assert eval_gate.compare({"f1": 0.80, "loose": 0.45, "pages": 10}, BASELINE)


def test_missing_or_nan_metric_fails():
    failures = eval_gate.compare({"loose": 0.60, "pages": 10}, BASELINE)
    assert any(f.startswith("f1:") for f in failures)
    failures = eval_gate.compare({"f1": math.nan, "loose": 0.60, "pages": 10}, BASELINE)
    assert any(f.startswith("f1:") for f in failures)


def test_eval_running_on_too_little_input_fails():
    # The failure mode that hid the groundedness check scoring 0 pages.
    failures = eval_gate.compare({"f1": 0.80, "loose": 0.60, "pages": 0}, BASELINE)
    assert any(f.startswith("pages:") for f in failures)


def test_build_baseline_separates_counts_from_scores():
    baseline = eval_gate.build_baseline({"x.f1": 0.91234, "groundedness.pages": 225.0, "x.gold_pairs": 3.0})
    assert baseline["metrics"] == {"x.f1": 0.9123}
    assert baseline["minimums"] == {"groundedness.pages": 112, "x.gold_pairs": 1}


def test_committed_baseline_is_well_formed():
    baseline = json.loads(eval_gate.BASELINE_PATH.read_text(encoding="utf-8"))
    assert baseline["metrics"] and baseline["minimums"]
    assert all(0 <= v <= 1 for v in baseline["metrics"].values())


class TestMain:
    BASELINE = {"tolerance": 0.02, "metrics": {"a.score": 0.8}, "minimums": {"a.pages": 2}}

    def _setup(self, monkeypatch, tmp_path, current):
        path = tmp_path / "eval_baseline.json"
        path.write_text(json.dumps(self.BASELINE))
        monkeypatch.setattr(eval_gate, "BASELINE_PATH", path)
        monkeypatch.setattr(eval_gate, "collect_metrics", lambda: current)
        return eval_gate, path

    def test_passes_and_prints_every_metric(self, monkeypatch, tmp_path, capsys):
        gate, _ = self._setup(monkeypatch, tmp_path, {"a.score": 0.79, "a.pages": 5.0})
        assert gate.main([]) == 0
        out = capsys.readouterr().out
        assert "a.score" in out and "0.7900" in out
        assert "All offline evals at or above baseline." in out

    def test_fails_listing_each_regression(self, monkeypatch, tmp_path, capsys):
        gate, _ = self._setup(monkeypatch, tmp_path, {"a.score": 0.5, "a.pages": 1.0})
        assert gate.main([]) == 1
        out = capsys.readouterr().out
        assert "EVAL REGRESSIONS:" in out
        assert "a.score: 0.5000 < baseline 0.8000" in out
        assert "a.pages: 1.0 below minimum 2" in out

    def test_update_baseline_rewrites_the_file(self, monkeypatch, tmp_path, capsys):
        gate, path = self._setup(monkeypatch, tmp_path, {"a.score": 0.91234, "retrieval.queries": 40.0})
        assert gate.main(["--update-baseline"]) == 0
        written = json.loads(path.read_text())
        assert written["metrics"] == {"a.score": 0.9123}
        assert written["minimums"] == {"retrieval.queries": 20}


def test_mean_ignores_missing_values():
    assert eval_gate._mean([1.0, None, 3.0]) == 2.0
    assert math.isnan(eval_gate._mean([None]))
