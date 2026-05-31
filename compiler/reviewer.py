#!/usr/bin/env python3
"""Review compiled wiki pages against original raw chunks using the LLM."""

from __future__ import annotations

import argparse
import json
import re
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path

from rich.console import Console
from rich.panel import Panel
from rich.progress import BarColumn, Progress, SpinnerColumn, TextColumn, TimeElapsedColumn

from llm_client import LLMClient
from linker import INDEX_JSON
from models import OUTPUT_DIR, STATE_FILE
from synthesizer import load_state

COMPILER_DIR = Path(__file__).resolve().parent
DEFAULT_REPORT_PATH = COMPILER_DIR / "review_report.txt"

MAX_CHUNK_CHARS = 8000
MAX_WIKI_CHARS = 12000

REVIEW_SYSTEM_PROMPT = """You are a wiki quality reviewer. Compare a compiled wiki page against the original raw source chunks it was synthesized from.

Your job:
1. Find STRUCTURAL inconsistencies — missing sections, wrong organization, facts present in sources but omitted from the page, content in the page not grounded in any source chunk, mismatched entity/concept coverage, broken or misleading source attribution.
2. Flag DUBIOUS CLAIMS — statements in the wiki page that are unsupported, contradicted by, or over-interpreted relative to the raw chunks. Ignore navigation cross-links unless they introduce factual claims beyond the sources.

Return ONLY valid JSON with this shape:
{
  "topic": "string",
  "severity": "clean" | "minor" | "major",
  "structural_issues": [
    {
      "type": "missing_content|ungrounded_content|organization|attribution|other",
      "description": "string",
      "source_refs": ["source/path (chunk N)"],
      "wiki_excerpt": "optional short quote from the wiki page"
    }
  ],
  "dubious_claims": [
    {
      "claim": "the questionable statement from the wiki page",
      "reason": "why it is dubious vs the raw chunks",
      "confidence": "low|medium|high",
      "source_refs": ["source/path (chunk N)"]
    }
  ],
  "summary": "one or two sentence overall assessment"
}

Be specific and cite source files when possible. If the page faithfully reflects the sources, return empty arrays and severity "clean"."""


@dataclass
class PageReview:
    topic: str
    page_path: Path
    severity: str = "clean"
    summary: str = ""
    structural_issues: list[dict] = field(default_factory=list)
    dubious_claims: list[dict] = field(default_factory=list)
    error: str | None = None


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def strip_frontmatter(content: str) -> str:
    if not content.startswith("---"):
        return content
    parts = content.split("---", 2)
    return parts[2].lstrip("\n") if len(parts) >= 3 else content


def parse_frontmatter(content: str) -> dict[str, str]:
    if not content.startswith("---"):
        return {}
    parts = content.split("---", 2)
    if len(parts) < 3:
        return {}
    meta: dict[str, str] = {}
    for line in parts[1].splitlines():
        match = re.match(r"^(\w+):\s*(.+)$", line)
        if not match:
            continue
        value = match[2].strip()
        if (value.startswith('"') and value.endswith('"')) or (
            value.startswith("'") and value.endswith("'")
        ):
            value = value[1:-1]
        meta[match[1]] = value
    return meta


def load_topic_index() -> dict[str, str]:
    """Return topic title → filename mapping from index.json."""
    if not INDEX_JSON.exists():
        return {}
    data = json.loads(INDEX_JSON.read_text(encoding="utf-8"))
    topics = data.get("topics", {})
    if isinstance(topics, dict):
        return topics
    return {}


def _normalize_topic(title: str) -> str:
    """Align index.json titles with topic tags stored in state.json."""
    return re.sub(r'\\(["\'])', r"\1", title).strip()


def build_grouped_from_state(state: dict) -> dict[str, list[dict]]:
    """Rebuild topic → raw chunk entries from data/state.json."""
    grouped: dict[str, list[dict]] = {}
    for source, file_entry in state.get("files", {}).items():
        for chunk in file_entry.get("chunks", []):
            payload = {
                "source": source,
                "chunk_index": chunk["chunk_index"],
                "text": chunk["text"],
                "entities": chunk.get("entities", []),
                "concepts": chunk.get("concepts", []),
            }
            for topic in chunk.get("topics") or ["General Notes"]:
                topic_key = _normalize_topic(topic)
                if topic_key:
                    grouped.setdefault(topic_key, []).append(payload)
    return grouped


def _dedupe_chunk_entries(entries: list[dict]) -> list[dict]:
    seen: set[tuple[str, int]] = set()
    unique: list[dict] = []
    for entry in entries:
        key = (entry["source"], entry["chunk_index"])
        if key in seen:
            continue
        seen.add(key)
        unique.append(entry)
    return unique


def format_source_chunks(entries: list[dict]) -> str:
    blocks: list[str] = []
    for entry in _dedupe_chunk_entries(entries):
        text = entry["text"]
        if len(text) > MAX_CHUNK_CHARS:
            text = text[:MAX_CHUNK_CHARS] + "\n\n[... truncated for review ...]"
        blocks.append(
            f"### Source: `{entry['source']}` (chunk {entry['chunk_index']})\n\n{text}"
        )
    return "\n\n---\n\n".join(blocks)


def _parse_review_json(raw: str, topic: str) -> dict:
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if not match:
        raise ValueError("LLM response did not contain JSON")
    data = json.loads(match.group())
    data.setdefault("topic", topic)
    data.setdefault("severity", "minor")
    data.setdefault("structural_issues", [])
    data.setdefault("dubious_claims", [])
    data.setdefault("summary", "")
    return data


def review_page_with_llm(
    *,
    topic: str,
    wiki_body: str,
    source_entries: list[dict],
    llm: LLMClient,
) -> PageReview:
    if len(wiki_body) > MAX_WIKI_CHARS:
        wiki_body = wiki_body[:MAX_WIKI_CHARS] + "\n\n[... truncated for review ...]"

    if not source_entries:
        return PageReview(
            topic=topic,
            page_path=Path(),
            severity="major",
            summary="No raw source chunks are mapped to this topic in state.json.",
            structural_issues=[
                {
                    "type": "attribution",
                    "description": "Topic has no linked raw chunks in compiler state.",
                    "source_refs": [],
                    "wiki_excerpt": "",
                }
            ],
        )

    prompt = (
        f"Topic: {topic}\n"
        f"Source chunk count: {len(_dedupe_chunk_entries(source_entries))}\n\n"
        f"## Compiled wiki page\n\n{wiki_body}\n\n"
        f"## Original raw source chunks\n\n{format_source_chunks(source_entries)}"
    )

    raw = llm.generate_response(prompt, REVIEW_SYSTEM_PROMPT, temperature=0.1)
    data = _parse_review_json(raw, topic)
    return PageReview(
        topic=topic,
        page_path=Path(),
        severity=data.get("severity", "minor"),
        summary=data.get("summary", ""),
        structural_issues=list(data.get("structural_issues") or []),
        dubious_claims=list(data.get("dubious_claims") or []),
    )


def review_page_heuristic(
    *,
    topic: str,
    wiki_body: str,
    source_entries: list[dict],
) -> PageReview:
    """Basic structural checks when no LLM API key is available."""
    review = PageReview(topic=topic, page_path=Path())

    if not source_entries:
        review.severity = "major"
        review.summary = "No raw source chunks mapped to this topic."
        review.structural_issues.append(
            {
                "type": "attribution",
                "description": "Topic has no linked raw chunks in state.json.",
                "source_refs": [],
            }
        )
        return review

    expected_sources = {
        f"{entry['source']} (chunk {entry['chunk_index']})"
        for entry in _dedupe_chunk_entries(source_entries)
    }
    listed_sources = set(
        re.findall(r"`([^`]+)` — chunk (\d+)", wiki_body)
    )
    listed_refs = {f"{src} (chunk {idx})" for src, idx in listed_sources}

    missing_in_page = expected_sources - listed_refs
    if missing_in_page:
        review.structural_issues.append(
            {
                "type": "attribution",
                "description": "Sources section omits chunks that were tagged with this topic.",
                "source_refs": sorted(missing_in_page),
            }
        )

    chunk_count_match = re.search(r"Synthesized from \*\*(\d+)\*\* raw chunk", wiki_body)
    if chunk_count_match:
        declared = int(chunk_count_match.group(1))
        actual = len(_dedupe_chunk_entries(source_entries))
        if declared != actual:
            review.structural_issues.append(
                {
                    "type": "other",
                    "description": (
                        f"Page declares {declared} source chunk(s) but state.json maps {actual}."
                    ),
                    "source_refs": sorted(expected_sources),
                }
            )

    if review.structural_issues:
        review.severity = "minor"
        review.summary = "Heuristic review found structural attribution mismatches."
    else:
        review.summary = "Heuristic review found no obvious structural issues."

    return review


def discover_pages(
    docs_dir: Path,
    topic_index: dict[str, str],
    *,
    indexed_only: bool = True,
) -> list[tuple[str, Path]]:
    """Return (topic_title, page_path) pairs to review."""
    if indexed_only and topic_index:
        pages: list[tuple[str, Path]] = []
        for title, filename in sorted(topic_index.items(), key=lambda item: item[0].lower()):
            path = docs_dir / filename
            if path.exists():
                pages.append((title, path))
        return pages

    filename_to_topic = {filename: title for title, filename in topic_index.items()}
    pages = []

    for path in sorted(docs_dir.rglob("*.md")):
        if path.name == "index.md":
            continue
        rel_name = path.name
        if rel_name in filename_to_topic:
            pages.append((filename_to_topic[rel_name], path))
            continue

        raw = path.read_text(encoding="utf-8")
        meta = parse_frontmatter(raw)
        title = meta.get("title") or path.stem.replace("-", " ").title()
        pages.append((title, path))

    return pages


def run_review(
    *,
    docs_dir: Path | None = None,
    report_path: Path | None = None,
    llm: LLMClient | None = None,
    use_llm: bool = True,
    topic_filter: str | None = None,
    indexed_only: bool = True,
) -> Path:
    docs = docs_dir or OUTPUT_DIR
    report = report_path or DEFAULT_REPORT_PATH
    client = llm or LLMClient(api_key="" if not use_llm else None)
    use_api = use_llm and client.available

    if use_llm and not client.available:
        console = Console()
        console.print(
            "[yellow]No OPENAI_API_KEY — falling back to heuristic review.[/]"
        )

    state = load_state()
    grouped = build_grouped_from_state(state)
    topic_index = load_topic_index()
    if indexed_only and not topic_index:
        console = Console()
        console.print(
            "[yellow]index.json not found — reviewing all docs under output directory.[/]"
        )
        indexed_only = False

    pages = discover_pages(docs, topic_index, indexed_only=indexed_only)

    if topic_filter:
        needle = topic_filter.lower()
        pages = [(title, path) for title, path in pages if needle in title.lower()]

    console = Console()
    console.print(
        Panel.fit(
            "[bold]LLM Wiki Reviewer[/]\n"
            f"Docs:   [dim]{docs}[/]\n"
            f"Report: [dim]{report}[/]\n"
            f"Mode:   [yellow]{'LLM' if use_api else 'heuristic'}[/]\n"
            f"Pages:  [bold]{len(pages)}[/]",
            border_style="blue",
        )
    )

    reviews: list[PageReview] = []

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        TextColumn("{task.completed}/{task.total}"),
        TimeElapsedColumn(),
        console=console,
    ) as progress:
        task = progress.add_task("Reviewing pages…", total=max(len(pages), 1))
        for topic, page_path in pages:
            raw = page_path.read_text(encoding="utf-8")
            wiki_body = strip_frontmatter(raw)
            source_entries = grouped.get(_normalize_topic(topic), [])

            try:
                if use_api:
                    result = review_page_with_llm(
                        topic=topic,
                        wiki_body=wiki_body,
                        source_entries=source_entries,
                        llm=client,
                    )
                else:
                    result = review_page_heuristic(
                        topic=topic,
                        wiki_body=wiki_body,
                        source_entries=source_entries,
                    )
            except Exception as exc:
                result = PageReview(
                    topic=topic,
                    page_path=page_path,
                    severity="major",
                    summary="Review failed.",
                    error=str(exc),
                )

            result.page_path = page_path
            reviews.append(result)
            progress.advance(task)

    report_text = format_report(reviews, docs_dir=docs, used_llm=use_api)
    report.parent.mkdir(parents=True, exist_ok=True)
    report.write_text(report_text, encoding="utf-8")

    issue_count = sum(
        len(r.structural_issues) + len(r.dubious_claims) + (1 if r.error else 0)
        for r in reviews
    )
    flagged = sum(
        1
        for r in reviews
        if r.severity != "clean" or r.structural_issues or r.dubious_claims or r.error
    )

    console.print(
        Panel.fit(
            f"[bold green]Review complete[/]\n"
            f"  Pages reviewed: {len(reviews)}\n"
            f"  Pages flagged:  {flagged}\n"
            f"  Total issues:   {issue_count}\n"
            f"  Report:         {report}",
            border_style="green",
        )
    )
    return report


def format_report(reviews: list[PageReview], *, docs_dir: Path, used_llm: bool) -> str:
    lines = [
        "LLM Wiki Review Report",
        "=" * 72,
        f"Generated: { _utc_now_iso() }",
        f"Docs directory: {docs_dir}",
        f"Review mode: {'LLM' if used_llm else 'heuristic'}",
        f"Pages reviewed: {len(reviews)}",
        "",
    ]

    severity_rank = {"major": 0, "minor": 1, "clean": 2}
    sorted_reviews = sorted(
        reviews,
        key=lambda r: (
            severity_rank.get(r.severity, 1),
            r.topic.lower(),
        ),
    )

    flagged = [
        r
        for r in sorted_reviews
        if r.error or r.structural_issues or r.dubious_claims or r.severity != "clean"
    ]

    if not flagged:
        lines.append("No structural inconsistencies or dubious claims flagged.")
        lines.append("")
        return "\n".join(lines)

    for review in flagged:
        rel_path = review.page_path
        try:
            rel_display = rel_path.relative_to(docs_dir.parent.parent)
        except ValueError:
            rel_display = rel_path

        lines.extend(
            [
                "-" * 72,
                f"PAGE: {review.topic}",
                f"FILE: {rel_display}",
                f"SEVERITY: {review.severity.upper()}",
            ]
        )
        if review.summary:
            lines.append(f"SUMMARY: {review.summary}")
        if review.error:
            lines.append(f"ERROR: {review.error}")
        lines.append("")

        if review.structural_issues:
            lines.append("STRUCTURAL ISSUES")
            lines.append("-" * 40)
            for issue in review.structural_issues:
                issue_type = issue.get("type", "other")
                desc = issue.get("description", "")
                refs = issue.get("source_refs") or []
                excerpt = issue.get("wiki_excerpt") or ""
                lines.append(f"  [{issue_type}] {desc}")
                if refs:
                    lines.append(f"    Sources: {', '.join(refs)}")
                if excerpt:
                    lines.append(f"    Wiki excerpt: {excerpt}")
            lines.append("")

        if review.dubious_claims:
            lines.append("DUBIOUS CLAIMS")
            lines.append("-" * 40)
            for claim in review.dubious_claims:
                confidence = claim.get("confidence", "medium")
                text = claim.get("claim", "")
                reason = claim.get("reason", "")
                refs = claim.get("source_refs") or []
                lines.append(f"  [{confidence} confidence] {text}")
                if reason:
                    lines.append(f"    Reason: {reason}")
                if refs:
                    lines.append(f"    Sources: {', '.join(refs)}")
            lines.append("")

    clean_count = len(reviews) - len(flagged)
    if clean_count:
        lines.extend(
            [
                "-" * 72,
                f"{clean_count} additional page(s) passed with no flagged issues.",
                "",
            ]
        )

    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Review compiled wiki pages against raw source chunks"
    )
    parser.add_argument(
        "--docs-dir",
        type=Path,
        default=OUTPUT_DIR,
        help=f"Directory of final linked markdown (default: {OUTPUT_DIR})",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_REPORT_PATH,
        help=f"Report output path (default: {DEFAULT_REPORT_PATH})",
    )
    parser.add_argument(
        "--topic",
        help="Review only topics whose title contains this substring (case-insensitive)",
    )
    parser.add_argument(
        "--heuristic-only",
        action="store_true",
        help="Skip LLM calls; run basic structural checks only",
    )
    parser.add_argument(
        "--all-docs",
        action="store_true",
        help="Review every markdown file under docs/, not just index.json topics",
    )
    args = parser.parse_args()

    if not args.docs_dir.exists():
        raise SystemExit(f"Docs directory not found: {args.docs_dir}")
    if not STATE_FILE.exists():
        raise SystemExit(
            f"Compiler state not found: {STATE_FILE}\n"
            "Run the compiler pipeline first (python main.py)."
        )

    run_review(
        docs_dir=args.docs_dir,
        report_path=args.output,
        use_llm=not args.heuristic_only,
        topic_filter=args.topic,
        indexed_only=not args.all_docs,
    )


if __name__ == "__main__":
    main()
