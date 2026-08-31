"""Common interface every connector implements."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field


@dataclass(frozen=True)
class ConnectorItem:
    """One fetchable item from an external app (an email, a Drive file, ...)."""

    id: str
    title: str
    snippet: str
    source_url: str = ""
    metadata: dict = field(default_factory=dict)


class Connector(ABC):
    """Base class for a connection to one external app.

    Implementations must not perform network I/O in `__init__` — all
    network calls happen in `list_items`/`fetch_item`, through an
    injected HTTP callable, so tests can substitute fakes.
    """

    connector_id: str

    @abstractmethod
    def list_items(self, query: str = "", limit: int = 20) -> list[ConnectorItem]:
        """Return up to `limit` items matching `query` (empty = recent items)."""

    @abstractmethod
    def fetch_item(self, item_id: str) -> str:
        """Return the full text content of one item."""
