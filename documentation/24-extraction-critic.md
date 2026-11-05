# 24 — Extraction Critic (Grounded Synthesis)

A second, optional LLM pass over each synthesized wiki page, added to catch
a different failure mode than the trust-propagation work (docs
[21](./21-trust-eval-dataset.md)–[23](./23-trust-propagation-evaluation.md)):
trust propagation asks "how much should we believe a *source*"; the critic
asks "did the model *inventing the wiki page* just make something up that
isn't in any source at all."

| | |
|---|---|
| Module | `backend/src/lib/researchOptions.js` (`critic()`) |
| Eval fixtures + hook-driven runner | `compiler/extractionCriticEval.js` |
| Fixture tests | `backend/src/lib/extractionCriticEval.test.js` |
| Integration point | `synthesizer.synthesize_topic_wiki_pages(..., apply_critic=True)` |
| Enable it | `node compiler/main.js --critic-pass` or `WIKI_CRITIC_PASS=true` |

## The problem

`synthesize_topic_wiki_pages()` asks an LLM to write a full wiki page from a
set of raw source chunks in a single call (`WIKI_PAGE_SYSTEM_PROMPT`).
Nothing stops that model from adding a plausible-sounding detail that isn't
actually in any chunk — a specific version number, a date, an attribution
to the wrong person, a metric nobody measured. The deterministic
References & Trust table (`backend/src/lib/trust.js`) that gets appended afterward lists
*where the page's content came from*, but it can't tell you whether every
sentence in the body is actually supported by those sources.

## Design

`review_draft_for_grounding(source_text, draft_body, llm)` makes one
additional LLM call per page: given the same source chunk text the first
pass saw, plus the draft it produced, the critic returns JSON naming every
sentence that asserts something the sources don't support
(`CRITIC` prompt in `researchOptions.js`). The compiler applies the critic result
then strips every flagged sentence it can match **verbatim** in the draft —
deliberately conservative: a sentence the critic paraphrased instead of
quoting exactly is left in place (`removed=False` on the `FlaggedSentence`)
rather than guessed at, because a wrong removal (deleting a correct
sentence due to a fuzzy match) is worse than a missed one.

If every sample is malformed, the JS critic leaves the draft unchanged and
returns `parseError: true`, so a critic hiccup can't take down the compile.

**Opt-in, not default.** It roughly doubles the LLM cost of the synthesis
step (one extra full-page call), so it's wired through as an explicit flag
(`--critic-pass` / `WIKI_CRITIC_PASS=true`) rather than silently changed
behavior for existing users — same pattern as `--force`.

## Self-consistency (optional, off by default)

`review_draft_for_grounding(..., samples=3)` (and `apply_critic_pass(...,
samples=3)` / `main.js --critic-samples 3`) runs the critic call multiple
times at a non-zero `sample_temperature` instead of once at `temperature=0`,
and only flags a sentence a **majority** of the independent passes agreed
on — the standard self-consistency pattern for reducing an LLM judge's
flakiness on a single noisy sample.

**What this does and doesn't protect against, stated plainly.**
Self-consistency catches *random* flakiness — a pass that misreads a source
excerpt or hallucinates a flag this one time, outvoted by the other
samples. It does **not** catch a *systematic* bias the model repeats on
every sample: if the critic model has a consistent blind spot (e.g. it
reliably fails to flag fabricated dates specifically, or reliably
over-flags a phrasing pattern it misreads as unsupported), sampling it
three times just returns the same wrong answer three times, and the
majority vote confirms the bias with false confidence rather than
correcting it. This isn't a hypothetical caveat — a 2026 study on
self-consistency and cross-model agreement found that agreement across
samples correlates with confidence, not correctness, when the underlying
error is shared rather than random. Practically: `samples=3` is worth
enabling once the live-model eval (below) shows the critic has noisy,
inconsistent judgment on borderline cases; it is not a substitute for that
eval, and it would not be expected to fix a systematic hallucination-type
the critic reliably misses on every pass.

## Bounded regenerate loop (optional, off by default)

A second literature-motivated gap, closed: the critic pass by default only
*strips* flagged sentences — it never asks the model to try again. Self-RAG
and Corrective RAG both regenerate (or re-retrieve) when grounding fails,
rather than just deleting the offending content; a page that loses a fifth
of its length to stripping can end up with dangling transitions or a
section that no longer reads coherently.

`synthesize_topic_wiki_pages(..., critic_regenerate=True)` (also
`main.js --critic-regenerate` / `WIKI_CRITIC_REGENERATE=true`) adds exactly
one bounded retry: `extraction_critic.should_regenerate()` checks whether
stripping removed more than 20% of the draft's length (configurable via
`critic_regenerate_threshold`); if so,
`extraction_critic.build_regeneration_feedback()` turns the critic's
flagged sentences and reasons into "do not repeat these claims" guidance,
appended to the system prompt for one fresh synthesis call, which is then
critiqued again. The retry is **bounded to one attempt** — this doesn't
loop until clean, it tries once with better guidance and accepts whatever
comes back, to keep the worst-case cost predictable (at most one extra
synthesis call *and* one extra critic call per page, only on pages that
needed it).

**Off by default**, layered on top of `--critic-pass` (itself off by
default) and `--critic-samples` (also off by default) — three independent
opt-ins, each adding real LLM cost, each explicit rather than assumed.
Mechanism-tested end to end in
`backend/src/lib/compilerEngine.test.ts`'s heavy-flagging regeneration case
via a `FakeHeavyHallucinationLLM` that returns a heavily-fabricated first
draft, a clean regenerated draft once it sees the "do not repeat" feedback,
and a matching critic response for each — no live model, same honest
mechanism-vs-judgment-quality split as the rest of this document.

## Two-tier evaluation

Same split as the rest of this project's LLM-touching code (see
`AGENTS.md`/README: "the compiler is LLM-only"): the parts that don't need
a live model are tested now; the parts that do are set up to run whenever
API access is available, not simulated.

**Mechanism (tested without a live API key):** `backend/src/lib/researchOptions.test.ts`
uses a fake model to verify majority voting and malformed-response fallback;
`backend/src/lib/compilerEngine.test.ts` checks that the compiler applies
the critic and regeneration settings.

**Judgment quality (requires a live model, not run automatically):**
`extractionCriticEval.js` holds four hand-authored fixtures in the Aurora
Labs/MeshSync voice — three with an injected hallucination (a fabricated
firmware version, a fabricated date+attribution, a fabricated field-test
metric) mixed into otherwise-grounded sentences, and one fully-grounded
negative control so precision is measurable, not just recall. Run it with:

```bash
cd compiler
`evaluateFixtures(reviewFn)` accepts the configured critic as a callback; the
fixtures themselves are checked offline by Vitest.
```

It reports precision/recall of flagged sentences against the hand-labeled
expectations. Without a key it prints a message and exits cleanly rather
than failing — verified by
`backend/src/lib/extractionCriticEval.test.js` structural checks on the fixture
corpus itself (every expected substring actually appears in its fixture's
draft, flagged/clean expectations don't contradict each other, at least one
negative control exists).

## Honest limitation

**No numbers exist yet for how good the critic actually is** — this
environment has no `OPENAI_API_KEY`, so live critic quality has
never been run against a real model. That is explicitly named here rather
than implied away: the mechanism is validated, the judgment quality is not.
Running it (and, ideally, growing the fixture corpus past four hand-picked
examples the same way `data/trust_eval_dataset.json` grew from 24 to 29
claims — see [21](./21-trust-eval-dataset.md)) is the natural next step
once API access is available — at that point the precision/recall numbers
belong in this document, replacing this paragraph. It's also the natural
place to try `samples=3` (see "Self-consistency" above) against the same
fixtures, to see whether it measurably changes precision/recall versus the
single-pass default and, ideally, whether any residual errors are the
random-flakiness kind self-consistency can fix or the systematic kind it
can't — right now that comparison is only possible in principle, not run.

## Next

- [21-trust-eval-dataset.md](./21-trust-eval-dataset.md) / [22](./22-trust-propagation-algorithm.md) / [23](./23-trust-propagation-evaluation.md) — the related but distinct trust-propagation work
- `backend/src/lib/compilerEngine.js` — `WIKI_PAGE_SYSTEM_PROMPT` and `synthesize_topic_wiki_pages()`, what the critic pass runs after
- `backend/src/lib/trust.js` — the deterministic References & Trust section this pass complements (source-level trust) rather than replaces (sentence-level grounding)
