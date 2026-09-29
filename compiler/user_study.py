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
from datetime import datetime, timezone
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
    task_set: str = ""  # "A" or "B" in the crossed design; empty in the legacy one


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


def split_matched_sets(tasks: list[StudyTask], groups: dict[str, str], difficulty: dict[str, int]) -> tuple[list[StudyTask], list[StudyTask]]:
    """Two task sets of matching make-up. Within each group (e.g. question
    category) tasks are ordered by a difficulty proxy and dealt A, B, B, A,
    A, B ... so both sets get the same number of tasks per group and about
    the same difficulty. Deterministic: no randomness, so the sets can be
    reviewed and published before the study."""
    set_a: list[StudyTask] = []
    set_b: list[StudyTask] = []
    for group in sorted(set(groups.values())):
        members = sorted((t for t in tasks if groups[t.id] == group), key=lambda t: (difficulty[t.id], t.id))
        for position, task in enumerate(members):
            (set_a if position % 4 in (0, 3) else set_b).append(task)
    return set_a, set_b


def generate_crossed_design(
    participant_ids: list[str],
    set_a: list[StudyTask],
    set_b: list[StudyTask],
    *,
    seed: int = 0,
) -> list[Assignment]:
    """The design for the pilot: each task is done once per participant.

    The legacy design (generate_counterbalanced_design) has everyone do every
    task under *both* conditions. The second time a participant already knows
    the answer, which favours whichever condition comes second and can wipe
    out the difference the study looks for. Here the tasks are split into two
    matched sets (split_matched_sets): a participant does set A under one
    condition and set B under the other, so no one meets a task twice.

    Counterbalanced over four participants: which condition comes first
    (alternates) and which set goes with the wiki (alternates every two
    participants). Use a multiple of four participants to keep all four
    combinations equally common. Task order within a block is shuffled per
    participant (seeded).
    """
    assignments: list[Assignment] = []
    rng = random.Random(seed)
    for index, participant_id in enumerate(participant_ids):
        first = CONDITIONS[index % 2]
        second = CONDITIONS[(index + 1) % 2]
        wiki_gets_a = (index // 2) % 2 == 0
        sets_for = {WIKI_CHAT: ("A", set_a) if wiki_gets_a else ("B", set_b), PLAIN_SEARCH: ("B", set_b) if wiki_gets_a else ("A", set_a)}
        order = 0
        for condition in (first, second):
            label, tasks = sets_for[condition]
            shuffled = list(tasks)
            rng.shuffle(shuffled)
            for task in shuffled:
                assignments.append(Assignment(participant_id, task.id, condition, order, label))
                order += 1
    return assignments


TRIAL_COLUMNS = ("participant_id", "task_id", "condition", "duration_seconds", "correct", "confidence")
_TRUE = {"1", "true", "yes", "y", "correct", "richtig", "ja"}
_FALSE = {"0", "false", "no", "n", "incorrect", "wrong", "falsch", "nein"}


def parse_trials_csv(text: str) -> list[TrialResult]:
    """Trials from a facilitator's spreadsheet export (header row required:
    participant_id, task_id, condition, duration_seconds, correct, confidence).
    Strict on purpose: a row that cannot be read stops the import with its line
    number, and nothing is guessed or defaulted, so a typo cannot turn into
    data."""
    import csv
    import io

    reader = csv.DictReader(io.StringIO(text))
    missing = [c for c in TRIAL_COLUMNS if c not in (reader.fieldnames or [])]
    if missing:
        raise ValueError(f"missing column(s): {', '.join(missing)}")
    trials: list[TrialResult] = []
    for line, row in enumerate(reader, start=2):
        try:
            correct_raw = (row["correct"] or "").strip().lower()
            if correct_raw not in _TRUE | _FALSE:
                raise ValueError(f"correct must be yes/no or 1/0, got {row['correct']!r}")
            trials.append(
                TrialResult(
                    participant_id=(row["participant_id"] or "").strip() or _fail("participant_id is empty"),
                    task_id=(row["task_id"] or "").strip() or _fail("task_id is empty"),
                    condition=(row["condition"] or "").strip(),
                    duration_seconds=float(row["duration_seconds"]),
                    correct=correct_raw in _TRUE,
                    confidence=int(row["confidence"]),
                )
            )
        except (ValueError, TypeError) as exc:
            raise ValueError(f"line {line}: {exc}") from exc
    seen: set[tuple[str, str, str]] = set()
    for trial in trials:
        key = (trial.participant_id, trial.task_id, trial.condition)
        if key in seen:
            raise ValueError(f"duplicate trial: {key}")
        seen.add(key)
    return trials


def _fail(message: str) -> str:
    raise ValueError(message)


@dataclass(frozen=True)
class TrialResult:
    participant_id: str
    task_id: str
    condition: str
    duration_seconds: float
    correct: bool
    confidence: int  # self-reported, 1 (not confident) - 5 (very confident)
    recorded_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

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


def participant_condition_means(results: list[TrialResult]) -> dict[str, dict[str, dict[str, float]]]:
    """Per participant and condition: mean duration and accuracy. The
    comparison unit for the crossed design, where a participant meets each
    task once and the two conditions are compared within the person, across
    their two matched task sets."""
    grouped: dict[str, dict[str, list[TrialResult]]] = {}
    for r in results:
        grouped.setdefault(r.participant_id, {}).setdefault(r.condition, []).append(r)
    return {
        pid: {
            cond: {"n": len(rows), "mean_duration_seconds": sum(r.duration_seconds for r in rows) / len(rows), "accuracy": sum(r.correct for r in rows) / len(rows)}
            for cond, rows in conds.items()
        }
        for pid, conds in grouped.items()
    }


def paired_participant_wins(results: list[TrialResult]) -> dict[str, int]:
    """Participants who were faster on average under each condition (ties count for neither); only participants with trials in both."""
    wins = {WIKI_CHAT: 0, PLAIN_SEARCH: 0}
    for conds in participant_condition_means(results).values():
        if WIKI_CHAT in conds and PLAIN_SEARCH in conds:
            a, b = conds[WIKI_CHAT]["mean_duration_seconds"], conds[PLAIN_SEARCH]["mean_duration_seconds"]
            if a != b:
                wins[WIKI_CHAT if a < b else PLAIN_SEARCH] += 1
    return wins


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


def main(argv: list[str] | None = None) -> int:
    import argparse

    parser = argparse.ArgumentParser(description="Import and summarize real study trials.")
    sub = parser.add_subparsers(dest="command", required=True)
    imp = sub.add_parser("import", help="append trials from a CSV (participant_id, task_id, condition, duration_seconds, correct, confidence)")
    imp.add_argument("csv", type=Path)
    sub.add_parser("summarize", help="descriptive statistics of the recorded trials")
    args = parser.parse_args(argv)

    if args.command == "import":
        try:
            trials = parse_trials_csv(args.csv.read_text(encoding="utf-8-sig"))
        except (OSError, ValueError) as exc:
            print(f"import failed, nothing written: {exc}")
            return 1
        existing = {(r.participant_id, r.task_id, r.condition) for r in load_results()}
        clash = [t for t in trials if (t.participant_id, t.task_id, t.condition) in existing]
        if clash:
            print(f"import failed, nothing written: {len(clash)} trial(s) already recorded, first: {clash[0].participant_id} {clash[0].task_id} {clash[0].condition}")
            return 1
        for trial in trials:
            save_result(trial)
        print(f"imported {len(trials)} trials into {RESULTS_PATH}")
        return 0

    results = load_results()
    if not results:
        print("no trials recorded yet")
        return 0
    summary = summarize(results)
    for cond, c in summary.by_condition.items():
        print(f"{cond}: n={c.n}  mean {c.mean_duration_seconds:.0f}s  correct {c.accuracy:.0%}  confidence {c.mean_confidence:.1f}")
    print(f"participants faster on average with: {paired_participant_wins(results)}")
    print(f"participants: {len({r.participant_id for r in results})} (a pilot: report counts, not p-values)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
