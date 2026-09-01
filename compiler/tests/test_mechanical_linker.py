from entity_resolution import Mention
from mechanical_linker import (
    auto_link_exact_titles,
    build_alias_topic_index,
    mentions_from_extractions,
)


def test_links_a_plain_exact_mention():
    body = "The device uses MeshSync for range extension."
    result = auto_link_exact_titles(body, {"MeshSync": "meshsync.md"}, self_title="Nova Widget")
    assert "[MeshSync](./meshsync.md)" in result.body
    assert result.linked_titles == ["MeshSync"]


def test_is_case_insensitive_but_preserves_original_casing():
    body = "It syncs over meshsync."
    result = auto_link_exact_titles(body, {"MeshSync": "meshsync.md"}, self_title="X")
    assert "[meshsync](./meshsync.md)" in result.body


def test_links_only_the_first_occurrence():
    body = "MeshSync is great. Later, MeshSync improved."
    result = auto_link_exact_titles(body, {"MeshSync": "meshsync.md"}, self_title="X")
    assert result.body.count("(./meshsync.md)") == 1
    assert result.body.startswith("[MeshSync](./meshsync.md) is great. Later, MeshSync improved.")


def test_does_not_link_the_pages_own_title():
    body = "Nova Widget is a sensor. Nova Widget uses MeshSync."
    result = auto_link_exact_titles(
        body, {"Nova Widget": "nova-widget.md", "MeshSync": "meshsync.md"}, self_title="Nova Widget"
    )
    assert "nova-widget.md" not in result.body
    assert "[MeshSync](./meshsync.md)" in result.body


def test_does_not_relink_an_already_linked_mention():
    body = "See [MeshSync](./meshsync.md) for details. MeshSync is the protocol."
    result = auto_link_exact_titles(body, {"MeshSync": "meshsync.md"}, self_title="X")
    # The true first mention is already linked, so the "link first mention"
    # convention is already satisfied -- the second, unlinked mention
    # should NOT also get linked (that would give the term two links).
    assert result.body.count("[MeshSync]") == 1
    assert result.body == body
    assert result.linked_titles == []


def test_skips_mentions_inside_code_fences():
    body = "```\nimport MeshSync\n```\nMeshSync is also mentioned in prose here."
    result = auto_link_exact_titles(body, {"MeshSync": "meshsync.md"}, self_title="X")
    assert "import MeshSync" in result.body  # untouched inside the fence
    assert "[MeshSync](./meshsync.md) is also mentioned" in result.body


def test_skips_mentions_inside_inline_code():
    body = "Call `MeshSync.init()` or just mention MeshSync in prose."
    result = auto_link_exact_titles(body, {"MeshSync": "meshsync.md"}, self_title="X")
    assert "`MeshSync.init()`" in result.body
    assert "[MeshSync](./meshsync.md) in prose" in result.body


def test_skips_mentions_inside_headings():
    body = "## MeshSync Overview\n\nMeshSync is used for range extension."
    result = auto_link_exact_titles(body, {"MeshSync": "meshsync.md"}, self_title="X")
    assert "## MeshSync Overview" in result.body
    assert "[MeshSync](./meshsync.md) is used" in result.body


def test_longer_title_wins_over_substring_title():
    body = "The Aurora Nova Widget shipped this week."
    topic_index = {"Nova Widget": "nova-widget.md", "Aurora Nova Widget": "aurora-nova-widget.md"}
    result = auto_link_exact_titles(body, topic_index, self_title="X")
    assert "[Aurora Nova Widget](./aurora-nova-widget.md)" in result.body
    assert "nova-widget.md)" not in result.body.replace("aurora-nova-widget.md)", "")


def test_matches_word_boundaries_not_substrings():
    body = "NovaCorp is unrelated to our product."
    result = auto_link_exact_titles(body, {"Nova": "nova.md"}, self_title="X")
    assert "nova.md" not in result.body


def test_matches_simple_possessive_form():
    body = "MeshSync's default interval is 15 minutes."
    result = auto_link_exact_titles(body, {"MeshSync": "meshsync.md"}, self_title="X")
    assert "[MeshSync's](./meshsync.md)" in result.body


def test_is_idempotent():
    body = "MeshSync is the protocol."
    once = auto_link_exact_titles(body, {"MeshSync": "meshsync.md"}, self_title="X")
    twice = auto_link_exact_titles(once.body, {"MeshSync": "meshsync.md"}, self_title="X")
    assert once.body == twice.body
    assert twice.linked_titles == []


def test_no_topics_to_link_returns_body_unchanged():
    body = "Just a plain sentence."
    result = auto_link_exact_titles(body, {}, self_title="X")
    assert result.body == body
    assert result.linked_titles == []


def test_build_alias_topic_index_adds_a_bare_first_name_alias():
    topic_index = {"Mira Chen": "mira-chen.md"}
    mentions = [
        Mention("Mira Chen", "notes/a.md"),
        Mention("Mira", "transcripts/b.txt"),
    ]
    expanded = build_alias_topic_index(topic_index, mentions)
    assert expanded["Mira Chen"] == "mira-chen.md"
    assert expanded["Mira"] == "mira-chen.md"


def test_build_alias_topic_index_never_overrides_an_existing_title():
    # "Nova" is both a real (distinct) topic title AND, per its mentions,
    # would otherwise cluster as an alias of "Nova Widget" -- the real
    # topic_index entry must win.
    topic_index = {"Nova Widget": "nova-widget.md", "Nova": "nova-the-competitor.md"}
    mentions = [Mention("Nova Widget", "a.md"), Mention("Nova", "b.md")]
    expanded = build_alias_topic_index(topic_index, mentions)
    assert expanded["Nova"] == "nova-the-competitor.md"


def test_build_alias_topic_index_ignores_hard_negative_names():
    # entity_resolution's own hard-negative case: Alex Kim and Alex Rivera
    # share a token but are different people -- the heuristic tier must
    # not merge them, so no alias should leak across.
    topic_index = {"Alex Kim": "alex-kim.md"}
    mentions = [Mention("Alex Kim", "a.md"), Mention("Alex Rivera", "b.md")]
    expanded = build_alias_topic_index(topic_index, mentions)
    assert "Alex Rivera" not in expanded


def test_build_alias_topic_index_with_no_mentions_returns_topic_index_unchanged():
    topic_index = {"MeshSync": "meshsync.md"}
    assert build_alias_topic_index(topic_index, []) == topic_index


def test_build_alias_topic_index_unmatched_cluster_adds_nothing():
    # A cluster whose aliases don't touch any real topic title shouldn't
    # add anything -- nowhere to point the alias at.
    topic_index = {"MeshSync": "meshsync.md"}
    mentions = [Mention("Jonah Park", "a.md"), Mention("Jonah", "b.md")]
    expanded = build_alias_topic_index(topic_index, mentions)
    assert "Jonah" not in expanded
    assert "Jonah Park" not in expanded


def test_mentions_from_extractions_builds_mentions_from_entities():
    extractions = {
        "files": [
            {
                "source": "notes/a.md",
                "chunks": [
                    {"entities": [{"name": "Mira Chen", "description": "founder"}]},
                    {"entities": [{"name": "Nova Widget"}, {"name": ""}]},
                ],
            }
        ]
    }
    mentions = mentions_from_extractions(extractions)
    assert Mention("Mira Chen", "notes/a.md") in mentions
    assert Mention("Nova Widget", "notes/a.md") in mentions
    assert len(mentions) == 2  # the empty-name entity is dropped


def test_mentions_from_extractions_handles_empty_payload():
    assert mentions_from_extractions({}) == []
    assert mentions_from_extractions({"files": []}) == []


def test_auto_link_exact_titles_uses_alias_expanded_index():
    """End-to-end: a bare first-name mention gets linked once the topic
    index is alias-expanded, even though auto_link_exact_titles() itself
    only ever does exact string matching."""
    topic_index = {"Mira Chen": "mira-chen.md"}
    mentions = [Mention("Mira Chen", "notes/a.md"), Mention("Mira", "transcripts/b.txt")]
    expanded = build_alias_topic_index(topic_index, mentions)

    body = "Mira reported the read interval is 15 minutes."
    result = auto_link_exact_titles(body, expanded, self_title="X")
    assert "[Mira](./mira-chen.md)" in result.body
