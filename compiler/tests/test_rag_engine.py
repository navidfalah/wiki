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


class FakeHybridLLM:
    """available + embed_text + generate_response, enough to exercise every
    tier of retrieve_hybrid (BM25 -> embeddings/RRF -> LLM rerank)."""

    available = True

    def __init__(self, embed_fn=None, rerank_response: str | None = None):
        self._embed_fn = embed_fn or (lambda text: [float(text.lower().count("batter")), 0.0])
        self._rerank_response = rerank_response
        self.embed_calls: list[str] = []
        self.rerank_calls = 0

    def embed_text(self, text: str) -> list[float]:
        self.embed_calls.append(text)
        return self._embed_fn(text)

    def generate_response(self, prompt: str, system_prompt: str, temperature: float = 0.0) -> str:
        self.rerank_calls += 1
        return self._rerank_response or "[1]"


def _two_passage_corpus(tmp_path):
    docs_dir = tmp_path / "docs"
    docs_dir.mkdir()
    _write_page(
        docs_dir,
        "meshsync.md",
        "MeshSync",
        "## Battery\n\nRelay radios drain batteries 30% faster than spec once relay mode is enabled.\n\n"
        "## Trademark\n\nThe Nova Widget mark was cleared in class 21 for kitchen gadgets.\n",
    )
    return rag_engine.build_corpus(docs_dir)


def test_retrieve_hybrid_without_llm_falls_back_to_bm25_only(tmp_path):
    corpus = _two_passage_corpus(tmp_path)
    no_key_client = LLMClient(api_key="")

    hybrid = rag_engine.retrieve_hybrid("battery drain", corpus, top_k=2, llm=no_key_client)
    bm25_only = rag_engine.retrieve("battery drain", corpus, top_k=2)
    assert [r.passage.heading for r in hybrid] == [r.passage.heading for r in bm25_only]


def test_retrieve_hybrid_uses_embeddings_and_reranker_when_available(tmp_path):
    corpus = _two_passage_corpus(tmp_path)
    fake_llm = FakeHybridLLM(rerank_response="[1]")

    results = rag_engine.retrieve_hybrid("battery drain", corpus, top_k=1, llm=fake_llm)
    assert results
    assert results[0].passage.heading == "Battery"
    assert fake_llm.embed_calls  # embeddings tier was actually used
    assert fake_llm.rerank_calls == 1  # reranker tier was actually used


def test_retrieve_hybrid_falls_back_to_fused_ranking_when_rerank_disabled(tmp_path):
    corpus = _two_passage_corpus(tmp_path)
    fake_llm = FakeHybridLLM()

    results = rag_engine.retrieve_hybrid("battery drain", corpus, top_k=1, llm=fake_llm, rerank=False)
    assert results
    assert results[0].passage.heading == "Battery"
    assert fake_llm.rerank_calls == 0


class BrokenEmbeddingLLM(FakeHybridLLM):
    def embed_text(self, text: str) -> list[float]:
        raise RuntimeError("embeddings API down")


def test_retrieve_hybrid_degrades_gracefully_when_embeddings_fail(tmp_path):
    corpus = _two_passage_corpus(tmp_path)
    broken_embeddings_llm = BrokenEmbeddingLLM(rerank_response="[1]")

    results = rag_engine.retrieve_hybrid("battery drain", corpus, top_k=1, llm=broken_embeddings_llm)
    assert results
    assert results[0].passage.heading == "Battery"
    assert broken_embeddings_llm.rerank_calls == 1  # still made it to the rerank tier


class BrokenRerankLLM(FakeHybridLLM):
    def generate_response(self, prompt: str, system_prompt: str, temperature: float = 0.0) -> str:
        raise RuntimeError("chat API down")


def test_retrieve_hybrid_degrades_gracefully_when_rerank_fails(tmp_path):
    corpus = _two_passage_corpus(tmp_path)
    broken_rerank_llm = BrokenRerankLLM()

    results = rag_engine.retrieve_hybrid("battery drain", corpus, top_k=1, llm=broken_rerank_llm)
    assert results
    assert results[0].passage.heading == "Battery"  # fused ranking still returned something sensible


def test_answer_question_uses_hybrid_retrieval(tmp_path):
    docs_dir = tmp_path / "docs"
    docs_dir.mkdir()
    _write_page(
        docs_dir,
        "meshsync.md",
        "MeshSync",
        "## Battery\n\nRelay radios drain batteries 30% faster than spec once relay mode is enabled.\n",
    )
    fake_llm = FakeHybridLLM(rerank_response="[1]")
    fake_llm.generate_response = lambda prompt, system_prompt, temperature=0.0: (
        "[1]" if "reranker" in system_prompt.lower() else "Grounded answer."
    )

    result = rag_engine.answer_question("why do batteries drain fast", docs_dir=docs_dir, llm=fake_llm)
    assert result["mode"] == "generated"
    assert fake_llm.embed_calls  # hybrid retrieval actually ran, not just BM25
