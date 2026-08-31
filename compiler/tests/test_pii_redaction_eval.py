import pii_redaction_eval as pre


def test_every_fixture_expected_value_actually_matches_its_pattern_category():
    """Sanity check on the fixtures themselves: an expected (category,
    value) pair should be something redact_text can actually find when run
    on the fixture's own text — catches a typo'd fixture before it silently
    reports a false negative."""
    for fixture in pre.FIXTURES:
        result = pre.redact_text(fixture.text, pre.ALL_CATEGORIES_POLICY)
        found = {(f.category, f.original) for f in result.findings}
        for expected in fixture.expected:
            assert expected in found, (fixture.name, expected)


def test_run_eval_on_the_real_fixtures_scores_perfectly():
    report = pre.run_eval()
    assert report.precision == 1.0
    assert report.recall == 1.0
    assert report.false_positives == 0
    assert report.false_negatives == 0
    assert report.true_positives > 0


def test_run_eval_reports_a_false_negative_when_a_fixture_expects_something_undetectable():
    fixture = pre.Fixture(
        name="undetectable",
        text="No PII here at all.",
        expected=frozenset({("ssn", "999-99-9999")}),  # not actually present in the text
    )
    report = pre.run_eval([fixture])
    assert report.false_negatives == 1
    assert report.recall == 0.0


def test_run_eval_reports_a_false_positive_for_an_unexpected_match():
    fixture = pre.Fixture(
        name="unexpected_ssn",
        text="Meeting notes reference case 123-45-6789 for some other reason.",
        expected=frozenset(),  # nothing expected, but the SSN pattern will still match
    )
    report = pre.run_eval([fixture])
    assert report.false_positives == 1
    assert report.precision == 0.0


def _fake_location_ner_backend(text: str) -> list[tuple[int, int, str, str]]:
    start = text.find("Austin")
    return [(start, start + len("Austin"), "location", "Austin")] if start != -1 else []


def test_ner_only_fixtures_are_undetectable_without_a_backend():
    """Documents the honest baseline: NER_ONLY_FIXTURES are unreachable by
    the regex-only pipeline on purpose -- that's the whole point of the
    literature-review gap this tier closes."""
    report = pre.run_eval(pre.NER_ONLY_FIXTURES, pre.NER_AUGMENTED_POLICY)
    assert report.false_negatives == len(pre.NER_ONLY_FIXTURES)
    assert report.recall == 0.0


def test_ner_only_fixtures_score_perfectly_with_a_backend():
    report = pre.run_eval(pre.NER_ONLY_FIXTURES, pre.NER_AUGMENTED_POLICY, ner_backend=_fake_location_ner_backend)
    assert report.precision == 1.0
    assert report.recall == 1.0
    assert report.false_positives == 0
    assert report.false_negatives == 0
