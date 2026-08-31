import pytest

from synthesizer import RawChunk, extract_chunk_topics
from active_learning import (
    Correction,
    ReviewCandidate,
    correction_from_candidate,
    load_corrections,
    render_fewshot_block,
    save_correction,
    select_review_candidates,
    select_review_candidates_for_dataset,
)
from trust_eval_dataset import Claim, ClaimGroup, Relation, load_trust_eval_dataset
from trust_propagation import ClaimTrust


def _claim(cid: str, quote: str = "quote text") -> Claim:
    return Claim(
        id=cid,
        source_path=f"notes/{cid}.md",
        source_type="text",
        date="2026-01-01",
        value="x",
        quote=quote,
        gold_label="correct",
    )


def _trust(cid: str, score: float) -> ClaimTrust:
    return ClaimTrust(claim_id=cid, prior=score, score=score, delta=0.0, trust_level="medium")


def test_select_review_candidates_flags_low_confidence_claims():
    group = ClaimGroup(id="g", domain="t", subject="t", description="t", claims=[_claim("a"), _claim("b")])
    scores = {"a": _trust("a", 0.1), "b": _trust("b", 0.9)}
    candidates = select_review_candidates(group, scores)
    assert [c.claim_id for c in candidates] == ["a"]
    assert candidates[0].reason == "low_confidence"


def test_select_review_candidates_flags_unresolved_contradictions():
    group = ClaimGroup(
        id="g",
        domain="t",
        subject="t",
        description="t",
        claims=[_claim("a"), _claim("b")],
        relations=[Relation(from_id="a", to_id="b", type="contradicts")],
    )
    scores = {"a": _trust("a", 0.5), "b": _trust("b", 0.52)}  # within margin -> unresolved
    candidates = select_review_candidates(group, scores)
    reasons = {c.claim_id: c.reason for c in candidates}
    assert reasons == {"a": "unresolved_contradiction", "b": "unresolved_contradiction"}


def test_select_review_candidates_does_not_flag_a_resolved_contradiction():
    group = ClaimGroup(
        id="g",
        domain="t",
        subject="t",
        description="t",
        claims=[_claim("a"), _claim("b")],
        relations=[Relation(from_id="a", to_id="b", type="contradicts")],
    )
    scores = {"a": _trust("a", 0.9), "b": _trust("b", 0.1)}  # clearly resolved, both below/above threshold anyway
    candidates = select_review_candidates(group, scores, low_confidence_threshold=0.0)
    assert candidates == []


def test_select_review_candidates_low_confidence_takes_priority_over_duplicate_contradiction_entry():
    group = ClaimGroup(
        id="g",
        domain="t",
        subject="t",
        description="t",
        claims=[_claim("a"), _claim("b")],
        relations=[Relation(from_id="a", to_id="b", type="contradicts")],
    )
    scores = {"a": _trust("a", 0.1), "b": _trust("b", 0.15)}  # both low AND contradictory
    candidates = select_review_candidates(group, scores)
    assert {c.claim_id for c in candidates} == {"a", "b"}


def test_select_review_candidates_sorted_by_score_ascending():
    group = ClaimGroup(id="g", domain="t", subject="t", description="t", claims=[_claim("a"), _claim("b"), _claim("c")])
    scores = {"a": _trust("a", 0.05), "b": _trust("b", 0.02), "c": _trust("c", 0.9)}
    candidates = select_review_candidates(group, scores)
    assert [c.claim_id for c in candidates] == ["b", "a"]


def test_select_review_candidates_for_dataset_runs_end_to_end_on_the_real_dataset():
    dataset = load_trust_eval_dataset()
    candidates = select_review_candidates_for_dataset(dataset.claim_groups)
    assert candidates  # this pilot dataset has real disputes; should flag something
    assert all(isinstance(c, ReviewCandidate) for c in candidates)
    # the deliberately dispute-free cluster should never appear
    assert all(c.group_id != "meshsync_relay_battery_drain_root_cause" for c in candidates)


def test_correction_rejects_unknown_verdict():
    with pytest.raises(ValueError, match="Unknown verdict"):
        Correction(claim_id="a", group_id="g", verdict="nonsense", note="x", quote_excerpt="x")


def test_correction_from_candidate_carries_the_quote():
    candidate = ReviewCandidate(
        claim_id="a", group_id="g", reason="low_confidence", score=0.1, quote="the original quote", source_path="a.md"
    )
    correction = correction_from_candidate(candidate, "confirm_correct", "verified against the spec")
    assert correction.claim_id == "a"
    assert correction.quote_excerpt == "the original quote"
    assert correction.verdict == "confirm_correct"


def test_save_and_load_corrections_round_trips(tmp_path):
    path = tmp_path / "corrections.json"
    c1 = Correction(claim_id="a", group_id="g", verdict="confirm_correct", note="n1", quote_excerpt="q1")
    save_correction(c1, path)

    loaded = load_corrections(path)
    assert len(loaded) == 1
    assert loaded[0].claim_id == "a"


def test_save_correction_deduplicates_by_claim_id(tmp_path):
    path = tmp_path / "corrections.json"
    save_correction(Correction(claim_id="a", group_id="g", verdict="confirm_correct", note="first", quote_excerpt="q"), path)
    save_correction(
        Correction(claim_id="a", group_id="g", verdict="confirm_incorrect", note="changed my mind", quote_excerpt="q"), path
    )

    loaded = load_corrections(path)
    assert len(loaded) == 1
    assert loaded[0].verdict == "confirm_incorrect"
    assert loaded[0].note == "changed my mind"


def test_load_corrections_returns_empty_list_for_missing_file(tmp_path):
    assert load_corrections(tmp_path / "does-not-exist.json") == []


def test_load_corrections_returns_empty_list_for_malformed_json(tmp_path):
    path = tmp_path / "corrections.json"
    path.write_text("not json", encoding="utf-8")
    assert load_corrections(path) == []


def test_render_fewshot_block_empty_for_no_corrections():
    assert render_fewshot_block([]) == ""


def test_render_fewshot_block_includes_quote_verdict_and_note():
    correction = Correction(
        claim_id="a", group_id="g", verdict="confirm_superseded", note="fixed in the 0.3.9 changelog", quote_excerpt="the old hourly claim"
    )
    block = render_fewshot_block([correction])
    assert "the old hourly claim" in block
    assert "confirm_superseded" in block
    assert "fixed in the 0.3.9 changelog" in block
    assert "human review" in block.lower()


class FakeExtractionLLM:
    available = True

    def __init__(self):
        self.calls: list[tuple[str, str]] = []

    def generate_response(self, prompt: str, system_prompt: str) -> str:
        self.calls.append((prompt, system_prompt))
        return '{"topics": ["MeshSync"], "entities": [], "concepts": []}'


def test_extract_chunk_topics_includes_fewshot_corrections_when_provided():
    llm = FakeExtractionLLM()
    chunk = RawChunk(source_path="notes/x.md", chunk_index=0, text="some text", source_type="text")
    correction = Correction(
        claim_id="a", group_id="g", verdict="confirm_superseded", note="see changelog", quote_excerpt="hourly default"
    )
    block = render_fewshot_block([correction])

    extract_chunk_topics(chunk, llm, extra_system_context=block)
    _prompt, system_prompt = llm.calls[0]
    assert "hourly default" in system_prompt
    assert "confirm_superseded" in system_prompt


def test_extract_chunk_topics_without_corrections_leaves_prompt_unchanged():
    llm = FakeExtractionLLM()
    chunk = RawChunk(source_path="notes/x.md", chunk_index=0, text="some text", source_type="text")

    extract_chunk_topics(chunk, llm)
    _prompt, system_prompt = llm.calls[0]
    assert "human review" not in system_prompt.lower()
