# First 10 Cursor Prompts

Updated for the **llm-wiki-project** layout (`data/raw/` → `compiler/` → `wiki-app/docs/`).

---

## Prompt 1 — Orient

```
Read README.md, AGENTS.md, and compiler/main.py. Explain the three-layer
architecture (data/raw, compiler, wiki-app) and how the pipeline flows.
Do not change files yet.
```

---

## Prompt 2 — Run the compiler

```
cd compiler, set up the venv if needed, and run python main.py --force.
Show me how many pages were written to wiki-app/docs/ and list the top-level
folders created.
```

---

## Prompt 3 — Ingest a new raw file

```
Create a new raw file at data/raw/meetings/2026-10-01-board-minutes.md about
the cooperative's October board meeting (make up plausible data consistent
with documentation/18-sample-domain.md). Then run the compiler so it appears
in wiki-app/docs/. Add cross-links to the existing Sonnendach Lindenhof and
Battery storage pages.
```

---

## Prompt 4 — Improve LLM synthesis

```
Review compiler/synthesizer.py. Improve the SYSTEM_PROMPT so the LLM extracts
contradictions, comparison tables, and richer entity descriptions. Keep
heuristic fallback working when no API key is set.
```

---

## Prompt 5 — Query the compiled wiki

```
Read wiki-app/docs/index.md and answer: How big is the Sonnendach Lindenhof
battery, and where do sources disagree? Cite specific doc paths.
```

---

## Prompt 6 — Enhance cross-linking

```
Improve compiler/linker.py to avoid double-linking already-linked text and
to support aliases (e.g. "NL-430" → solar-modules). Run
main.py --force and show a before/after example.
```

---

## Prompt 7 — Docusaurus polish

```
Update wiki-app/docusaurus.config.js and sidebars.js: add a tag filter or
better navbar categories. Ensure all generated doc folders appear in the sidebar.
```

---

## Prompt 8 — Lint workflow

```
Add compiler/linter.py that scans wiki-app/docs/ for orphan pages (no inbound
links), missing index entries, and contradictions flagged with "Contradiction".
Wire it into main.py as `python main.py --lint`.
```

---

## Prompt 9 — Repurpose for your domain

```
Replace the sample cooperative with [YOUR TOPIC] in data/raw/ sample files, README,
and docusaurus.config.js title. Suggest 5 entity types and 5 concept types
for my domain. Re-run the compiler.
```

---

## Prompt 10 — Deploy static site

```
Add a GitHub Actions workflow that runs the compiler and builds wiki-app
with npm run build, uploading the Docusaurus build artifact. Document deploy
steps in README.md.
```
