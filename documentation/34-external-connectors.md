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

## Why this exists, and what it doesn't do yet

This gives the project a real, tested primitive for pulling content from
Gmail, Google Drive, or any IMAP mailbox — the same shape of connection
the email-ingestion pipeline already has to a local `data/raw/` mailbox
export, but live and per-account. **It is not wired into `server.py`,
the dashboard, or the compile pipeline** — same posture as the
vector/graph stores before task #16: the mechanism is real, tested, and
ready to call; hooking a "connect Gmail" button into the dashboard, and
feeding connector output into the compiler's ingestion step, is a
follow-up, not assumed done here.

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

## Setting it up (for a future wiring)

```env
CONNECTOR_SECRET_KEY=          # generate: python -c "from connectors.credential_store import generate_secret_key; print(generate_secret_key())"

GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GMAIL_REDIRECT_URI=            # must match what's registered on the OAuth client

DRIVE_CLIENT_ID=
DRIVE_CLIENT_SECRET=
DRIVE_REDIRECT_URI=
```

None of these were tested against a real Google Cloud OAuth client or a
live Gmail/Drive account in this environment — the client-secret values
are the user's to obtain from Google Cloud Console, same posture as the
OpenAI/Gemini API keys already required elsewhere in `.env.example`.

## What a real wiring would still need to add

- A FastAPI route pair on `server.py` for the OAuth redirect/callback
  (`build_authorization_request()` → redirect the user; the callback
  handler calls `exchange_code()` and persists the result via
  `CredentialStore.save()`).
- A dashboard "Connect an app" screen driven by `registry.CONNECTOR_IDS`/
  `CONNECTOR_DISPLAY_NAMES`.
- A step that turns `Connector.list_items()`/`fetch_item()` output into
  the same `Passage`/raw-document shape `main.py`'s ingestion pipeline
  already consumes from `data/raw/`, so connector content flows through
  the same extraction → trust → retrieval pipeline as everything else.
- Token refresh on a schedule (`OAuth2Connector.ensure_fresh()` already
  does the expiry check; something needs to call it before each use).

None of this is assumed done — it's the next task if the user wants
connectors live rather than just available as a tested primitive.

## Next

- [12-api-server.md](./12-api-server.md) — where an OAuth callback route would live
- [11-wiki-app-and-dashboards.md](./11-wiki-app-and-dashboards.md) — where a "connect an app" screen would live
- `compiler/connectors/` — the module itself
