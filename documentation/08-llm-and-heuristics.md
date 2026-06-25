# 08 — LLM Client

The compiler is **LLM-only**. Every pipeline step that interprets or writes content requires `OPENAI_API_KEY`.  
**Module:** `compiler/llm_client.py`

## Requirement

```bash
cp .env.example .env
# Set OPENAI_API_KEY=sk-...
```

Without a key, `python main.py` exits immediately:

```
Error: OPENAI_API_KEY is required. Copy .env.example to .env and set your API key.
```

`require_llm()` in `llm_client.py` enforces this at pipeline start and in synthesizer/linker entry points.

## Environment variables

Loaded from repo root `.env` via `python-dotenv`:

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `OPENAI_API_KEY` | **Yes** | (empty) | API authentication |
| `OPENAI_BASE_URL` | No | `https://api.openai.com/v1` | Compatible API endpoint |
| `OPENAI_MODEL` | No | `gpt-4o-mini` | Chat model name |

Works with any OpenAI-compatible API (local LM Studio, Azure, etc.) via `OPENAI_BASE_URL`.

## LLMClient

### `generate_response(prompt, system_prompt)`

1. Check SQLite cache (key = SHA256 of `system_prompt + prompt + model`)
2. On miss: call `chat.completions.create`
3. Cache response in `data/.llm-cache.sqlite`
4. Retry on transient errors (max 3, exponential backoff)

Default `temperature`: 0.2

### `complete_json(system_prompt, user_prompt)`

Calls `generate_response`, parses first JSON object from response.

### `require_llm(llm=None) -> LLMClient`

Returns client or raises `RuntimeError` if key missing.

## Where the LLM is used

| Step | Module | Function |
|------|--------|----------|
| Extraction | `synthesizer.py` | `extract_chunk_topics()` |
| Synthesis | `synthesizer.py` | `synthesize_topic_wiki_pages()` |
| Linking | `linker.py` | `link_page_with_llm()` |
| Review (optional) | `reviewer.py` | `review_page_with_llm()` |

## Cache

**Path:** `data/.llm-cache.sqlite`  
**Table:** `llm_cache(cache_key, system_prompt, prompt, model, response, created_at)`

- Exact match only — change prompt or model → cache miss
- Delete file to force fresh API calls

## Cost and performance tips

| Situation | Recommendation |
|-----------|----------------|
| 1000+ raw files | Incremental compiles (no `--force`) |
| Repeated identical prompts | Keep cache file |
| CI | Set `OPENAI_API_KEY` as GitHub repo secret |

## Next

- [06-extraction-and-synthesis.md](./06-extraction-and-synthesis.md)
- [13-configuration.md](./13-configuration.md)
