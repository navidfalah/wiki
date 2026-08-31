from connectors.registry import CONNECTOR_DISPLAY_NAMES, CONNECTOR_IDS, CONNECTOR_REQUIRES_OAUTH


def test_every_id_has_a_display_name():
    for connector_id in CONNECTOR_IDS:
        assert connector_id in CONNECTOR_DISPLAY_NAMES


def test_every_id_has_an_oauth_flag():
    for connector_id in CONNECTOR_IDS:
        assert connector_id in CONNECTOR_REQUIRES_OAUTH


def test_imap_does_not_require_oauth():
    assert CONNECTOR_REQUIRES_OAUTH["imap"] is False


def test_gmail_and_drive_require_oauth():
    assert CONNECTOR_REQUIRES_OAUTH["gmail"] is True
    assert CONNECTOR_REQUIRES_OAUTH["google_drive"] is True
