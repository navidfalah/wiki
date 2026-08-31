import rag_engine
from faithfulness_eval import (
    evaluate_extractive_faithfulness,
    evaluate_generated_faithfulness,
    is_extractive_answer_verbatim,
    judge_faithfulness,
)


class FakeJudgeLLM:
    available = True

    def __init__(self, response: str):
        self.response = response
        self.calls: list[tuple[str, str]] = []

    def generate_response(self, prompt: str, system_prompt: str, temperature: float = 0.0) -> str:
        self.calls.append((prompt, system_prompt))
        return self.response


def test_judge_faithfulness_parses_a_faithful_verdict():
    llm = FakeJudgeLLM('{"faithful": true, "unsupported_claims": []}')
    verdict = judge_faithfulness("The read interval is 15 minutes.", "The read interval is 15 minutes.", llm)
    assert verdict.faithful
    assert verdict.unsupported_claims == []
    assert verdict.parse_error is None


def test_judge_faithfulness_parses_an_unfaithful_verdict():
    llm = FakeJudgeLLM(
        '{"faithful": false, "unsupported_claims": ["shipped in firmware version 4.2.0"]}'
    )
    verdict = judge_faithfulness("It shipped in firmware version 4.2.0.", "No version mentioned.", llm)
    assert not verdict.faithful
    assert verdict.unsupported_claims == ["shipped in firmware version 4.2.0"]


def test_judge_faithfulness_malformed_response_is_not_faithful():
    llm = FakeJudgeLLM("not json")
    verdict = judge_faithfulness("answer", "sources", llm)
    assert not verdict.faithful
    assert verdict.parse_error is not None


def test_judge_faithfulness_includes_sources_and_answer_in_prompt():
    llm = FakeJudgeLLM('{"faithful": true, "unsupported_claims": []}')
    judge_faithfulness("MY ANSWER", "MY SOURCES", llm)
    prompt, system_prompt = llm.calls[0]
    assert "MY ANSWER" in prompt
    assert "MY SOURCES" in prompt
    assert "faithfulness judge" in system_prompt.lower()


def _passage(title, heading, text):
    return rag_engine.Passage(doc_path=f"{title}.md", title=title, heading=heading, text=text, tokens=[])


def test_is_extractive_answer_verbatim_true_for_a_real_extractive_answer():
    corpus = [_passage("MeshSync", "Battery", "Relay radios drain batteries 30% faster than spec.")]
    answer = (
        "No LLM is configured, so here are the closest matches from the wiki:\n\n"
        "**MeshSync — Battery**\nRelay radios drain batteries 30% faster than spec."
    )
    assert is_extractive_answer_verbatim(answer, corpus)


def test_is_extractive_answer_verbatim_handles_truncated_snippet():
    long_text = "x" * 500
    corpus = [_passage("MeshSync", "Battery", long_text)]
    answer = f"**MeshSync — Battery**\n{long_text[:400]}…"
    assert is_extractive_answer_verbatim(answer, corpus)


def test_is_extractive_answer_verbatim_false_when_text_was_altered():
    corpus = [_passage("MeshSync", "Battery", "Relay radios drain batteries 30% faster than spec.")]
    answer = "**MeshSync — Battery**\nRelay radios drain batteries 90% faster than spec (fabricated)."
    assert not is_extractive_answer_verbatim(answer, corpus)


def test_is_extractive_answer_verbatim_false_for_no_snippet_blocks():
    assert not is_extractive_answer_verbatim("no snippet blocks here at all", [])


def _write_page(docs_dir, name, title, body):
    (docs_dir / name).write_text(f"---\ntitle: {title}\n---\n\n{body}\n", encoding="utf-8")


def test_evaluate_extractive_faithfulness_on_a_real_corpus(tmp_path):
    docs_dir = tmp_path / "docs"
    docs_dir.mkdir()
    _write_page(
        docs_dir,
        "meshsync.md",
        "MeshSync",
        "## Battery\n\nRelay radios drain batteries 30% faster than spec once relay mode is enabled.\n",
    )

    report = evaluate_extractive_faithfulness(["why do batteries drain fast"], docs_dir)
    assert report.total == 1
    assert report.verbatim_count == 1
    assert report.verbatim_rate == 1.0


def test_evaluate_extractive_faithfulness_skips_queries_with_no_match(tmp_path):
    docs_dir = tmp_path / "docs"
    docs_dir.mkdir()
    _write_page(docs_dir, "meshsync.md", "MeshSync", "## Battery\n\nRelay radios drain batteries.\n")

    report = evaluate_extractive_faithfulness(["zzz nonexistent qqq"], docs_dir)
    assert report.total == 0
    import math

    assert math.isnan(report.verbatim_rate)


class FakeGeneratingJudgeLLM:
    """available + embed_text + generate_response, branching on system
    prompt: answers questions in generated mode, then judges faithfulness
    when asked to."""

    available = True

    def embed_text(self, text: str) -> list[float]:
        return [float(text.lower().count("batter")), 0.0]

    def generate_response(self, prompt: str, system_prompt: str, temperature: float = 0.0) -> str:
        if "faithfulness judge" in system_prompt.lower():
            return '{"faithful": true, "unsupported_claims": []}'
        if "reranker" in system_prompt.lower():
            return "[1]"
        return "The relay radio drains the battery faster than spec."


def test_evaluate_generated_faithfulness_end_to_end(tmp_path):
    docs_dir = tmp_path / "docs"
    docs_dir.mkdir()
    _write_page(
        docs_dir,
        "meshsync.md",
        "MeshSync",
        "## Battery\n\nRelay radios drain batteries 30% faster than spec once relay mode is enabled.\n",
    )

    report = evaluate_generated_faithfulness(["why do batteries drain fast"], docs_dir, FakeGeneratingJudgeLLM())
    assert report.total == 1
    assert report.faithful_count == 1
    assert report.hallucination_rate == 0.0
