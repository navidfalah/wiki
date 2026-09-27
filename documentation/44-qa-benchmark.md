# 44 — Gold Q&A Benchmark

A fixed set of questions with known answers over the sample corpus. It is used
to compare retrieval architectures, the compiled wiki against the raw files,
and search. It also supplies the fixed tasks the user study (doc 32) needs.
Task T5 in [43-project-assessment-and-roadmap.md](./43-project-assessment-and-roadmap.md).

| | |
|---|---|
| Questions | `data/qa_benchmark.json` (65) |
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
- a `category`: `fact` (60), `contradiction` (4) or `multi_source` (1);
- short search `keywords`.

The questions cover the Nova Widget hardware, MeshSync, the MESH-118 and
NOVA-59 email threads, the supplier delay, company history, TeaBuddy, and
support tickets and research notes.

**Every fact is checked against its sources.**
`test_every_fact_is_grounded_in_one_of_its_sources` fails if a fact doesn't
appear, after normalizing case, dashes, `µ` and markdown, in one of the
listed files. So the gold answers come from the corpus, not the author's
memory. Bare numbers carry units or context (`"85 ua"`, `"nps raw: 42"`), so
a fact can't match a random number in retrieved text.

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

## Results (2026-09-27, BM25, no API key)

```
coverage: wiki 0.954  raw 1.000

corpus architecture fact_recall all_facts source_hit  chars   (top_k=5)
wiki   naive              0.813     0.800      0.862   2291
raw    naive              0.900     0.892      0.862   3375
wiki   naive              0.782     0.769      0.815   1345   (top_k=3)
raw    naive              0.800     0.800      0.769   1985   (top_k=3)
```

What this does and doesn't show:

1. **The compiled wiki does not beat the raw files on factual lookup, at
   least not with BM25.** At top-5 the raw corpus scores higher. But its
   passages are whole short files, so it retrieves about 47% more text. At a
   comparable budget (raw top-3 at ~2.0k characters vs wiki top-5 at ~2.3k)
   the two are within 0.02. So for the project's research question, BM25
   retrieval over the wiki shows **no measurable advantage** on these
   questions. The wiki's claimed value (links, trust, contradictions,
   browsing) has to be shown some other way, which is what the user study is
   for.
2. **About 5% of answerable facts were lost in synthesis.** The compiled wiki
   no longer contains three facts that the raw files state:
   - where the kickoff took place (q44);
   - why the company is called Aurora (q45);
   - TeaBuddy's NPS (q54).

   The other 10 wiki misses are retrieval failures: the fact is in the wiki,
   but BM25 didn't rank it in the top 5.
3. **Offline, the architectures are indistinguishable.**
   - Graph and corrective change the retrieved set for only 3 of 65 wiki
     questions, and none of those changes affects a score.
   - HyDE and RAG-Fusion need an LLM, and without one they fall back to BM25.

   Comparing the five architectures therefore needs
   `python qa_benchmark_eval.py --with-llm`, which has not been run yet
   because it needs an API key.

### Search (`searchCorpus`, top 5)

| Query | v1: substring AND | v2: BM25 (T10) |
|---|---|---|
| Hand-written keywords (`keywords`) | 0.908 | 0.908 |
| The natural-language question | 0.077 | **0.938** |

v1 needed keywords, because a typed question almost never matched every
word. v2 ranks with BM25 (doc 42) and answers typed questions as well as
keywords. The keyword number is optimistic: the same person wrote the
keywords and the answers. Both rates are regression floors in
`searchBenchmark.test.ts`.

## Limits

- The corpus is small, fictional and written as a stress test for ingestion.
- There are only 4 contradiction questions.
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
