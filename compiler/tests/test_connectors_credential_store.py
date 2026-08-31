import pytest

from connectors.credential_store import (
    CredentialDecryptionError,
    CredentialStore,
    MissingSecretKeyError,
    generate_secret_key,
)
from connectors.credentials import ConnectorCredentials


def test_missing_secret_key_raises(tmp_path, monkeypatch):
    monkeypatch.delenv("CONNECTOR_SECRET_KEY", raising=False)
    with pytest.raises(MissingSecretKeyError):
        CredentialStore(store_dir=tmp_path)


def test_save_and_load_round_trip(tmp_path):
    store = CredentialStore(store_dir=tmp_path, secret_key=generate_secret_key())
    creds = ConnectorCredentials(
        connector_id="gmail", account_label="me@example.com", access_token="tok", refresh_token="ref"
    )
    store.save(creds)
    loaded = store.load("gmail", "me@example.com")
    assert loaded == creds


def test_load_missing_returns_none(tmp_path):
    store = CredentialStore(store_dir=tmp_path, secret_key=generate_secret_key())
    assert store.load("gmail", "nobody@example.com") is None


def test_stored_file_is_not_plaintext(tmp_path):
    store = CredentialStore(store_dir=tmp_path, secret_key=generate_secret_key())
    creds = ConnectorCredentials(connector_id="imap", account_label="a@b.com", password="hunter2")
    store.save(creds)
    raw = (tmp_path / "imap__a@b.com.enc").read_bytes()
    assert b"hunter2" not in raw


def test_wrong_key_fails_to_decrypt(tmp_path):
    store = CredentialStore(store_dir=tmp_path, secret_key=generate_secret_key())
    creds = ConnectorCredentials(connector_id="gmail", account_label="me@example.com", access_token="tok")
    store.save(creds)
    other_store = CredentialStore(store_dir=tmp_path, secret_key=generate_secret_key())
    with pytest.raises(CredentialDecryptionError):
        other_store.load("gmail", "me@example.com")


def test_delete(tmp_path):
    store = CredentialStore(store_dir=tmp_path, secret_key=generate_secret_key())
    creds = ConnectorCredentials(connector_id="gmail", account_label="me@example.com", access_token="tok")
    store.save(creds)
    assert store.delete("gmail", "me@example.com") is True
    assert store.load("gmail", "me@example.com") is None
    assert store.delete("gmail", "me@example.com") is False


def test_list_accounts(tmp_path):
    store = CredentialStore(store_dir=tmp_path, secret_key=generate_secret_key())
    store.save(ConnectorCredentials(connector_id="gmail", account_label="a@x.com", access_token="t"))
    store.save(ConnectorCredentials(connector_id="gmail", account_label="b@x.com", access_token="t"))
    store.save(ConnectorCredentials(connector_id="imap", account_label="c@x.com", password="p"))
    assert store.list_accounts("gmail") == ["a@x.com", "b@x.com"]
    assert store.list_accounts("imap") == ["c@x.com"]


def test_unsafe_identifier_rejected(tmp_path):
    store = CredentialStore(store_dir=tmp_path, secret_key=generate_secret_key())
    creds = ConnectorCredentials(connector_id="../etc", account_label="passwd", access_token="t")
    with pytest.raises(ValueError):
        store.save(creds)
