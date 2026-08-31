"""Tooling for a task-based user study: wiki+chat vs. plain-text search.

This module is the *instrument* for task #12 — the tasks, the
counterbalanced assignment generator, trial recording, and summary
statistics — not a claim that a study was run. It cannot be: running one
means recruiting real participants and having them interact with a live
system, neither of which this environment can do. Fabricating trial data
to produce a nicer-looking result would be a much worse failure than
leaving this gap named plainly, so: no synthetic "results" ship here, and
none should ever be added except from a real session.
data/user_study_results.json is created only once real trials exist (and
is gitignored, like data/state.json — session-specific runtime output, not
shipped content).

Study design: within-subjects, counterbalanced. Every participant does
every task under both conditions (condition = "wiki_chat" or
"plain_search"); task order and condition order are counterbalanced across
participants to control for learning/fatigue effects, via
generate_counterbalanced_design().

Tasks are the same 8 hand-labeled, grounded fact-finding questions
retrieval_eval_dataset.py already uses to evaluate retrieval quality
(task #5) — reused rather than invented, so "does a person find the answer
faster/more accurately with the wiki+chat system" is asked about the exact
same real, verified facts "does the retrieval system rank the right
passage" was already asked about.
"""

from __future__ import annotations

import json
import random
from dataclasses import asdict, dataclass, field
from datetime import UTC, datetime
from pathlib import Path

from models import PROJECT_ROOT
from retrieval_eval_dataset import QUERIES

RESULTS_PATH = PROJECT_ROOT / "data" / "user_study_results.json"

WIKI_CHAT = "wiki_chat"
PLAIN_SEARCH = "plain_search"
CONDITIONS = (WIKI_CHAT, PLAIN_SEARCH)


@dataclass(frozen=True)
class StudyTask:
    id: str
    query: str


STUDY_TASKS: list[StudyTask] = [StudyTask(id=q.id, query=q.text) for q in QUERIES]


@dataclass(frozen=True)
class Assignment:
    participant_id: str
    task_id: str
    condition: str
    block_order: int  # 0-indexed position in this participant's session


def generate_counterbalanced_design(
    participant_ids: list[str],
    tasks: list[StudyTask] = STUDY_TASKS,
    *,
    seed: int = 0,
) -> list[Assignment]:
    """Every participant does every task under both conditions.

    Counterbalancing: participants alternate which condition they see
    first (participant 0 does condition A first, participant 1 does B
    first, etc.) — a simple ABBA-style alternation across the sample, which
    controls for a systematic order effect (e.g. everyone being faster on
    their second attempt at a task regardless of which condition it's
    under) without needing a full Latin square for a small pilot sample.
    Within one participant's block for a given condition, task order is
    shuffled per participant (seeded, so the design is reproducible) to
    avoid every participant seeing the same task-order-driven learning
    curve.
    """
    assignments: list[Assignment] = []
    rng = random.Random(seed)

    for participant_index, participant_id in enumerate(participant_ids):
        first_condition = CONDITIONS[participant_index % 2]
        second_condition = CONDITIONS[(participant_index + 1) % 2]

        order = 0
        for condition in (first_condition, second_condition):
            shuffled_tasks = list(tasks)
            rng.shuffle(shuffled_tasks)
            for task in shuffled_tasks:
                assignments.append(
                    Assignment(participant_id=participant_id, task_id=task.id, condition=condition, block_order=order)
                )
                order += 1

    return assignments


@dataclass(frozen=True)
class TrialResult:
    participant_id: str
    task_id: str
    condition: str
    duration_seconds: float
    correct: bool
    confidence: int  # self-reported, 1 (not confident) - 5 (very confident)
    recorded_at: str = field(default_factory=lambda: datetime.now(UTC).isoformat())

    def __post_init__(self) -> None:
        if self.condition not in CONDITIONS:
            raise ValueError(f"Unknown condition {self.condition!r}; must be one of {CONDITIONS}")
        if self.duration_seconds < 0:
            raise ValueError("duration_seconds cannot be negative")
        if not 1 <= self.confidence <= 5:
            raise ValueError("confidence must be between 1 and 5")


def load_results(path: Path | None = None) -> list[TrialResult]:
    target = path or RESULTS_PATH
    if not target.is_file():
        return []
    try:
        raw = json.loads(target.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return []
    return [TrialResult(**entry) for entry in raw.get("trials", [])]


def save_result(result: TrialResult, path: Path | None = None) -> Path:
    target = path or RESULTS_PATH
    results = load_results(target)
    results.append(result)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps({"version": 1, "trials": [asdict(r) for r in results]}, indent=2), encoding="utf-8")
    return target


@dataclass(frozen=True)
class ConditionSummary:
    condition: str
    n: int
    mean_duration_seconds: float
    accuracy: float
    mean_confidence: float


@dataclass(frozen=True)
class StudySummary:
    by_condition: dict[str, ConditionSummary]
    paired_duration_wins: dict[str, int]  # per condition: # participant-tasks where it was faster than the other


def summarize(results: list[TrialResult]) -> StudySummary:
    """Descriptive statistics per condition, plus a simple paired
    comparison (a sign-test-style win count, not a p-value — computing a
    proper paired significance test, e.g. Wilcoxon signed-rank, needs a
    real sample and is a follow-up once one exists; a handful of trials
    from a mechanism test would make a computed p-value actively
    misleading)."""
    by_condition: dict[str, ConditionSummary] = {}
    for condition in CONDITIONS:
        trials = [r for r in results if r.condition == condition]
        if not trials:
            continue
        by_condition[condition] = ConditionSummary(
            condition=condition,
            n=len(trials),
            mean_duration_seconds=sum(t.duration_seconds for t in trials) / len(trials),
            accuracy=sum(1 for t in trials if t.correct) / len(trials),
            mean_confidence=sum(t.confidence for t in trials) / len(trials),
        )

    wins = {condition: 0 for condition in CONDITIONS}
    by_participant_task: dict[tuple[str, str], dict[str, float]] = {}
    for result in results:
        key = (result.participant_id, result.task_id)
        by_participant_task.setdefault(key, {})[result.condition] = result.duration_seconds

    for durations in by_participant_task.values():
        if WIKI_CHAT in durations and PLAIN_SEARCH in durations:
            faster = WIKI_CHAT if durations[WIKI_CHAT] < durations[PLAIN_SEARCH] else PLAIN_SEARCH
            wins[faster] += 1

    return StudySummary(by_condition=by_condition, paired_duration_wins=wins)
