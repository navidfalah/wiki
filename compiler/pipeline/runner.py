"""Runner responsibilities for the compiler build."""
from __future__ import annotations

import os
import time
import traceback
from typing import Any

from rich.panel import Panel

import active_learning
import web_search
from llm_client import LLMClient, require_llm
from moc_generator import generate_moc
from models import OUTPUT_DIR, RAW_DIR, STATE_FILE
from pipeline_tracker import PipelineRun
from synthesizer import TEMP_OUTPUT_DIR

from .extraction import step_extract
from .indexing import step_index
from .linking import step_link
from .reading import step_read_data
from .reporting import _print_token_usage_table, _step_banner, console
from .synthesis import step_synthesize


def _pipeline_settings_snapshot(llm: LLMClient) -> dict[str, Any]:
    """Which LLM profile (model/base_url) is active for each purpose the
    pipeline uses, so a run's detail view on the Pipelines page can show
    what it actually ran with -- see PipelineRun.settings. ``llm`` is the
    already-built default-purpose client (require_llm()'s result); thinking
    gets its own lightweight client since step 3 hasn't built one yet.
    """
    thinking = LLMClient.for_purpose("thinking")
    return {
        "default": {"model": llm.model, "base_url": llm.base_url, "available": llm.available},
        "thinking": {"model": thinking.model, "base_url": thinking.base_url, "available": thinking.available},
        "embedding": {"model": os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")},
    }

def run_pipeline(
    *,
    force: bool = False,
    apply_critic: bool = False,
    critic_samples: int = 1,
    critic_regenerate: bool = False,
    use_corrections: bool = False,
    redact_pii: bool = False,
    exclude_prefixes: frozenset[str] | None = None,
    web_search_enabled: bool = False,
    web_search_max_results: int = web_search.DEFAULT_MAX_RESULTS,
    web_search_max_topics: int = web_search.DEFAULT_MAX_TOPICS,
    web_search_provider: str | None = None,
    web_search_api_key: str | None = None,
    resolve_entities_llm: bool = False,
) -> int:
    """Run the full compiler pipeline sequentially.

    ``exclude_prefixes``, if given, leaves out entire top-level data/raw/
    folders (e.g. skip "emails" for this run) -- see
    synthesizer.discover_raw_source_files() for the exact semantics
    (excluded != deleted, so toggling a folder back on doesn't need a
    --force to pick its topics back up).

    ``web_search_enabled`` turns on step 3's live internet search
    enrichment (web_search.py) for this run only -- off by default, so a
    compile stays fully offline/deterministic unless explicitly asked for
    (--web-search / WIKI_WEB_SEARCH_ENABLED). See step_synthesize().

    ``resolve_entities_llm`` turns on step 5's embedding/LLM entity
    resolution tiers for alias expansion -- off by default, since it's an
    additive quality improvement (more aliases mechanically linked) at
    the cost of extra LLM/embedding calls during linking, not something
    every compile needs. See link_and_export_pages()'s docstring.
    """
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
            + (" [red](force rebuild)[/]" if force else "")
            + (f" [cyan](web search: {web_search_provider or web_search.DEFAULT_PROVIDER})[/]" if web_search_enabled else ""),
            border_style="blue",
        )
    )

    run = PipelineRun.start(force=force, settings=_pipeline_settings_snapshot(llm))
    # Machine-readable marker, not a Rich-formatted log line: the Node
    # bridge (pythonBridge.ts's streamCompilerBuild) parses this out of
    # stdout to learn the run id, so the dashboard can poll
    # data/pipeline_runs/<id>.json for live step-by-step progress instead
    # of just tailing raw log text.
    print(f"@@RUN_ID@@{run.id}")
    current_step_name = ""
    try:
        current_step_name = "1. Data Reading"
        _step_banner(1, 5, "Data Reading", "Scan data/raw/ and split files into text chunks")
        llm.current_step = current_step_name
        run.start_step(current_step_name)
        chunks = step_read_data(llm, exclude_prefixes=exclude_prefixes)
        if not chunks:
            run.finish_step(current_step_name, "error", error=f"No raw files found under {RAW_DIR}")
            run.finish("error", error=f"No raw files found under {RAW_DIR}")
            return 1
        input_files = sorted({c.source_path for c in chunks})
        run.finish_step(
            current_step_name,
            "success",
            detail=f"Read {len(chunks)} chunks",
            data={
                "input": {"raw_dir": str(RAW_DIR), "excluded_folders": sorted(exclude_prefixes or [])},
                "output": {"files": input_files, "chunk_count": len(chunks)},
            },
        )

        current_step_name = "2. Extraction"
        _step_banner(2, 5, "Extraction", "Extract topics — skip unchanged files via MD5 state")
        extra_system_context = ""
        if use_corrections:
            corrections = active_learning.load_corrections()
            extra_system_context = active_learning.render_fewshot_block(corrections)
            if corrections:
                console.print(f"[cyan]Active learning:[/] applying {len(corrections)} human correction(s) as few-shot context")
        llm.current_step = current_step_name
        run.start_step(current_step_name)
        extractions = step_extract(
            chunks,
            llm,
            force=force,
            extra_system_context=extra_system_context,
            redact_pii=redact_pii,
            exclude_prefixes=exclude_prefixes,
            run=run,
            step_name=current_step_name,
        )
        topic_total = sum(
            len(c.get("topics", []))
            for f in extractions.get("files", [])
            for c in f.get("chunks", [])
        )
        incremental = extractions.get("incremental", {})
        run.finish_step(
            current_step_name,
            "success",
            detail=f"Extracted {extractions['chunk_count']} chunks ({topic_total} topic tags)",
            data={
                "input": {"chunk_count": len(chunks)},
                "output": {
                    "new": incremental.get("new", []),
                    "modified": incremental.get("modified", []),
                    "deleted": incremental.get("deleted", []),
                    "unchanged_count": len(incremental.get("unchanged", [])),
                    "topic_tag_count": topic_total,
                },
            },
        )

        current_step_name = "3. Synthesis"
        _step_banner(3, 5, "Synthesis", "Regenerate only topic pages affected by changed files")
        # Synthesis is the pipeline's one genuinely reasoning-heavy step, so
        # it gets its own client -- lets the Settings page point "thinking"
        # at a stronger/different model than extraction/indexing/linking use
        # (see LLMClient.for_purpose and backend/src/lib/llmSettings.ts).
        thinking_llm = LLMClient.for_purpose("thinking", cache=llm.cache, cache_enabled=llm.cache_enabled)
        thinking_llm.current_step = current_step_name
        run.start_step(current_step_name)
        synth_result = step_synthesize(
            extractions,
            thinking_llm,
            force=force,
            apply_critic=apply_critic,
            extra_system_context=extra_system_context,
            critic_samples=critic_samples,
            critic_regenerate=critic_regenerate,
            web_search_enabled=web_search_enabled,
            web_search_max_results=web_search_max_results,
            web_search_max_topics=web_search_max_topics,
            web_search_provider=web_search_provider,
            web_search_api_key=web_search_api_key,
            run=run,
            step_name=current_step_name,
        )
        llm.usage_log.extend(thinking_llm.usage_log)
        run.finish_step(
            current_step_name,
            "success",
            detail=(
                f"Wrote {len(synth_result['written_filenames'])} drafts, "
                f"skipped {synth_result['skipped_count']} unchanged"
                + (f", {synth_result['web_added']} web-sourced chunk(s)" if synth_result["web_added"] else "")
            ),
            data={
                "input": {"chunk_count": extractions["chunk_count"]},
                "output": {
                    "written": sorted(synth_result["written_filenames"]),
                    "removed": sorted(synth_result["removed_filenames"]),
                    "skipped_count": synth_result["skipped_count"],
                    "web_search_enabled": web_search_enabled,
                    "web_added": synth_result["web_added"],
                },
            },
        )

        current_step_name = "4. Indexing"
        _step_banner(4, 5, "Indexing", "Incrementally update index.json for changed drafts")
        llm.current_step = current_step_name
        run.start_step(current_step_name)
        topic_index, index_delta = step_index(
            written_filenames=synth_result["written_filenames"],
            removed_filenames=synth_result["removed_filenames"],
            force=force,
        )
        run.finish_step(
            current_step_name,
            "success",
            detail=(
                f"{len(index_delta.added)} added, {len(index_delta.updated)} updated, "
                f"{len(index_delta.removed)} removed"
            ),
            data={
                "input": {
                    "written": sorted(synth_result["written_filenames"]),
                    "removed": sorted(synth_result["removed_filenames"]),
                },
                "output": {
                    "added": sorted(index_delta.added),
                    "updated": sorted(index_delta.updated),
                    "removed": sorted(index_delta.removed),
                },
            },
        )

        current_step_name = "5. Cross-linking"
        _step_banner(5, 5, "Cross-linking", "Re-link only affected pages → wiki-app/docs/")
        llm.current_step = current_step_name
        run.start_step(current_step_name)
        written = step_link(
            topic_index,
            index_delta,
            llm,
            written_filenames=synth_result["written_filenames"],
            removed_filenames=synth_result["removed_filenames"],
            force=force,
            extractions=extractions,
            run=run,
            step_name=current_step_name,
            resolve_entities_llm=resolve_entities_llm,
        )
        run.finish_step(
            current_step_name,
            "success",
            detail=f"Linked {len(written)} pages",
            data={
                "input": {"affected_titles": sorted(index_delta.affected_titles)},
                "output": {"linked": sorted(str(p) for p in written)},
            },
        )
    except Exception:
        # Full traceback, not just str(exc) -- a one-line message like
        # "database disk image is malformed" tells you nothing about which
        # call raised it. This is what the dashboard/Pipelines page shows
        # for the failed step's log, so it needs to be the real thing.
        full_log = traceback.format_exc()
        run.finish_step(current_step_name, "error", error=full_log)
        run.finish("error", error=full_log)
        raise

    console.print("[bold cyan]Map of Content[/] — generating hierarchical index.md")
    moc_result = generate_moc(OUTPUT_DIR)
    console.print(
        f"[green]✓[/] MOC index: [bold]{moc_result['page_count']}[/] pages in "
        f"[bold]{moc_result['category_count']}[/] categories → {moc_result['output']}"
    )

    _print_token_usage_table(llm)
    run.set_token_usage(llm.usage_summary())
    run.finish("success")

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
