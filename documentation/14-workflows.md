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

## Regenerate test data

```bash
cd compiler
python generate_junk_data.py --overwrite
python generate_bulk_dummy_data.py --overwrite
python generate_extended_dummy_data.py --overwrite
python generate_varied_dummy_data.py --overwrite
python main.py --force
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
