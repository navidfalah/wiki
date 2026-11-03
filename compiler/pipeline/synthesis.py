"""Synthesis responsibilities for the compiler build."""
from __future__ import annotations

from rich.progress import Progress

import web_search
from llm_client import LLMClient
from pipeline_tracker import PipelineRun
from synthesizer import (
    TEMP_OUTPUT_DIR,
    cleanup_stale_drafts,
    group_chunks_by_topic,
    slugify,
    synthesize_topic_wiki_pages,
    topics_affected_by_sources,
)

from .reporting import _make_progress_callback, _progress_columns, console


def step_synthesize(
    extractions: dict,
    llm: LLMClient,
    *,
    force: bool,
    apply_critic: bool = False,
    extra_system_context: str = "",
    critic_samples: int = 1,
    critic_regenerate: bool = False,
    web_search_enabled: bool = False,
    web_search_max_results: int = web_search.DEFAULT_MAX_RESULTS,
    web_search_max_topics: int = web_search.DEFAULT_MAX_TOPICS,
    web_search_provider: str | None = None,
    web_search_api_key: str | None = None,
    run: PipelineRun | None = None,
    step_name: str = "",
) -> dict:
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

    web_added = 0
    if web_search_enabled:
        # Only enrich topics that are actually being (re)generated this run
        # -- an incremental build with no local changes stays offline, and
        # a --force run enriches everything, bounded by max_topics either way.
        search_topics = list(grouped.keys()) if dirty_topics is None else sorted(dirty_topics)
        web_added = web_search.augment_grouped_with_web_results(
            grouped,
            search_topics,
            max_results=web_search_max_results,
            max_topics=web_search_max_topics,
            provider=web_search_provider,
            api_key=web_search_api_key,
        )
        if web_added:
            console.print(
                f"[cyan]Web search:[/] added [bold]{web_added}[/] web-sourced chunk(s) across "
                f"up to [bold]{min(len(search_topics), web_search_max_topics)}[/] topic(s)"
            )

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
            run=run,
            step_name=step_name,
        )
        written, skipped = synthesize_topic_wiki_pages(
            grouped,
            llm=llm,
            output_dir=TEMP_OUTPUT_DIR,
            dirty_topics=dirty_topics,
            on_progress=on_progress if regen_count else None,
            apply_critic=apply_critic,
            extra_system_context=extra_system_context,
            critic_samples=critic_samples,
            critic_regenerate=critic_regenerate,
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
        "skipped_count": len(skipped),
        "web_added": web_added,
    }
