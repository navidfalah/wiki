import math

import hybrid_retrieval as hr
import retrieval_eval as re_
from retrieval_eval_dataset import QUERIES, build_passage_docs


def test_recall_at_k_basic():
    relevant = frozenset({"a", "b", "c"})
    assert re_.recall_at_k(["a", "x", "b"], relevant, 5) == 2 / 3
    assert re_.recall_at_k(["x", "y"], relevant, 5) == 0.0
    assert re_.recall_at_k(["a", "b", "c"], relevant, 5) == 1.0


def test_recall_at_k_respects_k():
    relevant = frozenset({"a", "b"})
    assert re_.recall_at_k(["x", "a", "b"], relevant, 1) == 0.0
    assert re_.recall_at_k(["x", "a", "b"], relevant, 3) == 1.0


def test_recall_at_k_nan_for_no_relevant_docs():
    assert math.isnan(re_.recall_at_k(["a"], frozenset(), 5))


def test_ndcg_at_k_perfect_ranking_is_one():
    relevant = frozenset({"a", "b"})
    assert re_.ndcg_at_k(["a", "b", "x"], relevant, 5) == 1.0


def test_ndcg_at_k_penalizes_relevant_docs_ranked_lower():
    relevant = frozenset({"a"})
    high = re_.ndcg_at_k(["a", "x", "y"], relevant, 5)
    low = re_.ndcg_at_k(["x", "y", "a"], relevant, 5)
    assert high > low
    assert high == 1.0


def test_ndcg_at_k_zero_when_nothing_relevant_found():
    relevant = frozenset({"a"})
    assert re_.ndcg_at_k(["x", "y", "z"], relevant, 5) == 0.0


def test_legacy_tfidf_rank_finds_the_relevant_document():
    docs = [
        hr.Doc("battery", "battery", hr.tokenize("Relay radios drain batteries faster than spec.")),
        hr.Doc("trademark", "trademark", hr.tokenize("The Nova Widget mark was cleared in class 21.")),
    ]
    result = re_.legacy_tfidf_rank("why do batteries drain fast", docs, top_k=2)
    assert result[0] == "battery"


def test_legacy_tfidf_rank_empty_for_unmatched_query():
    docs = [hr.Doc("a", "a", hr.tokenize("hello world"))]
    assert re_.legacy_tfidf_rank("zzz nonexistent", docs) == []


def test_evaluate_no_api_tiers_runs_without_a_key_and_returns_valid_metrics():
    reports = re_.evaluate_no_api_tiers()
    names = {r.name for r in reports}
    assert names == {"legacy_tfidf", "bm25"}
    for report in reports:
        assert 0.0 <= report.mean_recall_at_5 <= 1.0
        assert 0.0 <= report.mean_ndcg_at_5 <= 1.0


def test_bm25_finds_something_relevant_on_average_across_all_queries():
    """A weak regression guard at the aggregate level, not per-query — one
    hand-labeled query (q-battery-life) genuinely gets 0 recall from BM25
    at this small corpus size (see documentation/25-hybrid-retrieval.md's
    per-query table), which is a real, reported finding, not a bug to
    assert against. The aggregate should still be well above zero."""
    docs = build_passage_docs()
    recalls = [
        re_.recall_at_k([r.doc_id for r in hr.bm25_rank(query.text, docs, top_k=5)], query.relevant_ids, 5)
        for query in QUERIES
    ]
    assert sum(recalls) / len(recalls) > 0.3
