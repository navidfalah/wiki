# 35 — Web Search Enrichment

Every source the compiler has synthesized from so far comes from
`data/raw/` — human-supplied. This module adds one more source that isn't:
a live internet search, run per-topic during synthesis, gated behind a
single on/off switch so a compile stays fully offline and deterministic
unless someone explicitly turns it on for that run.

| | |
|---|---|
| Module | `compiler/web_search.py` |
| Pipeline integration | `main.py --web-search` / `WIKI_WEB_SEARCH_ENABLED=true`, wired into step 3 (Synthesis) |
| Tests | `tests/test_web_search.py` |
| Trust default | `source_type="web"` → `"low"` (`trust.py`) |
| Dashboard toggle | Dashboard → Run options → "Web search enrichment" (per run); Pipeline Architecture → "Web search enrichment" (persisted default) |

## Why it's off by default, and why per-run rather than per-topic

The compiler's whole contract up to this point is "same `data/raw/` in,
same wiki out" — incremental builds key off file MD5s
([10-data-layout-and-state.md](./10-data-layout-and-state.md)), and every
other optional pass (critic, corrections, PII redaction) only changes *how*
local content is processed, never adds new facts from outside it. Web
search breaks that contract on purpose — a search result can differ between
two runs of the same query — so it has to be something a person turns on
knowingly, not a silent default. It follows the exact convention
`--redact-pii` set in [30-pii-redaction.md](./30-pii-redaction.md):
a CLI flag, an equivalent `WIKI_*` env var, and no effect unless enabled.

## Mechanics

`step_synthesize()` (`main.py`) already groups every raw chunk by topic
before writing draft pages (`synthesizer.group_chunks_by_topic()`). When
`--web-search` is on, right after that grouping (and after incremental
diffing decides which topics are actually dirty this run) it calls:

```python
web_search.augment_grouped_with_web_results(
    grouped, search_topics,
    max_results=web_search_max_results,   # per topic, default 3
    max_topics=web_search_max_topics,     # per run, default 8
    provider=web_search_provider,         # "duckduckgo" | "serpapi" | "bing"
)
```

`search_topics` is the same `dirty_topics` set step 3 already computed for
regeneration — an unforced incremental run with no local changes searches
nothing at all, and a `--force` run enriches every topic (still capped by
`max_topics`, so a large corpus can't turn one run into hundreds of
outbound requests). Each search hit becomes one chunk entry shaped exactly
like a local one —

```python
{"source": result.url, "chunk_index": i, "text": "...",
 "entities": [], "concepts": [], "source_type": "web"}
```

— appended onto `grouped[topic]`, so it's synthesized into the page
alongside local chunks by the same LLM call, cross-linked by the same
linker, and cited in the same "References & Trust" table
([trust.py](../compiler/trust.py),
[19-multimedia-email-and-trust.md](./19-multimedia-email-and-trust.md)) —
`source_type="web"` defaults to `"low"` trust, the same tier as an
AI-guessed image caption, since it's unvetted third-party content pulled in
automatically rather than something a person wrote or attached.

## Providers

`duckduckgo` (default) uses DuckDuckGo's keyless Instant Answer API — no
signup, but coverage leans toward named entities/topics rather than general
web search. `serpapi` and `bing` wrap real search engines and need
`WIKI_WEB_SEARCH_API_KEY` set (never taken as a CLI flag, to keep it out of
shell history/process listings, same convention as `OPENAI_API_KEY`). All
three go through `connectors/http_transport.py`'s `urllib_get` — stdlib
`urllib` only, matching `connectors/`'s "no `requests`/`httpx` dependency,
HTTP calls always behind an injected callable" discipline, even though
`web_search.py` isn't part of that package (it fetches by free-text query,
not by listing items from one authenticated account — see
[34-external-connectors.md](./34-external-connectors.md)).

A misconfigured provider (unknown name, or a key-requiring provider with no
key) raises once and stops that run's enrichment; a per-query network
failure just logs a warning and skips that topic — one flaky topic can't
fail the whole compile.

## Turning it on

```bash
# One run only
python main.py --web-search
python main.py --web-search --web-search-provider serpapi --web-search-max-results 5

# Every run, until turned off again
export WIKI_WEB_SEARCH_ENABLED=true
```

From the dashboard: the **Run options** panel on `/dashboard` has a "Web
search enrichment" checkbox next to critic pass / corrections / PII
redaction — checked or not, per click of "Run compiler", same as those.
The **Pipeline Architecture** page's own "Web search enrichment" toggle
sets the persisted default every future run uses when the per-run checkbox
isn't touched (`data/pipeline_settings.json`, see
[13-configuration.md](./13-configuration.md)).

## Next

- [30-pii-redaction.md](./30-pii-redaction.md) / [24-extraction-critic.md](./24-extraction-critic.md) — the other opt-in `main.py` flags this one follows the shape of
- [19-multimedia-email-and-trust.md](./19-multimedia-email-and-trust.md) — how `source_type` feeds trust scoring and the References table this module's hits show up in
- [34-external-connectors.md](./34-external-connectors.md) — the account-based connectors this module deliberately isn't part of
