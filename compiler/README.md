# Compiler

The compiler turns human-provided files in `../data/raw/` into linked Markdown in `../wiki-app/docs/`. Raw files are read-only inputs to the pipeline.

## Entry points

- `python main.py --help`: compile command and available flags. `main.py` is a small entry point and preserves imports of `run_pipeline` and the five stage functions.
- `pipeline.runner.run_pipeline(...)`: run a build from Python.
- `cli.py`: JSON commands used by the Express backend for chat, emails, connectors and other engine operations. This is separate from the compilation command.

## Build flow

```text
main.py → pipeline/command_line.py → pipeline/runner.py
                                      │
                                      ├─ reading.py     raw files → chunks
                                      ├─ extraction.py  chunks → cached topic extractions
                                      ├─ synthesis.py   affected topics → Markdown drafts
                                      ├─ indexing.py    changed drafts → topic index + delta
                                      └─ linking.py     affected pages → exported wiki
```

`pipeline/reporting.py` owns Rich console output, progress callbacks and token usage tables. `pipeline_tracker.py` persists run status for the dashboard. The runner owns stage order, run status, model selection, failure recording and final map-of-content generation. Stages do not import the runner or the command-line parser.

## Where the underlying work lives

| Responsibility | Modules |
| --- | --- |
| File discovery, chunk records, incremental extraction state, draft generation | `synthesizer.py` |
| File format readers | `media_ingest.py`, `email_ingest.py`, `text_chunking.py` |
| Index updates and page export | `linker.py`, `mechanical_linker.py`, `moc_generator.py` |
| Model calls, caching and provider configuration | `llm_client.py` |
| Grounding, privacy, source trust | `extraction_critic.py`, `pii_redaction.py`, `trust.py` |
| Retrieval and answers | `rag_engine.py`, `hybrid_retrieval.py`, `rag_types.py`, `rag_settings.py` |
| Connector adapters | `connectors/`, `connectors_service.py` |
| Review and research evaluation | `active_learning.py`, `*_eval.py`, `eval_gate.py` |
| Development data generators | `scripts/dev/` |

The pipeline package separates build orchestration from these reusable engines. `synthesizer.py` still groups several low-level concerns; this refactor does not relocate its public functions or change their callers.

## Making changes

Change a stage's build behavior in its `pipeline/` module; change reusable extraction, linking or retrieval behavior in the underlying engine. Import dependencies from their owning modules rather than through `main.py`. Keep dashboard log markers (`@@RUN_ID@@`), run step names, persisted data formats and command-line flags stable when reorganizing code.

Tests patch dependencies in the module that uses them. Filesystem tests must redirect paths for nested compiler packages as well as top-level modules, so tests cannot write into real data or generated pages.

From this directory:

```sh
python3 -m pytest -q
python3 -m ruff check .
python3 main.py --help
```

No API key is needed for the test suite. A real compile requires model configuration and can write generated pages, state and run records.
