"""Extraction responsibilities for the compiler build."""
from __future__ import annotations

from rich.progress import Progress

from llm_client import LLMClient
from models import RAW_DIR, STATE_FILE
from pipeline_tracker import PipelineRun
from synthesizer import extract_topics_from_raw_files, load_state, scan_raw_file_changes

from .reporting import _make_progress_callback, _print_incremental_table, _progress_columns, console


def step_extract(
    chunks: list,
    llm: LLMClient,
    *,
    force: bool,
    extra_system_context: str = "",
    redact_pii: bool = False,
    exclude_prefixes: frozenset[str] | None = None,
    run: PipelineRun | None = None,
    step_name: str = "",
) -> dict:
    """Step 2: Extract topics, entities, and concepts from each chunk."""
    mode = "LLM"
    changes = scan_raw_file_changes(RAW_DIR, load_state(), force=force, exclude_prefixes=exclude_prefixes)
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
            run=run,
            step_name=step_name,
        )
        extractions = extract_topics_from_raw_files(
            llm=llm,
            raw_dir=RAW_DIR,
            force=force,
            on_progress=on_progress if total else None,
            extra_system_context=extra_system_context,
            redact_pii=redact_pii,
            exclude_prefixes=exclude_prefixes,
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
