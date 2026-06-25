#!/usr/bin/env python3
"""Build topic index and inject internal links into drafted wiki pages."""

from __future__ import annotations

import argparse
import json
import re
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import TypeAlias

ProgressCallback: TypeAlias = Callable[[int, int, str], None]

from llm_client import LLMClient, require_llm
from link_overrides import (
    apply_connection_overrides,
    load_link_overrides,
    override_source_topics,
)
from models import OUTPUT_DIR
from yaml_frontmatter import yaml_quote

COMPILER_DIR = Path(__file__).resolve().parent
TEMP_OUTPUT_DIR = COMPILER_DIR / "temp_output"
INDEX_JSON = TEMP_OUTPUT_DIR / "index.json"

LINKER_SYSTEM_PROMPT = """You are a wiki linker. You receive:
1. A markdown wiki page draft
2. A JSON index mapping topic titles to filenames

Your job: inject internal markdown links wherever a known topic from the index
is mentioned in the page text.

Rules:
- Link format MUST be: [Topic Title](./filename.md) using the exact title and filename from the index
- Do NOT link the current page's own title (given separately)
- Do NOT modify text already inside markdown links or code spans
- Do NOT add new sections or change factual content — only add links
- Prefer linking the first meaningful mention of each topic
- Return ONLY the updated markdown, no commentary"""


@dataclass
class IndexDelta:
    """Tracks incremental changes to the topic index."""

    added: dict[str, str] = field(default_factory=dict)
    updated: dict[str, str] = field(default_factory=dict)
    removed: dict[str, str] = field(default_factory=dict)

    @property
    def affected_titles(self) -> set[str]:
        return set(self.added) | set(self.updated) | set(self.removed)

    @property
    def has_changes(self) -> bool:
        return bool(self.added or self.updated or self.removed)


def _filename_to_title_map(topic_index: dict[str, str]) -> dict[str, str]:
    return {filename: title for title, filename in topic_index.items()}


def _index_entry_for_draft(page_path: Path) -> tuple[str, str]:
    content = page_path.read_text(encoding="utf-8")
    fallback = _title_from_filename(page_path.name)
    title = _extract_title_from_markdown(content, fallback)
    return title, page_path.name


def _yaml_str(value: str) -> str:
    """Quote strings that would break YAML frontmatter."""
    return yaml_quote(value)


def _extract_title_from_markdown(content: str, fallback: str) -> str:
    if content.startswith("---"):
        match = re.search(r"^title:\s*(.+)$", content, re.MULTILINE)
        if match:
            raw = match.group(1).strip()
            if len(raw) >= 2 and raw[0] == raw[-1] and raw[0] in "\"'":
                return raw[1:-1]
            return raw
    for line in content.splitlines():
        stripped = line.strip()
        if stripped.startswith("# "):
            return stripped[2:].strip()
    return fallback


def _split_frontmatter(content: str) -> tuple[str | None, str]:
    """Return (frontmatter_block, body). frontmatter_block excludes --- delimiters."""
    if not content.startswith("---"):
        return None, content
    parts = content.split("---", 2)
    if len(parts) < 3:
        return None, content
    return parts[1].strip(), parts[2].lstrip("\n")


def _finalize_linked_doc(
    linked_body: str,
    *,
    title: str,
    filename: str,
    existing_frontmatter: str | None = None,
) -> str:
    """Merge linked body with Docusaurus frontmatter (preserve synthesizer fields)."""
    doc_id = Path(filename).stem
    slug = f"/{doc_id}"
    now = datetime.now(timezone.utc).isoformat()

    if existing_frontmatter:
        fm = existing_frontmatter
        for field in ("title", "sidebar_label"):
            if re.search(rf"^{field}:", fm, re.MULTILINE):
                fm = re.sub(
                    rf"^{field}:.*$",
                    f"{field}: {_yaml_str(title)}",
                    fm,
                    count=1,
                    flags=re.MULTILINE,
                )
        if re.search(r"^last_updated:", fm, re.MULTILINE):
            fm = re.sub(
                r"^last_updated:.*$",
                f"last_updated: {_yaml_str(now)}",
                fm,
                count=1,
                flags=re.MULTILINE,
            )
        else:
            fm += f"\nlast_updated: {_yaml_str(now)}"
        if "sidebar_label:" not in fm:
            fm += f"\nsidebar_label: {_yaml_str(title)}"
        if "slug:" not in fm:
            fm += f"\nslug: {slug}"
        body = sanitize_for_mdx(linked_body.strip())
        return f"---\n{fm}\n---\n\n{body}\n"

    return wrap_docusaurus_doc(
        title=title,
        body=linked_body,
        filename=filename,
    )


def _title_from_filename(filename: str) -> str:
    stem = Path(filename).stem
    return stem.replace("-", " ").strip().title()


def discover_draft_pages(temp_dir: Path | None = None) -> list[Path]:
    """Return markdown draft pages in temp_output/, excluding JSON artifacts."""
    root = temp_dir or TEMP_OUTPUT_DIR
    skip = {"index.md"}
    return sorted(
        p
        for p in root.glob("*.md")
        if p.name not in skip and p.is_file()
    )


def build_topic_index(
    temp_dir: Path | None = None,
    index_path: Path | None = None,
) -> tuple[dict[str, str], IndexDelta]:
    """
    Full rebuild: scan all drafted Markdown pages and rewrite index.json.

    Returns (topic_index, delta) comparing against the previous index on disk.
    """
    root = temp_dir or TEMP_OUTPUT_DIR
    out_path = index_path or (root / "index.json")
    root.mkdir(parents=True, exist_ok=True)

    previous = load_topic_index(out_path) if out_path.exists() else {}
    topic_index: dict[str, str] = {}
    delta = IndexDelta()

    for page_path in discover_draft_pages(root):
        title, filename = _index_entry_for_draft(page_path)
        topic_index[title] = filename

    for title, filename in topic_index.items():
        if title not in previous:
            delta.added[title] = filename
        elif previous[title] != filename:
            delta.updated[title] = filename

    for title, filename in previous.items():
        if title not in topic_index:
            delta.removed[title] = filename

    _save_topic_index(topic_index, out_path)
    return topic_index, delta


def update_topic_index(
    temp_dir: Path | None = None,
    index_path: Path | None = None,
    *,
    dirty_filenames: set[str] | None = None,
    removed_filenames: set[str] | None = None,
    force: bool = False,
) -> tuple[dict[str, str], IndexDelta]:
    """
    Incrementally update index.json — only rescan changed or new draft pages.

    Args:
        dirty_filenames: Draft .md files that were regenerated this run.
        removed_filenames: Draft .md files deleted this run.
        force: Full rebuild (same as build_topic_index).
    """
    if force or dirty_filenames is None:
        return build_topic_index(temp_dir, index_path)

    root = temp_dir or TEMP_OUTPUT_DIR
    out_path = index_path or (root / "index.json")
    root.mkdir(parents=True, exist_ok=True)

    previous = load_topic_index(out_path) if out_path.exists() else {}
    topic_index = dict(previous)
    delta = IndexDelta()
    filename_to_title = _filename_to_title_map(previous)

    for filename in sorted(removed_filenames or ()):
        title = filename_to_title.get(filename)
        if title and title in topic_index:
            del topic_index[title]
            delta.removed[title] = filename
            filename_to_title.pop(filename, None)

    for page_path in discover_draft_pages(root):
        if page_path.name not in dirty_filenames:
            continue
        title, filename = _index_entry_for_draft(page_path)
        old_title = filename_to_title.get(filename)
        if old_title and old_title != title and old_title in topic_index:
            del topic_index[old_title]
            if old_title not in delta.removed:
                delta.removed[old_title] = filename

        if title not in previous:
            delta.added[title] = filename
        elif previous.get(title) != filename or old_title != title:
            delta.updated[title] = filename
        topic_index[title] = filename
        filename_to_title[filename] = title

    _save_topic_index(topic_index, out_path)
    return topic_index, delta


def _save_topic_index(topic_index: dict[str, str], out_path: Path) -> None:
    out_path.write_text(
        json.dumps({"topics": topic_index}, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )


def load_topic_index(index_path: Path | None = None) -> dict[str, str]:
    path = index_path or INDEX_JSON
    if not path.exists():
        raise FileNotFoundError(
            f"Index not found at {path}. Run build_topic_index() first."
        )
    data = json.loads(path.read_text(encoding="utf-8"))
    return data.get("topics", data)


def _parse_index_for_prompt(topic_index: dict[str, str]) -> str:
    return json.dumps(topic_index, indent=2, ensure_ascii=False)


def link_page_with_llm(
    content: str,
    *,
    page_title: str,
    topic_index: dict[str, str],
    llm: LLMClient,
) -> str:
    """Ask the LLM to inject internal markdown links using the topic index."""
    prompt = (
        f"Current page title (do not link to itself): {page_title}\n\n"
        f"Topic index (title → filename):\n{_parse_index_for_prompt(topic_index)}\n\n"
        f"---\n\nMarkdown page:\n\n{content}"
    )
    return llm.generate_response(prompt, LINKER_SYSTEM_PROMPT).strip()


def _strip_body_frontmatter(content: str) -> str:
    if content.startswith("---"):
        parts = content.split("---", 2)
        if len(parts) >= 3:
            return parts[2].lstrip("\n")
    return content


def _page_needs_relink(
    content: str,
    filename: str,
    *,
    dirty_filenames: set[str],
    index_delta: IndexDelta,
) -> bool:
    """True if this page may contain stale or missing links due to index changes."""
    if filename in dirty_filenames:
        return True

    body = _strip_body_frontmatter(content)

    for title in index_delta.affected_titles:
        if re.search(rf"(?<!\[)\b{re.escape(title)}\b(?!\]\()", body, re.IGNORECASE):
            return True

    for removed_file in index_delta.removed.values():
        if f"](./{removed_file})" in body:
            return True

    for added_title, added_file in index_delta.added.items():
        if added_title.lower() in body.lower() and f"](./{added_file})" not in body:
            return True

    return False


def _resolve_relink_targets(
    root: Path,
    out_dir: Path,
    *,
    dirty_filenames: set[str],
    removed_filenames: set[str],
    index_delta: IndexDelta,
    force: bool,
) -> set[str]:
    if force:
        return {p.name for p in discover_draft_pages(root)}

    targets = set(dirty_filenames)

    for draft_path in discover_draft_pages(root):
        if draft_path.name in targets:
            continue
        draft_content = draft_path.read_text(encoding="utf-8")
        exported = out_dir / draft_path.name
        check_content = draft_content
        if exported.exists():
            check_content = exported.read_text(encoding="utf-8")
        if _page_needs_relink(
            check_content,
            draft_path.name,
            dirty_filenames=dirty_filenames | removed_filenames,
            index_delta=index_delta,
        ):
            targets.add(draft_path.name)

    return targets


def _remove_broken_links(body: str, removed_files: set[str]) -> str:
    """Convert links pointing at removed pages back to plain text."""
    for filename in removed_files:
        pattern = re.compile(
            rf"\[([^\]]+)\]\(\./{re.escape(filename)}\)",
            re.IGNORECASE,
        )
        body = pattern.sub(r"\1", body)
    return body


from mdx_sanitize import sanitize_for_mdx


def wrap_docusaurus_doc(
    *,
    title: str,
    body: str,
    filename: str,
    page_type: str = "topic",
) -> str:
    """Wrap linked markdown with Docusaurus frontmatter."""
    doc_id = Path(filename).stem
    slug = f"/{doc_id}"
    return (
        f"---\n"
        f"id: {doc_id}\n"
        f"title: {_yaml_str(title)}\n"
        f"sidebar_label: {_yaml_str(title)}\n"
        f"slug: {slug}\n"
        f"page_type: {page_type}\n"
        f"---\n\n"
        f"{sanitize_for_mdx(body.strip())}\n"
    )


def link_and_export_pages(
    topic_index: dict[str, str] | None = None,
    *,
    temp_dir: Path | None = None,
    output_dir: Path | None = None,
    llm: LLMClient | None = None,
    dirty_filenames: set[str] | None = None,
    removed_filenames: set[str] | None = None,
    index_delta: IndexDelta | None = None,
    force: bool = False,
    on_progress: ProgressCallback | None = None,
) -> tuple[list[Path], list[str]]:
    """
    Inject links into draft pages and export to wiki-app/docs/.

    When dirty_filenames / index_delta are provided, only regenerated pages and
    pages whose links may be stale are processed — unchanged pages are kept.
    """
    root = temp_dir or TEMP_OUTPUT_DIR
    out_dir = output_dir or OUTPUT_DIR
    out_dir.mkdir(parents=True, exist_ok=True)

    index = topic_index or load_topic_index(root / "index.json")
    delta = index_delta or IndexDelta()
    client = require_llm(llm)

    dirty = dirty_filenames or set()
    removed = removed_filenames or set()
    removed_files = set(delta.removed.values()) | removed

    for filename in removed_files:
        target = out_dir / filename
        if target.exists():
            target.unlink()

    relink_targets = _resolve_relink_targets(
        root,
        out_dir,
        dirty_filenames=dirty,
        removed_filenames=removed,
        index_delta=delta,
        force=force or dirty_filenames is None,
    )

    overrides = load_link_overrides()
    connections = overrides.get("connections", [])
    relink_targets |= {
        filename
        for title, filename in index.items()
        if title in override_source_topics(connections)
    }

    written: list[Path] = []
    skipped: list[str] = []

    to_link = [
        draft_path
        for draft_path in discover_draft_pages(root)
        if draft_path.name in relink_targets
    ]
    total = len(to_link)

    for index, draft_path in enumerate(to_link, start=1):
        filename = draft_path.name

        content = draft_path.read_text(encoding="utf-8")
        title = _extract_title_from_markdown(content, _title_from_filename(filename))
        existing_fm, body = _split_frontmatter(content)
        link_source = body if existing_fm is not None else content
        link_source = _remove_broken_links(link_source, removed_files)

        linked_body = link_page_with_llm(
            link_source,
            page_title=title,
            topic_index=index,
            llm=client,
        )

        linked_body = _remove_broken_links(linked_body, removed_files)
        linked_body = apply_connection_overrides(
            linked_body,
            page_title=title,
            topic_index=index,
            connections=connections,
        )

        final_md = _finalize_linked_doc(
            linked_body,
            title=title,
            filename=filename,
            existing_frontmatter=existing_fm,
        )
        target = out_dir / filename
        target.write_text(final_md, encoding="utf-8")
        written.append(target)
        if on_progress:
            on_progress(index, total, filename)

    for draft_path in discover_draft_pages(root):
        if draft_path.name not in relink_targets:
            skipped.append(draft_path.name)

    return written, skipped


def _write_docs_index_page(topic_index: dict[str, str], output_dir: Path) -> Path:
    """Create or refresh wiki-app/docs/index.md from the topic index."""
    lines = [
        "# Wiki Index",
        "",
        "Master catalog of compiled topic pages.",
        "",
    ]
    for title, filename in sorted(topic_index.items(), key=lambda x: x[0].lower()):
        lines.append(f"- [{title}](./{filename})")

    body = "\n".join(lines) + "\n"
    index_md = wrap_docusaurus_doc(
        title="Index",
        body=body,
        filename="index.md",
        page_type="index",
    )
    path = output_dir / "index.md"
    path.write_text(index_md, encoding="utf-8")
    return path


def run_linker_pipeline(
    *,
    temp_dir: Path | None = None,
    output_dir: Path | None = None,
    llm: LLMClient | None = None,
    dirty_filenames: set[str] | None = None,
    removed_filenames: set[str] | None = None,
    force: bool = False,
) -> dict:
    """Incrementally index, link, and export draft pages to wiki-app/docs/."""
    root = temp_dir or TEMP_OUTPUT_DIR

    topic_index, index_delta = update_topic_index(
        root,
        dirty_filenames=dirty_filenames,
        removed_filenames=removed_filenames,
        force=force,
    )

    written, skipped = link_and_export_pages(
        topic_index,
        temp_dir=root,
        output_dir=output_dir,
        llm=llm,
        dirty_filenames=dirty_filenames,
        removed_filenames=removed_filenames,
        index_delta=index_delta,
        force=force,
    )

    return {
        "topic_count": len(topic_index),
        "pages_linked": len(written),
        "pages_skipped": len(skipped),
        "index_delta": {
            "added": index_delta.added,
            "updated": index_delta.updated,
            "removed": index_delta.removed,
        },
        "index_json": str((root / "index.json").resolve()),
        "output_dir": str((output_dir or OUTPUT_DIR).resolve()),
        "files": [str(p.resolve()) for p in written],
        "skipped": skipped,
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Build topic index and link draft pages into wiki-app/docs/"
    )
    parser.add_argument(
        "--skip-index",
        action="store_true",
        help="Use existing temp_output/index.json instead of rebuilding",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Re-link and re-index all pages",
    )
    args = parser.parse_args()

    result = run_linker_pipeline(
        force=args.force or not args.skip_index,
    )
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
