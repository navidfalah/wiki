import type { Express } from 'express';
import { RAW_DIR } from '../paths';
import { HttpError, wrap } from '../lib/httpError';
import { logEvent } from '../lib/activityLog';
import { addSource, listSources, removeSource, setEnabled, SourceError } from '../lib/sourcesRegistry';

export function registerSourceRoutes(app: Express): void {
  // --- Source folder registry ---------------------------------------------

  app.get(
    '/api/sources',
    wrap((_req, res) => {
      res.json({ raw_dir: RAW_DIR, sources: listSources() });
    }),
  );

  app.post(
    '/api/sources',
    wrap((req, res) => {
      try {
        const entry = addSource(req.body?.path, req.body?.label ?? null);
        logEvent(req.user?.username, 'Added source folder', `${entry.label} (${entry.path})`);
        res.json(entry);
      } catch (err) {
        if (err instanceof SourceError) throw new HttpError(400, err.message);
        throw err;
      }
    }),
  );

  app.delete(
    '/api/sources/:id',
    wrap((req, res) => {
      if (!removeSource(req.params.id)) throw new HttpError(404, `Source not found: ${req.params.id}`);
      logEvent(req.user?.username, 'Removed source folder', req.params.id);
      res.json({ removed: true, id: req.params.id });
    }),
  );

  app.put(
    '/api/sources/:id',
    wrap((req, res) => {
      if (req.body?.enabled === undefined) throw new HttpError(400, "'enabled' is required");
      const entry = setEnabled(req.params.id, Boolean(req.body.enabled));
      if (!entry) throw new HttpError(404, `Source not found: ${req.params.id}`);
      logEvent(req.user?.username, entry.enabled ? 'Enabled source folder' : 'Disabled source folder', entry.label);
      res.json(entry);
    }),
  );

}
