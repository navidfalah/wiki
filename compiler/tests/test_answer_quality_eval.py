import json

import pytest

import answer_quality_eval as aq
from qa_benchmark_eval import Question


def q(id="q1", category="fact", facts=(("171.6 kwp",),), answer="171.6 kWp."):
    return Question(id, category, "What is the peak power?", answer, [list(f) for f in facts], ["a.txt"], "kwp")


class ScriptedJudge:
    def __init__(self, *replies):
        self.replies = list(replies)
        self.prompts: list[tuple[str, str]] = []

    def generate_response(self, prompt, system_prompt, temperature=0.0):
        self.prompts.append((prompt, system_prompt))
        return self.replies.pop(0) if len(self.replies) > 1 else self.replies[0]


def verdict_json(label, reason="ok"):
    return json.dumps({"verdict": label, "reason": reason})


def answering(**by_source):
    """An answer_fn returning a fixed (mode, answer) per source."""

    def fn(question, *, llm=None, source="wiki"):
        mode, answer = by_source[source]
        return {"mode": mode, "answer": answer}

    return fn


# --- judge ---------------------------------------------------------------------


def test_judge_sees_question_reference_and_candidate_but_no_sources():
    judge = ScriptedJudge(verdict_json("correct"))
    v = aq.judge_answer("Q?", "the reference", "the candidate", judge)
    prompt, system = judge.prompts[0]
    assert v.label == "correct"
    assert "Q?" in prompt and "the reference" in prompt and "the candidate" in prompt
    assert "SOURCE" not in prompt
    assert "do not see any sources" in system


@pytest.mark.parametrize("label", ["correct", "partial", "incorrect", " Correct "])
def test_judge_accepts_each_label_case_insensitively(label):
    assert aq.judge_answer("q", "r", "c", ScriptedJudge(verdict_json(label))).label == label.strip().lower()


@pytest.mark.parametrize("reply", ["no json here", '{"verdict": ', '{"verdict": "maybe"}', "{}", '{"verdict": 3}'])
def test_unusable_judge_replies_have_no_label_and_say_why(reply):
    v = aq.judge_answer("q", "r", "c", ScriptedJudge(reply))
    assert v.label is None and v.parse_error


def test_judge_tolerates_prose_around_the_json():
    v = aq.judge_answer("q", "r", "c", ScriptedJudge('Sure!\n```json\n{"verdict": "partial", "reason": "one of two"}\n```'))
    assert (v.label, v.reason) == ("partial", "one of two")


# --- per question ----------------------------------------------------------------


def test_generated_answer_gets_fact_recall_and_a_verdict():
    gold = q(facts=(("171.6 kwp", "171,6 kwp"),))  # the benchmark lists acceptable phrasings
    rec = aq.evaluate_question(gold, "wiki", answering(wiki=("generated", "It is 171,6 kWp")), None, ScriptedJudge(verdict_json("correct")))
    assert rec.fact_recall == 1.0
    assert rec.verdict == "correct" and rec.mode == "generated"


def test_fact_recall_is_the_share_of_required_facts_present():
    two = q(facts=(("171.6 kwp",), ("100 kwh",)))
    rec = aq.evaluate_question(two, "wiki", answering(wiki=("generated", "Peak 171.6 kWp.")), None, ScriptedJudge(verdict_json("partial")))
    assert rec.fact_recall == 0.5


@pytest.mark.parametrize("mode", ["extractive", "no_match", "empty"])
def test_answers_that_were_not_generated_are_not_graded_and_the_judge_is_not_called(mode):
    judge = ScriptedJudge(verdict_json("correct"))
    rec = aq.evaluate_question(q(), "wiki", answering(wiki=(mode, "pasted passages 171.6 kWp")), None, judge)
    assert (rec.fact_recall, rec.verdict) == (None, None)
    assert judge.prompts == []


def test_judge_error_is_recorded_not_scored():
    rec = aq.evaluate_question(q(), "wiki", answering(wiki=("generated", "171.6 kWp")), None, ScriptedJudge("garbage"))
    assert rec.verdict is None and rec.judge_error and rec.fact_recall == 1.0


# --- summary ---------------------------------------------------------------------


def rec(id, verdict, recall, *, source="wiki", category="fact", mode="generated", error=None):
    return aq.AnswerRecord(id, category, source, mode, "a", recall, verdict, judge_error=error)


def test_summary_counts_and_never_counts_errors_or_ungenerated_as_wrong():
    records = [
        rec("1", "correct", 1.0),
        rec("2", "partial", 0.5),
        rec("3", "incorrect", 0.0),
        rec("4", None, 1.0, error="bad json"),
        rec("5", None, None, mode="extractive"),
        rec("6", "correct", 1.0, source="raw"),
    ]
    s = aq.summarize(records, "wiki")
    assert (s.questions, s.generated, s.not_generated, s.judged, s.judge_errors) == (5, 4, 1, 3, 1)
    assert (s.correct, s.partial, s.incorrect) == (1, 1, 1)
    assert s.accuracy == pytest.approx(1 / 3) and s.lenient_accuracy == pytest.approx(2 / 3)
    assert s.mean_fact_recall == pytest.approx((1.0 + 0.5 + 0.0 + 1.0) / 4)


def test_agreement_table_exposes_a_judge_that_disagrees_with_the_facts():
    records = [rec("1", "correct", 1.0), rec("2", "correct", 0.0), rec("3", "incorrect", 1.0), rec("4", "incorrect", 0.0)]
    assert aq.summarize(records, "wiki").agreement == {
        "correct/all_facts": 1,
        "correct/missing_facts": 1,
        "incorrect/all_facts": 1,
        "incorrect/missing_facts": 1,
    }


def test_by_category_breakdown():
    records = [rec("1", "correct", 1.0, category="fact"), rec("2", "incorrect", 0.0, category="contradiction")]
    by = aq.summarize(records, "wiki").by_category
    assert by["fact"]["accuracy"] == 1.0 and by["contradiction"]["accuracy"] == 0.0


def test_empty_summary_has_no_rates_instead_of_dividing_by_zero():
    s = aq.summarize([], "wiki")
    assert s.accuracy is None and s.lenient_accuracy is None and s.mean_fact_recall is None
    assert "n/a" in aq.format_summary(s)


# --- whole run ---------------------------------------------------------------------


def test_evaluate_runs_each_question_against_each_source_and_summarizes_each():
    questions = [q("a"), q("b")]
    fn = answering(wiki=("generated", "171.6 kWp"), raw=("extractive", "pasted"))
    records, summaries = aq.evaluate(questions, ("wiki", "raw"), None, ScriptedJudge(verdict_json("correct")), answer_fn=fn)
    assert [(r.id, r.source) for r in records] == [("a", "wiki"), ("b", "wiki"), ("a", "raw"), ("b", "raw")]
    wiki, raw = summaries
    assert (wiki.correct, wiki.accuracy) == (2, 1.0)
    assert (raw.generated, raw.accuracy) == (0, None)


def test_a_separate_judge_model_is_used_for_judging_only():
    calls = {"answer": 0}

    def fn(question, *, llm=None, source="wiki"):
        calls["answer"] += 1
        assert llm == "answerer"
        return {"mode": "generated", "answer": "171.6 kWp"}

    judge = ScriptedJudge(verdict_json("correct"))
    aq.evaluate([q()], ("wiki",), "answerer", judge, answer_fn=fn)
    assert calls["answer"] == 1 and len(judge.prompts) == 1


def test_output_json_round_trips():
    records, summaries = aq.evaluate([q()], ("wiki",), None, ScriptedJudge(verdict_json("correct")), answer_fn=answering(wiki=("generated", "171.6 kWp")))
    data = json.loads(json.dumps(aq.to_dict(records, summaries)))
    assert data["summaries"][0]["accuracy"] == 1.0 and data["records"][0]["verdict"] == "correct"


def test_main_refuses_without_a_configured_llm(monkeypatch, capsys):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("CHAT_OPENAI_API_KEY", raising=False)
    with pytest.raises(SystemExit):
        aq.main([])
    assert "needs a configured LLM" in capsys.readouterr().err


def test_main_runs_with_limit_and_writes_json(monkeypatch, tmp_path, capsys):
    import llm_client

    class Client:
        available = True

        @classmethod
        def for_purpose(cls, purpose):
            return cls()

    monkeypatch.setattr(llm_client, "LLMClient", Client)
    monkeypatch.setattr(aq, "load_benchmark", lambda: [q("a"), q("b"), q("c")])
    seen = {}

    def fake_evaluate(questions, sources, llm, judge_llm=None, *, answer_fn=None):
        seen["ids"] = [x.id for x in questions]
        seen["sources"] = sources
        seen["judge_differs"] = judge_llm is not llm
        return [], [aq.summarize([], s) for s in sources]

    monkeypatch.setattr(aq, "evaluate", fake_evaluate)
    out = tmp_path / "sub" / "r.json"
    assert aq.main(["--source", "wiki", "--limit", "2", "--out", str(out)]) == 0
    assert seen == {"ids": ["a", "b"], "sources": ("wiki",), "judge_differs": True}
    assert json.loads(out.read_text())["summaries"][0]["source"] == "wiki"
    assert "wrote" in capsys.readouterr().out
