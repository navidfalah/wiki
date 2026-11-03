"""Reporting responsibilities for the compiler build."""
from __future__ import annotations

import sys
from collections.abc import Callable

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

from llm_client import LLMClient
from pipeline_tracker import PipelineRun

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
    run: PipelineRun | None = None,
    step_name: str = "",
    recent_window: int = 20,
) -> Callable[[int, int, str], None]:
    """Update Rich progress bar and print plain lines for dashboard/SSE logs.

    When ``run``/``step_name`` are given, also persists a small rolling
    window of the most recent items processed (e.g. "42/91:
    notes/meeting.md") onto that step in the pipeline run record -- see
    PipelineRun.update_step_progress -- so the Pipelines/Dashboard UI can
    show what a long-running step is actually doing instead of just
    "running" with no detail. Persisted every ``log_every`` calls (same
    cadence as the console log line) plus always on the final call, so a
    step with hundreds of items doesn't do a disk write per item.
    """
    recent: list[str] = []

    def on_progress(current: int, total: int, detail: str) -> None:
        pct = (100.0 * current / total) if total else 0.0
        short = detail if len(detail) <= 72 else f"…{detail[-69:]}"
        progress.update(
            task_id,
            completed=current,
            total=max(total, 1),
            description=f"{label} [dim]{short}[/]",
        )
        is_log_tick = current == 1 or current == total or current % log_every == 0
        if is_log_tick:
            console.print(
                f"[cyan]{label}[/] {current}/{total} ({pct:.1f}%) — {detail}",
                soft_wrap=True,
            )
            sys.stdout.flush()
        if run is not None and step_name:
            recent.append(detail)
            del recent[:-recent_window]
            if is_log_tick:
                run.update_step_progress(step_name, current=current, total=total, recent=list(recent))

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

def _print_token_usage_table(llm: LLMClient) -> None:
    """Print per-step, per-model token usage collected on llm.usage_log."""
    summary = llm.usage_summary()
    if not summary:
        return

    table = Table(title="Token usage by step & model", show_header=True, header_style="bold magenta")
    table.add_column("Step", style="cyan")
    table.add_column("Model", style="green")
    table.add_column("Calls", justify="right")
    table.add_column("Cache hits", justify="right")
    table.add_column("Prompt tokens", justify="right")
    table.add_column("Completion tokens", justify="right")
    table.add_column("Total tokens", justify="right", style="bold")

    grand_total = 0
    for row in sorted(summary, key=lambda r: (r["step"], r["model"])):
        table.add_row(
            row["step"],
            row["model"],
            str(row["calls"]),
            str(row["cache_hits"]),
            f"{row['prompt_tokens']:,}",
            f"{row['completion_tokens']:,}",
            f"{row['total_tokens']:,}",
        )
        grand_total += row["total_tokens"]

    table.add_section()
    table.add_row("", "", "", "", "", "[bold]Grand total[/]", f"[bold]{grand_total:,}[/]")
    console.print(table)
