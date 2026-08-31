"""Regression coverage for make_cache_key()/make_image_cache_key() including
temperature in the hash — previously two call sites sharing a prompt at
different temperatures could silently serve each other's cached response."""

from types import SimpleNamespace

from llm_client import LLMClient, ResponseCache, make_cache_key, make_image_cache_key


def test_make_cache_key_differs_by_temperature():
    a = make_cache_key("sys", "prompt", "model", temperature=0.0)
    b = make_cache_key("sys", "prompt", "model", temperature=0.2)
    assert a != b


def test_make_cache_key_defaults_match_pre_temperature_behavior():
    # Historical default (0.2) must reproduce the same key an untouched
    # call site would have produced, so an existing cache isn't invalidated
    # wholesale by this change.
    assert make_cache_key("sys", "prompt", "model") == make_cache_key(
        "sys", "prompt", "model", temperature=0.2
    )


def test_make_image_cache_key_differs_by_temperature():
    a = make_image_cache_key(b"img-bytes", "sys", "model", temperature=0.0)
    b = make_image_cache_key(b"img-bytes", "sys", "model", temperature=0.2)
    assert a != b


class _FakeChatAPI:
    def __init__(self):
        self.calls = []

    def create(self, **kwargs):
        self.calls.append(kwargs)
        reply = f"response-for-temperature-{kwargs['temperature']}"
        return SimpleNamespace(
            choices=[SimpleNamespace(message=SimpleNamespace(content=reply))]
        )


class _FakeOpenAIClient:
    def __init__(self, chat_api):
        self.chat = SimpleNamespace(completions=chat_api)


def test_generate_response_does_not_reuse_cache_across_temperatures(tmp_path):
    chat_api = _FakeChatAPI()
    client = LLMClient(api_key="fake-key", cache=ResponseCache(tmp_path / "cache.sqlite"))
    client._client = _FakeOpenAIClient(chat_api)

    low_temp = client.generate_response("hello", "sys", temperature=0.0)
    high_temp = client.generate_response("hello", "sys", temperature=0.9)

    assert low_temp == "response-for-temperature-0.0"
    assert high_temp == "response-for-temperature-0.9"
    assert len(chat_api.calls) == 2  # neither call was served from the other's cache entry


def test_generate_response_reuses_cache_for_same_temperature(tmp_path):
    chat_api = _FakeChatAPI()
    client = LLMClient(api_key="fake-key", cache=ResponseCache(tmp_path / "cache.sqlite"))
    client._client = _FakeOpenAIClient(chat_api)

    first = client.generate_response("hello", "sys", temperature=0.0)
    second = client.generate_response("hello", "sys", temperature=0.0)

    assert first == second
    assert len(chat_api.calls) == 1
