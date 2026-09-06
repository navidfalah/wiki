"""Builds a real entity graph from the compiled corpus.

documentation/26-entity-resolution.md named one open gap: "compiler/
linker.py — the topic/mention graph this could feed a real entity graph
into, not yet wired up (this task delivers the resolver itself, not the
pipeline integration)." This module is that wiring, but as a read-side
adapter rather than a pipeline step: it reads data/state.json's
already-extracted per-chunk entities (exactly the raw material
linker.py's mention graph is built from -- see synthesizer.py's
CHUNK_EXTRACTION_SYSTEM_PROMPT), turns them into entity_resolution.py's
`Mention` objects, and clusters them with `resolve_entities()`. Computed
on demand, the same posture /api/knowledge-graph and /api/attention
already use for state.json/index.json-derived data, rather than adding
yet another persisted output file main.py has to know how to regenerate.

Heuristic tier only, by design: entity_resolution_eval.py's own
real-corpus result (documentation/26-entity-resolution.md) already shows
the heuristic tier alone reaches perfect precision/recall on this
project's corpus, and this module has no LLM/embedding client to hand
resolve_entities() anyway -- an API key stays optional for this endpoint,
same as the rest of the "works with or without an LLM configured" surface
(RAG chat, attention, analytics).
"""

from __future__ import annotations

import json

from entity_resolution import DEFAULT_CONFIG, EntityCluster, Mention, ResolutionConfig, resolve_entities
from models import STATE_FILE


def load_state(path=None) -> dict:
    target = path or STATE_FILE
    if not target.exists():
        return {"files": {}}
    try:
        return json.loads(target.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {"files": {}}


def mentions_from_state(state: dict) -> list[Mention]:
    """Every entity mention across every extracted chunk of every
    processed file -- the raw material a real entity graph is built from,
    before clustering."""
    mentions: list[Mention] = []
    for source_path, entry in (state.get("files") or {}).items():
        for chunk in entry.get("chunks", []) or []:
            for entity in chunk.get("entities", []) or []:
                name = str(entity.get("name", "")).strip()
                if not name:
                    continue
                mentions.append(Mention(name=name, source=source_path, description=str(entity.get("description", ""))))
    return mentions


def build_entity_graph(state: dict, *, config: ResolutionConfig = DEFAULT_CONFIG) -> list[EntityCluster]:
    return resolve_entities(mentions_from_state(state), config=config)


def _cluster_to_dict(cluster: EntityCluster) -> dict:
    return {
        "id": cluster.id,
        "canonical_name": cluster.canonical_name,
        "aliases": sorted(cluster.aliases),
        "sources": sorted(cluster.sources),
        "mention_count": len(cluster.mentions),
    }


def entity_graph_payload(state: dict | None = None) -> dict:
    """The `/entities` dashboard page's data: every resolved entity,
    sorted by how many distinct sources reference it (the entities where
    resolution matters most -- someone or something cited across the
    corpus, not a one-off mention), plus summary counts."""
    resolved_state = state if state is not None else load_state()
    clusters = build_entity_graph(resolved_state)
    clusters_out = sorted((_cluster_to_dict(c) for c in clusters), key=lambda c: (-len(c["sources"]), c["canonical_name"]))
    return {
        "entities": clusters_out,
        "counts": {
            "total_entities": len(clusters_out),
            "total_mentions": sum(c["mention_count"] for c in clusters_out),
            "multi_source_entities": sum(1 for c in clusters_out if len(c["sources"]) > 1),
            "multi_alias_entities": sum(1 for c in clusters_out if len(c["aliases"]) > 1),
        },
    }
