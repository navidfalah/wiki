"""Shared test isolation.

Several modules read runtime settings from the real data/ directory (the same
files the running app writes). Without this, a developer's local choices --
e.g. pinning the RAG answer mode to "extractive" on the RAG Architecture page --
silently change what unrelated tests see. Pointing the settings file at a
non-existent path makes every test start from the documented defaults.
"""
import pytest

import rag_settings


@pytest.fixture(autouse=True)
def _isolate_rag_settings(tmp_path, monkeypatch):
    monkeypatch.setattr(rag_settings, "RAG_SETTINGS_FILE", tmp_path / "no-rag-settings.json")
