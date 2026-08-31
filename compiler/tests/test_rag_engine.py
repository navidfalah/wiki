import rag_engine
from llm_client import LLMClient


def _write_page(docs_dir, name, title, body):
    (docs_dir / name).write_text(f"---\ntitle: {title}\n---\n\n{body}\n", encoding="utf-8")


def test_build_corpus_splits_by_heading(tmp_path):
    docs_dir = tmp_path / "docs"
    docs_dir.mkdir()
    _write_page(
        docs_dir,
        "meshsync.md",
        "MeshSync",
        "## Battery\n\nRelay radios drain batteries 30% faster than spec.\n\n"
        "## Firmware\n\nVersion 0.3.9 fixes the relay sleep timer bug.\n",
    )

    corpus = rag_engine.build_corpus(docs_dir)
    headings = {p.heading for p in corpus}
    assert "Battery" in headings
    assert "Firmware" in headings
    assert all(p.doc_path == "meshsync.md" for p in corpus)


def test_retrieve_ranks_relevant_passage_first(tmp_path):
    docs_dir = tmp_path / "docs"
    docs_dir.mkdir()
    _write_page(
        docs_dir,
        "meshsync.md",
        "MeshSync",
        "## Battery\n\nRelay radios drain batteries 30% faster than spec once relay mode is enabled.\n\n"
        "## Trademark\n\nThe Nova Widget mark was cleared in class 21 for kitchen gadgets.\n",
    )
    corpus = rag_engine.build_corpus(docs_dir)

    results = rag_engine.retrieve("why do batteries drain so fast", corpus, top_k=3)
    assert results
    assert results[0].passage.heading == "Battery"


def test_retrieve_returns_empty_for_unmatched_query(tmp_path):
    docs_dir = tmp_path / "docs"
    docs_dir.mkdir()
    _write_page(docs_dir, "meshsync.md", "MeshSync", "## Battery\n\nRelay radios drain batteries.\n")
    corpus = rag_engine.build_corpus(docs_dir)

    assert rag_engine.retrieve("zzz nonexistent qqq", corpus) == []


def test_answer_question_empty_corpus_reports_not_compiled(tmp_path):
    docs_dir = tmp_path / "docs"
    docs_dir.mkdir()
    result = rag_engine.answer_question("what is meshsync", docs_dir=docs_dir)
    assert result["mode"] == "empty"
    assert result["sources"] == []


def test_answer_question_falls_back_to_extractive_without_llm(tmp_path):
    docs_dir = tmp_path / "docs"
    docs_dir.mkdir()
    _write_page(
        docs_dir,
        "meshsync.md",
        "MeshSync",
        "## Battery\n\nRelay radios drain batteries 30% faster than spec once relay mode is enabled.\n",
    )

    no_key_client = LLMClient(api_key="")
    result = rag_engine.answer_question(
        "why do batteries drain fast", docs_dir=docs_dir, llm=no_key_client
    )
    assert result["mode"] == "extractive"
    assert result["sources"][0]["doc_path"] == "meshsync.md"
    assert "Battery" in result["answer"]


def test_answer_question_requires_a_message():
    result = rag_engine.answer_question("   ")
    assert result["mode"] == "empty"
