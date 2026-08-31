import pytest

from user_study import (
    CONDITIONS,
    PLAIN_SEARCH,
    STUDY_TASKS,
    WIKI_CHAT,
    TrialResult,
    generate_counterbalanced_design,
    load_results,
    save_result,
    summarize,
)


def test_study_tasks_reuse_retrieval_eval_dataset_queries():
    from retrieval_eval_dataset import QUERIES

    assert len(STUDY_TASKS) == len(QUERIES)
    assert {t.id for t in STUDY_TASKS} == {q.id for q in QUERIES}


def test_generate_counterbalanced_design_covers_every_task_and_condition_per_participant():
    design = generate_counterbalanced_design(["p1", "p2"])
    for participant_id in ["p1", "p2"]:
        rows = [a for a in design if a.participant_id == participant_id]
        assert len(rows) == len(STUDY_TASKS) * 2
        assert {a.task_id for a in rows} == {t.id for t in STUDY_TASKS}
        for condition in CONDITIONS:
            assert sum(1 for a in rows if a.condition == condition) == len(STUDY_TASKS)


def test_generate_counterbalanced_design_alternates_first_condition_across_participants():
    design = generate_counterbalanced_design(["p1", "p2", "p3", "p4"])

    def first_condition_seen(participant_id: str) -> str:
        rows = sorted((a for a in design if a.participant_id == participant_id), key=lambda a: a.block_order)
        return rows[0].condition

    seen = [first_condition_seen(p) for p in ["p1", "p2", "p3", "p4"]]
    assert seen == [WIKI_CHAT, PLAIN_SEARCH, WIKI_CHAT, PLAIN_SEARCH]


def test_generate_counterbalanced_design_is_deterministic_for_a_given_seed():
    a = generate_counterbalanced_design(["p1"], seed=7)
    b = generate_counterbalanced_design(["p1"], seed=7)
    assert a == b


def test_generate_counterbalanced_design_different_seeds_can_vary_task_order():
    a = generate_counterbalanced_design(["p1"], seed=1)
    b = generate_counterbalanced_design(["p1"], seed=2)
    assert [x.task_id for x in a] != [x.task_id for x in b]


def test_trial_result_rejects_unknown_condition():
    with pytest.raises(ValueError, match="Unknown condition"):
        TrialResult(participant_id="p1", task_id="t1", condition="nonsense", duration_seconds=1.0, correct=True, confidence=3)


def test_trial_result_rejects_negative_duration():
    with pytest.raises(ValueError, match="negative"):
        TrialResult(participant_id="p1", task_id="t1", condition=WIKI_CHAT, duration_seconds=-1.0, correct=True, confidence=3)


def test_trial_result_rejects_out_of_range_confidence():
    with pytest.raises(ValueError, match="confidence"):
        TrialResult(participant_id="p1", task_id="t1", condition=WIKI_CHAT, duration_seconds=1.0, correct=True, confidence=6)


def test_save_and_load_results_round_trip(tmp_path):
    path = tmp_path / "results.json"
    result = TrialResult(participant_id="p1", task_id="t1", condition=WIKI_CHAT, duration_seconds=12.5, correct=True, confidence=4)
    save_result(result, path)

    loaded = load_results(path)
    assert len(loaded) == 1
    assert loaded[0].participant_id == "p1"
    assert loaded[0].duration_seconds == 12.5


def test_load_results_returns_empty_list_for_missing_file(tmp_path):
    assert load_results(tmp_path / "nope.json") == []


def test_load_results_returns_empty_list_for_malformed_json(tmp_path):
    path = tmp_path / "results.json"
    path.write_text("not json", encoding="utf-8")
    assert load_results(path) == []


def _mechanism_test_trials() -> list[TrialResult]:
    """Synthetic timing data for testing summarize()'s arithmetic only —
    NOT real participant data. Never treat this as, or present this as, a
    study result; see user_study.py's module docstring."""
    return [
        TrialResult(participant_id="p1", task_id="t1", condition=WIKI_CHAT, duration_seconds=10.0, correct=True, confidence=5),
        TrialResult(participant_id="p1", task_id="t1", condition=PLAIN_SEARCH, duration_seconds=20.0, correct=True, confidence=3),
        TrialResult(participant_id="p1", task_id="t2", condition=WIKI_CHAT, duration_seconds=8.0, correct=False, confidence=2),
        TrialResult(participant_id="p1", task_id="t2", condition=PLAIN_SEARCH, duration_seconds=25.0, correct=True, confidence=4),
    ]


def test_summarize_computes_per_condition_descriptive_stats():
    summary = summarize(_mechanism_test_trials())
    wiki = summary.by_condition[WIKI_CHAT]
    assert wiki.n == 2
    assert wiki.mean_duration_seconds == 9.0
    assert wiki.accuracy == 0.5
    assert wiki.mean_confidence == 3.5

    plain = summary.by_condition[PLAIN_SEARCH]
    assert plain.n == 2
    assert plain.mean_duration_seconds == 22.5
    assert plain.accuracy == 1.0


def test_summarize_paired_duration_wins_counts_per_task_comparisons():
    summary = summarize(_mechanism_test_trials())
    # Both task/participant pairs: wiki_chat was faster both times.
    assert summary.paired_duration_wins[WIKI_CHAT] == 2
    assert summary.paired_duration_wins[PLAIN_SEARCH] == 0


def test_summarize_handles_empty_results():
    summary = summarize([])
    assert summary.by_condition == {}
    assert summary.paired_duration_wins == {WIKI_CHAT: 0, PLAIN_SEARCH: 0}


def test_summarize_ignores_unpaired_trials_in_win_count():
    """A trial with no matching same-task/participant trial under the
    other condition shouldn't be counted as a "win" for either side."""
    trials = [
        TrialResult(participant_id="p1", task_id="t1", condition=WIKI_CHAT, duration_seconds=5.0, correct=True, confidence=5),
    ]
    summary = summarize(trials)
    assert summary.paired_duration_wins == {WIKI_CHAT: 0, PLAIN_SEARCH: 0}
    assert summary.by_condition[WIKI_CHAT].n == 1
