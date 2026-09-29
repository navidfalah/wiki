# 49 — Fact Coverage (source to wiki)

The groundedness check (doc 28) asks whether what a page says is in its
sources. **Fact coverage** asks the opposite: whether the hard facts in a
source made it into the pages built from it. Synthesis can drop a figure
without saying anything wrong, and nothing else notices.

It needs no LLM and no gold labels, so it runs in CI.

```bash
cd compiler
python fact_coverage.py            # summary and the sources with the most missing facts
python fact_coverage.py --json     # everything
python cli.py fact-coverage        # the same JSON, for the backend
```

## What counts as a fact

Only what can be checked mechanically:

- **A number with a unit**: 171.6 kWp, 100 kWh, 250 euros, 4.2 %, 14 weeks.
  Compared by value and unit, so `171,6 kWp` = `171.6 kWp` and
  `1.250,50 EUR` = `1,250.50 euros`. A bare number is not a fact (phone
  numbers, ids and room numbers would swamp the score).
- **A date**: ISO, German numeric or written out in English or German.
  `15 June 2026`, `15. Juni 2026`, `15.06.2026` and `2026-06-15` are one fact.
  An email's own `Date:`/`Sent:` header is metadata and is skipped.

Facts in images and audio are not extracted (that needs an LLM), and names
or claims in prose are not facts here.

## How it is scored

A fact in a source is **covered** if a page that *cites* that source (its
References table) contains it, **elsewhere** if only another page does, and
**missing** otherwise. Headline: covered share of the facts in sources some
page cites. Sources no page cites are listed apart: every fact in them is
missing by construction, which is a different problem (never compiled).

## Current numbers (sample corpus, hand-written seed pages)

207 facts in 28 cited sources: **70.5 %** in the citing pages, 78.7 % in any
page. These are the seed pages of `compiler/scripts/seed_pages.py`, not
LLM output; a real compile will differ. The point of the number is to catch
a *change*, so it is a gated metric (`factcoverage.recall_cited`, tolerance
0.05, floor of 150 facts) in `eval_baseline.json`.

## Reading it

- It is recall of hard facts, not of meaning. Not every fact belongs on a
  page: a daily production table or a signature block is reasonably left
  out (the two lowest sources in the sample are a 27-day CSV and a
  datalogger log). Read the missing list, not only the percentage.
- Coarse by design: a figure counts as present wherever it appears on a
  citing page, even in an unrelated sentence.
- A fact in a source with no References section on any page counts against
  nothing until that source is cited; check the uncited list too.

## Files

- `compiler/fact_coverage.py`, `compiler/tests/test_fact_coverage.py`
- `compiler/eval_gate.py` (metric), `compiler/cli.py` (`fact-coverage`)
