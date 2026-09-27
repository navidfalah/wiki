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

## Matching, not ranking

This is deliberately **not** a new retrieval engine. It's an
AND-of-lowercase-terms substring match — the same approach `listResources()`
and the Logs/Resources pages' own client-side filters already use — just
spanning all three corpora and returning ranked, snippeted hits instead of
one flat list. Terms all need to appear somewhere in the combined
title+meta+body haystack; a title hit outweighs a body hit (score 8 vs. 1)
so a page actually about the query surfaces above one that merely mentions
it once.

Real ranked retrieval over the compiled corpus — BM25 + embeddings +
reranker, used by chat/RAG — is `compiler/hybrid_retrieval.py` (doc 25).
That path is unrelated to this one: chat answers a question with grounded
generation; this finds *where something lives* across three different
places you'd otherwise have to check one at a time.

## Implementation

- `backend/src/lib/searchEngine.ts` — pure, synchronous matching functions
  (`searchWikiPages`, `searchResourceItems`, `searchEmails`, and
  `searchCorpus` which merges and ranks all three). Data-only: no English
  strings baked into snippets or labels, since the app's `t()`/`th()`
  convention (doc 41) means all user-visible text is the frontend's job.
  Covered by `backend/src/lib/searchEngine.test.ts`.
- `GET /api/search` in `backend/src/routes/index.ts` calls `searchCorpus()`
  with the live `emails-list` result. The CLI call is wrapped in a
  best-effort `try/catch` — a broken Python bridge shouldn't take down
  search over wiki pages and resources, which are plain filesystem reads.
- `/search` (`frontend/src/views/search.ejs` +
  `frontend/src/client/search.ts`) — a debounced search box, type filter
  chips (client-side, over the already-fetched result set), and one card per
  hit. The query is reflected in the URL (`?q=...`) via
  `history.replaceState`, so a search is bookmarkable/shareable and
  `/search?q=...` deep-links straight into results.

## Known limitation

A resource or email hit links to `/resources?tab=files` /
`/resources?tab=emails` rather than the specific item: the Files explorer's
own search only scopes to the currently open folder (not a deep-link
target), and emails have no per-item URL of their own. Landing on the right
tab and letting the user scan from there was the honest tradeoff for v1
rather than a deep-link that would silently fail for a nested file.
