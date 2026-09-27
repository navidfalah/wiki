import { Router } from 'express';
import { apiGet } from '../api';
import { PUBLIC_API_URL } from '../config';
import { getToken } from '../lib/auth';

const router = Router();

interface DocListItem {
  path: string;
  title: string;
  category: string | null;
}

async function loadPageList(token?: string) {
  const data = await apiGet<{ pages: DocListItem[] }>('/api/docs', token);
  return data.pages
    .map((p) => ({ title: p.title, slug: p.path.replace(/\.md$/, ''), category: p.category || 'General Reference' }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

function groupByCategory<T extends { category: string }>(pages: T[]): { name: string; pages: T[] }[] {
  const groups = new Map<string, T[]>();
  for (const page of pages) {
    if (!groups.has(page.category)) groups.set(page.category, []);
    groups.get(page.category)!.push(page);
  }
  return [...groups.entries()]
    .map(([name, pages]) => ({ name, pages }))
    .sort((a, b) => {
      if (a.name === 'Overview') return -1;
      if (b.name === 'Overview') return 1;
      if (a.name === 'General Reference') return 1;
      if (b.name === 'General Reference') return -1;
      return a.name.localeCompare(b.name);
    });
}

function isNotFound(err: any): boolean {
  return String(err.message).includes('404') || String(err.message).toLowerCase().includes('not found');
}

router.get('/', async (req, res, next) => {
  try {
    const pages = await loadPageList(getToken(req));
    const folders = groupByCategory(pages);
    res.render('wiki', { apiBase: PUBLIC_API_URL, title: res.locals.t('wiki.title'), active: 'Wiki', pages, folders });
  } catch (err) {
    next(err);
  }
});

router.get('/:slug(*)/download', async (req, res, next) => {
  try {
    const slug = req.params.slug;
    const doc = await apiGet<{ body: string }>(`/api/docs/${slug}.md`, getToken(req));
    const filename = `${slug.split('/').pop()}.txt`;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(doc.body);
  } catch (err: any) {
    if (isNotFound(err)) {
      res.status(404).send(res.locals.t('common.notFound'));
      return;
    }
    next(err);
  }
});

router.get('/:slug(*)/edit', async (req, res, next) => {
  try {
    const slug = req.params.slug;
    const doc = await apiGet<{ title: string; body: string; tags: string[] }>(`/api/docs/${slug}.md`, getToken(req));
    res.render('wiki-edit', {
      apiBase: PUBLIC_API_URL,
      title: res.locals.t('wiki.editTitle', { title: doc.title }),
      active: 'Wiki',
      slug,
      doc,
    });
  } catch (err: any) {
    if (isNotFound(err)) {
      res.status(404).send(res.locals.t('common.notFound'));
      return;
    }
    next(err);
  }
});

interface HistoryVersion {
  id: string;
  at: string;
  reason: string;
  size_bytes: number;
}

router.get('/:slug(*)/history', async (req, res, next) => {
  try {
    const slug = req.params.slug;
    const token = getToken(req);
    const page = `${slug}.md`;
    const pageParam = encodeURIComponent(page);
    const list = await apiGet<{ versions: HistoryVersion[] }>(`/api/doc-history/${pageParam}`, token);
    const selectedId = typeof req.query.v === 'string' ? req.query.v : list.versions[0]?.id;
    const selected = selectedId
      ? await apiGet<{ diff: { op: string; text: string; gap?: number }[]; current_exists: boolean }>(
          `/api/doc-history/${pageParam}?version=${encodeURIComponent(selectedId)}`,
          token,
        )
      : null;
    let title = slug;
    try {
      title = (await apiGet<{ title: string }>(`/api/docs/${pageParam}`, token)).title;
    } catch {
      /* page deleted -- its history is still viewable and restorable */
    }
    res.render('wiki-history', {
      apiBase: PUBLIC_API_URL,
      title: res.locals.t('wiki.history.title', { title }),
      active: 'Wiki',
      slug,
      page,
      pageTitle: title,
      versions: list.versions,
      selectedId,
      selected,
    });
  } catch (err: any) {
    if (isNotFound(err) || String(err.message).includes('Invalid page')) {
      res.status(404).send(res.locals.t('common.notFound'));
      return;
    }
    next(err);
  }
});

router.get('/:slug(*)', async (req, res, next) => {
  try {
    const slug = req.params.slug;
    const doc = await apiGet<{ title: string; body: string; tags: string[]; links: { text: string; href: string }[] }>(
      `/api/docs/${slug}.md`,
      getToken(req),
    );
    res.render('wiki-page', {
      apiBase: PUBLIC_API_URL,
      title: doc.title,
      active: 'Wiki',
      slug,
      doc,
    });
  } catch (err: any) {
    if (isNotFound(err)) {
      res.status(404).send(res.locals.t('common.notFound'));
      return;
    }
    next(err);
  }
});

export default router;
