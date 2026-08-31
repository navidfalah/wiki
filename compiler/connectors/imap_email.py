"""IMAP connector for email providers without an OAuth2 API (or where the
user prefers an app password) — e.g. self-hosted mail, some ISPs.

Uses stdlib `imaplib`/`email` only. Authentication should use a
provider-issued **app password**, never the account's main password —
that's a user-side setup step this module can't enforce, so it's called
out in `documentation/34-external-connectors.md`.

The IMAP client is created via an injectable `client_factory` (default:
`imaplib.IMAP4_SSL`) so tests substitute a fake client and never touch a
real mail server.
"""

from __future__ import annotations

import email
from collections.abc import Callable
from email.header import decode_header
from typing import Protocol

from connectors.base import Connector, ConnectorItem
from connectors.credentials import ConnectorCredentials


class ImapClient(Protocol):
    def login(self, user: str, password: str) -> tuple: ...
    def select(self, mailbox: str) -> tuple: ...
    def search(self, charset: str | None, criteria: str) -> tuple: ...
    def fetch(self, message_id: bytes, parts: str) -> tuple: ...
    def logout(self) -> tuple: ...


ClientFactory = Callable[[str, int], ImapClient]


def _default_client_factory(host: str, port: int) -> ImapClient:
    import imaplib

    return imaplib.IMAP4_SSL(host, port)


def _decode(raw: str | None) -> str:
    if not raw:
        return ""
    parts = decode_header(raw)
    decoded = []
    for text, charset in parts:
        if isinstance(text, bytes):
            decoded.append(text.decode(charset or "utf-8", errors="replace"))
        else:
            decoded.append(text)
    return "".join(decoded)


class ImapConnector(Connector):
    connector_id = "imap"

    def __init__(
        self,
        host: str,
        credentials: ConnectorCredentials,
        port: int = 993,
        mailbox: str = "INBOX",
        client_factory: ClientFactory = _default_client_factory,
    ):
        if not credentials.password:
            raise ValueError("ImapConnector requires a password (an app password, not the account's main password)")
        self.host = host
        self.port = port
        self.mailbox = mailbox
        self._credentials = credentials
        self._client_factory = client_factory

    def _connect(self) -> ImapClient:
        client = self._client_factory(self.host, self.port)
        client.login(self._credentials.account_label, self._credentials.password)
        client.select(self.mailbox)
        return client

    def list_items(self, query: str = "", limit: int = 20) -> list[ConnectorItem]:
        client = self._connect()
        try:
            criteria = f'TEXT "{query}"' if query else "ALL"
            _, data = client.search(None, criteria)
            message_ids = data[0].split() if data and data[0] else []
            message_ids = message_ids[-limit:]
            items = []
            for message_id in reversed(message_ids):
                _, fetched = client.fetch(message_id, "(BODY.PEEK[HEADER.FIELDS (SUBJECT FROM)])")
                raw = fetched[0][1] if fetched and fetched[0] else b""
                msg = email.message_from_bytes(raw if isinstance(raw, bytes) else raw.encode())
                items.append(
                    ConnectorItem(
                        id=message_id.decode("ascii"),
                        title=_decode(msg.get("Subject")),
                        snippet=_decode(msg.get("From")),
                        metadata={"mailbox": self.mailbox},
                    )
                )
            return items
        finally:
            client.logout()

    def fetch_item(self, item_id: str) -> str:
        client = self._connect()
        try:
            _, fetched = client.fetch(item_id.encode("ascii"), "(BODY.PEEK[])")
            raw = fetched[0][1] if fetched and fetched[0] else b""
            msg = email.message_from_bytes(raw if isinstance(raw, bytes) else raw.encode())
            if msg.is_multipart():
                for part in msg.walk():
                    if part.get_content_type() == "text/plain":
                        payload = part.get_payload(decode=True)
                        return payload.decode(part.get_content_charset() or "utf-8", errors="replace")
                return ""
            payload = msg.get_payload(decode=True)
            return payload.decode(msg.get_content_charset() or "utf-8", errors="replace") if payload else ""
        finally:
            client.logout()
