"""Offline eval regression gate.

Runs every evaluation that needs no API key, collects its headline metrics,
and compares them with the committed baseline in eval_baseline.json. Exits
non-zero when a metric drops beyond the tolerance, or when an eval silently
ran on nothing. That second case is what hid the offline groundedness check
scoring 0 pages after the compiler's sources-section format changed.

    python eval_gate.py                    # check against the baseline (CI)
    python eval_gate.py --update-baseline  # accept the current numbers

LLM-judged evals (hybrid retrieval tiers, the extraction critic, generated-
answer faithfulness) are not run here: they need an API key and are not
deterministic.
"""

from __future__ import annotations

import argparse
import json
import math
import sys
import tempfile
from pathlib import Path

BASELINE_PATH = Path(__file__).with_name("eval_baseline.json")
DEFAULT_TOLERANCE = 0.02


def _mean(values: list[float | None]) -> float:
    present = [v for v in values if v is not None]
    return sum(present) / len(present) if present else float("nan")


def collect_metrics() -> dict[str, float]:
    import entity_resolution_eval
    import faithfulness_eval
    import faithfulness_heuristic
    import pii_redaction_eval
    import retrieval_eval
    import temporal_model_eval
    import trust_propagation_eval
    from retrieval_eval_dataset import QUERIES
    from trust_eval_dataset import load_trust_eval_dataset

    metrics: dict[str, float] = {}

    # Only the tiers/configs the live system uses are gated -- legacy TF-IDF and
    # the static trust baseline are comparison points, not the system.
    bm25 = next(t for t in retrieval_eval.evaluate_no_api_tiers() if t.name == "bm25")
    metrics["retrieval.bm25.recall_at_5"] = bm25.mean_recall_at_5
    metrics["retrieval.bm25.ndcg_at_5"] = bm25.mean_ndcg_at_5
    metrics["retrieval.queries"] = len(QUERIES)

    er = entity_resolution_eval.run_eval()
    metrics["entity_resolution.heuristic.precision"] = er.precision
    metrics["entity_resolution.heuristic.recall"] = er.recall
    metrics["entity_resolution.heuristic.f1"] = er.f1
    metrics["entity_resolution.gold_pairs"] = er.gold_pairs

    dataset = load_trust_eval_dataset()
    trust = trust_propagation_eval.run_ablation(dataset)["full_default"]
    metrics["trust.full_default.precision_at_1"] = trust.mean_precision_at_1
    metrics["trust.full_default.pairwise_accuracy"] = trust.pooled_pairwise_accuracy
    metrics["trust.claim_groups"] = len(dataset.claim_groups)

    pii = pii_redaction_eval.run_eval()
    metrics["pii.precision"] = pii.precision
    metrics["pii.recall"] = pii.recall
    metrics["pii.true_positives"] = pii.true_positives

    temporal = temporal_model_eval.evaluate_dataset(dataset)
    metrics["temporal.mean_precision"] = _mean([r.precision for r in temporal])
    metrics["temporal.mean_recall"] = _mean([r.recall for r in temporal])

    with tempfile.TemporaryDirectory() as tmp:
        docs_dir = Path(tmp)
        for group in dataset.claim_groups:
            body = "\n\n".join(f"## {claim.id}\n\n{claim.quote}" for claim in group.claims)
            (docs_dir / f"{group.id}.md").write_text(f"---\ntitle: {group.subject}\n---\n\n{body}\n", encoding="utf-8")
        extractive = faithfulness_eval.evaluate_extractive_faithfulness([q.text for q in QUERIES], docs_dir)
    metrics["faithfulness.extractive.verbatim_rate"] = extractive.verbatim_rate
    metrics["faithfulness.extractive.answers"] = extractive.total

    grounded = faithfulness_heuristic.check_corpus_groundedness()
    checkable = sum(r.report.checkable_count for r in grounded)
    unsupported = sum(len(r.report.unsupported) for r in grounded)
    metrics["groundedness.pages"] = len(grounded)
    metrics["groundedness.checkable_sentences"] = checkable
    metrics["groundedness.supported_rate"] = 1 - unsupported / checkable if checkable else float("nan")

    return {k: float(v) if v is not None else float("nan") for k, v in metrics.items()}


def compare(current: dict[str, float], baseline: dict) -> list[str]:
    """Return human-readable failures (empty list = pass).

    Baseline format: {"tolerance": 0.02, "tolerances": {name: override},
    "metrics": {name: value}, "minimums": {name: value}}. Every baseline
    metric is higher-is-better; a count belongs in "minimums" (a floor,
    e.g. pages > 0), not "metrics".
    """
    default_tolerance = baseline.get("tolerance", DEFAULT_TOLERANCE)
    overrides = baseline.get("tolerances", {})
    failures = []
    for name, expected in baseline.get("metrics", {}).items():
        tolerance = overrides.get(name, default_tolerance)
        actual = current.get(name)
        if actual is None or math.isnan(actual):
            failures.append(f"{name}: missing or NaN (baseline {expected:.4f})")
        elif actual < expected - tolerance:
            failures.append(f"{name}: {actual:.4f} < baseline {expected:.4f} - {tolerance}")
    for name, floor in baseline.get("minimums", {}).items():
        actual = current.get(name)
        if actual is None or math.isnan(actual) or actual < floor:
            failures.append(f"{name}: {actual} below minimum {floor} (eval ran on too little input?)")
    return failures


def build_baseline(current: dict[str, float], tolerance: float = DEFAULT_TOLERANCE) -> dict:
    counts = {k for k in current if k.endswith((".queries", ".gold_pairs", ".claim_groups", ".true_positives", ".answers", ".pages", ".checkable_sentences"))}
    return {
        "tolerance": tolerance,
        # Measured over the committed wiki pages, which legitimately change on
        # every recompile -- only a large drop should fail CI.
        "tolerances": {"groundedness.supported_rate": 0.10},
        "metrics": {k: round(v, 4) for k, v in sorted(current.items()) if k not in counts and not math.isnan(v)},
        # Floors at half the current count: tolerant of corpus edits, but
        # catches an eval that suddenly runs on (almost) nothing.
        "minimums": {k: max(1, math.floor(v / 2)) for k, v in sorted(current.items()) if k in counts},
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--update-baseline", action="store_true", help="write the current metrics as the new baseline")
    args = parser.parse_args(argv)

    current = collect_metrics()
    for name, value in sorted(current.items()):
        print(f"{name:55s} {value:.4f}")

    if args.update_baseline:
        BASELINE_PATH.write_text(json.dumps(build_baseline(current), indent=2) + "\n", encoding="utf-8")
        print(f"\nWrote {BASELINE_PATH.name}")
        return 0

    failures = compare(current, json.loads(BASELINE_PATH.read_text(encoding="utf-8")))
    if failures:
        print("\nEVAL REGRESSIONS:")
        for failure in failures:
            print(f"  - {failure}")
        return 1
    print("\nAll offline evals at or above baseline.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
