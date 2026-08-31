from graph_store import Edge, GraphStore, Node, import_claim_group
from trust_eval_dataset import load_trust_eval_dataset


def test_add_and_get_node(tmp_path):
    store = GraphStore(tmp_path / "graph.sqlite")
    store.add_node("a", "claim", {"quote": "hello"})

    node = store.get_node("a")
    assert node is not None
    assert node.node_type == "claim"
    assert node.attrs == {"quote": "hello"}


def test_get_missing_node_returns_none(tmp_path):
    store = GraphStore(tmp_path / "graph.sqlite")
    assert store.get_node("nope") is None


def test_add_node_replaces_existing(tmp_path):
    store = GraphStore(tmp_path / "graph.sqlite")
    store.add_node("a", "claim", {"v": 1})
    store.add_node("a", "claim", {"v": 2})
    assert store.node_count() == 1
    assert store.get_node("a").attrs == {"v": 2}


def test_add_edge_and_query_neighbors(tmp_path):
    store = GraphStore(tmp_path / "graph.sqlite")
    store.add_node("a", "claim")
    store.add_node("b", "claim")
    store.add_edge("a", "b", "corroborates")

    neighbors = store.neighbors("a")
    assert len(neighbors) == 1
    assert neighbors[0].to_id == "b"
    assert neighbors[0].edge_type == "corroborates"


def test_neighbors_filtered_by_edge_type(tmp_path):
    store = GraphStore(tmp_path / "graph.sqlite")
    for n in ["a", "b", "c"]:
        store.add_node(n, "claim")
    store.add_edge("a", "b", "corroborates")
    store.add_edge("a", "c", "contradicts")

    assert [e.to_id for e in store.neighbors("a", edge_type="corroborates")] == ["b"]
    assert [e.to_id for e in store.neighbors("a", edge_type="contradicts")] == ["c"]


def test_incoming_edges(tmp_path):
    store = GraphStore(tmp_path / "graph.sqlite")
    store.add_node("a", "claim")
    store.add_node("b", "claim")
    store.add_edge("a", "b", "supersedes")

    incoming = store.incoming("b")
    assert len(incoming) == 1
    assert incoming[0].from_id == "a"


def test_all_nodes_filtered_by_type(tmp_path):
    store = GraphStore(tmp_path / "graph.sqlite")
    store.add_node("a", "claim")
    store.add_node("b", "entity")
    assert {n.id for n in store.all_nodes(node_type="claim")} == {"a"}
    assert {n.id for n in store.all_nodes()} == {"a", "b"}


def test_add_nodes_and_edges_bulk(tmp_path):
    store = GraphStore(tmp_path / "graph.sqlite")
    store.add_nodes([Node("a", "claim", {}), Node("b", "claim", {})])
    store.add_edges([Edge("a", "b", "corroborates", {})])
    assert store.node_count() == 2
    assert store.edge_count() == 1


def test_store_persists_across_instances(tmp_path):
    db_path = tmp_path / "graph.sqlite"
    GraphStore(db_path).add_node("a", "claim", {"quote": "persisted"})

    reopened = GraphStore(db_path)
    assert reopened.get_node("a").attrs == {"quote": "persisted"}


def test_import_claim_group_loads_the_real_pilot_dataset(tmp_path):
    dataset = load_trust_eval_dataset()
    store = GraphStore(tmp_path / "graph.sqlite")
    for group in dataset.claim_groups:
        import_claim_group(store, group)

    total_claims = sum(len(g.claims) for g in dataset.claim_groups)
    total_relations = sum(len(g.relations) for g in dataset.claim_groups)
    assert store.node_count() == total_claims
    assert store.edge_count() == total_relations

    # Spot check: nova_read_interval's supersedes edge should be queryable.
    nri_1_incoming = store.incoming("nri-1", edge_type="supersedes")
    assert [e.from_id for e in nri_1_incoming] == ["nri-2"]
