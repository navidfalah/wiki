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
