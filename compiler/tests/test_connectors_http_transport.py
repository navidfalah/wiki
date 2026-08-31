import json
import urllib.error

import pytest

from connectors.http_transport import HttpError, urllib_get, urllib_post


class _FakeResponse:
    def __init__(self, body: bytes):
        self._body = body

    def read(self):
        return self._body

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False


def test_urllib_get_parses_json(monkeypatch):
    captured = {}

    def fake_urlopen(request, timeout=30):
        captured["url"] = request.full_url
        captured["headers"] = dict(request.header_items())
        return _FakeResponse(json.dumps({"ok": True}).encode("utf-8"))

    monkeypatch.setattr("urllib.request.urlopen", fake_urlopen)
    result = urllib_get("https://api.example.com/things", headers={"Authorization": "Bearer x"}, params={"q": "a b"})
    assert result == {"ok": True}
    assert "q=a" in captured["url"]
    assert captured["headers"]["Authorization"] == "Bearer x"


def test_urllib_get_raises_http_error(monkeypatch):
    import io

    def fake_urlopen(request, timeout=30):
        raise urllib.error.HTTPError(request.full_url, 404, "Not Found", {}, io.BytesIO(b"missing"))

    monkeypatch.setattr("urllib.request.urlopen", fake_urlopen)
    with pytest.raises(HttpError) as exc_info:
        urllib_get("https://api.example.com/missing")
    assert exc_info.value.status == 404


def test_urllib_post_encodes_form_data(monkeypatch):
    captured = {}

    def fake_urlopen(request, timeout=30):
        captured["body"] = request.data
        captured["content_type"] = request.get_header("Content-type")
        return _FakeResponse(json.dumps({"access_token": "tok"}).encode("utf-8"))

    monkeypatch.setattr("urllib.request.urlopen", fake_urlopen)
    result = urllib_post("https://token.example.com", data={"grant_type": "refresh_token"})
    assert result == {"access_token": "tok"}
    assert b"grant_type=refresh_token" in captured["body"]
    assert captured["content_type"] == "application/x-www-form-urlencoded"
