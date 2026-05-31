const fs = require('fs');
const path = require('path');

const PLUGIN_NAME = 'docusaurus-plugin-backlinks';
const LINK_RE = /\[([^\]]+)\]\(([^)]+)\)/g;

function stripFrontmatter(content) {
  if (!content.startsWith('---')) {
    return content;
  }
  const parts = content.split('---', 3);
  return parts.length >= 3 ? parts[2] : content;
}

function parseFrontmatter(content) {
  if (!content.startsWith('---')) {
    return {};
  }
  const parts = content.split('---', 3);
  if (parts.length < 3) {
    return {};
  }
  const meta = {};
  for (const line of parts[1].split('\n')) {
    const match = line.match(/^(\w+):\s*(.+)$/);
    if (match) {
      let value = match[2].trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      meta[match[1]] = value;
    }
  }
  return meta;
}

function buildPermalink(slug, routeBasePath) {
  const clean = slug.replace(/^\//, '');
  return `/${routeBasePath}/${clean}`.replace(/\/+/g, '/');
}

function scanDocs(docsDir, routeBasePath) {
  const pages = [];

  for (const filePath of walkMarkdown(docsDir)) {
    const rel = path.relative(docsDir, filePath).replace(/\\/g, '/');
    if (rel === 'index.md') {
      continue;
    }

    const raw = fs.readFileSync(filePath, 'utf8');
    const meta = parseFrontmatter(raw);
    const stem = rel.replace(/\.md$/, '');
    const id = meta.id || stem.replace(/\//g, '-');
    const title =
      meta.title ||
      path.basename(stem).replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const slug = meta.slug || `/${stem}`;
    const permalink = buildPermalink(slug, routeBasePath);

    pages.push({
      id,
      title,
      relPath: `docs/${rel}`,
      permalink,
      body: stripFrontmatter(raw),
    });
  }

  return pages;
}

function walkMarkdown(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkMarkdown(full));
    } else if (entry.name.endsWith('.md')) {
      results.push(full);
    }
  }
  return results;
}

function buildLookup(pages) {
  const aliasToPage = new Map();
  for (const page of pages) {
    const rel = page.relPath.replace(/^docs\//, '');
    const stem = rel.replace(/\.md$/, '');
    const aliases = [
      page.id,
      rel,
      stem,
      path.basename(stem),
      page.permalink,
      page.permalink.replace(/^\/docs\//, '/'),
    ];
    for (const alias of aliases) {
      if (alias) {
        aliasToPage.set(alias, page);
      }
    }
  }
  return aliasToPage;
}

function resolveHref(href, sourceRelPath) {
  if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('#')) {
    return null;
  }

  if (href.startsWith('/docs/')) {
    return href;
  }

  if (href.endsWith('.md')) {
    const clean = href.replace(/^\.\//, '');
    const sourceDir = path.dirname(sourceRelPath.replace(/^docs\//, ''));
    const resolved = path.normalize(path.join(sourceDir, clean)).replace(/\\/g, '/');
    return resolved.replace(/\.md$/, '');
  }

  return null;
}

function findTarget(resolved, aliasToPage, routeBasePath) {
  if (resolved.startsWith('/')) {
    return aliasToPage.get(resolved) || null;
  }

  const candidates = [
    resolved,
    `${resolved}.md`,
    `docs/${resolved}.md`,
    buildPermalink(`/${resolved}`, routeBasePath),
  ];

  for (const key of candidates) {
    if (aliasToPage.has(key)) {
      return aliasToPage.get(key);
    }
  }

  return null;
}

function buildBacklinkMap(pages, routeBasePath) {
  const aliasToPage = buildLookup(pages);
  const backlinks = {};

  for (const page of pages) {
    for (const match of page.body.matchAll(LINK_RE)) {
      const href = match[2];
      const resolved = resolveHref(href, page.relPath);
      if (!resolved) {
        continue;
      }

      const target = findTarget(resolved, aliasToPage, routeBasePath);
      if (!target || target.id === page.id) {
        continue;
      }

      backlinks[target.id] ??= [];
      if (!backlinks[target.id].some((entry) => entry.id === page.id)) {
        backlinks[target.id].push({
          id: page.id,
          title: page.title,
          permalink: page.permalink,
        });
      }
    }
  }

  for (const id of Object.keys(backlinks)) {
    backlinks[id].sort((a, b) => a.title.localeCompare(b.title));
  }

  return backlinks;
}

function loadTopicIndex(siteDir) {
  const candidates = [
    path.join(siteDir, 'static', 'index.json'),
    path.join(siteDir, '..', 'compiler', 'temp_output', 'index.json'),
  ];
  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) {
      continue;
    }
    try {
      const data = JSON.parse(fs.readFileSync(candidate, 'utf8'));
      if (data.topics && typeof data.topics === 'object') {
        return data.topics;
      }
    } catch {
      // try next candidate
    }
  }
  return null;
}

function buildGraph(pages, topics, routeBasePath) {
  const aliasToPage = buildLookup(pages);
  const nodeById = new Map();

  if (topics) {
    for (const [title, filename] of Object.entries(topics)) {
      const stem = filename.replace(/\.md$/, '');
      const page =
        aliasToPage.get(stem) ||
        aliasToPage.get(path.basename(stem)) ||
        aliasToPage.get(`${stem}.md`);
      const id = page?.id || stem.replace(/\//g, '-');
      const permalink = page?.permalink || buildPermalink(`/${stem}`, routeBasePath);
      nodeById.set(id, { id, name: title, path: permalink });
    }
  } else {
    for (const page of pages) {
      nodeById.set(page.id, { id: page.id, name: page.title, path: page.permalink });
    }
  }

  const linkSet = new Set();
  const links = [];

  for (const page of pages) {
    if (!nodeById.has(page.id)) {
      continue;
    }
    for (const match of page.body.matchAll(LINK_RE)) {
      const href = match[2];
      const resolved = resolveHref(href, page.relPath);
      if (!resolved) {
        continue;
      }
      const target = findTarget(resolved, aliasToPage, routeBasePath);
      if (!target || !nodeById.has(target.id) || target.id === page.id) {
        continue;
      }
      const key = `${page.id}->${target.id}`;
      if (linkSet.has(key)) {
        continue;
      }
      linkSet.add(key);
      links.push({ source: page.id, target: target.id });
    }
  }

  return { nodes: [...nodeById.values()], links };
}

module.exports = function backlinksPlugin(context) {
  const routeBasePath = 'docs';

  return {
    name: PLUGIN_NAME,

    async loadContent() {
      const docsDir = path.join(context.siteDir, 'docs');
      if (!fs.existsSync(docsDir)) {
        return { backlinks: {}, graph: { nodes: [], links: [] }, topics: null };
      }
      const pages = scanDocs(docsDir, routeBasePath);
      const topics = loadTopicIndex(context.siteDir);
      return {
        backlinks: buildBacklinkMap(pages, routeBasePath),
        graph: buildGraph(pages, topics, routeBasePath),
        topics,
      };
    },

    async contentLoaded({ content, actions }) {
      actions.setGlobalData({ backlinks: content.backlinks });

      const staticDir = path.join(context.siteDir, 'static');
      fs.mkdirSync(staticDir, { recursive: true });
      fs.writeFileSync(
        path.join(staticDir, 'graph.json'),
        JSON.stringify(content.graph, null, 2),
      );
      if (content.topics) {
        fs.writeFileSync(
          path.join(staticDir, 'index.json'),
          JSON.stringify({ topics: content.topics }, null, 2),
        );
      }
    },
  };
};
