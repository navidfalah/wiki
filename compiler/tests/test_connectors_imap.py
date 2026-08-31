import pytest

from connectors.credentials import ConnectorCredentials
from connectors.imap_email import ImapConnector


class FakeImapClient:
    def __init__(self, host, port):
        self.host = host
        self.port = port
        self.logged_out = False
        self.selected = None

    def login(self, user, password):
        self.user = user
        self.password = password
        return ("OK", [])

    def select(self, mailbox):
        self.selected = mailbox
        return ("OK", [])

    def search(self, charset, criteria):
        self.last_criteria = criteria
        return ("OK", [b"1 2"])

    def fetch(self, message_id, parts):
        if b"HEADER" in parts.encode():
            raw = (
                f"Subject: Msg {message_id.decode()}\r\nFrom: sender@example.com\r\n\r\n"
            ).encode()
            return ("OK", [(b"1", raw)])
        raw = b"Subject: Body\r\n\r\nThe full plain text body."
        return ("OK", [(b"1", raw)])

    def logout(self):
        self.logged_out = True
        return ("OK", [])


def _credentials():
    return ConnectorCredentials(connector_id="imap", account_label="me@example.com", password="app-pass-123")


def test_requires_password():
    creds = ConnectorCredentials(connector_id="imap", account_label="me@example.com")
    with pytest.raises(ValueError):
        ImapConnector(host="imap.example.com", credentials=creds, client_factory=FakeImapClient)


def test_list_items_returns_subjects_newest_first():
    connector = ImapConnector(host="imap.example.com", credentials=_credentials(), client_factory=FakeImapClient)
    items = connector.list_items(limit=10)
    assert len(items) == 2
    assert items[0].id == "2"
    assert "Msg 2" in items[0].title
    assert items[0].snippet == "sender@example.com"


def test_list_items_logs_out_client():
    clients = []

    def factory(host, port):
        client = FakeImapClient(host, port)
        clients.append(client)
        return client

    connector = ImapConnector(host="imap.example.com", credentials=_credentials(), client_factory=factory)
    connector.list_items()
    assert clients[0].logged_out is True


def test_fetch_item_returns_plain_text_body():
    connector = ImapConnector(host="imap.example.com", credentials=_credentials(), client_factory=FakeImapClient)
    text = connector.fetch_item("1")
    assert "full plain text body" in text


def test_uses_provided_mailbox():
    clients = []

    def factory(host, port):
        client = FakeImapClient(host, port)
        clients.append(client)
        return client

    connector = ImapConnector(
        host="imap.example.com", credentials=_credentials(), mailbox="Archive", client_factory=factory
    )
    connector.list_items()
    assert clients[0].selected == "Archive"
