from scalability_benchmark import benchmark_at_size, generate_synthetic_corpus, run_benchmark


def test_generate_synthetic_corpus_produces_exactly_the_requested_size():
    docs = generate_synthetic_corpus(37)
    assert len(docs) == 37


def test_generate_synthetic_corpus_ids_are_unique():
    docs = generate_synthetic_corpus(50)
    assert len({d.id for d in docs}) == 50


def test_generate_synthetic_corpus_is_deterministic_for_a_given_seed():
    a = generate_synthetic_corpus(20, seed=42)
    b = generate_synthetic_corpus(20, seed=42)
    assert [d.text for d in a] == [d.text for d in b]


def test_generate_synthetic_corpus_different_seeds_vary_text():
    a = generate_synthetic_corpus(20, seed=1)
    b = generate_synthetic_corpus(20, seed=2)
    assert [d.text for d in a] != [d.text for d in b]


def test_generate_synthetic_corpus_larger_than_base_dataset_still_works():
    # retrieval_eval_dataset.py's base corpus has ~24 passages; requesting
    # more than that should cycle through them, not fail or truncate.
    docs = generate_synthetic_corpus(100)
    assert len(docs) == 100


def test_benchmark_at_size_returns_nonnegative_timings():
    result = benchmark_at_size(10)
    assert result.corpus_size == 10
    assert result.bm25_index_seconds >= 0
    assert result.bm25_query_seconds >= 0
    assert result.vector_insert_seconds >= 0
    assert result.vector_query_seconds >= 0


def test_run_benchmark_covers_every_requested_size():
    results = run_benchmark([5, 25])
    assert [r.corpus_size for r in results] == [5, 25]
