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


# --- crossed design (the pilot) --------------------------------------------------

import user_study  # noqa: E402
from user_study import (  # noqa: E402
    generate_crossed_design,
    paired_participant_wins,
    parse_trials_csv,
    participant_condition_means,
    split_matched_sets,
)


def _tasks(n_per_group=4, groups=("fact", "contradiction")):
    tasks, group_of, difficulty = [], {}, {}
    for g in groups:
        for i in range(n_per_group):
            t = user_study.StudyTask(f"{g[0]}{i}", f"question {g} {i}")
            tasks.append(t)
            group_of[t.id] = g
            difficulty[t.id] = i
    return tasks, group_of, difficulty


def test_matched_sets_are_disjoint_complete_and_balanced_per_group():
    tasks, group_of, difficulty = _tasks(4)
    a, b = split_matched_sets(tasks, group_of, difficulty)
    assert {t.id for t in a}.isdisjoint({t.id for t in b})
    assert {t.id for t in a} | {t.id for t in b} == {t.id for t in tasks}
    for g in ("fact", "contradiction"):
        assert sum(group_of[t.id] == g for t in a) == sum(group_of[t.id] == g for t in b) == 2
    # A B B A: the two sets have equal total difficulty
    assert sum(difficulty[t.id] for t in a) == sum(difficulty[t.id] for t in b)


def test_crossed_design_gives_each_participant_each_task_exactly_once():
    tasks, group_of, difficulty = _tasks(4)
    a, b = split_matched_sets(tasks, group_of, difficulty)
    design = generate_crossed_design(["p1", "p2", "p3", "p4"], a, b)
    for pid in ["p1", "p2", "p3", "p4"]:
        rows = [x for x in design if x.participant_id == pid]
        assert sorted(x.task_id for x in rows) == sorted(t.id for t in tasks)  # once each, never twice
        assert [x.block_order for x in rows] == list(range(len(tasks)))
        for cond in CONDITIONS:
            assert len({x.task_set for x in rows if x.condition == cond}) == 1  # one set per condition


def test_crossed_design_counterbalances_condition_order_and_set_over_four_participants():
    tasks, group_of, difficulty = _tasks(4)
    a, b = split_matched_sets(tasks, group_of, difficulty)
    design = generate_crossed_design(["p1", "p2", "p3", "p4"], a, b)
    combos = set()
    for pid in ["p1", "p2", "p3", "p4"]:
        rows = [x for x in design if x.participant_id == pid]
        first = rows[0].condition
        wiki_set = next(x.task_set for x in rows if x.condition == WIKI_CHAT)
        combos.add((first, wiki_set))
    assert combos == {(WIKI_CHAT, "A"), (PLAIN_SEARCH, "A"), (WIKI_CHAT, "B"), (PLAIN_SEARCH, "B")}


def test_crossed_design_is_deterministic():
    tasks, group_of, difficulty = _tasks(4)
    a, b = split_matched_sets(tasks, group_of, difficulty)
    assert generate_crossed_design(["p1", "p2"], a, b, seed=3) == generate_crossed_design(["p1", "p2"], a, b, seed=3)


HEADER = "participant_id,task_id,condition,duration_seconds,correct,confidence\n"


def test_parse_trials_csv_reads_rows():
    trials = parse_trials_csv(HEADER + "P01,q1,wiki_chat,42.5,yes,4\nP01,q2,plain_search,120,no,2\nP02,q1,plain_search,60,1,5\n")
    assert [(t.participant_id, t.condition, t.duration_seconds, t.correct, t.confidence) for t in trials] == [
        ("P01", "wiki_chat", 42.5, True, 4),
        ("P01", "plain_search", 120.0, False, 2),
        ("P02", "plain_search", 60.0, True, 5),
    ]


@pytest.mark.parametrize(
    "row, message",
    [
        ("P01,q1,wiki_chat,42,maybe,4", "line 2: correct must be yes/no"),
        ("P01,q1,wiki_chat,fast,yes,4", "line 2"),
        ("P01,q1,wiki_chat,42,yes,9", "line 2: confidence"),
        ("P01,q1,google,42,yes,3", "line 2: Unknown condition"),
        ("P01,q1,wiki_chat,-1,yes,3", "line 2: duration_seconds cannot be negative"),
        (",q1,wiki_chat,42,yes,3", "line 2: participant_id is empty"),
        ("P01,q1,wiki_chat,42,yes,", "line 2"),
    ],
)
def test_parse_trials_csv_is_strict_and_names_the_line(row, message):
    with pytest.raises(ValueError, match=message):
        parse_trials_csv(HEADER + row + "\n")


def test_parse_trials_csv_rejects_missing_columns_and_duplicates():
    with pytest.raises(ValueError, match="missing column"):
        parse_trials_csv("participant_id,task_id\nP01,q1\n")
    with pytest.raises(ValueError, match="duplicate trial"):
        parse_trials_csv(HEADER + "P01,q1,wiki_chat,42,yes,3\nP01,q1,wiki_chat,50,no,2\n")


def _trial(pid, task, cond, seconds, correct=True):
    return TrialResult(pid, task, cond, seconds, correct, 3)


def test_participant_means_and_wins_compare_within_the_person():
    # synthetic timing data, for testing arithmetic only; not a study result
    results = [
        _trial("p1", "a", WIKI_CHAT, 30), _trial("p1", "b", WIKI_CHAT, 50), _trial("p1", "c", PLAIN_SEARCH, 100, False),
        _trial("p2", "a", PLAIN_SEARCH, 20), _trial("p2", "c", WIKI_CHAT, 90),
        _trial("p3", "a", WIKI_CHAT, 10),  # only one condition: not compared
    ]
    means = participant_condition_means(results)
    assert means["p1"][WIKI_CHAT] == {"n": 2, "mean_duration_seconds": 40.0, "accuracy": 1.0}
    assert means["p1"][PLAIN_SEARCH]["accuracy"] == 0.0
    assert paired_participant_wins(results) == {WIKI_CHAT: 1, PLAIN_SEARCH: 1}
    assert paired_participant_wins([_trial("p", "a", WIKI_CHAT, 5), _trial("p", "b", PLAIN_SEARCH, 5)]) == {WIKI_CHAT: 0, PLAIN_SEARCH: 0}


def test_cli_import_is_all_or_nothing_and_refuses_repeats(tmp_path, monkeypatch, capsys):
    monkeypatch.setattr(user_study, "RESULTS_PATH", tmp_path / "results.json")
    good = tmp_path / "good.csv"
    good.write_text(HEADER + "P01,q1,wiki_chat,42,yes,4\nP01,q2,plain_search,60,no,3\n")
    bad = tmp_path / "bad.csv"
    bad.write_text(HEADER + "P02,q1,wiki_chat,42,yes,4\nP02,q2,plain_search,oops,no,3\n")
    assert user_study.main(["import", str(bad)]) == 1
    assert not (tmp_path / "results.json").exists()  # the good first row was not kept
    assert user_study.main(["import", str(good)]) == 0
    assert len(load_results(tmp_path / "results.json")) == 2
    assert user_study.main(["import", str(good)]) == 1  # already recorded
    assert len(load_results(tmp_path / "results.json")) == 2
    assert "already recorded" in capsys.readouterr().out


def test_cli_summarize(tmp_path, monkeypatch, capsys):
    monkeypatch.setattr(user_study, "RESULTS_PATH", tmp_path / "results.json")
    assert user_study.main(["summarize"]) == 0
    assert "no trials recorded yet" in capsys.readouterr().out
    save_result(_trial("p1", "a", WIKI_CHAT, 30))
    save_result(_trial("p1", "b", PLAIN_SEARCH, 90, False))
    assert user_study.main(["summarize"]) == 0
    out = capsys.readouterr().out
    assert "wiki_chat: n=1" in out and "plain_search: n=1" in out and "pilot" in out
