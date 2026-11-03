"""Shared test isolation.

Several modules read runtime settings from the real data/ directory (the same
files the running app writes). Without this, a developer's local choices --
e.g. pinning the RAG answer mode to "extractive" on the RAG Architecture page --
silently change what unrelated tests see. Pointing the settings file at a
non-existent path makes every test start from the documented defaults.
"""
import pytest

import llm_client
import page_history
import rag_settings


@pytest.fixture(autouse=True)
def _isolate_rag_settings(tmp_path, monkeypatch):
    monkeypatch.setattr(rag_settings, "RAG_SETTINGS_FILE", tmp_path / "no-rag-settings.json")


@pytest.fixture(autouse=True)
def _isolate_llm_cache(tmp_path, monkeypatch):
    # Any LLMClient() opens (and on a fresh checkout creates) the response
    # cache; keep that out of the real data/.
    monkeypatch.setattr(llm_client, "DEFAULT_CACHE_PATH", tmp_path / "llm-cache.sqlite")


@pytest.fixture(autouse=True)
def _isolate_page_history(tmp_path, monkeypatch):
    # The linker snapshots pages before overwriting them; tests that compile
    # into a tmp docs dir must not write versions into the real data/.
    monkeypatch.setattr(page_history, "HISTORY_DIR", tmp_path / "page_history")


_WATCHED = [("data", {"raw"}), ("wiki-app/docs", set()), ("compiler/temp_output", set())]


def _fingerprint():
    from models import PROJECT_ROOT

    seen = {}
    for rel, skip in _WATCHED:
        root = PROJECT_ROOT / rel
        if not root.exists():
            continue
        for path in root.rglob("*"):
            parts = path.relative_to(root).parts
            if parts and parts[0] in skip:
                continue
            if path.is_file():
                stat = path.stat()
                seen[str(path.relative_to(PROJECT_ROOT))] = (stat.st_size, stat.st_mtime_ns)
    return seen


@pytest.fixture(scope="session", autouse=True)
def _tests_do_not_touch_the_real_workspace():
    """Fail the run if any test created, changed or deleted a file under the
    real data/ (raw sources excepted), wiki-app/docs/ or temp_output/ --
    the folders the running app owns. Tests must use tmp_path."""
    before = _fingerprint()
    yield
    after = _fingerprint()
    changed = sorted(k for k in before.keys() | after.keys() if before.get(k) != after.get(k))
    assert not changed, f"tests modified the real workspace: {changed[:10]}"
