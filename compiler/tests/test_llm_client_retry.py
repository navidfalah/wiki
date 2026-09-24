"""Tests for llm_client's retry/backoff policy -- specifically
_retry_after_seconds(), which lets a RateLimitError's own Retry-After
response header override the client's exponential backoff, and the
embed_text() integration point that actually consumes it. No real
OPENAI_API_KEY needed: the OpenAI SDK boundary (_get_client) is faked,
same convention as test_llm_client_embed.py."""

from types import SimpleNamespace
from unittest.mock import patch

from llm_client import LLMClient, ResponseCache, _retry_after_seconds


class _FakeResponse:
    def __init__(self, headers: dict[str, str]):
        self.headers = headers


class _FakeRateLimitError(ConnectionError):
    """Stands in for openai.RateLimitError -- subclasses ConnectionError
    (a real RETRYABLE_EXCEPTIONS member) so it actually reaches the retry
    loop's sleep logic, without needing to construct a real httpx2
    response/request pair just to exercise _retry_after_seconds()."""

    def __init__(self, headers: dict[str, str] | None = None):
        super().__init__("rate limited")
        if headers is not None:
            self.response = _FakeResponse(headers)


def test_retry_after_seconds_reads_the_header():
    assert _retry_after_seconds(_FakeRateLimitError({"retry-after": "7"})) == 7.0


def test_retry_after_seconds_none_without_a_response_attribute():
    assert _retry_after_seconds(_FakeRateLimitError()) is None
    assert _retry_after_seconds(ConnectionError("no response at all")) is None


def test_retry_after_seconds_none_when_header_missing():
    assert _retry_after_seconds(_FakeRateLimitError({"x-request-id": "abc"})) is None


def test_retry_after_seconds_none_for_a_non_numeric_value():
    # The HTTP spec also allows an HTTP-date here; not worth parsing (see
    # the function's own docstring) -- falls back to backoff instead.
    assert _retry_after_seconds(_FakeRateLimitError({"retry-after": "Wed, 21 Oct 2026 07:28:00 GMT"})) is None


def test_retry_after_seconds_clamps_a_negative_value_to_zero():
    assert _retry_after_seconds(_FakeRateLimitError({"retry-after": "-5"})) == 0.0


class _FakeEmbeddingsAPI:
    def __init__(self, vector: list[float], errors: list[Exception]):
        self.vector = vector
        self.errors = list(errors)
        self.call_count = 0

    def create(self, model: str, input: str):
        self.call_count += 1
        if self.errors:
            raise self.errors.pop(0)
        return SimpleNamespace(data=[SimpleNamespace(embedding=self.vector)])


class _FakeOpenAIClient:
    def __init__(self, embeddings_api: _FakeEmbeddingsAPI):
        self.embeddings = embeddings_api


def _client_with_fake_backend(tmp_path, embeddings_api: _FakeEmbeddingsAPI, **kwargs) -> LLMClient:
    client = LLMClient(api_key="fake-key", cache=ResponseCache(tmp_path / "cache.sqlite"), **kwargs)
    client._client = _FakeOpenAIClient(embeddings_api)
    return client


def test_embed_text_sleeps_for_the_servers_retry_after_hint_not_backoff(tmp_path):
    # retry_base_delay is deliberately large (100s) so a pass here can only
    # mean the Retry-After header won by winning-value, not by coincidence.
    api = _FakeEmbeddingsAPI([0.1], errors=[_FakeRateLimitError({"retry-after": "3"})])
    client = _client_with_fake_backend(tmp_path, api, max_retries=2, retry_base_delay=100.0)

    with patch("llm_client.time.sleep") as fake_sleep:
        vector = client.embed_text("hello")

    assert vector == [0.1]
    fake_sleep.assert_called_once_with(3.0)


def test_embed_text_falls_back_to_exponential_backoff_without_the_header(tmp_path):
    # LLMClient floors retry_base_delay at 0.1 (see its __init__).
    api = _FakeEmbeddingsAPI([0.1], errors=[ConnectionError("transient")])
    client = _client_with_fake_backend(tmp_path, api, max_retries=2, retry_base_delay=0.1)

    with patch("llm_client.time.sleep") as fake_sleep:
        client.embed_text("hello")

    fake_sleep.assert_called_once_with(0.1)
