import csv
import io
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import build_study_kit as kit  # noqa: E402

from qa_benchmark_eval import Question, load_benchmark  # noqa: E402

QUESTIONS = load_benchmark()


def rows(text):
    return list(csv.DictReader(io.StringIO(text)))


def test_selection_meets_the_quota_and_avoids_media_only_sources():
    picked = kit.select_pilot_questions(QUESTIONS)
    from collections import Counter

    assert Counter(q.category for q in picked) == kit.QUOTA
    assert not any(kit._uses_media_only(q) for q in picked)
    assert len({q.id for q in picked}) == len(picked)


def test_selection_fails_loudly_when_a_category_is_too_small():
    with pytest.raises(ValueError, match="only 0 eligible"):
        kit.select_pilot_questions([q for q in QUESTIONS if q.category != "contradiction"])


def test_selection_skips_a_question_whose_source_is_a_photo():
    photo = Question("qx", "fact", "What is on the photo?", "a", [["a"]], ["media/site.jpg"], "photo")
    picked = kit.select_pilot_questions(QUESTIONS + [photo])
    assert "qx" not in {q.id for q in picked}


def test_kit_is_deterministic_and_seeded():
    assert kit.build_kit(QUESTIONS, 8) == kit.build_kit(QUESTIONS, 8)
    assert kit.build_kit(QUESTIONS, 8, seed=1)["schedule.csv"] != kit.build_kit(QUESTIONS, 8, seed=2)["schedule.csv"]


def test_two_sets_of_six_matched_by_category():
    files = kit.build_kit(QUESTIONS, 8)
    tasks = rows(files["tasks.csv"])
    sets = {s: [t for t in tasks if t["set"] == s] for s in "AB"}
    assert len(sets["A"]) == len(sets["B"]) == 6
    from collections import Counter

    assert Counter(t["category"] for t in sets["A"]) == Counter(t["category"] for t in sets["B"])


def test_schedule_gives_every_participant_each_task_once_and_all_combinations():
    files = kit.build_kit(QUESTIONS, 8)
    schedule = rows(files["schedule.csv"])
    task_ids = {t["task_id"] for t in rows(files["tasks.csv"])}
    combos = set()
    for i in range(1, 9):
        mine = [r for r in schedule if r["participant_id"] == f"P{i:02d}"]
        assert sorted(r["task_id"] for r in mine) == sorted(task_ids)
        combos.add((mine[0]["condition"], next(r["set"] for r in mine if r["condition"] == "wiki_chat")))
    assert len(combos) == 4


def test_answer_key_is_only_in_the_answer_key_file():
    files = kit.build_kit(QUESTIONS, 4)
    picked = kit.select_pilot_questions(QUESTIONS)
    assert "FACILITATORS ONLY" in files["answer_key.md"]
    for q in picked:
        assert q.answer in files["answer_key.md"]
        for name in ("tasks.csv", "schedule.csv", "briefing.md", "sus.md") + tuple(f for f in files if f.startswith("sessions/")):
            assert q.answer not in files[name], f"{name} leaks the answer to {q.id}"


def test_run_sheets_list_both_blocks_in_schedule_order():
    files = kit.build_kit(QUESTIONS, 4)
    schedule = [r for r in rows(files["schedule.csv"]) if r["participant_id"] == "P02"]
    sheet = files["sessions/P02.md"]
    positions = [sheet.index(f"| {int(r['block_order']) + 1} | {r['task_id']}:") for r in schedule]
    assert positions == sorted(positions)
    assert sheet.index("Block 1: Plain search") < sheet.index("Block 2: Wiki + chat")  # P02 starts with plain search


def test_kit_contains_materials_only_no_results():
    files = kit.build_kit(QUESTIONS, 4)
    assert set(files) == {"README.md", "answer_key.md", "briefing.md", "schedule.csv", "sus.md", "tasks.csv", "trials_template.csv", "sessions/P01.md", "sessions/P02.md", "sessions/P03.md", "sessions/P04.md"}
    assert rows(files["trials_template.csv"]) == []  # header only
    assert "No study has been run" in files["README.md"]
    assert len([i for i in kit.SUS_ITEMS]) == 10


def test_main_writes_files_and_warns_about_uneven_participant_counts(tmp_path, capsys):
    assert kit.main(["--participants", "6", "--out", str(tmp_path)]) == 0
    assert (tmp_path / "sessions" / "P06.md").is_file() and (tmp_path / "answer_key.md").is_file()
    assert "multiple of 4" in capsys.readouterr().out
    with pytest.raises(SystemExit):
        kit.main(["--participants", "0", "--out", str(tmp_path)])


def test_committed_kit_is_up_to_date():
    from models import PROJECT_ROOT

    out = PROJECT_ROOT / "study" / "pilot"
    for rel, content in kit.build_kit(QUESTIONS, 8).items():
        expected = content if content.endswith("\n") else content + "\n"
        assert (out / rel).read_text(encoding="utf-8") == expected, f"{rel} is stale: run python scripts/build_study_kit.py"
