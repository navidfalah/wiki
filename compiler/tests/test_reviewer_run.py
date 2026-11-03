"""reviewer.run_review / format_report / main with a scripted LLM: which
pages get reviewed, what the report says, and how failures are recorded."""

import json
import sys
from pathlib import Path

import pytest

import reviewer


@pytest.fixture
def wiki(tmp_path, monkeypatch):
    docs = tmp_path / "wiki-app" / "docs"
    docs.mkdir(parents=True)
    for name, title in [("aurora-labs.md", "Aurora Labs"), ("nova-widget.md", "Nova Widget"), ("index.md", "Index")]:
        (docs / name).write_text(f"---\ntitle: {title}\n---\n# {title}\n\nBody of {title}.\n", encoding="utf-8")
    state = {
        "files": {
            "notes/a.txt": {"chunks": [{"chunk_index": 0, "text": "Aurora Labs builds the Nova Widget.", "topics": ["Aurora Labs", "Nova Widget"]}]},
        }
    }
    monkeypatch.setattr(reviewer, "load_state", lambda: state)
    monkeypatch.setattr(reviewer, "load_topic_index", lambda: {"Aurora Labs": "aurora-labs.md", "Nova Widget": "nova-widget.md"})
    return docs


def _llm_for(verdict_by_topic):
    """An LLM whose answer depends on which topic's page is in the prompt."""

    class ByTopic:
        available = True
        prompts: list = []

        def generate_response(self, prompt, system_prompt, temperature=0.1):
            ByTopic.prompts.append(prompt)
            for topic, verdict in verdict_by_topic.items():
                if f"Body of {topic}." in prompt:
                    if isinstance(verdict, Exception):
                        raise verdict
                    return json.dumps(verdict)
            return json.dumps({"severity": "clean", "structural_issues": [], "dubious_claims": [], "summary": "ok"})

    return ByTopic()


def test_reviews_indexed_pages_and_writes_a_report(wiki, tmp_path):
    llm = _llm_for(
        {
            "Nova Widget": {
                "severity": "major",
                "summary": "Battery claim is unsupported.",
                "structural_issues": [{"type": "contradiction", "description": "Two battery sizes", "source_refs": ["notes/a.txt#0"], "wiki_excerpt": "3000 mAh"}],
                "dubious_claims": [{"claim": "Lasts 10 years", "confidence": "high", "reason": "No source says so", "source_refs": ["notes/a.txt#0"]}],
            }
        }
    )
    report = reviewer.run_review(docs_dir=wiki, report_path=tmp_path / "out" / "report.txt", llm=llm)
    text = report.read_text()
    assert len(llm.prompts) == 2  # index.md is not a topic
    assert "Pages reviewed: 2" in text
    assert "PAGE: Nova Widget" in text and "SEVERITY: MAJOR" in text
    assert "[contradiction] Two battery sizes" in text
    assert "Sources: notes/a.txt#0" in text and "Wiki excerpt: 3000 mAh" in text
    assert "[high confidence] Lasts 10 years" in text and "Reason: No source says so" in text
    assert "1 additional page(s) passed" in text
    assert "PAGE: Aurora Labs" not in text


def test_the_source_chunks_reach_the_prompt(wiki, tmp_path):
    llm = _llm_for({})
    reviewer.run_review(docs_dir=wiki, report_path=tmp_path / "r.txt", llm=llm)
    assert all("Aurora Labs builds the Nova Widget." in p for p in llm.prompts)


def test_topic_filter(wiki, tmp_path):
    llm = _llm_for({})
    reviewer.run_review(docs_dir=wiki, report_path=tmp_path / "r.txt", llm=llm, topic_filter="nova")
    assert len(llm.prompts) == 1 and "Body of Nova Widget." in llm.prompts[0]


def test_a_failing_page_is_reported_not_fatal(wiki, tmp_path):
    llm = _llm_for({"Aurora Labs": RuntimeError("rate limited")})
    text = reviewer.run_review(docs_dir=wiki, report_path=tmp_path / "r.txt", llm=llm).read_text()
    assert "PAGE: Aurora Labs" in text
    assert "ERROR: rate limited" in text
    assert "SUMMARY: Review failed." in text


def test_without_an_index_every_doc_is_reviewed(wiki, tmp_path, monkeypatch):
    monkeypatch.setattr(reviewer, "load_topic_index", lambda: {})
    llm = _llm_for({})
    text = reviewer.run_review(docs_dir=wiki, report_path=tmp_path / "r.txt", llm=llm).read_text()
    assert len(llm.prompts) == 2
    assert "No structural inconsistencies or dubious claims flagged." in text


def test_refuses_to_run_without_an_llm(wiki, tmp_path):
    class Unavailable:
        available = False

    with pytest.raises(RuntimeError, match="OPENAI_API_KEY"):
        reviewer.run_review(docs_dir=wiki, report_path=tmp_path / "r.txt", llm=Unavailable())


def test_format_report_orders_major_first_and_handles_paths_outside_the_repo(tmp_path):
    reviews = [
        reviewer.PageReview(topic="zeta", page_path=Path("/elsewhere/z.md"), severity="minor", summary="small"),
        reviewer.PageReview(topic="alpha", page_path=Path("/elsewhere/a.md"), severity="major", summary="big"),
        reviewer.PageReview(topic="clean", page_path=Path("/elsewhere/c.md")),
    ]
    text = reviewer.format_report(reviews, docs_dir=tmp_path / "wiki-app" / "docs")
    assert text.index("PAGE: alpha") < text.index("PAGE: zeta")
    assert "FILE: /elsewhere/a.md" in text
    assert "1 additional page(s) passed" in text


def test_main_checks_its_inputs(tmp_path, monkeypatch):
    monkeypatch.setattr(sys, "argv", ["reviewer.py", "--docs-dir", str(tmp_path / "missing")])
    with pytest.raises(SystemExit, match="Docs directory not found"):
        reviewer.main()
    monkeypatch.setattr(sys, "argv", ["reviewer.py", "--docs-dir", str(tmp_path)])
    monkeypatch.setattr(reviewer, "STATE_FILE", tmp_path / "no-state.json")
    with pytest.raises(SystemExit, match="Compiler state not found"):
        reviewer.main()


def test_main_passes_its_flags_to_run_review(tmp_path, monkeypatch):
    state = tmp_path / "state.json"
    state.write_text("{}")
    monkeypatch.setattr(reviewer, "STATE_FILE", state)
    seen = {}
    monkeypatch.setattr(reviewer, "run_review", lambda **kw: seen.update(kw))
    monkeypatch.setattr(sys, "argv", ["reviewer.py", "--docs-dir", str(tmp_path), "--output", str(tmp_path / "o.txt"), "--topic", "nova", "--all-docs"])
    reviewer.main()
    assert seen == {"docs_dir": tmp_path, "report_path": tmp_path / "o.txt", "topic_filter": "nova", "indexed_only": False}
