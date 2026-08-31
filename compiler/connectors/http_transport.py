"""Default HTTP transport for connectors, built on the stdlib only.

Connectors take their HTTP calls as injected callables (see `base.py` /
`oauth2.py`) so tests never need real network access; these functions are
just the default implementation used outside of tests. Built on
`urllib` rather than adding `requests`/`httpx` as a new dependency.
"""

from __future__ import annotations

import json
import urllib.error
import urllib.parse
import urllib.request


class HttpError(RuntimeError):
    def __init__(self, status: int, body: str):
        super().__init__(f"HTTP {status}: {body[:500]}")
        self.status = status
        self.body = body


def urllib_get(url: str, headers: dict | None = None, params: dict | None = None) -> dict:
    if params:
        query = urllib.parse.urlencode(params)
        sep = "&" if "?" in url else "?"
        url = f"{url}{sep}{query}"
    request = urllib.request.Request(url, headers=headers or {}, method="GET")
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            body = response.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        raise HttpError(exc.code, exc.read().decode("utf-8", errors="replace")) from exc
    return json.loads(body) if body else {}


def urllib_post(url: str, headers: dict | None = None, data: dict | None = None) -> dict:
    body = urllib.parse.urlencode(data or {}).encode("utf-8")
    merged_headers = {"Content-Type": "application/x-www-form-urlencoded", **(headers or {})}
    request = urllib.request.Request(url, data=body, headers=merged_headers, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            response_body = response.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        raise HttpError(exc.code, exc.read().decode("utf-8", errors="replace")) from exc
    return json.loads(response_body) if response_body else {}
