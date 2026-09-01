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

### A critical bug, found and fixed

`link_and_export_pages()` had a variable-shadowing bug: `index` held the
real topic index dict, but `for index, draft_path in enumerate(to_link, ...)`
silently rebound it to the loop counter for the rest of the function, so
`link_page_with_llm()` received an integer instead of the actual
title→filename mapping — on every page, every compile, since this code was
written. Confirmed directly: with the bug present, the real prompt sent to
the model read `Topic index (title → filename):\n1` — a bare digit, not
JSON. No existing test caught it because the only test exercising this
function used a `FakeLLM` that echoes the page back without ever looking at
what was in the prompt. Fixed by renaming the loop variable; a new
regression test
(`test_link_and_export_pages_sends_the_real_topic_index_to_the_llm`)
inspects the actual prompt content and was verified to fail against the
bug and pass against the fix.

### Mechanical linking (`mechanical_linker.py`, new)

A regex-based pre-pass (`auto_link_exact_titles`) similar in shape to a
`link_page_heuristic` function that used to exist here and was
**deliberately removed** in an earlier refactor (commit `09a7f31`) —
important precedent, addressed directly rather than quietly reintroduced.
That removal eliminated an entire parallel *no-LLM compile mode*
(extraction, synthesis, **and** linking, all duplicated as heuristic
fallbacks) in favor of "the compiler is LLM-only." This module is not that
mode coming back: the LLM is still mandatory (`link_and_export_pages()`
still calls `require_llm()` and still runs `link_page_with_llm()` on every
page, unconditionally), and extraction/synthesis are untouched. What's new
is narrower — a deterministic pass that runs *before* the LLM call, so
every unambiguous, exact-title mention gets linked as a guaranteed floor,
and the LLM only has to find what this pass structurally can't
(paraphrased or indirect references). See `mechanical_linker.py`'s module
docstring for the full reasoning and `tests/test_mechanical_linker.py` for
the mechanism tests (word-boundary matching, code-fence/heading/existing-link
protection, longest-title-first preference, idempotency).

**Real, measured impact** (run against the 174 pages already compiled
under `wiki-app/docs/`, using their own titles as the topic index): 126 of
174 pages (72%) had at least one exact-title mention of another page that
was never linked; 789 such mentions total across the corpus. That gap is
the direct, measurable consequence of the shadowing bug above — the LLM
pass was working from a broken index the whole time.

### Alias-aware mechanical linking (`build_alias_topic_index`)

`auto_link_exact_titles()` only ever does exact-string matching — it can
link a page's own title ("Nova Widget") but not a bare mention someone
actually writes in prose ("Mira" instead of "Mira Chen"). Exact-title
matching alone is a floor, not the ceiling this pass could be.

`build_alias_topic_index(topic_index, mentions)` closes that gap using
infrastructure that already existed but wasn't wired into linking:
`entity_resolution.py`'s heuristic tier (task #6) clusters mention strings
into the same entity — "Mira" and "Mira Chen" merge via its subset-of-
tokens rule — and every alias in a cluster that touches a real topic title
gets added to the index the mechanical pass uses, pointing at that title's
file. Heuristic tier only (no `embed_fn`/`llm` passed to
`resolve_entities()`) — fully offline and deterministic, same property as
the rest of this module; a mention needing the embedding or LLM tier to
resolve is left alone rather than guessed at, and
`entity_resolution.py`'s own hard-negative design (Alex Kim vs. Alex
Rivera share a token but are different people) keeps this conservative by
construction. An alias never overrides a real topic_index entry for the
same string — exact titles always win.

`mentions_from_extractions(extractions)` builds the `Mention` list from
`main.py`'s existing extraction payload (every entity name each raw
chunk's extraction step found, attributed to its source file) — `main.py`
already has `extractions` in scope when it calls `step_link()`, so this
is threaded through as an optional parameter, not a new pipeline stage.
The alias-expanded index is used **only** for the mechanical pre-pass —
`link_page_with_llm()` still receives the real, unexpanded `topic_index`,
so this doesn't change what the (already-fixed) LLM prompt looks like.

### LLM linking (`link_page_with_llm`)

System prompt `LINKER_SYSTEM_PROMPT` in `linker.py`:

- Inject `[Topic Title](./filename.md)` using exact index entries
- Do not link the page's own title
- Do not modify existing links or code spans
- Do not change factual content

Runs after the mechanical pass above, on link_source that pass has already
partially linked — its job is now catching what the mechanical pass
structurally cannot (paraphrases, indirect references), not carrying the
entire cross-linking burden alone.

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
