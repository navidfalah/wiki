import math

from entity_resolution import EntityCluster, Mention
from entity_resolution_eval import pairwise_evaluate, run_eval


def test_pairwise_evaluate_perfect_prediction():
    gold = [
        (Mention("Mira Chen", "a.md"), "mira"),
        (Mention("Mira", "b.md"), "mira"),
        (Mention("Alex Kim", "c.md"), "alex-kim"),
    ]
    clusters = [
        EntityCluster("e0", "Mira Chen", {"Mira Chen", "Mira"}),
        EntityCluster("e1", "Alex Kim", {"Alex Kim"}),
    ]
    report = pairwise_evaluate(clusters, gold)
    assert report.precision == 1.0
    assert report.recall == 1.0
    assert report.f1 == 1.0
    assert report.gold_pairs == 1  # only (Mira Chen, Mira) should be a same-cluster gold pair


def test_pairwise_evaluate_penalizes_a_false_merge():
    gold = [
        (Mention("Alex Kim", "a.md"), "alex-kim"),
        (Mention("Alex Rivera", "b.md"), "alex-rivera"),
    ]
    # Wrongly merged into one cluster.
    clusters = [EntityCluster("e0", "Alex Kim", {"Alex Kim", "Alex Rivera"})]
    report = pairwise_evaluate(clusters, gold)
    assert report.precision == 0.0
    assert report.gold_pairs == 0  # Alex Kim and Alex Rivera are different gold entities
    assert math.isnan(report.recall)  # recall is undefined (0/0) when there's nothing to recall


def test_pairwise_evaluate_penalizes_a_missed_merge():
    gold = [
        (Mention("Mira Chen", "a.md"), "mira"),
        (Mention("Mira", "b.md"), "mira"),
    ]
    # Wrongly kept apart.
    clusters = [
        EntityCluster("e0", "Mira Chen", {"Mira Chen"}),
        EntityCluster("e1", "Mira", {"Mira"}),
    ]
    report = pairwise_evaluate(clusters, gold)
    assert report.recall == 0.0
    assert report.gold_pairs == 1


def test_run_eval_on_the_real_dataset_scores_perfectly_with_heuristic_tier_alone():
    report = run_eval()
    assert report.precision == 1.0
    assert report.recall == 1.0
    assert report.f1 == 1.0
    assert report.gold_pairs > 0
