import fs from 'node:fs';
import path from 'node:path';
import type { Express } from 'express';
import { OUTPUT_DIR, STATE_FILE, STATIC_MEDIA_DIR, TEMP_OUTPUT_DIR } from '../paths';
import { HttpError, wrap } from '../lib/httpError';
import { logEvent } from '../lib/activityLog';
import { parseFrontmatter, readDocPayload } from '../lib/docUtils';
import { categorizePages } from '../lib/docCategories';
import { isPageFile, lineDiff, listVersions, readVersion, snapshotPage, withContext } from '../lib/pageHistory';
import { atomicWriteText } from '../lib/atomicWrite';
import { safePath } from './shared';

export function registerDocRoutes(app: Express): void {
  // --- Docs ------------------------------------------------------------------

  app.get(
    '/api/docs',
    wrap((_req, res) => {
      if (!fs.existsSync(OUTPUT_DIR)) throw new HttpError(404, `Docs directory not found: ${OUTPUT_DIR}`);
      const pages = fs
        .readdirSync(OUTPUT_DIR)
        .filter((f) => f.endsWith('.md'))
        .sort()
        .map((name) => {
          const filePath = path.join(OUTPUT_DIR, name);
          const raw = fs.readFileSync(filePath, 'utf-8');
          const stat = fs.statSync(filePath);
          const meta = parseFrontmatter(raw);
          const stem = path.basename(name, '.md');
          const title =
            (typeof meta.title === 'string' && meta.title) ||
            stem.replace(/-/g, ' ').replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1));
          return {
            path: name,
            title,
            id: meta.id ?? null,
            slug: meta.slug ?? null,
            size_bytes: stat.size,
            modified_at: stat.mtime.toISOString(),
            tags: meta.tags_list ?? [],
          };
        });
      const categories = categorizePages(pages);
      const pagesWithCategory = pages.map(({ tags: _tags, ...page }) => ({
        ...page,
        category: categories.get(page.path) ?? null,
      }));
      res.json({ directory: OUTPUT_DIR, total: pagesWithCategory.length, pages: pagesWithCategory });
    }),
  );

  app.delete(
    '/api/docs',
    wrap((req, res) => {
      let pagesDeleted = 0;
      let mediaDeleted = 0;

      if (fs.existsSync(OUTPUT_DIR)) {
        for (const name of fs.readdirSync(OUTPUT_DIR)) {
          if (!name.endsWith('.md')) continue;
          if (isPageFile(name)) snapshotPage(path.join(OUTPUT_DIR, name), 'delete');
          fs.unlinkSync(path.join(OUTPUT_DIR, name));
          pagesDeleted += 1;
        }
      }

      if (fs.existsSync(TEMP_OUTPUT_DIR)) {
        for (const name of fs.readdirSync(TEMP_OUTPUT_DIR)) {
          if (name.endsWith('.md') || name === 'index.json') {
            fs.unlinkSync(path.join(TEMP_OUTPUT_DIR, name));
          }
        }
      }

      if (fs.existsSync(STATIC_MEDIA_DIR)) {
        for (const name of fs.readdirSync(STATIC_MEDIA_DIR)) {
          const mediaPath = path.join(STATIC_MEDIA_DIR, name);
          if (fs.statSync(mediaPath).isFile()) {
            fs.unlinkSync(mediaPath);
            mediaDeleted += 1;
          }
        }
      }

      logEvent(req.user?.username, `Deleted all wiki pages (${pagesDeleted} pages, ${mediaDeleted} media files)`);
      res.json({ pagesDeleted, mediaDeleted });
    }),
  );

  app.get(
    '/api/docs/*',
    wrap((req, res) => {
      const relPath = (req.params as any)[0] as string;
      const docPath = safePath(OUTPUT_DIR, relPath);
      if (!fs.existsSync(docPath) || !fs.statSync(docPath).isFile()) {
        throw new HttpError(404, `Doc not found: ${relPath}`);
      }
      res.json(readDocPayload(docPath));
    }),
  );

  app.put(
    '/api/docs/*',
    wrap((req, res) => {
      const relPath = (req.params as any)[0] as string;
      const docPath = safePath(OUTPUT_DIR, relPath);
      if (!fs.existsSync(docPath) || !fs.statSync(docPath).isFile()) {
        throw new HttpError(404, `Doc not found: ${relPath}`);
      }
      const body = (req.body as any)?.body;
      if (typeof body !== 'string') throw new HttpError(400, 'body (string) is required');

      const raw = fs.readFileSync(docPath, 'utf-8');
      let next = body;
      if (raw.startsWith('---')) {
        const first = raw.indexOf('---');
        const second = raw.indexOf('---', first + 3);
        if (second !== -1) {
          next = raw.slice(0, second + 3) + '\n\n' + body.replace(/^\n+/, '');
        }
      }
      snapshotPage(docPath, 'edit', next);
      fs.writeFileSync(docPath, next, 'utf-8');
      logEvent(req.user?.username, 'Edited wiki page', relPath);
      res.json(readDocPayload(docPath));
    }),
  );

  app.delete(
    '/api/docs/*',
    wrap((req, res) => {
      const relPath = (req.params as any)[0] as string;
      const docPath = safePath(OUTPUT_DIR, relPath);
      if (!fs.existsSync(docPath) || !fs.statSync(docPath).isFile()) {
        throw new HttpError(404, `Doc not found: ${relPath}`);
      }
      snapshotPage(docPath, 'delete');
      fs.unlinkSync(docPath);
      logEvent(req.user?.username, 'Deleted wiki page', relPath);
      res.json({ deleted: relPath });
    }),
  );

  // --- Page version history (see lib/pageHistory.ts) ------------------------

  function historyPage(req: any): string {
    const page = (req.params as any)[0] as string;
    if (!isPageFile(page)) throw new HttpError(400, `Invalid page: ${page}`);
    return page;
  }

  app.get(
    '/api/doc-history/*',
    wrap((req, res) => {
      const page = historyPage(req);
      const versions = listVersions(page);
      const versionId = typeof req.query.version === 'string' ? req.query.version : undefined;
      if (!versionId) {
        res.json({ page, versions });
        return;
      }
      const content = readVersion(page, versionId);
      if (content === null) throw new HttpError(404, `Version not found: ${versionId}`);
      const docPath = safePath(OUTPUT_DIR, page);
      const current = fs.existsSync(docPath) ? fs.readFileSync(docPath, 'utf-8') : '';
      res.json({
        page,
        version: versions.find((v) => v.id === versionId),
        content,
        current_exists: fs.existsSync(docPath),
        diff: withContext(lineDiff(content, current)),
      });
    }),
  );

  app.post(
    '/api/doc-history/*',
    wrap((req, res) => {
      const page = historyPage(req);
      const versionId = (req.body as any)?.version;
      const content = typeof versionId === 'string' ? readVersion(page, versionId) : null;
      if (content === null) throw new HttpError(404, `Version not found: ${String(versionId)}`);
      const docPath = safePath(OUTPUT_DIR, page);
      snapshotPage(docPath, 'restore', content);
      atomicWriteText(docPath, content);
      logEvent(req.user?.username, 'Restored wiki page version', `${page} @ ${versionId}`);
      res.json({ restored: page, version: versionId });
    }),
  );

  app.get(
    '/api/state',
    wrap((_req, res) => {
      if (!fs.existsSync(STATE_FILE)) {
        res.json({ path: STATE_FILE, exists: false, content: { version: 1, files: {}, runs: [] } });
        return;
      }
      try {
        const content = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
        res.json({ path: STATE_FILE, exists: true, content });
      } catch (err: any) {
        throw new HttpError(500, `Invalid state.json: ${err.message}`);
      }
    }),
  );

}
