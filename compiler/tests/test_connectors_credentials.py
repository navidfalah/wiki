import time

from connectors.credentials import ConnectorCredentials


def test_repr_redacts_secrets():
    creds = ConnectorCredentials(
        connector_id="gmail",
        account_label="me@example.com",
        access_token="supersecrettoken123",
        refresh_token="anothersecretvalue",
        password="hunter2",
    )
    text = repr(creds)
    assert "supersecrettoken123" not in text
    assert "anothersecretvalue" not in text
    assert "hunter2" not in text
    assert "me@example.com" in text


def test_is_expired_none_means_never():
    creds = ConnectorCredentials(connector_id="gmail", account_label="a", access_token="t")
    assert creds.is_expired is False


def test_is_expired_true_in_past():
    creds = ConnectorCredentials(
        connector_id="gmail", account_label="a", access_token="t", expires_at=time.time() - 10
    )
    assert creds.is_expired is True


def test_is_expired_false_in_future():
    creds = ConnectorCredentials(
        connector_id="gmail", account_label="a", access_token="t", expires_at=time.time() + 3600
    )
    assert creds.is_expired is False
