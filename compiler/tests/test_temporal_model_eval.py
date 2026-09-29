import temporal_model_eval as tme
from trust_eval_dataset import load_trust_eval_dataset


def test_evaluate_dataset_covers_every_group():
    dataset = load_trust_eval_dataset()
    reports = tme.evaluate_dataset(dataset)
    assert {r.group_id for r in reports} == {g.id for g in dataset.claim_groups}


def test_recall_is_perfect_in_every_group():
    """current_claims() should never wrongly exclude a GOOD-labeled claim —
    only ever miss catching a BAD one it doesn't have the graph structure
    to detect (precision can be < 1; recall shouldn't be)."""
    dataset = load_trust_eval_dataset()
    for report in tme.evaluate_dataset(dataset):
        if report.recall is not None:
            assert report.recall == 1.0, report.group_id


def test_precision_is_perfect_where_every_bad_claim_is_superseded():
    """Where every outdated claim is reachable from a supersedes edge
    (directly or through a claim it corroborates), nothing outdated is
    left as a current answer."""
    dataset = load_trust_eval_dataset()
    reports = {r.group_id: r for r in tme.evaluate_dataset(dataset)}
    for group_id in ("pv_capacity", "commissioning_date", "member_count", "module_type", "heat_pump_pilot"):
        assert reports[group_id].precision == 1.0, group_id


def test_incorrect_claims_are_a_known_gap():
    """A regression guard for the documented limitation: the temporal model
    only knows *when* a value was replaced. A claim that was wrong when it
    was written (the March flyer's 200-euro share price, the July FAQ's
    150 kWh battery) is contradicted, not superseded, so it stays
    "current". If this changes, documentation/27-temporal-modeling.md
    needs a matching update."""
    dataset = load_trust_eval_dataset()
    reports = {r.group_id: r for r in tme.evaluate_dataset(dataset)}
    assert "sp-3" in reports["share_price"].current_ids
    assert "bc-6" in reports["battery_capacity"].current_ids
    assert reports["share_price"].precision < 1.0
