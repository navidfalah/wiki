"""Shared types and path constants for the LLM Wiki compiler."""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = PROJECT_ROOT / "data" / "raw"
OUTPUT_DIR = PROJECT_ROOT / "wiki-app" / "docs"
STATE_FILE = PROJECT_ROOT / "data" / ".compiler-state.json"


@dataclass
class WikiPage:
    """A single wiki page to be written under wiki-app/docs/."""

    slug: str
    title: str
    page_type: str  # source | entity | concept | comparison | synthesis
    body: str
    tags: list[str] = field(default_factory=list)
    sources: list[str] = field(default_factory=list)
    summary: str = ""

    @property
    def doc_id(self) -> str:
        return self.slug.replace("/", "-")

    @property
    def relative_path(self) -> Path:
        return Path(f"{self.slug}.md")
