from dataclasses import replace

import pytest

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
    assert 0.0 <= result["a"].score <= 1.0
    assert result["a"].prior == 0.5  # text, "notes/" doesn't match any samples/**/dummy-test/** rule


def test_isolated_claim_keeps_its_prior_exactly_untouched():
    """Regression: a claim with no relations at all used to still run
    through sigmoid(0)=0.5 and blend toward that neutral midpoint (e.g. a
    verified-source prior of 1.0 dropping to 0.6), contradicting the
    module's own docstring ("a claim with no relations at all just keeps
    its prior score untouched") and the prior_weight design comment above
    PropagationConfig. Uses a prior far from 0.5 (0.5 is a degenerate case
    where the old buggy blend happened to equal the prior by coincidence)
    to actually exercise the invariant."""
    group = ClaimGroup(id="g", domain="test", subject="test", description="test", claims=[_claim("a")])
    trust_cfg = {"version": 1, "default_by_source_type": {}, "rules": [{"pattern": "*", "level": "verified"}]}
    result = tp.propagate_group_trust(group, trust_cfg=trust_cfg)
    assert result["a"].prior == 1.0
    assert result["a"].score == 1.0
    assert result["a"].delta == 0.0


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


def test_ranking_within_group_prefers_correct_over_superseded_claims():
    """A ranking check on the real dataset's shipped default config
    (prior_weight=0.2, chosen via trust_propagation_eval.py's alpha sweep —
    see documentation/23-trust-propagation-evaluation.md): within every
    group that has both labels, even the *weakest* 'correct' claim should
    outscore the *strongest* 'superseded' claim. This is the same property
    an earlier, higher prior_weight (0.3) failed on for
    nova_battery_cell_type (its samples/**/dummy-test/** 'correct' claims,
    prior 0, could rank below a 'superseded' claim sourced elsewhere, prior
    0.5) — the eval-driven default resolves it. Finer-grained precision and
    per-term ablations live in trust_propagation_eval.py / task #3, not
    here; this is a smoke test that the shipped defaults behave correctly
    on the pilot dataset."""
    dataset = load_trust_eval_dataset()
    result = tp.propagate_dataset_trust(dataset)

    for group in dataset.claim_groups:
        by_label: dict[str, list[float]] = {}
        for claim in group.claims:
            by_label.setdefault(claim.gold_label, []).append(result[group.id][claim.id].score)

        if "correct" in by_label and "superseded" in by_label:
            assert min(by_label["correct"]) > max(by_label["superseded"]), group.id


def test_ablation_zeroing_corroborate_weight_removes_the_boost():
    # A source under samples/** so the prior isn't the neutral 0.5 that
    # would mask whether the corroboration edge actually did anything.
    claims = [_claim("a", source_path="samples/a.txt"), _claim("b", source_path="samples/b.txt")]
    with_edge = ClaimGroup(
        id="g", domain="test", subject="test", description="test",
        claims=claims, relations=[Relation(from_id="b", to_id="a", type="corroborates")],
    )

    boosted = tp.propagate_group_trust(with_edge)["a"].score
    zeroed = tp.propagate_group_trust(with_edge, config=tp.DEFAULT_CONFIG.with_overrides(corroborate_weight=0.0))["a"].score

    assert boosted > zeroed
    # "a" still HAS a corroborates relation here (just weighted to zero),
    # so it isn't the "no relations at all" case propagate_group_trust()
    # special-cases to keep the prior untouched -- it still goes through
    # the normal sigmoid(0)=0.5 blend, landing above its raw prior of 0.0.
    assert zeroed == pytest.approx(0.4)


def test_ablation_zeroing_corroborate_weight_differs_from_true_isolation():
    """A claim with a zeroed-out weight on a real edge is not the same as
    a claim with no relations at all: the former still blends toward the
    neutral sigmoid midpoint (0.5), the latter keeps its prior exactly."""
    claims = [_claim("a", source_path="samples/a.txt"), _claim("b", source_path="samples/b.txt")]
    with_edge = ClaimGroup(
        id="g", domain="test", subject="test", description="test",
        claims=claims, relations=[Relation(from_id="b", to_id="a", type="corroborates")],
    )
    isolated = ClaimGroup(id="g", domain="test", subject="test", description="test", claims=claims[:1])

    zeroed = tp.propagate_group_trust(with_edge, config=tp.DEFAULT_CONFIG.with_overrides(corroborate_weight=0.0))["a"]
    baseline = tp.propagate_group_trust(isolated)["a"]

    assert baseline.score == baseline.prior == 0.0
    assert zeroed.score != baseline.score
