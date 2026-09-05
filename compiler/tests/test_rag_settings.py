import json

import rag_settings
from rag_settings import RagSettings, load_rag_settings


def test_load_rag_settings_missing_file_returns_defaults(tmp_path, monkeypatch):
    monkeypatch.setattr(rag_settings, "RAG_SETTINGS_FILE", tmp_path / "missing.json")
    assert load_rag_settings() == RagSettings()


def test_load_rag_settings_malformed_json_returns_defaults(tmp_path, monkeypatch):
    settings_file = tmp_path / "rag_settings.json"
    settings_file.write_text("{not valid json", encoding="utf-8")
    monkeypatch.setattr(rag_settings, "RAG_SETTINGS_FILE", settings_file)
    assert load_rag_settings() == RagSettings()


def test_load_rag_settings_non_dict_json_returns_defaults(tmp_path, monkeypatch):
    settings_file = tmp_path / "rag_settings.json"
    settings_file.write_text(json.dumps(["not", "a", "dict"]), encoding="utf-8")
    monkeypatch.setattr(rag_settings, "RAG_SETTINGS_FILE", settings_file)
    assert load_rag_settings() == RagSettings()


def test_load_rag_settings_reads_valid_overrides(tmp_path, monkeypatch):
    settings_file = tmp_path / "rag_settings.json"
    settings_file.write_text(
        json.dumps(
            {
                "architecture": "hyde",
                "retrieval_mode": "bm25",
                "top_k": 8,
                "bm25_k1": 1.2,
                "bm25_b": 0.6,
                "use_vector_store": True,
                "answer_mode": "extractive",
            }
        ),
        encoding="utf-8",
    )
    monkeypatch.setattr(rag_settings, "RAG_SETTINGS_FILE", settings_file)
    settings = load_rag_settings()
    assert settings.architecture == "hyde"
    assert settings.retrieval_mode == "bm25"
    assert settings.top_k == 8
    assert settings.bm25_k1 == 1.2
    assert settings.bm25_b == 0.6
    assert settings.use_vector_store is True
    assert settings.answer_mode == "extractive"


def test_load_rag_settings_unknown_architecture_falls_back_to_hybrid(tmp_path, monkeypatch):
    settings_file = tmp_path / "rag_settings.json"
    settings_file.write_text(json.dumps({"architecture": "nonsense"}), encoding="utf-8")
    monkeypatch.setattr(rag_settings, "RAG_SETTINGS_FILE", settings_file)
    assert load_rag_settings().architecture == "hybrid"


def test_load_rag_settings_unknown_retrieval_mode_falls_back_to_hybrid_rerank(tmp_path, monkeypatch):
    settings_file = tmp_path / "rag_settings.json"
    settings_file.write_text(json.dumps({"retrieval_mode": "nonsense"}), encoding="utf-8")
    monkeypatch.setattr(rag_settings, "RAG_SETTINGS_FILE", settings_file)
    assert load_rag_settings().retrieval_mode == "hybrid_rerank"


def test_load_rag_settings_unknown_answer_mode_falls_back_to_auto(tmp_path, monkeypatch):
    settings_file = tmp_path / "rag_settings.json"
    settings_file.write_text(json.dumps({"answer_mode": "nonsense"}), encoding="utf-8")
    monkeypatch.setattr(rag_settings, "RAG_SETTINGS_FILE", settings_file)
    assert load_rag_settings().answer_mode == "auto"


def test_load_rag_settings_non_positive_top_k_falls_back_to_default(tmp_path, monkeypatch):
    settings_file = tmp_path / "rag_settings.json"
    settings_file.write_text(json.dumps({"top_k": 0}), encoding="utf-8")
    monkeypatch.setattr(rag_settings, "RAG_SETTINGS_FILE", settings_file)
    assert load_rag_settings().top_k == 5


def test_load_rag_settings_negative_top_k_falls_back_to_default(tmp_path, monkeypatch):
    settings_file = tmp_path / "rag_settings.json"
    settings_file.write_text(json.dumps({"top_k": -3}), encoding="utf-8")
    monkeypatch.setattr(rag_settings, "RAG_SETTINGS_FILE", settings_file)
    assert load_rag_settings().top_k == 5


def test_load_rag_settings_non_numeric_top_k_falls_back_to_default(tmp_path, monkeypatch):
    settings_file = tmp_path / "rag_settings.json"
    settings_file.write_text(json.dumps({"top_k": "not-a-number"}), encoding="utf-8")
    monkeypatch.setattr(rag_settings, "RAG_SETTINGS_FILE", settings_file)
    assert load_rag_settings().top_k == 5


def test_load_rag_settings_non_numeric_bm25_params_fall_back_to_defaults(tmp_path, monkeypatch):
    settings_file = tmp_path / "rag_settings.json"
    settings_file.write_text(
        json.dumps({"bm25_k1": "oops", "bm25_b": "oops"}), encoding="utf-8"
    )
    monkeypatch.setattr(rag_settings, "RAG_SETTINGS_FILE", settings_file)
    settings = load_rag_settings()
    assert settings.bm25_k1 == 1.5
    assert settings.bm25_b == 0.75


def test_enable_embeddings_true_for_hybrid_modes():
    assert RagSettings(retrieval_mode="hybrid").enable_embeddings is True
    assert RagSettings(retrieval_mode="hybrid_rerank").enable_embeddings is True


def test_enable_embeddings_false_for_bm25_only():
    assert RagSettings(retrieval_mode="bm25").enable_embeddings is False


def test_enable_rerank_only_true_for_hybrid_rerank():
    assert RagSettings(retrieval_mode="hybrid_rerank").enable_rerank is True
    assert RagSettings(retrieval_mode="hybrid").enable_rerank is False
    assert RagSettings(retrieval_mode="bm25").enable_rerank is False


def test_default_settings_match_pre_existing_hybrid_rerank_behavior():
    defaults = RagSettings()
    assert defaults.architecture == "hybrid"
    assert defaults.retrieval_mode == "hybrid_rerank"
    assert defaults.enable_embeddings is True
    assert defaults.enable_rerank is True
    assert defaults.use_vector_store is False
    assert defaults.answer_mode == "auto"
