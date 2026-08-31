# 28 — Faithfulness Evaluation for Chat Answers

`rag_engine.answer_question()` (docs [20](./20-email-resources-and-chat-engines.md),
[25](./25-hybrid-retrieval.md)) returns one of two answer modes, and they
need to be evaluated for faithfulness in two completely different ways —
this module does both, and is explicit about which one is actually possible
without a live model.

| | |
|---|---|
| Module | `compiler/faithfulness_eval.py` |
| Tests | `compiler/tests/test_faithfulness_eval.py` |
| Offline proxy (no model/network needed) | `compiler/faithfulness_heuristic.py`, `compiler/tests/test_faithfulness_heuristic.py` |

## Two modes, two kinds of guarantee

**`mode: "extractive"` is faithful by construction.** Reading
`rag_engine.answer_question()`'s extractive branch: the answer is built
entirely from `f"**{title} — {heading}**\n{snippet}"` blocks, where
`snippet` is the retrieved passage's own text (optionally truncated to 400
characters with a trailing `…`). No token of that answer is generated —
it's a formatting operation over already-retrieved text. That's provable by
re-parsing the answer and checking each snippet against the corpus,
purely structurally, with no LLM judge and no API key:
`is_extractive_answer_verbatim()` does exactly that, and
`evaluate_extractive_faithfulness()` runs it over a batch of queries.

**Real result, no API key needed** (reusing `retrieval_eval_dataset.py`'s 8
hand-labeled queries against a small compiled-doc corpus built from
`data/trust_eval_dataset.json`'s claims):

```
verbatim=8/8 (1.00)
```

This isn't a sample measurement that happened to come out at 1.00 — it's
structurally guaranteed to be 1.00 for any query that reaches extractive
mode, because the extractive branch cannot produce ungrounded text; the
only way this number could be less than 1.00 is a bug in
`rag_engine.py`'s snippet-formatting code itself; the test suite's
`test_evaluate_extractive_faithfulness_on_a_real_corpus` and
`is_extractive_answer_verbatim()`'s dedicated unit tests are what actually
guard against that regressing.

**`mode: "generated"` has no such guarantee.** A chat model asked to write
a new answer from retrieved context can add a detail the context doesn't
support — the exact failure `extraction_critic.py`
([24](./24-extraction-critic.md)) targets in wiki *synthesis*; this module
targets the same failure in wiki *chat*. Checking it requires a second
model acting as an NLI-style judge (`judge_faithfulness()`,
`FAITHFULNESS_JUDGE_SYSTEM_PROMPT`): given the source passages actually
retrieved for a query and the model's answer, does the judge consider every
factual claim in the answer entailed by those passages. Like
`extraction_critic.py`'s critic and `hybrid_retrieval.py`'s reranker, a
malformed judge response degrades to "not faithful" with `parse_error` set
rather than being silently counted as a pass or crashing the harness.

## Running it

```bash
cd compiler
python faithfulness_eval.py   # extractive tier: no key needed
                               # generated tier: needs OPENAI_API_KEY
```

Not run against a live model in this environment — no key is configured
here. The script prints the extractive-mode result (real, shown above) and
then either the generated-mode hallucination rate or a clear skip message,
same pattern as `extraction_critic_eval.py` / `retrieval_eval.py`'s
embeddings tiers. `evaluate_generated_faithfulness()`'s mechanics (running
`answer_question()` in generated mode, then judging each answer against the
same passages `retrieve_hybrid()` actually retrieved for it) are fully
exercised in `test_evaluate_generated_faithfulness_end_to_end` with a fake
model, so the harness itself is validated even though its real-model
numbers aren't in this document yet.

## What's still missing

**No generated-mode hallucination rate exists yet** — same honest gap as
task #4's critic-quality numbers and task #5's hybrid/reranked retrieval
numbers, all blocked on the same missing `OPENAI_API_KEY` in this
environment. The obvious workaround — run a small model locally instead of
calling a paid API — was tried and is also blocked: `docker/local-llm/`
runs `llama-cpp-python`'s server against a downloaded GGUF file, and
downloading one requires reaching `huggingface.co`, which this session's
egress policy explicitly denies (`403`, policy denial, confirmed via
`curl $HTTPS_PROXY/__agentproxy/status`, not a transient failure). Per that
proxy's own guidance, a reported organizational block isn't something to
route around, so this genuinely cannot be closed in this environment —
stated plainly rather than worked around with an unauthorized download
path. Once a key or an unblocked network path is available, running
`faithfulness_eval.py` (and growing its query set, or building a dedicated
hand-labeled faithfulness dataset the way `data/trust_eval_dataset.json`
was built for trust) is what should replace this paragraph with real
numbers — and would let the `extraction_critic.py` pass and the
faithfulness judge be compared directly: does stripping ungrounded
sentences from synthesized *pages* (task #4) also reduce the hallucination
rate of *chat answers* built from those same pages, or are they independent
failure modes?

## An offline proxy signal, run for real (not blocked)

Rather than leave the "is any of this actually grounded" question entirely
unanswered a fourth time, `faithfulness_heuristic.py` implements a
technique the RAG-evaluation literature documents as a legitimate — if
weaker — fallback: lexical (content-word) overlap between a piece of
generated text and its cited sources, the same shape as the D-RAG
Evaluator's "Unsupported Sentence Ratio" and the "cheap heuristic
pre-filter before an LLM judge" pattern described in current RAG-evaluation
writeups. It needs no model and no network, so — unlike everything above —
it was actually run, against real content: the 174 wiki pages already
committed under `wiki-app/docs/`, generated by an earlier session that had
live API access, each carrying a self-reported `## Sources` file list.

**Real, computed result** (`python faithfulness_heuristic.py`, 173 pages
with a Sources section, 4340 checkable sentences):

```
checkable sentences=4340  flagged (below threshold)=1931  flagged_rate=44.49%
```

**Read this number carefully — it is not a hallucination rate.** Spot-checking
the worst-scoring page, `hardware-engineering.md` (100% flagged, single
source `notes/TEST-slack-dump.txt`), against its actual source shows why:
the source is a four-line, terse Slack log —

```
mira: nova widget beta boards arrived
jonah: meshsync pairing still flaky on 3-node mesh
mira: senseNode teardown blog says our IP54 is weak
jonah: fix before demo. firmware sprint this week.
```

— and the synthesized page formalizes it into full prose ("Beta boards for
the 'Nova Widget' have been received, marking a significant milestone in
its development cycle and indicating readiness for further testing and
validation."). Every fact checks out against the source. Almost none of the
*vocabulary* survives the formalization, so the sentence scores 27% support
and gets flagged. This is exactly the false-positive mode the literature
review named going in (pure lexical overlap "misses errors that leave
surface overlap intact" and, symmetrically, flags correct paraphrases) —
`tests/test_faithfulness_heuristic.py::test_score_text_against_sources_known_paraphrase_false_positive`
locks this specific case in as a regression test, not a bug to fix, because
it's the honest, documented shape of the tool.

A cleaner page, `aurora-nova-widget.md` (six real sources, numeric-claim-dense
prose), scores 25% flagged rather than 100% — and within that page, the
sentences carrying concrete numbers or named entities ("CR2032 battery,
with a nominal capacity of 220mAh" — 80% support) consistently score higher
than abstract or inferential ones ("They are distinct products from
different companies, utilizing separate applications." — 14% support, but
plausibly still true). That's the actual, defensible signal this tool
provides: **within a page, it reliably ranks concrete/numeric claims above
abstract/paraphrased ones** — useful for triaging which sentences are worth
a human or LLM critic's attention first — but the **absolute flagged-rate
number should not be read as an error rate**, because register/vocabulary
mismatch between casual source notes and formal generated prose dominates
it. `python faithfulness_heuristic.py`'s own output leads with the ranking
(worst pages first) rather than the aggregate percentage for this reason.

## Next

- [24-extraction-critic.md](./24-extraction-critic.md) — the same "requires a live model to measure, mechanism-tested without one" pattern applied to wiki synthesis instead of chat
- [20](./20-email-resources-and-chat-engines.md) / [25](./25-hybrid-retrieval.md) — `answer_question()` and `retrieve_hybrid()`, what this module evaluates
