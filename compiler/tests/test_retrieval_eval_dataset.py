import retrieval_eval_dataset as red
from trust_eval_dataset import load_trust_eval_dataset


def test_build_passage_docs_covers_every_claim():
    dataset = load_trust_eval_dataset()
    docs = red.build_passage_docs(dataset)
    all_claim_ids = {c.id for group in dataset.claim_groups for c in group.claims}
    assert {d.id for d in docs} == all_claim_ids


def test_every_query_relevant_id_exists_in_the_dataset():
    dataset = load_trust_eval_dataset()
    all_claim_ids = {c.id for group in dataset.claim_groups for c in group.claims}
    for query in red.QUERIES:
        assert query.relevant_ids, query.id
        assert query.relevant_ids <= all_claim_ids, query.id


def test_query_ids_are_unique():
    ids = [q.id for q in red.QUERIES]
    assert len(ids) == len(set(ids))


def test_query_relevant_ids_stay_within_a_single_claim_group_or_are_explicitly_cross_cutting():
    """Most queries target one topic (one claim group); the two explicitly
    narrower queries (cr2450-mixup, relay-sleep-timer-fix) are subsets of a
    single group too — this dataset doesn't yet have a genuinely
    cross-group query, which is fine for a pilot but worth being able to
    assert about explicitly rather than assuming."""
    dataset = load_trust_eval_dataset()
    group_of: dict[str, str] = {}
    for group in dataset.claim_groups:
        for claim in group.claims:
            group_of[claim.id] = group.id

    for query in red.QUERIES:
        groups_touched = {group_of[cid] for cid in query.relevant_ids}
        assert len(groups_touched) == 1, query.id
