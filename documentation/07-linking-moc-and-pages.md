# 07 — Linking, MOC, and Page Format

How drafts become linked wiki pages and how the table of contents is built.  
**Modules:** `linker.py`, `moc_generator.py`, `link_overrides.py`

## Topic index (`index.json`)

**Path:** `compiler/temp_output/index.json`

```json
{
  "topics": {
    "MeshSync": "meshsync.md",
    "Mira Chen": "mira-chen.md"
  }
}
```

- **Key:** Human-readable topic title (from draft `#` heading or front matter `title:`)
- **Value:** Filename only (flat, in `temp_output/` root)

Built by `build_topic_index()` (full) or `update_topic_index()` (incremental).

## Cross-linking (Step 5)

### Heuristic linking (`link_page_heuristic`)

1. Sort index titles by length (longest first) — avoids partial matches
2. Skip self-links (current page title / filename)
3. Walk content; skip regions inside existing `[...](...)` markdown links
4. Replace first plain-text occurrence of each title with `[Title](./filename.md)`
5. Case-insensitive match; word-boundary aware

### LLM linking (`link_page_with_llm`)

System prompt `LINKER_SYSTEM_PROMPT` in `linker.py`:

- Inject `[Topic Title](./filename.md)` using exact index entries
- Do not link the page's own title
- Do not modify existing links or code spans
- Do not change factual content

### Relink targets (incremental)

Pages are re-linked if:

- Draft was regenerated (`dirty_filenames`)
- Draft was removed (`removed_filenames`)
- Index entry added/updated/removed (`index_delta`)
- `--force` is set
- Page title appears in `link_overrides` connection sources

`_resolve_relink_targets()` also re-links pages that linked to removed filenames.

### Export wrap (`wrap_docusaurus_doc` / `_finalize_linked_doc`)

Final exported page front matter:

```yaml
---
id: meshsync
title: MeshSync
sidebar_label: MeshSync
slug: /meshsync
page_type: topic
---
```

Body passed through `sanitize_for_mdx()` to escape problematic `<` sequences from junk data.

### Wikilink syntax (manual / legacy)

In draft bodies, `[[slug/path|Label]]` can appear. `linker.py` converts these to standard markdown links during export.

## Link overrides

**Path:** `data/link_overrides.json`

```json
{
  "version": 1,
  "updated_at": "2026-05-31T19:33:29.220519+00:00",
  "connections": [
    {
      "id": "uuid",
      "source_topic": "MeshSync",
      "target_topic": "Battery",
      "rule": "require",
      "enabled": true,
      "note": "optional"
    }
  ]
}
```

| Rule | Behavior |
|------|----------|
| `require` | Linker ensures a markdown link from source topic page → target exists |
| `block` | Linker removes links from source → target |

Connections validated against `index.json` topic keys. Duplicates and self-links dropped.

**Edit via:**

- Direct JSON edit
- `PUT /api/knowledge-graph/overrides` (API still available; dedicated UI page was removed)

Applied during `link_and_export_pages()` via `apply_connection_overrides()`.

## Map of Content (MOC)

**Module:** `moc_generator.py`  
**Output:** `wiki-app/docs/index.md`

### Categorization

1. **Folder-based:** `entities/` → "Entities", `concepts/` → "Concepts", `sources/` → "Sources"
2. **Tag-based:** flat pages matched against `TAG_CATEGORY_RULES` (first highest-overlap wins)
3. **Fallback:** "Uncategorized"

Example tag rules:

- "Products & Hardware" — nova-widget, sensenode, hardware, firmware, …
- "Engineering & Protocols" — meshsync, battery, technical-decisions, …
- "Team & Organization" — people-related tags

### MOC front matter

```yaml
---
id: index
title: Wiki Map of Content
sidebar_label: Wiki Index
slug: /index
tags: [index, moc, wiki]
last_updated: "..."
---
```

Body starts with page count: `Auto-generated index of **N** pages...`

## Page types (`page_type`)

| Value | Meaning |
|-------|---------|
| `source` | Distilled from one raw file (legacy per-file path) |
| `entity` | Named thing — person, product, company |
| `concept` | Idea or technical topic |
| `synthesis` | Topic merged from multiple chunks |
| `comparison` | Side-by-side analysis |
| `topic` | Default for current flat topic pages from linker export |

## AGENTS.md page format spec

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

## Dead links

`dead_link_checker.py` + `analytics.py`:

- Scans `[text](./href.md)` in exported pages
- Resolves relative paths against `wiki-app/docs/`
- Reports broken targets in `/api/analytics` and Analytics dashboard

## fix_frontmatter.py

Repairs YAML scalar fields that break Docusaurus parsing:

- Fields: `title`, `sidebar_label`, `id`, `slug`, `last_updated`, `page_type`
- Re-quotes values via `yaml_quote()` when needed
- Flags: `--dry-run`, `--docs-dir PATH`

Run after manual edits or if build warns on front matter.

## Next

- [08-llm-and-heuristics.md](./08-llm-and-heuristics.md)
- [10-data-layout-and-state.md](./10-data-layout-and-state.md)
