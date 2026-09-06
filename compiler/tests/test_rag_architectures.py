import json

import pytest

import rag_architectures
import rag_engine
from llm_client import LLMClient


def _write_page(docs_dir, name, title, body):
    (docs_dir / name).write_text(f"---\ntitle: {title}\n---\n\n{body}\n", encoding="utf-8")


def _battery_corpus(tmp_path):
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


class FakeArchLLM:
    """available + embed_text + generate_response, with a scriptable
    generate_response so each architecture's own LLM call (hypothetical doc,
    query variants, relevance grade, rewrite) can be tested in isolation."""

    available = True

    def __init__(self, responses=None, embed_fn=None):
        self._responses = list(responses or [])
        self._embed_fn = embed_fn or (lambda text: [float(text.lower().count("batter")), 0.0])
        self.generate_calls: list[str] = []
        self.embed_calls: list[str] = []

    def generate_response(self, prompt: str, system_prompt: str, temperature: float = 0.0) -> str:
        self.generate_calls.append(system_prompt)
        if self._responses:
            return self._responses.pop(0)
        return ""

    def embed_text(self, text: str) -> list[float]:
        self.embed_calls.append(text)
        return self._embed_fn(text)


class BrokenLLM(FakeArchLLM):
    def generate_response(self, prompt: str, system_prompt: str, temperature: float = 0.0) -> str:
        raise RuntimeError("chat API down")

    def embed_text(self, text: str) -> list[float]:
        raise RuntimeError("embeddings API down")


# --- naive --------------------------------------------------------------


def test_naive_ranks_relevant_passage_first(tmp_path):
    corpus = _battery_corpus(tmp_path)
    results = rag_architectures.retrieve_naive("why do batteries drain so fast", corpus, top_k=1)
    assert results
    assert results[0].passage.heading == "Battery"


def test_naive_ignores_the_llm_argument(tmp_path):
    corpus = _battery_corpus(tmp_path)
    broken = BrokenLLM()
    results = rag_architectures.retrieve_naive("battery drain", corpus, top_k=1, llm=broken)
    assert results
    assert not broken.generate_calls


# --- HyDE -----------------------------------------------------------------


def test_hyde_without_llm_falls_back_to_bm25(tmp_path):
    corpus = _battery_corpus(tmp_path)
    no_key = LLMClient(api_key="")
    hyde = rag_architectures.retrieve_hyde("battery drain", corpus, top_k=1, llm=no_key)
    naive = rag_architectures.retrieve_naive("battery drain", corpus, top_k=1)
    assert [r.passage.heading for r in hyde] == [r.passage.heading for r in naive]


def test_hyde_embeds_the_hypothetical_passage_not_the_raw_query(tmp_path):
    corpus = _battery_corpus(tmp_path)
    fake = FakeArchLLM(responses=["Relay radios famously drain batteries fast."])
    results = rag_architectures.retrieve_hyde("battery drain", corpus, top_k=1, llm=fake)
    assert results
    assert results[0].passage.heading == "Battery"
    # embedding_rank embeds every corpus passage plus the query vector last --
    # the point here is that the *query* embedding is the hypothetical
    # passage, not the raw question text.
    assert fake.embed_calls[-1] == "Relay radios famously drain batteries fast."
    assert "battery drain" not in fake.embed_calls


def test_hyde_degrades_to_bm25_when_the_hypothetical_call_fails(tmp_path):
    corpus = _battery_corpus(tmp_path)
    broken = BrokenLLM()
    hyde = rag_architectures.retrieve_hyde("battery drain", corpus, top_k=1, llm=broken)
    naive = rag_architectures.retrieve_naive("battery drain", corpus, top_k=1)
    assert [r.passage.heading for r in hyde] == [r.passage.heading for r in naive]


# --- RAG-Fusion -------------------------------------------------------------


def test_fusion_without_llm_falls_back_to_bm25(tmp_path):
    corpus = _battery_corpus(tmp_path)
    no_key = LLMClient(api_key="")
    fusion = rag_architectures.retrieve_fusion("battery drain", corpus, top_k=1, llm=no_key)
    naive = rag_architectures.retrieve_naive("battery drain", corpus, top_k=1)
    assert [r.passage.heading for r in fusion] == [r.passage.heading for r in naive]


def test_fusion_retrieves_with_every_generated_variant(tmp_path):
    corpus = _battery_corpus(tmp_path)
    fake = FakeArchLLM(responses=[json.dumps(["relay battery drain", "kitchen gadget trademark"])])
    results = rag_architectures.retrieve_fusion("battery drain", corpus, top_k=2, llm=fake, num_variants=2)
    headings = {r.passage.heading for r in results}
    # The trademark variant should surface the Trademark passage even though
    # the original query never mentions it.
    assert "Trademark" in headings
    assert "Battery" in headings


def test_fusion_ignores_a_malformed_variant_response(tmp_path):
    corpus = _battery_corpus(tmp_path)
    fake = FakeArchLLM(responses=["not json"])
    fusion = rag_architectures.retrieve_fusion("battery drain", corpus, top_k=1, llm=fake)
    naive = rag_architectures.retrieve_naive("battery drain", corpus, top_k=1)
    assert [r.passage.heading for r in fusion] == [r.passage.heading for r in naive]


# --- GraphRAG-lite -----------------------------------------------------------


def _linked_corpus(tmp_path):
    docs_dir = tmp_path / "docs"
    docs_dir.mkdir()
    _write_page(
        docs_dir,
        "meshsync.md",
        "MeshSync",
        "## Overview\n\nMeshSync relays are the core hardware, see [Nova Widget](./nova-widget.md) for the "
        "companion device.\n",
    )
    _write_page(
        docs_dir,
        "nova-widget.md",
        "Nova Widget",
        "## Battery\n\nRelay radios drain batteries 30% faster than spec once relay mode is enabled.\n",
    )
    _write_page(
        docs_dir,
        "unrelated.md",
        "Unrelated Page",
        "## Notes\n\nThis page has nothing to do with either product and links to nothing.\n",
    )
    return rag_engine.build_corpus(docs_dir)


def test_graph_expands_to_a_linked_page_not_matched_by_keywords(tmp_path):
    corpus = _linked_corpus(tmp_path)
    # "meshsync" only appears on meshsync.md; the actual battery-drain fact
    # lives on the page it links to.
    results = rag_architectures.retrieve_graph("meshsync", corpus, top_k=3, hops=1)
    doc_paths = {r.passage.doc_path for r in results}
    assert "meshsync.md" in doc_paths
    assert "nova-widget.md" in doc_paths
    assert "unrelated.md" not in doc_paths


def test_graph_zero_hops_behaves_like_naive(tmp_path):
    corpus = _linked_corpus(tmp_path)
    graph = rag_architectures.retrieve_graph("meshsync", corpus, top_k=3, hops=0)
    naive = rag_architectures.retrieve_naive("meshsync", corpus, top_k=3)
    assert [r.passage.doc_path for r in graph] == [r.passage.doc_path for r in naive]


def test_graph_returns_empty_for_unmatched_query(tmp_path):
    corpus = _linked_corpus(tmp_path)
    assert rag_architectures.retrieve_graph("zzz nonexistent qqq", corpus) == []


# --- Corrective RAG (CRAG-lite) ---------------------------------------------


def test_corrective_returns_first_pass_when_llm_grades_it_correct(tmp_path):
    corpus = _battery_corpus(tmp_path)
    fake = FakeArchLLM(responses=["CORRECT"])
    results = rag_architectures.retrieve_corrective("battery drain", corpus, top_k=1, llm=fake)
    assert results
    assert results[0].passage.heading == "Battery"
    assert fake.generate_calls == [rag_architectures.CORRECTIVE_GRADE_SYSTEM_PROMPT]


def test_corrective_rewrites_and_retries_when_llm_grades_it_incorrect(tmp_path):
    corpus = _battery_corpus(tmp_path)
    # A query that does retrieve something (so grading actually runs) but
    # the fake LLM grades it INCORRECT anyway, to exercise the rewrite+retry
    # path rather than the first-pass-is-fine path.
    fake = FakeArchLLM(responses=["INCORRECT", "battery drain relay"])
    results = rag_architectures.retrieve_corrective("battery drain", corpus, top_k=1, llm=fake)
    assert len(fake.generate_calls) == 2
    assert fake.generate_calls[0] == rag_architectures.CORRECTIVE_GRADE_SYSTEM_PROMPT
    assert fake.generate_calls[1] == rag_architectures.CORRECTIVE_REWRITE_SYSTEM_PROMPT
    assert results


def test_corrective_without_llm_uses_the_heuristic_grader(tmp_path):
    corpus = _battery_corpus(tmp_path)
    no_key = LLMClient(api_key="")
    results = rag_architectures.retrieve_corrective("why do batteries drain so fast", corpus, top_k=1, llm=no_key)
    assert results
    assert results[0].passage.heading == "Battery"


def test_corrective_degrades_gracefully_when_llm_calls_fail(tmp_path):
    corpus = _battery_corpus(tmp_path)
    broken = BrokenLLM()
    results = rag_architectures.retrieve_corrective("why do batteries drain so fast", corpus, top_k=1, llm=broken)
    assert results
    assert results[0].passage.heading == "Battery"


# --- dispatch -----------------------------------------------------------------


def test_retrieve_dispatches_by_architecture_name(tmp_path):
    corpus = _battery_corpus(tmp_path)
    results = rag_architectures.retrieve("naive", "battery drain", corpus, top_k=1)
    assert results[0].passage.heading == "Battery"


def test_retrieve_rejects_an_unknown_architecture(tmp_path):
    corpus = _battery_corpus(tmp_path)
    with pytest.raises(ValueError):
        rag_architectures.retrieve("hybrid", "battery drain", corpus)
