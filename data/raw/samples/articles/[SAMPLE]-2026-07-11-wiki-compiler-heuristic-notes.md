# [SAMPLE] Wiki compiler — heuristic mode notes

**Context:** LLM Wiki pipeline test artifact  
**Tags:** wiki, compiler, karpathy pattern

## What heuristic mode does

- Reads all `.txt` and `.md` under `data/raw/`
- Extracts topics without LLM API key
- Generates Docusaurus pages under `wiki-app/docs/`
- Builds cross-links from entity mentions (Nova Widget, TeaBuddy, MeshSync, etc.)

## Test data layout

- `data/raw/samples/` — [SAMPLE] prefixed files
- `data/raw/dummy-test/` — [DUMMY TEST DATA] labeled files
- Original junk data from `generate_junk_data.py`

## Known ingest quirks

- Broken markdown exports test parser resilience
- Forum HTML scrapes lose nested content
- Email threads include wrong-thread noise

## Goal

40+ raw files → rich graph with contradictions surfaced (battery, herbal preset, read interval)
