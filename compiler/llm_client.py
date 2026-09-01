"""LLM API client with OpenAI SDK, retry logic, and SQLite response caching."""

from __future__ import annotations

import base64
import hashlib
import json
import os
import re
import sqlite3
import time
from datetime import UTC, datetime
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
    return datetime.now(UTC).isoformat()


def make_cache_key(system_prompt: str, prompt: str, model: str, temperature: float = 0.2) -> str:
    """Stable hash for an exact system_prompt + prompt + model + temperature combination.

    temperature is part of the key because it's part of what determines the
    response: two call sites sharing a prompt at different temperatures must
    not serve each other's cached output. Defaults to 0.2 (the historical
    default) so a cache populated before this parameter existed still hits.
    """
    payload = f"{system_prompt}\0{prompt}\0{model}\0{temperature}".encode()
    return hashlib.sha256(payload).hexdigest()


IMAGE_MIME_TYPES = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".bmp": "image/bmp",
}


def make_image_cache_key(
    image_bytes: bytes, system_prompt: str, model: str, temperature: float = 0.2
) -> str:
    """Stable hash for an exact (image content, prompt, model, temperature) combination."""
    payload = (
        hashlib.sha256(image_bytes).digest() + f"\0{system_prompt}\0{model}\0{temperature}".encode()
    )
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
        self.embedding_model = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
        self.cache = cache or ResponseCache()
        self.cache_enabled = cache_enabled
        self.max_retries = max(1, max_retries)
        self.retry_base_delay = max(0.1, retry_base_delay)
        self._client: Any = None

        # Pipeline callers (see main.py's step_* functions) set current_step
        # before invoking a step so every LLM call made within it — chat
        # completions, embeddings, cache hits — is attributed to that step.
        self.current_step: str = "unknown"
        self.usage_log: list[dict[str, Any]] = []

    @classmethod
    def for_purpose(cls, purpose: str, **kwargs: Any) -> "LLMClient":
        """Build a client for a named purpose (e.g. "thinking", "embedding").

        Reads `{PURPOSE}_OPENAI_API_KEY` / `_BASE_URL` / `_MODEL` env vars in
        preference to the default `OPENAI_*` ones, so the wiki app's Settings
        page (backend/src/lib/llmSettings.ts) can point a specific pipeline
        step at a different provider/model/key than the rest of the run --
        e.g. a stronger "thinking" model for synthesis while extraction and
        linking keep using a cheaper default. Falls back to the default
        OPENAI_* vars for any purpose without its own override configured.
        """
        prefix = re.sub(r"[^A-Z0-9]+", "_", purpose.strip().upper()).strip("_")
        api_key = os.getenv(f"{prefix}_OPENAI_API_KEY") or os.getenv("OPENAI_API_KEY", "")
        base_url = os.getenv(f"{prefix}_OPENAI_BASE_URL") or os.getenv(
            "OPENAI_BASE_URL", "https://api.openai.com/v1"
        )
        model = os.getenv(f"{prefix}_OPENAI_MODEL") or os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        return cls(api_key=api_key, base_url=base_url, model=model, **kwargs)

    @property
    def available(self) -> bool:
        return bool(self.api_key)

    def _record_usage(
        self,
        *,
        model: str,
        prompt_tokens: int = 0,
        completion_tokens: int = 0,
        total_tokens: int = 0,
        cached: bool = False,
    ) -> None:
        self.usage_log.append(
            {
                "step": self.current_step,
                "model": model,
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "total_tokens": total_tokens,
                "cached": cached,
            }
        )

    def usage_summary(self) -> list[dict[str, Any]]:
        """Aggregate usage_log by (step, model): tokens plus call/cache-hit counts."""
        totals: dict[tuple[str, str], dict[str, int]] = {}
        for entry in self.usage_log:
            key = (entry["step"], entry["model"])
            bucket = totals.setdefault(
                key,
                {
                    "prompt_tokens": 0,
                    "completion_tokens": 0,
                    "total_tokens": 0,
                    "calls": 0,
                    "cache_hits": 0,
                },
            )
            if entry["cached"]:
                bucket["cache_hits"] += 1
            else:
                bucket["calls"] += 1
                bucket["prompt_tokens"] += entry["prompt_tokens"]
                bucket["completion_tokens"] += entry["completion_tokens"]
                bucket["total_tokens"] += entry["total_tokens"]
        return [
            {"step": step, "model": model, **bucket}
            for (step, model), bucket in totals.items()
        ]

    def _get_client(self) -> Any:
        if OpenAI is None:
            raise RuntimeError(
                "openai package is not installed. Run: pip install openai"
            )
        if self._client is None:
            self._client = OpenAI(api_key=self.api_key, base_url=self.base_url)
        return self._client

    def _chat_completion_with_retries(self, messages: list[dict[str, Any]], *, temperature: float) -> str:
        """Call chat.completions.create with the shared retry/backoff policy."""
        last_error: Exception | None = None
        for attempt in range(1, self.max_retries + 1):
            try:
                response = self._get_client().chat.completions.create(
                    model=self.model,
                    temperature=temperature,
                    messages=messages,
                )
                usage = getattr(response, "usage", None)
                self._record_usage(
                    model=self.model,
                    prompt_tokens=getattr(usage, "prompt_tokens", 0) or 0,
                    completion_tokens=getattr(usage, "completion_tokens", 0) or 0,
                    total_tokens=getattr(usage, "total_tokens", 0) or 0,
                )
                return response.choices[0].message.content or ""
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
        cache_key = make_cache_key(system_prompt, prompt, self.model, temperature)

        if cache_on:
            cached = self.cache.get(cache_key)
            if cached is not None:
                self._record_usage(model=self.model, cached=True)
                return cached

        content = self._chat_completion_with_retries(
            [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt},
            ],
            temperature=temperature,
        )
        if cache_on:
            self.cache.set(
                cache_key,
                system_prompt=system_prompt,
                prompt=prompt,
                model=self.model,
                response=content,
            )
        return content

    def embed_text(self, text: str, *, use_cache: bool | None = None) -> list[float]:
        """Embed text via an OpenAI-compatible embeddings endpoint.

        Cached in the same SQLite cache generate_response() uses, keyed by
        (a fixed "<embedding>" tag, text, embedding_model) — reusing
        ResponseCache as-is (its schema is just a string keyed by a hash of
        three strings) rather than standing up a second cache table for
        what is, mechanically, the same lookup. The vector is stored as a
        JSON-encoded string.
        """
        if not self.available:
            raise RuntimeError(
                "No OPENAI_API_KEY set. Add a key to .env or pass api_key= to LLMClient."
            )

        cache_on = self.cache_enabled if use_cache is None else use_cache
        cache_key = make_cache_key("<embedding>", text, self.embedding_model)

        if cache_on:
            cached = self.cache.get(cache_key)
            if cached is not None:
                self._record_usage(model=self.embedding_model, cached=True)
                return json.loads(cached)

        last_error: Exception | None = None
        for attempt in range(1, self.max_retries + 1):
            try:
                response = self._get_client().embeddings.create(model=self.embedding_model, input=text)
                vector = list(response.data[0].embedding)
                usage = getattr(response, "usage", None)
                self._record_usage(
                    model=self.embedding_model,
                    prompt_tokens=getattr(usage, "prompt_tokens", 0) or 0,
                    total_tokens=getattr(usage, "total_tokens", 0) or 0,
                )
                break
            except RETRYABLE_EXCEPTIONS as exc:
                last_error = exc
                if attempt >= self.max_retries:
                    raise RuntimeError(
                        f"Embeddings API call failed after {self.max_retries} attempt(s): {last_error}"
                    ) from last_error
                time.sleep(self.retry_base_delay * (2 ** (attempt - 1)))
            except Exception as exc:
                raise RuntimeError(f"Embeddings API call failed (non-retryable): {exc}") from exc

        if cache_on:
            self.cache.set(
                cache_key,
                system_prompt="<embedding>",
                prompt=text,
                model=self.embedding_model,
                response=json.dumps(vector),
            )
        return vector

    def describe_image(
        self,
        image_path: Path,
        system_prompt: str,
        *,
        prompt: str = "Describe this image.",
        temperature: float = 0.2,
        use_cache: bool | None = None,
    ) -> str:
        """
        Caption an image via a vision-capable chat completion.

        Requires a vision-capable model (the default gpt-4o-mini supports
        this). Cached separately from generate_response, keyed by the image's
        own content hash rather than a text prompt, so re-captioning the same
        image file (even if renamed/moved) is a cache hit.
        """
        if not self.available:
            raise RuntimeError(
                "No OPENAI_API_KEY set. Add a key to .env or pass api_key= to LLMClient."
            )

        image_bytes = image_path.read_bytes()
        mime = IMAGE_MIME_TYPES.get(image_path.suffix.lower(), "application/octet-stream")
        cache_on = self.cache_enabled if use_cache is None else use_cache
        cache_key = make_image_cache_key(image_bytes, system_prompt, self.model, temperature)

        if cache_on:
            cached = self.cache.get(cache_key)
            if cached is not None:
                self._record_usage(model=self.model, cached=True)
                return cached

        data_url = f"data:{mime};base64,{base64.b64encode(image_bytes).decode('ascii')}"
        content = self._chat_completion_with_retries(
            [
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": data_url}},
                    ],
                },
            ],
            temperature=temperature,
        )
        if cache_on:
            self.cache.set(
                cache_key,
                system_prompt=system_prompt,
                prompt=f"<image:{image_path.name}>",
                model=self.model,
                response=content,
            )
        return content

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
