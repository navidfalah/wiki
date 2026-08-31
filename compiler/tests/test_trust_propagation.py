from dataclasses import replace

import trust_propagation as tp
from trust_eval_dataset import Claim, ClaimGroup, Relation, load_trust_eval_dataset


def _claim(cid: str, source_path: str = "notes/example.md", source_type: str = "text", gold_label: str = "correct") -> Claim:
    return Claim(
        id=cid,
        source_path=source_path,
        source_type=source_type,
        date="2026-01-01",
        value="x",
        quote="x",
        gold_label=gold_label,
    )


def test_isolated_claim_with_no_relations_stays_near_prior():
    group = ClaimGroup(id="g", domain="test", subject="test", description="test", claims=[_claim("a")])
    result = tp.propagate_group_trust(group)
    # No relational evidence -> support is 0 -> sigmoid(0) = 0.5, so the
    # blended score sits between the prior and the neutral midpoint.
    assert 0.0 <= result["a"].score <= 1.0
    assert result["a"].prior == 0.5  # text, "notes/" doesn't match any samples/**/dummy-test/** rule


def test_corroboration_raises_score_above_prior():
    group = ClaimGroup(
        id="g",
        domain="test",
        subject="test",
        description="test",
        claims=[_claim("a"), _claim("b")],
        relations=[Relation(from_id="b", to_id="a", type="corroborates")],
    )
    result = tp.propagate_group_trust(group)
    assert result["a"].score > result["a"].prior


def test_contradiction_lowers_score_symmetrically_on_both_sides():
    group = ClaimGroup(
        id="g",
        domain="test",
        subject="test",
        description="test",
        claims=[_claim("a"), _claim("b")],
        relations=[Relation(from_id="a", to_id="b", type="contradicts")],
    )
    result = tp.propagate_group_trust(group)
    assert result["a"].score < result["a"].prior
    assert result["b"].score < result["b"].prior
    # Symmetric edge, identical priors -> identical outcome for both sides.
    assert result["a"].score == result["b"].score


def test_supersedes_penalizes_only_the_superseded_claim():
    group = ClaimGroup(
        id="g",
        domain="test",
        subject="test",
        description="test",
        claims=[_claim("new"), _claim("old")],
        relations=[Relation(from_id="new", to_id="old", type="supersedes")],
    )
    result = tp.propagate_group_trust(group)
    assert result["old"].score < result["old"].prior
    assert result["new"].score >= result["new"].prior
    assert result["new"].score > result["old"].score


def test_all_scores_stay_within_unit_interval_on_real_dataset():
    dataset = load_trust_eval_dataset()
    for group_scores in tp.propagate_dataset_trust(dataset).values():
        for claim_trust in group_scores.values():
            assert 0.0 <= claim_trust.score <= 1.0
            assert 0.0 <= claim_trust.prior <= 1.0


def test_propagation_output_covers_every_claim_id():
    dataset = load_trust_eval_dataset()
    result = tp.propagate_dataset_trust(dataset)
    for group in dataset.claim_groups:
        assert set(result[group.id]) == {c.id for c in group.claims}


def test_same_source_diverges_by_relational_context_not_just_prior():
    """nova_battery_cell_type/nbc-1 and nova_read_interval/nri-1 cite the
    *same* raw file (notes/2026-05-01-kickoff-notes.md, same source_type),
    so they share an identical static prior. The file is right about the
    battery cell and wrong about the read interval — a propagation
    algorithm has to diverge these from relational evidence alone, which is
    exactly what per-claim (not per-source) trust means."""
    dataset = load_trust_eval_dataset()
    result = tp.propagate_dataset_trust(dataset)

    nbc_1 = result["nova_battery_cell_type"]["nbc-1"]
    nri_1 = result["nova_read_interval"]["nri-1"]

    assert nbc_1.prior == nri_1.prior  # identical source -> identical static prior
    assert nbc_1.score > nri_1.score  # but very different relational evidence


def test_gold_label_never_affects_the_propagated_score():
    """Mutating gold_label (the only field this module must never read)
    should leave every computed score byte-for-byte identical."""
    dataset = load_trust_eval_dataset()
    baseline = tp.propagate_dataset_trust(dataset)

    mutated_groups = []
    for group in dataset.claim_groups:
        mutated_claims = [replace(c, gold_label="incorrect") for c in group.claims]
        mutated_groups.append(replace(group, claims=mutated_claims))
    mutated_dataset = replace(dataset, claim_groups=mutated_groups)

    mutated = tp.propagate_dataset_trust(mutated_dataset)

    for group_id, claims in baseline.items():
        for claim_id, claim_trust in claims.items():
            assert mutated[group_id][claim_id].score == claim_trust.score


def test_ranking_within_group_prefers_correct_over_superseded_claims_on_average():
    """A coarse ranking check on the real dataset's default config: within
    each group that has both labels, the average 'correct'-labeled score
    should beat the average 'superseded'-labeled score.

    This is intentionally a *mean* comparison, not "every correct claim
    outranks every superseded one" — nova_battery_cell_type's weakest
    'correct' claims (nbc-4/nbc-6) sit in samples/** and dummy-test/**,
    which data/source_trust.json marks unverified (prior 0), so with the
    shipped default weights they can end up scoring just below nbc-3
    (superseded, prior 0.5 since it isn't under one of those directories).
    That's a real, documented tension between the static prior and
    relational evidence — see PropagationConfig.prior_weight's docstring
    and documentation/21-trust-eval-dataset.md — not something to paper
    over with a stricter assertion here. Formal ranking-accuracy metrics
    and an alpha ablation belong to task #3."""
    dataset = load_trust_eval_dataset()
    result = tp.propagate_dataset_trust(dataset)

    for group in dataset.claim_groups:
        by_label: dict[str, list[float]] = {}
        for claim in group.claims:
            by_label.setdefault(claim.gold_label, []).append(result[group.id][claim.id].score)

        if "correct" in by_label and "superseded" in by_label:
            mean_correct = sum(by_label["correct"]) / len(by_label["correct"])
            mean_superseded = sum(by_label["superseded"]) / len(by_label["superseded"])
            assert mean_correct > mean_superseded, group.id


def test_ablation_zeroing_corroborate_weight_removes_the_boost():
    # A source under samples/** so the prior isn't the neutral 0.5 that
    # would mask whether the corroboration edge actually did anything.
    claims = [_claim("a", source_path="samples/a.txt"), _claim("b", source_path="samples/b.txt")]
    with_edge = ClaimGroup(
        id="g", domain="test", subject="test", description="test",
        claims=claims, relations=[Relation(from_id="b", to_id="a", type="corroborates")],
    )
    isolated = ClaimGroup(id="g", domain="test", subject="test", description="test", claims=claims[:1])

    boosted = tp.propagate_group_trust(with_edge)["a"].score
    zeroed = tp.propagate_group_trust(with_edge, config=tp.DEFAULT_CONFIG.with_overrides(corroborate_weight=0.0))["a"].score
    baseline = tp.propagate_group_trust(isolated)["a"].score

    assert boosted > zeroed
    assert zeroed == baseline
