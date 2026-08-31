import pytest

from connectors.credentials import ConnectorCredentials
from connectors.gmail import GmailConnector, build_config


class FakeHttpPost:
    def __init__(self, response):
        self.response = response
        self.calls = []

    def __call__(self, url, headers, data):
        self.calls.append((url, headers, data))
        return self.response


def _connector(http_post):
    config = build_config("client-id", "client-secret", "https://app.example.com/callback")
    return GmailConnector(config, access_token="placeholder", http_post=http_post)


def test_build_authorization_request_has_pkce_and_state():
    connector = _connector(FakeHttpPost({}))
    request = connector.build_authorization_request()
    assert "code_challenge=" in request.url
    assert "code_challenge_method=S256" in request.url
    assert request.state
    assert request.code_verifier
    assert len(request.state) > 16


def test_build_authorization_request_state_is_unique():
    connector = _connector(FakeHttpPost({}))
    a = connector.build_authorization_request()
    b = connector.build_authorization_request()
    assert a.state != b.state
    assert a.code_verifier != b.code_verifier


def test_exchange_code_rejects_state_mismatch():
    connector = _connector(FakeHttpPost({"access_token": "tok"}))
    with pytest.raises(ValueError):
        connector.exchange_code(
            code="abc",
            code_verifier="verifier",
            returned_state="attacker-state",
            expected_state="real-state",
            account_label="me@example.com",
        )


def test_exchange_code_succeeds_with_matching_state():
    http_post = FakeHttpPost({"access_token": "tok", "refresh_token": "ref", "expires_in": 3600})
    connector = _connector(http_post)
    creds = connector.exchange_code(
        code="abc",
        code_verifier="verifier",
        returned_state="s1",
        expected_state="s1",
        account_label="me@example.com",
    )
    assert creds.access_token == "tok"
    assert creds.refresh_token == "ref"
    assert creds.expires_at is not None
    assert http_post.calls[0][2]["code_verifier"] == "verifier"


def test_refresh_preserves_old_refresh_token_when_omitted():
    http_post = FakeHttpPost({"access_token": "new-tok", "expires_in": 3600})
    connector = _connector(http_post)
    old_creds = ConnectorCredentials(
        connector_id="gmail", account_label="me@example.com", access_token="old-tok", refresh_token="ref-1"
    )
    refreshed = connector.refresh(old_creds)
    assert refreshed.access_token == "new-tok"
    assert refreshed.refresh_token == "ref-1"


def test_refresh_without_refresh_token_raises():
    connector = _connector(FakeHttpPost({}))
    creds = ConnectorCredentials(connector_id="gmail", account_label="me@example.com", access_token="tok")
    with pytest.raises(ValueError):
        connector.refresh(creds)


def test_ensure_fresh_skips_refresh_when_not_expired():
    http_post = FakeHttpPost({"access_token": "should-not-be-used"})
    connector = _connector(http_post)
    creds = ConnectorCredentials(
        connector_id="gmail", account_label="me@example.com", access_token="tok", refresh_token="ref"
    )
    result = connector.ensure_fresh(creds)
    assert result is creds
    assert http_post.calls == []


def test_ensure_fresh_refreshes_when_expired():
    import time

    http_post = FakeHttpPost({"access_token": "fresh-tok", "expires_in": 3600})
    connector = _connector(http_post)
    creds = ConnectorCredentials(
        connector_id="gmail",
        account_label="me@example.com",
        access_token="stale-tok",
        refresh_token="ref",
        expires_at=time.time() - 5,
    )
    result = connector.ensure_fresh(creds)
    assert result.access_token == "fresh-tok"
    assert len(http_post.calls) == 1
