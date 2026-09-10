"""SQLite connector -- pulls table contents out of a local `.sqlite`/`.db`
file (the bundled sample database, or any file path the user points at)
and into the wiki's knowledge base.

No network, no server, no credentials beyond a file path -- simpler than
PostgresConnector (connectors/postgres_db.py), which this otherwise
mirrors: "items" are tables (`list_items`), and "fetching" one
(`fetch_item`) reads its rows and renders them as a Markdown table under
`data/raw/connectors/sqlite/...`, from there flowing through the normal
compile pipeline like any other raw source. Takes its DB client via an
injectable `client_factory` (default: `sqlite3.connect`) so tests
substitute a fake connection and never touch a real file, same seam
postgres_db.py/imap_email.py use.
"""

from __future__ import annotations

from collections.abc import Callable
from typing import Protocol

from connectors.base import Connector, ConnectorItem

# Same bound as PostgresConnector -- this is a knowledge-ingestion
# connector, not a data export tool.
MAX_ROWS_PER_TABLE = 200


class SqliteCursor(Protocol):
    def execute(self, query: str, params: tuple = ()) -> None: ...
    def fetchall(self) -> list[tuple]: ...
    def close(self) -> None: ...


class SqliteConnection(Protocol):
    def cursor(self) -> SqliteCursor: ...
    def close(self) -> None: ...


ClientFactory = Callable[[str], SqliteConnection]


def _default_client_factory(db_path: str) -> SqliteConnection:
    import sqlite3

    return sqlite3.connect(db_path)


def _quote_identifier(name: str) -> str:
    """Standard SQL double-quote escaping. Only ever called on a table
    name that has just been round-tripped through sqlite_master in the
    same connection -- i.e. confirmed to name a real object -- so this is
    defense in depth against a stray quote character, not the only guard
    against injection."""
    return '"' + name.replace('"', '""') + '"'


def _render_markdown_table(table: str, columns: list[str], rows: list[tuple]) -> str:
    lines = [
        f"# {table}",
        "",
        f"{len(rows)} row(s) shown (of up to {MAX_ROWS_PER_TABLE}), {len(columns)} column(s): {', '.join(columns)}",
        "",
        "| " + " | ".join(columns) + " |",
        "| " + " | ".join(["---"] * len(columns)) + " |",
    ]
    for row in rows:
        cells = ["" if value is None else str(value).replace("|", "\\|").replace("\n", " ") for value in row]
        lines.append("| " + " | ".join(cells) + " |")
    return "\n".join(lines)


class SqliteConnector(Connector):
    connector_id = "sqlite"

    def __init__(self, db_path: str, client_factory: ClientFactory = _default_client_factory):
        if not db_path:
            raise ValueError("SqliteConnector requires a database file path")
        self.db_path = db_path
        self._client_factory = client_factory

    def _connect(self) -> SqliteConnection:
        return self._client_factory(self.db_path)

    def list_items(self, query: str = "", limit: int = 20) -> list[ConnectorItem]:
        """Lists tables in the database (optionally filtered by a
        case-insensitive substring match on the table name), each
        annotated with its column and row counts."""
        conn = self._connect()
        try:
            cur = conn.cursor()
            try:
                cur.execute(
                    "SELECT name FROM sqlite_master WHERE type = 'table' "
                    "AND name NOT LIKE 'sqlite_%' AND (? = '' OR lower(name) LIKE ?) "
                    "ORDER BY name LIMIT ?",
                    (query, f"%{query.lower()}%", limit),
                )
                tables = [row[0] for row in cur.fetchall()]

                items = []
                for table in tables:
                    quoted = _quote_identifier(table)
                    cur.execute(f"PRAGMA table_info({quoted})")
                    columns = [row[1] for row in cur.fetchall()]

                    cur.execute(f"SELECT COUNT(*) FROM {quoted}")
                    row_count = cur.fetchall()[0][0]

                    items.append(
                        ConnectorItem(
                            id=table,
                            title=table,
                            snippet=f"{len(columns)} columns · {row_count} rows",
                            metadata={"columns": columns, "row_count": row_count},
                        )
                    )
                return items
            finally:
                cur.close()
        finally:
            conn.close()

    def fetch_item(self, item_id: str) -> str:
        """`item_id` is a table name (as returned by list_items). Reads up
        to MAX_ROWS_PER_TABLE rows and renders them as a Markdown table --
        plain text, so it flows through the same `.txt`/`.md` scan of
        `data/raw/` every other connector's import uses."""
        conn = self._connect()
        try:
            cur = conn.cursor()
            try:
                quoted = _quote_identifier(item_id)
                cur.execute(f"PRAGMA table_info({quoted})")
                columns = [row[1] for row in cur.fetchall()]
                if not columns:
                    raise ValueError(f"Table not found: {item_id}")

                cur.execute(f"SELECT * FROM {quoted} LIMIT {MAX_ROWS_PER_TABLE}")
                rows = cur.fetchall()
                return _render_markdown_table(item_id, columns, rows)
            finally:
                cur.close()
        finally:
            conn.close()
