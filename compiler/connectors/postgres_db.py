"""PostgreSQL connector -- pulls table contents out of a user's own
Postgres database (their production DB, or the sample database this
project can spin up via `docker compose up`; see docker/postgres/init.sql)
and into the wiki's knowledge base.

Like ImapConnector, this authenticates with a plain username/password (no
OAuth dance) and takes its database client via an injectable
`client_factory` (default: a thin wrapper around `psycopg2.connect`) so
tests substitute a fake DB-API connection and never touch a real
database -- same seam `imap_email.py` uses for `imaplib`.

"Items" here are tables (`list_items`) rather than emails; "fetching" one
(`fetch_item`) reads its rows and renders them as a Markdown table, which
is what ends up under `data/raw/connectors/postgres/...` and from there
flows through the normal compile pipeline (extraction -> synthesis ->
linking) like any other raw source.
"""

from __future__ import annotations

from collections.abc import Callable
from typing import Protocol

from connectors.base import Connector, ConnectorItem
from connectors.credentials import ConnectorCredentials

# Caps how much of one table gets pulled into a single raw file -- this is
# a knowledge-ingestion connector, not a data export tool, so a table with
# millions of rows still produces one bounded, LLM-chunkable document.
MAX_ROWS_PER_TABLE = 200


class PgCursor(Protocol):
    def execute(self, query: str, params: tuple = ()) -> None: ...
    def fetchall(self) -> list[tuple]: ...
    def close(self) -> None: ...


class PgConnection(Protocol):
    def cursor(self) -> PgCursor: ...
    def close(self) -> None: ...


ClientFactory = Callable[..., PgConnection]


def _default_client_factory(host: str, port: int, dbname: str, user: str, password: str) -> PgConnection:
    import psycopg2

    return psycopg2.connect(host=host, port=port, dbname=dbname, user=user, password=password, connect_timeout=10)


def _quote_identifier(name: str) -> str:
    """Standard SQL double-quote escaping. Only ever called on a
    schema/table name that has just been round-tripped through
    information_schema in the same connection -- i.e. confirmed to name a
    real object -- so this is defense in depth against a stray quote
    character, not the only guard against injection."""
    return '"' + name.replace('"', '""') + '"'


def _render_markdown_table(schema: str, table: str, columns: list[str], rows: list[tuple]) -> str:
    lines = [
        f"# {schema}.{table}",
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


class PostgresConnector(Connector):
    connector_id = "postgres"

    def __init__(
        self,
        host: str,
        credentials: ConnectorCredentials,
        port: int = 5432,
        dbname: str = "",
        user: str = "",
        schema: str = "public",
        client_factory: ClientFactory = _default_client_factory,
    ):
        if not credentials.password:
            raise ValueError("PostgresConnector requires a password")
        if not dbname:
            raise ValueError("PostgresConnector requires a database name")
        if not user:
            raise ValueError("PostgresConnector requires a user")
        self.host = host
        self.port = port
        self.dbname = dbname
        self.user = user
        self.schema = schema or "public"
        self._credentials = credentials
        self._client_factory = client_factory

    def _connect(self) -> PgConnection:
        return self._client_factory(
            host=self.host,
            port=self.port,
            dbname=self.dbname,
            user=self.user,
            password=self._credentials.password,
        )

    def list_items(self, query: str = "", limit: int = 20) -> list[ConnectorItem]:
        """Lists tables in `self.schema` (optionally filtered by a
        case-insensitive substring match on the table name), each
        annotated with its column and row counts."""
        conn = self._connect()
        try:
            cur = conn.cursor()
            try:
                cur.execute(
                    "SELECT table_name FROM information_schema.tables "
                    "WHERE table_schema = %s AND table_type = 'BASE TABLE' "
                    "AND (%s = '' OR table_name ILIKE %s) "
                    "ORDER BY table_name LIMIT %s",
                    (self.schema, query, f"%{query}%", limit),
                )
                tables = [row[0] for row in cur.fetchall()]

                items = []
                for table in tables:
                    cur.execute(
                        "SELECT column_name FROM information_schema.columns "
                        "WHERE table_schema = %s AND table_name = %s ORDER BY ordinal_position",
                        (self.schema, table),
                    )
                    columns = [row[0] for row in cur.fetchall()]

                    qualified = f"{_quote_identifier(self.schema)}.{_quote_identifier(table)}"
                    cur.execute(f"SELECT COUNT(*) FROM {qualified}")
                    row_count = cur.fetchall()[0][0]

                    items.append(
                        ConnectorItem(
                            id=f"{self.schema}.{table}",
                            title=table,
                            snippet=f"{len(columns)} columns · {row_count} rows",
                            metadata={"schema": self.schema, "columns": columns, "row_count": row_count},
                        )
                    )
                return items
            finally:
                cur.close()
        finally:
            conn.close()

    def fetch_item(self, item_id: str) -> str:
        """`item_id` is `schema.table` (as returned by list_items). Reads
        up to MAX_ROWS_PER_TABLE rows and renders them as a Markdown
        table -- plain text, so it flows through the same `.txt`/`.md`
        scan of `data/raw/` every other connector's import uses."""
        schema, _, table = item_id.partition(".")
        if not table:
            schema, table = self.schema, item_id

        conn = self._connect()
        try:
            cur = conn.cursor()
            try:
                cur.execute(
                    "SELECT column_name FROM information_schema.columns "
                    "WHERE table_schema = %s AND table_name = %s ORDER BY ordinal_position",
                    (schema, table),
                )
                columns = [row[0] for row in cur.fetchall()]
                if not columns:
                    raise ValueError(f"Table not found: {schema}.{table}")

                qualified = f"{_quote_identifier(schema)}.{_quote_identifier(table)}"
                cur.execute(f"SELECT * FROM {qualified} LIMIT {MAX_ROWS_PER_TABLE}")
                rows = cur.fetchall()
                return _render_markdown_table(schema, table, columns, rows)
            finally:
                cur.close()
        finally:
            conn.close()
