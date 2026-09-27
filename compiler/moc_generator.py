#!/usr/bin/env python3
"""Map of Content (MOC) generator — hierarchical wiki index from pages and tags."""

from __future__ import annotations

import argparse
import json
import re
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path

import yaml

from models import OUTPUT_DIR
from synthesizer import build_docusaurus_frontmatter

COMPILER_DIR = Path(__file__).resolve().parent
DEFAULT_DOCS_DIR = OUTPUT_DIR

SKIP_FILES = {"index.md", ".gitkeep"}
META_TAGS = {"wiki", "auto-ingest", "llm-ingest", "index", "moc", "overview"}

FOLDER_CATEGORIES: dict[str, str] = {
    "entities": "Entities",
    "concepts": "Concepts",
    "sources": "Sources",
    "comparisons": "Comparisons",
}

# Fixed display order for the categories every corpus can produce (folder-
# based ones, plus the always-present Overview). Dynamic tag-derived
# categories (see _dynamic_tag_categories()) have no fixed name to sort by
# ahead of time — render_moc_body() falls back to alphabetical for those,
# and General Reference (the catch-all for pages with no strong tag) is
# pinned last so it doesn't get lost among them.
CATEGORY_ORDER = [
    "Overview",
    "Sources",
    "Entities",
    "Concepts",
    "Comparisons",
]
FALLBACK_CATEGORY = "General Reference"
CATEGORY_ORDER_LAST = [FALLBACK_CATEGORY]


@dataclass
class PageMeta:
    """Metadata extracted from a wiki markdown page."""

    title: str
    rel_path: str
    doc_id: str
    tags: list[str] = field(default_factory=list)
    last_updated: str | None = None
    summary: str = ""

    @property
    def link_path(self) -> str:
        return f"./{self.rel_path}"

    @property
    def folder(self) -> str | None:
        parts = Path(self.rel_path).parts
        return parts[0] if len(parts) > 1 else None


def _utc_now_iso() -> str:
    return datetime.now(UTC).isoformat()


def _split_frontmatter(content: str) -> tuple[dict, str]:
    if not content.startswith("---"):
        return {}, content
    parts = content.split("---", 2)
    if len(parts) < 3:
        return {}, content
    try:
        meta = yaml.safe_load(parts[1]) or {}
    except yaml.YAMLError:
        meta = {}
    return meta, parts[2].lstrip("\n")


def _extract_summary(body: str, max_len: int = 120) -> str:
    for line in body.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        if stripped.startswith(("-", "*", "|", ">", "<!--")):
            continue
        text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", stripped)
        text = re.sub(r"[*_`]", "", text)
        if len(text) > 20:
            return text[:max_len].rstrip() + ("…" if len(text) > max_len else "")
    return ""


def parse_page(path: Path, docs_root: Path) -> PageMeta | None:
    rel = path.relative_to(docs_root).as_posix()
    if path.name in SKIP_FILES:
        return None

    content = path.read_text(encoding="utf-8")
    meta, body = _split_frontmatter(content)

    title = str(meta.get("title") or "").strip()
    if not title:
        for line in body.splitlines():
            if line.startswith("# "):
                title = line[2:].strip()
                break
    if not title:
        title = path.stem.replace("-", " ").title()

    raw_tags = meta.get("tags") or []
    if isinstance(raw_tags, str):
        raw_tags = [raw_tags]
    tags = [str(t).strip().lower() for t in raw_tags if str(t).strip()]

    doc_id = str(meta.get("id") or path.stem)
    last_updated = meta.get("last_updated")
    summary = _extract_summary(body)

    return PageMeta(
        title=title,
        rel_path=rel,
        doc_id=doc_id,
        tags=tags,
        last_updated=str(last_updated) if last_updated else None,
        summary=summary,
    )


def discover_pages(docs_dir: Path) -> list[PageMeta]:
    pages: list[PageMeta] = []
    for path in sorted(docs_dir.rglob("*.md")):
        page = parse_page(path, docs_dir)
        if page:
            pages.append(page)
    return pages


def _meaningful_tags(tags: list[str], doc_id: str) -> set[str]:
    return {t for t in tags if t not in META_TAGS and t != doc_id}


def _dynamic_tag_categories(
    pages: list[PageMeta], *, max_categories: int = 8, min_pages: int = 2
) -> dict[str, str]:
    """Build a tag → "Title Case" category name mapping from the actual
    corpus being compiled, instead of a fixed set of tag strings hardcoded
    to one specific sample dataset (a prior version of this module hand-
    picked tags like "aurora-nova-widget-v2-beta-unit" — that worked only
    for this repo's own fictional demo corpus and would match nothing at
    all in a real user's personal wiki, silently dumping every page into
    General Reference; confirmed live: even on the sample corpus it was
    tuned for, 25% of pages already missed every rule).

    The `max_categories` most frequent meaningful tags across all pages
    become category buckets — any corpus naturally has its own most common
    topics, so this needs no hardcoded knowledge of what a wiki is about.
    `min_pages` avoids a category that would only ever hold one page (not
    worth a whole top-level section). Returned dict is ordered by
    descending frequency, most common tag first — assign_category() walks
    it in that order so a page's *most globally common* matching tag wins
    when it has several.
    """
    counts: dict[str, int] = defaultdict(int)
    for page in pages:
        for tag in _meaningful_tags(page.tags, page.doc_id):
            counts[tag] += 1

    frequent_tags = sorted(
        (tag for tag, count in counts.items() if count >= min_pages),
        key=lambda tag: (-counts[tag], tag),
    )[:max_categories]

    return {tag: tag.replace("-", " ").title() for tag in frequent_tags}


def assign_category(page: PageMeta, tag_categories: dict[str, str]) -> str:
    if page.doc_id == "overview" or page.rel_path == "overview.md":
        return "Overview"

    if page.folder and page.folder in FOLDER_CATEGORIES:
        return FOLDER_CATEGORIES[page.folder]

    tag_set = _meaningful_tags(page.tags, page.doc_id)
    for tag, category_name in tag_categories.items():
        if tag in tag_set:
            return category_name

    return FALLBACK_CATEGORY


def categorize_pages(pages: list[PageMeta]) -> dict[str, list[PageMeta]]:
    tag_categories = _dynamic_tag_categories(pages)

    grouped: dict[str, list[PageMeta]] = defaultdict(list)
    for page in pages:
        if page.rel_path == "index.md":
            continue
        category = assign_category(page, tag_categories)
        grouped[category].append(page)

    for category in grouped:
        grouped[category].sort(key=lambda p: p.title.lower())

    return dict(grouped)


def _subtags_for_category(pages: list[PageMeta]) -> dict[str, list[PageMeta]]:
    """Optional second-level grouping by strongest non-meta tag."""
    subgroups: dict[str, list[PageMeta]] = defaultdict(list)
    for page in pages:
        meaningful = sorted(_meaningful_tags(page.tags, page.doc_id))
        sub_key = meaningful[0].replace("-", " ").title() if meaningful else "Uncategorized"
        subgroups[sub_key].append(page)
    return dict(sorted(subgroups.items(), key=lambda x: x[0].lower()))


def render_moc_body(categories: dict[str, list[PageMeta]], *, total_pages: int) -> str:
    lines = [
        "# Wiki Map of Content",
        "",
        f"> Auto-generated index of **{total_pages}** pages, organized by topic and tags.",
        "",
    ]

    ordered = [c for c in CATEGORY_ORDER if c in categories]
    for c in sorted(categories.keys()):
        if c not in ordered and c not in CATEGORY_ORDER_LAST:
            ordered.append(c)
    ordered.extend(c for c in CATEGORY_ORDER_LAST if c in categories)

    for category in ordered:
        pages = categories.get(category, [])
        if not pages:
            continue

        lines.append(f"## {category}")
        lines.append("")

        # Use sub-grouping for large categories (5+ pages).
        if len(pages) >= 5 and category not in FOLDER_CATEGORIES.values():
            subgroups = _subtags_for_category(pages)
            for sub_name, sub_pages in subgroups.items():
                if len(subgroups) > 1:
                    lines.append(f"### {sub_name}")
                    lines.append("")
                for page in sub_pages:
                    lines.extend(_format_entry(page))
                if len(subgroups) > 1:
                    lines.append("")
        else:
            for page in pages:
                lines.extend(_format_entry(page))
            lines.append("")

    lines.append("---")
    lines.append("")
    lines.append(f"*Last generated: {_utc_now_iso()}*")
    return "\n".join(lines).rstrip() + "\n"


def _format_entry(page: PageMeta) -> list[str]:
    tag_hint = ", ".join(sorted(_meaningful_tags(page.tags, page.doc_id))[:4])
    if page.summary:
        desc = page.summary
    elif tag_hint:
        desc = f"tags: {tag_hint}"
    else:
        desc = page.doc_id

    return [f"- [{page.title}]({page.link_path}) — {desc}"]


def generate_moc(
    docs_dir: Path | None = None,
    output_path: Path | None = None,
) -> dict:
    """
    Analyze all wiki pages and write a hierarchical index.md to the docs root.

    Returns summary dict with category counts and output path.
    """
    root = docs_dir or DEFAULT_DOCS_DIR
    out = output_path or (root / "index.md")
    root.mkdir(parents=True, exist_ok=True)

    pages = discover_pages(root)
    categories = categorize_pages(pages)
    body = render_moc_body(categories, total_pages=len(pages))

    frontmatter = build_docusaurus_frontmatter(
        doc_id="index",
        title="Wiki Map of Content",
        tags=["index", "moc", "wiki"],
        last_updated=_utc_now_iso(),
    )
    fm_body = frontmatter.removesuffix("---").rstrip()
    full_doc = f"{fm_body}\nsidebar_label: Wiki Index\nslug: /index\n---\n\n{body}"

    out.write_text(full_doc, encoding="utf-8")

    return {
        "output": str(out.resolve()),
        "page_count": len(pages),
        "category_count": len(categories),
        "categories": {name: len(items) for name, items in sorted(categories.items())},
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate hierarchical Map of Content index.md for the wiki"
    )
    parser.add_argument(
        "--docs-dir",
        type=Path,
        default=DEFAULT_DOCS_DIR,
        help=f"Wiki docs directory (default: {DEFAULT_DOCS_DIR})",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Output path for index.md (default: <docs-dir>/index.md)",
    )
    args = parser.parse_args()

    result = generate_moc(args.docs_dir, args.output)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
