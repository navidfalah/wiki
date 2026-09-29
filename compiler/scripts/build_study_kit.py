"""Build the facilitator kit for the pilot user study (doc 32, doc 51).

Writes study/pilot/ from data/qa_benchmark.json: the task list, the answer
key, the counterbalanced schedule, one run sheet per participant, the
briefing, the SUS questionnaire and an empty results template. It is
deterministic (same inputs and seed, same files), so the kit can be
reviewed and published before anyone is recruited.

    python scripts/build_study_kit.py                  # 8 participants
    python scripts/build_study_kit.py --participants 12

This builds *materials only*. It creates no results; data/user_study_results.json
comes only from `python user_study.py import <csv>` on real sessions.
"""

from __future__ import annotations

import argparse
import csv
import io
import sys
from pathlib import Path

COMPILER_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(COMPILER_DIR))

from media_ingest import AUDIO_EXTENSIONS, IMAGE_EXTENSIONS  # noqa: E402
from models import PROJECT_ROOT  # noqa: E402
from qa_benchmark_eval import Question, load_benchmark  # noqa: E402
from user_study import (  # noqa: E402
    PLAIN_SEARCH,
    WIKI_CHAT,
    StudyTask,
    generate_crossed_design,
    split_matched_sets,
)

OUT_DIR = PROJECT_ROOT / "study" / "pilot"
QUOTA = {"fact": 6, "contradiction": 4, "multi_source": 2}  # 12 tasks: two matched sets of 6
CONDITION_NAME = {WIKI_CHAT: "Wiki + chat", PLAIN_SEARCH: "Plain search of the raw files"}

SUS_ITEMS = [
    "I think that I would like to use this system frequently.",
    "I found the system unnecessarily complex.",
    "I thought the system was easy to use.",
    "I think that I would need the support of a technical person to be able to use this system.",
    "I found the various functions in this system were well integrated.",
    "I thought there was too much inconsistency in this system.",
    "I would imagine that most people would learn to use this system very quickly.",
    "I found the system very cumbersome to use.",
    "I felt very confident using the system.",
    "I needed to learn a lot of things before I could get going with this system.",
]


def _uses_media_only(q: Question) -> bool:
    return any(Path(s).suffix.lower() in IMAGE_EXTENSIONS | AUDIO_EXTENSIONS for s in q.sources)


def select_pilot_questions(questions: list[Question], quota: dict[str, int] = QUOTA) -> list[Question]:
    """Per category, an evenly spread pick of that many questions whose sources
    are all readable text (a photo or recording would need a different skill
    from searching, and would tell us about the file type, not the system)."""
    chosen: list[Question] = []
    for category, wanted in quota.items():
        eligible = sorted((q for q in questions if q.category == category and not _uses_media_only(q)), key=lambda q: q.id)
        if len(eligible) < wanted:
            raise ValueError(f"only {len(eligible)} eligible {category!r} questions, need {wanted}")
        step = len(eligible) / wanted
        chosen.extend(eligible[int(i * step)] for i in range(wanted))
    return chosen


def _csv(rows: list[list[object]]) -> str:
    out = io.StringIO()
    csv.writer(out, lineterminator="\n").writerows(rows)
    return out.getvalue()


def build_kit(questions: list[Question], participant_count: int = 8, seed: int = 0) -> dict[str, str]:
    """Relative path -> file content for the whole kit."""
    picked = select_pilot_questions(questions)
    by_id = {q.id: q for q in picked}
    tasks = [StudyTask(q.id, q.question) for q in picked]
    set_a, set_b = split_matched_sets(tasks, {q.id: q.category for q in picked}, {q.id: len(q.sources) for q in picked})
    participants = [f"P{i + 1:02d}" for i in range(participant_count)]
    design = generate_crossed_design(participants, set_a, set_b, seed=seed)
    set_of = {t.id: "A" for t in set_a} | {t.id: "B" for t in set_b}

    files: dict[str, str] = {}
    files["tasks.csv"] = _csv([["task_id", "set", "category", "question"]] + [[q.id, set_of[q.id], q.category, q.question] for q in sorted(picked, key=lambda q: (set_of[q.id], q.id))])
    files["schedule.csv"] = _csv([["participant_id", "block_order", "condition", "set", "task_id"]] + [[a.participant_id, a.block_order, a.condition, a.task_set, a.task_id] for a in design])
    files["trials_template.csv"] = _csv([["participant_id", "task_id", "condition", "duration_seconds", "correct", "confidence"]])

    key = ["# Answer key: FACILITATORS ONLY", "", "Do not show this to participants. An answer is **correct** when it states every required fact (any accepted phrasing); otherwise incorrect. Score after the session, from the recorded answer, not from memory. If an answer is right but not covered here, add it to this file and note it in the log.", ""]
    for q in sorted(picked, key=lambda q: (set_of[q.id], q.id)):
        key += [f"## {q.id} (set {set_of[q.id]}, {q.category})", "", f"**Question:** {q.question}", "", f"**Reference answer:** {q.answer}", "", "**Required facts (accepted phrasings):**"]
        key += [f"- {' / '.join(alt)}" for alt in q.facts]
        key += ["", "**Where it is:** " + ", ".join(f"`{s}`" for s in q.sources), ""]
    files["answer_key.md"] = "\n".join(key)

    files["sus.md"] = "\n".join(
        ["# System Usability Scale (after each condition)", "", "Ask after the participant finished a condition's block, once for each system. Scale: 1 = strongly disagree ... 5 = strongly agree. Scoring: odd items score (answer - 1), even items score (5 - answer); add up and multiply by 2.5 (0-100). Source: Brooke, J. (1996), SUS: a quick and dirty usability scale.", ""]
        + [f"{i + 1}. {item}" for i, item in enumerate(SUS_ITEMS)]
        + ["", "Note: SUS is meaningful as a comparison between the two conditions of this study, not as a score against outside benchmarks (the sample is tiny and the systems are not equally familiar).", ""]
    )

    for pid in participants:
        rows = [a for a in design if a.participant_id == pid]
        lines = [f"# Run sheet: {pid}", "", "Facilitator: ______  Date: ______  Start: ______", "", "Read the briefing (`briefing.md`) first. Then, for each task: read it aloud once, start the timer, stop when the participant states an answer or gives up (after 5 minutes: stop and record 'no answer'). Write the answer down word for word.", ""]
        for condition in (rows[0].condition, next(a.condition for a in rows if a.condition != rows[0].condition)):
            block = [a for a in rows if a.condition == condition]
            lines += [f"## Block {1 if condition == rows[0].condition else 2}: {CONDITION_NAME[condition]} (task set {block[0].task_set})", ""]
            if condition == WIKI_CHAT:
                lines += ["Setup: open the wiki's `/chat`. No other tool. Show how to ask a question, nothing more.", ""]
            else:
                lines += ["Setup: the participant may use any search or reading tool they normally would on the files in `data/raw/` (file search, grep, an editor), but not the wiki or chat.", ""]
            lines += ["| # | Task | Seconds | Answer (verbatim) | Correct (y/n) | Confidence 1-5 |", "|---|------|---------|-------------------|---------------|----------------|"]
            lines += [f"| {a.block_order + 1} | {a.task_id}: {by_id[a.task_id].question} |  |  |  |  |" for a in block]
            lines += ["", "SUS for this system, items 1-10 (`sus.md`): ______", ""]
        lines += ["## After both blocks", "", "Which did you prefer, and why? What went wrong or was confusing? (write down what they say, do not summarize)", "", "", "Notes and incidents (a crash, a task explained by mistake, help given):", ""]
        files[f"sessions/{pid}.md"] = "\n".join(lines)

    files["briefing.md"] = _briefing()
    files["README.md"] = _readme(participant_count, len(picked), participants)
    return files


def _briefing() -> str:
    return """# Briefing (read out) / Einführung (vorlesen)

> Have the consent procedure checked by your institution's ethics process before recruiting anyone. This text is a starting point, not an approved form.

## English

Thank you for taking part. We are comparing two ways of finding facts in a collection of documents about a fictional energy cooperative. Both are tools; **you are not being tested**, and you can stop at any time without giving a reason.

You will get two sets of short questions, each answered with a different tool. For each question, tell us the answer as soon as you have it, or say you give up. We time each question and write down your answers and how sure you are. Afterwards we ask a few questions about the tools.

We record only your participant code (for example P03), times, answers and your remarks. No names go with the data. Results are reported for the group, never for one person. Do you have any questions? Do you agree to take part?

## Deutsch

Vielen Dank für die Teilnahme. Wir vergleichen zwei Wege, Fakten in einer Sammlung von Dokumenten über eine erfundene Energiegenossenschaft zu finden. Es geht um die Werkzeuge; **Sie werden nicht geprüft**, und Sie können jederzeit ohne Angabe von Gründen abbrechen.

Sie bekommen zwei Sätze kurzer Fragen, jeweils mit einem anderen Werkzeug. Nennen Sie uns die Antwort, sobald Sie sie haben, oder sagen Sie, dass Sie aufgeben. Wir stoppen die Zeit je Frage und notieren Ihre Antworten und wie sicher Sie sind. Danach stellen wir einige Fragen zu den Werkzeugen.

Wir erfassen nur Ihren Teilnehmercode (z. B. P03), Zeiten, Antworten und Ihre Anmerkungen. Namen werden nicht mit den Daten verknüpft. Ergebnisse werden für die Gruppe berichtet, nie für einzelne Personen. Haben Sie Fragen? Sind Sie mit der Teilnahme einverstanden?
"""


def _readme(count: int, task_count: int, participants: list[str]) -> str:
    return f"""# Pilot user study: facilitator kit

**No study has been run.** These are the materials for one. Nothing in this folder is a result, and none should ever be made up: results come only from real sessions (`python user_study.py import`). Method and reasoning: `documentation/51-user-study-pilot.md`.

Generated by `compiler/scripts/build_study_kit.py` ({count} participants, {task_count} tasks); regenerate rather than editing schedule or tasks by hand.

| File | For | What |
|---|---|---|
| `briefing.md` | facilitator | what to read to each participant (EN/DE) |
| `tasks.csv` | both | the {task_count} questions in two matched sets, A and B |
| `answer_key.md` | **facilitator only** | reference answers and required facts |
| `schedule.csv` | facilitator | who does what, in which order and condition |
| `sessions/P01.md` ... | facilitator | one run sheet per participant ({participants[0]}-{participants[-1]}) |
| `sus.md` | facilitator | the usability questionnaire, asked after each condition |
| `trials_template.csv` | facilitator | header for entering trials; import with `user_study.py` |

## Before the first session

1. Compile the corpus (`python main.py --force`) or use the seed pages, and check `/chat` answers something.
2. Run the whole protocol once yourself with a colleague and fix what is unclear. Do not count that session.
3. Prepare identical setups for both conditions (same machine, same window layout).
4. Have the ethics check done (see `briefing.md`).

## Running and scoring

Follow the run sheet. Score correctness **after** the session against `answer_key.md`, ideally by a second person who did not run the session; record disagreements. Enter trials into a spreadsheet with the columns of `trials_template.csv` (correct: yes/no; condition: `wiki_chat` or `plain_search`), export CSV, then:

```bash
cd compiler
python user_study.py import ../study/pilot/trials.csv   # validates strictly, stops at the first bad line
python user_study.py summarize
```

## What eight participants can and cannot show

Descriptive numbers, a rough sense of the size of any difference, and the problems people hit. Not a significance result: with n = 8 a p-value would look more precise than the data are. Report counts and ranges, say it is a pilot, and give the sets, the corpus and the time cap.
"""


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--participants", type=int, default=8)
    parser.add_argument("--seed", type=int, default=0)
    parser.add_argument("--out", type=Path, default=OUT_DIR)
    args = parser.parse_args(argv)
    if args.participants < 1:
        parser.error("--participants must be at least 1")
    files = build_kit(load_benchmark(), args.participants, args.seed)
    for rel, content in files.items():
        target = args.out / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content if content.endswith("\n") else content + "\n", encoding="utf-8")
    print(f"wrote {len(files)} files to {args.out}")
    if args.participants % 4:
        print("note: use a multiple of 4 participants to keep all four order/set combinations equally common")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
