# 20 — Email, Resources, and Chat Engines

Three additional dashboard sections, each backed by its own small, pure
Python module ("engine") under `compiler/`, following the same pattern as
`analytics.py`, `trust.py`, and `link_overrides.py`: a module with no FastAPI
import that does the real work and is unit-testable on its own, wired into
`server.py` as a thin set of routes.

| Section | Route | Engine module | Frontend |
|---|---|---|---|
| Email knowledge engine | `/emails` | `compiler/email_engine.py` | `src/pages/emails.js` + `src/components/EmailEngine/` |
| Resources | `/resources` | `compiler/resources_engine.py` | `src/pages/resources.js` + `src/components/ResourcesExplorer/` |
| Chat (RAG) | `/chat` | `compiler/rag_engine.py` | `src/pages/chat.js` + `src/components/ChatEngine/` |

`compiler/doc_utils.py` holds the frontmatter/topic-lookup helpers shared by
all of them (and by the pre-existing raw-file/doc endpoints in `server.py`),
so no engine module imports `server.py` and none import each other.

## Email knowledge engine (`email_engine.py`)

Treats every ingested `.eml` source as a first-class, independently
browsable knowledge item rather than just another raw file:

- `list_emails(raw_dir=RAW_DIR)` — parses headers (via `email_ingest.parse_eml`,
  no LLM call) for every `.eml` under `data/raw/`, plus each message's
  pipeline status (`Processed`/`Unprocessed`), trust level (`trust.py`), and
  how many topics it has contributed once compiled.
- `get_email_detail(file_path, raw_dir=..., docs_dir=...)` — full body,
  attachments, and the wiki pages synthesized from this thread's topics
  (`doc_utils.synthesized_pages_for_topics`). Raises `NotAnEmailError` for a
  non-`.eml` path and `FileNotFoundError` for a missing one; `server.py`
  translates both to the matching HTTP status.

`GET /api/emails` and `GET /api/emails/{path}` expose these. Neither
requires a compile to have run — headers parse straight from the raw file —
so a mailbox is browsable the moment `.eml` files land in `data/raw/`.

## Resources (`resources_engine.py`)

Every synthesized page already carries a deterministic `## References &
Trust` table (see [19](./19-multimedia-email-and-trust.md)). This engine
inverts it: instead of "what does this page cite", it answers "what cites
this source" — a resource (an email, a note, an image) becomes a single
deduped entry with every citing page listed, so it's reusable and
inspectable independent of which page happened to reference it first.

- `parse_references_table(body)` — regex-parses a page's rendered references
  table back into rows.
- `list_resources(docs_dir=..., q=, source_type=, trust=)` — scans every
  compiled page, aggregates by source path, and supports search/type/trust
  filters.
- `get_resource_detail(source_path, docs_dir=, raw_dir=)` — citing pages plus
  a raw content preview when the source is still readable under `data/raw/`.

`GET /api/resources` and `GET /api/resources/{path}` expose these.

## Chat / RAG engine (`rag_engine.py`)

Answers questions over the compiled wiki (`wiki-app/docs/`) — the
cross-linked network `linker.py` already built — rather than over raw
pipeline chunks, so every citation is a page a person can click into.

- `build_corpus(docs_dir=OUTPUT_DIR)` — loads every compiled page and splits
  it into heading-scoped passages (reusing `text_chunking.split_text_into_chunks`
  for size-bounding).
- `retrieve(query, corpus, top_k=5)` — BM25 ranking (stdlib only, no vector
  DB or API needed). `retrieve_hybrid(..., llm=)` additionally fuses in
  embedding similarity and an LLM reranker when a key is configured,
  degrading gracefully tier-by-tier otherwise. See
  [25-hybrid-retrieval.md](./25-hybrid-retrieval.md) for the full design
  and an evaluation against the original TF-IDF-style scorer this replaced.
- `answer_question(query, history=, docs_dir=, llm=, top_k=5)` — retrieves
  passages via `retrieve_hybrid()`, then:
  - with `OPENAI_API_KEY` configured, hands the retrieved excerpts to the
    chat model with `CHAT_SYSTEM_PROMPT` (answer only from the excerpts,
    cite them as `[1]`, `[2]`, ...) — `mode: "generated"`;
  - without one (or if the call fails), falls back to an **extractive**
    answer built directly from the top retrieved passages — `mode:
    "extractive"` — so chat still works with zero API setup, same spirit as
    the rest of the repo tolerating a missing key where it can.
  - `mode: "empty"` when nothing has been compiled yet; `mode: "no_match"`
    when the corpus has nothing relevant to the query.

`POST /api/chat` (body: `{"message": str, "history": [{"role", "content"}, ...]}`)
and `GET /api/chat/status` (corpus size, whether an LLM is configured) expose
these.

## Testing

All three engines are unit-tested without an API key, same as the rest of
the compiler: `tests/test_email_engine.py`, `tests/test_resources_engine.py`,
`tests/test_rag_engine.py` (including a case that exercises the extractive
fallback path with `LLMClient(api_key="")`).

## Next

- [19-multimedia-email-and-trust.md](./19-multimedia-email-and-trust.md) — how `.eml` files become chunks, and how the References & Trust table is built
- [12-api-server.md](./12-api-server.md) — the rest of the API surface
- [11-wiki-app-and-dashboards.md](./11-wiki-app-and-dashboards.md) — the React dashboard pages this extends
