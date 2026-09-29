"""Source-to-wiki fact coverage: which figures and dates in a raw source
never made it into the wiki pages built from it?

The groundedness check (faithfulness_heuristic.py) asks whether what a page
says is in its sources. This asks the opposite question: whether what the
sources say, at least their hard facts, is in the pages. Synthesis can
drop a figure without saying anything wrong, and nothing else notices.

It needs no LLM and no gold labels. It extracts *checkable* facts only:

- a number with a unit (171.6 kWp, 100 kWh, 250 euros, 4.2 %, 14 weeks),
  compared by value and unit, so "171,6 kWp" and "171.6 kWp" are the same
  fact, and "1.250,00 EUR" equals "1,250 euros";
- a calendar date in ISO, German numeric or written form (English or
  German month names), compared as a date, so "15 June 2026",
  "15. Juni 2026", "15.06.2026" and "2026-06-15" are the same fact.

A bare number, a name or a claim in prose is not a fact here, so the
score says nothing about them.

A source fact counts as covered when it also appears in a page that cites
the source (via its References/Sources section), and as found elsewhere
when only some other page has it. The headline figure is the covered share
of facts in sources that some page cites.

What the number means and does not:
- It is recall of *hard facts*, not of meaning, and not all of them
  belong on a page: a quoted price list or an email's signature block is
  reasonably left out. Read the missing list, not just the percentage.
- Facts in images and audio are not extracted (they need an LLM to read).
- Sources no page cites are reported separately: all of their facts are
  missing by construction, which is a different problem (the source was
  never compiled) from a page that dropped one figure.

    python fact_coverage.py            # summary and the sources with the most missing facts
    python fact_coverage.py --json     # everything, machine-readable
"""

from __future__ import annotations

import argparse
import json
import re
from dataclasses import dataclass, field
from pathlib import Path

import source_text
from models import OUTPUT_DIR, RAW_DIR

_UNITS = {
    # canonical unit -> spellings (lowercase)
    "kwp": ("kwp",),
    "kwh": ("kwh",),
    "mwh": ("mwh",),
    "kw": ("kw",),
    "mw": ("mw",),
    "%": ("%", "prozent", "percent", "per cent"),
    "eur": ("€", "eur", "euro", "euros"),
    "m2": ("m²", "m2", "qm", "sqm"),
    "km": ("km",),
    "kg": ("kg",),
    "t": ("tonnen", "tons", "tonnes"),
    "week": ("weeks", "week", "wochen", "woche"),
    "day": ("days", "day", "tage", "tagen", "tag"),
    "month": ("months", "month", "monate", "monaten", "monat"),
    "year": ("years", "year", "jahre", "jahren", "jahr"),
    "hour": ("hours", "hour", "stunden", "stunde", "h"),
    "member": ("members", "mitglieder", "mitgliedern"),
    "module": ("modules", "module", "modulen"),
    "share": ("shares", "anteile", "anteilen", "anteil"),
    "c": ("°c",),
    "db": ("db",),
    "ppm": ("ppm",),
    "ua": ("ua", "µa", "μa"),
}
_UNIT_LOOKUP = {spelling: canon for canon, spellings in _UNITS.items() for spelling in spellings}
_UNIT_ALTERNATION = "|".join(sorted((re.escape(s) for s in _UNIT_LOOKUP), key=len, reverse=True))

# 1.250,50 / 1,250.50 / 1 250 / 171.6 / 171,6 / 100
_NUMBER = r"\d{1,3}(?:[.,'  ]\d{3})+(?:[.,]\d+)?|\d+(?:[.,]\d+)?"
_QUANTITY_RE = re.compile(rf"(?<![\w.,])({_NUMBER})[ \u00a0]?({_UNIT_ALTERNATION})(?![a-zA-Zäöüß0-9²])", re.IGNORECASE)
# Currency before the number: "EUR 250", "€250"
_CURRENCY_FIRST_RE = re.compile(rf"(?<![\w.,])(€|EUR)[ \u00a0]?({_NUMBER})(?![\d])", re.IGNORECASE)

_MONTHS = {
    "january": 1, "januar": 1, "jan": 1, "february": 2, "februar": 2, "feb": 2, "march": 3, "märz": 3, "maerz": 3, "mar": 3,
    "april": 4, "apr": 4, "may": 5, "mai": 5, "june": 6, "juni": 6, "jun": 6, "july": 7, "juli": 7, "jul": 7,
    "august": 8, "aug": 8, "september": 9, "sept": 9, "sep": 9, "october": 10, "oktober": 10, "okt": 10, "oct": 10,
    "november": 11, "nov": 11, "december": 12, "dezember": 12, "dez": 12, "dec": 12,
}
_MONTH_ALTERNATION = "|".join(sorted(_MONTHS, key=len, reverse=True))
_DATE_ISO_RE = re.compile(r"(?<!\d)(\d{4})-(\d{2})-(\d{2})(?!\d)")
_DATE_NUMERIC_RE = re.compile(r"(?<![\d.])(\d{1,2})\.\s?(\d{1,2})\.\s?(\d{4})(?!\d)")
_DATE_DMY_RE = re.compile(rf"(?<!\d)(\d{{1,2}})\.?\s+({_MONTH_ALTERNATION})\.?,?\s+(\d{{4}})(?!\d)", re.IGNORECASE)
_DATE_MDY_RE = re.compile(rf"\b({_MONTH_ALTERNATION})\.?\s+(\d{{1,2}})(?:st|nd|rd|th)?,?\s+(\d{{4}})(?!\d)", re.IGNORECASE)

_MARKUP_RE = re.compile(r"[*`_]|&nbsp;")


@dataclass(frozen=True)
class Fact:
    key: str  # canonical, comparable: "171.6 kwp", "date 2026-06-15"
    text: str  # as first written in the source


def _to_number(raw: str) -> float | None:
    s = re.sub(r"['  ]", "", raw)
    dot, comma = s.rfind("."), s.rfind(",")
    if dot != -1 and comma != -1:
        decimal = "." if dot > comma else ","
        s = s.replace("," if decimal == "." else ".", "").replace(decimal, ".")
    elif dot != -1 or comma != -1:
        sep = "." if dot != -1 else ","
        parts = s.split(sep)
        # 1.250 / 12,500 / 1.250.000: groups of exactly three digits are thousands
        if len(parts) > 2 or (len(parts[-1]) == 3 and 1 <= len(parts[0]) <= 3 and parts[0] != "0"):
            s = "".join(parts)
        else:
            s = ".".join(parts)
    try:
        return float(s)
    except ValueError:
        return None


def _canon(value: float) -> str:
    """A number as text without exponent or float noise. (`:g` would keep only six digits: 1234567 and 1234568 would collide.)"""
    if value == int(value):
        return str(int(value))
    return f"{value:.6f}".rstrip("0").rstrip(".")


def _date_key(year: int, month: int, day: int) -> str | None:
    if 1 <= month <= 12 and 1 <= day <= 31 and 1900 <= year <= 2100:
        return f"date {year:04d}-{month:02d}-{day:02d}"
    return None


def extract_facts(text: str) -> list[Fact]:
    """Checkable facts in a text, first occurrence of each, in order of appearance."""
    text = _MARKUP_RE.sub("", text)
    found: list[tuple[int, Fact]] = []

    def add(pos: int, key: str | None, shown: str) -> None:
        if key:
            found.append((pos, Fact(key, shown.strip())))

    for m in _QUANTITY_RE.finditer(text):
        value = _to_number(m.group(1))
        if value is not None:
            unit = _UNIT_LOOKUP[m.group(2).lower()]
            add(m.start(), f"{_canon(value)} {unit}", m.group(0))
    for m in _CURRENCY_FIRST_RE.finditer(text):
        value = _to_number(m.group(2))
        if value is not None:
            add(m.start(), f"{_canon(value)} eur", m.group(0))
    for m in _DATE_ISO_RE.finditer(text):
        add(m.start(), _date_key(int(m.group(1)), int(m.group(2)), int(m.group(3))), m.group(0))
    for m in _DATE_NUMERIC_RE.finditer(text):
        add(m.start(), _date_key(int(m.group(3)), int(m.group(2)), int(m.group(1))), m.group(0))
    for m in _DATE_DMY_RE.finditer(text):
        add(m.start(), _date_key(int(m.group(3)), _MONTHS[m.group(2).lower()], int(m.group(1))), m.group(0))
    for m in _DATE_MDY_RE.finditer(text):
        add(m.start(), _date_key(int(m.group(3)), _MONTHS[m.group(1).lower()], int(m.group(2))), m.group(0))

    unique: dict[str, Fact] = {}
    for _, fact in sorted(found, key=lambda item: item[0]):
        unique.setdefault(fact.key, fact)
    return list(unique.values())


@dataclass
class SourceCoverage:
    source: str
    facts: int
    covered: int  # in a page that cites this source
    elsewhere: int  # only in some other page
    cited_by: list[str]
    missing: list[str] = field(default_factory=list)  # as written in the source

    @property
    def recall(self) -> float | None:
        return self.covered / self.facts if self.facts else None


@dataclass
class CoverageReport:
    sources: list[SourceCoverage]
    pages: int

    @property
    def scored(self) -> list[SourceCoverage]:
        """Sources that have facts and that some page cites."""
        return [s for s in self.sources if s.facts and s.cited_by]

    @property
    def uncited(self) -> list[SourceCoverage]:
        return [s for s in self.sources if s.facts and not s.cited_by]

    @property
    def recall(self) -> float | None:
        facts = sum(s.facts for s in self.scored)
        return sum(s.covered for s in self.scored) / facts if facts else None

    @property
    def recall_any_page(self) -> float | None:
        facts = sum(s.facts for s in self.scored)
        return sum(s.covered + s.elsewhere for s in self.scored) / facts if facts else None


def _page_body(page_text: str) -> str:
    return re.sub(r"\A---\n.*?\n---\n", "", page_text, count=1, flags=re.DOTALL)


def evaluate(docs_dir: Path = OUTPUT_DIR, raw_dir: Path = RAW_DIR) -> CoverageReport:
    from faithfulness_heuristic import parse_page

    page_facts: dict[str, set[str]] = {}
    citations: dict[str, list[str]] = {}
    for page in sorted(docs_dir.glob("*.md")):
        if page.name == "index.md":
            continue
        text = page.read_text(encoding="utf-8")
        page_facts[page.name] = {f.key for f in extract_facts(_page_body(text))}
        for src in parse_page(text)[1]:
            citations.setdefault(src, []).append(page.name)
    everywhere = set().union(*page_facts.values()) if page_facts else set()

    sources: list[SourceCoverage] = []
    for path in sorted(p for p in raw_dir.rglob("*") if p.is_file()):
        rel = path.relative_to(raw_dir).as_posix()
        try:
            text = source_text.read_source_text(path)
        except Exception:  # an unreadable source has no facts to check
            continue
        # An email's Date/Sent header is metadata, not something a page should repeat.
        text = "\n".join(line for line in text.splitlines() if not re.match(r"\s*(Date|Sent|Received):", line, re.IGNORECASE))
        facts = extract_facts(text)
        cited_by = citations.get(rel, [])
        in_citing = set().union(*(page_facts[p] for p in cited_by if p in page_facts)) if cited_by else set()
        covered = [f for f in facts if f.key in in_citing]
        elsewhere = [f for f in facts if f.key not in in_citing and f.key in everywhere]
        missing = [f.text for f in facts if f.key not in in_citing and f.key not in everywhere]
        sources.append(SourceCoverage(rel, len(facts), len(covered), len(elsewhere), cited_by, missing))
    return CoverageReport(sources, len(page_facts))


def to_dict(report: CoverageReport) -> dict:
    return {
        "pages": report.pages,
        "sources_with_facts": sum(1 for s in report.sources if s.facts),
        "recall_cited": report.recall,
        "recall_any_page": report.recall_any_page,
        "facts_in_cited_sources": sum(s.facts for s in report.scored),
        "uncited_sources": [{"source": s.source, "facts": s.facts} for s in report.uncited],
        "sources": [
            {"source": s.source, "facts": s.facts, "covered": s.covered, "elsewhere": s.elsewhere, "recall": s.recall, "cited_by": s.cited_by, "missing": s.missing}
            for s in report.sources
            if s.facts
        ],
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--json", action="store_true", help="print the full report as JSON")
    parser.add_argument("--top", type=int, default=10, help="sources with the most missing facts to list")
    args = parser.parse_args(argv)
    report = evaluate()
    if args.json:
        print(json.dumps(to_dict(report), indent=2, ensure_ascii=False))
        return 0
    pct = lambda v: "n/a" if v is None else f"{v:.1%}"  # noqa: E731
    print(f"{len(report.scored)} cited sources with checkable facts ({sum(s.facts for s in report.scored)} facts), {report.pages} pages")
    print(f"  fact recall in the citing pages: {pct(report.recall)}")
    print(f"  in any page:                     {pct(report.recall_any_page)}")
    if report.uncited:
        print(f"  {len(report.uncited)} sources with facts are cited by no page ({sum(s.facts for s in report.uncited)} facts)")
    worst = sorted(report.scored, key=lambda s: len(s.missing) + s.elsewhere, reverse=True)[: args.top]
    for s in worst:
        if not s.missing and not s.elsewhere:
            continue
        print(f"\n{s.source}: {s.covered}/{s.facts} in citing pages; missing: {', '.join(s.missing[:6]) or '-'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
