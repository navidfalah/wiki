/** API composition. Public endpoints must precede the authentication gate. */
import type { Express } from 'express';
import { requireAuth } from '../lib/authMiddleware';
import { ensureBootstrapAdmin } from '../lib/users';
import { syncSymlinks } from '../lib/sourcesRegistry';
import { registerPublicAuthRoutes } from './auth';
import { registerAccountRoutes } from './accounts';
import { registerBackupRoutes } from './backups';
import { registerSourceRoutes } from './sources';
import { registerFileRoutes } from './files';
import { registerEmailRoutes } from './emails';
import { registerDocRoutes } from './docs';
import { registerBuildRoutes } from './builds';
import { registerKnowledgeRoutes } from './knowledge';
import { registerSearchRoutes } from './search';
import { registerChatRoutes } from './chat';
import { registerSettingsRoutes } from './settings';
import { registerConnectorRoutes } from './connectors';

export function registerRoutes(app: Express): void {
  syncSymlinks();
  ensureBootstrapAdmin();
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  registerPublicAuthRoutes(app);

  // All feature routes below require a session; account and backup modules
  // additionally enforce administrator access on their protected operations.
  app.use('/api', requireAuth);
  registerAccountRoutes(app);
  registerBackupRoutes(app);
  registerSourceRoutes(app);
  registerFileRoutes(app);
  registerEmailRoutes(app);
  registerDocRoutes(app);
  registerBuildRoutes(app);
  registerKnowledgeRoutes(app);
  registerSearchRoutes(app);
  registerChatRoutes(app);
  registerSettingsRoutes(app);
  registerConnectorRoutes(app);
}
