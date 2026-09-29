"""Answer quality: does the chat give the *right* answer to the benchmark's
questions, from the wiki and from the raw sources?

qa_benchmark_eval.py scores retrieval (was the answer in front of the
model?). faithfulness_eval.py scores whether an answer is supported by what
was retrieved. Neither says whether the answer to the question is correct.
This does, for the 65 gold questions of data/qa_benchmark.json:

1. Generate an answer with rag_engine.answer_question(), for source="wiki"
   and source="raw". Only *generated* answers count: when no LLM is
   configured the chat falls back to pasting passages, which is not an
   answer to be graded (they are counted as `not_generated`).
2. Score it two ways, kept apart on purpose:
   - fact_recall (deterministic): the share of the question's required
     facts that appear in the answer, by the same matching the retrieval
     benchmark uses. Cheap and repeatable, but blind to paraphrase and to a
     right fact used the wrong way.
   - an LLM judge compares the answer with the gold reference answer and
     says correct / partial / incorrect. Handles paraphrase; is itself a
     model and can be wrong.
3. Report how the two agree. That table is the check on the judge: a judge
   that says "correct" while the required facts are missing, or "incorrect"
   while all are present, is where to look first.

The judge never sees the sources, only the question, the reference answer
and the candidate, so it cannot be fooled into grading against whatever
the retrieval happened to fetch. An unparsable verdict is counted as
`judge_errors` and left out of accuracy; it is never counted as wrong or
as right.

Needs an API key (answers and judgments are LLM calls) and is not
deterministic, so it is not part of eval_gate.py. Nothing has been run
against a real model in this repository yet; the tests use a scripted fake.
Use a judge model different from (and at least as strong as) the answering
model: a model grading its own output flatters it.

    python answer_quality_eval.py --source both --out data/answer_quality.json
    python answer_quality_eval.py --limit 10          # a cheap trial
    JUDGE_OPENAI_MODEL=... python answer_quality_eval.py   # judge on its own model
"""

from __future__ import annotations

import argparse
import json
import re
from collections import Counter
from collections.abc import Callable
from dataclasses import asdict, dataclass, field
from pathlib import Path

from qa_benchmark_eval import Question, facts_found, load_benchmark

LABELS = ("correct", "partial", "incorrect")

JUDGE_SYSTEM_PROMPT = """You grade answers to questions about a knowledge base.

You get a QUESTION, the REFERENCE ANSWER (established as correct) and a
CANDIDATE ANSWER. You do not see any sources; judge only against the
reference.

- "correct": the candidate gives the reference's substance. Different wording,
  extra correct context and other units or formats of the same value are fine.
- "partial": right in part: it gets some of what the reference requires
  (for example one of two values, or the value without the caveat that the
  reference treats as essential), or it is right but also asserts something
  that contradicts the reference.
- "incorrect": it gives a different answer, says it cannot answer, or does not
  address the question.

Judge substance, not style. Do not reward length. Return ONLY JSON:
{"verdict": "correct" | "partial" | "incorrect", "reason": "<one short sentence>"}"""


@dataclass(frozen=True)
class Verdict:
    label: str | None  # None when the judge's reply could not be used
    reason: str = ""
    parse_error: str | None = None


def judge_answer(question: str, reference: str, candidate: str, llm) -> Verdict:
    raw = llm.generate_response(
        f"QUESTION:\n{question}\n\nREFERENCE ANSWER:\n{reference}\n\nCANDIDATE ANSWER:\n{candidate}",
        JUDGE_SYSTEM_PROMPT,
        temperature=0.0,
    )
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if not match:
        return Verdict(None, parse_error="judge response did not contain JSON")
    try:
        data = json.loads(match.group())
    except json.JSONDecodeError as exc:
        return Verdict(None, parse_error=f"judge response was not valid JSON: {exc}")
    label = str(data.get("verdict", "")).strip().lower()
    if label not in LABELS:
        return Verdict(None, parse_error=f"unknown verdict {data.get('verdict')!r}")
    return Verdict(label, reason=str(data.get("reason", ""))[:300])


@dataclass
class AnswerRecord:
    id: str
    category: str
    source: str
    mode: str  # generated | extractive | no_match | empty
    answer: str
    fact_recall: float | None  # None when the answer was not generated
    verdict: str | None
    reason: str = ""
    judge_error: str | None = None


def evaluate_question(q: Question, source: str, answer_fn: Callable, llm, judge_llm) -> AnswerRecord:
    result = answer_fn(q.question, llm=llm, source=source)
    mode = result.get("mode", "")
    answer = str(result.get("answer", ""))
    if mode != "generated":
        return AnswerRecord(q.id, q.category, source, mode, answer, None, None)
    recall = facts_found(q.facts, answer) / len(q.facts)
    verdict = judge_answer(q.question, q.answer, answer, judge_llm)
    return AnswerRecord(q.id, q.category, source, mode, answer, recall, verdict.label, verdict.reason, verdict.parse_error)


@dataclass
class SourceSummary:
    source: str
    questions: int
    generated: int
    not_generated: int
    judged: int
    judge_errors: int
    correct: int
    partial: int
    incorrect: int
    mean_fact_recall: float | None
    by_category: dict[str, dict[str, float | int | None]] = field(default_factory=dict)
    # judge label x whether every required fact is in the answer
    agreement: dict[str, int] = field(default_factory=dict)

    @property
    def accuracy(self) -> float | None:
        return self.correct / self.judged if self.judged else None

    @property
    def lenient_accuracy(self) -> float | None:
        """Correct or partial: the share of answers that are at least partly right."""
        return (self.correct + self.partial) / self.judged if self.judged else None


def summarize(records: list[AnswerRecord], source: str) -> SourceSummary:
    rows = [r for r in records if r.source == source]
    generated = [r for r in rows if r.mode == "generated"]
    judged = [r for r in generated if r.verdict is not None]
    counts = Counter(r.verdict for r in judged)
    recalls = [r.fact_recall for r in generated if r.fact_recall is not None]

    agreement = Counter()
    for r in judged:
        facts_ok = r.fact_recall == 1.0
        agreement[f"{r.verdict}/{'all_facts' if facts_ok else 'missing_facts'}"] += 1

    by_category: dict[str, dict[str, float | int | None]] = {}
    for category in sorted({r.category for r in rows}):
        cat_judged = [r for r in judged if r.category == category]
        cat_recalls = [r.fact_recall for r in generated if r.category == category and r.fact_recall is not None]
        by_category[category] = {
            "judged": len(cat_judged),
            "accuracy": (sum(r.verdict == "correct" for r in cat_judged) / len(cat_judged)) if cat_judged else None,
            "mean_fact_recall": (sum(cat_recalls) / len(cat_recalls)) if cat_recalls else None,
        }
    return SourceSummary(
        source=source,
        questions=len(rows),
        generated=len(generated),
        not_generated=len(rows) - len(generated),
        judged=len(judged),
        judge_errors=len(generated) - len(judged),
        correct=counts["correct"],
        partial=counts["partial"],
        incorrect=counts["incorrect"],
        mean_fact_recall=(sum(recalls) / len(recalls)) if recalls else None,
        by_category=by_category,
        agreement=dict(sorted(agreement.items())),
    )


def evaluate(
    questions: list[Question],
    sources: tuple[str, ...],
    llm,
    judge_llm=None,
    *,
    answer_fn: Callable | None = None,
) -> tuple[list[AnswerRecord], list[SourceSummary]]:
    if answer_fn is None:
        import rag_engine

        answer_fn = rag_engine.answer_question
    judge_llm = judge_llm or llm
    records = [evaluate_question(q, source, answer_fn, llm, judge_llm) for source in sources for q in questions]
    return records, [summarize(records, s) for s in sources]


def to_dict(records: list[AnswerRecord], summaries: list[SourceSummary]) -> dict:
    return {
        "summaries": [{**asdict(s), "accuracy": s.accuracy, "lenient_accuracy": s.lenient_accuracy} for s in summaries],
        "records": [asdict(r) for r in records],
    }


def _pct(value: float | None) -> str:
    return "n/a" if value is None else f"{value:.1%}"


def format_summary(s: SourceSummary) -> str:
    lines = [
        f"{s.source}: {s.questions} questions, {s.generated} generated answers"
        + (f" ({s.not_generated} not generated: no LLM answer to grade)" if s.not_generated else ""),
        f"  judged {s.judged}" + (f" ({s.judge_errors} judge errors, excluded)" if s.judge_errors else ""),
        f"  correct {s.correct}  partial {s.partial}  incorrect {s.incorrect}",
        f"  accuracy {_pct(s.accuracy)}  at least partly right {_pct(s.lenient_accuracy)}  mean fact recall {_pct(s.mean_fact_recall)}",
    ]
    for category, c in s.by_category.items():
        lines.append(f"  {category:14s} judged {c['judged']:3d}  accuracy {_pct(c['accuracy'])}  fact recall {_pct(c['mean_fact_recall'])}")
    if s.agreement:
        lines.append("  judge vs required facts: " + ", ".join(f"{k} {v}" for k, v in s.agreement.items()))
    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--source", choices=("wiki", "raw", "both"), default="both")
    parser.add_argument("--limit", type=int, default=0, help="only the first N questions (a cheap trial)")
    parser.add_argument("--out", type=Path, help="write summaries and every answer as JSON")
    args = parser.parse_args(argv)

    from llm_client import LLMClient

    llm = LLMClient.for_purpose("chat")
    if not llm.available:
        parser.error("needs a configured LLM to answer and to judge (see documentation/13-configuration.md)")
    judge = LLMClient.for_purpose("judge")
    questions = load_benchmark()
    if args.limit:
        questions = questions[: args.limit]
    sources = ("wiki", "raw") if args.source == "both" else (args.source,)

    records, summaries = evaluate(questions, sources, llm, judge)
    for s in summaries:
        print(format_summary(s) + "\n")
    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(json.dumps(to_dict(records, summaries), indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"wrote {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
