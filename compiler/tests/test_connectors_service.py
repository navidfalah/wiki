import pytest

import connectors_service as svc
from connectors.credential_store import CredentialStore, generate_secret_key
from connectors.credentials import ConnectorCredentials


class FakeHttpPost:
    def __init__(self, response):
        self.response = response
        self.calls = []

    def __call__(self, url, headers, data):
        self.calls.append((url, headers, data))
        return self.response


class FakeHttpGet:
    def __init__(self, responses):
        self.responses = list(responses)
        self.calls = []

    def __call__(self, url, headers, params):
        self.calls.append((url, headers, params))
        return self.responses.pop(0)


class FakeImapClient:
    def __init__(self, host, port):
        self.host = host
        self.port = port
        self.logged_out = False

    def login(self, user, password):
        return ("OK", [])

    def select(self, mailbox):
        return ("OK", [])

    def search(self, charset, criteria):
        return ("OK", [b"1"])

    def fetch(self, message_id, parts):
        raw = b"Subject: hi\r\nFrom: a@b.com\r\n\r\nbody text"
        return ("OK", [(b"1 (BODY)", raw)])

    def logout(self):
        self.logged_out = True
        return ("BYE", [])


@pytest.fixture(autouse=True)
def isolated_env(tmp_path, monkeypatch):
    """Every test gets its own credential store, pending-OAuth dir, and
    import dir -- none of this should ever touch the real data/ tree."""
    store = CredentialStore(store_dir=tmp_path / "store", secret_key=generate_secret_key())
    monkeypatch.setattr(svc, "_credential_store", lambda: store)
    monkeypatch.setattr(svc, "PENDING_DIR", tmp_path / "pending")
    monkeypatch.setattr(svc, "IMPORT_DIR", tmp_path / "raw" / "connectors")
    monkeypatch.setenv("CONNECTOR_SECRET_KEY", "unused-because-store-is-injected")
    for var in ("GMAIL_CLIENT_ID", "GMAIL_CLIENT_SECRET", "GMAIL_REDIRECT_URI", "GDRIVE_CLIENT_ID", "GDRIVE_CLIENT_SECRET", "GDRIVE_REDIRECT_URI"):
        monkeypatch.delenv(var, raising=False)
    yield store


def _configure_gmail_env(monkeypatch):
    monkeypatch.setenv("GMAIL_CLIENT_ID", "cid")
    monkeypatch.setenv("GMAIL_CLIENT_SECRET", "csecret")
    monkeypatch.setenv("GMAIL_REDIRECT_URI", "https://app.example.com/callback")


def test_catalog_lists_all_known_connectors_unconfigured_by_default():
    entries = svc.catalog()
    ids = [e["id"] for e in entries]
    assert ids == ["gmail", "google_drive", "imap"]
    gmail_entry = next(e for e in entries if e["id"] == "gmail")
    assert gmail_entry["configured"] is False
    assert gmail_entry["connected_accounts"] == []
    imap_entry = next(e for e in entries if e["id"] == "imap")
    assert imap_entry["requires_oauth"] is False
    assert imap_entry["configured"] is True  # IMAP needs no env vars, only a per-account connect


def test_catalog_reports_configured_once_env_vars_are_set(monkeypatch):
    _configure_gmail_env(monkeypatch)
    entries = svc.catalog()
    assert next(e for e in entries if e["id"] == "gmail")["configured"] is True
    assert next(e for e in entries if e["id"] == "google_drive")["configured"] is False


def test_start_authorization_requires_configured_env(monkeypatch):
    with pytest.raises(svc.ConnectorConfigError):
        svc.start_authorization("gmail")


def test_start_authorization_builds_url_and_stashes_pending_state(monkeypatch):
    _configure_gmail_env(monkeypatch)
    result = svc.start_authorization("gmail")
    assert "code_challenge=" in result["authorization_url"]
    assert result["state"]
    assert svc._load_pending("gmail", result["state"]) is not None


def test_complete_authorization_rejects_unknown_state(monkeypatch):
    _configure_gmail_env(monkeypatch)
    with pytest.raises(ValueError, match="Unknown or expired"):
        svc.complete_authorization("gmail", code="abc", returned_state="never-started", account_label="me@example.com")


def test_complete_authorization_saves_credentials_and_consumes_pending_state(monkeypatch, isolated_env):
    _configure_gmail_env(monkeypatch)
    started = svc.start_authorization("gmail")

    http_post = FakeHttpPost({"access_token": "tok123", "refresh_token": "reftok", "expires_in": 3600})
    result = svc.complete_authorization(
        "gmail", code="authcode", returned_state=started["state"], account_label="me@example.com", http_post=http_post
    )

    assert result == {"connected": True, "connector_id": "gmail", "account_label": "me@example.com"}
    saved = isolated_env.load("gmail", "me@example.com")
    assert saved.access_token == "tok123"
    assert saved.refresh_token == "reftok"
    # the pending state is single-use
    assert svc._load_pending("gmail", started["state"]) is None


def test_connect_imap_stores_host_and_mailbox_in_extra(isolated_env):
    result = svc.connect_imap("me@example.com", host="imap.example.com", password="app-pw", mailbox="Archive")
    assert result == {"connected": True, "connector_id": "imap", "account_label": "me@example.com"}
    saved = isolated_env.load("imap", "me@example.com")
    assert saved.password == "app-pw"
    assert saved.extra == {"host": "imap.example.com", "port": 993, "mailbox": "Archive"}


def test_connect_imap_requires_password():
    with pytest.raises(ValueError, match="password"):
        svc.connect_imap("me@example.com", host="imap.example.com", password="")


def test_list_items_raises_when_not_connected():
    with pytest.raises(svc.ConnectorNotConnectedError):
        svc.list_items("gmail", "me@example.com")


def test_list_items_for_gmail_uses_stored_token(monkeypatch, isolated_env):
    _configure_gmail_env(monkeypatch)
    isolated_env.save(ConnectorCredentials(connector_id="gmail", account_label="me@example.com", access_token="tok", refresh_token="ref"))
    http_get = FakeHttpGet(
        [
            {"messages": [{"id": "m1"}]},
            {"id": "m1", "threadId": "t1", "snippet": "hi", "payload": {"headers": [{"name": "Subject", "value": "Hello"}]}},
        ]
    )
    items = svc.list_items("gmail", "me@example.com", http_get=http_get, http_post=FakeHttpPost({}))
    assert items == [
        {"id": "m1", "title": "Hello", "snippet": "hi", "source_url": "https://mail.google.com/mail/u/0/#inbox/m1", "metadata": {"threadId": "t1"}}
    ]


def test_list_items_refreshes_an_expired_token_and_persists_it(monkeypatch, isolated_env):
    _configure_gmail_env(monkeypatch)
    isolated_env.save(
        ConnectorCredentials(connector_id="gmail", account_label="me@example.com", access_token="stale", refresh_token="ref", expires_at=1.0)
    )
    http_post = FakeHttpPost({"access_token": "fresh-token", "expires_in": 3600})
    http_get = FakeHttpGet([{"messages": []}])

    svc.list_items("gmail", "me@example.com", http_get=http_get, http_post=http_post)

    assert isolated_env.load("gmail", "me@example.com").access_token == "fresh-token"
    # the refreshed access token, not the stale one, is what reached the API
    assert http_get.calls[0][1]["Authorization"] == "Bearer fresh-token"


def test_import_item_writes_a_txt_file_under_data_raw_connectors(monkeypatch, isolated_env):
    _configure_gmail_env(monkeypatch)
    isolated_env.save(ConnectorCredentials(connector_id="gmail", account_label="me@example.com", access_token="tok"))
    http_get = FakeHttpGet([{"payload": {"mimeType": "text/plain", "body": {"data": "aGVsbG8"}}}])

    result = svc.import_item("gmail", "me@example.com", "m1", item_title="Kickoff notes", http_get=http_get)

    assert result["imported"] is True
    written = svc.IMPORT_DIR / "gmail" / "me-example.com"
    files = list(written.glob("*.txt"))
    assert len(files) == 1
    content = files[0].read_text(encoding="utf-8")
    assert "hello" in content
    assert "Kickoff notes" in content
    assert "Imported via Gmail connector" in content


def test_import_item_for_imap_uses_injected_client_factory(isolated_env):
    svc.connect_imap("me@example.com", host="imap.example.com", password="app-pw")
    result = svc.import_item("imap", "me@example.com", "1", imap_client_factory=lambda host, port: FakeImapClient(host, port))
    assert result["imported"] is True
    content = (svc.IMPORT_DIR / "imap" / "me-example.com").glob("*.txt")
    assert "body text" in next(content).read_text(encoding="utf-8")


def test_disconnect_removes_stored_credentials(isolated_env):
    svc.connect_imap("me@example.com", host="imap.example.com", password="app-pw")
    result = svc.disconnect("imap", "me@example.com")
    assert result["disconnected"] is True
    assert isolated_env.load("imap", "me@example.com") is None


def test_disconnect_missing_account_is_not_an_error(isolated_env):
    result = svc.disconnect("imap", "nobody@example.com")
    assert result["disconnected"] is False
