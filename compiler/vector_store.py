"""A lightweight, persistent vector store — SQLite-backed, brute-force
cosine search.

Not a claim to replace pgvector/Chroma at web scale — it's the specific
step this project is actually missing: `rag_engine.build_corpus()` and
`retrieve_hybrid()` rebuild and re-embed the entire corpus from scratch on
every call (see [25-hybrid-retrieval.md](../documentation/25-hybrid-retrieval.md)).
For a corpus this project's size actually targets (a personal wiki, not a
web-scale index), a persistent store you insert into once and query many
times — surviving process restarts — is the right next step before
reaching for a dedicated vector database, and it's what
`scalability_benchmark.py` (task #11) measures against BM25 to give the
task #5 "no clear win at this corpus's scale" finding a real answer at
larger sizes.

Still brute-force by design — see [31-vector-graph-storage-and-scalability.md]
(../documentation/31-vector-graph-storage-and-scalability.md) for the
benchmark showing that's the right call at this project's target scale,
and exactly where it stops being one (an ANN index is the documented next
step if that ever changes, not attempted here). What *is* worth fixing
without reaching for a new dependency: the benchmark named two concrete,
avoidable costs inside the brute-force scan itself — JSON-decoding every
stored embedding on every call, and recomputing every stored vector's norm
from scratch on every query even though it never changes between queries.
Both are fixed here (packed-binary storage instead of JSON, and a
precomputed norm persisted alongside each vector) without changing the
O(n) shape of the search or adding any dependency beyond the stdlib.
"""

from __future__ import annotations

import math
import sqlite3
from array import array
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class VectorRecord:
    id: str
    text: str
    embedding: list[float]


def _pack_embedding(embedding: list[float]) -> bytes:
    """Little-endian packed doubles -- far cheaper to decode than JSON text
    for a list of floats, and about half the on-disk size."""
    return array("d", embedding).tobytes()


def _unpack_embedding(blob: bytes) -> list[float]:
    values = array("d")
    values.frombytes(blob)
    return list(values)


def _vector_norm(embedding: list[float]) -> float:
    return math.sqrt(sum(x * x for x in embedding))


def _cosine_similarity(
    a: list[float], b: list[float], *, norm_a: float | None = None, norm_b: float | None = None
) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b, strict=True))
    na = norm_a if norm_a is not None else _vector_norm(a)
    nb = norm_b if norm_b is not None else _vector_norm(b)
    if na == 0.0 or nb == 0.0:
        return 0.0
    return dot / (na * nb)


class VectorStore:
    """Brute-force cosine search over a SQLite-persisted embedding table.
    Deliberately simple (no ANN index) — appropriate at the scale
    scalability_benchmark.py actually measures; see its results for where
    brute-force search starts to cost real latency. Each record's L2 norm
    is precomputed once at upsert time and persisted alongside it, so a
    search only ever computes one norm from scratch (the query's, once per
    call) instead of one per stored record per call."""

    def __init__(self, db_path: Path | str) -> None:
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _connect(self) -> sqlite3.Connection:
        return sqlite3.connect(self.db_path)

    def _init_db(self) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS vectors (
                    id TEXT PRIMARY KEY,
                    text TEXT NOT NULL,
                    embedding BLOB NOT NULL,
                    norm REAL NOT NULL
                )
                """
            )
            conn.commit()

    def upsert(self, record: VectorRecord) -> None:
        self.upsert_many([record])

    def upsert_many(self, records: list[VectorRecord]) -> None:
        with self._connect() as conn:
            conn.executemany(
                "INSERT OR REPLACE INTO vectors (id, text, embedding, norm) VALUES (?, ?, ?, ?)",
                [
                    (r.id, r.text, _pack_embedding(r.embedding), _vector_norm(r.embedding))
                    for r in records
                ],
            )
            conn.commit()

    def get(self, record_id: str) -> VectorRecord | None:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT id, text, embedding FROM vectors WHERE id = ?", (record_id,)
            ).fetchone()
        if row is None:
            return None
        return VectorRecord(id=row[0], text=row[1], embedding=_unpack_embedding(row[2]))

    def count(self) -> int:
        with self._connect() as conn:
            return conn.execute("SELECT COUNT(*) FROM vectors").fetchone()[0]

    def all_records(self) -> list[VectorRecord]:
        with self._connect() as conn:
            rows = conn.execute("SELECT id, text, embedding FROM vectors").fetchall()
        return [VectorRecord(id=r[0], text=r[1], embedding=_unpack_embedding(r[2])) for r in rows]

    def search(self, query_embedding: list[float], *, top_k: int = 5) -> list[tuple[str, float]]:
        """Brute-force cosine search over every stored vector. Returns
        (id, score) pairs, highest score first."""
        query_norm = _vector_norm(query_embedding)
        with self._connect() as conn:
            rows = conn.execute("SELECT id, embedding, norm FROM vectors").fetchall()
        scored = [
            (
                record_id,
                _cosine_similarity(
                    query_embedding, _unpack_embedding(blob), norm_a=query_norm, norm_b=norm
                ),
            )
            for record_id, blob, norm in rows
        ]
        scored.sort(key=lambda item: item[1], reverse=True)
        return scored[:top_k]

    def delete(self, record_id: str) -> None:
        with self._connect() as conn:
            conn.execute("DELETE FROM vectors WHERE id = ?", (record_id,))
            conn.commit()
