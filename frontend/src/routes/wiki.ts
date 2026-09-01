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

// Files only -- no page renders the page body as text. Browsing the wiki
// means seeing it as a directory of files, same as the dashboard's file
// explorer; opening one downloads it as .txt rather than displaying it.
router.get('/', async (_req, res, next) => {
  try {
    const pages = await loadPageList();
    res.render('wiki', { apiBase: PUBLIC_API_URL, title: 'Wiki', active: 'Wiki', pages });
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

export default router;
