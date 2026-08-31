"""Mechanism tests for extraction_critic.py — prompt construction, JSON
parsing, sentence removal, and graceful fallback on a malformed critic
response. All driven by a FakeLLM, same pattern as
tests/test_multimedia_pipeline.py; no API key required.

What these tests do NOT cover: whether a real model is actually good at
spotting hallucinations. See extraction_critic_eval.py and
documentation/24-extraction-critic.md for that — it requires
OPENAI_API_KEY and is not run as part of this suite.
"""

from extraction_critic import (
    CriticReport,
    apply_critic_pass,
    build_regeneration_feedback,
    review_draft_for_grounding,
    should_regenerate,
)
from synthesizer import synthesize_topic_wiki_pages


class FakeCriticLLM:
    available = True

    def __init__(self, response: str):
        self.response = response
        self.calls: list[tuple[str, str]] = []

    def generate_response(self, prompt: str, system_prompt: str, temperature: float = 0.0) -> str:
        self.calls.append((prompt, system_prompt))
        return self.response


class FakeSequenceCriticLLM:
    """Returns a different canned response on each successive call — for
    testing self-consistency sampling, where each pass should be an
    independent (simulated) sample rather than a repeat of the same call."""

    available = True

    def __init__(self, responses: list[str]):
        self.responses = list(responses)
        self.calls: list[tuple[str, str, float]] = []

    def generate_response(self, prompt: str, system_prompt: str, temperature: float = 0.0) -> str:
        self.calls.append((prompt, system_prompt, temperature))
        return self.responses[len(self.calls) - 1]


SOURCE = "Mira reported the read interval is 15 minutes per the current firmware default."
DRAFT_CLEAN = "# MeshSync\n\nThe default read interval is 15 minutes."
DRAFT_WITH_HALLUCINATION = (
    "# MeshSync\n\n"
    "The default read interval is 15 minutes. "
    "The fix shipped in firmware version 4.2.0 released on March 3rd."
)


def test_review_returns_no_flags_when_critic_reports_none():
    llm = FakeCriticLLM('{"flagged": []}')
    report = review_draft_for_grounding(SOURCE, DRAFT_CLEAN, llm)
    assert report.is_clean
    assert report.flagged == []
    assert report.parse_error is None


def test_review_parses_flagged_sentences():
    llm = FakeCriticLLM(
        '{"flagged": [{"sentence": "The fix shipped in firmware version 4.2.0 released on March 3rd.", '
        '"reason": "no version number or date given in the source"}]}'
    )
    report = review_draft_for_grounding(SOURCE, DRAFT_WITH_HALLUCINATION, llm)
    assert not report.is_clean
    assert len(report.flagged) == 1
    assert report.flagged[0].reason == "no version number or date given in the source"
    assert report.flagged[0].removed is True  # sentence appears verbatim in the draft


def test_review_handles_malformed_json_without_raising():
    llm = FakeCriticLLM("I think everything looks fine!")
    report = review_draft_for_grounding(SOURCE, DRAFT_CLEAN, llm)
    assert report.parse_error is not None
    assert report.flagged == []
    assert not report.is_clean  # a parse failure is not the same as "clean"


def test_review_handles_flagged_field_of_wrong_type():
    llm = FakeCriticLLM('{"flagged": "not a list"}')
    report = review_draft_for_grounding(SOURCE, DRAFT_CLEAN, llm)
    assert report.parse_error is not None
    assert report.flagged == []


def test_review_skips_llm_call_on_empty_inputs():
    llm = FakeCriticLLM('{"flagged": []}')
    review_draft_for_grounding("", DRAFT_CLEAN, llm)
    review_draft_for_grounding(SOURCE, "   ", llm)
    assert llm.calls == []


def test_apply_critic_pass_removes_flagged_sentence_verbatim():
    llm = FakeCriticLLM(
        '{"flagged": [{"sentence": "The fix shipped in firmware version 4.2.0 released on March 3rd.", '
        '"reason": "fabricated version/date"}]}'
    )
    cleaned, report = apply_critic_pass(SOURCE, DRAFT_WITH_HALLUCINATION, llm)
    assert "firmware version 4.2.0" not in cleaned
    assert "The default read interval is 15 minutes." in cleaned
    assert len(report.flagged) == 1
    assert report.flagged[0].removed


def test_apply_critic_pass_leaves_body_unchanged_when_clean():
    llm = FakeCriticLLM('{"flagged": []}')
    cleaned, report = apply_critic_pass(SOURCE, DRAFT_CLEAN, llm)
    assert cleaned == DRAFT_CLEAN
    assert report.is_clean


def test_apply_critic_pass_does_not_guess_at_a_paraphrased_flag():
    """If the critic paraphrases instead of quoting verbatim, the sentence
    can't be safely matched and removed — better to leave it in place and
    report removed=False than risk deleting the wrong text."""
    llm = FakeCriticLLM(
        '{"flagged": [{"sentence": "This is not verbatim text from the draft.", "reason": "x"}]}'
    )
    cleaned, report = apply_critic_pass(SOURCE, DRAFT_WITH_HALLUCINATION, llm)
    assert cleaned == DRAFT_WITH_HALLUCINATION  # unchanged: nothing matched
    assert report.flagged[0].removed is False


def test_apply_critic_pass_on_malformed_response_leaves_draft_untouched():
    llm = FakeCriticLLM("not json at all")
    cleaned, report = apply_critic_pass(SOURCE, DRAFT_WITH_HALLUCINATION, llm)
    assert cleaned == DRAFT_WITH_HALLUCINATION
    assert report.parse_error is not None


def test_critic_prompt_includes_source_and_draft():
    llm = FakeCriticLLM('{"flagged": []}')
    review_draft_for_grounding(SOURCE, DRAFT_CLEAN, llm)
    prompt, system_prompt = llm.calls[0]
    assert SOURCE in prompt
    assert DRAFT_CLEAN in prompt
    assert "fact-checking critic" in system_prompt.lower()


class FakeSynthesisAndCriticLLM:
    """Branches on system_prompt like tests/test_multimedia_pipeline.py's
    FakeLLM does — one fake stands in for both the wiki-author call and the
    critic call synthesize_topic_wiki_pages(apply_critic=True) makes."""

    available = True

    def __init__(self):
        self.calls: list[tuple[str, str]] = []

    def generate_response(self, prompt: str, system_prompt: str, temperature: float = 0.2) -> str:
        self.calls.append((prompt, system_prompt))
        if "fact-checking critic" in system_prompt.lower():
            return (
                '{"flagged": [{"sentence": "It was fixed in version 9.9.9.", '
                '"reason": "no version number in the source chunks"}]}'
            )
        return (
            "---\n"
            "id: meshsync\n"
            "title: MeshSync\n"
            "tags:\n  - wiki\n"
            "last_updated: 2026-01-01T00:00:00+00:00\n"
            "---\n\n"
            "# MeshSync\n\n"
            "## Overview\nThe relay radio drains the battery faster than spec. "
            "It was fixed in version 9.9.9.\n"
        )


class FakeHeavyHallucinationLLM:
    """Simulates a first draft that's mostly fabricated (heavily flagged by
    the critic), a regeneration call once told what to avoid, and a clean
    second draft the critic approves -- exercises the full
    critic_regenerate=True loop end to end."""

    available = True

    FABRICATED = (
        "It shipped in firmware version 9.9.9 on a date nobody recorded, fixing an "
        "issue nobody filed, per an engineer nobody named."
    )
    GROUNDED = "The relay radio drains the battery faster than spec."
    REGENERATED = "The relay radio drains the battery faster than spec, per the field report."

    def __init__(self):
        self.calls: list[tuple[str, str]] = []
        self._critic_calls = 0

    def generate_response(self, prompt: str, system_prompt: str, temperature: float = 0.2) -> str:
        self.calls.append((prompt, system_prompt))
        if "fact-checking critic" in system_prompt.lower():
            self._critic_calls += 1
            if self._critic_calls == 1:
                return f'{{"flagged": [{{"sentence": "{self.FABRICATED}", "reason": "unsupported"}}]}}'
            return '{"flagged": []}'
        if "do not repeat" in system_prompt.lower():
            return self._page(self.REGENERATED)
        return self._page(f"{self.GROUNDED} {self.FABRICATED}")

    def _page(self, body_sentence: str) -> str:
        return (
            "---\nid: meshsync\ntitle: MeshSync\ntags:\n  - wiki\n"
            "last_updated: 2026-01-01T00:00:00+00:00\n---\n\n"
            f"# MeshSync\n\n## Overview\n{body_sentence}\n"
        )


def test_synthesize_topic_wiki_pages_regenerates_after_heavy_flagging(tmp_path):
    grouped = {
        "MeshSync": [
            {
                "source": "notes/meshsync.md",
                "source_type": "text",
                "chunk_index": 0,
                "text": "The relay radio drains the battery faster than spec.",
            }
        ]
    }
    out_dir = tmp_path / "out"
    llm = FakeHeavyHallucinationLLM()
    written, _skipped = synthesize_topic_wiki_pages(
        grouped, llm=llm, output_dir=out_dir, apply_critic=True, critic_regenerate=True
    )
    body = written[0].read_text(encoding="utf-8")
    assert "9.9.9" not in body
    assert llm.REGENERATED in body
    # 4 calls: initial synthesis, critic (flags heavily), regenerated
    # synthesis, critic again (clean) -- the full bounded retry loop.
    assert len(llm.calls) == 4


def test_synthesize_topic_wiki_pages_does_not_regenerate_when_disabled(tmp_path):
    grouped = {
        "MeshSync": [
            {
                "source": "notes/meshsync.md",
                "source_type": "text",
                "chunk_index": 0,
                "text": "The relay radio drains the battery faster than spec.",
            }
        ]
    }
    out_dir = tmp_path / "out"
    llm = FakeHeavyHallucinationLLM()
    written, _skipped = synthesize_topic_wiki_pages(
        grouped, llm=llm, output_dir=out_dir, apply_critic=True, critic_regenerate=False
    )
    body = written[0].read_text(encoding="utf-8")
    assert "9.9.9" not in body  # still stripped by the plain critic pass
    assert llm.REGENERATED not in body  # but no regeneration happened
    assert len(llm.calls) == 2  # initial synthesis + one critic pass, no retry


def test_synthesize_topic_wiki_pages_with_critic_strips_flagged_sentence(tmp_path):
    grouped = {
        "MeshSync": [
            {
                "source": "notes/meshsync.md",
                "source_type": "text",
                "chunk_index": 0,
                "text": "The relay radio drains the battery faster than spec.",
            }
        ]
    }
    out_dir = tmp_path / "out"
    written, _skipped = synthesize_topic_wiki_pages(
        grouped, llm=FakeSynthesisAndCriticLLM(), output_dir=out_dir, apply_critic=True
    )
    assert len(written) == 1
    body = written[0].read_text(encoding="utf-8")
    assert "version 9.9.9" not in body
    assert "drains the battery faster than spec" in body


def test_synthesize_topic_wiki_pages_without_critic_keeps_everything(tmp_path):
    grouped = {
        "MeshSync": [
            {
                "source": "notes/meshsync.md",
                "source_type": "text",
                "chunk_index": 0,
                "text": "The relay radio drains the battery faster than spec.",
            }
        ]
    }
    out_dir = tmp_path / "out"
    written, _skipped = synthesize_topic_wiki_pages(
        grouped, llm=FakeSynthesisAndCriticLLM(), output_dir=out_dir, apply_critic=False
    )
    body = written[0].read_text(encoding="utf-8")
    assert "version 9.9.9" in body  # critic never ran, nothing was stripped


def test_review_draft_for_grounding_appends_extra_system_context():
    llm = FakeCriticLLM('{"flagged": []}')
    review_draft_for_grounding(
        SOURCE, DRAFT_CLEAN, llm, extra_system_context="PRIOR CORRECTION: don't invent version numbers."
    )
    _prompt, system_prompt = llm.calls[0]
    assert "don't invent version numbers" in system_prompt


def test_apply_critic_pass_forwards_extra_system_context():
    llm = FakeCriticLLM('{"flagged": []}')
    apply_critic_pass(SOURCE, DRAFT_CLEAN, llm, extra_system_context="PRIOR CORRECTION: be careful.")
    _prompt, system_prompt = llm.calls[0]
    assert "be careful" in system_prompt


def test_synthesize_topic_wiki_pages_forwards_extra_system_context_to_synthesis_and_critic(tmp_path):
    grouped = {
        "MeshSync": [
            {
                "source": "notes/meshsync.md",
                "source_type": "text",
                "chunk_index": 0,
                "text": "The relay radio drains the battery faster than spec.",
            }
        ]
    }
    out_dir = tmp_path / "out"
    llm = FakeSynthesisAndCriticLLM()
    synthesize_topic_wiki_pages(
        grouped,
        llm=llm,
        output_dir=out_dir,
        apply_critic=True,
        extra_system_context="PRIOR CORRECTION: watch for invented version numbers.",
    )
    # Every call's system_prompt (synthesis, then critic) should carry the context.
    assert len(llm.calls) >= 2
    for _prompt, system_prompt in llm.calls:
        assert "watch for invented version numbers" in system_prompt


FLAGGED_RESPONSE = (
    '{"flagged": [{"sentence": '
    '"The fix shipped in firmware version 4.2.0 released on March 3rd.", '
    '"reason": "no version or date in source"}]}'
)
CLEAN_RESPONSE = '{"flagged": []}'


def test_self_consistency_default_is_a_single_deterministic_call():
    llm = FakeSequenceCriticLLM([CLEAN_RESPONSE])
    review_draft_for_grounding(SOURCE, DRAFT_CLEAN, llm)
    assert len(llm.calls) == 1
    assert llm.calls[0][2] == 0.0  # temperature


def test_self_consistency_majority_flags_sentence_two_of_three():
    llm = FakeSequenceCriticLLM([FLAGGED_RESPONSE, FLAGGED_RESPONSE, CLEAN_RESPONSE])
    report = review_draft_for_grounding(SOURCE, DRAFT_WITH_HALLUCINATION, llm, samples=3)
    assert len(llm.calls) == 3
    assert all(temp != 0.0 for *_rest, temp in llm.calls)  # sampling uses a non-zero temperature
    assert len(report.flagged) == 1
    assert report.flagged[0].sentence == "The fix shipped in firmware version 4.2.0 released on March 3rd."


def test_self_consistency_minority_flag_is_not_reported():
    llm = FakeSequenceCriticLLM([FLAGGED_RESPONSE, CLEAN_RESPONSE, CLEAN_RESPONSE])
    report = review_draft_for_grounding(SOURCE, DRAFT_WITH_HALLUCINATION, llm, samples=3)
    assert report.is_clean


def test_self_consistency_custom_sample_temperature_is_used():
    llm = FakeSequenceCriticLLM([CLEAN_RESPONSE, CLEAN_RESPONSE])
    review_draft_for_grounding(SOURCE, DRAFT_CLEAN, llm, samples=2, sample_temperature=0.7)
    assert all(temp == 0.7 for *_rest, temp in llm.calls)


def test_self_consistency_tolerates_one_malformed_pass():
    llm = FakeSequenceCriticLLM(["not json at all", FLAGGED_RESPONSE, FLAGGED_RESPONSE])
    report = review_draft_for_grounding(SOURCE, DRAFT_WITH_HALLUCINATION, llm, samples=3)
    # Majority is computed over the 2 successfully-parsed passes, both of
    # which flagged the sentence — so it should still be flagged.
    assert len(report.flagged) == 1


def test_self_consistency_all_passes_malformed_reports_parse_error():
    llm = FakeSequenceCriticLLM(["garbage", "also garbage"])
    report = review_draft_for_grounding(SOURCE, DRAFT_CLEAN, llm, samples=2)
    assert report.parse_error is not None
    assert report.flagged == []


def test_apply_critic_pass_forwards_samples_to_review():
    llm = FakeSequenceCriticLLM([FLAGGED_RESPONSE, FLAGGED_RESPONSE])
    cleaned, report = apply_critic_pass(SOURCE, DRAFT_WITH_HALLUCINATION, llm, samples=2)
    assert len(llm.calls) == 2
    assert "released on March 3rd" not in cleaned
    assert len(report.flagged) == 1


def test_should_regenerate_true_when_a_lot_was_stripped():
    original = "A" * 100
    cleaned = "A" * 70  # 30% removed
    assert should_regenerate(original, cleaned, threshold=0.2) is True


def test_should_regenerate_false_when_little_was_stripped():
    original = "A" * 100
    cleaned = "A" * 95  # 5% removed
    assert should_regenerate(original, cleaned, threshold=0.2) is False


def test_should_regenerate_false_on_empty_original():
    assert should_regenerate("", "", threshold=0.2) is False


def test_build_regeneration_feedback_empty_when_nothing_flagged():
    assert build_regeneration_feedback(CriticReport()) == ""


def test_build_regeneration_feedback_lists_flagged_sentences_and_reasons():
    report = review_draft_for_grounding(SOURCE, DRAFT_WITH_HALLUCINATION, FakeCriticLLM(
        '{"flagged": [{"sentence": "The fix shipped in firmware version 4.2.0 released on March 3rd.", '
        '"reason": "no version or date in source"}]}'
    ))
    feedback = build_regeneration_feedback(report)
    assert "The fix shipped in firmware version 4.2.0 released on March 3rd." in feedback
    assert "no version or date in source" in feedback
