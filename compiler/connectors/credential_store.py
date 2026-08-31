"""Encrypted-at-rest storage for connector credentials.

Each account's `ConnectorCredentials` is serialized to JSON, encrypted
with Fernet (AES-128-CBC + HMAC, from the `cryptography` package) using a
key supplied via the `CONNECTOR_SECRET_KEY` environment variable, and
written as one `.enc` file per (connector_id, account_label) pair. There
is no hardcoded fallback key: a missing key is a hard error, not a silent
weak default.
"""

from __future__ import annotations

import json
import os
import re
from dataclasses import asdict
from pathlib import Path

from cryptography.fernet import Fernet, InvalidToken

from connectors.credentials import ConnectorCredentials

DEFAULT_STORE_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "connectors"

_SAFE_ID_RE = re.compile(r"^[A-Za-z0-9_.@-]+$")


class MissingSecretKeyError(RuntimeError):
    """Raised when CONNECTOR_SECRET_KEY is unset."""


class CredentialDecryptionError(RuntimeError):
    """Raised when a stored credential file can't be decrypted with the current key."""


def generate_secret_key() -> str:
    """Generate a new Fernet key, for one-time setup (`CONNECTOR_SECRET_KEY=...`)."""
    return Fernet.generate_key().decode("ascii")


def _slug(value: str) -> str:
    if not _SAFE_ID_RE.match(value):
        raise ValueError(f"unsafe identifier for credential filename: {value!r}")
    return value


class CredentialStore:
    def __init__(self, store_dir: Path | str | None = None, secret_key: str | None = None):
        self.store_dir = Path(store_dir) if store_dir is not None else DEFAULT_STORE_DIR
        key = secret_key if secret_key is not None else os.environ.get("CONNECTOR_SECRET_KEY")
        if not key:
            raise MissingSecretKeyError(
                "CONNECTOR_SECRET_KEY is not set. Generate one with "
                "connectors.credential_store.generate_secret_key() and set it as an "
                "environment variable before storing or reading connector credentials."
            )
        self._fernet = Fernet(key.encode("ascii") if isinstance(key, str) else key)

    def _path(self, connector_id: str, account_label: str) -> Path:
        return self.store_dir / f"{_slug(connector_id)}__{_slug(account_label)}.enc"

    def save(self, creds: ConnectorCredentials) -> None:
        self.store_dir.mkdir(parents=True, exist_ok=True)
        payload = json.dumps(asdict(creds)).encode("utf-8")
        token = self._fernet.encrypt(payload)
        path = self._path(creds.connector_id, creds.account_label)
        path.write_bytes(token)

    def load(self, connector_id: str, account_label: str) -> ConnectorCredentials | None:
        path = self._path(connector_id, account_label)
        if not path.exists():
            return None
        token = path.read_bytes()
        try:
            payload = self._fernet.decrypt(token)
        except InvalidToken as exc:
            raise CredentialDecryptionError(
                f"could not decrypt credentials at {path}: wrong CONNECTOR_SECRET_KEY?"
            ) from exc
        data = json.loads(payload.decode("utf-8"))
        return ConnectorCredentials(**data)

    def delete(self, connector_id: str, account_label: str) -> bool:
        path = self._path(connector_id, account_label)
        if not path.exists():
            return False
        path.unlink()
        return True

    def list_accounts(self, connector_id: str) -> list[str]:
        if not self.store_dir.exists():
            return []
        prefix = f"{_slug(connector_id)}__"
        labels = []
        for path in self.store_dir.glob(f"{prefix}*.enc"):
            labels.append(path.stem[len(prefix):])
        return sorted(labels)
