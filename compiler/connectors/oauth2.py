"""OAuth2 authorization-code + PKCE base for connectors (Gmail, Drive, ...).

Implements the same shape as a standard third-party "connector": the user
is redirected to the provider's consent screen, comes back with a code,
and this exchanges it for tokens. Security properties enforced here
rather than left to each connector:

- PKCE (S256 code challenge) on every authorization request, so a leaked
  authorization code alone isn't enough to redeem tokens.
- A random, unguessable `state` value the caller must echo back, to
  reject CSRF-forged callbacks.
- Refresh preserves the existing refresh token when the provider's
  response omits one (many providers only return it on first consent).

This module never performs network I/O itself — `exchange_code` and
`refresh` take an injected `http_post` callable (default:
`connectors.http_transport.urllib_post`) so they're testable without a
real OAuth provider.
"""

from __future__ import annotations

import base64
import hashlib
import secrets
import time
from collections.abc import Callable
from dataclasses import dataclass

from connectors.base import Connector
from connectors.credentials import ConnectorCredentials
from connectors.http_transport import urllib_post

HttpPost = Callable[[str, dict, dict], dict]


@dataclass(frozen=True)
class OAuth2Config:
    client_id: str
    client_secret: str
    auth_url: str
    token_url: str
    redirect_uri: str
    scopes: list[str]


@dataclass(frozen=True)
class AuthorizationRequest:
    """What to redirect the user to, plus the values needed to complete the flow."""

    url: str
    state: str
    code_verifier: str


def _pkce_pair() -> tuple[str, str]:
    verifier = base64.urlsafe_b64encode(secrets.token_bytes(40)).rstrip(b"=").decode("ascii")
    digest = hashlib.sha256(verifier.encode("ascii")).digest()
    challenge = base64.urlsafe_b64encode(digest).rstrip(b"=").decode("ascii")
    return verifier, challenge


class OAuth2Connector(Connector):
    def __init__(self, config: OAuth2Config, http_post: HttpPost = urllib_post):
        self.config = config
        self._http_post = http_post

    def build_authorization_request(self) -> AuthorizationRequest:
        state = secrets.token_urlsafe(24)
        verifier, challenge = _pkce_pair()
        params = {
            "client_id": self.config.client_id,
            "redirect_uri": self.config.redirect_uri,
            "response_type": "code",
            "scope": " ".join(self.config.scopes),
            "state": state,
            "access_type": "offline",
            "prompt": "consent",
            "code_challenge": challenge,
            "code_challenge_method": "S256",
        }
        query = "&".join(f"{k}={v}" for k, v in params.items())
        return AuthorizationRequest(
            url=f"{self.config.auth_url}?{query}", state=state, code_verifier=verifier
        )

    def exchange_code(
        self,
        code: str,
        code_verifier: str,
        returned_state: str,
        expected_state: str,
        account_label: str,
    ) -> ConnectorCredentials:
        if not secrets.compare_digest(returned_state, expected_state):
            raise ValueError("OAuth2 state mismatch — possible CSRF, rejecting callback")
        data = {
            "client_id": self.config.client_id,
            "client_secret": self.config.client_secret,
            "code": code,
            "code_verifier": code_verifier,
            "redirect_uri": self.config.redirect_uri,
            "grant_type": "authorization_code",
        }
        response = self._http_post(self.config.token_url, {}, data)
        return self._credentials_from_token_response(response, account_label)

    def refresh(self, creds: ConnectorCredentials) -> ConnectorCredentials:
        if not creds.refresh_token:
            raise ValueError(f"no refresh_token stored for {creds.account_label}; re-auth needed")
        data = {
            "client_id": self.config.client_id,
            "client_secret": self.config.client_secret,
            "refresh_token": creds.refresh_token,
            "grant_type": "refresh_token",
        }
        response = self._http_post(self.config.token_url, {}, data)
        refreshed = self._credentials_from_token_response(response, creds.account_label)
        if refreshed.refresh_token is None:
            refreshed = ConnectorCredentials(
                connector_id=refreshed.connector_id,
                account_label=refreshed.account_label,
                access_token=refreshed.access_token,
                refresh_token=creds.refresh_token,
                expires_at=refreshed.expires_at,
                extra=refreshed.extra,
            )
        return refreshed

    def ensure_fresh(self, creds: ConnectorCredentials) -> ConnectorCredentials:
        if creds.is_expired:
            return self.refresh(creds)
        return creds

    def _credentials_from_token_response(
        self, response: dict, account_label: str
    ) -> ConnectorCredentials:
        expires_in = response.get("expires_in")
        expires_at = time.time() + float(expires_in) if expires_in is not None else None
        return ConnectorCredentials(
            connector_id=self.connector_id,
            account_label=account_label,
            access_token=response.get("access_token"),
            refresh_token=response.get("refresh_token"),
            expires_at=expires_at,
            extra={k: v for k, v in response.items() if k not in ("access_token", "refresh_token", "expires_in")},
        )
