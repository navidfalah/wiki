# 47 — MCP Server

`mcp/` is a small [Model Context Protocol](https://modelcontextprotocol.io)
server that lets Claude, Cursor and other MCP clients **search and read the
wiki**. It runs on your machine over stdio and talks to the wiki's HTTP API
with a personal API token ([doc 12](./12-api-server.md#authentication)), so
it works against a deployed site (`https://wissensbau.de`) and a local
`./wiki dev` alike. It is read-only: it only sends `GET` requests, so a
read-scoped token is enough, and a leaked read token can't change anything (read tokens are also refused on the admin, build and chat-stream routes, doc 12).

## Tools

| Tool | What it does |
|---|---|
| `search` | Ranked full-text search over wiki pages, raw sources and emails. Optional `type` (`wiki`, `email`, `resource`) and `limit`. Hits name the tool that reads them. |
| `list_pages` | Browse the compiled pages (path, title, category, last change), filterable by title or category. |
| `get_page` | One page as Markdown with its title, tags and the *References & Trust* table naming its sources. Pages flag conflicting sources in `Contradiction` blockquotes. |
| `get_source_text` | The text of one raw source: an email's body, the text of a PDF/DOCX/XLSX/PPTX, a ZIP's listing and small text members, or the file itself. Lets a model check a page's claim against the source. |
| `list_sources` | The raw files the wiki is built from, with processed/unprocessed status. |

Long pages and sources are cut at 30,000 characters with a note. Errors
come back as tool errors with advice ("No wiki page … use list_pages"; a
rejected token says where to create a new one), never as a stack trace.

There is no `ask` tool on purpose. Chat needs write scope (it creates a
session), an LLM key on the server, and streaming; a client model can
answer better from `search` + `get_page` + `get_source_text`, and cites
what it read.

## Setup

1. Create a token: **Settings → API tokens**, access *Read only*. Copy it
   when it is shown; it is not shown again.
2. Install and build (Node 22):

   ```bash
   cd mcp && npm ci && npm run build
   ```

3. Add the server to your MCP client. For Claude Code:

   ```bash
   claude mcp add wiki --env WIKI_URL=https://wissensbau.de --env WIKI_TOKEN=wsb_… -- node /path/to/wiki/mcp/dist/index.js
   ```

   or, in any client's JSON configuration:

   ```json
   {
     "mcpServers": {
       "wiki": {
         "command": "node",
         "args": ["/path/to/wiki/mcp/dist/index.js"],
         "env": { "WIKI_URL": "https://wissensbau.de", "WIKI_TOKEN": "wsb_…" }
       }
     }
   }
   ```

   For development, `npm run dev` runs it from the TypeScript sources.

| Variable | Meaning |
|---|---|
| `WIKI_URL` | Base URL of the wiki (the frontend, which proxies `/api`) |
| `WIKI_TOKEN` | Personal API token |

If either is missing the server exits with a message on stderr (stdout is
the protocol channel and is never written to by anything else).

## How it works

- `src/client.ts` — `WikiClient`: `GET` with the bearer token, a 30 s
  timeout, readable errors (a 401 explains the token is wrong, revoked or
  expired; an unreachable host names the host, never the token).
- `src/tools.ts` — the five tools, registered with the official SDK
  (`@modelcontextprotocol/sdk`) with `zod` input schemas and read-only
  annotations.
- `src/index.ts` — builds the server and connects the stdio transport.
- The backend adds `GET /api/source-text/<path>`, which runs the
  compiler's own text extraction (`compiler/source_text.py`, through
  `cli.py source-text`) so binary formats are readable. It rejects paths
  outside `data/raw/` before and after resolving them.

## Tests

`./wiki test mcp` (vitest). The tool tests connect a real MCP client to the
server over the SDK's in-memory transport against a stubbed wiki API, so
they cover the protocol surface (tool list, schemas, annotations, results,
error results) and not just the helper functions. The backend route and
the Python command have their own tests.

## Limits

- Search is the wiki's own keyword search (BM25, doc 42), not a semantic
  one.
- One wiki per server process; run several servers for several wikis.
- Access is exactly the token owner's: a read token sees everything that
  user can read, including every raw source.

## Next

- [12-api-server.md](./12-api-server.md)
- [42-cross-corpus-search.md](./42-cross-corpus-search.md)
- [46-cli-and-testing.md](./46-cli-and-testing.md)
