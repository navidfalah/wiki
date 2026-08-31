"""Static registry of known connector ids and display names.

Deliberately does not instantiate any connector — building a
`GmailConnector`/`DriveConnector` needs OAuth client credentials and a
per-account access token that only exist once a user has completed that
connector's auth flow. This registry is just the catalog a future
dashboard "connect an app" screen would list.
"""

from __future__ import annotations

CONNECTOR_IDS = ["gmail", "google_drive", "imap"]

CONNECTOR_DISPLAY_NAMES = {
    "gmail": "Gmail",
    "google_drive": "Google Drive",
    "imap": "Email (IMAP)",
}

CONNECTOR_REQUIRES_OAUTH = {
    "gmail": True,
    "google_drive": True,
    "imap": False,
}
