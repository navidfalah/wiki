"""Credential value object with redacted logging/repr."""

from __future__ import annotations

import time
from dataclasses import dataclass, field


def _redact(value: str | None) -> str:
    if not value:
        return "<empty>"
    if len(value) <= 8:
        return "***"
    return f"{value[:4]}...{value[-4:]}"


@dataclass(frozen=True)
class ConnectorCredentials:
    """Secrets for one connected account.

    `access_token`/`refresh_token` are used by OAuth2 connectors;
    `password` is used by password/app-password connectors (IMAP).
    `expires_at` is a unix timestamp, or None if the token doesn't expire
    or the connector doesn't use token expiry (e.g. IMAP).
    """

    connector_id: str
    account_label: str
    access_token: str | None = None
    refresh_token: str | None = None
    password: str | None = None
    expires_at: float | None = None
    extra: dict = field(default_factory=dict)

    @property
    def is_expired(self) -> bool:
        if self.expires_at is None:
            return False
        return time.time() >= self.expires_at

    def __repr__(self) -> str:  # pragma: no cover - trivial
        return (
            f"ConnectorCredentials(connector_id={self.connector_id!r}, "
            f"account_label={self.account_label!r}, "
            f"access_token={_redact(self.access_token)}, "
            f"refresh_token={_redact(self.refresh_token)}, "
            f"password={_redact(self.password)}, "
            f"expires_at={self.expires_at!r})"
        )

    __str__ = __repr__
