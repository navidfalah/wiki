"""A small hand-labeled retrieval eval set, built by repurposing
data/trust_eval_dataset.json's already-grounded claim quotes as passages.

Reusing that dataset's text (rather than authoring new fixtures) is
deliberate: every quote in it is already verified verbatim against a real
data/raw/ source (trust_eval_dataset.validate_dataset()'s grounding check),
so this retrieval benchmark inherits that guarantee for free. What's new
here is a *different* kind of annotation over the same text — QUERIES, each
hand-labeled with which claim ids are topically relevant to it. Topical
relevance for retrieval is not the same judgment as trust for propagation:
a query about "the read interval controversy" is relevant to both the
correct claims AND the superseded "hourly" claim (nri-1) — a retrieval
system's job is to find everything on-topic, not to pre-judge what's true.
"""

from __future__ import annotations

from dataclasses import dataclass

import hybrid_retrieval
from trust_eval_dataset import TrustEvalDataset, load_trust_eval_dataset


@dataclass(frozen=True)
class RetrievalQuery:
    id: str
    text: str
    relevant_ids: frozenset[str]


QUERIES: list[RetrievalQuery] = [
    RetrievalQuery(
        "q-read-interval",
        "What is the default sensor read interval for the Nova Widget?",
        frozenset({"nri-1", "nri-2", "nri-3", "nri-4", "nri-5", "nri-6", "nri-7", "nri-8"}),
    ),
    RetrievalQuery(
        "q-battery-cell",
        "What battery cell type does the Nova Widget use?",
        frozenset({"nbc-1", "nbc-2", "nbc-3", "nbc-4", "nbc-5", "nbc-6"}),
    ),
    RetrievalQuery(
        "q-battery-life",
        "How long does the Nova Widget's battery last?",
        frozenset({"nbl-1", "nbl-2", "nbl-3", "nbl-4", "nbl-5"}),
    ),
    RetrievalQuery(
        "q-herbal-preset",
        "When does the TeaBuddy herbal steep preset trigger?",
        frozenset({"thp-1", "thp-2"}),
    ),
    RetrievalQuery(
        "q-relay-drain",
        "Why does MeshSync relay mode drain the battery faster than expected?",
        frozenset({"mrd-1", "mrd-2", "mrd-3"}),
    ),
    RetrievalQuery(
        "q-cr2450-mixup",
        "There was a mixup where a blog post said the wrong battery type — what happened?",
        frozenset({"nbc-3", "nbc-4", "nbc-6"}),
    ),
    RetrievalQuery(
        "q-hourly-vs-15min",
        "Was the read interval ever hourly instead of 15 minutes?",
        frozenset({"nri-1", "nri-2", "nri-3", "nri-5", "nri-7"}),
    ),
    RetrievalQuery(
        "q-relay-sleep-timer-fix",
        "What was the technical root cause and fix for the relay radio not sleeping?",
        frozenset({"mrd-1", "mrd-2"}),
    ),
]


def build_passage_docs(dataset: TrustEvalDataset | None = None) -> list[hybrid_retrieval.Doc]:
    """Every claim's verbatim quote, as a retrievable Doc keyed by claim id."""
    dataset = dataset or load_trust_eval_dataset()
    docs = []
    for group in dataset.claim_groups:
        for claim in group.claims:
            docs.append(hybrid_retrieval.Doc(id=claim.id, text=claim.quote, tokens=hybrid_retrieval.tokenize(claim.quote)))
    return docs
