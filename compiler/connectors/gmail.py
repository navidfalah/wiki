"""Gmail connector: OAuth2 + Gmail REST API, read-only.

Requires `GMAIL_CLIENT_ID`/`GMAIL_CLIENT_SECRET` (a Google Cloud OAuth
client) and a redirect URI registered on that client. Uses the
`gmail.readonly` scope only — this connector cannot send, delete, or
modify mail.
"""

from __future__ import annotations

from collections.abc import Callable

from connectors.base import ConnectorItem
from connectors.http_transport import urllib_get
from connectors.oauth2 import OAuth2Config, OAuth2Connector

AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN_URL = "https://oauth2.googleapis.com/token"
API_BASE = "https://gmail.googleapis.com/gmail/v1/users/me"
SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]

HttpGet = Callable[[str, dict, dict], dict]


def build_config(client_id: str, client_secret: str, redirect_uri: str) -> OAuth2Config:
    return OAuth2Config(
        client_id=client_id,
        client_secret=client_secret,
        auth_url=AUTH_URL,
        token_url=TOKEN_URL,
        redirect_uri=redirect_uri,
        scopes=SCOPES,
    )


class GmailConnector(OAuth2Connector):
    connector_id = "gmail"

    def __init__(self, config: OAuth2Config, access_token: str, http_get: HttpGet = urllib_get, **kwargs):
        super().__init__(config, **kwargs)
        self._access_token = access_token
        self._http_get = http_get

    def _headers(self) -> dict:
        return {"Authorization": f"Bearer {self._access_token}"}

    def list_items(self, query: str = "", limit: int = 20) -> list[ConnectorItem]:
        params = {"maxResults": limit}
        if query:
            params["q"] = query
        listing = self._http_get(f"{API_BASE}/messages", self._headers(), params)
        items = []
        for message in listing.get("messages", []):
            detail = self._http_get(
                f"{API_BASE}/messages/{message['id']}",
                self._headers(),
                {"format": "metadata", "metadataHeaders": "Subject"},
            )
            headers = {h["name"]: h["value"] for h in detail.get("payload", {}).get("headers", [])}
            items.append(
                ConnectorItem(
                    id=detail["id"],
                    title=headers.get("Subject", "(no subject)"),
                    snippet=detail.get("snippet", ""),
                    source_url=f"https://mail.google.com/mail/u/0/#inbox/{detail['id']}",
                    metadata={"threadId": detail.get("threadId", "")},
                )
            )
        return items

    def fetch_item(self, item_id: str) -> str:
        detail = self._http_get(f"{API_BASE}/messages/{item_id}", self._headers(), {"format": "full"})
        return _extract_text(detail.get("payload", {}))


def _extract_text(payload: dict) -> str:
    import base64

    mime_type = payload.get("mimeType", "")
    body_data = payload.get("body", {}).get("data")
    if mime_type.startswith("text/") and body_data:
        padded = body_data + "=" * (-len(body_data) % 4)
        return base64.urlsafe_b64decode(padded).decode("utf-8", errors="replace")
    for part in payload.get("parts", []) or []:
        text = _extract_text(part)
        if text:
            return text
    return ""
