#!/usr/bin/env python3
"""LLM Wiki compiler — orchestrates the full build pipeline."""

from __future__ import annotations

import argparse
import sys
import time
from collections.abc import Callable
from pathlib import Path

from rich.console import Console
from rich.panel import Panel
from rich.progress import (
    BarColumn,
    MofNCompleteColumn,
    Progress,
    SpinnerColumn,
    TaskProgressColumn,
    TextColumn,
    TimeElapsedColumn,
    TimeRemainingColumn,
)
from rich.table import Table
from rich.text import Text

from linker import (
    IndexDelta,
    link_and_export_pages,
    update_topic_index,
)
from moc_generator import generate_moc
from llm_client import LLMClient, require_llm
from models import OUTPUT_DIR, RAW_DIR, STATE_FILE
from synthesizer import (
    TEMP_OUTPUT_DIR,
    compute_file_md5,
    discover_raw_text_files,
    extract_topics_from_raw_files,
    group_chunks_by_topic,
    read_raw_chunks,
    scan_raw_file_changes,
    slugify,
    synthesize_topic_wiki_pages,
    topics_affected_by_sources,
    cleanup_stale_drafts,
    load_state,
)

console = Console()


def _progress_columns() -> list:
    return [
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(bar_width=32),
        TaskProgressColumn(),
        MofNCompleteColumn(),
        TimeElapsedColumn(),
        TimeRemainingColumn(),
    ]


def _make_progress_callback(
    progress: Progress,
    task_id: int,
    *,
    label: str,
    log_every: int = 1,
) -> Callable[[int, int, str], None]:
    """Update Rich progress bar and print plain lines for dashboard/SSE logs."""

    def on_progress(current: int, total: int, detail: str) -> None:
        pct = (100.0 * current / total) if total else 0.0
        short = detail if len(detail) <= 72 else f"…{detail[-69:]}"
        progress.update(
            task_id,
            completed=current,
            total=max(total, 1),
            description=f"{label} [dim]{short}[/]",
        )
        if current == 1 or current == total or current % log_every == 0:
            console.print(
                f"[cyan]{label}[/] {current}/{total} ({pct:.1f}%) — {detail}",
                soft_wrap=True,
            )
            sys.stdout.flush()

    return on_progress


def _step_banner(step: int, total: int, title: str, detail: str) -> None:
    console.print(
        Panel(
            Text(detail, style="dim"),
            title=f"[bold cyan]Step {step}/{total}[/] — {title}",
            border_style="cyan",
        )
    )


def _print_incremental_table(incremental: dict) -> None:
    table = Table(title="Incremental status", show_header=True, header_style="bold magenta")
    table.add_column("Status", style="cyan")
    table.add_column("Files", style="green")

    for label, key in [
        ("New", "new"),
        ("Modified", "modified"),
        ("Deleted", "deleted"),
        ("Skipped (unchanged)", "unchanged"),
    ]:
        files = incremental.get(key, [])
        if files:
            table.add_row(label, ", ".join(files[:5]) + (f" (+{len(files)-5})" if len(files) > 5 else ""))
        else:
            table.add_row(label, "—")

    console.print(table)


def step_read_data() -> list:
    """Step 1: Read all raw text files and split into chunks."""
    raw_files = discover_raw_text_files(RAW_DIR)
    if not raw_files:
        console.print(f"[red]No raw files found under[/] {RAW_DIR}")
        return []

    table = Table(title="Raw sources", show_header=True, header_style="bold magenta")
    table.add_column("File", style="green")
    table.add_column("MD5", style="dim")
    table.add_column("Size", justify="right")

    for path in raw_files:
        rel = path.relative_to(RAW_DIR)
        size_kb = path.stat().st_size / 1024
        table.add_row(str(rel), compute_file_md5(path)[:12] + "…", f"{size_kb:.1f} KB")

    console.print(table)

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        TimeElapsedColumn(),
        console=console,
    ) as progress:
        task = progress.add_task("Reading and chunking files…", total=len(raw_files))
        chunks = read_raw_chunks(RAW_DIR)
        progress.update(task, completed=len(raw_files))

    console.print(f"[green]✓[/] Read [bold]{len(raw_files)}[/] files → [bold]{len(chunks)}[/] chunks")
    return chunks


def step_extract(chunks: list, llm: LLMClient, *, force: bool) -> dict:
    """Step 2: Extract topics, entities, and concepts from each chunk."""
    mode = "LLM"
    changes = scan_raw_file_changes(RAW_DIR, load_state(), force=force)
    total = len(changes.to_process)

    if not force and not changes.has_changes:
        console.print("[yellow]No raw file changes detected — using cached extractions[/]")

    with Progress(
        *_progress_columns(),
        console=console,
        refresh_per_second=4,
    ) as progress:
        task = progress.add_task(
            f"Extracting topics via {mode} ({total} files, {len(changes.unchanged)} cached)…",
            total=max(total, 1),
        )
        on_progress = _make_progress_callback(
            progress,
            task,
            label="Extract",
            log_every=5 if total > 50 else 1,
        )
        extractions = extract_topics_from_raw_files(
            llm=llm,
            raw_dir=RAW_DIR,
            force=force,
            on_progress=on_progress if total else None,
        )
        if total:
            progress.update(task, completed=total)

    incremental = extractions.get("incremental", {})
    _print_incremental_table(incremental)

    topic_total = sum(
        len(c.get("topics", []))
        for f in extractions.get("files", [])
        for c in f.get("chunks", [])
    )
    console.print(
        f"[green]✓[/] Extracted [bold]{extractions['chunk_count']}[/] chunks "
        f"([bold]{topic_total}[/] topic tags) · state → {STATE_FILE}"
    )
    return extractions


def step_synthesize(extractions: dict, llm: LLMClient, *, force: bool) -> dict:
    """Step 3: Group by topic and write draft wiki pages to temp_output/."""
    grouped = group_chunks_by_topic(extractions)
    TEMP_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    mode = "LLM"
    incremental = extractions.get("incremental", {})
    changed_sources = set(
        incremental.get("new", [])
        + incremental.get("modified", [])
        + incremental.get("deleted", [])
    )

    if force:
        dirty_topics = None
    elif changed_sources:
        dirty_topics = topics_affected_by_sources(grouped, changed_sources)
    else:
        dirty_topics = set()

    removed_drafts = cleanup_stale_drafts(grouped, TEMP_OUTPUT_DIR)
    removed_filenames = {p.name for p in removed_drafts}

    if dirty_topics is None:
        regen_count = len(grouped)
    else:
        regen_count = 0
        for topic in grouped:
            slug = slugify(topic) or "untitled-topic"
            out_path = TEMP_OUTPUT_DIR / f"{slug}.md"
            if topic not in dirty_topics and out_path.exists():
                continue
            regen_count += 1

    with Progress(
        *_progress_columns(),
        console=console,
        refresh_per_second=4,
    ) as progress:
        task = progress.add_task(
            f"Synthesizing wiki drafts ({mode})…",
            total=max(regen_count, 1),
        )
        on_progress = _make_progress_callback(
            progress,
            task,
            label="Synthesize",
            log_every=3 if regen_count > 30 else 1,
        )
        written, skipped = synthesize_topic_wiki_pages(
            grouped,
            llm=llm,
            output_dir=TEMP_OUTPUT_DIR,
            dirty_topics=dirty_topics,
            on_progress=on_progress if regen_count else None,
        )
        if regen_count:
            progress.update(task, completed=regen_count)

    written_filenames = {p.name for p in written}
    console.print(
        f"[green]✓[/] Wrote [bold]{len(written)}[/] drafts, "
        f"skipped [bold]{len(skipped)}[/] unchanged → {TEMP_OUTPUT_DIR}"
    )
    return {
        "grouped": grouped,
        "written_filenames": written_filenames,
        "removed_filenames": removed_filenames,
        "dirty_topics": dirty_topics,
    }


def step_index(
    *,
    written_filenames: set[str],
    removed_filenames: set[str],
    force: bool,
) -> tuple[dict, IndexDelta]:
    """Step 4: Incrementally update index.json for changed drafts only."""
    topic_index, index_delta = update_topic_index(
        TEMP_OUTPUT_DIR,
        dirty_filenames=written_filenames,
        removed_filenames=removed_filenames,
        force=force,
    )

    table = Table(title="Topic index (preview)", show_header=True, header_style="bold magenta")
    table.add_column("Topic", style="cyan", max_width=50)
    table.add_column("Filename", style="green")
    table.add_column("Status", style="yellow")

    for title, filename in sorted(index_delta.added.items(), key=lambda x: x[0].lower())[:4]:
        table.add_row(title, filename, "added")
    for title, filename in sorted(index_delta.updated.items(), key=lambda x: x[0].lower())[:4]:
        table.add_row(title, filename, "updated")
    for title, filename in sorted(index_delta.removed.items(), key=lambda x: x[0].lower())[:4]:
        table.add_row(title, filename, "removed")

    if not index_delta.has_changes:
        for title, filename in sorted(topic_index.items(), key=lambda x: x[0].lower())[:4]:
            table.add_row(title, filename, "unchanged")
        if len(topic_index) > 4:
            table.add_row("…", f"+ {len(topic_index) - 4} more", "unchanged")
    elif (
        len(index_delta.added) + len(index_delta.updated) + len(index_delta.removed) > 4
    ):
        table.add_row("…", "see index.json", "")

    console.print(table)
    console.print(
        f"[green]✓[/] Index: [bold]{len(index_delta.added)}[/] added, "
        f"[bold]{len(index_delta.updated)}[/] updated, "
        f"[bold]{len(index_delta.removed)}[/] removed → {TEMP_OUTPUT_DIR / 'index.json'}"
    )
    return topic_index, index_delta


def step_link(
    topic_index: dict,
    index_delta: IndexDelta,
    llm: LLMClient,
    *,
    written_filenames: set[str],
    removed_filenames: set[str],
    force: bool,
) -> list[Path]:
    """Step 5: Incrementally inject links and export affected pages."""
    mode = "LLM"

    with Progress(
        *_progress_columns(),
        console=console,
        refresh_per_second=4,
    ) as progress:
        task = progress.add_task(f"Cross-linking pages ({mode})…", total=1)
        log_cb: dict[str, Callable[[int, int, str], None] | None] = {"fn": None}

        def on_progress(current: int, total: int, detail: str) -> None:
            if log_cb["fn"] is None:
                progress.update(task, total=max(total, 1))
                log_cb["fn"] = _make_progress_callback(
                    progress,
                    task,
                    label="Link",
                    log_every=5 if total > 40 else 1,
                )
            assert log_cb["fn"] is not None
            log_cb["fn"](current, total, detail)

        written, skipped = link_and_export_pages(
            topic_index,
            temp_dir=TEMP_OUTPUT_DIR,
            output_dir=OUTPUT_DIR,
            llm=llm,
            dirty_filenames=written_filenames,
            removed_filenames=removed_filenames,
            index_delta=index_delta,
            force=force,
            on_progress=on_progress,
        )

    console.print(
        f"[green]✓[/] Linked [bold]{len(written)}[/] pages, "
        f"skipped [bold]{len(skipped)}[/] unchanged → {OUTPUT_DIR}"
    )
    return written


def run_pipeline(*, force: bool = False) -> int:
    """Run the full compiler pipeline sequentially."""
    start = time.perf_counter()
    try:
        llm = require_llm()
    except RuntimeError as exc:
        console.print(f"[red]Error:[/] {exc}")
        return 1
    mode_label = "LLM + cache"

    console.print(
        Panel.fit(
            "[bold]LLM Wiki Compiler[/]\n"
            f"Raw dir: [dim]{RAW_DIR}[/]\n"
            f"Output:  [dim]{OUTPUT_DIR}[/]\n"
            f"State:   [dim]{STATE_FILE}[/]\n"
            f"Mode:    [yellow]{mode_label}[/]"
            + (" [red](force rebuild)[/]" if force else ""),
            border_style="blue",
        )
    )

    _step_banner(1, 5, "Data Reading", "Scan data/raw/ and split files into text chunks")
    chunks = step_read_data()
    if not chunks:
        return 1

    _step_banner(2, 5, "Extraction", "Extract topics — skip unchanged files via MD5 state")
    extractions = step_extract(chunks, llm, force=force)

    _step_banner(3, 5, "Synthesis", "Regenerate only topic pages affected by changed files")
    synth_result = step_synthesize(extractions, llm, force=force)

    _step_banner(4, 5, "Indexing", "Incrementally update index.json for changed drafts")
    topic_index, index_delta = step_index(
        written_filenames=synth_result["written_filenames"],
        removed_filenames=synth_result["removed_filenames"],
        force=force,
    )

    _step_banner(5, 5, "Cross-linking", "Re-link only affected pages → wiki-app/docs/")
    written = step_link(
        topic_index,
        index_delta,
        llm,
        written_filenames=synth_result["written_filenames"],
        removed_filenames=synth_result["removed_filenames"],
        force=force,
    )

    console.print("[bold cyan]Map of Content[/] — generating hierarchical index.md")
    moc_result = generate_moc(OUTPUT_DIR)
    console.print(
        f"[green]✓[/] MOC index: [bold]{moc_result['page_count']}[/] pages in "
        f"[bold]{moc_result['category_count']}[/] categories → {moc_result['output']}"
    )

    elapsed = time.perf_counter() - start
    inc = extractions.get("incremental", {})
    console.print(
        Panel.fit(
            f"[bold green]Build complete[/] in {elapsed:.1f}s\n"
            f"  Processed: {inc.get('processed', 0)} files\n"
            f"  Skipped:   {inc.get('skipped', 0)} unchanged files\n"
            f"  Drafts:    {TEMP_OUTPUT_DIR}\n"
            f"  Docs:      {OUTPUT_DIR}\n"
            f"  Linked:    {len(written)} pages\n"
            f"  Skipped:   {inc.get('skipped', 0)} unchanged raw files",
            border_style="green",
        )
    )
    return 0


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Run the full LLM Wiki compiler pipeline"
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Reprocess all raw files regardless of MD5 hashes in state.json",
    )
    args = parser.parse_args()
    raise SystemExit(run_pipeline(force=args.force))


if __name__ == "__main__":
    main()
