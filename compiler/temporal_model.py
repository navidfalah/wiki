"""Bi-temporal fact modeling over the claim graph.

trust_propagation.py (task #2) resolves *how much to trust* a claim from
relational evidence; this module resolves a different, complementary
question purely from *when* things happened: which claim was true as of a
given date, and which one is true now. It never reads a claim's
gold_label, same discipline as trust_propagation.py — everything here comes
from a claim's `date` field and the claim group's `supersedes` edges.

Two time axes, in the bi-temporal database sense:

- **Valid time** — the period during which a claim's asserted value was
  considered the current answer. Modeled here as [valid_from, valid_until):
  valid_from is the claim's own date; valid_until is the valid_from of
  whichever claim supersedes it (or None — still current — if nothing
  does). This is the axis `as_of()` queries against: "what did the corpus
  say was true on this date."
- **Transaction time** — when a fact was *recorded* into the system, which
  can differ from valid time (e.g. a note written in June describing
  something that was true in March). This dataset's claims don't currently
  distinguish the two — every claim's `date` is used for both — so
  `TemporalFact.recorded_at` exists as a documented placeholder for that
  distinction rather than a currently-meaningful separate value. See the
  Limitations section of documentation/27-temporal-modeling.md.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import date

from trust_eval_dataset import Claim, ClaimGroup, TrustEvalDataset

_ISO_DATE_RE = re.compile(r"^(\d{4})-(\d{2})-(\d{2})")


def parse_valid_time(raw_date: str) -> date | None:
    """Best-effort parse of a claim's `date` field to a valid-time point.

    Only handles a leading ISO YYYY-MM-DD prefix — what every claim in
    data/trust_eval_dataset.json uses except one deliberately-messy
    exception (teabuddy_herbal_preset_timing/thp-1's undated "marketing
    copy" note, which this correctly returns None for rather than
    guessing).
    """
    match = _ISO_DATE_RE.match(raw_date.strip())
    if not match:
        return None
    try:
        return date(int(match.group(1)), int(match.group(2)), int(match.group(3)))
    except ValueError:
        return None


@dataclass(frozen=True)
class TemporalFact:
    claim_id: str
    valid_from: date | None
    valid_until: date | None  # None = still current (never superseded)
    recorded_at: date | None  # == valid_from here; see module docstring

    @property
    def is_current(self) -> bool:
        return self.valid_until is None

    def valid_as_of(self, as_of_date: date) -> bool:
        """Was this claim the (or a) current answer on as_of_date?
        A claim with an unparseable date is never valid at any date — it
        can still appear in `current_claims()` if never superseded, but
        can't be placed on a timeline."""
        if self.valid_from is None:
            return False
        if as_of_date < self.valid_from:
            return False
        if self.valid_until is not None and as_of_date >= self.valid_until:
            return False
        return True


def build_group_timeline(group: ClaimGroup) -> dict[str, TemporalFact]:
    """One TemporalFact per claim. A claim's valid_until is set from the
    group's `supersedes` edges: if claim B supersedes claim A, A stops
    being current exactly when B's valid_from begins. If a superseding
    claim's own date can't be parsed, the superseded claim is left with
    valid_until=None (still counted current) rather than guessed at —
    consistent with never inventing a date this module wasn't given."""
    valid_from = {claim.id: parse_valid_time(claim.date) for claim in group.claims}
    valid_until: dict[str, date | None] = {claim.id: None for claim in group.claims}

    for relation in group.relations:
        if relation.type != "supersedes":
            continue
        superseder_from = valid_from.get(relation.from_id)
        if superseder_from is None:
            continue
        current = valid_until.get(relation.to_id)
        if current is None or superseder_from < current:
            valid_until[relation.to_id] = superseder_from

    return {
        claim.id: TemporalFact(
            claim_id=claim.id,
            valid_from=valid_from[claim.id],
            valid_until=valid_until[claim.id],
            recorded_at=valid_from[claim.id],
        )
        for claim in group.claims
    }


def as_of(group: ClaimGroup, timeline: dict[str, TemporalFact], query_date: date) -> list[Claim]:
    """Every claim considered valid on query_date — what the corpus would
    have said if asked that day. Can return more than one claim
    (independent corroborating sources), zero (nothing dated early enough
    yet), or a claim later superseded but still valid at that earlier
    date."""
    claims_by_id = {claim.id: claim for claim in group.claims}
    return [claims_by_id[claim_id] for claim_id, fact in timeline.items() if fact.valid_as_of(query_date)]


def current_claims(group: ClaimGroup, timeline: dict[str, TemporalFact]) -> list[Claim]:
    """Claims never superseded — the corpus's present-day answer, derived
    purely from dates and supersedes edges, no gold_label involved."""
    claims_by_id = {claim.id: claim for claim in group.claims}
    return [claims_by_id[claim_id] for claim_id, fact in timeline.items() if fact.is_current]


def build_dataset_timelines(dataset: TrustEvalDataset) -> dict[str, dict[str, TemporalFact]]:
    return {group.id: build_group_timeline(group) for group in dataset.claim_groups}
