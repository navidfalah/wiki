"""The whole compile (main.run_pipeline, steps 1-5) end to end on a tiny raw
folder, with a scripted LLM and every data path redirected into tmp_path.

What this pins down is the mechanism, not writing quality: raw files become
chunks, extractions become one page per topic with a References section,
pages get cross-linked and indexed, state is saved for incremental runs, and
a second run with nothing changed does no LLM work at all.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import pytest

import main as compiler_main
import models
from llm_client import LLMClient

REAL_ROOT = models.PROJECT_ROOT
COMPILER_DIR = Path(models.__file__).resolve().parent


@pytest.fixture
def sandbox(tmp_path, monkeypatch):
    """Point every path constant of every loaded compiler module that lives
    under data/, wiki-app/ or compiler/temp_output at tmp_path instead."""
    remap = {
        REAL_ROOT / "data": tmp_path / "data",
        REAL_ROOT / "wiki-app": tmp_path / "wiki-app",
        COMPILER_DIR / "temp_output": tmp_path / "temp_output",
        COMPILER_DIR / ".cache": tmp_path / "cache",
    }

    def moved(value: Path) -> Path | None:
        for src, dst in remap.items():
            if value == src or src in value.parents:
                return dst / value.relative_to(src)
        return None

    for module in list(sys.modules.values()):
        file = getattr(module, "__file__", None)
        if not file or Path(file).resolve().parent != COMPILER_DIR:
            continue
        for name, value in list(vars(module).items()):
            if isinstance(value, Path) and (target := moved(value)) is not None:
                monkeypatch.setattr(module, name, target)

    raw = tmp_path / "data" / "raw"
    (raw / "notes").mkdir(parents=True)
    (raw / "notes" / "kickoff.txt").write_text(
        "Aurora Labs kicked off the Nova Widget project. The Nova Widget uses a 3000 mAh cell.\n", encoding="utf-8"
    )
    (raw / "notes" / "mesh.md").write_text("# MeshSync\n\nMeshSync is the radio protocol the Nova Widget speaks. Aurora Labs maintains it.\n", encoding="utf-8")
    (tmp_path / "wiki-app" / "docs").mkdir(parents=True)
    return tmp_path


class ScriptedLLM(LLMClient):
    """Deterministic stand-ins for the three prompt kinds the pipeline sends."""

    TOPICS = ("Aurora Labs", "Nova Widget", "MeshSync")

    def __init__(self):
        super().__init__(api_key="test-key", cache_enabled=False)
        self.calls: list[str] = []

    def generate_response(self, prompt, system_prompt, temperature=None, use_cache=None, **kwargs):
        if "Chunk index:" in prompt:
            self.calls.append("extract")
            topics = [t for t in self.TOPICS if t in prompt]
            return json.dumps(
                {
                    "topics": topics,
                    "entities": [{"name": t, "description": f"{t} as described in the notes"} for t in topics],
                    "concepts": [],
                }
            )
        if prompt.startswith("Topic: "):
            self.calls.append("synthesize")
            topic = prompt.splitlines()[0].removeprefix("Topic: ")
            slug = re.search(r"Suggested id: (\S+)", prompt).group(1)
            others = [t for t in self.TOPICS if t != topic and t in prompt]
            return (
                f"---\nid: {slug}\ntitle: {topic}\ntags:\n  - aurora\nlast_updated: 2026-09-27T00:00:00+00:00\n---\n\n"
                f"# {topic}\n\n## Overview\n\n{topic} appears in the Aurora Labs notes. Related: {', '.join(others) or 'none'}.\n"
            )
        if "Markdown page:" in prompt:
            self.calls.append("link")
            return prompt.split("Markdown page:\n\n", 1)[1]
        self.calls.append("other")
        return ""

    def embed_text(self, text, *, use_cache=None):
        return [float(len(text) % 7), 1.0, 0.5]


def _snapshot_real_files():
    watched = [REAL_ROOT / "data" / "state.json", REAL_ROOT / "data" / "pipeline_runs" / "index.json", COMPILER_DIR / "temp_output" / "index.json"]
    docs = REAL_ROOT / "wiki-app" / "docs"
    return (
        {str(p): p.stat().st_mtime_ns for p in watched if p.exists()},
        sorted(p.name for p in docs.glob("*.md")) if docs.exists() else [],
    )


def test_compile_end_to_end_then_incremental_noop(sandbox, monkeypatch):
    before = _snapshot_real_files()
    llm = ScriptedLLM()
    monkeypatch.setattr(compiler_main, "require_llm", lambda *a, **k: llm)
    monkeypatch.setattr(compiler_main.LLMClient, "for_purpose", classmethod(lambda cls, purpose, **kw: llm))

    assert compiler_main.run_pipeline(force=True) == 0

    docs = sandbox / "wiki-app" / "docs"
    pages = {p.stem: p.read_text(encoding="utf-8") for p in docs.glob("*.md")}
    for slug, title in [("aurora-labs", "Aurora Labs"), ("nova-widget", "Nova Widget"), ("meshsync", "MeshSync")]:
        assert slug in pages, sorted(pages)
        page = pages[slug]
        assert f"title: {title}" in page
        assert f"# {title}" in page
    # Every page cites the raw files it was built from.
    assert "notes/kickoff.txt" in pages["nova-widget"]
    assert "notes/mesh.md" in pages["meshsync"]
    # Cross-linking produced at least one internal link between topic pages.
    assert any(re.search(r"\]\((\./)?(aurora-labs|nova-widget|meshsync)\.md\)", body) for body in pages.values())

    index = json.loads((sandbox / "temp_output" / "index.json").read_text())
    assert set(index["topics"]) >= {"Aurora Labs", "Nova Widget", "MeshSync"}

    state = json.loads((sandbox / "data" / "state.json").read_text())
    assert set(state["files"]) == {"notes/kickoff.txt", "notes/mesh.md"}

    runs_index = json.loads((sandbox / "data" / "pipeline_runs" / "index.json").read_text())
    assert runs_index[-1]["status"] == "success"
    assert llm.calls.count("extract") == 2
    assert llm.calls.count("synthesize") == 3

    # Second run, nothing changed: no extraction and no synthesis.
    llm.calls.clear()
    assert compiler_main.run_pipeline(force=False) == 0
    assert "extract" not in llm.calls and "synthesize" not in llm.calls

    # Edit one source: only that file is re-extracted.
    (sandbox / "data" / "raw" / "notes" / "mesh.md").write_text("# MeshSync\n\nMeshSync v2 drops relay mode. Aurora Labs ships it.\n", encoding="utf-8")
    llm.calls.clear()
    assert compiler_main.run_pipeline(force=False) == 0
    assert llm.calls.count("extract") == 1

    assert _snapshot_real_files() == before, "the test wrote outside its sandbox"


def test_a_failing_llm_marks_the_run_failed(sandbox, monkeypatch):
    class Broken(ScriptedLLM):
        def generate_response(self, prompt, system_prompt, **kwargs):
            raise RuntimeError("provider down")

    llm = Broken()
    monkeypatch.setattr(compiler_main, "require_llm", lambda *a, **k: llm)
    monkeypatch.setattr(compiler_main.LLMClient, "for_purpose", classmethod(lambda cls, purpose, **kw: llm))
    # The error propagates (main() turns it into a non-zero exit), after the
    # run record -- what the dashboard polls -- has been marked failed.
    with pytest.raises(RuntimeError, match="provider down"):
        compiler_main.run_pipeline(force=True)
    runs_index = json.loads((sandbox / "data" / "pipeline_runs" / "index.json").read_text())
    assert runs_index[-1]["status"] == "error"
    run = json.loads((sandbox / "data" / "pipeline_runs" / f"{runs_index[-1]['id']}.json").read_text())
    failed = [s for s in run["steps"] if s["status"] == "error"]
    assert failed and failed[0]["name"] == "2. Extraction"
    assert "provider down" in run["error"]


def test_no_api_key_fails_fast_without_touching_anything(sandbox, monkeypatch):
    def no_key(*_a, **_k):
        raise RuntimeError("OPENAI_API_KEY is required.")

    monkeypatch.setattr(compiler_main, "require_llm", no_key)
    assert compiler_main.run_pipeline(force=True) == 1
    assert not (sandbox / "data" / "state.json").exists()
