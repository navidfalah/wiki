"""Inject internal cross-links between wiki pages."""

from __future__ import annotations

import re

from models import WikiPage


def _link_map(pages: list[WikiPage]) -> dict[str, str]:
    """Map searchable terms → Docusaurus doc path."""
    mapping: dict[str, str] = {}
    for page in pages:
        doc_path = f"/docs/{page.slug}"
        mapping[page.title.lower()] = doc_path
        slug_tail = page.slug.split("/")[-1].replace("-", " ")
        mapping[slug_tail.lower()] = doc_path
        for tag in page.tags:
            if len(tag) > 3:
                mapping.setdefault(tag.lower(), doc_path)
    return mapping


def _replace_wikilinks(body: str) -> str:
    """Convert [[slug|label]] or [[slug]] to markdown links."""

    def repl(match: re.Match[str]) -> str:
        inner = match.group(1)
        if "|" in inner:
            target, label = inner.split("|", 1)
        else:
            target, label = inner, inner.split("/")[-1].replace("-", " ").title()
        href = f"/docs/{target.strip()}"
        return f"[{label.strip()}]({href})"

    return re.sub(r"\[\[([^\]]+)\]\]", repl, body)


def inject_cross_links(pages: list[WikiPage]) -> list[WikiPage]:
    """Add markdown links for known page titles found in body text."""
    link_map = _link_map(pages)
    sorted_terms = sorted(link_map.keys(), key=len, reverse=True)

    linked: list[WikiPage] = []
    for page in pages:
        body = _replace_wikilinks(page.body)

        for term in sorted_terms:
            href = link_map[term]
            if href == f"/docs/{page.slug}":
                continue
            pattern = re.compile(rf"(?<!\[)\b({re.escape(term)})\b(?!\]\()", re.IGNORECASE)
            body = pattern.sub(rf"[\1]({href})", body, count=1)

        page.body = body
        linked.append(page)

    return linked


def to_docusaurus_markdown(page: WikiPage) -> str:
    """Wrap page body with Docusaurus frontmatter."""
    tags_yaml = "\n".join(f"  - {t}" for t in page.tags) or "  - wiki"
    sources_yaml = "\n".join(f"  - {s}" for s in page.sources) or "  - none"
    return (
        f"---\n"
        f"id: {page.doc_id}\n"
        f"title: {page.title}\n"
        f"sidebar_label: {page.title}\n"
        f"slug: /{page.slug}\n"
        f"tags:\n{tags_yaml}\n"
        f"sources:\n{sources_yaml}\n"
        f"page_type: {page.page_type}\n"
        f"---\n\n"
        f"{page.body}\n"
    )
