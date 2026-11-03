# Project map

Start here when navigating Wissensbau. The running application has three code layers:

```text
Browser
  → frontend/src/app.ts       pages, language selection, authenticated API proxy
  → backend/src/app.ts        API middleware and error handling
  → backend/src/routes/       endpoints grouped by feature
  → backend/src/lib/          application logic and filesystem storage
  → compiler/cli.py           Python engine commands (through pythonBridge.ts)
    compiler/main.py          compilation pipeline
```

## Where to make a change

| Change | Start here |
| --- | --- |
| Page layout or content | `frontend/src/views/` (EJS templates) |
| Page routing and server rendering | `frontend/src/routes/` |
| Browser interactions | `frontend/src/client/` |
| English and German UI text | `frontend/src/i18n/` — use `t()` |
| API behavior | `backend/src/routes/<feature>.ts` |
| Storage and application rules | `backend/src/lib/` |
| Backend data locations | `backend/src/paths.ts` |
| Compilation stages | `compiler/main.py`, then `synthesizer.py`, `linker.py`, `moc_generator.py` |
| Retrieval and chat | `compiler/rag_engine.py`, `hybrid_retrieval.py`, `rag_settings.py` |
| External data connectors | `compiler/connectors/`, `connectors_service.py` |
| Local and production deployment | `docker-compose.yml`, `docker-compose.prod.yml`, `deploy/` |

## Backend feature modules

`backend/src/routes/index.ts` only initializes required state, registers public endpoints, applies authentication, and composes feature modules. Keep that order: new private modules belong below the authentication gate.

| Module | Responsibility |
| --- | --- |
| `auth.ts` | Public login and login throttling |
| `accounts.ts` | Current user, logout, activity, administrator user management |
| `backups.ts` | Administrator backup creation, upload, download, restore, deletion |
| `sources.ts` | Registered source folders |
| `files.ts` | Raw file browsing, previews, uploads, folders |
| `emails.ts` | Email engine endpoints |
| `docs.ts` | Wiki pages and page version history |
| `builds.ts` | Compilation streams, stopping builds, run history, token usage |
| `knowledge.ts` | Graphs, analytics, attention, resources, temporal facts, review report |
| `search.ts` | Cross-corpus search |
| `review.ts` | Active-learning review queue |
| `chat.ts` | Chat sessions, turns, streamed answers |
| `settings.ts` | Company, LLM, pipeline, RAG settings and presets |
| `connectors.ts` | External connector configuration and sync |
| `shared.ts` | Shared route path validation |

Feature modules register endpoints explicitly and import their own dependencies. Keep request parsing and response handling in routes; reuse application logic from `lib/`. Avoid importing one feature route module from another. Shared route helpers belong in `shared.ts` only when multiple modules need them. Administrator checks remain on the relevant endpoints.

## Source code versus stored data

- `data/raw/`: human-owned source files. Never edit these during refactoring.
- `data/`: persisted settings, users, sessions, compilation state, caches and other runtime records.
- `wiki-app/docs/`: compiled Markdown read by the current frontend.
- `wiki-app/static/media/`: generated media shared with the application.
- `compiler/temp_output/`: intermediate compilation output.
- `backend/dist/`, `frontend/dist/`, `frontend/dist-static/`: generated builds.

`wiki-app/` also contains the older Docusaurus viewer. The current web application is `frontend/` plus `backend/`; the shared document and media paths still live under `wiki-app/`. Do not rename those paths without updating storage configuration and deployment mounts.

## Verify changes

From the repository root:

```sh
npm run typecheck --prefix backend
npm run lint --prefix backend
npm test --prefix backend
npm run typecheck --prefix frontend
npm test --prefix frontend
```

Backend endpoint regression tests live in `backend/src/routes/*.routes.test.ts` and start the real application against temporary data and a fake Python bridge. They need permission to listen on localhost. Backup tests require GNU tar (the default macOS tar does not support their `--transform` fixtures).

For Python-only changes, use the compiler test suite described in [getting started](02-getting-started.md). Broader background remains in the [documentation index](README.md).
