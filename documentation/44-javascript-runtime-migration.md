# JavaScript runtime migration

Wissensbau has two independent deployment targets:

- `apps-script/` runs in Google Apps Script and stores its runtime data in Drive. See [the Apps Script guide](43-google-apps-script.md) and [installation instructions](../apps-script/INSTALL-en.md) for setup, supported inputs and limitations.
- `backend/` runs on Node.js. Its compiler, source readers, extractive search, email handling, entity graph, connectors and backup archive handling now run in JavaScript. The existing Express routes, frontend and on-disk data locations are retained. Node 22 is the production target.

The JavaScript compiler uses the configured API for extraction and synthesis. The default chat configuration uses local BM25 retrieval and returns excerpts without a language-model call; optional hybrid retrieval can use an embeddings API. Optional critic, human corrections and web search are still available when enabled. A critic is itself a model and can make mistakes; multiple samples and regeneration increase API usage. The JavaScript implementation does not promise identical prose or identical retrieval rankings to the old Python implementation.

The Node reader extracts text from modern Office files, PDF, OpenDocument files, email and supported text files. It lists ZIP contents instead of recursively extracting them. Files larger than 40 MiB, unsupported binary formats, and files that cannot be parsed are represented by a placeholder; the Apps Script target has separate conversion capabilities and limits. Google Drive connector imports Google Docs, Sheets and Slides using Office exports so the reader can process their contents; Drive's own export size and format restrictions apply. Connection flows and model APIs still require the appropriate credentials, network access and provider configuration.

SQLite connectors read the database using the JavaScript build of sql.js. The database is loaded into memory and is not modified when browsing or importing. To prevent stale or inconsistent reads, databases with a nonempty SQLite write-ahead log must first be closed or checkpointed by the application that owns them.

Existing encrypted connector credentials use the same Fernet format and `CONNECTOR_SECRET_KEY` as before. OAuth requests use PKCE and read-only Google scopes. Tests use simulated services; they do not establish that any particular external account or model provider is reachable.

The Docker backend image no longer installs Python; it includes the JavaScript command-line entry point and the source-extension manifest from `compiler/`. Plain JavaScript replacements now cover shared document/frontmatter utilities, MDX sanitization, frontmatter repair, offline groundedness, dead-link scan/repair, MOC generation, dashboard analytics, and build orchestration. The legacy tree still contains 146 Python source and test files across retrieval, email, connectors, evaluation, and developer workflows. The migration is incomplete, and file counts do not establish functional parity. Historic documentation is being corrected as those workflows move.

Validate the Node target with `npm run typecheck`, `npm test` and `npm run build` in `backend/`. The Docker image can be checked with `docker build -f backend/Dockerfile .` from the repository root. See the Apps Script guide for that target's separate checks and packaging steps.

For command-line compilation, build the backend and run `node compiler/main.js --force`. Run `node compiler/main.js --help` for the available options. This entry point uses the same configured JavaScript compiler and run history as the backend.

For JavaScript-only development checks, run `node wiki.js check` or `node wiki.js ci --only backend`. Use `--dry-run` to inspect commands. The older `./wiki` remains available for legacy Python evaluation, coverage, Docker and browser workflows until those workflows have been ported.
