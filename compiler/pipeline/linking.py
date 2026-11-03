"""Linking responsibilities for the compiler build."""
from __future__ import annotations

from collections.abc import Callable
from pathlib import Path

from rich.progress import Progress

from linker import IndexDelta, link_and_export_pages
from llm_client import LLMClient
from models import OUTPUT_DIR
from pipeline_tracker import PipelineRun
from synthesizer import TEMP_OUTPUT_DIR

from .reporting import _make_progress_callback, _progress_columns, console


def step_link(
    topic_index: dict,
    index_delta: IndexDelta,
    llm: LLMClient,
    *,
    written_filenames: set[str],
    removed_filenames: set[str],
    force: bool,
    extractions: dict | None = None,
    run: PipelineRun | None = None,
    step_name: str = "",
    resolve_entities_llm: bool = False,
) -> list[Path]:
    """Step 5: Incrementally inject links and export affected pages.

    Extra extraction/model arguments remain accepted for caller compatibility;
    exact topic titles and explicit connection overrides determine links.
    """
    mode = "Python"

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
                    run=run,
                    step_name=step_name,
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
            resolve_entities_llm=resolve_entities_llm,
        )

    console.print(
        f"[green]✓[/] Linked [bold]{len(written)}[/] pages, "
        f"skipped [bold]{len(skipped)}[/] unchanged → {OUTPUT_DIR}"
    )
    return written
