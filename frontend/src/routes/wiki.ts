import { Router } from 'express';
import { apiGet } from '../api';
import { PUBLIC_API_URL } from '../config';
import { getToken } from '../lib/auth';

const router = Router();

interface DocListItem {
  path: string;
  title: string;
}

async function loadPageList(token?: string) {
  const data = await apiGet<{ pages: DocListItem[] }>('/api/docs', token);
  return data.pages
    .map((p) => ({ title: p.title, slug: p.path.replace(/\.md$/, '') }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

function isNotFound(err: any): boolean {
  return String(err.message).includes('404') || String(err.message).toLowerCase().includes('not found');
}

router.get('/', async (req, res, next) => {
  try {
    const pages = await loadPageList(getToken(req));
    res.render('wiki', { apiBase: PUBLIC_API_URL, title: 'Wiki', active: 'Wiki', pages });
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
      res.status(404).send('Not found');
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
      title: `Edit · ${doc.title}`,
      active: 'Wiki',
      slug,
      doc,
    });
  } catch (err: any) {
    if (isNotFound(err)) {
      res.status(404).send('Not found');
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
      res.status(404).send('Not found');
      return;
    }
    next(err);
  }
});

export default router;
