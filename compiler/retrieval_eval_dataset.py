"""A small hand-labeled retrieval eval set, built by repurposing
data/trust_eval_dataset.json's already-grounded claim quotes as passages.

Reusing that dataset's text (rather than authoring new fixtures) is
deliberate: every quote in it is already verified verbatim against a real
data/raw/ source (trust_eval_dataset.validate_dataset()'s grounding check),
so this retrieval benchmark inherits that guarantee for free. What's new
here is a *different* kind of annotation over the same text — QUERIES, each
hand-labeled with which claim ids are topically relevant to it. Topical
relevance for retrieval is not the same judgment as trust for propagation:
a query about the plant size is relevant to both the correct 171.6 kWp
claims AND the superseded 198 kWp ones (pvc-1..pvc-3) — a retrieval
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
        "q-plant-size",
        "How many kWp does the Sonnendach Lindenhof solar plant have?",
        frozenset({"pvc-1", "pvc-2", "pvc-3", "pvc-4", "pvc-5", "pvc-6", "pvc-7", "pvc-8", "pvc-9"}),
    ),
    RetrievalQuery(
        "q-commissioning",
        "When was the plant commissioned and energised?",
        frozenset({"cd-1", "cd-2", "cd-3", "cd-4", "cd-5", "cd-6", "cd-7", "cd-8", "cd-9", "cd-10"}),
    ),
    RetrievalQuery(
        "q-battery",
        "How big is the battery storage in the school basement?",
        frozenset({"bc-1", "bc-2", "bc-3", "bc-4", "bc-5", "bc-6", "bc-7", "bc-8"}),
    ),
    RetrievalQuery(
        "q-share-price",
        "What does one cooperative share cost?",
        frozenset({"sp-1", "sp-2", "sp-3", "sp-4", "sp-5", "sp-6", "sp-7"}),
    ),
    RetrievalQuery(
        "q-members",
        "How many members does the cooperative have?",
        frozenset({"mc-1", "mc-2", "mc-3", "mc-4", "mc-5", "mc-6", "mc-7"}),
    ),
    RetrievalQuery(
        "q-module-switch",
        "Why were the Helion modules replaced by Nordlicht NL-430 modules?",
        frozenset({"mt-1", "mt-2", "mt-3", "mt-4", "mt-5", "mt-6"}),
    ),
    RetrievalQuery(
        "q-heat-pump",
        "When will the heat pump pilot for the Freibad start?",
        frozenset({"hp-1", "hp-2", "hp-3", "hp-4", "hp-5", "hp-6"}),
    ),
    RetrievalQuery(
        "q-dividend",
        "What dividend does the cooperative pay?",
        frozenset({"dv-1", "dv-2", "dv-3", "dv-4"}),
    ),
    RetrievalQuery(
        "q-flyer-error",
        "The flyer said a share costs 200 euros - is that right?",
        frozenset({"sp-3", "sp-5", "sp-6"}),
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
