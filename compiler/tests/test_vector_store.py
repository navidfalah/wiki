from vector_store import VectorRecord, VectorStore, _cosine_similarity


def test_cosine_similarity_basic_properties():
    assert _cosine_similarity([1.0, 0.0], [1.0, 0.0]) == 1.0
    assert _cosine_similarity([1.0, 0.0], [0.0, 1.0]) == 0.0
    assert _cosine_similarity([], [1.0]) == 0.0


def test_upsert_and_get(tmp_path):
    store = VectorStore(tmp_path / "vectors.sqlite")
    store.upsert(VectorRecord(id="a", text="hello", embedding=[1.0, 0.0]))

    record = store.get("a")
    assert record is not None
    assert record.text == "hello"
    assert record.embedding == [1.0, 0.0]


def test_get_missing_returns_none(tmp_path):
    store = VectorStore(tmp_path / "vectors.sqlite")
    assert store.get("nope") is None


def test_upsert_replaces_existing_record(tmp_path):
    store = VectorStore(tmp_path / "vectors.sqlite")
    store.upsert(VectorRecord(id="a", text="old", embedding=[1.0, 0.0]))
    store.upsert(VectorRecord(id="a", text="new", embedding=[0.0, 1.0]))

    assert store.count() == 1
    assert store.get("a").text == "new"


def test_upsert_many_and_count(tmp_path):
    store = VectorStore(tmp_path / "vectors.sqlite")
    store.upsert_many(
        [
            VectorRecord(id=f"doc{i}", text=f"text {i}", embedding=[float(i), 0.0])
            for i in range(10)
        ]
    )
    assert store.count() == 10


def test_search_ranks_by_cosine_similarity(tmp_path):
    store = VectorStore(tmp_path / "vectors.sqlite")
    store.upsert_many(
        [
            VectorRecord(id="close", text="close", embedding=[1.0, 0.1]),
            VectorRecord(id="far", text="far", embedding=[0.0, 1.0]),
            VectorRecord(id="exact", text="exact", embedding=[1.0, 0.0]),
        ]
    )
    results = store.search([1.0, 0.0], top_k=3)
    assert results[0][0] == "exact"
    assert results[-1][0] == "far"


def test_search_respects_top_k(tmp_path):
    store = VectorStore(tmp_path / "vectors.sqlite")
    store.upsert_many([VectorRecord(id=f"d{i}", text="x", embedding=[1.0, 0.0]) for i in range(20)])
    assert len(store.search([1.0, 0.0], top_k=5)) == 5


def test_delete_removes_record(tmp_path):
    store = VectorStore(tmp_path / "vectors.sqlite")
    store.upsert(VectorRecord(id="a", text="x", embedding=[1.0]))
    store.delete("a")
    assert store.get("a") is None
    assert store.count() == 0


def test_store_persists_across_instances(tmp_path):
    db_path = tmp_path / "vectors.sqlite"
    VectorStore(db_path).upsert(VectorRecord(id="a", text="persisted", embedding=[1.0, 2.0]))

    reopened = VectorStore(db_path)
    record = reopened.get("a")
    assert record is not None
    assert record.text == "persisted"
