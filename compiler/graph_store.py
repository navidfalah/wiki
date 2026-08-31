"""A lightweight, persistent graph store — SQLite nodes/edges tables.

The claim graphs task #1 (trust_eval_dataset.py) and the entity clusters
task #6 (entity_resolution.py) build exist only in memory, rebuilt from a
JSON file or a fresh resolution pass every time. This is the same "flat
files -> a real, persistent, queryable store" step vector_store.py takes
for embeddings, applied to relational structure instead: a node (a claim,
an entity, a document — node_type distinguishes them) and an edge between
two nodes (corroborates/contradicts/supersedes, or an entity's mention
link to a source), both queryable without re-parsing or re-resolving
anything.
"""

from __future__ import annotations

import json
import sqlite3
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Node:
    id: str
    node_type: str
    attrs: dict


@dataclass(frozen=True)
class Edge:
    from_id: str
    to_id: str
    edge_type: str
    attrs: dict


class GraphStore:
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
                CREATE TABLE IF NOT EXISTS nodes (
                    id TEXT PRIMARY KEY,
                    node_type TEXT NOT NULL,
                    attrs TEXT NOT NULL
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS edges (
                    from_id TEXT NOT NULL,
                    to_id TEXT NOT NULL,
                    edge_type TEXT NOT NULL,
                    attrs TEXT NOT NULL,
                    PRIMARY KEY (from_id, to_id, edge_type)
                )
                """
            )
            conn.execute("CREATE INDEX IF NOT EXISTS idx_edges_from ON edges (from_id)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_edges_to ON edges (to_id)")
            conn.commit()

    def add_node(self, node_id: str, node_type: str, attrs: dict | None = None) -> None:
        with self._connect() as conn:
            conn.execute(
                "INSERT OR REPLACE INTO nodes (id, node_type, attrs) VALUES (?, ?, ?)",
                (node_id, node_type, json.dumps(attrs or {})),
            )
            conn.commit()

    def add_nodes(self, nodes: list[Node]) -> None:
        with self._connect() as conn:
            conn.executemany(
                "INSERT OR REPLACE INTO nodes (id, node_type, attrs) VALUES (?, ?, ?)",
                [(n.id, n.node_type, json.dumps(n.attrs)) for n in nodes],
            )
            conn.commit()

    def add_edge(self, from_id: str, to_id: str, edge_type: str, attrs: dict | None = None) -> None:
        with self._connect() as conn:
            conn.execute(
                "INSERT OR REPLACE INTO edges (from_id, to_id, edge_type, attrs) VALUES (?, ?, ?, ?)",
                (from_id, to_id, edge_type, json.dumps(attrs or {})),
            )
            conn.commit()

    def add_edges(self, edges: list[Edge]) -> None:
        with self._connect() as conn:
            conn.executemany(
                "INSERT OR REPLACE INTO edges (from_id, to_id, edge_type, attrs) VALUES (?, ?, ?, ?)",
                [(e.from_id, e.to_id, e.edge_type, json.dumps(e.attrs)) for e in edges],
            )
            conn.commit()

    def get_node(self, node_id: str) -> Node | None:
        with self._connect() as conn:
            row = conn.execute("SELECT id, node_type, attrs FROM nodes WHERE id = ?", (node_id,)).fetchone()
        if row is None:
            return None
        return Node(id=row[0], node_type=row[1], attrs=json.loads(row[2]))

    def all_nodes(self, node_type: str | None = None) -> list[Node]:
        with self._connect() as conn:
            if node_type is None:
                rows = conn.execute("SELECT id, node_type, attrs FROM nodes").fetchall()
            else:
                rows = conn.execute(
                    "SELECT id, node_type, attrs FROM nodes WHERE node_type = ?", (node_type,)
                ).fetchall()
        return [Node(id=r[0], node_type=r[1], attrs=json.loads(r[2])) for r in rows]

    def neighbors(self, node_id: str, edge_type: str | None = None) -> list[Edge]:
        """Outgoing edges from node_id, optionally filtered by edge_type."""
        with self._connect() as conn:
            if edge_type is None:
                rows = conn.execute(
                    "SELECT from_id, to_id, edge_type, attrs FROM edges WHERE from_id = ?", (node_id,)
                ).fetchall()
            else:
                rows = conn.execute(
                    "SELECT from_id, to_id, edge_type, attrs FROM edges WHERE from_id = ? AND edge_type = ?",
                    (node_id, edge_type),
                ).fetchall()
        return [Edge(from_id=r[0], to_id=r[1], edge_type=r[2], attrs=json.loads(r[3])) for r in rows]

    def incoming(self, node_id: str, edge_type: str | None = None) -> list[Edge]:
        with self._connect() as conn:
            if edge_type is None:
                rows = conn.execute(
                    "SELECT from_id, to_id, edge_type, attrs FROM edges WHERE to_id = ?", (node_id,)
                ).fetchall()
            else:
                rows = conn.execute(
                    "SELECT from_id, to_id, edge_type, attrs FROM edges WHERE to_id = ? AND edge_type = ?",
                    (node_id, edge_type),
                ).fetchall()
        return [Edge(from_id=r[0], to_id=r[1], edge_type=r[2], attrs=json.loads(r[3])) for r in rows]

    def node_count(self) -> int:
        with self._connect() as conn:
            return conn.execute("SELECT COUNT(*) FROM nodes").fetchone()[0]

    def edge_count(self) -> int:
        with self._connect() as conn:
            return conn.execute("SELECT COUNT(*) FROM edges").fetchone()[0]


_CLAIM_GROUP_NODE_TYPE = "claim_group"


def import_claim_group(store: GraphStore, group) -> None:
    """Load one trust_eval_dataset.ClaimGroup (task #1's in-memory schema)
    into a GraphStore — the adapter that turns the pilot dataset's JSON
    into the persistent representation this module provides. Every claim
    field trust_propagation.py's prior (via trust.resolve_trust) or
    export_claim_group() below needs is captured in the node's attrs, not
    just enough to render a graph — this is meant to round-trip, not just
    display.
    """
    group_node = Node(
        id=group.id,
        node_type=_CLAIM_GROUP_NODE_TYPE,
        attrs={"domain": group.domain, "subject": group.subject, "description": group.description},
    )
    claim_nodes = [
        Node(
            id=claim.id,
            node_type="claim",
            attrs={
                "group_id": group.id,
                "source_path": claim.source_path,
                "source_type": claim.source_type,
                "date": claim.date,
                "value": claim.value,
                "quote": claim.quote,
                "gold_label": claim.gold_label,
                "note": claim.note,
            },
        )
        for claim in group.claims
    ]
    edges = [
        Edge(from_id=rel.from_id, to_id=rel.to_id, edge_type=rel.type, attrs={})
        for rel in group.relations
    ]
    store.add_nodes([group_node, *claim_nodes])
    store.add_edges(edges)


def export_claim_group(store: GraphStore, group_id: str):
    """Reconstruct a trust_eval_dataset.ClaimGroup from whatever's been
    persisted for group_id — the inverse of import_claim_group(), and what
    lets trust_propagation.py operate against a GraphStore-backed graph
    (trust_propagation.propagate_group_trust_from_store()) instead of only
    an in-memory object parsed fresh from JSON every time.

    Returns None if group_id isn't in the store. Relations are restricted
    to edges between two claims that both belong to this group — an edge
    accidentally pointing outside the group (shouldn't happen via
    import_claim_group, but the store doesn't enforce it) is silently
    dropped rather than producing a ClaimGroup with a dangling reference.
    """
    from trust_eval_dataset import Claim, ClaimGroup, Relation

    group_node = store.get_node(group_id)
    if group_node is None or group_node.node_type != _CLAIM_GROUP_NODE_TYPE:
        return None

    claim_nodes = [n for n in store.all_nodes(node_type="claim") if n.attrs.get("group_id") == group_id]
    claims = [
        Claim(
            id=n.id,
            source_path=n.attrs.get("source_path", ""),
            source_type=n.attrs.get("source_type", "text"),
            date=n.attrs.get("date", ""),
            value=n.attrs.get("value", ""),
            quote=n.attrs.get("quote", ""),
            gold_label=n.attrs.get("gold_label", "correct"),
            note=n.attrs.get("note", ""),
        )
        for n in claim_nodes
    ]
    claim_ids = {c.id for c in claims}

    seen_edges: set[tuple[str, str, str]] = set()
    relations: list[Relation] = []
    for claim in claims:
        for edge in store.neighbors(claim.id):
            key = (edge.from_id, edge.to_id, edge.edge_type)
            if edge.to_id in claim_ids and key not in seen_edges:
                seen_edges.add(key)
                relations.append(Relation(from_id=edge.from_id, to_id=edge.to_id, type=edge.edge_type))

    return ClaimGroup(
        id=group_id,
        domain=group_node.attrs.get("domain", ""),
        subject=group_node.attrs.get("subject", ""),
        description=group_node.attrs.get("description", ""),
        claims=claims,
        relations=relations,
    )
