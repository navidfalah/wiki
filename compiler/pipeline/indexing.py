"""Indexing responsibilities for the compiler build."""
from __future__ import annotations

from rich.table import Table

from linker import IndexDelta, update_topic_index
from synthesizer import TEMP_OUTPUT_DIR

from .reporting import console


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
