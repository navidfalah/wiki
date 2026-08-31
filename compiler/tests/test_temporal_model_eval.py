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


def test_precision_is_perfect_where_explicit_supersedes_edges_exist():
    """nova_read_interval and teabuddy_herbal_preset_timing both record
    their corrections as explicit supersedes edges (unlike
    nova_battery_cell_type's nbc-3, a known annotation gap documented in
    documentation/27-temporal-modeling.md) — precision should be perfect
    in both."""
    dataset = load_trust_eval_dataset()
    reports = {r.group_id: r for r in tme.evaluate_dataset(dataset)}
    assert reports["nova_read_interval"].precision == 1.0
    assert reports["teabuddy_herbal_preset_timing"].precision == 1.0


def test_battery_cell_type_precision_reflects_the_known_annotation_gap():
    """A regression guard for the documented finding itself: if this ever
    changes, either temporal_model.py's logic changed or
    data/trust_eval_dataset.json's nova_battery_cell_type relations were
    edited — either way, documentation/27-temporal-modeling.md needs a
    matching update, so this failing is a useful tripwire, not noise."""
    dataset = load_trust_eval_dataset()
    reports = {r.group_id: r for r in tme.evaluate_dataset(dataset)}
    report = reports["nova_battery_cell_type"]
    assert report.precision is not None and report.precision < 1.0
    assert "nbc-3" in report.current_ids  # the self-correcting claim, wrongly still "current"
