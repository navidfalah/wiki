"""Mechanism tests for LLMClient.embed_text() — cache hit/miss, retries,
and the "no API key" error path. Mocks the OpenAI SDK boundary
(_get_client) rather than making real network calls, same reasoning as the
rest of the compiler's LLM-touching tests: the plumbing is testable without
an API key, the actual embedding quality is not."""

from types import SimpleNamespace

import pytest

from llm_client import LLMClient, ResponseCache


class _FakeEmbeddingsAPI:
    def __init__(self, vector: list[float], fail_times: int = 0, error_cls: type[Exception] = ConnectionError):
        self.vector = vector
        self.fail_times = fail_times
        self.error_cls = error_cls
        self.call_count = 0

    def create(self, model: str, input: str):
        self.call_count += 1
        if self.call_count <= self.fail_times:
            raise self.error_cls("transient failure")
        return SimpleNamespace(data=[SimpleNamespace(embedding=self.vector)])


class _FakeOpenAIClient:
    def __init__(self, embeddings_api: _FakeEmbeddingsAPI):
        self.embeddings = embeddings_api


def _client_with_fake_backend(tmp_path, embeddings_api: _FakeEmbeddingsAPI, **kwargs) -> LLMClient:
    client = LLMClient(api_key="fake-key", cache=ResponseCache(tmp_path / "cache.sqlite"), **kwargs)
    client._client = _FakeOpenAIClient(embeddings_api)
    return client


def test_embed_text_calls_the_api_and_caches_the_result(tmp_path):
    api = _FakeEmbeddingsAPI([0.1, 0.2, 0.3])
    client = _client_with_fake_backend(tmp_path, api)

    vector = client.embed_text("hello world")
    assert vector == [0.1, 0.2, 0.3]
    assert api.call_count == 1

    # Second call for the same text should hit the cache, not the API.
    vector_again = client.embed_text("hello world")
    assert vector_again == [0.1, 0.2, 0.3]
    assert api.call_count == 1


def test_embed_text_cache_disabled_calls_api_every_time(tmp_path):
    api = _FakeEmbeddingsAPI([0.5])
    client = _client_with_fake_backend(tmp_path, api, cache_enabled=False)

    client.embed_text("x")
    client.embed_text("x")
    assert api.call_count == 2


def test_embed_text_raises_without_an_api_key():
    client = LLMClient(api_key="")
    with pytest.raises(RuntimeError, match="No OPENAI_API_KEY"):
        client.embed_text("hello")


def test_embed_text_retries_transient_failures_then_succeeds(tmp_path):
    api = _FakeEmbeddingsAPI([0.9], fail_times=2)
    client = _client_with_fake_backend(tmp_path, api, max_retries=3, retry_base_delay=0.001)

    vector = client.embed_text("retry me")
    assert vector == [0.9]
    assert api.call_count == 3


def test_embed_text_raises_after_exhausting_retries(tmp_path):
    api = _FakeEmbeddingsAPI([0.9], fail_times=5)
    client = _client_with_fake_backend(tmp_path, api, max_retries=2, retry_base_delay=0.001)

    with pytest.raises(RuntimeError, match="Embeddings API call failed"):
        client.embed_text("always fails")
    assert api.call_count == 2


def test_embed_text_different_texts_use_different_cache_entries(tmp_path):
    api = _FakeEmbeddingsAPI([1.0])
    client = _client_with_fake_backend(tmp_path, api)

    client.embed_text("first")
    client.embed_text("second")
    assert api.call_count == 2
