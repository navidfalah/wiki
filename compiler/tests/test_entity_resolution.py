from entity_resolution import (
    EntityCluster,
    Mention,
    ResolutionConfig,
    heuristic_similarity,
    resolve_entities,
)


def test_heuristic_similarity_exact_match_is_one():
    assert heuristic_similarity("Mira Chen", "Mira Chen") == 1.0


def test_heuristic_similarity_email_local_part_matches_full_name():
    score = heuristic_similarity("mira.chen@auroralabs.example", "Mira Chen")
    assert score >= 0.85


def test_heuristic_similarity_first_name_subset_of_full_name():
    score = heuristic_similarity("Mira", "Mira Chen")
    assert score >= 0.85


def test_heuristic_similarity_different_people_sharing_a_surname_scores_low():
    # Alex Rivera and Sam Rivera: same surname, different people. No token
    # subset relationship (neither name's tokens are a subset of the
    # other's), so this must NOT hit the 0.85 subset shortcut.
    score = heuristic_similarity("Alex Rivera", "Sam Rivera")
    assert score < 0.85


def test_heuristic_similarity_different_people_sharing_a_first_name_scores_low():
    score = heuristic_similarity("Alex Kim", "Alex Rivera")
    assert score < 0.85


def test_resolve_entities_merges_name_and_email_variants_heuristically_alone():
    """No embed_fn, no llm — the heuristic tier alone should be enough for
    the strong-evidence cases (full name / first name / email)."""
    mentions = [
        Mention("Mira Chen", "notes/kickoff.md"),
        Mention("Mira", "transcripts/battery-debate.txt"),
        Mention("mira.chen@auroralabs.example", "emails/report.eml"),
    ]
    clusters = resolve_entities(mentions)
    assert len(clusters) == 1
    assert clusters[0].canonical_name == "Mira Chen"
    assert clusters[0].aliases == {"Mira Chen", "Mira", "mira.chen@auroralabs.example"}
    assert clusters[0].sources == {"notes/kickoff.md", "transcripts/battery-debate.txt", "emails/report.eml"}


def test_resolve_entities_does_not_merge_different_people_sharing_a_name_token():
    """The hard negative this dataset was built around: Alex Kim, Alex
    Rivera, and Sam Rivera are three different people in this repo's real
    corpus who happen to share a first or last name."""
    mentions = [
        Mention("Alex Kim", "articles/teabuddy.md"),
        Mention("Alex Rivera", "notes/other.md"),
        Mention("Sam Rivera", "articles/teabuddy.md"),
    ]
    clusters = resolve_entities(mentions)
    assert len(clusters) == 3
    assert {c.canonical_name for c in clusters} == {"Alex Kim", "Alex Rivera", "Sam Rivera"}


def test_resolve_entities_picks_a_human_readable_canonical_name_over_an_email():
    mentions = [
        Mention("Jonah Park", "notes/kickoff.md"),
        Mention("jonah.park@auroralabs.example", "emails/reply.eml"),
    ]
    clusters = resolve_entities(mentions)
    assert len(clusters) == 1
    assert clusters[0].canonical_name == "Jonah Park"


def test_resolve_entities_handles_a_single_mention():
    clusters = resolve_entities([Mention("Solo Person", "notes/x.md")])
    assert len(clusters) == 1
    assert clusters[0].aliases == {"Solo Person"}


def test_resolve_entities_handles_empty_input():
    assert resolve_entities([]) == []


class FakeEmbedForNames:
    """cosine-similarity-friendly toy embedding: identical vector for names
    that share a normalized token set, orthogonal otherwise. Just enough to
    test that embedding_rank's escalation path in resolve_entities is
    actually exercised, not to model real semantics."""

    VECTORS = {
        "mira": [1.0, 0.0, 0.0],
        "mirabelle": [0.9, 0.1, 0.0],  # deliberately close but NOT the same person
    }

    def __call__(self, text: str) -> list[float]:
        key = text.strip().lower()
        return self.VECTORS.get(key, [0.0, 1.0, 0.0])


def test_resolve_entities_escalates_to_embeddings_when_provided():
    """"Mira" and "Mirabelle" don't hit the heuristic auto-merge threshold
    (no exact match, no subset-of-tokens relationship) but do land in the
    review band, so they should escalate to the embedding tier. With a fake
    embedding tuned to score them just above embedding_merge_threshold,
    they should end up merged — proving the escalation path actually runs
    embed_fn rather than silently no-op'ing."""
    config = ResolutionConfig(embedding_merge_threshold=0.9)
    mentions = [Mention("Mira", "a.md"), Mention("Mirabelle", "b.md")]

    without_embeddings = resolve_entities(mentions, config=config)
    assert len(without_embeddings) == 2  # heuristic tier alone leaves them separate

    with_embeddings = resolve_entities(mentions, config=config, embed_fn=FakeEmbedForNames())
    assert len(with_embeddings) == 1


class FakeAdjudicatorLLM:
    available = True

    def __init__(self, verdict: bool):
        self.verdict = verdict
        self.calls = 0

    def generate_response(self, prompt: str, system_prompt: str, temperature: float = 0.0) -> str:
        self.calls += 1
        return f'{{"same_entity": {"true" if self.verdict else "false"}, "reason": "test"}}'


def test_resolve_entities_llm_tier_can_merge_an_escalated_pair():
    config = ResolutionConfig()
    mentions = [Mention("Mira", "a.md"), Mention("Mirabelle", "b.md")]
    llm = FakeAdjudicatorLLM(verdict=True)

    clusters = resolve_entities(mentions, config=config, llm=llm)
    assert len(clusters) == 1
    assert llm.calls == 1


def test_resolve_entities_llm_tier_can_confirm_they_stay_separate():
    config = ResolutionConfig()
    mentions = [Mention("Mira", "a.md"), Mention("Mirabelle", "b.md")]
    llm = FakeAdjudicatorLLM(verdict=False)

    clusters = resolve_entities(mentions, config=config, llm=llm)
    assert len(clusters) == 2


def test_resolve_entities_skips_llm_tier_when_not_available():
    config = ResolutionConfig()
    mentions = [Mention("Mira", "a.md"), Mention("Mirabelle", "b.md")]
    unavailable_llm = FakeAdjudicatorLLM(verdict=True)
    unavailable_llm.available = False

    clusters = resolve_entities(mentions, config=config, llm=unavailable_llm)
    assert len(clusters) == 2
    assert unavailable_llm.calls == 0


def test_resolve_entities_llm_tier_handles_malformed_response_as_no_merge():
    class BrokenLLM:
        available = True

        def generate_response(self, prompt, system_prompt, temperature=0.0):
            return "not json"

    mentions = [Mention("Mira", "a.md"), Mention("Mirabelle", "b.md")]
    clusters = resolve_entities(mentions, llm=BrokenLLM())
    assert len(clusters) == 2


def test_entity_cluster_sources_property():
    cluster = EntityCluster(
        id="e1",
        canonical_name="Mira Chen",
        aliases={"Mira Chen", "Mira"},
        mentions=[Mention("Mira Chen", "a.md"), Mention("Mira", "b.md"), Mention("Mira", "a.md")],
    )
    assert cluster.sources == {"a.md", "b.md"}
