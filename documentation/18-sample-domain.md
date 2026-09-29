# 18 — Sample Domain: BürgerEnergie Eschenbrück eG

The sample corpus in `data/raw/` describes a fictional citizens' energy
cooperative, **BürgerEnergie Eschenbrück eG**, in the fictional village of
Eschenbrück. In 2026 it builds a rooftop solar plant with battery storage on
the village primary school: the **Sonnendach Lindenhof** project. Every
person, company, place and number is invented.

The corpus is built by `compiler/scripts/build_sample_corpus.py`, which
writes the same bytes on every run (office files and archives get fixed
timestamps):

```bash
cd compiler
python scripts/build_sample_corpus.py          # (re)write data/raw/
python scripts/build_sample_corpus.py --clean  # empty data/raw/ first
python scripts/seed_pages.py                   # hand-written seed wiki pages
python moc_generator.py                        # rebuild wiki-app/docs/index.md
```

## Why this topic

- **It suits a research project.** A small, non-commercial, public-interest
  organisation, with no marketing claims.
- **It is bilingual.** About a third of the sources are German (the grant
  application, the general assembly minutes, the grid operator's letters,
  the newspaper article), the rest English. That tests the app's EN/DE
  support and shows where English-only keyword retrieval breaks down.
- **It uses real formats.** Such a project really produces PDFs, Word
  minutes, a budget workbook, slides, emails, CSV exports from a data
  logger, a monitoring JSON snapshot, an HTML flyer and an invoice archive.
- **Its facts change over time.** The plant size, module type, battery
  size, commissioning date, member count and heat-pump plan all change
  during the year. Two sources are plainly wrong (the flyer's share price,
  the FAQ's battery size). That is what the trust, temporal and
  contradiction features exist for.

## Files (30, 15 formats)

| Folder | Files | Formats |
|---|---|---|
| `meetings/` | board minutes (January, July), site-meeting transcript, general assembly minutes (German) | DOCX, MD, TXT |
| `project/` | grant application (German), project plan, structural survey, roof-lease summary (German), field notes | PDF, DOCX, TXT |
| `finance/` | budget revision (3 sheets), member shares by year | XLSX, CSV |
| `emails/` | grid connection request and approval, installer delay + reply, member question + reply, commissioning report | EML |
| `presentations/` | general assembly slides | PPTX |
| `public/` | member flyer (March, contains an error), FAQ (July, one stale fact) | HTML, MD |
| `press/` | local newspaper article (German) | MD |
| `survey/` | member survey results | JSON |
| `monitoring/` | daily production, battery events, data-logger log, inverter status, site configuration | CSV, TSV, LOG, JSON, YAML |
| `media/` | roof layout sketch | PNG |
| `archive/` | invoices and payments | ZIP (TXT + CSV inside) |

## Cast

| Entity | Role |
|---|---|
| BürgerEnergie Eschenbrück eG | the cooperative, founded 2019 |
| Dr. Hanna Vogt | chair of the board |
| Tobias Brandt | board member, finance |
| Selin Aydın | board member, technology; project lead |
| Klaus Reimann | chair of the supervisory board |
| Gemeinde Eschenbrück, mayor Petra Lindqvist, Jonas Feld (Bauamt) | the municipality that owns the school and leases the roofs |
| Grundschule am Lindenhof, Sporthalle Nord | the two roofs (A: 276 modules, B: 123 modules) |
| Lichtbau Solartechnik GmbH, Marco Petrović | installer |
| Ingenieurbüro Kraft & Partner, Dr. Ines Kraft | structural engineer |
| Netze Mittelland GmbH, Ute Sommer | grid operator |
| Raiffeisenkasse Talgrund | lends 120,000 euros |
| KlimaKommunal | state grant programme (96,000 euros) |
| Freibad Eschenbrück | outdoor pool, site of the planned heat pump pilot |

## Ground truth and deliberate conflicts

| Topic | Earlier or wrong | Final |
|---|---|---|
| Plant size | 198 kWp (January concept, grant application, flyer) → about 165 kWp (structural survey) | **171.6 kWp** (399 × Nordlicht NL-430) |
| Modules | Helion H-440 (14-week delivery delay) | **Nordlicht NL-430** |
| Battery | 150 kWh (project plan, flyer; the July FAQ is *wrong*) | **100 kWh** |
| Commissioning | June → 15 June → mid-July → 1 August 2026 | **19 August 2026, 10:42** |
| Members | 388 (end of 2025) → 412 (general assembly) | **419** (15 July 2026) |
| Share price | 200 euros (March flyer, a printing error) | **250 euros** |
| Heat pump pilot | autumn 2026 | **spring 2027** |
| Budget | 312,000 euros | **298,500 euros** |
| Dividend | 2.0 % for 2025 and a 3 % target from 2027 — different years, *not* a conflict | — |

These conflicts are labelled in `data/trust_eval_dataset.json` (8 claim
groups, 57 verbatim quotes; doc 21) and used by the Q&A benchmark
(`data/qa_benchmark.json`, 52 questions; doc 44).

## Wiki pages

`wiki-app/docs/` holds 26 **seed pages** plus the index. They are written by hand
from the sources (`compiler/scripts/seed_pages.py`) in the compiler's page
format, so the app, search, e2e tests and offline evals work in a checkout
without an API key. Their references tables are rendered by `trust.py` from
the rules in `data/source_trust.json`:

| Rule | Level | Why |
|---|---|---|
| `meetings/*minutes*`, `meetings/*protokoll*` | high | official minutes |
| `monitoring/**` | high | machine-generated measurements |
| `public/**` | low | marketing material, not kept up to date |

A real compile (`python main.py --force`, needs an LLM) replaces the seed
pages.

## Other sample data

The demo databases for the connectors use the same domain:

- the Postgres sample (`docker/postgres/init.sql`) holds working groups,
  people, projects and member FAQs;
- the SQLite sample (`compiler/connectors/sample_data.py`) holds the
  devices at the cooperative's three plants and their service tickets.

The unit-test fixtures under `compiler/tests/` and `backend/src/` still use
the earlier fictional IoT domain (Aurora Labs). They are self-contained
strings, independent of `data/raw/`.

## Next

- [09-test-data-generation.md](./09-test-data-generation.md)
- [21-trust-eval-dataset.md](./21-trust-eval-dataset.md)
- [44-qa-benchmark.md](./44-qa-benchmark.md)
