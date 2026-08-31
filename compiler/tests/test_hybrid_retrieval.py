import hybrid_retrieval as hr


def _doc(doc_id: str, text: str) -> hr.Doc:
    return hr.Doc(id=doc_id, text=text, tokens=hr.tokenize(text))


DOCS = [
    _doc("battery", "Relay radios drain batteries 30% faster than spec once relay mode is enabled."),
    _doc("trademark", "The Nova Widget mark was cleared in class 21 for kitchen gadgets."),
    _doc("empty", ""),
]


def test_bm25_rank_favors_the_relevant_document():
    results = hr.bm25_rank("why do batteries drain so fast", DOCS, top_k=3)
    assert results
    assert results[0].doc_id == "battery"


def test_bm25_rank_returns_empty_for_unmatched_query():
    assert hr.bm25_rank("zzz nonexistent qqq", DOCS) == []


def test_bm25_rank_returns_empty_for_empty_query_or_corpus():
    assert hr.bm25_rank("", DOCS) == []
    assert hr.bm25_rank("battery", []) == []


def test_bm25_rank_ignores_documents_with_no_tokens():
    results = hr.bm25_rank("battery", DOCS)
    assert all(r.doc_id != "empty" for r in results)


def test_cosine_similarity_basic_properties():
    assert hr.cosine_similarity([1.0, 0.0], [1.0, 0.0]) == 1.0
    assert hr.cosine_similarity([1.0, 0.0], [0.0, 1.0]) == 0.0
    assert hr.cosine_similarity([], [1.0]) == 0.0
    assert hr.cosine_similarity([0.0, 0.0], [1.0, 1.0]) == 0.0


def _fake_embed(text: str) -> list[float]:
    """A toy embedding: [count of 'batter' (covers battery/batteries),
    count of 'trademark']. Good enough to test embedding_rank's mechanics
    without a real model."""
    lowered = text.lower()
    return [float(lowered.count("batter")), float(lowered.count("trademark"))]


def test_embedding_rank_uses_the_embed_function_to_order_documents():
    results = hr.embedding_rank("battery drain", DOCS, _fake_embed, top_k=3)
    assert results
    assert results[0].doc_id == "battery"


def test_embedding_rank_accepts_precomputed_embeddings():
    precomputed = hr.embed_documents(DOCS, _fake_embed)
    results = hr.embedding_rank("battery drain", DOCS, _fake_embed, doc_embeddings=precomputed)
    assert results[0].doc_id == "battery"


def test_reciprocal_rank_fusion_rewards_documents_ranked_highly_in_both_lists():
    ranking_a = [hr.RankedDoc("x", 10.0), hr.RankedDoc("y", 5.0), hr.RankedDoc("z", 1.0)]
    ranking_b = [hr.RankedDoc("y", 9.0), hr.RankedDoc("x", 4.0), hr.RankedDoc("z", 1.0)]
    fused = hr.reciprocal_rank_fusion([ranking_a, ranking_b], top_k=3)
    # x is #1 in a and #2 in b; y is #2 in a and #1 in b -> both ahead of z,
    # and by symmetry x and y should tie.
    fused_ids = [item.doc_id for item in fused]
    assert fused_ids[:2] == ["x", "y"] or fused_ids[:2] == ["y", "x"]
    assert fused_ids[2] == "z"


def test_reciprocal_rank_fusion_handles_a_document_missing_from_one_list():
    ranking_a = [hr.RankedDoc("x", 10.0)]
    ranking_b: list[hr.RankedDoc] = []
    fused = hr.reciprocal_rank_fusion([ranking_a, ranking_b])
    assert [item.doc_id for item in fused] == ["x"]


class FakeRerankLLM:
    def __init__(self, response: str):
        self.response = response
        self.calls: list[tuple[str, str]] = []

    def generate_response(self, prompt: str, system_prompt: str, temperature: float = 0.0) -> str:
        self.calls.append((prompt, system_prompt))
        return self.response


def test_llm_rerank_reorders_by_the_models_stated_order():
    candidates = [_doc("a", "first"), _doc("b", "second"), _doc("c", "third")]
    llm = FakeRerankLLM("[3, 1, 2]")
    result = hr.llm_rerank("query", candidates, llm)
    assert [r.doc_id for r in result] == ["c", "a", "b"]
    assert result[0].score > result[1].score > result[2].score


def test_llm_rerank_respects_top_n():
    candidates = [_doc("a", "first"), _doc("b", "second"), _doc("c", "third")]
    llm = FakeRerankLLM("[3, 1, 2]")
    result = hr.llm_rerank("query", candidates, llm, top_n=2)
    assert [r.doc_id for r in result] == ["c", "a"]


def test_llm_rerank_falls_back_to_original_order_on_malformed_response():
    candidates = [_doc("a", "first"), _doc("b", "second")]
    llm = FakeRerankLLM("not json")
    result = hr.llm_rerank("query", candidates, llm)
    assert [r.doc_id for r in result] == ["a", "b"]


def test_llm_rerank_recovers_missing_indices_deterministically():
    """If the model drops an index or duplicates one, missing indices are
    appended in their original order rather than the whole response being
    discarded."""
    candidates = [_doc("a", "first"), _doc("b", "second"), _doc("c", "third")]
    llm = FakeRerankLLM("[2, 2]")  # duplicate, and index 1/3 missing
    result = hr.llm_rerank("query", candidates, llm)
    assert [r.doc_id for r in result] == ["b", "a", "c"]


def test_llm_rerank_returns_empty_for_no_candidates():
    llm = FakeRerankLLM("[]")
    assert hr.llm_rerank("query", [], llm) == []
