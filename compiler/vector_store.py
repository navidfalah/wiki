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
"""

from __future__ import annotations

import json
import math
import sqlite3
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class VectorRecord:
    id: str
    text: str
    embedding: list[float]


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return dot / (norm_a * norm_b)


class VectorStore:
    """Brute-force cosine search over a SQLite-persisted embedding table.
    Deliberately simple (no ANN index) — appropriate at the scale
    scalability_benchmark.py actually measures; see its results for where
    brute-force search starts to cost real latency."""

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
                    embedding TEXT NOT NULL
                )
                """
            )
            conn.commit()

    def upsert(self, record: VectorRecord) -> None:
        self.upsert_many([record])

    def upsert_many(self, records: list[VectorRecord]) -> None:
        with self._connect() as conn:
            conn.executemany(
                "INSERT OR REPLACE INTO vectors (id, text, embedding) VALUES (?, ?, ?)",
                [(r.id, r.text, json.dumps(r.embedding)) for r in records],
            )
            conn.commit()

    def get(self, record_id: str) -> VectorRecord | None:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT id, text, embedding FROM vectors WHERE id = ?", (record_id,)
            ).fetchone()
        if row is None:
            return None
        return VectorRecord(id=row[0], text=row[1], embedding=json.loads(row[2]))

    def count(self) -> int:
        with self._connect() as conn:
            return conn.execute("SELECT COUNT(*) FROM vectors").fetchone()[0]

    def all_records(self) -> list[VectorRecord]:
        with self._connect() as conn:
            rows = conn.execute("SELECT id, text, embedding FROM vectors").fetchall()
        return [VectorRecord(id=r[0], text=r[1], embedding=json.loads(r[2])) for r in rows]

    def search(self, query_embedding: list[float], *, top_k: int = 5) -> list[tuple[str, float]]:
        """Brute-force cosine search over every stored vector. Returns
        (id, score) pairs, highest score first."""
        scored = [
            (record.id, _cosine_similarity(query_embedding, record.embedding))
            for record in self.all_records()
        ]
        scored.sort(key=lambda item: item[1], reverse=True)
        return scored[:top_k]

    def delete(self, record_id: str) -> None:
        with self._connect() as conn:
            conn.execute("DELETE FROM vectors WHERE id = ?", (record_id,))
            conn.commit()
