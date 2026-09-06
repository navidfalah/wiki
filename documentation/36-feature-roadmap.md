# 36 — Feature Roadmap: R&D Survey

An honest audit of what's actually built vs. wired vs. still a gap, done by
reading code — not just docs — since several `documentation/*.md` files
turned out to describe an earlier state than what's on disk. Two examples
found stale during this pass: doc 11 said the `/graph` force-directed
visualization "isn't ported" back from the Docusaurus era; it is —
`frontend/src/client/graph.ts` is a full `force-graph` implementation with
search, selection, and multi-format export. Doc 26 said entity resolution
"isn't yet wired" into the linker; `mechanical_linker.py` already calls
`resolve_entities()` (heuristic tier). Docs describe intent at the time
they were written; this survey re-checked each claim against the current
tree before ranking anything as a gap.

## Method

For each of the 34 prior `documentation/NN-*.md` modules, grepped the
actual call sites: is the module imported anywhere outside its own tests
and eval harness? If yes, wired and live. If no, it's a real, tested,
dormant capability — a gap worth ranking, not a doc-only claim.

## What's genuinely still a gap (ranked)

### 1. Review queue UI — done this session

See [35-review-queue-ui.md](./35-review-queue-ui.md).
`active_learning.select_review_candidates_for_dataset()` and
`save_correction()` existed and were tested, but nothing let a human
actually browse candidates and click a verdict — `data/review_corrections.json`
could only be populated by calling `save_correction()` from a script. Picked
first because it was the smallest, most precisely-scoped gap on the list —
doc 29 named the exact missing piece — and it closes a loop the dashboard
already half-exposes (the "Use review corrections" pipeline toggle existed
with nothing to toggle on until now).

### 2. External connectors: wire Gmail/Drive/IMAP into the app

`compiler/connectors/` (Gmail, Drive, IMAP, OAuth2 with PKCE, encrypted
credential storage, 73 tests) has **zero references** anywhere in
`backend/`, `frontend/`, or `cli.py` — confirmed by grep, not by trusting
doc 34's own "not wired in yet" note. This is the single largest dormant
feature in the repo: a real product capability (pull a Gmail thread or a
Drive doc straight into the wiki) sitting fully built behind zero UI.

**Why it's ranked below the review queue despite being higher-value:**
larger surface area (OAuth redirect/callback routes, a "connect an app"
dashboard screen, and — the part with no existing analog — an adapter
turning `Connector.list_items()`/`fetch_item()` output into the
`Passage`/raw-document shape `main.py`'s ingestion already consumes from
`data/raw/`), and it needs a real Google Cloud OAuth client to test past
the fake-based unit tests, which this environment doesn't have. Doc 34's
own "what a real wiring would still need" list is an accurate scope for
this task; nothing found here changes it.

### 3. Faithfulness score not surfaced in the live chat UI

`faithfulness_heuristic.py` (offline, no API key needed — task #8) and
`faithfulness_eval.py` (LLM-judge mode) are exercised only by
`compiler/tests/` and the eval harness; `rag_engine.py`'s live
`answer_question()` path never calls either. A chat answer today gives no
signal to the person reading it about how grounded it is. Wiring the
heuristic (extractive-mode answers are faithful by construction per doc
28; generated-mode answers could get a live heuristic score) into the
`/api/chat` response and rendering it as a small badge in `chat.ts` is
contained — one new field on an existing response shape, one UI badge —
and needs no external credentials to demo.

### 4. Entity resolution: heuristic tier only

`mechanical_linker.py` wires `resolve_entities()` but explicitly without
`embed_fn`/`llm` (see its own comment at the call site) — the
embedding and LLM adjudication tiers doc 26 built and evaluated are real
and tested but never reached from a live compile. A named, direct
follow-up in doc 26 itself. Medium effort: thread an `LLMClient` (already
constructed elsewhere in the pipeline) through to the mechanical linker's
call, behind an opt-in flag matching the `--critic-pass`/`--use-corrections`
convention.

### 5. Temporal model not wired into any live query path

`temporal_model.py`'s bi-temporal `as_of()` queries (task #7) are covered
by `temporal_model_eval.py` and tests only — no API route, no dashboard
surface, no pipeline step builds a live bi-temporal fact store from real
compiled claims. Doc 27 names a "self-corrected graph" as a follow-up in
the same spirit. Higher effort than it looks: needs a real adapter from
compiled pages/claims into the bi-temporal fact shape, not just an API
wrapper around existing eval fixtures.

### 6. Active learning against a live corpus, not just the pilot dataset

The review queue built this session (#1) runs against
`data/trust_eval_dataset.json`, same as doc 29's own demonstration. Doc 29
names the real next step explicitly: an adapter building a
claim-group-shaped graph from real `state.json` chunk extractions instead
of the pilot dataset. Deferred deliberately — it requires solving
"what counts as a claim, and which claims contradict each other" for
arbitrary compiled content, which doc 27/29 both treat as open, not a
small wiring task.

## Newer ideas, not extending an existing module

Everything above closes a gap the project already named. These are
genuinely new surface, lower confidence they're worth the effort without
the user weighing in first:

- **Page version history** — every compile overwrites `wiki-app/docs/*.md`
  in place; there's no diff view between compile runs. `data/state.json`
  already carries per-file MD5s and run history that could seed this.
- **Full-corpus export/backup** — one zip of `data/raw/` + `wiki-app/docs/`
  + `data/*.json` for portability/backup; today only per-page/per-graph
  export exists (`graph.ts`'s export menu).
- **Search across the whole app, not per-page** — `/wiki` and `/resources`
  each have local filters; there's no single search box spanning pages,
  emails, and resources at once.

None of these were scoped or estimated in depth — they're flagged as
candidates for a future pass, not committed to.

## Next

- [29-active-learning.md](./29-active-learning.md), [35-review-queue-ui.md](./35-review-queue-ui.md) — the gap closed this session
- [34-external-connectors.md](./34-external-connectors.md) — the highest-value remaining gap
- [26-entity-resolution.md](./26-entity-resolution.md), [27-temporal-modeling.md](./27-temporal-modeling.md), [28-faithfulness-evaluation.md](./28-faithfulness-evaluation.md) — the other three ranked gaps
