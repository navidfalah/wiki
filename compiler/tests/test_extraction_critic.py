"""Mechanism tests for extraction_critic.py — prompt construction, JSON
parsing, sentence removal, and graceful fallback on a malformed critic
response. All driven by a FakeLLM, same pattern as
tests/test_multimedia_pipeline.py; no API key required.

What these tests do NOT cover: whether a real model is actually good at
spotting hallucinations. See extraction_critic_eval.py and
documentation/24-extraction-critic.md for that — it requires
OPENAI_API_KEY and is not run as part of this suite.
"""

from extraction_critic import CriticReport, apply_critic_pass, review_draft_for_grounding
from synthesizer import synthesize_topic_wiki_pages


class FakeCriticLLM:
    available = True

    def __init__(self, response: str):
        self.response = response
        self.calls: list[tuple[str, str]] = []

    def generate_response(self, prompt: str, system_prompt: str, temperature: float = 0.0) -> str:
        self.calls.append((prompt, system_prompt))
        return self.response


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

    def generate_response(self, prompt: str, system_prompt: str, temperature: float = 0.2) -> str:
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
