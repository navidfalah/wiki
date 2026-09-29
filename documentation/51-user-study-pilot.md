# 51 — User Study Pilot: Materials and Design

**No study has been run, and there are no results.** This is the kit for a
pilot with 6–8 people, built for the current sample corpus (the
BürgerEnergie Eschenbrück cooperative, doc 18). Doc 32 is the general
protocol; this document is what changed for the pilot and why.

The question is the same: does wiki + chat help someone find a fact in a
document collection faster and more accurately than searching the raw files
themselves?

## What changed from doc 32, and why

**Each task is done once, not twice.** Doc 32's design has every participant
do every task under *both* conditions. The second time, they already know
the answer, and that favours whichever condition comes second: the effect
could swallow the difference the study is looking for. Counterbalancing the
order spreads that bias across conditions but does not remove it, and adds
noise. The pilot therefore splits the tasks into two **matched sets**, A and
B. A participant does set A under one condition and set B under the other.
`generate_counterbalanced_design()` stays for reference; the pilot uses
`generate_crossed_design()`.

**Tasks come from the 65-question benchmark** (doc 44), which already has
reference answers, required facts and their sources, instead of the eight
retrieval-evaluation queries. Twelve are chosen (`scripts/build_study_kit.py`):
6 plain fact lookups, 4 where sources disagree (the wiki flags these; raw
search doesn't), 2 that need several sources. Questions whose sources are
only photos or recordings are excluded, since those would test the file type,
not the system.

**The two sets are matched by construction, not by hand.** Within each
category, questions are ordered by a difficulty proxy (number of sources) and
dealt A, B, B, A, ..., so each set has the same categories and about the
same difficulty. Deterministic and reviewable before anyone is recruited.

## Design

- **Within participant, across two matched sets.** Condition order alternates
  between participants; which set goes with the wiki alternates every two.
  Over a multiple of four participants all four combinations are equally
  common (the builder warns otherwise).
- **Measures per trial**: time to answer (5-minute cap, then "no answer"),
  correctness against `answer_key.md`, confidence 1–5. **Per condition**:
  the 10-item SUS usability scale. **After**: preference and what went wrong,
  written down as said.
- **Scoring** happens after the session, from the recorded verbatim answer,
  ideally by a second person; disagreements are recorded.
- **Unit of comparison is the participant.** Each person's mean time and
  accuracy under wiki + chat against plain search (`paired_participant_wins`,
  `participant_condition_means`). Comparing per task across participants is
  weaker: each task is done under each condition by different people.

## Using the kit

```bash
cd compiler
python scripts/build_study_kit.py                # study/pilot/, 8 participants
python scripts/build_study_kit.py --participants 12 --seed 7
python user_study.py import ../study/pilot/trials.csv
python user_study.py summarize
```

`study/pilot/` has the facilitator README, briefing (EN/DE), task list,
answer key (**facilitators only**), schedule, one run sheet per participant,
the SUS items, and an empty `trials_template.csv`. A test fails if the
committed kit differs from what the builder produces, so edit the builder,
not the files. Another checks that no participant-facing file contains an
answer.

Import is strict and all-or-nothing: a bad row (unknown condition, `correct`
that is not yes/no, confidence outside 1–5, a repeated trial) stops it with
the line number and writes nothing. Re-importing a file is refused.

## What a pilot can show

Descriptive statistics, a rough size of any difference, whether the tasks and
setup work, and the problems people hit. It cannot show a significant
difference: with 8 people a p-value would look more precise than the data
are. `summarize` prints counts and means only; report counts and ranges, name
it a pilot, and publish the sets, the corpus version and the time cap.

## Before the first real session

1. Rehearse the whole protocol with a colleague; fix what is unclear; don't
   count that session.
2. Compile the corpus with a real key (`python main.py --force`), or use the
   seed pages, and state which. The seed pages were written by hand from the
   sources and will answer better than compiled ones.
3. Have your institution's ethics process check the briefing text; it is a
   starting point, not an approved form.
4. Identical setup for both conditions: same machine, same window layout.

## Limits, stated up front

- The corpus is fictional and small; results may not carry over to a real
  collection.
- Participants are unlikely to be a random sample; recruit people who are
  not the wiki's developers.
- Questions that embed a wrong value (the *contradiction* ones) test whether
  the system exposes a conflict, which is a strength of the wiki by design;
  report that category separately.
- The facilitator knows the condition; time is measured by a person with a
  stopwatch. Keep the same person timing for the whole study if possible.

## Files

`compiler/user_study.py`, `compiler/scripts/build_study_kit.py`,
`compiler/tests/test_user_study.py`, `compiler/tests/test_build_study_kit.py`,
`study/pilot/`.
