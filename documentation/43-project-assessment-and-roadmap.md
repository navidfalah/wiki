# 43 — Project Assessment, R&D Priorities and Task Backlog

A scored assessment of Wissensbau as of 2026-09-27, followed by a ranked
R&D list and a concrete task backlog. Every claim below was checked against
the code or measured in this repo. Where something is an opinion, it says so.

## 1. The problem it solves

Organizational knowledge is spread across notes, emails, PDFs, transcripts,
spreadsheets and databases. Finding "what do we actually know about X, and
how much should we trust it" means searching several places by hand and
reconciling contradictions by yourself. Wissensbau compiles those raw sources
into a linked, browsable wiki (the Karpathy "LLM wiki" pattern). On top of that
it adds grounded chat (RAG), trust and contradiction signals, and a review
loop.

| Dimension | Score | Reasoning |
|---|---|---|
| Relevance of the problem | **8/10** | Real and common, and it gets worse as a corpus grows. It is also well-defined enough to evaluate. |
| Differentiation | **7/10** | Plain "RAG over docs" is crowded. Few systems combine a persistent compiled wiki with per-claim trust propagation, bi-temporal facts, an extraction critic and grounded-answer signals. That combination is the project's research angle. |
| Evidence that it works | **3/10** | **No user study has been run** (doc 32). The eval datasets are small pilots. The offline groundedness check had been silently measuring **0 pages** since the compiler changed its sources-section format (fixed in this pass, see §4). So the central claim, that wiki + chat beats plain search, is still a hypothesis. |

## 2. Project scorecard

| Area | Score | Evidence |
|---|---|---|
| Engineering quality | **7.5/10** | 822 compiler tests and 334 backend tests. TypeScript is strict throughout, with an i18n parity check in CI and atomic JSON writes. There is a visible history of real security fixes (XSS, TOCTOU, path traversal, session revocation). Deducted because `main` had drifted red; see §4. |
| Documentation | **9/10** | 43 focused docs, honest about gaps (docs 32 and 36 are good examples). |
| Feature completeness | **7.5/10** | Compiler, wiki, graph, entities, chat with five RAG architectures, connectors (Gmail, Drive, IMAP, Postgres, SQLite), review queue, analytics, usage/cost tracking, EN/DE, admin panel, and now cross-corpus search. |
| Research validity | **4/10** | Solid instruments exist (user-study protocol, trust/ER/PII/faithfulness evals, ablations), but there are no real results and no automated regression tracking of eval scores. |
| Operability / scale | **5/10** | Every API call that needs Python spawns a fresh `cli.py`. **Measured: ~640 ms of imports alone per call**, before any work is done. State is JSON files on disk (users, sessions, chat, activity), so it can only run as a single instance. Backups are a manual `tar` (doc 40). |
| Security | **7/10** | Auth, login throttle, HttpOnly session cookie, proxy-injected bearer, several security headers, non-root images. Missing: a Content-Security-Policy. There are moderate `qs` advisories in production deps (`express`), and a critical advisory in dev-only `vitest`. |
| Test coverage balance | **6/10** | Strong in the compiler and backend. The frontend has **zero** tests, and there is no end-to-end test (the search feature was verified with an ad-hoc Playwright run). |
| **Overall** | **6.9/10** | A strong engineering base with an honest research framing. The biggest gap is **evidence**, not features. |

## 3. R&D: what the project needs most (ranked)

Rating method:

- **Impact**: 1–5.
- **Effort**: S = 1, M = 2, L = 3.
- **Confidence**: how sure we are the payoff is real, 0.5–1.0.
- **Priority** = Impact × Confidence ÷ Effort.

| # | Item | Impact | Effort | Conf. | **Priority** |
|---|---|---|---|---|---|
| 1 | **CI that can't silently rot**: also run on `push` to `main`, pin `ruff` exactly, lock Python deps | 5 | S | 1.0 | **5.0** |
| 2 | **Eval regression gate**: a CI job running the offline evals (retrieval, ER, trust, PII, faithfulness) that fails on score drops or empty inputs | 4 | S | 0.9 | **3.6** |
| 3 | **Isolate optional imports in `cli.py`**: `connectors_service` (and `cryptography`) are imported at module top, so a broken crypto install takes down *every* CLI endpoint, including emails. Observed in this environment. | 4 | S | 0.9 | **3.6** |
| 4 | **Security quick wins**: CSP with a nonce for the one inline script, `npm audit fix` (`qs`), bump `vitest` | 4 | S | 0.85 | **3.4** |
| 5 | **Gold Q&A benchmark on the sample corpus**: 50–100 questions with answer + source; automated scoring of all 5 RAG architectures and of search | 5 | M | 0.9 | **2.25** |
| 6 | **Persistent Python worker** instead of spawn-per-call. Removes ~640 ms per request and allows caching the retrieval index in memory. | 4 | M | 0.9 | **1.8** |
| 7 | **Frontend tests**: unit tests for `client/lib/*` plus a Playwright smoke test in CI (login → wiki → search → chat with a mocked LLM) | 4 | M | 0.9 | **1.8** |
| 8 | **Page version history / compile diff**: users need to see what the LLM changed between runs before they trust it | 4 | M | 0.8 | **1.6** |
| 9 | **Run the user study (doc 32)**: pilot with 6–8 people first. This is the project's central research claim. | 5 | L | 0.9 | **1.5** |
| 10 | **Search v2**: reuse the BM25 index from `hybrid_retrieval.py`, full email bodies, deep links to items. Today it is 29 ms/query at 227 pages and linear, so roughly 1.3 s at 10k pages. | 3 | M | 0.8 | **1.2** |
| 11 | **Automated backups + export/restore** in the admin UI | 3 | M | 0.8 | **1.2** |
| 12 | **SQLite for app state** (users, sessions, chat, activity) instead of JSON files, which unlocks more than one backend instance | 3 | M | 0.7 | **1.05** |
| 13 | **Active learning / temporal model on the live corpus** instead of the pilot dataset (docs 27, 29, 36 #6). This is the "claim extraction" research problem. | 4 | L | 0.5 | **0.67** |

Not recommended right now: multi-tenancy, a SPA rewrite of the frontend, or
more RAG architectures. None of these addresses the evidence gap, and the
existing five are not yet benchmarked (item 5).

## 4. Done in this pass (on `main`)

- **Cross-corpus search** merged (doc 42).
- **`main`'s compiler CI restored to green.** Before this pass, three tests
  and the lint step failed on a fresh install:
  - Two eval datasets (`data/trust_eval_dataset.json`,
    `compiler/entity_resolution_eval_dataset.py`) pointed at sample files
    that commit `bf77e24` had moved out of `dummy-test/`. The paths are now
    updated. Raw data was not touched.
  - `faithfulness_heuristic.parse_page` only understood the old
    `## Sources` bullet list. The compiler now writes a
    `## References & Trust` table, so the offline groundedness check had
    been scoring 0 pages. It now parses both formats, with a new test for
    the table format.
  - `ruff>=0.6,<0.17` resolves to a newer ruff with stricter rules, which
    gave 33 lint errors. Most were auto-fixed (`datetime.UTC`, import order,
    unquoted annotations). The rest were fixed by hand: `pytest.raises`
    instead of `assert False`, `zip(strict=True)`, and unused loop
    variables.
  - Result: `ruff check` is clean and **822/822** tests pass.

## 5. Task backlog

Each task has a clear definition of done. IDs map to §3.

**T1 — CI on main + pinned tooling** (item 1, S)
- Add `push: branches: [main]` to `.github/workflows/pr-checks.yml`.
- Pin `ruff==<version>` in `compiler/requirements-dev.txt`.
- Done when a direct push to `main` runs all four jobs.

**T2 — Eval regression gate** (item 2, S)
- Add a CI step that runs `retrieval_eval.py`, `entity_resolution_eval.py`,
  `trust_propagation_eval.py`, `pii_redaction_eval.py` and
  `faithfulness_heuristic.py` offline, and compares them to a committed
  baseline JSON.
- Done when a metric drop beyond tolerance, or an empty input set, fails CI.

**T3 — Lazy optional imports in `cli.py`** (item 3, S)
- Import `connectors_service` (and anything else that pulls in
  `cryptography`) inside the connector commands only.
- Done when a test simulating a broken `cryptography` import shows
  `emails-list` and `review-queue` still working.

**T4 — Security quick wins** (item 4, S)
- Add a CSP header in `frontend/src/index.ts`, with a per-request nonce for
  the toast script in `partials/foot.ejs`.
- Run `npm audit fix` in `backend/` and `frontend/`, and bump `vitest` to a
  patched major.
- Done when `npm audit --omit=dev` is clean and no page logs a CSP
  violation (checked with the Playwright smoke test from T7).

**T5 — Gold Q&A benchmark** (item 5, M)
- Write `data/qa_benchmark.json` with 50–100 questions over the sample
  corpus: expected answer facts plus the source path(s).
- Write `compiler/qa_benchmark_eval.py` to score each RAG architecture
  (answer recall, source recall, faithfulness) and the search API
  (hit@k).
- Done when the eval runs offline with a cached or mock LLM, and its results
  are recorded in a new doc.

**T6 — Persistent Python worker** (item 6, M)
- Replace `runCli`'s spawn-per-call with a long-lived `cli.py --serve`
  process that speaks JSON lines, with a restart-on-crash supervisor in
  `pythonBridge.ts`. Keep the concurrency semaphore.
- Done when p50 latency of `/api/emails` drops by at least 500 ms and
  existing backend tests pass.

**T7 — Frontend tests + e2e smoke** (item 7, M)
- Add vitest with happy-dom for `client/lib/*` (i18n, api, dom).
- Add a Playwright smoke test (login, wiki page, search, chat with a stub
  backend) as a CI job, using the pre-built images.
- Done when a `frontend` test job is added to CI.

**T8 — Page version history** (item 8, M)
- On each compile, snapshot changed pages under
  `data/page_history/<run-id>/`.
- Add `GET /api/docs/:path/history` and a diff view on the wiki page.
- Done when a user can see what changed on a page since the previous
  compile.

**T9 — User study pilot** (item 9, L)
- Run doc 32's protocol with 6–8 participants, using the sample corpus
  and T5's questions.
- Done when real results exist in `data/user_study_results.json` and
  are written up honestly. Do not fabricate any data.

**T10 — Search v2** (item 10, M)
- Build and cache a BM25 index keyed by docs-directory mtime.
- Include full email bodies, and deep-link resource hits to a folder path
  plus a highlighted file.
- Done when p95 latency is under 50 ms at 10k synthetic pages and every
  result type links directly to its item.

**T11 — Backups** (item 11, M)
- Add a scheduled backup (container cron or backend timer) with retention,
  plus admin-only export and restore of `data/` and `wiki-app/docs/`.
- Done when a restore test runs round-trip in CI.

**T12 — SQLite app state** (item 12, M)
- Move `users.json`, `sessions.json`, `chat_sessions/` and
  `activity_log.json` into one SQLite database, with a one-time migration.
- Done when all backend tests pass against SQLite and two backend
  instances can share state.

**T13 — Live-corpus claim adapter** (item 13, L; research)
- Build a claim-group graph from real `state.json` extractions, so the
  review queue and temporal facts run on the user's corpus.
- Done when the review queue shows real candidates after a compile of the
  sample corpus.

Suggested order: **T1 → T3 → T4 → T2 → T5 → T7 → T6 → T8 → T9**, then the rest.
T1–T4 are all small and remove the risks that let `main` drift silently.
T5 must exist before T9, because the study needs fixed tasks.
