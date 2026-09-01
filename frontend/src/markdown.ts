import { marked, Renderer, Tokens } from 'marked';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}

const renderer = new Renderer();
renderer.heading = ({ tokens, depth }: Tokens.Heading) => {
  const text = renderer.parser.parseInline(tokens);
  const plain = tokens.map((t: any) => t.raw ?? '').join('');
  const id = slugify(plain);
  return `<h${depth} id="${id}">${text}</h${depth}>\n`;
};

/**
 * Rewrite the compiled pages' internal links (`./slug.md`, `/docs/slug`)
 * to this app's own wiki routes (`/wiki/slug`) before handing the body to
 * marked -- the compiler writes links assuming a Docusaurus-style
 * docs/*.md tree, which no longer exists.
 */
function rewriteInternalLinks(body: string): string {
  return body.replace(/\]\((\.\/|\/docs\/)([^)\s]+?)(\.md)?\)/g, (_match, _prefix, slug) => {
    const clean = decodeURIComponent(slug).replace(/\.md$/, '');
    return `](/wiki/${clean})`;
  });
}

export function renderMarkdown(body: string): string {
  const rewritten = rewriteInternalLinks(body);
  return marked.parse(rewritten, { async: false, renderer }) as string;
}

export interface Heading {
  level: number;
  text: string;
  id: string;
}

export function extractHeadings(body: string): Heading[] {
  const headings: Heading[] = [];
  for (const match of body.matchAll(/^(#{2,3})\s+(.+)$/gm)) {
    const level = match[1].length;
    const text = match[2].trim();
    headings.push({ level, text, id: slugify(text) });
  }
  return headings;
}
