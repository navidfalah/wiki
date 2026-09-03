# 34 — External Connectors (Gmail, Google Drive, IMAP)

A small, isolated module for connecting the wiki to external accounts —
modeled on the "connectors" pattern used by hosted assistants: each app
is a separate adapter behind one common interface, credentials are
encrypted at rest, and nothing is fabricated or trusted implicitly.

| | |
|---|---|
| Package | `compiler/connectors/` |
| Common interface | `base.py` — `Connector`, `ConnectorItem` |
| Credential value object | `credentials.py` — `ConnectorCredentials` (redacted repr) |
| Encrypted-at-rest storage | `credential_store.py` — `CredentialStore` (Fernet) |
| OAuth2 base (PKCE + CSRF state) | `oauth2.py` — `OAuth2Connector` |
| HTTP transport (stdlib only) | `http_transport.py` |
| Connectors | `gmail.py`, `google_drive.py` (OAuth2), `imap_email.py` (password) |
| Catalog | `registry.py` |
| Tests | `compiler/tests/test_connectors_*.py` (73 tests, all against fakes — no real network) |
| Wiring (dashboard, API, pipeline import) | `compiler/connectors_service.py` + `/connectors` — see "What's wired up now" below |

## Why this exists, and what's now wired up

This gives the project a real, tested primitive for pulling content from
Gmail, Google Drive, or any IMAP mailbox — the same shape of connection
the email-ingestion pipeline already has to a local `data/raw/` mailbox
export, but live and per-account. **It is now wired into the dashboard**
via `compiler/connectors_service.py` (orchestration only — no network
code of its own) plus a `/connectors` page: a "Connect an app" screen,
the OAuth redirect/callback round trip, an IMAP connect form, browsing an
account's items, and importing one into `data/raw/connectors/` so it
flows through the normal compile pipeline. See "What's wired up now"
below for the full shape; this section originally described the
pre-wiring state (task #34 delivering only the tested primitive), kept
here for history.

## The common interface

Every connector implements `Connector` (`base.py`):

```python
class Connector(ABC):
    def list_items(self, query: str = "", limit: int = 20) -> list[ConnectorItem]: ...
    def fetch_item(self, item_id: str) -> str: ...
```

`ConnectorItem` is a lightweight summary (id, title, snippet, source
URL, metadata) so a caller can list before deciding what to fetch in
full — `fetch_item` returns the full text content of one item.

## Security model

- **Encryption at rest.** `CredentialStore` (`credential_store.py`)
  encrypts every stored `ConnectorCredentials` with
  [Fernet](https://cryptography.io/en/latest/fernet/) (AES-128-CBC +
  HMAC) before writing it to `data/connectors/<connector>__<account>.enc`.
  The key comes from the `CONNECTOR_SECRET_KEY` environment variable —
  there is no hardcoded fallback key; a missing key raises
  `MissingSecretKeyError` rather than silently storing credentials
  unencrypted or under a guessable default. `data/connectors/` is
  gitignored.
- **PKCE on every OAuth2 flow.** `OAuth2Connector.build_authorization_request()`
  generates a fresh S256 PKCE code-verifier/challenge pair per
  authorization request (`oauth2.py`), so a leaked authorization code
  alone can't be redeemed for tokens without the verifier this process
  generated and held locally.
- **CSRF-safe callback handling.** Each authorization request also gets
  a random, unguessable `state` value; `exchange_code()` rejects the
  callback (`ValueError`) unless the returned `state` matches, using a
  constant-time comparison (`secrets.compare_digest`).
  Refresh preserves the existing `refresh_token` when a provider's
  refresh response omits one (common — many providers only return it on
  first consent), so a refresh never silently drops the ability to
  refresh again.
- **Read-only scopes.** `GmailConnector` requests only
  `gmail.readonly`; `DriveConnector` requests only `drive.readonly`.
  Neither can send, delete, modify, or share anything through this
  module.
- **No secrets in logs or reprs.** `ConnectorCredentials.__repr__`/`__str__`
  redact `access_token`, `refresh_token`, and `password` to a truncated
  `abcd...wxyz` form (`credentials.py`) — accidentally `print()`-ing or
  logging a credentials object can't leak the real value.
- **IMAP uses an app password, not the account password.** `ImapConnector`
  refuses to construct without a `password` set, and the docstring is
  explicit that this should be a provider-issued app password. This
  module can't enforce that at the account-provider level — it's a
  user-side setup step, called out here rather than silently assumed.
- **Filename injection guarded.** `CredentialStore` validates
  `connector_id`/`account_label` against a safe-character allowlist
  before building a file path, so a crafted identifier (e.g. `../../etc`)
  can't escape `data/connectors/`.

## Testability without real network calls

Every connector takes its HTTP or IMAP client as an **injected
callable/factory**, following the pattern already used for
`LLMClient` and the email-ingestion pipeline elsewhere in this project:

- `OAuth2Connector`/`GmailConnector`/`DriveConnector` take `http_post`/
  `http_get` callables (default: `http_transport.urllib_post`/`urllib_get`,
  built on the stdlib only — no new HTTP dependency).
- `ImapConnector` takes a `client_factory: Callable[[str, int], ImapClient]`
  (default: `imaplib.IMAP4_SSL`).

The 73 tests in `test_connectors_*.py` exercise every connector,
`CredentialStore`'s encryption round-trip (and that the on-disk file
does *not* contain the plaintext secret), the OAuth2 PKCE/state/refresh
logic (including a deliberate CSRF-mismatch case that must raise), and
Gmail/Drive/IMAP response parsing — all against fakes, never a real
Google API or mail server.

## Setting it up

```env
CONNECTOR_SECRET_KEY=          # generate: python -c "from connectors.credential_store import generate_secret_key; print(generate_secret_key())"

GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GMAIL_REDIRECT_URI=            # must match what's registered on the OAuth client, e.g. https://<host>/connectors/callback/gmail

GDRIVE_CLIENT_ID=
GDRIVE_CLIENT_SECRET=
GDRIVE_REDIRECT_URI=           # e.g. https://<host>/connectors/callback/google_drive
```

(`.env.example` carries these, commented out, under "External connectors".)
None of these were tested against a real Google Cloud OAuth client or a
live Gmail/Drive account in this environment — the client-secret values
are the user's to obtain from Google Cloud Console, same posture as the
OpenAI/Gemini API keys already required elsewhere in `.env.example`. IMAP
needs no env vars — host, port, mailbox, and app password are supplied
per-account at connect time.

## What's wired up now

| | |
|---|---|
| Orchestration | `compiler/connectors_service.py` — catalog, OAuth start/callback, IMAP connect, list/import items, disconnect. No network code of its own; everything network-facing still happens inside `connectors/*.py` through the same injected-callable seams that package's own tests use, so this module's tests (`test_connectors_service.py`) never touch a real network either. |
| CLI bridge | `compiler/cli.py`: `connectors-catalog`, `connectors-oauth-start`, `connectors-oauth-callback`, `connectors-imap-connect`, `connectors-items-list`, `connectors-item-import`, `connectors-disconnect` |
| Backend routes | `backend/src/routes/index.ts`: `GET /api/connectors`, `POST /api/connectors/:id/oauth/{start,callback}`, `POST /api/connectors/imap/connect`, `POST /api/connectors/:id/items`, `POST /api/connectors/:id/items/import`, `DELETE /api/connectors/:id/accounts/:accountLabel` |
| Dashboard | `/connectors` (`frontend/src/views/connectors.ejs` + `client/connectors.ts`) — catalog cards, "Connect new account" (opens the provider's consent screen in a new tab), an inline IMAP connect form, per-account item browsing, and one-click import |
| OAuth callback page | `/connectors/callback/:id` (`connectors-callback.ejs` + `client/connectors-callback.ts`) — this is the value each `*_REDIRECT_URI` above must point at; it reads `code`/`state` from the query string, asks for an account label (the provider doesn't hand back a display name from just an access token here), and posts to the callback route |
| Imported content | `data/raw/connectors/<connector_id>/<account_label>/<title>__<item_id>.txt` — plain text with a short "imported via" header, picked up by `main.py`'s existing recursive `.txt`/`.md` scan of `data/raw/` with no separate ingestion path |
| Tests | `compiler/tests/test_connectors_service.py` (15 tests, fakes only), `compiler/tests/test_cli.py`'s `connectors-*` cases |

Two design points worth calling out:

- **The Node↔Python bridge is stateless per call**, so the OAuth PKCE
  verifier generated in `start_authorization()` can't just live in memory
  until `complete_authorization()` runs — it's written to
  `data/connectors/_pending/<connector>__<state>.json` (gitignored, 10
  minute TTL, deleted on first use) keyed by the unguessable `state`
  token `build_authorization_request()` generates. Not being able to
  produce that file back is itself the CSRF check at this layer (see
  `complete_authorization()`'s docstring); `oauth2.py`'s own
  constant-time `state` comparison inside `exchange_code()` is exercised
  directly by `test_connectors_oauth2.py`, unchanged.
- **Token refresh happens on every list/import call**, not on a
  schedule: `connectors_service._build_connector()` calls
  `OAuth2Connector.ensure_fresh()` before building the Gmail/Drive
  connector and persists a refreshed token back to `CredentialStore`
  immediately, so there's no separate cron/scheduler to run — the
  trade-off is a wasted expiry check on every call rather than a stale
  token, which is the cheap direction to be wrong in.

## Next

- [12-api-server.md](./12-api-server.md) — the Node backend's route conventions this follows
- [11-wiki-app-and-dashboards.md](./11-wiki-app-and-dashboards.md) — the `/connectors` page in context of the rest of the dashboard
- `compiler/connectors/` — the underlying tested primitive, unchanged by this wiring
- `compiler/connectors_service.py` — the wiring itself
