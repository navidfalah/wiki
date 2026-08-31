"""Trust propagation over a claim graph — the thesis-track spine.

Extends trust.py's static per-source-type/glob-rule trust (the "prior") with
relational evidence from a claim graph's corroborates/contradicts/supersedes
edges (see trust_eval_dataset.py for the graph schema this operates on).

This module never reads a claim's `gold_label`; that field exists only so
trust_eval_dataset.py's graph can be scored against ground truth in a
separate evaluation step (task #3 — precision/ranking against the labeled
dataset, with ablations). Reading gold_label here would mean the algorithm
grades its own exam, which defeats the point of having a held-out dataset.

Method, in outline — a small, from-scratch instance of "truth discovery" /
"fact-finding" over noisy sources, in the spirit of Pasternack & Roth's
Sums/Investment algorithms ("Knowing What to Believe: Studying Trust,
Trustworthiness, and Truth"), scaled down for a personal knowledge base's
graph sizes:

1. Prior — trust.resolve_trust() gives each claim's source a static prior
   in [0, 1] (a source-type default, or a matched data/source_trust.json
   rule) — this is exactly what trust.py already computes for the
   References & Trust table today.
2. Relational evidence — each iteration, a claim's "support" is the sum of
   its corroborating neighbors' current trust, minus its contradicting
   neighbors' current trust (contradiction is symmetric: disagreement
   penalizes both sides, so an edge's direction never privileges one claim
   over the other), minus its superseding neighbors' current trust.
3. Recency/supersession decay — a claim that is the target of a
   `supersedes` edge is additionally decayed on top of the relational
   penalty, independent of how much evidence currently supports it, since
   supersession specifically marks "this was replaced by a later source,"
   not just "somebody happens to disagree."
4. Iterate — trust scores are recomputed synchronously (Jacobi-style, like
   PageRank's power iteration) for a fixed number of rounds; each claim's
   new score blends its static prior with a squashed version of its
   relational support, so a claim with no relations at all just keeps its
   prior score untouched.

Deliberately NOT here: cross-claim-group edges (a claim's dependency on a
claim in a *different* group — see nova_battery_life_claim/nbl-5 in the
eval dataset) and scope-aware reasoning (recognizing two claims are both
"correct" under different conditions rather than in conflict). Both are
named as limitations in documentation/21-trust-eval-dataset.md; extending
this module to handle them is future work, not a v1 requirement.
"""

from __future__ import annotations

import math
from dataclasses import dataclass

from trust import TRUST_LEVELS, load_trust_config, resolve_trust
from trust_eval_dataset import Claim, ClaimGroup, TrustEvalDataset

_MAX_PRIOR_SCORE = len(TRUST_LEVELS) - 1  # TRUST_SCORES range is 0..4


@dataclass(frozen=True)
class PropagationConfig:
    corroborate_weight: float = 1.0
    contradict_weight: float = 1.0
    supersede_weight: float = 1.5
    supersede_decay: float = 0.4  # multiplicative penalty per supersedes edge targeting a claim
    # alpha: static prior vs. relational evidence. 0.2 is an evidence-based
    # choice, not a guess: trust_propagation_eval.py's prior_weight sweep
    # (see documentation/23-trust-propagation-evaluation.md) shows pairwise
    # ranking accuracy on the labeled dataset is flat at its maximum (0.94)
    # across prior_weight in [0.0, 0.25] and drops sharply from 0.3 onward,
    # so 0.2 sits in the middle of that plateau — low enough to avoid the
    # static config's samples/**/dummy-test/** "unverified" rule outweighing
    # strong corroboration, but not 0.0, since a claim with *no* relational
    # evidence at all (a real possibility outside this pilot dataset) should
    # still fall back to its static prior rather than a fixed neutral value.
    prior_weight: float = 0.2
    sigmoid_k: float = 1.0
    iterations: int = 6

    def with_overrides(self, **kwargs: float | int) -> "PropagationConfig":
        """Return a copy with only the given fields changed — used by the
        ablation study (task #3) to zero out one term at a time."""
        return PropagationConfig(**{**self.__dict__, **kwargs})


DEFAULT_CONFIG = PropagationConfig()


@dataclass(frozen=True)
class ClaimTrust:
    claim_id: str
    prior: float
    score: float
    delta: float  # score - prior: how much relational evidence moved this claim
    trust_level: str  # bucketed onto trust.TRUST_LEVELS for the existing UI/table


def _prior_score(claim: Claim, trust_cfg: dict) -> float:
    info = resolve_trust(claim.source_path, claim.source_type, trust_cfg)
    return info.score / _MAX_PRIOR_SCORE


def _sigmoid(x: float, k: float) -> float:
    try:
        return 1.0 / (1.0 + math.exp(-k * x))
    except OverflowError:
        return 0.0 if x < 0 else 1.0


def _bucket_trust_level(score: float) -> str:
    index = min(len(TRUST_LEVELS) - 1, max(0, round(score * (len(TRUST_LEVELS) - 1))))
    return TRUST_LEVELS[index]


def propagate_group_trust(
    group: ClaimGroup,
    config: PropagationConfig = DEFAULT_CONFIG,
    trust_cfg: dict | None = None,
) -> dict[str, ClaimTrust]:
    """Propagate trust across one claim group's relation graph.

    Reads only claim.id/source_path/source_type and the group's relations —
    never claim.gold_label. Returns one ClaimTrust per claim, keyed by id.
    """
    cfg = trust_cfg if trust_cfg is not None else load_trust_config()
    claims_by_id = {c.id: c for c in group.claims}
    priors = {cid: _prior_score(c, cfg) for cid, c in claims_by_id.items()}
    scores = dict(priors)

    corroborators: dict[str, list[str]] = {cid: [] for cid in claims_by_id}
    contradictors: dict[str, list[str]] = {cid: [] for cid in claims_by_id}
    superseded_by: dict[str, list[str]] = {cid: [] for cid in claims_by_id}

    for rel in group.relations:
        if rel.from_id not in claims_by_id or rel.to_id not in claims_by_id:
            continue  # malformed edges are validate_dataset()'s concern, not ours
        if rel.type == "corroborates":
            corroborators[rel.to_id].append(rel.from_id)
        elif rel.type == "contradicts":
            contradictors[rel.to_id].append(rel.from_id)
            contradictors[rel.from_id].append(rel.to_id)
        elif rel.type == "supersedes":
            superseded_by[rel.to_id].append(rel.from_id)

    for _ in range(config.iterations):
        next_scores: dict[str, float] = {}
        for cid in claims_by_id:
            support = 0.0
            support += config.corroborate_weight * sum(scores[s] for s in corroborators[cid])
            support -= config.contradict_weight * sum(scores[s] for s in contradictors[cid])
            support -= config.supersede_weight * sum(scores[s] for s in superseded_by[cid])

            squashed = _sigmoid(support, config.sigmoid_k)
            blended = config.prior_weight * priors[cid] + (1 - config.prior_weight) * squashed
            decay = config.supersede_decay ** len(superseded_by[cid])
            next_scores[cid] = max(0.0, min(1.0, blended * decay))
        scores = next_scores

    return {
        cid: ClaimTrust(
            claim_id=cid,
            prior=priors[cid],
            score=scores[cid],
            delta=scores[cid] - priors[cid],
            trust_level=_bucket_trust_level(scores[cid]),
        )
        for cid in claims_by_id
    }


def propagate_dataset_trust(
    dataset: TrustEvalDataset,
    config: PropagationConfig = DEFAULT_CONFIG,
) -> dict[str, dict[str, ClaimTrust]]:
    """Run propagation independently per claim group, keyed by group id then
    claim id. No cross-group edges yet — see documentation/21-trust-eval-dataset.md."""
    trust_cfg = load_trust_config()
    return {group.id: propagate_group_trust(group, config, trust_cfg) for group in dataset.claim_groups}


def propagate_group_trust_from_store(
    store,
    group_id: str,
    config: PropagationConfig = DEFAULT_CONFIG,
    trust_cfg: dict | None = None,
) -> dict[str, ClaimTrust] | None:
    """Same as propagate_group_trust(), but the claim graph comes from a
    persistent graph_store.GraphStore (task #11) instead of an in-memory
    ClaimGroup parsed fresh from data/trust_eval_dataset.json every call —
    the same "insert once, query/compute many times" shift vector_store.py
    gives rag_engine.py's retrieve_hybrid(). Returns None if group_id isn't
    in the store (mirrors graph_store.export_claim_group()'s own None
    return rather than raising).
    """
    from graph_store import export_claim_group

    group = export_claim_group(store, group_id)
    if group is None:
        return None
    return propagate_group_trust(group, config, trust_cfg)
