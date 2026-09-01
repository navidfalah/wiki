"""Tests for moc_generator.py -- previously had zero test coverage.
Covers the dynamic, corpus-agnostic category assignment that replaced a
prior hardcoded, sample-corpus-specific tag rule list (see module
docstring on _dynamic_tag_categories() and documentation/07 for why)."""

from pathlib import Path

from moc_generator import (
    FALLBACK_CATEGORY,
    PageMeta,
    _dynamic_tag_categories,
    _extract_summary,
    _meaningful_tags,
    assign_category,
    categorize_pages,
    discover_pages,
    parse_page,
    render_moc_body,
)


def _page(title: str, rel_path: str, tags: list[str], doc_id: str | None = None) -> PageMeta:
    return PageMeta(title=title, rel_path=rel_path, doc_id=doc_id or rel_path.replace(".md", ""), tags=tags)


def test_meaningful_tags_drops_meta_tags_and_doc_id():
    tags = ["wiki", "meshsync", "nova-widget"]
    assert _meaningful_tags(tags, "nova-widget") == {"meshsync"}


def test_dynamic_tag_categories_picks_frequent_tags():
    pages = [
        _page("A", "a.md", ["meshsync", "nova-widget"]),
        _page("B", "b.md", ["meshsync", "battery"]),
        _page("C", "c.md", ["meshsync"]),
    ]
    categories = _dynamic_tag_categories(pages, min_pages=2)
    assert "meshsync" in categories
    assert categories["meshsync"] == "Meshsync"
    # "nova-widget" and "battery" each only appear once -- below min_pages.
    assert "nova-widget" not in categories
    assert "battery" not in categories


def test_dynamic_tag_categories_orders_by_descending_frequency():
    pages = [
        _page("A", "a.md", ["popular", "rare"]),
        _page("B", "b.md", ["popular"]),
        _page("C", "c.md", ["popular"]),
        _page("D", "d.md", ["rare"]),
    ]
    categories = _dynamic_tag_categories(pages, min_pages=2)
    assert list(categories.keys())[0] == "popular"


def test_dynamic_tag_categories_respects_max_categories():
    pages = [_page(f"P{i}", f"p{i}.md", [f"tag{i}", "shared"]) for i in range(20)]
    # every tagN appears once (below min_pages=2, dropped); "shared" appears 20x
    categories = _dynamic_tag_categories(pages, max_categories=3, min_pages=2)
    assert len(categories) <= 3


def test_dynamic_tag_categories_no_hardcoded_content_knowledge():
    """The whole point of the fix: a corpus about something completely
    unrelated to the sample domain gets sensible categories too, derived
    purely from its own tags."""
    pages = [
        _page("Recipe A", "a.md", ["baking", "sourdough"]),
        _page("Recipe B", "b.md", ["baking", "pastry"]),
        _page("Recipe C", "c.md", ["baking"]),
    ]
    categories = _dynamic_tag_categories(pages, min_pages=2)
    assert categories == {"baking": "Baking"}


def test_assign_category_overview_special_case():
    page = _page("Overview", "overview.md", [], doc_id="overview")
    assert assign_category(page, {}) == "Overview"


def test_assign_category_folder_based():
    page = _page("Mira Chen", "entities/mira-chen.md", [])
    assert assign_category(page, {}) == "Entities"


def test_assign_category_uses_dynamic_tag_categories():
    page = _page("Nova Widget Battery", "battery.md", ["meshsync", "wiki"])
    tag_categories = {"meshsync": "Meshsync"}
    assert assign_category(page, tag_categories) == "Meshsync"


def test_assign_category_falls_back_when_no_tag_matches():
    page = _page("Random Note", "random.md", ["untagged-thing"])
    assert assign_category(page, {"meshsync": "Meshsync"}) == FALLBACK_CATEGORY


def test_assign_category_prefers_most_frequent_matching_tag():
    page = _page("X", "x.md", ["rare", "popular"])
    tag_categories = {"popular": "Popular", "rare": "Rare"}  # ordered by frequency
    assert assign_category(page, tag_categories) == "Popular"


def test_categorize_pages_skips_index_page():
    pages = [_page("Index", "index.md", []), _page("A", "a.md", ["meshsync"])]
    grouped = categorize_pages(pages)
    all_paths = [p.rel_path for pages_list in grouped.values() for p in pages_list]
    assert "index.md" not in all_paths


def test_categorize_pages_sorts_within_category_by_title():
    pages = [
        _page("Zebra", "z.md", ["meshsync"]),
        _page("Alpha", "a.md", ["meshsync"]),
        _page("Beta", "b.md", ["meshsync"]),
    ]
    grouped = categorize_pages(pages)
    titles = [p.title for p in grouped["Meshsync"]]
    assert titles == ["Alpha", "Beta", "Zebra"]


def test_extract_summary_skips_headings_and_bullets():
    body = "# Heading\n\n- a bullet\n\nThis is a real sentence long enough to count as a summary.\n"
    summary = _extract_summary(body)
    assert summary.startswith("This is a real sentence")


def test_extract_summary_strips_markdown_links_and_emphasis():
    body = "This has a [link](./x.md) and **bold** and `code` in a long enough sentence."
    summary = _extract_summary(body)
    assert "[" not in summary
    assert "**" not in summary
    assert "`" not in summary


def test_extract_summary_truncates_long_text():
    body = "x" * 300
    summary = _extract_summary(body, max_len=50)
    assert len(summary) <= 51  # + ellipsis
    assert summary.endswith("…")


def test_extract_summary_empty_body_returns_empty_string():
    assert _extract_summary("") == ""


def test_parse_page_reads_frontmatter(tmp_path: Path):
    docs_dir = tmp_path
    page_path = docs_dir / "meshsync.md"
    page_path.write_text(
        '---\nid: meshsync\ntitle: "MeshSync"\ntags:\n  - meshsync\n  - wiki\n---\n\n# MeshSync\n\nThe protocol.\n',
        encoding="utf-8",
    )
    page = parse_page(page_path, docs_dir)
    assert page is not None
    assert page.title == "MeshSync"
    assert page.doc_id == "meshsync"
    assert "meshsync" in page.tags


def test_parse_page_skips_index_and_gitkeep(tmp_path: Path):
    (tmp_path / "index.md").write_text("# Index\n", encoding="utf-8")
    assert parse_page(tmp_path / "index.md", tmp_path) is None


def test_parse_page_falls_back_to_h1_when_no_frontmatter_title(tmp_path: Path):
    page_path = tmp_path / "battery.md"
    page_path.write_text("# Battery Life\n\nDetails.\n", encoding="utf-8")
    page = parse_page(page_path, tmp_path)
    assert page.title == "Battery Life"


def test_discover_pages_finds_all_markdown_files(tmp_path: Path):
    (tmp_path / "a.md").write_text("# A\n", encoding="utf-8")
    (tmp_path / "b.md").write_text("# B\n", encoding="utf-8")
    (tmp_path / "index.md").write_text("# Index\n", encoding="utf-8")
    pages = discover_pages(tmp_path)
    titles = {p.title for p in pages}
    assert titles == {"A", "B"}


def test_render_moc_body_includes_page_links():
    pages = [_page("MeshSync", "meshsync.md", ["meshsync"])]
    categories = {"Meshsync": pages}
    body = render_moc_body(categories, total_pages=1)
    assert "[MeshSync](./meshsync.md)" in body
    assert "## Meshsync" in body


def test_render_moc_body_puts_general_reference_last():
    categories = {
        "General Reference": [_page("Z", "z.md", [])],
        "Meshsync": [_page("A", "a.md", ["meshsync"])],
        "Overview": [_page("Overview", "overview.md", [], doc_id="overview")],
    }
    body = render_moc_body(categories, total_pages=3)
    overview_pos = body.index("## Overview")
    meshsync_pos = body.index("## Meshsync")
    general_pos = body.index("## General Reference")
    assert overview_pos < meshsync_pos < general_pos
