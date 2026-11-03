# 42 — Minimal AI operation

The normal chat path uses local BM25 keyword search and quotes retrieved passages. It does not construct a model client, embed text, rerank with a model or generate answers. New chat sessions search original files; existing sessions keep their scope, and users can explicitly search compiled wiki pages.

## Standard build

1. Python reads/chunks files and detects changes.
2. A model extracts topics, entities and concepts.
3. Python groups topic chunks; a model writes draft pages.
4. Python adds source references and rule-based source trust.
5. Python links exact topic-title mentions and applies manual connection overrides.

AI extraction and page writing remain necessary to compile a wiki. Images and audio can also need AI captioning/transcription. Raw-source chat does not invoke those models: unavailable previews use placeholders. No raw files are edited by this change.

## Removed from the app workflow

- LLM page linking and inferred entity aliases during export. The historical `llm` and `resolve_entities_llm` Python arguments are accepted but ignored by the exporter.
- Generated chat answers, LLM reranking, hypothetical query generation, alternative-query generation and corrective-query rewriting in app settings.
- Architecture/preset experiments and model selection in the chat/search interface.
- Pilot claim trust scores, correction forms and temporal-fact API. The review page keeps local wiki-health checks.
- Critic deletion/regeneration, correction feedback and web enrichment controls in the normal build interface. Existing persisted pipeline choices are read as disabled for these stages. Explicit compiler flags remain available for research runs.

Research modules and their evaluations remain available separately; removing their app controls does not delete research datasets or previous corrections.

## Optional semantic search

Search settings offer keyword search (default, zero model calls) or keyword + embeddings. Semantic search still quotes passages: no generation or model reranking. It needs an embedding-capable profile. The compact settings page enables persistent caching to avoid repeated embeddings. Semantic search should only be enabled if tests on representative questions show that it improves retrieval.

## Migration

Both Python and the backend normalize saved experimental architectures to the standard retrieval path, `hybrid_rerank` to `bm25`, and `auto` answers to `extractive`. New settings writes reject removed choices. Saved presets are no longer exposed in the UI. Old sessions and messages are preserved; new sessions default to raw sources.

## Accuracy limits

Exact entity matching avoids guesses about short names and email aliases, but misses valid identity matches. Keyword-only search can miss paraphrases and cross-language matches. Extractive output avoids newly generated claims, but can still retrieve an irrelevant, incorrect or outdated source. Wiki pages remain AI-generated. Source trust labels are configured metadata, not proof of truth. No claim of improved overall accuracy is made without comparative evaluation.

## Verification

`compiler/tests/test_minimal_ai.py` verifies both normal and streaming chat without constructing a model client, migration of old AI settings, and page linking without a model. Existing extraction/synthesis, retrieval, source tracking and evaluation tests continue to run independently.
