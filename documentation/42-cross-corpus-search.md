# 42 — Cross-Corpus Search

Closes the gap doc 36's "Newer ideas" section named: `/wiki` and `/resources`
each had only a local, per-page filter (a page's own title/tag search, the
Files explorer's current-folder search) — there was no single search box
spanning wiki pages, emails, and resources at once.

## What it is

`GET /api/search?q=<query>` and its `/search` page: one query, matched
against three corpora in one response:

- **Wiki pages** — every compiled `.md` in `wiki-app/docs/`, matched against
  title, tags, and body.
- **Resources** — every cited source `listResources()` already tracks
  (`backend/src/lib/resourcesEngine.ts`), matched against the source path,
  source type, and the titles of pages citing it.
- **Emails** — every ingested `.eml`, via `runCli('emails-list')`
  (`compiler/email_engine.py`), matched against subject, sender, date, and
  the 220-character body preview the compiler already extracts.

## Ranking (search v2)

The first version matched a lowercase substring AND across all query words.
The Q&A benchmark (doc 44) showed it found a gold source in the top 5 for
only **8% of typed questions**. A question almost never contains only words
that all appear in one document. Search v2 (task T10) ranks instead:

- **BM25** over one index shared by all three corpora, so how rare a term is
  (its IDF) is measured across everything.
- **Field weights**: title ×3, metadata (tags, source type, citing pages,
  sender, date) ×2, body ×1.
- **Tokens**: lowercased, with English/German stopwords dropped from the
  query and light plural stemming ("batteries" finds "battery").
  Compounds such as `MESH-118` or `0.3.9` are kept whole and also split, so
  `mesh-118`, `118` and `0.3.9` all match.
- **Coordination**: a document needs at least one query term, and its score
  is multiplied by (matched terms ÷ query terms)². A page matching every
  word stays far above one that matches a single common word.
- **Emails are searched by their full body**: `emails-list` accepts
  `{"include_body": true}`. Before, only the 220-character preview was
  searched.

| Benchmark (doc 44), hit@5 | v1 (substring AND) | v2 (BM25) |
|---|---|---|
| Keyword queries | 0.908 | 0.908 |
| Typed natural-language questions | **0.077** | **0.938** |

Both numbers are regression floors in
`backend/src/lib/searchBenchmark.test.ts`.

This is still not the chat retriever. Chat uses `compiler/hybrid_retrieval.py`
(doc 25) to put passages in front of an LLM. Search is about *finding where
something lives*.

## Performance

The wiki and resource part of the index is cached and rebuilt when
`wiki-app/docs/` changes. The change check stats every page, so it runs at
most every 2 seconds. The combined index is also cached, keyed by the email
set. Scoring goes through postings lists, so only documents that contain a
query term are visited. Snippets are built only for the returned hits: the
API returns the top 100, plus `total`, the true number of matches.

Measured with the 65 benchmark questions:

| Corpus | Cold index build | Warm p50 | Warm p95 |
|---|---|---|---|
| Sample wiki (227 pages) | 156 ms | 6 ms | 8 ms |
| 10,000 pages (copies of the sample) | 4.6 s | 19 ms | **45 ms** |

## Implementation

- `backend/src/lib/searchEngine.ts`:
  - tokenizer, stemmer, BM25 index and cache;
  - `searchCorpusPage()`, which the route uses;
  - `searchCorpus`, `searchWikiPages`, `searchResourceItems` and
    `searchEmails` for tests and the benchmark.

  It is data-only: no English strings go into snippets or labels.
- `GET /api/search?q=` returns `{query, total, results}`. The email list
  comes from the warm Python worker (doc 40) and is best-effort, so a broken
  bridge still leaves wiki and resource search working.
- `/search` (`frontend/src/client/search.ts`) has a debounced input, type
  filter chips and `?q=` deep links.

## Deep links

- A wiki hit opens `/wiki/<page>`.
- A resource hit opens `/resources?tab=files&open=<path>`, which moves the
  Files explorer to that file's folder and opens its preview.
- An email hit opens `/resources?tab=emails&open=<path>`, which opens the
  email.

Each `open` parameter is used once, so the preview doesn't reappear after an
upload or an edit reloads the list. The Playwright smoke suite covers all
three kinds of link.
