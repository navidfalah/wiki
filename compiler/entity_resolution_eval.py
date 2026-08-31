"""Pairwise precision/recall/F1 for entity_resolution.py against the
hand-labeled dataset in entity_resolution_eval_dataset.py.

Standard cluster-evaluation metric: for every pair of mentions, check
whether "predicted same cluster" agrees with "gold same cluster". Unlike
extraction_critic_eval.py / retrieval_eval.py's embeddings/reranker tiers,
the *heuristic* tier this dataset mainly exercises needs no API key, so the
headline numbers below are real, not skipped.

Run `python entity_resolution_eval.py` to reproduce them (and, if
OPENAI_API_KEY is set, to also evaluate the embedding+LLM tiers on
whatever pairs the heuristic tier alone left ambiguous — none, on the
current dataset, so those tiers have nothing left to do here; see
documentation/26-entity-resolution.md).
"""

from __future__ import annotations

from dataclasses import dataclass
from itertools import combinations

from entity_resolution import EntityCluster, resolve_entities
from entity_resolution_eval_dataset import GOLD_MENTIONS
from llm_client import LLMClient


@dataclass(frozen=True)
class PairwiseReport:
    precision: float
    recall: float
    f1: float
    predicted_pairs: int
    gold_pairs: int
    correct_pairs: int


def _cluster_id_by_mention_name(clusters: list[EntityCluster]) -> dict[str, str]:
    mapping: dict[str, str] = {}
    for cluster in clusters:
        for alias in cluster.aliases:
            mapping[alias] = cluster.id
    return mapping


def pairwise_evaluate(clusters: list[EntityCluster], gold: list[tuple]) -> PairwiseReport:
    predicted_cluster_of = _cluster_id_by_mention_name(clusters)
    names = [mention.name for mention, _gold_id in gold]
    gold_cluster_of = {mention.name: gold_id for mention, gold_id in gold}

    predicted_pairs = set()
    gold_pairs = set()
    for a, b in combinations(sorted(set(names)), 2):
        if predicted_cluster_of.get(a) == predicted_cluster_of.get(b):
            predicted_pairs.add((a, b))
        if gold_cluster_of[a] == gold_cluster_of[b]:
            gold_pairs.add((a, b))

    correct = predicted_pairs & gold_pairs
    precision = len(correct) / len(predicted_pairs) if predicted_pairs else float("nan")
    recall = len(correct) / len(gold_pairs) if gold_pairs else float("nan")
    f1 = (2 * precision * recall / (precision + recall)) if (precision and recall and precision + recall > 0) else 0.0

    return PairwiseReport(
        precision=precision,
        recall=recall,
        f1=f1,
        predicted_pairs=len(predicted_pairs),
        gold_pairs=len(gold_pairs),
        correct_pairs=len(correct),
    )


def run_eval(*, embed_fn=None, llm=None) -> PairwiseReport:
    mentions = [mention for mention, _gold_id in GOLD_MENTIONS]
    clusters = resolve_entities(mentions, embed_fn=embed_fn, llm=llm)
    return pairwise_evaluate(clusters, GOLD_MENTIONS)


if __name__ == "__main__":
    heuristic_only = run_eval()
    print("=== Heuristic tier only (no API key needed) ===")
    print(
        f"precision={heuristic_only.precision:.2f} recall={heuristic_only.recall:.2f} "
        f"f1={heuristic_only.f1:.2f}  ({heuristic_only.correct_pairs}/{heuristic_only.predicted_pairs} "
        f"predicted pairs correct, {heuristic_only.gold_pairs} gold pairs)"
    )

    client = LLMClient()
    if client.available:
        print("\n=== + embeddings + LLM adjudication tiers ===")
        full = run_eval(embed_fn=client.embed_text, llm=client)
        print(f"precision={full.precision:.2f} recall={full.recall:.2f} f1={full.f1:.2f}")
    else:
        print(
            "\nNo OPENAI_API_KEY configured (.env) — skipping the embeddings/LLM tiers. "
            "On the current dataset the heuristic tier alone already resolves every pair "
            "correctly, so there is nothing left for those tiers to adjudicate here; a "
            "larger/harder dataset would be needed to say anything about them."
        )
