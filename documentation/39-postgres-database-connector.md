# 39 — PostgreSQL Database Connector

Lets a user connect their own PostgreSQL database to the wiki and pull
its tables in as knowledge — the same "connectors" pattern
[34-external-connectors.md](./34-external-connectors.md) built for
Gmail/Drive/IMAP, extended with a fourth connector whose "items" are
tables instead of messages. A dedicated `/database` page walks through
connect → browse schema → import, and `docker-compose.yml` can spin up a
small seeded Postgres container so the whole flow can be tried without a
real database on hand.

| | |
|---|---|
| Connector | `compiler/connectors/postgres_db.py` — `PostgresConnector` |
| Registry | `compiler/connectors/registry.py` — id `postgres` |
| Wiring | `compiler/connectors_service.py` — `connect_postgres()`, `_build_connector()` |
| CLI bridge | `compiler/cli.py` — `connectors-postgres-connect` |
| Backend route | `backend/src/routes/index.ts` — `POST /api/connectors/postgres/connect` (list/import/disconnect reuse the generic `/api/connectors/:id/...` routes already wired for every connector) |
| Dedicated page | `/database` (`frontend/src/views/database.ejs` + `client/database.ts`) |
| Also available on | `/connectors` (`client/connectors.ts`) — the generic catalog page, for consistency with Gmail/Drive/IMAP |
| Sample database | `docker-compose.yml`'s `postgres` service + `docker/postgres/init.sql` |
| Tests | `compiler/tests/test_connectors_postgres.py`, plus the `postgres` cases added to `test_connectors_registry.py`/`test_connectors_service.py` |

## Why tables-as-items

`Connector` (`compiler/connectors/base.py`) only asks for two things:
`list_items()` (a lightweight summary of what's available) and
`fetch_item(id)` (the full text of one item). For Gmail/Drive/IMAP an
"item" is a message; for Postgres it's a base table in one schema:

- **`list_items(query, limit)`** queries `information_schema.tables` for
  `BASE TABLE`s in the configured schema (optionally filtered by a
  case-insensitive substring match on the table name), then
  `information_schema.columns` and a `COUNT(*)` per table so the result
  carries column names and row counts up front — enough for the UI to
  show something meaningful before anything is imported.
- **`fetch_item(id)`** (`id` is `"<schema>.<table>"`) re-confirms the
  table exists via `information_schema.columns` (defense in depth — see
  Security model below), reads up to `MAX_ROWS_PER_TABLE` (200) rows, and
  renders them as a Markdown table: a title, a one-line summary, then a
  `| col | col |` header and one row per data row. That Markdown text is
  what `connectors_service.import_item()` writes under
  `data/raw/connectors/postgres/<account_label>/<table>__<schema.table>.txt`
  — the same `.txt` file shape every other connector's import produces,
  picked up by `main.py`'s existing recursive scan of `data/raw/` with no
  separate ingestion path.

200 rows is a hard cap, not a page size — this is a knowledge-ingestion
connector for building a wiki, not a data export tool, so a production
table with millions of rows still produces one bounded, LLM-chunkable
document rather than something that blows out the compiler's context
budget.

## Security model

Same posture as IMAP in 34-external-connectors.md, adapted for SQL:

- **Password auth only, encrypted at rest.** Like IMAP, there's no OAuth
  dance — host/port/dbname/user/schema live in
  `ConnectorCredentials.extra`, the password in
  `ConnectorCredentials.password`, and the whole object is Fernet-encrypted
  by `CredentialStore` under `data/connectors/postgres__<account_label>.enc`
  exactly like every other connector (see 34's "Encryption at rest").
- **No arbitrary SQL from the API.** There is no query endpoint. The only
  two operations are "list tables in one configured schema" and "read up
  to 200 rows of one table that was just confirmed to exist" — both
  parameterized (`%s` placeholders) everywhere a value comes from outside
  this module.
- **Identifiers are re-validated before being interpolated.** Table/schema
  names can't be parameterized as values in SQL (`SELECT * FROM %s` isn't
  valid), so they're checked against `information_schema` *in the same
  connection* immediately before being used, then interpolated only
  through `_quote_identifier()` (doubles embedded `"` per standard SQL
  identifier-quoting rules). Because the check and the query run back to
  back against the same schema/table pair, this closes off using
  `fetch_item` to probe or read a table outside the connected schema.
- **Read-only by construction, not by grant.** This module only ever
  issues `SELECT`/`information_schema` queries — nothing here can write.
  For defense in depth on a real deployment, connect with a database role
  that's read-only at the Postgres level too (e.g.
  `GRANT SELECT ON ALL TABLES IN SCHEMA public TO wiki_reader;`); the
  sample container's `wiki_reader` role is the DB owner for simplicity
  (see below), which is fine for throwaway sample data but not the
  pattern to copy for a real database.
- **Testable without a real database.** `PostgresConnector` takes its
  DB-API connection via an injectable `client_factory` (default: a thin
  `psycopg2.connect(...)` wrapper), following the same seam
  `ImapConnector` uses for `imaplib` — `test_connectors_postgres.py`
  exercises `list_items`/`fetch_item`/error paths entirely against a fake
  cursor/connection, no network or real Postgres involved.

## The sample database

`docker compose up` (no profile flag needed) also starts a `postgres`
service (`postgres:16-alpine`) seeded once via
`docker/postgres/init.sql` — a small fictional Aurora Labs internal
knowledge base, reusing the same sample domain as
`scripts/dev/generate_junk_data.py`:

| Table | Contents |
|-------|----------|
| `departments` | 3 rows — Hardware Engineering, Firmware, Customer Success |
| `employees` | 5 rows — name, title, department, bio |
| `projects` | 4 rows — Nova Widget, MeshSync v3, Field Diagnostics App, Solar Harvester Module |
| `kb_articles` | 4 rows — troubleshooting/FAQ/architecture/runbook articles about the Nova Widget sensor mesh |

This container is entirely optional scaffolding for trying the feature
end to end — the connector itself works against *any* reachable Postgres
server, including a real production database. Configure the sample
container's credentials via `POSTGRES_DB`/`POSTGRES_USER`/
`POSTGRES_PASSWORD`/`POSTGRES_PORT` in `.env` (defaults:
`aurora_kb` / `wiki_reader` / `aurora_sample_pw` / `5432`); data
persists in the named volume `postgres-data` across restarts, and
`init.sql` only re-runs if that volume is removed
(`docker compose down -v`).

## Setting it up

**Docker (recommended — includes the sample database):**

```bash
cp .env.example .env
docker compose up --build
```

Open **http://localhost:3000/database**, click "Fill the form with the
sample database's values" (host `postgres`, port `5432`, database
`aurora_kb`, user `wiki_reader`, schema `public` — password from
`POSTGRES_PASSWORD`, default `aurora_sample_pw`), click **Connect**, then
**Browse tables** to see `departments`/`employees`/`projects`/
`kb_articles` with row/column counts. Select some and **Import selected
into knowledge base** — each becomes a `.txt` file under
`data/raw/connectors/postgres/sample/`. Run a compile
(`/pipelines` → Run, or `python main.py`) to turn those into wiki pages
like any other raw source.

**Your own database (Docker or not):** same `/database` page, just fill
in your own host/port/dbname/user/schema/password — no env vars or code
changes required. If the backend itself isn't running inside
`docker compose`, use whatever host/port actually reaches your database
(e.g. `localhost`).

**CLI equivalent** (same JSON-in/JSON-out shape as every other connector
command in `compiler/cli.py`):

```bash
cd compiler
echo '{"account_label":"sample","host":"postgres","port":5432,"dbname":"aurora_kb","user":"wiki_reader","password":"aurora_sample_pw","schema":"public"}' \
  | python cli.py connectors-postgres-connect
echo '{"connector_id":"postgres","account_label":"sample","limit":20}' \
  | python cli.py connectors-items-list
echo '{"connector_id":"postgres","account_label":"sample","item_id":"public.kb_articles","item_title":"kb_articles"}' \
  | python cli.py connectors-item-import
```

## Next

- [34-external-connectors.md](./34-external-connectors.md) — the shared
  `Connector` interface, credential encryption, and the generic
  `/connectors` page this reuses
- [05-compiler-pipeline.md](./05-compiler-pipeline.md) — what happens to
  an imported table's `.txt` file once a compile runs
- `compiler/connectors/postgres_db.py` — the connector itself
- `docker/postgres/init.sql` — the sample data definition
