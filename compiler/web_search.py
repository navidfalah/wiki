"""Live internet search used to enrich wiki synthesis with external context,
alongside (never instead of) data/raw/ -- gated behind --web-search /
WIKI_WEB_SEARCH_ENABLED so a compile stays fully offline and deterministic
by default. See main.py's --web-search* flags for how a run turns this on.

Deliberately not part of connectors/: those adapters list items from one
authenticated external account (Gmail, Drive, IMAP); this fetches by
free-text search query instead, with no account/credential concept beyond
an optional API key. It follows the same "no direct network calls, only
through an injected HTTP callable" discipline as connectors/http_transport.py
so tests never touch the network, and reuses that module's urllib-based
urllib_get as its default transport rather than adding `requests` as a
dependency.

Every hit becomes one chunk entry shaped like the ones
synthesizer.group_chunks_by_topic() builds from local raw files (same keys:
source, chunk_index, text, entities, concepts, source_type) tagged
source_type="web", so it flows through synthesis, linking, and the
"References & Trust" section exactly like any other source. trust.py trusts
"web" at the "low" default level -- unverified third-party content, same
tier as an AI-guessed image caption.
"""

from __future__ import annotations

import logging
import os
from collections.abc import Callable
from dataclasses import dataclass

from connectors.http_transport import HttpError, urllib_get

logger = logging.getLogger(__name__)

HttpGet = Callable[..., dict]

DEFAULT_PROVIDER = "duckduckgo"
DEFAULT_MAX_RESULTS = 3
DEFAULT_MAX_TOPICS = 8

_TRUE_VALUES = {"1", "true", "yes", "on"}


class WebSearchError(RuntimeError):
    """A provider is unusable this run (unknown name, or missing API key).

    Raised out of web_search() only for this class of *configuration*
    problem, so a caller can surface it once and stop, instead of retrying
    per topic. Network/HTTP failures for an individual query are handled
    inside web_search() itself and never raise -- see its docstring.
    """


@dataclass(frozen=True)
class WebSearchResult:
    title: str
    url: str
    snippet: str


def is_enabled(explicit: bool | None = None) -> bool:
    """Resolve whether web search is on for this run.

    `explicit`, when given (e.g. main.py's --web-search flag), always wins;
    otherwise falls back to the WIKI_WEB_SEARCH_ENABLED env var. Mirrors the
    --critic-pass / WIKI_CRITIC_PASS pattern elsewhere in main.py.
    """
    if explicit is not None:
        return explicit
    return os.getenv("WIKI_WEB_SEARCH_ENABLED", "").strip().lower() in _TRUE_VALUES


def _search_duckduckgo(
    query: str, *, max_results: int, http_get: HttpGet, api_key: str | None
) -> list[WebSearchResult]:
    """DuckDuckGo's keyless Instant Answer API -- no signup, best-effort
    coverage (strong for named entities/topics, not a general web index).
    https://duckduckgo.com/api
    """
    data = http_get(
        "https://api.duckduckgo.com/",
        params={"q": query, "format": "json", "no_html": "1", "skip_disambig": "1"},
    )
    results: list[WebSearchResult] = []

    abstract = (data.get("AbstractText") or "").strip()
    if abstract:
        results.append(
            WebSearchResult(title=data.get("Heading") or query, url=data.get("AbstractURL") or "", snippet=abstract)
        )

    def _add_topic(topic: dict) -> None:
        text = (topic.get("Text") or "").strip()
        if text:
            results.append(WebSearchResult(title=text.split(" - ")[0][:120], url=topic.get("FirstURL") or "", snippet=text))

    for topic in data.get("RelatedTopics", []):
        if len(results) >= max_results:
            break
        if "Text" in topic:
            _add_topic(topic)
            continue
        for sub in topic.get("Topics", []):
            if len(results) >= max_results:
                break
            _add_topic(sub)

    return results[:max_results]


def _search_serpapi(query: str, *, max_results: int, http_get: HttpGet, api_key: str | None) -> list[WebSearchResult]:
    """SerpAPI's Google search wrapper. https://serpapi.com/search-api"""
    if not api_key:
        raise WebSearchError("The 'serpapi' web search provider needs WIKI_WEB_SEARCH_API_KEY set")
    data = http_get(
        "https://serpapi.com/search",
        params={"q": query, "engine": "google", "api_key": api_key, "num": str(max_results)},
    )
    return [
        WebSearchResult(title=item.get("title") or query, url=item.get("link") or "", snippet=item.get("snippet") or "")
        for item in (data.get("organic_results") or [])[:max_results]
    ]


def _search_bing(query: str, *, max_results: int, http_get: HttpGet, api_key: str | None) -> list[WebSearchResult]:
    """Bing Web Search v7. https://learn.microsoft.com/bing/search-apis/bing-web-search"""
    if not api_key:
        raise WebSearchError("The 'bing' web search provider needs WIKI_WEB_SEARCH_API_KEY set")
    data = http_get(
        "https://api.bing.microsoft.com/v7.0/search",
        headers={"Ocp-Apim-Subscription-Key": api_key},
        params={"q": query, "count": str(max_results)},
    )
    web_pages = (data.get("webPages") or {}).get("value") or []
    return [
        WebSearchResult(title=item.get("name") or query, url=item.get("url") or "", snippet=item.get("snippet") or "")
        for item in web_pages[:max_results]
    ]


_PROVIDERS: dict[str, Callable[..., list[WebSearchResult]]] = {
    "duckduckgo": _search_duckduckgo,
    "serpapi": _search_serpapi,
    "bing": _search_bing,
}

# Public, stable view of the provider names for CLI/UI choice lists.
SUPPORTED_PROVIDERS: tuple[str, ...] = tuple(sorted(_PROVIDERS))


def web_search(
    query: str,
    *,
    max_results: int = DEFAULT_MAX_RESULTS,
    provider: str | None = None,
    api_key: str | None = None,
    http_get: HttpGet = urllib_get,
) -> list[WebSearchResult]:
    """Run one search query, returning up to `max_results` hits.

    Never raises for a network/HTTP-level failure -- logs a warning and
    returns [], since web search is an optional enrichment and one bad
    query or a flaky connection must not fail the whole compiler run.
    Raises WebSearchError only for a misconfigured provider (unknown name,
    or a key-requiring provider with no key), which is worth surfacing
    once rather than swallowing per topic.
    """
    provider_name = (provider or os.getenv("WIKI_WEB_SEARCH_PROVIDER") or DEFAULT_PROVIDER).strip().lower()
    handler = _PROVIDERS.get(provider_name)
    if handler is None:
        raise WebSearchError(f"Unknown web search provider {provider_name!r} (known: {', '.join(sorted(_PROVIDERS))})")

    query = query.strip()
    if not query:
        return []

    key = api_key if api_key is not None else os.getenv("WIKI_WEB_SEARCH_API_KEY")
    try:
        return handler(query, max_results=max(1, max_results), http_get=http_get, api_key=key)
    except WebSearchError:
        raise
    except (HttpError, OSError, ValueError) as exc:
        logger.warning("Web search failed for query %r via %s: %s", query, provider_name, exc)
        return []


def result_to_chunk_entry(topic: str, index: int, result: WebSearchResult) -> dict:
    """Build one synthesizer-compatible chunk entry (see
    synthesizer.group_chunks_by_topic's docstring for the schema) from a
    single web search hit.
    """
    text = result.snippet.strip()
    if result.title and not text.startswith(result.title):
        text = f"{result.title}\n\n{text}" if text else result.title
    return {
        "source": result.url or f"web-search:{topic}#{index}",
        "chunk_index": index,
        "text": text or result.title or topic,
        "entities": [],
        "concepts": [],
        "source_type": "web",
    }


def augment_grouped_with_web_results(
    grouped: dict[str, list[dict]],
    topics: list[str],
    *,
    max_results: int = DEFAULT_MAX_RESULTS,
    max_topics: int = DEFAULT_MAX_TOPICS,
    provider: str | None = None,
    api_key: str | None = None,
    http_get: HttpGet = urllib_get,
) -> int:
    """Search the web for each of `topics` (capped to `max_topics`, to bound
    per-run cost/latency) and append the hits as extra chunk entries onto
    `grouped[topic]`, in place -- so they're synthesized alongside the
    topic's local chunks on this run.

    Returns the number of web-sourced entries added. A misconfigured
    provider stops the whole augmentation immediately (so the problem is
    visible once, in the caller's log) rather than failing silently per
    topic; per-query network failures are handled inside web_search() and
    just skip that topic.
    """
    added = 0
    for topic in topics[:max_topics]:
        if topic not in grouped:
            continue
        try:
            results = web_search(topic, max_results=max_results, provider=provider, api_key=api_key, http_get=http_get)
        except WebSearchError as exc:
            logger.warning("Web search disabled for the rest of this run: %s", exc)
            break
        for index, result in enumerate(results):
            if not (result.snippet or result.title):
                continue
            grouped[topic].append(result_to_chunk_entry(topic, index, result))
            added += 1
    return added
