# 14 — Workflows

Day-to-day tasks for humans and Cursor agents.

## Compile

**When:** After adding or editing raw files, or to refresh the wiki.

```bash
cd compiler && source .venv/bin/activate
python main.py              # incremental
python main.py --force      # full rebuild
```

Then browse:

```bash
cd wiki-app && npm start
# → http://localhost:3000/docs/index
```

Or trigger from Dashboard (`/workspace`) if API is running.

## Add new knowledge (manual)

1. Create `data/raw/{any-subfolder}/my-note.md`
2. Write plain markdown or text — headers and `**bold**` help heuristics
3. `python main.py`
4. Find new topic pages in `wiki-app/docs/` or via MOC

No filename convention required. Subfolder is for your organization only.

## Ingest (Cursor agent)

When you say **"ingest [filename]"** (per `AGENTS.md`):

1. Read `data/raw/[filename]` — do not edit raw unless explicitly adding new source
2. Run `python main.py --force` OR manually update `wiki-app/docs/`
3. Ensure cross-links between related pages
4. Update `wiki-app/docs/index.md` if MOC not regenerated
5. Add log entry to `wiki-app/docs/log.md` if that file is in use

## Query (agent or human)

1. Read `wiki-app/docs/index.md` first (Map of Content)
2. Drill into `docs/entities/`, `docs/concepts/`, flat topic pages
3. Cite pages as `/docs/path/to/page` (Docusaurus route)

## Lint

Check for:

| Issue | How |
|-------|-----|
| Broken wikilinks | `/analytics` dead-link report or `GET /api/analytics` |
| Orphan pages | Pages not listed in `index.md` |
| Missing index entries | Compare `wiki-app/docs/*.md` count vs MOC |
| Contradictions | Cross-read entity/concept pages (sample data has intentional conflicts) |
| Structural quality | `python reviewer.py` (LLM, needs API key) |

## Eval regression gate

`cd compiler && python eval_gate.py` runs every eval that needs no API key.
Those are BM25 retrieval, heuristic entity resolution, trust propagation,
PII redaction, the temporal model, extractive-answer faithfulness, and
groundedness of the compiled pages. It compares each result with
`compiler/eval_baseline.json`.

CI fails when either of these happens:

- A score drops by more than the tolerance. The default is 0.02.
  `groundedness.supported_rate` allows 0.10, because it is measured over the
  committed wiki pages and those change on every recompile.
- A count falls below its floor, for example `groundedness.pages`. That
  means an eval quietly ran on nothing.

When a change legitimately moves the numbers (a better tokenizer, a
recompiled wiki, new eval fixtures), accept them explicitly and commit the
diff with the change:

```bash
python eval_gate.py --update-baseline
```

## Regenerate test data

```bash
cd compiler
python scripts/build_sample_corpus.py --clean   # the sample corpus (doc 09)
python main.py --force                          # needs an LLM; or seed pages without one:
# python scripts/seed_pages.py && python moc_generator.py
```

## Fix front matter

After manual edits break YAML:

```bash
cd compiler
python fix_frontmatter.py --dry-run   # preview
python fix_frontmatter.py             # apply
```

Or recompile with `--force`.

## Edit link overrides (manual)

Edit `data/link_overrides.json` or `PUT /api/knowledge-graph/overrides`. Re-run compiler so linker applies rules.

## Replace sample domain with your own

1. Delete or archive `data/raw/` contents (keep `.gitkeep` if present)
2. Add your `.txt`/`.md` files
3. Delete `data/state.json` (optional — forces clean state)
4. `python main.py --force`
5. Update `wiki-app/docusaurus.config.js` title/tagline if desired

## Production build workflow

```bash
./build_wiki.sh --force
cd wiki-app && npm run serve
```

## Agent constraints (`AGENTS.md`)

| Path | Agent should |
|------|--------------|
| `data/raw/` | Read; rarely write |
| `wiki-app/docs/` | Regenerate via compile or deliberate refine |
| `AGENTS.md` | Co-evolve with human when workflows change |

## Next

- [16-troubleshooting.md](./16-troubleshooting.md)
- [../AGENTS.md](../AGENTS.md)
