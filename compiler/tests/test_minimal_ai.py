"""Behavioral checks for the normal app path: no hidden model calls."""
import json

import pytest

import rag_engine
import rag_settings
from linker import link_and_export_pages


@pytest.mark.parametrize('stream', [False, True])
def test_default_chat_never_constructs_a_model_client(tmp_path, monkeypatch, stream):
    docs = tmp_path / 'docs'
    docs.mkdir()
    (docs / 'battery.md').write_text('# Battery\n\nFrequent transmissions drain the battery.\n')

    def unexpected(*args, **kwargs):
        pytest.fail('The local chat path must not construct a model client')

    monkeypatch.setattr(rag_engine.LLMClient, 'for_purpose', unexpected)
    if stream:
        events = list(rag_engine.answer_question_stream('battery', docs_dir=docs))
        result = events[-1]
    else:
        result = rag_engine.answer_question('battery', docs_dir=docs)
    assert result['mode'] == 'extractive'
    assert 'Frequent transmissions drain the battery.' in result['answer']


def test_saved_experimental_modes_cannot_reenable_generation(tmp_path, monkeypatch):
    settings_file = tmp_path / 'settings.json'
    settings_file.write_text(json.dumps({
        'architecture': 'hyde', 'retrieval_mode': 'hybrid_rerank', 'answer_mode': 'auto'
    }))
    monkeypatch.setattr(rag_settings, 'RAG_SETTINGS_FILE', settings_file)
    settings = rag_settings.load_rag_settings()
    assert settings.architecture == 'hybrid'
    assert settings.retrieval_mode == 'bm25'
    assert settings.answer_mode == 'extractive'


def test_link_export_needs_no_model_and_preserves_prose(tmp_path):
    drafts = tmp_path / 'drafts'
    drafts.mkdir()
    (drafts / 'sensor.md').write_text('# Sensor\n\nBattery life is measured in days.\n')
    (drafts / 'battery.md').write_text('# Battery\n\nSee Sensor.\n')
    written, _ = link_and_export_pages(
        {'Sensor': 'sensor.md', 'Battery': 'battery.md'},
        temp_dir=drafts, output_dir=tmp_path / 'docs',
    )
    assert len(written) == 2
    assert '[Battery](./battery.md) life is measured in days.' in (tmp_path / 'docs/sensor.md').read_text()
    assert 'See [Sensor](./sensor.md).' in (tmp_path / 'docs/battery.md').read_text()


def test_identity_matching_preserves_distinct_symbols_and_unicode():
    from entity_resolution import Mention, resolve_entities
    names = ["C", "C++", "مینا", "سارا"]
    clusters = resolve_entities([Mention(name, "notes.txt") for name in names])
    assert len(clusters) == 4


def test_raw_source_chat_needs_no_compiled_wiki_or_model(tmp_path, monkeypatch):
    (tmp_path / "sensor.txt").write_text("Frequent transmissions drain the battery.")
    monkeypatch.setattr(rag_engine, "RAW_DIR", tmp_path)

    def unexpected(*args, **kwargs):
        pytest.fail("Raw keyword search must not construct a model client")

    monkeypatch.setattr(rag_engine.LLMClient, "for_purpose", unexpected)
    result = rag_engine.answer_question("battery", source="raw")
    assert result["mode"] == "extractive"
    assert result["sources"][0]["doc_path"] == "sensor.txt"
    assert "Frequent transmissions drain the battery." in result["answer"]


def test_raw_images_cannot_trigger_captioning_with_a_configured_key(tmp_path, monkeypatch):
    (tmp_path / "battery.png").write_bytes(b"placeholder")

    def unexpected(*args, **kwargs):
        pytest.fail("Raw-source search must not create any model client")

    monkeypatch.setattr(rag_engine.LLMClient, "__init__", unexpected)
    corpus = rag_engine.build_raw_corpus(tmp_path)
    assert len(corpus) == 1
    assert corpus[0].doc_path == "battery.png"
    assert "image content is not searched" in corpus[0].text
