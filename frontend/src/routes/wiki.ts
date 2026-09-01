import { Router } from 'express';
import { apiGet } from '../api';
import { PUBLIC_API_URL } from '../config';

const router = Router();

interface DocListItem {
  path: string;
  title: string;
}

async function loadPageList() {
  const data = await apiGet<{ pages: DocListItem[] }>('/api/docs');
  return data.pages
    .map((p) => ({ title: p.title, slug: p.path.replace(/\.md$/, '') }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

function isNotFound(err: any): boolean {
  return String(err.message).includes('404') || String(err.message).toLowerCase().includes('not found');
}

router.get('/', async (_req, res, next) => {
  try {
    res.redirect('/wiki/index');
  } catch (err) {
    next(err);
  }
});

router.get('/:slug(*)/download', async (req, res, next) => {
  try {
    const slug = req.params.slug;
    const doc = await apiGet<{ body: string }>(`/api/docs/${slug}.md`);
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

router.get('/:slug(*)', async (req, res, next) => {
  try {
    const slug = req.params.slug;
    const [pages, doc] = await Promise.all([
      loadPageList(),
      apiGet<{ title: string; body: string }>(`/api/docs/${slug}.md`),
    ]);
    res.render('wiki', {
      apiBase: PUBLIC_API_URL,
      pages,
      currentSlug: slug,
      doc: {
        title: doc.title,
        text: doc.body,
        filename: `${slug.split('/').pop()}.txt`,
      },
    });
  } catch (err: any) {
    if (isNotFound(err)) {
      res.status(404).render('not-found', { apiBase: PUBLIC_API_URL, path: req.params.slug });
      return;
    }
    next(err);
  }
});

export default router;
