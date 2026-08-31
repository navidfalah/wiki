import trust_propagation_eval as te
from trust_eval_dataset import load_trust_eval_dataset
from trust_propagation import DEFAULT_CONFIG


def test_static_baseline_config_reproduces_prior_exactly():
    """STATIC_BASELINE_CONFIG (prior_weight=1, supersede_decay=1) is meant
    to reproduce trust.py's current static-rule trust exactly, with no
    relational adjustment at all — the "existing system" this work compares
    against. score == prior for every claim confirms that's actually true,
    not just asserted in a comment."""
    dataset = load_trust_eval_dataset()
    from trust_propagation import propagate_dataset_trust

    propagated = propagate_dataset_trust(dataset, te.STATIC_BASELINE_CONFIG)
    for group_scores in propagated.values():
        for claim_trust in group_scores.values():
            assert claim_trust.score == claim_trust.prior


def test_full_default_beats_static_baseline_on_the_pilot_dataset():
    """The core result: propagation should outperform the static-rule
    baseline it extends, on both metrics, on the labeled dataset."""
    dataset = load_trust_eval_dataset()
    baseline = te.evaluate_config(dataset, te.STATIC_BASELINE_CONFIG, "baseline")
    full = te.evaluate_config(dataset, DEFAULT_CONFIG, "full_default")

    assert full.mean_precision_at_1 > baseline.mean_precision_at_1
    assert full.pooled_pairwise_accuracy > baseline.pooled_pairwise_accuracy


def test_no_supersession_ablation_hurts_pairwise_accuracy():
    """Supersession is the strongest single term in this dataset (several
    contradictions are expressed as explicit supersedes edges) — removing
    it should measurably hurt ranking accuracy relative to the full config."""
    dataset = load_trust_eval_dataset()
    full = te.evaluate_config(dataset, DEFAULT_CONFIG, "full_default")
    no_supersession = te.evaluate_config(
        dataset, DEFAULT_CONFIG.with_overrides(supersede_weight=0.0, supersede_decay=1.0), "no_supersession"
    )
    assert no_supersession.pooled_pairwise_accuracy < full.pooled_pairwise_accuracy


def test_run_ablation_covers_all_named_configs():
    dataset = load_trust_eval_dataset()
    reports = te.run_ablation(dataset)
    assert set(reports) == set(te.NAMED_ABLATIONS)
    for report in reports.values():
        assert report.pooled_pairwise_accuracy is not None
        assert 0.0 <= report.pooled_pairwise_accuracy <= 1.0


def test_prior_weight_sweep_is_monotonic_non_increasing_on_this_dataset():
    """Not a universal law of the algorithm — a property of this specific
    pilot dataset (heavily corroborated/contradicted claims dominate, so
    relying more on relational evidence and less on the static prior can
    only help or stay flat here). Documents the actual sweep result the
    prior_weight=0.2 default is based on."""
    dataset = load_trust_eval_dataset()
    values = [0.0, 0.2, 0.4, 0.6, 0.8, 1.0]
    sweep = te.sweep_prior_weight(dataset, values)

    accuracies = [report.pooled_pairwise_accuracy for _, report in sweep]
    assert all(a is not None for a in accuracies)
    assert accuracies == sorted(accuracies, reverse=True)
    # The static extreme (prior_weight=1.0) should be the worst point.
    assert accuracies[-1] == min(accuracies)


def test_group_result_returns_none_metrics_when_no_bad_claims_present():
    """meshsync_relay_battery_drain_root_cause has zero superseded/incorrect/
    disputed claims — precision@1/pairwise accuracy are undefined there, and
    should report None rather than a misleadingly perfect 1.0."""
    dataset = load_trust_eval_dataset()
    report = te.evaluate_config(dataset, DEFAULT_CONFIG, "full_default")
    dispute_free = next(
        g for g in report.group_results if g.group_id == "meshsync_relay_battery_drain_root_cause"
    )
    assert dispute_free.n_bad == 0
    assert dispute_free.precision_at_1 is None
    assert dispute_free.pairwise_accuracy is None
    assert dispute_free not in report.informative_groups


def test_simulate_isolated_claim_shows_a_bad_claim_scoring_higher_when_cut_off_from_evidence():
    """The concrete answer to 'does an entity-resolution error upstream
    compound into a worse trust score': nri-1 is a superseded (bad) claim
    whose low score depends entirely on its contradicts/supersedes edges.
    Wrongly isolating it (what a false-negative entity merge would cause,
    per export_claim_group()'s cross-group edge dropping) removes that
    evidence, so it should score noticeably *higher* once isolated -- a
    bad claim looking more trustworthy after the simulated error, not
    less, which is the whole point of naming this as a real risk."""
    dataset = load_trust_eval_dataset()
    report = te.simulate_isolated_claim(dataset, "nova_read_interval", "nri-1")

    assert report.gold_label == "superseded"
    assert report.score_when_wrongly_isolated > report.score_when_correctly_grouped
    assert report.score_delta > 0.1  # not a rounding-noise difference


def test_simulate_isolated_claim_isolated_score_is_prior_only():
    """With zero relations, propagate_group_trust has nothing to blend
    with the prior -- the isolated score should equal exactly what
    trust.resolve_trust()'s static prior alone assigns this claim's
    source (propagate_group_trust never reads gold_label, only
    source_path/source_type -- see its own docstring)."""
    from trust import load_trust_config
    from trust_propagation import _prior_score

    dataset = load_trust_eval_dataset()
    group = next(g for g in dataset.claim_groups if g.id == "nova_read_interval")
    claim = next(c for c in group.claims if c.id == "nri-1")

    report = te.simulate_isolated_claim(dataset, "nova_read_interval", "nri-1")
    expected_prior = _prior_score(claim, load_trust_config())
    assert report.score_when_wrongly_isolated == expected_prior
