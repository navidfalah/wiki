"""cli.py commands run in-process: input validation, delegation, and the
error envelope the backend's bridge maps to HTTP statuses."""

import io
import json
import sys

import pytest

import cli
import email_engine


def run(monkeypatch, command, payload=None):
    monkeypatch.setattr(sys, "stdin", io.StringIO("" if payload is None else json.dumps(payload)))
    return cli._run_command(command)


@pytest.fixture
def raw_dir(tmp_path, monkeypatch):
    d = tmp_path / "raw"
    d.mkdir()
    monkeypatch.setattr(email_engine, "RAW_DIR", d)
    return d


class TestEmailCommands:
    def test_create_update_detail_delete_round_trip(self, monkeypatch, raw_dir):
        created, code = run(monkeypatch, "email-create", {"subject": " Hello ", "from": "a@x", "to": ["b@x", " "], "cc": [], "body": "one"})
        assert code == 0 and created["subject"] == "Hello"
        assert created["to"] == ["b@x"]

        updated, code = run(monkeypatch, "email-update", {"path": created["path"], "subject": "Hello 2", "from": "a@x", "body": "two"})
        assert code == 0 and updated["subject"] == "Hello 2"

        detail, code = run(monkeypatch, "email-detail", {"path": created["path"]})
        assert code == 0 and "two" in detail["body"]

        listing, code = run(monkeypatch, "emails-list", {"include_body": True})
        assert listing["total"] == 1 and "two" in listing["emails"][0]["body"]

        deleted, code = run(monkeypatch, "email-delete", {"path": created["path"]})
        assert code == 0 and deleted["deleted"] is True

    @pytest.mark.parametrize(
        "command,payload,message",
        [
            ("email-create", {"from": "a@x"}, "'subject' is required"),
            ("email-create", {"subject": "s"}, "'from' is required"),
            ("email-update", {"subject": "s", "from": "a@x"}, "'path' is required"),
            ("email-delete", {}, "'path' is required"),
        ],
    )
    def test_required_fields(self, monkeypatch, raw_dir, command, payload, message):
        result, code = run(monkeypatch, command, payload)
        assert code == 1
        assert result == {"error": message}

    def test_error_types_let_the_backend_pick_404_or_400(self, monkeypatch, raw_dir):
        (raw_dir / "note.txt").write_text("x")
        missing, code = run(monkeypatch, "email-detail", {"path": "gone.eml"})
        assert code == 1 and missing["error_type"] == "not_found"
        not_email, code = run(monkeypatch, "email-detail", {"path": "note.txt"})
        assert code == 1 and not_email["error_type"] == "not_an_email"


class TestChatCommands:
    def test_chat_requires_a_message(self, monkeypatch):
        result, code = run(monkeypatch, "chat", {"message": "   "})
        assert code == 1 and "'message' is required" in result["error"]

    def test_chat_passes_history_scope_and_corpus_through(self, monkeypatch):
        seen = {}

        def fake_answer(message, history=None, doc_scope=None, source="wiki"):
            seen.update(message=message, history=history, doc_scope=doc_scope, source=source)
            return {"answer": "42", "sources": []}

        monkeypatch.setattr(cli.rag_engine, "answer_question", fake_answer)
        result, code = run(monkeypatch, "chat", {"message": " why? ", "history": [{"role": "user", "content": "hi"}], "doc_scope": ["a.md"], "corpus_source": "raw"})
        assert code == 0 and result["answer"] == "42"
        assert seen == {"message": "why?", "history": [{"role": "user", "content": "hi"}], "doc_scope": ["a.md"], "source": "raw"}

    def test_chat_stream_writes_one_json_event_per_line(self, monkeypatch, capsys):
        def fake_stream(message, **_):
            yield {"type": "token", "text": "Hel"}
            yield {"type": "token", "text": "lo ü"}
            yield {"type": "done"}

        monkeypatch.setattr(cli.rag_engine, "answer_question_stream", fake_stream)
        monkeypatch.setattr(sys, "stdin", io.StringIO(json.dumps({"message": "q"})))
        monkeypatch.setattr(sys, "argv", ["cli.py", "chat-stream"])
        assert cli.main() == 0
        lines = capsys.readouterr().out.strip().splitlines()
        assert [json.loads(line)["type"] for line in lines] == ["token", "token", "done"]
        assert "ü" in lines[1]  # not \u-escaped

    def test_chat_stream_reports_failures_as_a_final_error_event(self, monkeypatch, capsys):
        def broken(message, **_):
            yield {"type": "token", "text": "a"}
            raise RuntimeError("model went away")

        monkeypatch.setattr(cli.rag_engine, "answer_question_stream", broken)
        monkeypatch.setattr(sys, "stdin", io.StringIO(json.dumps({"message": "q"})))
        cli.cmd_chat_stream()
        events = [json.loads(line) for line in capsys.readouterr().out.strip().splitlines()]
        assert events[-1] == {"type": "error", "message": "model went away"}

    def test_chat_stream_without_a_message_is_an_error_event(self, monkeypatch, capsys):
        monkeypatch.setattr(sys, "stdin", io.StringIO("{}"))
        cli.cmd_chat_stream()
        assert json.loads(capsys.readouterr().out) == {"type": "error", "message": "'message' is required"}

    def test_chat_status_counts_the_corpus(self, monkeypatch):
        passage = type("P", (), {"doc_path": "a.md"})
        monkeypatch.setattr(cli.rag_engine, "build_corpus", lambda: [passage(), passage()])
        monkeypatch.setattr(cli.synthesizer, "discover_raw_source_files", lambda: ["x", "y", "z"])
        result, code = run(monkeypatch, "chat-status")
        assert code == 0
        assert result["corpus_pages"] == 1 and result["corpus_passages"] == 2 and result["raw_source_files"] == 3
        assert isinstance(result["llm_available"], bool)


class FakeConnectors:
    """Stands in for connectors_service; records every call."""

    class ConnectorNotConnectedError(Exception):
        pass

    class ConnectorConfigError(Exception):
        pass

    def __init__(self):
        self.calls = []

    def __getattr__(self, name):
        def record(*args, **kwargs):
            self.calls.append((name, args, kwargs))
            return {"ok": name}

        return record

    def list_items(self, *args, **kwargs):
        self.calls.append(("list_items", args, kwargs))
        return [{"id": "1"}]


@pytest.fixture
def connectors(monkeypatch):
    fake = FakeConnectors()
    monkeypatch.setattr(cli, "_connectors", lambda: fake)
    monkeypatch.setitem(sys.modules, "connectors_service", fake)
    return fake


class TestConnectorCommands:
    def test_oauth_callback_validates_then_delegates(self, monkeypatch, connectors):
        for missing, payload in [
            ("connector_id", {}),
            ("code", {"connector_id": "gmail"}),
            ("state", {"connector_id": "gmail", "code": "c"}),
        ]:
            result, code = run(monkeypatch, "connectors-oauth-callback", payload)
            assert code == 1 and result["error"] == f"'{missing}' is required"
        result, code = run(monkeypatch, "connectors-oauth-callback", {"connector_id": "gmail", "code": "c", "state": "s", "account_label": " me "})
        assert code == 0
        assert connectors.calls[-1] == ("complete_authorization", ("gmail", "c", "s", "me"), {})

    def test_connect_commands_apply_defaults(self, monkeypatch, connectors):
        run(monkeypatch, "connectors-imap-connect", {"account_label": "work", "host": "imap.x", "password": "pw"})
        assert connectors.calls[-1] == ("connect_imap", ("work", "imap.x", "pw"), {"port": 993, "mailbox": "INBOX"})
        run(monkeypatch, "connectors-postgres-connect", {"account_label": "db", "host": "h", "password": "p", "dbname": "d", "user": "u"})
        assert connectors.calls[-1] == ("connect_postgres", ("db", "h", "p"), {"port": 5432, "dbname": "d", "user": "u", "schema": "public"})
        run(monkeypatch, "connectors-sqlite-connect", {"account_label": "local", "db_path": " /tmp/x.db "})
        assert connectors.calls[-1] == ("connect_sqlite", ("local", "/tmp/x.db"), {})
        run(monkeypatch, "connectors-ensure-defaults")
        assert connectors.calls[-1][0] == "ensure_default_connections"

    def test_items_list_import_and_disconnect_validate(self, monkeypatch, connectors):
        assert run(monkeypatch, "connectors-items-list", {"connector_id": "gmail"})[0]["error"] == "'account_label' is required"
        result, code = run(monkeypatch, "connectors-items-list", {"connector_id": "gmail", "account_label": "me", "query": "q"})
        assert code == 0 and result == {"items": [{"id": "1"}]}
        assert connectors.calls[-1][2] == {"query": "q", "limit": 20}

        assert run(monkeypatch, "connectors-item-import", {"connector_id": "gmail", "account_label": "me"})[0]["error"] == "'item_id' is required"
        run(monkeypatch, "connectors-item-import", {"connector_id": "gmail", "account_label": "me", "item_id": "42", "item_title": "T"})
        assert connectors.calls[-1] == ("import_item", ("gmail", "me", "42"), {"item_title": "T"})

        assert run(monkeypatch, "connectors-disconnect", {"account_label": "me"})[0]["error"] == "'connector_id' is required"
        run(monkeypatch, "connectors-disconnect", {"connector_id": "gmail", "account_label": "me"})
        assert connectors.calls[-1] == ("disconnect", ("gmail", "me"), {})

    def test_connector_errors_carry_an_error_type(self, monkeypatch, connectors):
        def not_connected(*_a, **_k):
            raise FakeConnectors.ConnectorNotConnectedError("connect first")

        def not_configured(*_a, **_k):
            raise FakeConnectors.ConnectorConfigError("set GMAIL_CLIENT_ID")

        monkeypatch.setattr(connectors, "disconnect", not_connected, raising=False)
        result, _ = run(monkeypatch, "connectors-disconnect", {"connector_id": "gmail", "account_label": "me"})
        assert result == {"error": "connect first", "error_type": "not_connected"}
        monkeypatch.setattr(connectors, "start_authorization", not_configured, raising=False)
        result, _ = run(monkeypatch, "connectors-oauth-start", {"connector_id": "gmail"})
        assert result == {"error": "set GMAIL_CLIENT_ID", "error_type": "not_configured"}


class TestEntryPoint:
    def test_usage_error_lists_the_commands(self, monkeypatch, capsys):
        monkeypatch.setattr(sys, "argv", ["cli.py", "nope"])
        assert cli.main() == 1
        assert "emails-list" in json.loads(capsys.readouterr().out)["error"]

    def test_one_shot_prints_one_json_result(self, monkeypatch, capsys, raw_dir):
        monkeypatch.setattr(sys, "argv", ["cli.py", "emails-list"])
        monkeypatch.setattr(sys, "stdin", io.StringIO(""))
        assert cli.main() == 0
        assert json.loads(capsys.readouterr().out) == {"total": 0, "emails": []}

    def test_empty_stdin_means_no_input(self, monkeypatch):
        monkeypatch.setattr(sys, "stdin", io.StringIO("   \n"))
        assert cli._read_stdin_json() == {}
