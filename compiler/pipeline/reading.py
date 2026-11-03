"""Reading responsibilities for the compiler build."""
from __future__ import annotations

from rich.progress import BarColumn, Progress, SpinnerColumn, TextColumn, TimeElapsedColumn
from rich.table import Table

from llm_client import LLMClient
from models import RAW_DIR
from synthesizer import compute_file_md5, discover_raw_source_files, read_raw_chunks

from .reporting import console


def step_read_data(llm: LLMClient, *, exclude_prefixes: frozenset[str] | None = None) -> list:
    """Step 1: Read all raw source files (text/email/image/audio/file) and split into chunks."""
    raw_files = discover_raw_source_files(RAW_DIR, exclude_prefixes=exclude_prefixes)
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
        chunks = read_raw_chunks(RAW_DIR, llm, exclude_prefixes=exclude_prefixes)
        progress.update(task, completed=len(raw_files))

    console.print(f"[green]✓[/] Read [bold]{len(raw_files)}[/] files → [bold]{len(chunks)}[/] chunks")
    return chunks
