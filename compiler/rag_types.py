"""Shared types for the chat/RAG stack: the retrievable unit (`Passage`) and
its scored form, plus the bit of indexing glue every retrieval architecture
needs (turning a `list[Passage]` into `hybrid_retrieval.Doc`s and back).

Split out of rag_engine.py so rag_architectures.py (the different retrieval
*architectures* -- naive, HyDE, RAG-Fusion, graph-expansion, corrective --
see documentation/34-rag-architectures.md) can depend on the passage type
without importing rag_engine.py itself, which would create a cycle: rag_engine
dispatches to rag_architectures by architecture name, so the dependency can
only run one way.
"""

from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass, field

import hybrid_retrieval

_WORD_RE = re.compile(r"[a-z0-9]+")


def tokenize(text: str) -> list[str]:
    return _WORD_RE.findall(text.lower())


@dataclass
class Passage:
    doc_path: str
    title: str
    heading: str
    text: str
    tokens: list[str] = field(default_factory=list)


@dataclass
class ScoredPassage:
    passage: Passage
    score: float


def passage_id(passage: Passage) -> str:
    """A stable content-hash id -- same (doc_path, heading, text) always
    hashes to the same id, across calls and across process restarts. See
    rag_engine.sync_corpus_to_vector_store() for why that stability matters
    for the persistent vector store."""
    key = f"{passage.doc_path}\x1f{passage.heading}\x1f{passage.text}"
    return hashlib.sha256(key.encode("utf-8")).hexdigest()[:16]


def index_corpus(corpus: list[Passage]) -> tuple[list[hybrid_retrieval.Doc], dict[str, Passage]]:
    """Turn a wiki-specific Passage list into hybrid_retrieval's generic
    Doc list plus an id -> Passage lookup, the shape every retrieval tier
    and every architecture in rag_architectures.py operates on."""
    docs = [hybrid_retrieval.Doc(id=passage_id(p), text=p.text, tokens=p.tokens) for p in corpus]
    by_id = {passage_id(p): p for p in corpus}
    return docs, by_id
