"""Wires the connectors/ package (task #34's tested, standalone primitive)
up to something actually callable end to end.

documentation/34-external-connectors.md named four concrete gaps between
"a tested primitive" and "connectors live": an OAuth redirect/callback
round trip, a way to list configured connectors and connected accounts, a
step that turns Connector.list_items()/fetch_item() output into a file
under data/raw/ so it flows through the normal compile pipeline, and token
refresh before each use. This module is that wiring; compiler/connectors/
itself is unchanged.

Every network call still happens inside connectors/*.py, through the same
injected-callable seams that package's tests substitute with fakes. Every
public function here accepts the same callables as optional keyword-only
overrides (default: None, meaning "use connectors/*.py's own real-network
default") so this module's own tests never touch a real network or IMAP
server either -- it only orchestrates: reads env vars, calls
CredentialStore, and calls Connector.list_items()/fetch_item().
"""

from __future__ import annotations

import json
import os
import re
import time
from dataclasses import asdict
from pathlib import Path

from connectors import gmail, google_drive
from connectors.credential_store import CredentialStore, MissingSecretKeyError
from connectors.credentials import ConnectorCredentials
from connectors.imap_email import ImapConnector
from connectors.oauth2 import OAuth2Connector
from connectors.registry import CONNECTOR_DISPLAY_NAMES, CONNECTOR_IDS, CONNECTOR_REQUIRES_OAUTH
from models import PROJECT_ROOT

PENDING_DIR = PROJECT_ROOT / "data" / "connectors" / "_pending"
IMPORT_DIR = PROJECT_ROOT / "data" / "raw" / "connectors"
PENDING_TTL_SECONDS = 600

_SAFE_SLUG_RE = re.compile(r"[^A-Za-z0-9._-]+")

_OAUTH_MODULES = {"gmail": gmail, "google_drive": google_drive}
_OAUTH_ENV_VARS = {
    "gmail": {"client_id": "GMAIL_CLIENT_ID", "client_secret": "GMAIL_CLIENT_SECRET", "redirect_uri": "GMAIL_REDIRECT_URI"},
    "google_drive": {"client_id": "GDRIVE_CLIENT_ID", "client_secret": "GDRIVE_CLIENT_SECRET", "redirect_uri": "GDRIVE_REDIRECT_URI"},
}


class ConnectorError(RuntimeError):
    """Base for this module's own errors (as opposed to connectors/*.py's)."""


class ConnectorConfigError(ConnectorError):
    """A connector was used before its required env vars were set."""


class ConnectorNotConnectedError(ConnectorError):
    """An account has no stored credentials -- authorize/connect first."""


def _slug(value: str) -> str:
    return _SAFE_SLUG_RE.sub("-", value).strip("-") or "item"


def _oauth_env_configured(connector_id: str) -> bool:
    env = _OAUTH_ENV_VARS[connector_id]
    return bool(os.environ.get(env["client_id"]) and os.environ.get(env["client_secret"]) and os.environ.get(env["redirect_uri"]))


def _oauth_config(connector_id: str):
    env = _OAUTH_ENV_VARS[connector_id]
    client_id = os.environ.get(env["client_id"])
    client_secret = os.environ.get(env["client_secret"])
    redirect_uri = os.environ.get(env["redirect_uri"])
    if not (client_id and client_secret and redirect_uri):
        missing = ", ".join(v for v in env.values() if not os.environ.get(v))
        raise ConnectorConfigError(f"{connector_id} is not configured -- set {missing} first")
    return _OAUTH_MODULES[connector_id].build_config(client_id, client_secret, redirect_uri)


class _OAuthHandshake(OAuth2Connector):
    """A concrete OAuth2Connector for steps that don't need list_items/
    fetch_item (building the authorization URL, exchanging a code,
    refreshing a token) -- OAuth2Connector itself is abstract (it inherits
    Connector's abstractmethods), and GmailConnector/DriveConnector aren't
    constructible yet at this point since they need an access_token this
    handshake is what produces."""

    def __init__(self, connector_id: str, config, *, http_post=None):
        kwargs = {} if http_post is None else {"http_post": http_post}
        super().__init__(config, **kwargs)
        self.connector_id = connector_id

    def list_items(self, query: str = "", limit: int = 20):
        raise NotImplementedError("_OAuthHandshake is for the token handshake only")

    def fetch_item(self, item_id: str):
        raise NotImplementedError("_OAuthHandshake is for the token handshake only")


def _oauth_connector_base(connector_id: str, *, http_post=None) -> OAuth2Connector:
    kwargs = {} if http_post is None else {"http_post": http_post}
    return _OAuthHandshake(connector_id, _oauth_config(connector_id), **kwargs)


def _credential_store() -> CredentialStore:
    return CredentialStore()


def _pending_path(connector_id: str, state: str) -> Path:
    return PENDING_DIR / f"{_slug(connector_id)}__{_slug(state)}.json"


def _save_pending(connector_id: str, state: str, code_verifier: str) -> None:
    PENDING_DIR.mkdir(parents=True, exist_ok=True)
    _pending_path(connector_id, state).write_text(
        json.dumps({"connector_id": connector_id, "state": state, "code_verifier": code_verifier, "created_at": time.time()}),
        encoding="utf-8",
    )


def _load_pending(connector_id: str, state: str) -> dict | None:
    path = _pending_path(connector_id, state)
    if not path.is_file():
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return None
    if time.time() - data.get("created_at", 0) > PENDING_TTL_SECONDS:
        path.unlink(missing_ok=True)
        return None
    return data


def _delete_pending(connector_id: str, state: str) -> None:
    _pending_path(connector_id, state).unlink(missing_ok=True)


def catalog() -> list[dict]:
    """Everything the "Connect an app" screen needs: every known connector
    id, whether its env vars are set, and which accounts are connected."""
    secret_key_set = bool(os.environ.get("CONNECTOR_SECRET_KEY"))
    entries = []
    for connector_id in CONNECTOR_IDS:
        requires_oauth = CONNECTOR_REQUIRES_OAUTH[connector_id]
        configured = _oauth_env_configured(connector_id) if requires_oauth else True
        accounts: list[str] = []
        if secret_key_set:
            try:
                accounts = _credential_store().list_accounts(connector_id)
            except MissingSecretKeyError:
                accounts = []
        entries.append(
            {
                "id": connector_id,
                "display_name": CONNECTOR_DISPLAY_NAMES[connector_id],
                "requires_oauth": requires_oauth,
                "configured": configured,
                "secret_key_set": secret_key_set,
                "connected_accounts": accounts,
            }
        )
    return entries


def start_authorization(connector_id: str) -> dict:
    """Step 1 of the OAuth round trip: build the URL to redirect the user
    to, and stash the PKCE verifier server-side (keyed by the unguessable
    `state` token) so complete_authorization() can find it again -- the
    Node<->Python bridge is stateless per call, so this can't just be held
    in memory between the two requests."""
    if connector_id not in _OAUTH_MODULES:
        raise ConnectorError(f"{connector_id} does not use OAuth2")
    request = _oauth_connector_base(connector_id).build_authorization_request()
    _save_pending(connector_id, request.state, request.code_verifier)
    return {"authorization_url": request.url, "state": request.state}


def complete_authorization(
    connector_id: str, code: str, returned_state: str, account_label: str, *, http_post=None
) -> dict:
    """Step 2: exchange the provider's callback code for tokens and persist
    them. The pending-state file's existence *is* the CSRF check here --
    only the process that generated it (via start_authorization) knows its
    name, since it's secrets.token_urlsafe(24); oauth2.exchange_code()'s own
    constant-time state comparison is exercised directly by
    test_connectors_oauth2.py's CSRF-mismatch case."""
    if connector_id not in _OAUTH_MODULES:
        raise ConnectorError(f"{connector_id} does not use OAuth2")
    if not account_label:
        raise ValueError("'account_label' is required")
    pending = _load_pending(connector_id, returned_state)
    if pending is None:
        raise ValueError("Unknown or expired OAuth state -- start the connection again")
    connector = _oauth_connector_base(connector_id, http_post=http_post)
    creds = connector.exchange_code(code, pending["code_verifier"], returned_state, pending["state"], account_label)
    _credential_store().save(creds)
    _delete_pending(connector_id, returned_state)
    return {"connected": True, "connector_id": connector_id, "account_label": account_label}


def connect_imap(account_label: str, host: str, password: str, port: int = 993, mailbox: str = "INBOX") -> dict:
    """IMAP has no OAuth dance -- the account label (the mailbox username)
    plus an app password is the whole flow."""
    if not account_label:
        raise ValueError("'account_label' is required")
    if not host:
        raise ValueError("'host' is required")
    if not password:
        raise ValueError("'password' is required (a provider-issued app password, not the account's main password)")
    creds = ConnectorCredentials(
        connector_id="imap",
        account_label=account_label,
        password=password,
        extra={"host": host, "port": port, "mailbox": mailbox},
    )
    _credential_store().save(creds)
    return {"connected": True, "connector_id": "imap", "account_label": account_label}


def _build_connector(connector_id: str, account_label: str, *, http_get=None, http_post=None, imap_client_factory=None):
    """Loads stored credentials, refreshes an OAuth2 token if it's expired
    (ensure_fresh(), persisting the refreshed token back), and returns a
    ready-to-call connector instance."""
    creds = _credential_store().load(connector_id, account_label)
    if creds is None:
        raise ConnectorNotConnectedError(f"{connector_id}/{account_label} is not connected")

    if connector_id in _OAUTH_MODULES:
        base = _oauth_connector_base(connector_id, http_post=http_post)
        fresh_creds = base.ensure_fresh(creds)
        if fresh_creds is not creds:
            _credential_store().save(fresh_creds)
            creds = fresh_creds
        connector_cls = gmail.GmailConnector if connector_id == "gmail" else google_drive.DriveConnector
        kwargs = {}
        if http_get is not None:
            kwargs["http_get"] = http_get
        if http_post is not None:
            kwargs["http_post"] = http_post
        return connector_cls(base.config, creds.access_token, **kwargs)

    if connector_id == "imap":
        kwargs = {} if imap_client_factory is None else {"client_factory": imap_client_factory}
        return ImapConnector(
            host=creds.extra.get("host", ""),
            credentials=creds,
            port=creds.extra.get("port", 993),
            mailbox=creds.extra.get("mailbox", "INBOX"),
            **kwargs,
        )

    raise ConnectorError(f"Unknown connector: {connector_id}")


def list_items(connector_id: str, account_label: str, query: str = "", limit: int = 20, **connector_kwargs) -> list[dict]:
    connector = _build_connector(connector_id, account_label, **connector_kwargs)
    return [asdict(item) for item in connector.list_items(query, limit)]


def import_item(connector_id: str, account_label: str, item_id: str, item_title: str = "", **connector_kwargs) -> dict:
    """Fetches one item's full text and writes it under data/raw/connectors/
    -- a plain .txt file, the same shape main.py's own scan of data/raw/
    already reads (it looks for .txt/.md, recursively) -- so an imported
    email or Drive doc flows through extraction -> synthesis -> linking
    like every other raw source, with no separate ingestion path to
    maintain. A short header records where it came from."""
    connector = _build_connector(connector_id, account_label, **connector_kwargs)
    text = connector.fetch_item(item_id)

    dest_dir = IMPORT_DIR / _slug(connector_id) / _slug(account_label)
    dest_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{_slug(item_title or item_id)}__{_slug(item_id)}.txt"
    dest_path = dest_dir / filename

    header = (
        f"[Imported via {CONNECTOR_DISPLAY_NAMES.get(connector_id, connector_id)} connector]\n"
        f"Account: {account_label}\n"
        f"Item id: {item_id}\n"
        f"Title: {item_title or '(untitled)'}\n"
        f"Imported at: {time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}\n"
        "---\n\n"
    )
    dest_path.write_text(header + text, encoding="utf-8")

    rel_path = dest_path.relative_to(IMPORT_DIR.parent).as_posix()
    return {"imported": True, "raw_path": rel_path}


def disconnect(connector_id: str, account_label: str) -> dict:
    removed = _credential_store().delete(connector_id, account_label)
    return {"disconnected": removed, "connector_id": connector_id, "account_label": account_label}
