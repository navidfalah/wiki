from datetime import date

from temporal_model import (
    as_of,
    build_dataset_timelines,
    build_group_timeline,
    current_claims,
    parse_valid_time,
)
from trust_eval_dataset import Claim, ClaimGroup, Relation, load_trust_eval_dataset


def _claim(cid: str, date_str: str, gold_label: str = "correct") -> Claim:
    return Claim(
        id=cid,
        source_path=f"notes/{cid}.md",
        source_type="text",
        date=date_str,
        value="x",
        quote="x",
        gold_label=gold_label,
    )


def test_parse_valid_time_handles_iso_date():
    assert parse_valid_time("2026-05-01") == date(2026, 5, 1)


def test_parse_valid_time_returns_none_for_unparseable_date():
    assert parse_valid_time("2026-06-XX (marketing copy, undated)") is None
    assert parse_valid_time("") is None
    assert parse_valid_time("not a date at all") is None


def test_build_group_timeline_sets_valid_until_from_supersedes_edge():
    group = ClaimGroup(
        id="g",
        domain="test",
        subject="test",
        description="test",
        claims=[_claim("old", "2026-05-01", "superseded"), _claim("new", "2026-05-15", "correct")],
        relations=[Relation(from_id="new", to_id="old", type="supersedes")],
    )
    timeline = build_group_timeline(group)
    assert timeline["old"].valid_from == date(2026, 5, 1)
    assert timeline["old"].valid_until == date(2026, 5, 15)
    assert not timeline["old"].is_current
    assert timeline["new"].valid_until is None
    assert timeline["new"].is_current


def test_as_of_returns_the_claim_that_was_current_on_a_past_date():
    group = ClaimGroup(
        id="g",
        domain="test",
        subject="test",
        description="test",
        claims=[_claim("old", "2026-05-01", "superseded"), _claim("new", "2026-05-15", "correct")],
        relations=[Relation(from_id="new", to_id="old", type="supersedes")],
    )
    timeline = build_group_timeline(group)

    before = as_of(group, timeline, date(2026, 5, 10))
    assert [c.id for c in before] == ["old"]

    after = as_of(group, timeline, date(2026, 6, 1))
    assert [c.id for c in after] == ["new"]

    before_anything = as_of(group, timeline, date(2026, 1, 1))
    assert before_anything == []


def test_current_claims_excludes_superseded_ones():
    group = ClaimGroup(
        id="g",
        domain="test",
        subject="test",
        description="test",
        claims=[_claim("old", "2026-05-01", "superseded"), _claim("new", "2026-05-15", "correct")],
        relations=[Relation(from_id="new", to_id="old", type="supersedes")],
    )
    timeline = build_group_timeline(group)
    assert {c.id for c in current_claims(group, timeline)} == {"new"}


def test_current_claims_with_no_supersedes_edges_returns_everything():
    group = ClaimGroup(
        id="g",
        domain="test",
        subject="test",
        description="test",
        claims=[_claim("a", "2026-05-01"), _claim("b", "2026-05-15")],
    )
    timeline = build_group_timeline(group)
    assert {c.id for c in current_claims(group, timeline)} == {"a", "b"}


def test_double_supersession_keeps_the_earliest_valid_until():
    """If (hypothetically) two later claims both supersede the same older
    one, the older claim stops being current at the *earlier* of the two
    supersession dates, not the later one."""
    group = ClaimGroup(
        id="g",
        domain="test",
        subject="test",
        description="test",
        claims=[
            _claim("old", "2026-01-01", "superseded"),
            _claim("mid", "2026-03-01", "superseded"),
            _claim("new", "2026-06-01", "correct"),
        ],
        relations=[
            Relation(from_id="mid", to_id="old", type="supersedes"),
            Relation(from_id="new", to_id="old", type="supersedes"),
        ],
    )
    timeline = build_group_timeline(group)
    assert timeline["old"].valid_until == date(2026, 3, 1)


def test_superseding_claim_with_unparseable_date_does_not_set_valid_until():
    group = ClaimGroup(
        id="g",
        domain="test",
        subject="test",
        description="test",
        claims=[_claim("old", "2026-05-01", "superseded"), _claim("new", "undated", "correct")],
        relations=[Relation(from_id="new", to_id="old", type="supersedes")],
    )
    timeline = build_group_timeline(group)
    assert timeline["old"].valid_until is None
    assert timeline["old"].is_current  # can't prove it's superseded without a date


def test_build_dataset_timelines_covers_every_claim_group():
    dataset = load_trust_eval_dataset()
    timelines = build_dataset_timelines(dataset)
    assert set(timelines) == {group.id for group in dataset.claim_groups}
    for group in dataset.claim_groups:
        assert set(timelines[group.id]) == {c.id for c in group.claims}


def test_real_dataset_read_interval_as_of_before_and_after_the_spec():
    """The one real, human-legible bi-temporal query this dataset supports
    end to end: what did the corpus say the read interval was before vs.
    after the May 15 spec fixed it."""
    dataset = load_trust_eval_dataset()
    group = next(g for g in dataset.claim_groups if g.id == "nova_read_interval")
    timeline = build_dataset_timelines(dataset)["nova_read_interval"]

    before = as_of(group, timeline, date(2026, 5, 10))
    assert [c.id for c in before] == ["nri-1"]
    assert before[0].value == "hourly"

    after = as_of(group, timeline, date(2026, 6, 1))
    assert "nri-1" not in {c.id for c in after}
    assert any(c.value == "15 minutes" for c in after)
