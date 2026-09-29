import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { encodePath, WikiApiError, type WikiClient } from './client';

/** Longest page or source text returned in one tool result. Larger texts are
 * cut with a note, so one call can't flood a model's context. */
export const MAX_TEXT_CHARS = 30_000;

interface SearchHit {
  type: 'wiki' | 'email' | 'resource';
  title: string;
  path: string;
  snippet: string;
  score: number;
  meta?: Record<string, string>;
}

function text(value: string) {
  return { content: [{ type: 'text' as const, text: value }] };
}

function failure(err: unknown) {
  const message = err instanceof WikiApiError ? err.message : `Unexpected error: ${(err as Error)?.message ?? err}`;
  return { isError: true, content: [{ type: 'text' as const, text: message }] };
}

export function clip(value: string, max = MAX_TEXT_CHARS): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max)}\n\n[… cut after ${max} of ${value.length} characters]`;
}

function oneLine(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function formatSearch(query: string, total: number, hits: SearchHit[]): string {
  if (!hits.length) return `No results for "${query}".`;
  const lines = hits.map((hit, index) => {
    const where = hit.type === 'wiki' ? `wiki page ${hit.path}` : hit.type === 'email' ? `email ${hit.path}` : `source ${hit.path}`;
    return `${index + 1}. ${hit.title} [${where}]\n   ${oneLine(hit.snippet)}`;
  });
  const more = total > hits.length ? `\n\nShowing ${hits.length} of ${total} results.` : '';
  return `${total} result${total === 1 ? '' : 's'} for "${query}":\n\n${lines.join('\n\n')}${more}\n\nRead a wiki page with get_page (path ends in .md); read a source or email with get_source_text.`;
}

/** Registers the wiki tools on an MCP server. */
export function registerTools(server: McpServer, client: WikiClient): void {
  const readOnly = { readOnlyHint: true, idempotentHint: true, openWorldHint: false } as const;

  server.registerTool(
    'search',
    {
      title: 'Search the wiki',
      description:
        'Full-text search over wiki pages, raw source files and emails. Returns ranked hits with a snippet and the path to read them with get_page (wiki pages, paths ending in .md) or get_source_text (sources and emails). Use plain keywords or a natural-language question.',
      inputSchema: {
        query: z.string().min(1).describe('What to look for, e.g. "battery storage size" or "when was the plant commissioned?"'),
        type: z.enum(['wiki', 'email', 'resource']).optional().describe('Only return this kind of hit'),
        limit: z.number().int().min(1).max(50).default(10).describe('Maximum number of hits to return'),
      },
      annotations: { title: 'Search the wiki', ...readOnly },
    },
    async ({ query, type, limit }) => {
      try {
        const data = await client.get<{ total: number; results: SearchHit[] }>('/api/search', { q: query });
        const hits = (data.results ?? []).filter((hit) => !type || hit.type === type);
        return text(formatSearch(query, type ? hits.length : data.total, hits.slice(0, limit)));
      } catch (err) {
        return failure(err);
      }
    },
  );

  server.registerTool(
    'list_pages',
    {
      title: 'List wiki pages',
      description: 'Lists the compiled wiki pages (path, title, category, last change), optionally filtered by a word in the title or category. Use it to browse; use search to find facts.',
      inputSchema: {
        filter: z.string().optional().describe('Only pages whose title or category contains this text (case-insensitive)'),
        limit: z.number().int().min(1).max(200).default(50),
      },
      annotations: { title: 'List wiki pages', ...readOnly },
    },
    async ({ filter, limit }) => {
      try {
        const data = await client.get<{ total: number; pages: { path: string; title: string; category: string | null; modified_at?: string }[] }>('/api/docs');
        const needle = filter?.toLowerCase();
        const pages = (data.pages ?? []).filter((p) => !needle || p.title.toLowerCase().includes(needle) || (p.category ?? '').toLowerCase().includes(needle));
        if (!pages.length) return text(filter ? `No pages match "${filter}" (the wiki has ${data.total} pages).` : 'The wiki has no pages yet.');
        const lines = pages.slice(0, limit).map((p) => `- ${p.title} — ${p.path}${p.category ? ` (${p.category})` : ''}${p.modified_at ? `, updated ${p.modified_at.slice(0, 10)}` : ''}`);
        const more = pages.length > limit ? `\n\nShowing ${limit} of ${pages.length}; narrow it with filter.` : '';
        return text(`${pages.length} page${pages.length === 1 ? '' : 's'}:\n\n${lines.join('\n')}${more}`);
      } catch (err) {
        return failure(err);
      }
    },
  );

  server.registerTool(
    'get_page',
    {
      title: 'Read a wiki page',
      description:
        'Returns one wiki page as Markdown, with its title, tags and links. Each page ends with a "References & Trust" table naming the raw sources it was built from and how much each is trusted; read those with get_source_text to verify a claim. Pages flag conflicting sources in "Contradiction" blockquotes.',
      inputSchema: {
        path: z.string().min(1).describe('The page path from search or list_pages, e.g. "battery-storage.md"'),
      },
      annotations: { title: 'Read a wiki page', ...readOnly },
    },
    async ({ path }) => {
      try {
        const doc = await client.get<{ path: string; title: string; tags: string[]; body: string; links: unknown[] }>(`/api/docs/${encodePath(path)}`);
        const header = `# ${doc.title}\npath: ${doc.path}${doc.tags?.length ? `\ntags: ${doc.tags.join(', ')}` : ''}\n\n`;
        return text(header + clip(doc.body));
      } catch (err) {
        if (err instanceof WikiApiError && err.status === 404) return failure(new WikiApiError(`No wiki page "${path}". Use list_pages or search to find the right path.`, 404));
        return failure(err);
      }
    },
  );

  server.registerTool(
    'get_source_text',
    {
      title: 'Read a raw source',
      description:
        'Returns the text of one raw source file (from data/raw): the parsed body of an email, the extracted text of a PDF, Word, Excel or PowerPoint file, the listing and small text members of a ZIP, or the file itself for text formats. Images and audio have no text. Use it to check what the source actually says.',
      inputSchema: {
        path: z.string().min(1).describe('The source path, as shown in search hits, list_sources or a page\'s References table, e.g. "project/2026-04-22-structural-survey-summary.pdf"'),
      },
      annotations: { title: 'Read a raw source', ...readOnly },
    },
    async ({ path }) => {
      try {
        const data = await client.get<{ path: string; text: string; chars: number; truncated: boolean }>(`/api/source-text/${encodePath(path)}`);
        if (!data.text.trim()) return text(`${data.path} has no extractable text (an image, audio or empty file).`);
        const note = data.truncated ? `\n\n[the wiki cut this source after ${data.text.length} of ${data.chars} characters]` : '';
        return text(`source: ${data.path}\n\n${clip(data.text)}${note}`);
      } catch (err) {
        if (err instanceof WikiApiError && err.status === 404) return failure(new WikiApiError(`No raw source "${path}". Use list_sources to see the available paths.`, 404));
        return failure(err);
      }
    },
  );

  server.registerTool(
    'list_sources',
    {
      title: 'List raw sources',
      description: 'Lists the raw source files the wiki is compiled from (path, whether they were processed, size), optionally filtered by a part of the path.',
      inputSchema: {
        filter: z.string().optional().describe('Only sources whose path contains this text (case-insensitive), e.g. "emails/" or ".pdf"'),
        limit: z.number().int().min(1).max(200).default(50),
      },
      annotations: { title: 'List raw sources', ...readOnly },
    },
    async ({ filter, limit }) => {
      try {
        const data = await client.get<{ total: number; files: { path: string; status: string; size_bytes: number }[] }>('/api/raw-files');
        const needle = filter?.toLowerCase();
        const files = (data.files ?? []).filter((f) => !needle || f.path.toLowerCase().includes(needle));
        if (!files.length) return text(filter ? `No sources match "${filter}" (there are ${data.total}).` : 'There are no raw sources yet.');
        const lines = files.slice(0, limit).map((f) => `- ${f.path} (${f.status.toLowerCase()}, ${(f.size_bytes / 1024).toFixed(1)} KB)`);
        const more = files.length > limit ? `\n\nShowing ${limit} of ${files.length}; narrow it with filter.` : '';
        return text(`${files.length} source${files.length === 1 ? '' : 's'}:\n\n${lines.join('\n')}${more}`);
      } catch (err) {
        return failure(err);
      }
    },
  );
}
