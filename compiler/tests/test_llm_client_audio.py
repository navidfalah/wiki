"""Coverage for LLMClient.transcribe_audio(): caching keyed by audio content,
graceful availability check, and that a cache hit skips the API entirely."""

from types import SimpleNamespace

import pytest

from llm_client import LLMClient, ResponseCache, make_audio_cache_key


def test_make_audio_cache_key_differs_by_content():
    a = make_audio_cache_key(b"audio-bytes-a", "whisper-1")
    b = make_audio_cache_key(b"audio-bytes-b", "whisper-1")
    assert a != b


def test_make_audio_cache_key_differs_by_model():
    a = make_audio_cache_key(b"audio-bytes", "whisper-1")
    b = make_audio_cache_key(b"audio-bytes", "whisper-2")
    assert a != b


class _FakeTranscriptionsAPI:
    def __init__(self, text: str = "hello from the transcript"):
        self.calls = 0
        self.text = text

    def create(self, **kwargs):
        self.calls += 1
        return SimpleNamespace(text=self.text)


class _FakeOpenAIClient:
    def __init__(self, transcriptions_api):
        self.audio = SimpleNamespace(transcriptions=transcriptions_api)


def test_transcribe_audio_calls_api_and_returns_text(tmp_path):
    audio_path = tmp_path / "memo.mp3"
    audio_path.write_bytes(b"fake mp3 bytes")

    api = _FakeTranscriptionsAPI("MeshSync rejoin storm at 8 nodes.")
    client = LLMClient(api_key="fake-key", cache=ResponseCache(tmp_path / "cache.sqlite"))
    client._client = _FakeOpenAIClient(api)

    result = client.transcribe_audio(audio_path)

    assert result == "MeshSync rejoin storm at 8 nodes."
    assert api.calls == 1


def test_transcribe_audio_reuses_cache_for_same_content(tmp_path):
    audio_path = tmp_path / "memo.mp3"
    audio_path.write_bytes(b"fake mp3 bytes")

    api = _FakeTranscriptionsAPI()
    client = LLMClient(api_key="fake-key", cache=ResponseCache(tmp_path / "cache.sqlite"))
    client._client = _FakeOpenAIClient(api)

    first = client.transcribe_audio(audio_path)
    second = client.transcribe_audio(audio_path)

    assert first == second
    assert api.calls == 1  # second call served from cache


def test_transcribe_audio_different_content_not_served_from_cache(tmp_path):
    audio_a = tmp_path / "a.mp3"
    audio_a.write_bytes(b"fake mp3 bytes a")
    audio_b = tmp_path / "b.mp3"
    audio_b.write_bytes(b"fake mp3 bytes b")

    api = _FakeTranscriptionsAPI()
    client = LLMClient(api_key="fake-key", cache=ResponseCache(tmp_path / "cache.sqlite"))
    client._client = _FakeOpenAIClient(api)

    client.transcribe_audio(audio_a)
    client.transcribe_audio(audio_b)

    assert api.calls == 2


def test_transcribe_audio_raises_without_api_key(tmp_path):
    audio_path = tmp_path / "memo.mp3"
    audio_path.write_bytes(b"fake mp3 bytes")

    client = LLMClient(api_key="", cache=ResponseCache(tmp_path / "cache.sqlite"))

    with pytest.raises(RuntimeError):
        client.transcribe_audio(audio_path)
