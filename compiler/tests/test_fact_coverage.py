from pathlib import Path

import pytest

import fact_coverage
from fact_coverage import evaluate, extract_facts, to_dict


def keys(text: str) -> list[str]:
    return [f.key for f in extract_facts(text)]


@pytest.mark.parametrize(
    "text, expected",
    [
        ("The plant has 171.6 kWp.", ["171.6 kwp"]),
        ("Die Anlage hat 171,6 kWp.", ["171.6 kwp"]),
        ("battery of 100 kWh and 100kWh", ["100 kwh"]),
        ("Share price 250 euros, or 250 EUR, or €250, or EUR 250", ["250 eur"]),
        ("Loan 1.250,50 EUR", ["1250.5 eur"]),
        ("Loan 1,250.50 EUR", ["1250.5 eur"]),
        ("Loan 120.000 Euro and 82 500 Euro", ["120000 eur", "82500 eur"]),
        ("delivery takes 14 weeks / 14 Wochen", ["14 week"]),
        ("yield 4.2 % and 4,2 Prozent", ["4.2 %"]),
        ("**171.6 kWp** in `bold`", ["171.6 kwp"]),
    ],
)
def test_quantities_are_compared_by_value_and_unit(text, expected):
    assert keys(text) == expected


def test_large_numbers_keep_every_digit():
    assert keys("1.234.567 EUR") != keys("1.234.568 EUR")
    assert keys("1.234.567 EUR") == ["1234567 eur"]


def test_decimal_versus_thousands_separator():
    assert keys("1.250 EUR") == ["1250 eur"]  # three digits after a single separator: thousands
    assert keys("0.250 EUR") == ["0.25 eur"]  # a leading zero cannot be a thousands group
    assert keys("12.5 EUR") == ["12.5 eur"]
    assert keys("1.250.000 EUR") == ["1250000 eur"]


@pytest.mark.parametrize(
    "text",
    [
        "15 June 2026",
        "15. Juni 2026",
        "15.06.2026",
        "2026-06-15",
        "June 15, 2026",
        "June 15th, 2026",
        "15 Jun 2026",
    ],
)
def test_dates_in_any_common_form_are_one_fact(text):
    assert keys(text) == ["date 2026-06-15"]


def test_impossible_dates_and_bare_numbers_are_not_facts():
    assert keys("2026-13-45 and 32.13.2026") == []
    assert keys("Call 0421 123456, order 4711, room 12, 3 people") == []


def test_units_must_stand_alone_and_not_cross_lines():
    assert keys("100 kWhx and 5 tonnesque") == []
    assert keys("14\nweeks") == []
    assert keys("EUR\n4") == []
    assert keys("a1.5 kWp") == []  # glued to a word: an identifier, not a quantity


def test_each_fact_once_in_order_of_appearance():
    facts = extract_facts("On 2026-06-15 we paid 250 euros; 250 EUR again on 15 June 2026.")
    assert [f.key for f in facts] == ["date 2026-06-15", "250 eur"]
    assert facts[1].text == "250 euros"


def test_unit_ambiguity_h_is_hours_only_when_standing_alone():
    assert keys("2 h of work") == ["2 hour"]
    assert keys("2 hats") == []


# --- evaluate ------------------------------------------------------------------


def page(title: str, body: str, *sources: str) -> str:
    refs = "\n".join(f"| {i + 1} | `{s}` | text | Medium |" for i, s in enumerate(sources))
    return f"---\ntitle: {title}\n---\n\n# {title}\n\n{body}\n\n## References & Trust\n\n| # | Source | Type | Trust |\n|---|--------|------|-------|\n{refs}\n"


@pytest.fixture
def corpus(tmp_path: Path):
    raw, docs = tmp_path / "raw", tmp_path / "docs"
    (raw / "notes").mkdir(parents=True)
    docs.mkdir()
    (raw / "notes" / "a.txt").write_text("Plant 171.6 kWp, battery 100 kWh, price 250 euros, commissioned 19 August 2026.")
    (raw / "notes" / "b.txt").write_text("Budget 120.000 Euro.")
    (raw / "notes" / "orphan.txt").write_text("Loan of 5.000 EUR.")
    (raw / "notes" / "plain.txt").write_text("Nothing numeric here.")
    (docs / "plant.md").write_text(page("Plant", "The plant has 171,6 kWp and a 100 kWh battery.", "notes/a.txt"))
    (docs / "money.md").write_text(page("Money", "Share price is 250 euros. Budget: 120.000 Euro.", "notes/b.txt"))
    (docs / "index.md").write_text("---\ntitle: Index\n---\n\n999 kWp everywhere\n")
    return docs, raw


def test_covered_elsewhere_and_missing_are_told_apart(corpus):
    docs, raw = corpus
    report = evaluate(docs, raw)
    a = next(s for s in report.sources if s.source == "notes/a.txt")
    assert (a.facts, a.covered, a.elsewhere, a.missing) == (4, 2, 1, ["19 August 2026"])  # 250 euros is in another page
    assert a.cited_by == ["plant.md"]
    assert a.recall == 0.5


def test_headline_counts_only_cited_sources_and_reports_uncited_apart(corpus):
    docs, raw = corpus
    report = evaluate(docs, raw)
    assert [s.source for s in report.scored] == ["notes/a.txt", "notes/b.txt"]
    assert [s.source for s in report.uncited] == ["notes/orphan.txt"]
    assert report.recall == pytest.approx(3 / 5)
    assert report.recall_any_page == pytest.approx(4 / 5)
    assert report.pages == 2  # index.md is not a synthesized page


def test_index_page_does_not_count_as_coverage(corpus):
    docs, raw = corpus
    (raw / "notes" / "idx.txt").write_text("999 kWp")
    assert next(s for s in evaluate(docs, raw).sources if s.source == "notes/idx.txt").missing == ["999 kWp"]


def test_an_email_date_header_is_not_a_fact(corpus):
    docs, raw = corpus
    (raw / "notes" / "mail.txt").write_text("Date: Tue, 13 May 2026 10:00:00\nSent: 13 May 2026\nThe module costs 430 euros.")
    mail = next(s for s in evaluate(docs, raw).sources if s.source == "notes/mail.txt")
    assert mail.facts == 1


def test_a_page_dropping_a_figure_lowers_recall(corpus):
    docs, raw = corpus
    before = evaluate(docs, raw).recall
    (docs / "plant.md").write_text(page("Plant", "The plant is big.", "notes/a.txt"))
    assert evaluate(docs, raw).recall < before


def test_json_report_lists_only_sources_with_facts(corpus):
    docs, raw = corpus
    data = to_dict(evaluate(docs, raw))
    assert {s["source"] for s in data["sources"]} == {"notes/a.txt", "notes/b.txt", "notes/orphan.txt"}
    assert data["uncited_sources"] == [{"source": "notes/orphan.txt", "facts": 1}]
    assert data["recall_cited"] == pytest.approx(0.6)


def test_empty_wiki_and_empty_corpus_do_not_divide_by_zero(tmp_path):
    (tmp_path / "docs").mkdir()
    (tmp_path / "raw").mkdir()
    report = evaluate(tmp_path / "docs", tmp_path / "raw")
    assert report.recall is None and report.recall_any_page is None and report.sources == []


def test_main_prints_summary_and_json(corpus, monkeypatch, capsys):
    docs, raw = corpus
    monkeypatch.setattr(fact_coverage, "OUTPUT_DIR", docs)
    monkeypatch.setattr(fact_coverage, "RAW_DIR", raw)
    monkeypatch.setattr(fact_coverage, "evaluate", lambda: evaluate(docs, raw))
    assert fact_coverage.main([]) == 0
    out = capsys.readouterr().out
    assert "60.0%" in out and "cited by no page" in out and "19 August 2026" in out
    assert fact_coverage.main(["--json"]) == 0
    assert '"recall_cited": 0.6' in capsys.readouterr().out


def test_real_corpus_has_facts_and_a_sane_score():
    report = evaluate()
    assert len(report.scored) >= 20 and sum(s.facts for s in report.scored) >= 150
    assert 0.3 < report.recall <= report.recall_any_page <= 1.0
