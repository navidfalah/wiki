"""SQLite connector + the bundled sample database, against real temp files."""

import sqlite3

import pytest

from connectors.sample_data import FIELD_DEVICES, SUPPORT_TICKETS, seed_sample_sqlite_db
from connectors.sqlite_db import MAX_ROWS_PER_TABLE, SqliteConnector


@pytest.fixture
def sample_db(tmp_path):
    path = tmp_path / "nested" / "sample.sqlite"
    assert seed_sample_sqlite_db(path) is True
    return path


def test_seeding_is_idempotent(sample_db):
    assert seed_sample_sqlite_db(sample_db) is False
    with sqlite3.connect(sample_db) as conn:
        assert conn.execute("SELECT COUNT(*) FROM field_devices").fetchone()[0] == len(FIELD_DEVICES)
        assert conn.execute("SELECT COUNT(*) FROM support_tickets").fetchone()[0] == len(SUPPORT_TICKETS)


def test_lists_tables_with_column_and_row_counts(sample_db):
    items = SqliteConnector(str(sample_db)).list_items()
    assert [i.id for i in items] == ["field_devices", "support_tickets"]
    devices = items[0]
    assert devices.metadata["row_count"] == len(FIELD_DEVICES)
    assert devices.metadata["columns"][:2] == ["id", "serial"]
    assert devices.snippet == f"6 columns · {len(FIELD_DEVICES)} rows"


def test_filters_by_name_and_limits(sample_db):
    connector = SqliteConnector(str(sample_db))
    assert [i.id for i in connector.list_items(query="TICKET")] == ["support_tickets"]
    assert len(connector.list_items(limit=1)) == 1
    assert connector.list_items(query="nothing-matches") == []


def test_fetch_renders_a_markdown_table(sample_db):
    md = SqliteConnector(str(sample_db)).fetch_item("support_tickets")
    lines = md.splitlines()
    assert lines[0] == "# support_tickets"
    assert lines[4].startswith("| id | device_serial | status")
    assert lines[5].startswith("| --- |")
    assert len(lines) == 6 + len(SUPPORT_TICKETS)
    assert "BEE-WR-2026-03" in md


def test_fetch_escapes_pipes_newlines_and_nulls_and_caps_rows(tmp_path):
    path = tmp_path / "odd.db"
    with sqlite3.connect(path) as conn:
        conn.execute('CREATE TABLE "we""ird" (a TEXT, b TEXT)')
        conn.executemany('INSERT INTO "we""ird" VALUES (?, ?)', [("x|y", "line1\nline2"), (None, "ok")] + [("r", "r")] * (MAX_ROWS_PER_TABLE + 5))
    md = SqliteConnector(str(path)).fetch_item('we"ird')
    assert "| x\\|y | line1 line2 |" in md
    assert "|  | ok |" in md
    assert md.count("\n| r | r |") == MAX_ROWS_PER_TABLE - 2


def test_unknown_table_and_hostile_names_are_rejected(sample_db):
    connector = SqliteConnector(str(sample_db))
    with pytest.raises(ValueError, match="Table not found"):
        connector.fetch_item("missing")
    with pytest.raises(ValueError, match="Table not found"):
        connector.fetch_item('field_devices"; DROP TABLE field_devices; --')
    assert [i.id for i in connector.list_items()] == ["field_devices", "support_tickets"]


def test_requires_a_path():
    with pytest.raises(ValueError):
        SqliteConnector("")


def test_uses_the_injected_client_and_always_closes_it():
    events = []

    class Cursor:
        def execute(self, query, params=()):
            events.append(("execute", query.split()[0]))

        def fetchall(self):
            return []

        def close(self):
            events.append("cursor.close")

    class Conn:
        def cursor(self):
            return Cursor()

        def close(self):
            events.append("conn.close")

    connector = SqliteConnector("/virtual.db", client_factory=lambda p: Conn())
    assert connector.list_items() == []
    with pytest.raises(ValueError):
        connector.fetch_item("t")
    assert events.count("conn.close") == 2 and events.count("cursor.close") == 2
