"""Google Drive connector: OAuth2 + Drive API v3, read-only.

Requires `DRIVE_CLIENT_ID`/`DRIVE_CLIENT_SECRET`. Uses the
`drive.readonly` scope only — this connector cannot create, modify, or
delete files.
"""

from __future__ import annotations

from collections.abc import Callable

from connectors.base import ConnectorItem
from connectors.http_transport import urllib_get, urllib_get_raw
from connectors.oauth2 import OAuth2Config, OAuth2Connector

AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN_URL = "https://oauth2.googleapis.com/token"
API_BASE = "https://www.googleapis.com/drive/v3"
SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]

HttpGet = Callable[[str, dict, dict], dict]
HttpGetRaw = Callable[[str, dict, dict], str]


def build_config(client_id: str, client_secret: str, redirect_uri: str) -> OAuth2Config:
    return OAuth2Config(
        client_id=client_id,
        client_secret=client_secret,
        auth_url=AUTH_URL,
        token_url=TOKEN_URL,
        redirect_uri=redirect_uri,
        scopes=SCOPES,
    )


class DriveConnector(OAuth2Connector):
    connector_id = "google_drive"

    def __init__(
        self,
        config: OAuth2Config,
        access_token: str,
        http_get: HttpGet = urllib_get,
        http_get_text: HttpGetRaw = urllib_get_raw,
        **kwargs,
    ):
        super().__init__(config, **kwargs)
        self._access_token = access_token
        self._http_get = http_get
        self._http_get_text = http_get_text

    def _headers(self) -> dict:
        return {"Authorization": f"Bearer {self._access_token}"}

    def list_items(self, query: str = "", limit: int = 20) -> list[ConnectorItem]:
        params = {
            "pageSize": limit,
            "fields": "files(id,name,mimeType,webViewLink)",
        }
        if query:
            escaped = query.replace("'", "\\'")
            params["q"] = f"fullText contains '{escaped}' and trashed = false"
        listing = self._http_get(f"{API_BASE}/files", self._headers(), params)
        return [
            ConnectorItem(
                id=f["id"],
                title=f.get("name", "(untitled)"),
                snippet="",
                source_url=f.get("webViewLink", ""),
                metadata={"mimeType": f.get("mimeType", "")},
            )
            for f in listing.get("files", [])
        ]

    def fetch_item(self, item_id: str) -> str:
        # The /export endpoint returns the exported document's raw content
        # (plain text here, since we always ask for mimeType=text/plain) --
        # not JSON -- so this must not go through the JSON-decoding
        # http_get used by list_items.
        return self._http_get_text(
            f"{API_BASE}/files/{item_id}/export", self._headers(), {"mimeType": "text/plain"}
        )
