import pytest

import web_search
from connectors.http_transport import HttpError


class FakeHttpGet:
    """Queue of canned responses, in call order -- same shape as the fakes
    used for connectors/ (see test_connectors_gmail.py)."""

    def __init__(self, responses):
        self.responses = list(responses)
        self.calls = []

    def __call__(self, url, headers=None, params=None):
        self.calls.append((url, headers, params))
        response = self.responses.pop(0)
        if isinstance(response, Exception):
            raise response
        return response


def test_is_enabled_prefers_explicit_flag(monkeypatch):
    monkeypatch.setenv("WIKI_WEB_SEARCH_ENABLED", "true")
    assert web_search.is_enabled(explicit=False) is False
    assert web_search.is_enabled(explicit=True) is True


def test_is_enabled_falls_back_to_env(monkeypatch):
    monkeypatch.delenv("WIKI_WEB_SEARCH_ENABLED", raising=False)
    assert web_search.is_enabled() is False
    monkeypatch.setenv("WIKI_WEB_SEARCH_ENABLED", "YES")
    assert web_search.is_enabled() is True


def test_duckduckgo_uses_abstract_and_related_topics():
    http_get = FakeHttpGet(
        [
            {
                "Heading": "Aurora Labs",
                "AbstractText": "Aurora Labs makes open IoT sensors.",
                "AbstractURL": "https://example.com/aurora",
                "RelatedTopics": [
                    {"Text": "MeshSync - a sync protocol", "FirstURL": "https://example.com/meshsync"},
                    {"Topics": [{"Text": "Nova Widget - a sensor", "FirstURL": "https://example.com/nova"}]},
                ],
            }
        ]
    )
    results = web_search.web_search("Aurora Labs", max_results=3, provider="duckduckgo", http_get=http_get)
    assert [r.title for r in results] == ["Aurora Labs", "MeshSync", "Nova Widget"]
    assert results[0].url == "https://example.com/aurora"
    assert http_get.calls[0][0] == "https://api.duckduckgo.com/"
    assert http_get.calls[0][2]["q"] == "Aurora Labs"


def test_duckduckgo_respects_max_results():
    http_get = FakeHttpGet(
        [
            {
                "AbstractText": "",
                "RelatedTopics": [{"Text": f"Topic {i} - desc", "FirstURL": ""} for i in range(5)],
            }
        ]
    )
    results = web_search.web_search("x", max_results=2, provider="duckduckgo", http_get=http_get)
    assert len(results) == 2


def test_web_search_returns_empty_on_http_error():
    http_get = FakeHttpGet([HttpError(500, "boom")])
    results = web_search.web_search("x", provider="duckduckgo", http_get=http_get)
    assert results == []


def test_web_search_empty_query_short_circuits():
    http_get = FakeHttpGet([])
    assert web_search.web_search("   ", http_get=http_get) == []
    assert http_get.calls == []


def test_unknown_provider_raises():
    with pytest.raises(web_search.WebSearchError):
        web_search.web_search("x", provider="not-a-real-provider", http_get=FakeHttpGet([]))


def test_serpapi_requires_api_key():
    with pytest.raises(web_search.WebSearchError):
        web_search.web_search("x", provider="serpapi", api_key=None, http_get=FakeHttpGet([]))


def test_serpapi_parses_organic_results():
    http_get = FakeHttpGet(
        [{"organic_results": [{"title": "T1", "link": "https://a", "snippet": "s1"}]}]
    )
    results = web_search.web_search("x", provider="serpapi", api_key="k", http_get=http_get)
    assert results == [web_search.WebSearchResult(title="T1", url="https://a", snippet="s1")]
    assert http_get.calls[0][2]["api_key"] == "k"


def test_bing_parses_web_pages_and_sends_subscription_header():
    http_get = FakeHttpGet(
        [{"webPages": {"value": [{"name": "T1", "url": "https://a", "snippet": "s1"}]}}]
    )
    results = web_search.web_search("x", provider="bing", api_key="k", http_get=http_get)
    assert results == [web_search.WebSearchResult(title="T1", url="https://a", snippet="s1")]
    assert http_get.calls[0][1]["Ocp-Apim-Subscription-Key"] == "k"


def test_result_to_chunk_entry_shape():
    result = web_search.WebSearchResult(title="Aurora Labs", url="https://example.com", snippet="Makes sensors.")
    entry = web_search.result_to_chunk_entry("Aurora Labs", 0, result)
    assert entry == {
        "source": "https://example.com",
        "chunk_index": 0,
        "text": "Aurora Labs\n\nMakes sensors.",
        "entities": [],
        "concepts": [],
        "source_type": "web",
    }


def test_result_to_chunk_entry_falls_back_to_placeholder_source():
    result = web_search.WebSearchResult(title="", url="", snippet="")
    entry = web_search.result_to_chunk_entry("Some Topic", 2, result)
    assert entry["source"] == "web-search:Some Topic#2"
    assert entry["text"] == "Some Topic"


def test_augment_grouped_with_web_results_appends_entries():
    grouped = {"Aurora Labs": [{"source": "notes/a.md", "chunk_index": 0, "text": "local", "entities": [], "concepts": [], "source_type": "text"}]}
    http_get = FakeHttpGet(
        [{"AbstractText": "Web summary", "Heading": "Aurora Labs", "AbstractURL": "https://x", "RelatedTopics": []}]
    )
    added = web_search.augment_grouped_with_web_results(
        grouped, ["Aurora Labs"], provider="duckduckgo", http_get=http_get
    )
    assert added == 1
    assert len(grouped["Aurora Labs"]) == 2
    assert grouped["Aurora Labs"][1]["source_type"] == "web"


def test_augment_grouped_with_web_results_skips_unknown_topics():
    grouped = {"Real Topic": []}
    added = web_search.augment_grouped_with_web_results(grouped, ["Ghost Topic"], http_get=FakeHttpGet([]))
    assert added == 0
    assert grouped == {"Real Topic": []}


def test_augment_grouped_with_web_results_respects_max_topics():
    grouped = {"A": [], "B": []}
    http_get = FakeHttpGet(
        [{"AbstractText": "one", "AbstractURL": "https://a", "RelatedTopics": []}]
    )
    added = web_search.augment_grouped_with_web_results(
        grouped, ["A", "B"], max_topics=1, provider="duckduckgo", http_get=http_get
    )
    assert added == 1
    assert grouped["A"] and not grouped["B"]


def test_augment_grouped_with_web_results_stops_on_misconfigured_provider():
    grouped = {"A": [], "B": []}
    added = web_search.augment_grouped_with_web_results(
        grouped, ["A", "B"], provider="serpapi", api_key=None, http_get=FakeHttpGet([])
    )
    assert added == 0
    assert grouped == {"A": [], "B": []}
