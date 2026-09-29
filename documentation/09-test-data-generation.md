# 09 — Test Data Generation

The sample corpus in `data/raw/` comes from one script,
`compiler/scripts/build_sample_corpus.py`. It writes 30 files in 15 formats
about a fictional citizens' energy cooperative (see
[18-sample-domain.md](./18-sample-domain.md)). It writes only to its output
folder and never runs the compiler.

```bash
cd compiler
python scripts/build_sample_corpus.py            # (re)write data/raw/
python scripts/build_sample_corpus.py --clean    # delete everything in data/raw/ first
python scripts/build_sample_corpus.py --out /tmp/corpus   # somewhere else
```

## Deterministic output

Re-running the script produces byte-identical files, so a regenerate never
shows up as a change in git:

- DOCX, XLSX, PPTX and ZIP entries get a fixed timestamp
  (2026-09-15 12:00), and `docProps/core.xml`'s `modified` date is pinned
  (openpyxl otherwise writes the save time into it).
- PDFs come from a small built-in writer (Helvetica, WinAnsi encoding) with
  a fixed creation date; no PDF library is needed. `pypdf`, which the
  pipeline uses to read them, extracts the German umlauts correctly.
- The PNG is drawn with Pillow from fixed coordinates.

## Formats and how the pipeline reads them

| Format | Example | Extracted by |
|---|---|---|
| PDF | grant application, structural survey | `media_ingest._extract_pdf_text` (pypdf) |
| DOCX | board minutes, project plan | `_extract_docx_text` (python-docx, paragraphs + tables) |
| XLSX | budget revision (3 sheets) | `_extract_xlsx_text` (openpyxl, one section per sheet) |
| PPTX | general assembly slides | `_extract_pptx_text` (python-pptx, one section per slide) |
| EML | eight emails, two reply threads | `email_ingest.parse_eml` |
| CSV / TSV | production, member shares, battery events | `_extract_delimited_text` |
| JSON / YAML / LOG / HTML | survey, inverter status, site config, logger, flyer | parsed or read as text |
| ZIP | invoice archive | manifest plus the text of small `.txt/.md/.csv/.tsv/.json/.log` members |
| PNG | roof layout | needs an LLM to describe (no text without one) |
| MD / TXT | minutes, notes, transcript, press, FAQ | read as text |

`compiler/source_text.py` returns exactly this text for any raw file. The
offline evals use it to compare pages and answers with their sources
(before, they read PDF/DOCX sources as raw bytes).

## Seed wiki pages

`compiler/scripts/seed_pages.py` writes one hand-written page per topic
into `wiki-app/docs/`, in the compiler's own page format. Run
`python moc_generator.py` afterwards to rebuild the index. These pages let
the app, the e2e suite and the evals run without an API key; a real
compile replaces them.

## Changing the corpus

When you change a fact in `build_sample_corpus.py`, also update the
datasets that quote it:

1. `data/trust_eval_dataset.json` — every quote is checked verbatim
   against the extracted text (`trust_eval_dataset.validate_dataset()`).
2. `data/qa_benchmark.json` — every answer fact must appear in one of its
   sources (`tests/test_qa_benchmark.py`).
3. `compiler/entity_resolution_eval_dataset.py` — every mention must
   appear in its source.
4. The seed pages, then `python eval_gate.py` and, if the change is
   intended, `python eval_gate.py --update-baseline`.

## Next

- [18-sample-domain.md](./18-sample-domain.md)
- [10-data-layout-and-state.md](./10-data-layout-and-state.md)
