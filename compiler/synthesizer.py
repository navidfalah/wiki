"""Summarization and topic extraction from raw markdown sources."""

from __future__ import annotations

import re
from pathlib import Path

from llm_client import LLMClient
from models import RAW_DIR, WikiPage

SYSTEM_PROMPT = """You are a wiki compiler. Given a raw markdown source, extract structured wiki content.
Return JSON only with this shape:
{
  "source_title": "string",
  "source_summary": "one line",
  "entities": [{"name": "...", "summary": "...", "tags": ["..."]}],
  "concepts": [{"name": "...", "summary": "...", "tags": ["..."]}],
  "key_points": ["bullet", "..."]
}
Use concise prose. Flag contradictions in key_points when present."""


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    return text.strip("-")[:80]


def _relative_raw_path(path: Path) -> str:
    return str(path.relative_to(RAW_DIR)).replace("\\", "/")


def _extract_title(content: str, fallback: str) -> str:
    for line in content.splitlines():
        if line.startswith("# "):
            return line[2:].strip()
    return fallback


def _extract_bold_terms(content: str) -> list[str]:
    terms = re.findall(r"\*\*([^*]+)\*\*", content)
    seen: set[str] = set()
    result: list[str] = []
    for term in terms:
        cleaned = term.strip()
        if len(cleaned) < 3 or cleaned.lower() in seen:
            continue
        seen.add(cleaned.lower())
        result.append(cleaned)
    return result[:12]


def _extract_headers(content: str) -> list[str]:
    headers: list[str] = []
    for line in content.splitlines():
        if line.startswith("## ") and not line.startswith("### "):
            headers.append(line[3:].strip())
    return headers


def synthesize_with_heuristics(raw_path: Path, content: str) -> list[WikiPage]:
    """Rule-based synthesis when no LLM API key is configured."""
    rel = _relative_raw_path(raw_path)
    stem = raw_path.stem
    title = _extract_title(content, stem)
    bold_terms = _extract_bold_terms(content)
    headers = _extract_headers(content)

    pages: list[WikiPage] = []

    key_points = []
    for header in headers[:6]:
        key_points.append(f"- **{header}** — mentioned in source")
    if not key_points:
        key_points.append("- Source ingested; see raw file for full content.")

    source_body = "\n".join(
        [
            f"# {title}",
            "",
            f"**Raw source:** `{rel}`",
            "",
            "## Summary",
            "",
            f"Auto-compiled from `{rel}`. Key terms: {', '.join(bold_terms[:5]) or 'none detected'}.",
            "",
            "## Key points",
            "",
            *key_points,
            "",
            "## Extracted terms",
            "",
            *[f"- {term}" for term in bold_terms],
        ]
    )
    pages.append(
        WikiPage(
            slug=f"sources/{stem}",
            title=title,
            page_type="source",
            body=source_body,
            tags=["auto-ingest"],
            sources=[rel],
            summary=f"Summary of {title}",
        )
    )

SKIP_ENTITY_TERMS = {
    "date",
    "author",
    "published",
    "last edited",
    "status",
    "location",
    "attendees",
    "type",
    "url",
    "blog",
    "mcu",
    "sensors",
    "battery",
    "mesh",
    "mission statement (draft)",
}


def _is_entity_candidate(term: str) -> bool:
    lower = term.lower().strip()
    if lower in SKIP_ENTITY_TERMS:
        return False
    if len(term) < 4:
        return False
    # Prefer proper nouns / product names
    keywords = ("labs", "widget", "chen", "park", "sensenode", "aurora", "nova", "mira", "jonah")
    if any(k in lower for k in keywords):
        return True
    return term[0].isupper() and " " in term

    for name in entity_candidates:
        slug = slugify(name)
        pages.append(
            WikiPage(
                slug=f"entities/{slug}",
                title=name,
                page_type="entity",
                body="\n".join(
                    [
                        f"# {name}",
                        "",
                        f"Entity extracted from [[sources/{stem}]].",
                        "",
                        "## Notes",
                        "",
                        f"Mentioned in `{rel}`. Run with OPENAI_API_KEY for richer synthesis.",
                    ]
                ),
                tags=["entity", "auto-ingest"],
                sources=[rel],
                summary=f"Entity: {name}",
            )
        )

    concept_candidates = [
        t
        for t in bold_terms
        if any(k in t.lower() for k in ("mesh", "battery", "protocol", "power", "sync"))
    ][:4]

    for name in concept_candidates:
        slug = slugify(name)
        pages.append(
            WikiPage(
                slug=f"concepts/{slug}",
                title=name,
                page_type="concept",
                body="\n".join(
                    [
                        f"# {name}",
                        "",
                        f"Concept extracted from [[sources/{stem}]].",
                        "",
                        "## Notes",
                        "",
                        f"Referenced in `{rel}`.",
                    ]
                ),
                tags=["concept", "auto-ingest"],
                sources=[rel],
                summary=f"Concept: {name}",
            )
        )

    return pages


def synthesize_with_llm(raw_path: Path, content: str, llm: LLMClient) -> list[WikiPage]:
    """LLM-powered synthesis with structured JSON output."""
    rel = _relative_raw_path(raw_path)
    stem = raw_path.stem
    data = llm.complete_json(
        SYSTEM_PROMPT,
        f"Raw file: {rel}\n\n---\n\n{content[:12000]}",
    )

    pages: list[WikiPage] = []
    source_title = data.get("source_title", stem)
    key_points = data.get("key_points", [])

    source_body = "\n".join(
        [
            f"# {source_title}",
            "",
            f"**Raw source:** `{rel}`",
            "",
            "## Summary",
            "",
            data.get("source_summary", ""),
            "",
            "## Key points",
            "",
            *[f"- {p}" for p in key_points],
        ]
    )
    pages.append(
        WikiPage(
            slug=f"sources/{stem}",
            title=source_title,
            page_type="source",
            body=source_body,
            tags=["llm-ingest"],
            sources=[rel],
            summary=data.get("source_summary", source_title),
        )
    )

    for entity in data.get("entities", []):
        name = entity["name"]
        slug = slugify(name)
        pages.append(
            WikiPage(
                slug=f"entities/{slug}",
                title=name,
                page_type="entity",
                body=f"# {name}\n\n{entity.get('summary', '')}\n\n## Sources\n\n- `{rel}`",
                tags=entity.get("tags", ["entity"]),
                sources=[rel],
                summary=entity.get("summary", name)[:120],
            )
        )

    for concept in data.get("concepts", []):
        name = concept["name"]
        slug = slugify(name)
        pages.append(
            WikiPage(
                slug=f"concepts/{slug}",
                title=name,
                page_type="concept",
                body=f"# {concept['name']}\n\n{concept.get('summary', '')}\n\n## Sources\n\n- `{rel}`",
                tags=concept.get("tags", ["concept"]),
                sources=[rel],
                summary=concept.get("summary", name)[:120],
            )
        )

    return pages


def synthesize_file(raw_path: Path, llm: LLMClient | None = None) -> list[WikiPage]:
    content = raw_path.read_text(encoding="utf-8")
    if llm and llm.available:
        return synthesize_with_llm(raw_path, content, llm)
    return synthesize_with_heuristics(raw_path, content)


def merge_pages(pages: list[WikiPage]) -> list[WikiPage]:
    """Merge pages that share the same slug, combining sources and body sections."""
    by_slug: dict[str, WikiPage] = {}
    for page in pages:
        existing = by_slug.get(page.slug)
        if existing is None:
            by_slug[page.slug] = page
            continue
        merged_sources = list(dict.fromkeys(existing.sources + page.sources))
        existing.sources = merged_sources
        existing.body += f"\n\n---\n\n_Update from {page.sources[-1]}_\n\n{page.body}"
        existing.tags = list(dict.fromkeys(existing.tags + page.tags))
    return list(by_slug.values())


def build_overview(pages: list[WikiPage]) -> WikiPage:
    entities = [p for p in pages if p.page_type == "entity"]
    concepts = [p for p in pages if p.page_type == "concept"]
    sources = [p for p in pages if p.page_type == "source"]

    lines = [
        "# Aurora Labs Wiki Overview",
        "",
        "Auto-generated synthesis of all compiled sources.",
        "",
        f"- **{len(sources)}** source summaries",
        f"- **{len(entities)}** entity pages",
        f"- **{len(concepts)}** concept pages",
        "",
        "## Entities",
        "",
        *[f"- [[{e.slug}|{e.title}]]" for e in entities[:10]],
        "",
        "## Concepts",
        "",
        *[f"- [[{c.slug}|{c.title}]]" for c in concepts[:10]],
    ]
    return WikiPage(
        slug="overview",
        title="Overview",
        page_type="synthesis",
        body="\n".join(lines),
        tags=["overview"],
        summary="High-level wiki overview",
    )


def build_index(pages: list[WikiPage]) -> WikiPage:
    sections: dict[str, list[WikiPage]] = {}
    for page in sorted(pages, key=lambda p: p.slug):
        bucket = page.page_type + "s" if not page.page_type.endswith("s") else page.page_type
        if page.slug == "index":
            continue
        sections.setdefault(bucket, []).append(page)

    lines = ["# Wiki Index", "", "Content catalog — start here when querying.", ""]
    for section, items in sorted(sections.items()):
        lines.append(f"## {section.title()}")
        lines.append("")
        for item in items:
            lines.append(f"- [[{item.slug}|{item.title}]] — {item.summary or item.title}")
        lines.append("")

    return WikiPage(
        slug="index",
        title="Index",
        page_type="synthesis",
        body="\n".join(lines),
        tags=["index"],
        summary="Master catalog of all wiki pages",
    )
