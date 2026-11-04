# 43 — Drive-native Apps Script application

The independent application in [`apps-script/`](../apps-script/INSTALL-en.md) implements the simplified Wissensbau workflow entirely with Apps Script JavaScript and HTML. No Python process or Node server is required at runtime. The existing local application remains available during migration.

Runtime data is stored in the user's Drive workspace: source copies, extracted text, Markdown pages, snapshots, progress, cached model responses and conversations. The workspace pointer and API key are stored in Apps Script User Properties. A key never appears in ordinary Drive files or bootstrap responses.

## Entry points

- `apps-script/src/Core.gs`: portable algorithms and Office XML readers, with no Google services or external dependencies.
- `Store.gs` / `Readers.gs`: Drive persistence, uploads, native Google readers, Office ZIP parsing and temporary Google conversion.
- `Compiler.gs`: incremental, checkpointed compilation and single-pointer publication of a complete version.
- `Search.gs`: local BM25, source excerpts, optional API answers, chat persistence, health checks and Markdown export.
- `Code.gs` and the HTML files: web app entry point and English/German interface.

Local processing is the default. It preserves source text and organizes pages by filename, without semantic topic inference or generated summaries. API-assisted extraction/synthesis and generated chat answers are separate opt-ins. Exact-title links, references and keyword retrieval always run in JavaScript.

Modern Word/Excel/PowerPoint files, templates and macro-enabled containers are read as data. Google Docs, Sheets and Slides use native services. PDF and older Office formats can use temporary Google conversion. Formula execution, Office macros, image interpretation and audio transcription are not performed. See the installation guide's format matrix for precise coverage and conversion limits.

Deployment uses the supplied V8 manifest, Drive API v3 and execution as the accessing user, initially restricted to the owner. Personal account setup and authorization must be verified in Google; local service simulations do not establish live platform correctness. Full native Docs/Sheets/Slides scopes are declared because the built-in `openById` services require them, even though these readers do not edit the sources.

The package includes editor installation steps, a Persian guide, a clasp configuration example, a combined server script, an Apps Script project-content JSON payload and the portable core as `.js`. Nothing is automatically published or uploaded to Google by the packaging command.
