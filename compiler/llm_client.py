"""LLM API client with OpenAI SDK, retry logic, and SQLite response caching."""

from __future__ import annotations

import hashlib
import json
import os
import re
import sqlite3
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env")
DEFAULT_CACHE_PATH = PROJECT_ROOT / "data" / ".llm-cache.sqlite"

# Exceptions worth retrying (transient network / rate-limit / server errors).
try:
    from openai import (
        APIConnectionError,
        APITimeoutError,
        InternalServerError,
        OpenAI,
        RateLimitError,
    )

    RETRYABLE_EXCEPTIONS: tuple[type[Exception], ...] = (
        APIConnectionError,
        APITimeoutError,
        RateLimitError,
        InternalServerError,
        ConnectionError,
        TimeoutError,
    )
except ImportError:  # pragma: no cover - openai not installed in some environments
    OpenAI = None  # type: ignore[misc, assignment]
    RETRYABLE_EXCEPTIONS = (ConnectionError, TimeoutError)


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def make_cache_key(system_prompt: str, prompt: str, model: str) -> str:
    """Stable hash for an exact system_prompt + prompt + model combination."""
    payload = f"{system_prompt}\0{prompt}\0{model}".encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


class ResponseCache:
    """SQLite-backed cache for LLM responses."""

    def __init__(self, db_path: Path | None = None) -> None:
        self.db_path = db_path or DEFAULT_CACHE_PATH
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS llm_cache (
                    cache_key TEXT PRIMARY KEY,
                    system_prompt TEXT NOT NULL,
                    prompt TEXT NOT NULL,
                    model TEXT NOT NULL,
                    response TEXT NOT NULL,
                    created_at TEXT NOT NULL
                )
                """
            )
            conn.commit()

    def get(self, cache_key: str) -> str | None:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT response FROM llm_cache WHERE cache_key = ?",
                (cache_key,),
            ).fetchone()
        return row["response"] if row else None

    def set(
        self,
        cache_key: str,
        *,
        system_prompt: str,
        prompt: str,
        model: str,
        response: str,
    ) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO llm_cache
                    (cache_key, system_prompt, prompt, model, response, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (cache_key, system_prompt, prompt, model, response, _utc_now_iso()),
            )
            conn.commit()


class LLMClient:
    """OpenAI SDK client with caching and retries."""

    def __init__(
        self,
        api_key: str | None = None,
        base_url: str | None = None,
        model: str | None = None,
        cache: ResponseCache | None = None,
        cache_enabled: bool = True,
        max_retries: int = 3,
        retry_base_delay: float = 1.0,
    ) -> None:
        self.api_key = api_key if api_key is not None else os.getenv("OPENAI_API_KEY", "")
        self.base_url = base_url or os.getenv(
            "OPENAI_BASE_URL", "https://api.openai.com/v1"
        )
        self.model = model or os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        self.cache = cache or ResponseCache()
        self.cache_enabled = cache_enabled
        self.max_retries = max(1, max_retries)
        self.retry_base_delay = max(0.1, retry_base_delay)
        self._client: Any = None

    @property
    def available(self) -> bool:
        return bool(self.api_key)

    def _get_client(self) -> Any:
        if OpenAI is None:
            raise RuntimeError(
                "openai package is not installed. Run: pip install openai"
            )
        if self._client is None:
            self._client = OpenAI(api_key=self.api_key, base_url=self.base_url)
        return self._client

    def generate_response(
        self,
        prompt: str,
        system_prompt: str,
        *,
        temperature: float = 0.2,
        use_cache: bool | None = None,
    ) -> str:
        """
        Call the chat completions API with cache lookup, retries, and error handling.

        Checks the local SQLite cache for an exact (system_prompt, prompt, model)
        match before making a network request.
        """
        if not self.available:
            raise RuntimeError(
                "No OPENAI_API_KEY set. Add a key to .env or pass api_key= to LLMClient."
            )

        cache_on = self.cache_enabled if use_cache is None else use_cache
        cache_key = make_cache_key(system_prompt, prompt, self.model)

        if cache_on:
            cached = self.cache.get(cache_key)
            if cached is not None:
                return cached

        last_error: Exception | None = None
        for attempt in range(1, self.max_retries + 1):
            try:
                response = self._get_client().chat.completions.create(
                    model=self.model,
                    temperature=temperature,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": prompt},
                    ],
                )
                content = response.choices[0].message.content or ""
                if cache_on:
                    self.cache.set(
                        cache_key,
                        system_prompt=system_prompt,
                        prompt=prompt,
                        model=self.model,
                        response=content,
                    )
                return content
            except RETRYABLE_EXCEPTIONS as exc:
                last_error = exc
                if attempt >= self.max_retries:
                    break
                delay = self.retry_base_delay * (2 ** (attempt - 1))
                time.sleep(delay)
            except Exception as exc:
                raise RuntimeError(
                    f"LLM API call failed (non-retryable): {exc}"
                ) from exc

        raise RuntimeError(
            f"LLM API call failed after {self.max_retries} attempt(s): {last_error}"
        ) from last_error

    def complete(self, system: str, user: str, temperature: float = 0.2) -> str:
        """Backward-compatible alias: system=user order matches prior API."""
        return self.generate_response(user, system, temperature=temperature)

    def complete_json(self, system: str, user: str) -> dict[str, Any]:
        """Request JSON from the LLM and parse the first object in the response."""
        raw = self.complete(system, user)
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if not match:
            raise ValueError("LLM response did not contain JSON")
        return json.loads(match.group())


def require_llm(llm: LLMClient | None = None) -> LLMClient:
    """Return an LLM client or raise if OPENAI_API_KEY is not configured."""
    client = llm or LLMClient()
    if not client.available:
        raise RuntimeError(
            "OPENAI_API_KEY is required. Copy .env.example to .env and set your API key."
        )
    return client


def generate_response(
    prompt: str,
    system_prompt: str,
    *,
    temperature: float = 0.2,
    use_cache: bool = True,
    max_retries: int = 3,
    client: LLMClient | None = None,
    **client_kwargs: Any,
) -> str:
    """
    Generic module-level helper for a single LLM completion.

    Args:
        prompt: User message content.
        system_prompt: System message content.
        temperature: Sampling temperature passed to the API.
        use_cache: When True, return a cached response if one exists.
        max_retries: Number of attempts on transient failures.
        client: Optional preconfigured LLMClient instance.
        **client_kwargs: Passed to LLMClient when client is not provided.

    Returns:
        The model's text response.
    """
    llm = client or LLMClient(max_retries=max_retries, **client_kwargs)
    return llm.generate_response(
        prompt,
        system_prompt,
        temperature=temperature,
        use_cache=use_cache,
    )
