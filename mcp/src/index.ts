#!/usr/bin/env node
/**
 * MCP server for the wiki (stdio). Configure it in an MCP client with:
 *
 *   WIKI_URL    base URL of the wiki, e.g. https://wissensbau.de or http://localhost:3000
 *   WIKI_TOKEN  a personal API token (Settings -> API tokens), read-only is enough
 *
 * It talks to the wiki's public /api proxy, so it works against a deployed
 * site and a local `./wiki dev` alike. See documentation/47-mcp-server.md.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { WikiClient } from './client';
import { registerTools } from './tools';

export function createServer(client: WikiClient): McpServer {
  const server = new McpServer(
    { name: 'wiki', version: '1.0.0' },
    {
      instructions:
        'Search and read a research wiki compiled from raw sources. Start with search; read a wiki page with get_page, and check its claims against the raw sources named in its References table with get_source_text. Where sources disagree, pages carry "Contradiction" notes: report the disagreement rather than picking a value silently.',
    },
  );
  registerTools(server, client);
  return server;
}

async function main(): Promise<void> {
  const baseUrl = process.env.WIKI_URL;
  const token = process.env.WIKI_TOKEN;
  if (!baseUrl || !token) {
    process.stderr.write('wiki-mcp: set WIKI_URL (e.g. https://wissensbau.de) and WIKI_TOKEN (a personal API token from Settings -> API tokens).\n');
    process.exit(2);
  }
  const server = createServer(new WikiClient({ baseUrl, token }));
  await server.connect(new StdioServerTransport());
}

if (require.main === module) {
  main().catch((err) => {
    process.stderr.write(`wiki-mcp: ${err?.message ?? err}\n`);
    process.exit(1);
  });
}
