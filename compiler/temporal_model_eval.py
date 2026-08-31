"""Evaluate temporal_model.py's current_claims() against the labeled
dataset's gold trust labels.

current_claims() never reads gold_label — it derives "what's current" purely
from claim dates and `supersedes` edges. This script checks how well that
purely-temporal answer agrees with the hand-labeled GOOD/BAD split
(reusing trust_propagation_eval.py's GOOD={correct,scope_dependent} split
for the same reason: the richer 5-way taxonomy isn't something a binary
"is this claim currently valid" question can be expected to reproduce).

No API key needed — everything here is deterministic date/graph logic.
"""

from __future__ import annotations

from dataclasses import dataclass

from temporal_model import build_dataset_timelines, current_claims
from trust_eval_dataset import ClaimGroup, TrustEvalDataset, load_trust_eval_dataset
from trust_propagation_eval import BAD_LABELS, GOOD_LABELS


@dataclass(frozen=True)
class GroupTemporalReport:
    group_id: str
    precision: float | None
    recall: float | None
    current_ids: frozenset[str]


def evaluate_group(group: ClaimGroup, timeline: dict) -> GroupTemporalReport:
    current_ids = frozenset(c.id for c in current_claims(group, timeline))
    good_ids = {c.id for c in group.claims if c.gold_label in GOOD_LABELS}
    bad_ids = {c.id for c in group.claims if c.gold_label in BAD_LABELS}

    true_positive = len(current_ids & good_ids)
    false_positive = len(current_ids & bad_ids)
    false_negative = len(good_ids - current_ids)

    precision = true_positive / (true_positive + false_positive) if (true_positive + false_positive) else None
    recall = true_positive / (true_positive + false_negative) if (true_positive + false_negative) else None

    return GroupTemporalReport(group.id, precision, recall, current_ids)


def evaluate_dataset(dataset: TrustEvalDataset) -> list[GroupTemporalReport]:
    timelines = build_dataset_timelines(dataset)
    return [evaluate_group(group, timelines[group.id]) for group in dataset.claim_groups]


if __name__ == "__main__":
    dataset = load_trust_eval_dataset()
    for report in evaluate_dataset(dataset):
        p = f"{report.precision:.2f}" if report.precision is not None else "n/a"
        r = f"{report.recall:.2f}" if report.recall is not None else "n/a"
        print(f"{report.group_id:40s} precision={p:>5s} recall={r:>5s}")
