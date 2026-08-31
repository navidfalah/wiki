"""Active-learning human review/correction loop.

Turns trust_propagation.py's continuous scores (task #2) into a triage
queue: a claim whose propagated trust is low, or that sits on an
unresolved contradiction (two claims disagree and neither one's score
clearly dominates), is exactly the kind of case worth a human's five
seconds rather than the pipeline silently picking a winner. A human's
correction is stored durably (data/review_corrections.json, the same
human-editable-JSON pattern as data/link_overrides.json and
data/source_trust.json) and rendered back as a few-shot block the
extraction prompt can include for future compiles — closing the loop from
"the pipeline got something wrong" to "the pipeline is less likely to get
it wrong the same way again," rather than References & Trust staying a
one-way, read-only report.

Selection never reads a claim's gold_label (this module has no idea what a
"gold_label" even is — it operates on trust_propagation.py's output, which
itself never reads it either); this is meant to work on a real, unlabeled
compile, not just the labeled pilot dataset.
"""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from datetime import UTC, datetime
from pathlib import Path

from models import PROJECT_ROOT
from trust_eval_dataset import Claim, ClaimGroup
from trust_propagation import ClaimTrust, PropagationConfig, propagate_group_trust

CORRECTIONS_PATH = PROJECT_ROOT / "data" / "review_corrections.json"

LOW_CONFIDENCE_THRESHOLD = 0.35
CONTRADICTION_MARGIN = 0.15

VERDICTS = {"confirm_correct", "confirm_incorrect", "confirm_superseded", "confirm_scope_dependent"}


@dataclass(frozen=True)
class ReviewCandidate:
    claim_id: str
    group_id: str
    reason: str  # "low_confidence" | "unresolved_contradiction"
    score: float
    quote: str
    source_path: str
    contradicts: str | None = None  # the other claim id, when reason is unresolved_contradiction


def select_review_candidates(
    group: ClaimGroup,
    scores: dict[str, ClaimTrust],
    *,
    low_confidence_threshold: float = LOW_CONFIDENCE_THRESHOLD,
    contradiction_margin: float = CONTRADICTION_MARGIN,
) -> list[ReviewCandidate]:
    """Flag claims worth a human look: low propagated trust, or part of a
    contradiction neither side has clearly won (scores within
    contradiction_margin of each other)."""
    claims_by_id = {claim.id: claim for claim in group.claims}
    flagged: dict[str, ReviewCandidate] = {}

    for claim in group.claims:
        score = scores[claim.id].score
        if score < low_confidence_threshold:
            flagged[claim.id] = ReviewCandidate(
                claim_id=claim.id,
                group_id=group.id,
                reason="low_confidence",
                score=score,
                quote=claim.quote,
                source_path=claim.source_path,
            )

    for relation in group.relations:
        if relation.type != "contradicts":
            continue
        score_a = scores[relation.from_id].score
        score_b = scores[relation.to_id].score
        if abs(score_a - score_b) < contradiction_margin:
            for this_id, other_id in ((relation.from_id, relation.to_id), (relation.to_id, relation.from_id)):
                existing = flagged.get(this_id)
                if existing is not None and existing.reason == "unresolved_contradiction":
                    continue  # already flagged for a contradiction; don't overwrite with a second one
                claim = claims_by_id[this_id]
                flagged[this_id] = ReviewCandidate(
                    claim_id=this_id,
                    group_id=group.id,
                    reason="unresolved_contradiction",
                    score=scores[this_id].score,
                    quote=claim.quote,
                    source_path=claim.source_path,
                    contradicts=other_id,
                )

    return sorted(flagged.values(), key=lambda c: c.score)


def select_review_candidates_for_dataset(
    claim_groups: list[ClaimGroup],
    *,
    config: PropagationConfig | None = None,
    low_confidence_threshold: float = LOW_CONFIDENCE_THRESHOLD,
    contradiction_margin: float = CONTRADICTION_MARGIN,
) -> list[ReviewCandidate]:
    from trust_propagation import DEFAULT_CONFIG

    cfg = config or DEFAULT_CONFIG
    candidates: list[ReviewCandidate] = []
    for group in claim_groups:
        scores = propagate_group_trust(group, cfg)
        candidates.extend(
            select_review_candidates(
                group,
                scores,
                low_confidence_threshold=low_confidence_threshold,
                contradiction_margin=contradiction_margin,
            )
        )
    return candidates


@dataclass(frozen=True)
class Correction:
    claim_id: str
    group_id: str
    verdict: str
    note: str
    quote_excerpt: str
    reviewed_at: str = field(default_factory=lambda: datetime.now(UTC).isoformat())

    def __post_init__(self) -> None:
        if self.verdict not in VERDICTS:
            raise ValueError(f"Unknown verdict {self.verdict!r}; must be one of {sorted(VERDICTS)}")


def correction_from_candidate(candidate: ReviewCandidate, verdict: str, note: str) -> Correction:
    """Build a Correction from a ReviewCandidate a human just resolved,
    carrying the claim's quote along so render_fewshot_block() doesn't need
    a separate lookup back into the claim graph."""
    return Correction(
        claim_id=candidate.claim_id,
        group_id=candidate.group_id,
        verdict=verdict,
        note=note,
        quote_excerpt=candidate.quote[:200],
    )


def load_corrections(path: Path | None = None) -> list[Correction]:
    target = path or CORRECTIONS_PATH
    if not target.is_file():
        return []
    try:
        raw = json.loads(target.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return []
    return [Correction(**entry) for entry in raw.get("corrections", [])]


def save_correction(correction: Correction, path: Path | None = None) -> Path:
    """Append one correction to the store, deduplicating by claim_id (a
    newer correction for the same claim replaces the older one — a human
    changed their mind, or refined an earlier note)."""
    target = path or CORRECTIONS_PATH
    corrections = [c for c in load_corrections(target) if c.claim_id != correction.claim_id]
    corrections.append(correction)

    target.parent.mkdir(parents=True, exist_ok=True)
    payload = {"version": 1, "corrections": [asdict(c) for c in corrections]}
    target.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    return target


def render_fewshot_block(corrections: list[Correction]) -> str:
    """Render human corrections as a few-shot block an extraction prompt
    can include. Empty string when there's nothing to add, so callers can
    unconditionally append it without an extra branch."""
    if not corrections:
        return ""
    lines = ["Known corrections from human review — apply the same judgment to similar text:"]
    for correction in corrections:
        lines.append(f'- "{correction.quote_excerpt}" -> {correction.verdict}: {correction.note}')
    return "\n".join(lines)
