# 44 — Gold Q&A Benchmark

A fixed set of questions with known answers over the sample corpus. It is used
to compare retrieval architectures, the compiled wiki against the raw files,
and search. It also supplies the fixed tasks the user study (doc 32) needs.
Task T5 in [43-project-assessment-and-roadmap.md](./43-project-assessment-and-roadmap.md).

| | |
|---|---|
| Questions | `data/qa_benchmark.json` (52, version 2) |
| Retrieval eval | `compiler/qa_benchmark_eval.py` |
| Search eval | `backend/src/lib/searchBenchmark.ts` (+ `.test.ts`) |
| Dataset tests | `compiler/tests/test_qa_benchmark.py` |
| Gated in CI | `qa.*` metrics in `compiler/eval_baseline.json` (doc 14) |

## The dataset

Each question has:

- a gold `answer`;
- `facts`: the required facts, each given as a list of acceptable
  lowercase phrasings;
- the raw `sources` that contain the answer;
- a `category`: `fact` (41), `contradiction` (8) or `multi_source` (3);
- short search `keywords`.

The questions cover the sample cooperative's solar project (doc 18): plant
size, modules, battery, commissioning, financing, membership and dividend,
the structural survey, the grid connection, monitoring data and the
heat-pump plan. Their sources span every text-bearing format in the corpus
(PDF, DOCX, XLSX, PPTX, EML, CSV, TSV, JSON, YAML, LOG, HTML, the ZIP's
invoices, MD, TXT). The 8 contradiction questions ask about a value that
changed or a source that is wrong.

**Every fact is checked against its sources.**
`test_every_fact_is_grounded_in_one_of_its_sources` fails if a fact doesn't
appear, after normalizing case, dashes, `µ` and markdown, in one of the
listed files, read through the pipeline's own text extraction
(`compiler/source_text.py`), so a PDF or DOCX source counts. So the gold
answers come from the corpus, not the author's memory. Where the same fact
is written differently in different places (a German date, a thousands
separator), each question lists the equivalent forms.

## Metrics

- **fact_recall**: the mean share of a question's facts found in the top-k
  retrieved text. This is context recall: could a reader answer from what
  was retrieved?
- **all_facts**: the share of questions with every fact retrieved.
- **source_hit**: the share of questions where a retrieved passage is (raw)
  or cites, through its References table (wiki), a gold source.
- **coverage**: the share of questions answerable from the *whole* corpus.
  For the wiki this separates facts lost during synthesis from facts that
  retrieval failed to surface.
- **chars**: the mean retrieved characters. Read recall across corpora
  alongside this number.

## Results (2026-09-29, BM25, no API key)

```
coverage: wiki 1.000  raw 1.000

corpus architecture fact_recall all_facts source_hit  chars   (top_k=5)
wiki   naive              0.901     0.885      1.000   1534
raw    naive              0.849     0.788      0.750   4870
wiki   naive              0.804     0.788      1.000    868   (top_k=3)
raw    naive              0.763     0.712      0.654   2853   (top_k=3)
```

**Read these numbers with care.** The wiki pages behind them are the
hand-written seed pages (doc 18), written by the same author as the
questions. So the wiki's lead here is **not evidence for the project's
research question**: an author who knows the questions writes pages that
answer them. The comparison becomes meaningful only after a real LLM
compile (`python main.py --force`) replaces the seed pages. What the numbers
do show:

1. **Raw passages are expensive.** At top-5 the raw corpus retrieves over
   three times as much text as the wiki (4.9k vs 1.5k characters), because
   whole documents such as the budget workbook are single long passages.
2. **Raw retrieval misses the right source a quarter of the time**
   (source_hit 0.75). Several answers exist in both a German and an English
   source, and English keywords only find the English one.
3. **Offline, the architectures are still indistinguishable.** Graph and
   corrective retrieval return the same scores as naive; HyDE and
   RAG-Fusion need an LLM (`python qa_benchmark_eval.py --with-llm`).

### Earlier corpus (2026-09-27, 65 questions)

On the previous sample corpus (a fictional IoT start-up), with pages
compiled by an LLM, the wiki did **not** beat the raw files: fact recall
0.813 vs 0.900 at top-5, within 0.02 at a comparable text budget, and about
5 % of answerable facts had been lost in synthesis. That is still the only
measurement on LLM-compiled pages.

### Search (`searchCorpus`, top 5)

| Query | v1: substring AND | v2: BM25 (T10) |
|---|---|---|
| Hand-written keywords (`keywords`) | 0.908 | 0.908 (now 1.000) |
| The natural-language question | 0.077 | **0.938** (now 1.000) |

v1 needed keywords, because a typed question almost never matched every
word. v2 ranks with BM25 (doc 42) and answers typed questions as well as
keywords. The keyword number is optimistic: the same person wrote the
keywords and the answers. The "now" values are on the current corpus with
its seed pages; the floors in `searchBenchmark.test.ts` stay at the earlier
corpus's levels.

## Limits

- The corpus is small (30 files) and fictional.
- The wiki side is currently hand-written (see above).
- Fact matching is lexical, so a correct paraphrase is scored as a miss
  (for example "a 24-month battery" against the phrasing "24 month"). This
  undercounts the wiki more than the raw files, because synthesis paraphrases
  and the raw files are the source of the phrasings.
- Answer *generation* isn't scored: that needs an LLM, and judging needs a
  second one.

## Updating

When the corpus changes, re-run the grounding tests. If questions become
wrong, fix them in `data/qa_benchmark.json`, not by loosening facts. Then
accept the new numbers with `python eval_gate.py --update-baseline`, and
raise `KEYWORD_HIT_AT_5_FLOOR` in `searchBenchmark.test.ts` if search has
improved.
