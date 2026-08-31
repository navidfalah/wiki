"""Structural checks on extraction_critic_eval.py's fixture corpus — these
don't call a real LLM (that's the whole point of the module they're testing
around), just verify the fixtures themselves are well-formed and internally
consistent so a future contributor can't silently break them."""

from extraction_critic_eval import FIXTURES, _contains_any


def test_every_fixture_has_a_name_and_nonempty_source_and_draft():
    for fixture in FIXTURES:
        assert fixture.name
        assert fixture.source_text.strip()
        assert fixture.draft_body.strip()


def test_expected_flagged_substrings_actually_appear_in_their_draft():
    """A fixture claiming a substring should be flagged is only meaningful
    if that substring is actually present in draft_body — otherwise it's
    testing nothing."""
    for fixture in FIXTURES:
        for expected in fixture.expected_flagged_substrings:
            assert expected.lower() in fixture.draft_body.lower(), fixture.name


def test_expected_clean_substrings_actually_appear_in_their_draft():
    for fixture in FIXTURES:
        for expected in fixture.expected_clean_substrings:
            assert expected.lower() in fixture.draft_body.lower(), fixture.name


def test_flagged_and_clean_substrings_do_not_overlap_within_a_fixture():
    """A substring can't simultaneously be "should be flagged" and "should
    stay clean" within the same fixture — that would make the fixture's
    expectations self-contradictory."""
    for fixture in FIXTURES:
        for flagged in fixture.expected_flagged_substrings:
            for clean in fixture.expected_clean_substrings:
                assert flagged.lower() not in clean.lower()
                assert clean.lower() not in flagged.lower()


def test_at_least_one_fixture_has_no_expected_hallucinations():
    """The corpus should include a "fully grounded" negative-control
    fixture, not just positive cases, so precision (false-positive rate)
    is actually measurable, not just recall."""
    assert any(not f.expected_flagged_substrings for f in FIXTURES)


def test_contains_any_helper_is_case_insensitive():
    assert _contains_any(["The Sky Is Blue"], "sky is blue")
    assert not _contains_any(["The Sky Is Blue"], "grass is green")
