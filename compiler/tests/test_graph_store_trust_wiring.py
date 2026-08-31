"""Tests for graph_store.py <-> trust_propagation.py wiring:
import_claim_group()/export_claim_group() round-tripping, and
propagate_group_trust_from_store() matching propagate_group_trust() exactly.
"""

from graph_store import GraphStore, export_claim_group, import_claim_group
from trust import load_trust_config
from trust_eval_dataset import Claim, ClaimGroup, Relation, load_trust_eval_dataset
from trust_propagation import DEFAULT_CONFIG, propagate_group_trust, propagate_group_trust_from_store


def _claim(cid: str, **overrides) -> Claim:
    defaults = dict(
        id=cid,
        source_path=f"notes/{cid}.md",
        source_type="text",
        date="2026-01-01",
        value="x",
        quote=f"quote for {cid}",
        gold_label="correct",
        note="",
    )
    defaults.update(overrides)
    return Claim(**defaults)


def test_export_claim_group_returns_none_for_unknown_group(tmp_path):
    store = GraphStore(tmp_path / "graph.sqlite")
    assert export_claim_group(store, "nope") is None


def test_import_then_export_round_trips_a_synthetic_group(tmp_path):
    group = ClaimGroup(
        id="g1",
        domain="test",
        subject="Test subject",
        description="Test description",
        claims=[_claim("a", value="15 minutes"), _claim("b", value="hourly", gold_label="superseded", note="old")],
        relations=[Relation(from_id="a", to_id="b", type="supersedes")],
    )
    store = GraphStore(tmp_path / "graph.sqlite")
    import_claim_group(store, group)

    exported = export_claim_group(store, "g1")
    assert exported is not None
    assert exported.id == "g1"
    assert exported.domain == "test"
    assert exported.subject == "Test subject"
    assert exported.description == "Test description"
    assert {c.id for c in exported.claims} == {"a", "b"}

    exported_b = next(c for c in exported.claims if c.id == "b")
    assert exported_b.value == "hourly"
    assert exported_b.gold_label == "superseded"
    assert exported_b.note == "old"

    assert len(exported.relations) == 1
    assert exported.relations[0] == Relation(from_id="a", to_id="b", type="supersedes")


def test_export_claim_group_drops_edges_pointing_outside_the_group(tmp_path):
    store = GraphStore(tmp_path / "graph.sqlite")
    import_claim_group(
        store,
        ClaimGroup(id="g1", domain="t", subject="t", description="t", claims=[_claim("a")]),
    )
    import_claim_group(
        store,
        ClaimGroup(id="g2", domain="t", subject="t", description="t", claims=[_claim("b")]),
    )
    # An edge that (hypothetically) crosses groups — not produced by
    # import_claim_group itself, but the store doesn't forbid it.
    store.add_edge("a", "b", "corroborates")

    exported_g1 = export_claim_group(store, "g1")
    assert exported_g1.relations == []


def test_import_claim_group_persists_every_group_from_the_real_pilot_dataset(tmp_path):
    dataset = load_trust_eval_dataset()
    store = GraphStore(tmp_path / "graph.sqlite")
    for group in dataset.claim_groups:
        import_claim_group(store, group)

    for group in dataset.claim_groups:
        exported = export_claim_group(store, group.id)
        assert exported is not None
        assert {c.id for c in exported.claims} == {c.id for c in group.claims}
        assert len(exported.relations) == len(group.relations)


def test_propagate_group_trust_from_store_matches_in_memory_exactly_on_real_dataset(tmp_path):
    dataset = load_trust_eval_dataset()
    store = GraphStore(tmp_path / "graph.sqlite")
    for group in dataset.claim_groups:
        import_claim_group(store, group)

    trust_cfg = load_trust_config()
    for group in dataset.claim_groups:
        direct = propagate_group_trust(group, DEFAULT_CONFIG, trust_cfg)
        via_store = propagate_group_trust_from_store(store, group.id, DEFAULT_CONFIG, trust_cfg)
        assert via_store is not None
        for claim_id, claim_trust in direct.items():
            assert via_store[claim_id].score == claim_trust.score
            assert via_store[claim_id].prior == claim_trust.prior


def test_propagate_group_trust_from_store_returns_none_for_missing_group(tmp_path):
    store = GraphStore(tmp_path / "graph.sqlite")
    assert propagate_group_trust_from_store(store, "does-not-exist") is None


def test_wiring_survives_a_fresh_store_instance(tmp_path):
    """The graph is actually persisted to disk, not just held in the
    Python object — a new GraphStore pointed at the same file sees it."""
    db_path = tmp_path / "graph.sqlite"
    group = ClaimGroup(id="g1", domain="t", subject="t", description="t", claims=[_claim("a")])
    import_claim_group(GraphStore(db_path), group)

    reopened_store = GraphStore(db_path)
    result = propagate_group_trust_from_store(reopened_store, "g1")
    assert result is not None
    assert "a" in result
