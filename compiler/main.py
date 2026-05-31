#!/usr/bin/env python3
"""LLM Wiki compiler — orchestrates raw ingest, synthesis, linking, and output."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from linker import inject_cross_links, to_docusaurus_markdown
from llm_client import LLMClient
from models import OUTPUT_DIR, RAW_DIR, STATE_FILE, WikiPage
from synthesizer import (
    build_index,
    build_overview,
    merge_pages,
    synthesize_file,
)


def discover_raw_files() -> list[Path]:
    return sorted(RAW_DIR.rglob("*.md"))


def load_state() -> dict:
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    return {"processed": {}, "runs": []}


def save_state(state: dict) -> None:
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(json.dumps(state, indent=2), encoding="utf-8")


def write_pages(pages: list[WikiPage], output_dir: Path) -> int:
    output_dir.mkdir(parents=True, exist_ok=True)
    written = 0
    for page in pages:
        target = output_dir / page.relative_path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(to_docusaurus_markdown(page), encoding="utf-8")
        written += 1
    return written


def run_pipeline(*, force: bool = False, use_llm: bool = True) -> int:
    raw_files = discover_raw_files()
    if not raw_files:
        print(f"No markdown files found under {RAW_DIR}", file=sys.stderr)
        return 1

    llm = LLMClient() if use_llm else LLMClient(api_key="")
    mode = "llm" if llm.available else "heuristic"
    print(f"Compiler mode: {mode} ({len(raw_files)} raw files)")

    state = load_state()
    all_pages: list[WikiPage] = []

    for raw_path in raw_files:
        rel = str(raw_path.relative_to(RAW_DIR))
        mtime = raw_path.stat().st_mtime
        prev = state["processed"].get(rel)
        unchanged = prev and prev.get("mtime") == mtime

        if unchanged and not force:
            print(f"  ingest (cached): {rel}")
        else:
            print(f"  ingest: {rel}")

        pages = synthesize_file(raw_path, llm if use_llm else None)
        all_pages.extend(pages)
        state["processed"][rel] = {
            "mtime": mtime,
            "pages": [p.slug for p in pages],
            "at": datetime.now(timezone.utc).isoformat(),
        }

    merged = merge_pages(all_pages)
    merged.append(build_overview(merged))
    merged.append(build_index(merged))
    linked = inject_cross_links(merged)

    count = write_pages(linked, OUTPUT_DIR)
    state["runs"].append(
        {
            "at": datetime.now(timezone.utc).isoformat(),
            "mode": mode,
            "pages_written": count,
        }
    )
    save_state(state)

    print(f"Done — wrote {count} pages to {OUTPUT_DIR}")
    return 0


def main() -> None:
    parser = argparse.ArgumentParser(description="Compile raw markdown into wiki-app/docs/")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Recompile all raw files even if unchanged",
    )
    parser.add_argument(
        "--heuristic-only",
        action="store_true",
        help="Skip LLM even when OPENAI_API_KEY is set",
    )
    args = parser.parse_args()
    raise SystemExit(
        run_pipeline(force=args.force, use_llm=not args.heuristic_only)
    )


if __name__ == "__main__":
    main()
