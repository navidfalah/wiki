import pytest

from connectors.credentials import ConnectorCredentials
from connectors.postgres_db import PostgresConnector


class FakeCursor:
    def __init__(self, conn):
        self.conn = conn
        self._result: list[tuple] = []
        self.closed = False

    def execute(self, query, params=()):
        q = " ".join(query.split())
        if "information_schema.tables" in q:
            name_filter = params[1]
            self._result = [(t,) for t in self.conn.tables if not name_filter or name_filter.lower() in t.lower()]
        elif "information_schema.columns" in q:
            table = params[1]
            self._result = [(c,) for c in self.conn.columns.get(table, [])]
        elif q.startswith("SELECT COUNT(*)"):
            table = q.split(".")[-1].strip('"')
            self._result = [(len(self.conn.rows.get(table, [])),)]
        elif q.startswith("SELECT * FROM"):
            table = q.split("FROM")[1].split("LIMIT")[0].strip().split(".")[-1].strip('"')
            self._result = self.conn.rows.get(table, [])
        else:
            raise AssertionError(f"unexpected query: {q}")

    def fetchall(self):
        return self._result

    def close(self):
        self.closed = True


class FakeConnection:
    def __init__(self, host, port, dbname, user, password):
        self.host, self.port, self.dbname, self.user, self.password = host, port, dbname, user, password
        self.tables = ["employees", "projects"]
        self.columns = {"employees": ["id", "name"], "projects": ["id", "title"]}
        self.rows = {
            "employees": [(1, "Ada"), (2, "Grace")],
            "projects": [(1, "Nova Widget")],
        }
        self.closed = False

    def cursor(self):
        return FakeCursor(self)

    def close(self):
        self.closed = True


def _credentials():
    return ConnectorCredentials(connector_id="postgres", account_label="local", password="s3cret")


def _connector(**overrides):
    kwargs = dict(host="localhost", credentials=_credentials(), dbname="aurora_kb", user="wiki_reader", client_factory=FakeConnection)
    kwargs.update(overrides)
    return PostgresConnector(**kwargs)


def test_requires_password():
    creds = ConnectorCredentials(connector_id="postgres", account_label="local")
    with pytest.raises(ValueError):
        PostgresConnector(host="localhost", credentials=creds, dbname="db", user="u", client_factory=FakeConnection)


def test_requires_dbname_and_user():
    with pytest.raises(ValueError):
        PostgresConnector(host="localhost", credentials=_credentials(), dbname="", user="u", client_factory=FakeConnection)
    with pytest.raises(ValueError):
        PostgresConnector(host="localhost", credentials=_credentials(), dbname="db", user="", client_factory=FakeConnection)


def test_list_items_returns_tables_with_counts():
    connector = _connector()
    items = connector.list_items()
    assert [i.title for i in items] == ["employees", "projects"]
    assert items[0].id == "public.employees"
    assert "2 columns" in items[0].snippet
    assert "2 rows" in items[0].snippet
    assert items[1].metadata["row_count"] == 1


def test_list_items_filters_by_query():
    connector = _connector()
    items = connector.list_items(query="proj")
    assert [i.title for i in items] == ["projects"]


def test_fetch_item_renders_markdown_table():
    connector = _connector()
    text = connector.fetch_item("public.employees")
    assert "# public.employees" in text
    assert "| id | name |" in text
    assert "Ada" in text
    assert "Grace" in text


def test_fetch_item_unknown_table_raises():
    connector = _connector()
    with pytest.raises(ValueError):
        connector.fetch_item("public.does_not_exist")


def test_connect_closes_connection_and_cursor():
    connections: list[FakeConnection] = []

    def factory(host, port, dbname, user, password):
        conn = FakeConnection(host, port, dbname, user, password)
        connections.append(conn)
        return conn

    connector = _connector(client_factory=factory)
    connector.list_items()
    assert connections[0].closed is True
