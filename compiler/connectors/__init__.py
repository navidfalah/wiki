"""Secure connectors to external apps (Gmail, Google Drive, IMAP providers).

Modeled on the "connectors" concept used by hosted assistants: each
connector is a small, isolated adapter that turns one external account
into a list of fetchable items, behind a common interface, with
credentials always encrypted at rest and never logged or fabricated.

Nothing in this package is wired into `server.py` or the dashboard yet —
see `documentation/34-external-connectors.md` for the wiring that's still
a follow-up, same pattern as the vector/graph stores before task #16.
"""
