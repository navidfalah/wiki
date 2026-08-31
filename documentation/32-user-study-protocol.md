# 32 — User Study: Wiki+Chat vs. Plain Email Search

**No study has been run.** This document and `compiler/user_study.py` are
the protocol and instrument for one — task design, counterbalancing,
metrics, and analysis plan — ready to execute the moment real participants
are available. Running one needs recruiting actual people and having them
interact with a live system; this environment can do neither. Fabricating
plausible-looking trial data to make this task look "done" would be a
research-integrity failure worse than any honestly-named gap elsewhere in
this series, so none exists here — `data/user_study_results.json` is
created only by a real session (and is gitignored, same as
`data/state.json`), and every test in `test_user_study.py` that exercises
`summarize()` says explicitly, in the code, that its input is synthetic
timing data for testing arithmetic, never a study result.

| | |
|---|---|
| Instrument | `compiler/user_study.py` |
| Tests (mechanism only — no real data exists) | `compiler/tests/test_user_study.py` |
| Results, once collected | `data/user_study_results.json` (gitignored) |

## Research question

Does the wiki+chat system (tasks [#5](./25-hybrid-retrieval.md)/[#8](./28-faithfulness-evaluation.md))
help someone find a specific fact in their own corpus faster and more
accurately than searching the same raw notes/emails directly (e.g. grep, a
text editor's find, or a mail client's search box)?

## Design

**Within-subjects, counterbalanced.** Every participant does every task
under both conditions — more statistical power per participant than a
between-subjects design, at the cost of needing to counterbalance order
carefully (see below), which is the harder methodological piece to get
right and the reason `generate_counterbalanced_design()` exists as
code rather than a paragraph of instructions a facilitator has to
remember.

- **Condition A (`wiki_chat`)** — the participant uses `/chat`
  ([20](./20-email-resources-and-chat-engines.md)) against a compiled copy
  of the corpus.
- **Condition B (`plain_search`)** — the participant searches the same raw
  `data/raw/` files directly with whatever tool they'd normally use (their
  OS's file search, `grep`, opening files and reading).
- **Tasks** — `user_study.STUDY_TASKS`, the same 8 hand-labeled,
  fact-grounded questions `retrieval_eval_dataset.py` already uses to
  evaluate retrieval quality (task #5) — e.g. "What is the default sensor
  read interval for the Nova Widget?", "Why does MeshSync relay mode drain
  the battery faster than expected?". Reused rather than invented, so this
  study and task #5's retrieval evaluation are asking about the exact same
  verified facts, from two different angles (does the system rank the
  right passage vs. does a person actually find the right answer).
- **Counterbalancing** — `generate_counterbalanced_design(participant_ids)`
  alternates which condition each participant sees first (participant 0:
  A then B; participant 1: B then A; ...), controlling for a systematic
  order effect (e.g. everyone being faster on their second exposure to a
  task regardless of condition). Task order within each condition block is
  shuffled per participant (seeded, so a given design is reproducible) to
  avoid every participant hitting the same task-order-driven learning
  curve. Verified by `test_generate_counterbalanced_design_alternates_first_condition_across_participants`
  and `test_generate_counterbalanced_design_is_deterministic_for_a_given_seed`.

## Procedure (for whoever runs this)

1. Compile the wiki once (`python main.py --force`) so `/chat` has a real
   corpus to search — plausibly the demo Aurora Labs/TeaBuddy sample data,
   or a participant's own corpus if this is run as a dogfooding session
   rather than a lab study.
2. Call `generate_counterbalanced_design()` with your participant id list
   to get each participant's task/condition/order assignment.
3. For each assignment, in `block_order`: show the participant the task's
   `query` text, start a timer, let them use the assigned condition's tool
   until they give an answer (or give up), stop the timer.
4. Score the answer against the task's ground truth (the `relevant_ids`'
   claim values in `retrieval_eval_dataset.QUERIES` — a facilitator
   reference, not shown to the participant) and ask for a 1–5 confidence
   rating.
5. `save_result(TrialResult(...))` for each trial.
6. After all trials: `summarize(load_results())` for descriptive stats.

## Metrics and analysis plan

`ConditionSummary` (per condition): `n`, mean `duration_seconds`,
`accuracy` (fraction correct), mean self-reported `confidence`.
`StudySummary.paired_duration_wins`: for every participant/task pair with a
trial recorded under *both* conditions, which condition was faster — a
simple win-count (sign-test style), not a p-value.

**Deliberately no significance test is computed here.** A proper paired
test (Wilcoxon signed-rank on duration, McNemar's on accuracy) needs a real
sample to be meaningful — computing one against a handful of mechanism-test
trials, or even a genuinely small pilot (n<10), would produce a p-value
that looks precise and isn't. `summarize()`'s win-count is honest about
what a small sample can actually say; adding `scipy.stats.wilcoxon()` once
a real sample exists (and its size is known) is a five-minute follow-up,
deliberately not pre-built here to avoid the temptation to run it on too
few trials and report the number anyway.

## What this task actually delivers vs. what it doesn't

**Delivered:** a concrete, counterbalanced, reproducible design; a working
instrument for running it and recording/summarizing results; 8 real tasks
grounded in the same verified facts the rest of this project already uses;
an explicit analysis plan including what *not* to compute prematurely.

**Not delivered, and not fabricated:** any actual result about whether the
wiki+chat system helps. That requires the one thing no amount of careful
protocol design can substitute for — real people using the real system —
and is the honest, final gap in this task series.

## Next

- [25-hybrid-retrieval.md](./25-hybrid-retrieval.md) — the retrieval-quality evaluation this study's tasks are shared with
- [28-faithfulness-evaluation.md](./28-faithfulness-evaluation.md) — the other place a live human/model judgment is named as a gap rather than simulated
