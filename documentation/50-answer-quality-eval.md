# 50 — Answer Quality Evaluation (LLM-judged)

Three evaluations already look at the chat from different sides:

| Doc | Question it answers |
|---|---|
| 44 | Was the answer *retrievable*? (context recall, source hit) |
| 28 | Is the answer *supported by what was retrieved*? (faithfulness) |
| 50 | Is the answer *correct*? |

`compiler/answer_quality_eval.py` covers the last one for the 65 questions
of `data/qa_benchmark.json`, once over the wiki and once over the raw
sources, which puts a number on what compiling adds to the answers and not
only to retrieval.

**Status: built and tested with a scripted fake model. Not yet run against
a real model, so this repository has no answer-quality results.** Do not
quote a figure from it before that run exists.

```bash
cd compiler
python answer_quality_eval.py --limit 10                     # a cheap trial
python answer_quality_eval.py --source both --out ../data/answer_quality.json
```

## Method

1. `rag_engine.answer_question()` writes an answer for each question and
   source. Only *generated* answers are graded. Without an LLM, chat pastes
   passages, and that isn't an answer to grade; those are counted as
   `not_generated` and stay out of every rate.
2. Two scores, kept apart:
   - **fact recall** (deterministic): the share of the question's required
     facts present in the answer (same matcher as doc 44). Repeatable,
     blind to paraphrase.
   - **judge verdict**: an LLM compares the answer with the gold reference
     and returns *correct*, *partial* or *incorrect*. Handles paraphrase; is
     a model and can be wrong.
3. **Agreement table** (`correct/all_facts`, `correct/missing_facts`,
   `incorrect/all_facts`, `incorrect/missing_facts`): the way to check the
   judge without human labels. The two off-diagonal cells are where to read
   the answers first. Either the judge is off or the facts list lacks a
   phrasing.

## Choices that matter

- **The judge never sees the sources**, only question, reference answer and
  candidate, so it grades against what is known to be right, not against
  whatever retrieval fetched.
- **An unparsable verdict is a judge error**, excluded from accuracy and
  reported. It is never counted as right or wrong.
- **Use a different, at least as strong, judge model.** Set
  `JUDGE_OPENAI_MODEL` (and `JUDGE_OPENAI_API_KEY`/`_BASE_URL` if it is
  another provider). Purpose `judge` falls back to the default model, and a
  model grading its own answers flatters them.
- **Not part of the offline gate** (`eval_gate.py`): it needs a key, costs
  money and varies between runs. Run it by hand before and after a change to
  prompts, retrieval or models, and compare like with like.

## Output

Per source: questions, generated, not generated, judged, judge errors,
correct / partial / incorrect, accuracy, "at least partly right", mean fact
recall, a per-category breakdown (`fact`, `contradiction`, `multi_source`)
and the agreement table. `--out` also stores every answer with its verdict
and the judge's reason, for reading.

## Limits

- 65 questions over one small corpus: differences of a few points are noise.
  Report counts, not only percentages.
- The reference answers were written by the corpus author. Where a question
  has several defensible answers (the *contradiction* category), the judge
  is only as good as the reference.
- One answer per question; temperature is low but not zero, so repeat runs
  before trusting a small change.

## Files

`compiler/answer_quality_eval.py`, `compiler/tests/test_answer_quality_eval.py`
