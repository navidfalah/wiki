# LLM Wiki — Agent Schema

Project: **Wissensbau** — a non-commercial research project, hosted at **https://wissensbau.de**. Keep copy descriptive and research-oriented (no marketing claims; no study results exist yet). UI languages: English and German — every user-visible string goes through `t()` (see `documentation/41-internationalization-and-fonts.md`); run `npm run typecheck` in `frontend/` after touching views or client scripts. Fonts: Sora (UI/headings) + Inter (long-form text), self-hosted.

You maintain this wiki alongside the **Python compiler** in `compiler/`. Humans add raw files to `data/raw/`; the compiler generates `wiki-app/docs/`; you can refine pages and workflows here.

## Architecture

| Layer | Path | Owner |
|-------|------|-------|
| Raw sources | `data/raw/` (text, `.eml`, images, PDF/CSV/JSON/DOCX/XLSX/PPTX/ZIP) | Human — never modify via LLM |
| Compiler | `compiler/` | Python pipeline, LLM-only (requires `OPENAI_API_KEY`) |
| Wiki output | `wiki-app/docs/` | Generated markdown (Docusaurus) |
| Static site | `wiki-app/` | React/Docusaurus viewer |
| Schema | `AGENTS.md` | Human + LLM co-evolution |
| Drive-native app | `apps-script/src/` | Plain JavaScript `.gs` + HTML, all runtime data in Drive |

## Workflows

### Compile (Python)

```bash
cd compiler && python main.py --force
cd ../wiki-app && npm start
```

### Ingest (Cursor)

When the user says **ingest [filename]**:

1. Read `data/raw/[filename]` — do not edit raw files
2. Either run `python main.py --force` or manually update `wiki-app/docs/`
3. Ensure cross-links between entity, concept, and source pages
4. Update `wiki-app/docs/index.md` and add a log entry if using `wiki-app/docs/log.md`

### Query

1. Read `wiki-app/docs/index.md` first
2. Drill into relevant pages under `docs/entities/`, `docs/concepts/`, etc.
3. Cite pages as `/docs/path/to/page`

### Lint

Check for contradictions, orphan pages, missing index entries, broken wikilinks.

## Page format (Docusaurus)

```yaml
---
id: unique-id
title: Page Title
sidebar_label: Short label
slug: /path/to/page
tags:
  - tag
page_type: source | entity | concept | comparison | synthesis
---
```

Use `[[slug/path|Label]]` in body — the compiler's `linker.py` converts these to markdown links.

## Domain

Sample domain: **Aurora Labs** (fictional IoT startup). Replace with your topic when ready.

## Google Apps Script target

The independent Drive-native application lives in `apps-script/`. See its README and `documentation/43-google-apps-script.md` for deployment, file coverage and limits. Its `Core.gs` is portable JavaScript; the remaining `.gs` files adapt it to Google services. Local mode is the default; API compilation and chat are explicit opt-ins.

After changing this target, run `npm run check` and `npm test` in `apps-script/`. Run `npm run package` to regenerate the combined installation script, project-content JSON and ZIP. Tests simulate Google services; do not claim live deployment or API validation without actually performing them. Keep all UI strings in the paired English/German dictionaries in `Translations.html`. Do not change `data/raw/` as part of development.
