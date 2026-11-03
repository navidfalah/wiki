"""App search settings: local BM25 and extractive answers by default.

Persisted experimental architectures, reranking and generated answers are
normalized to the supported app choices. Hybrid embeddings are an explicit
opt-in. Legacy literals remain available to standalone research utilities.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Literal

from models import PROJECT_ROOT

RAG_SETTINGS_FILE = PROJECT_ROOT / "data" / "rag_settings.json"

RetrievalMode = Literal["bm25", "hybrid", "hybrid_rerank"]
AnswerMode = Literal["auto", "extractive"]
Architecture = Literal["hybrid", "naive", "hyde", "fusion", "graph", "corrective"]

_RETRIEVAL_MODES = ("bm25", "hybrid")
_ANSWER_MODES = ("extractive",)
# "hybrid" is the pre-existing BM25/fusion/rerank stack, tuned by
# retrieval_mode below; the rest are rag_architectures.py's ARCHITECTURES
# registry, each a self-contained strategy that ignores retrieval_mode.
_ARCHITECTURES = ("hybrid",)


@dataclass(frozen=True)
class RagSettings:
    architecture: Architecture = "hybrid"
    retrieval_mode: RetrievalMode = "bm25"
    top_k: int = 5
    bm25_k1: float = 1.5
    bm25_b: float = 0.75
    use_vector_store: bool = False
    answer_mode: AnswerMode = "extractive"

    @property
    def enable_embeddings(self) -> bool:
        return self.retrieval_mode in ("hybrid", "hybrid_rerank")

    @property
    def enable_rerank(self) -> bool:
        return self.retrieval_mode == "hybrid_rerank"


def _as_number(raw: dict, key: str, default: float, cast):
    try:
        return cast(raw[key])
    except (KeyError, TypeError, ValueError):
        return default


def load_rag_settings() -> RagSettings:
    if not RAG_SETTINGS_FILE.exists():
        return RagSettings()
    try:
        raw = json.loads(RAG_SETTINGS_FILE.read_text())
    except (OSError, json.JSONDecodeError):
        return RagSettings()
    if not isinstance(raw, dict):
        return RagSettings()

    architecture = raw.get("architecture")
    if architecture not in _ARCHITECTURES:
        architecture = "hybrid"

    retrieval_mode = raw.get("retrieval_mode")
    if retrieval_mode not in _RETRIEVAL_MODES:
        retrieval_mode = "bm25"

    answer_mode = raw.get("answer_mode")
    if answer_mode not in _ANSWER_MODES:
        answer_mode = "extractive"

    top_k = int(_as_number(raw, "top_k", 5, int))
    if top_k < 1:
        top_k = 5

    return RagSettings(
        architecture=architecture,
        retrieval_mode=retrieval_mode,
        top_k=top_k,
        bm25_k1=float(_as_number(raw, "bm25_k1", 1.5, float)),
        bm25_b=float(_as_number(raw, "bm25_b", 0.75, float)),
        use_vector_store=bool(raw.get("use_vector_store", False)),
        answer_mode=answer_mode,
    )
