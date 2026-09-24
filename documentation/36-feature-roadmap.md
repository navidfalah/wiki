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

### 2. External connectors: wire Gmail/Drive/IMAP into the app — closed

Was: `compiler/connectors/` (Gmail, Drive, IMAP, OAuth2 with PKCE,
encrypted credential storage, 73 tests) had **zero references** anywhere
in `backend/`, `frontend/`, or `cli.py` — confirmed by grep at the time,
not by trusting doc 34's own "not wired in yet" note. Ranked as the single
largest dormant feature in the repo.

**Stale within minutes of being written**: a follow-up commit ("Wire
external connectors into the dashboard and compile pipeline") landed the
same day and closed this gap end-to-end — OAuth start/callback, item
browsing, import into `data/raw/`, encrypted credential storage,
disconnect, and activity logging, all through generic `/api/connectors/:id/*`
routes and a "Connectors" tab in `resources.ts`. Doc 34 itself was updated
in that commit to describe the live wiring; this doc wasn't, and kept
describing the pre-wiring state. IMAP needed nothing further (same
connect → browse → import pattern already proven by the Postgres
connector). Gmail/Drive are code-complete too — the only remaining step is
operational, not implementation: register a real Google Cloud OAuth
client and set `GMAIL_CLIENT_ID`/`GMAIL_CLIENT_SECRET`/etc. in `.env`.

One real, small gap fell out of re-auditing this: the `/database` page's
SQLite connect form posted to `/api/connectors/sqlite/connect`, and the
Python side (`cli.py`'s `connectors-sqlite-connect` command) already
supported it, but the Express route was never added — a live 404. Fixed
alongside this doc update by mirroring the existing `imap/connect`/
`postgres/connect` route blocks.

### 3. Faithfulness score in the live chat UI — closed

Was: `faithfulness_heuristic.py` (offline, no API key needed — task #8)
exercised only by `compiler/tests/` and the eval harness, with
`rag_engine.py`'s live `answer_question()` path never calling it — a chat
answer gave no signal about how grounded it was.

Now shipped end-to-end: `rag_engine._faithfulness_signal()` calls the
heuristic for generated-mode answers (extractive-mode answers skip it,
since they're faithful by construction per doc 28 — quoted verbatim from
retrieved passages) and returns a `"faithfulness"` field alongside
`"answer"`/`"sources"`/`"mode"` from both `answer_question()` and
`answer_question_stream()`. That field passes through `cli.py` unchanged
(plain dict/NDJSON pass-through, no schema to update), gets typed as
`ChatFaithfulness` in `pythonBridge.ts` and `chatSessions.ts` (optional
everywhere, so old persisted sessions without it don't break), and renders
as a small badge in `chat.ts`'s `faithfulnessBadgeHtml()` — a fixed
"Grounded · verbatim" pill for extractive answers, or a
"~N% grounded · estimate" pill (color-coded, with a title hedging it's a
heuristic proxy, not an LLM judge) for generated ones. Covered by
`test_faithfulness_heuristic.py` and `test_rag_engine.py`'s faithfulness
assertions.

One real rough edge left: the streaming chat path only shows the badge
after a full session reload once the stream's `"done"` event fires
(faithfulness can't be computed until the complete answer text exists),
not instantly from that event — a minor, currently-accepted UX gap, not a
missing feature.

### 4. Entity resolution: heuristic tier only — closed

Was: `mechanical_linker.py` wired `resolve_entities()` but explicitly
without `embed_fn`/`llm` — the embedding and LLM adjudication tiers doc 26
built and evaluated were real and tested but never reached from a live
compile.

Now shipped: `build_alias_topic_index()` takes optional `embed_fn`/`llm`
params and passes them straight through to `resolve_entities()`;
`link_and_export_pages()` takes a `resolve_entities_llm` flag that, when
set, threads the `LLMClient` it already constructs (`require_llm()`, one
line above the call site) through as both — its `embed_text` bound method
as `embed_fn`, the client itself as `llm`. Off by default (extra
LLM/embedding calls on every linking run for a strictly-additive alias
expansion most compiles don't need), same convention as
`--critic-pass`/`--use-corrections`: a `--resolve-entities-llm` CLI flag /
`WIKI_RESOLVE_ENTITIES_LLM` env var threads it through `run_pipeline()` →
`step_link()` → `link_and_export_pages()`. Covered by
`test_mechanical_linker.py` and `test_linker.py`.

### 5. Temporal model not wired into any live query path — closed

Was: `temporal_model.py`'s bi-temporal `as_of()` queries (task #7) were
covered by `temporal_model_eval.py` and tests only — no API route, no
dashboard surface.

Now shipped, read-only: `cli.py`'s new `cmd_temporal_facts` command
(`temporal-facts`) runs `temporal_model.build_group_timeline()` against
the live `data/trust_eval_dataset.json` for every claim group — the same
"run against the live pilot dataset" posture `cmd_review_queue` already
established, not the deeper "adapt real compiled claims into the
bi-temporal shape" project doc 27's own Limitations section describes as
future work (still open, and a materially bigger job than an API
wrapper). Exposed via `GET /api/temporal-facts` in the Express backend.
Covered by `test_cli.py`.

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

- [29-active-learning.md](./29-active-learning.md), [35-review-queue-ui.md](./35-review-queue-ui.md) — gap #1, closed
- [34-external-connectors.md](./34-external-connectors.md) — gap #2, closed (see above)
- [28-faithfulness-evaluation.md](./28-faithfulness-evaluation.md) — gap #3, closed (see above)
- [26-entity-resolution.md](./26-entity-resolution.md) — gap #4, closed (see above)
- [27-temporal-modeling.md](./27-temporal-modeling.md) — gap #5, closed (see above; doc 27's own Limitations section still names the larger "real compiled claims" adapter as open)
