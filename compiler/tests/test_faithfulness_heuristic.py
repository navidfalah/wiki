"""Mechanism tests for faithfulness_heuristic.py — the offline lexical-
overlap faithfulness proxy. All deterministic, no API key / network
needed; see documentation/28-faithfulness-evaluation.md for the honest
discussion of what this technique can and can't tell you, and the real
numbers from running it against the compiled wiki corpus."""

from faithfulness_heuristic import (
    check_corpus_groundedness,
    clean_markdown_to_prose,
    parse_page,
    score_text_against_sources,
    split_sentences,
)


def test_split_sentences_basic():
    text = "First sentence. Second sentence! Third one?"
    assert split_sentences(text) == ["First sentence.", "Second sentence!", "Third one?"]


def test_clean_markdown_to_prose_unwraps_links_and_emphasis():
    text = "The **[Nova Widget](./nova-widget.md)** uses `MeshSync` for range extension."
    cleaned = clean_markdown_to_prose(text)
    assert "Nova Widget" in cleaned
    assert "MeshSync" in cleaned
    assert "[" not in cleaned
    assert "`" not in cleaned
    assert "**" not in cleaned


def test_clean_markdown_to_prose_drops_code_fences_and_headings():
    text = "## Heading\n\nReal prose here.\n\n```python\nimport re\n```\n\nMore prose."
    cleaned = clean_markdown_to_prose(text)
    assert "import re" not in cleaned
    assert "Heading" not in cleaned
    assert "Real prose here." in cleaned
    assert "More prose." in cleaned


def test_score_text_against_sources_fully_grounded_sentence_is_supported():
    source = "The Nova Widget ships with a CR2032 battery and a 15 minute read interval."
    candidate = "The Nova Widget uses a CR2032 battery with a 15 minute read interval."
    report = score_text_against_sources(candidate, source, support_threshold=0.5)
    assert report.checkable_count == 1
    assert report.sentence_reports[0].supported


def test_score_text_against_sources_fabricated_sentence_is_flagged():
    source = "The Nova Widget ships with a CR2032 battery and a 15 minute read interval."
    candidate = "The device was recalled in March 2024 due to a fire hazard in the charging port."
    report = score_text_against_sources(candidate, source, support_threshold=0.4)
    assert report.checkable_count == 1
    assert not report.sentence_reports[0].supported


def test_score_text_against_sources_skips_short_and_framing_sentences():
    source = "Anything."
    candidate = "Based on the sources, it works well. See above. Yes."
    report = score_text_against_sources(candidate, source)
    # "Based on..." is a framing sentence (skipped); "See above."/"Yes." are
    # too short (fewer than min_content_words) to be checkable claims.
    assert report.checkable_count == 0


def test_score_text_against_sources_known_paraphrase_false_positive():
    """Documents the real limitation, not just the happy path -- reproduces
    an actual case from wiki-app/docs/hardware-engineering.md, whose one
    source (notes/TEST-slack-dump.txt) is a terse Slack log: the LLM's
    formalized prose is grounded (every fact checks out against the raw
    log) but shares little vocabulary with the casual source, so it scores
    below threshold here. Expected, not a bug -- exactly what the
    literature review named (see module docstring and
    documentation/28-faithfulness-evaluation.md)."""
    source = "mira: nova widget beta boards arrived"
    candidate = (
        'Nova Widget Beta Boards: Beta boards for the "Nova Widget" have been received, '
        "marking a significant milestone in its development cycle and indicating readiness "
        "for further testing and validation."
    )
    report = score_text_against_sources(candidate, source, support_threshold=0.4)
    assert report.checkable_count == 1
    # Real, grounded fact -- but formal/casual vocabulary barely overlaps.
    assert report.sentence_reports[0].support_ratio < 0.4


def test_parse_page_extracts_body_and_source_paths():
    page_text = (
        "---\nid: x\ntitle: X\n---\n\n"
        "# X\n\n## Overview\nSome prose here.\n\n"
        "## Sources\n"
        "*   `notes/a.md`\n"
        "*   `notes/b.txt`\n"
    )
    body, sources = parse_page(page_text)
    assert "Some prose here." in body
    assert "## Sources" not in body
    assert sources == ["notes/a.md", "notes/b.txt"]


def test_parse_page_no_sources_section_returns_empty():
    page_text = "---\nid: x\ntitle: X\n---\n\n# X\n\nJust prose, no sources heading.\n"
    body, sources = parse_page(page_text)
    assert body == ""
    assert sources == []


def test_parse_page_stops_sources_section_at_trailing_code_fence():
    # Regression case: wiki-app/docs/aurora-labs.md has stray fenced content
    # appended after its Sources bullets -- must not swallow it as a path.
    page_text = (
        "---\nid: x\n---\n\n## Sources\n"
        "*   `notes/a.md`\n"
        "\n```python\nprint('not a path')\n```\n"
    )
    _body, sources = parse_page(page_text)
    assert sources == ["notes/a.md"]


def test_check_corpus_groundedness_runs_against_the_real_compiled_wiki():
    """Not a fixture -- runs the heuristic against the real, historically
    LLM-generated pages under wiki-app/docs/. Loosely bounded assertions
    (this is real generated text, not a controlled fixture) just confirming
    the mechanism actually produces results, not that a specific score is
    "correct" -- see documentation/28-faithfulness-evaluation.md for the
    full real numbers and the honest discussion of what they do and don't
    mean."""
    results = check_corpus_groundedness()
    assert len(results) > 100  # most of the ~174 committed pages have a Sources section
    assert all(r.report.checkable_count >= 0 for r in results)
    total_checkable = sum(r.report.checkable_count for r in results)
    assert total_checkable > 1000  # real prose, not an empty corpus
