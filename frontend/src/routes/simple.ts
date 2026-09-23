import { Router } from 'express';
import { PUBLIC_API_URL } from '../config';

const router = Router();

const pages: { path: string; view: string; titleKey: string; active: string; clientScript: string }[] = [
  { path: '/pipelines', view: 'pipelines', titleKey: 'pipelines.title', active: 'Pipelines', clientScript: 'pipelines' },
  {
    path: '/pipeline-architecture',
    view: 'pipeline-architecture',
    titleKey: 'pipeline-architecture.title',
    active: 'Pipeline Architecture',
    clientScript: 'pipeline-architecture',
  },
  { path: '/rag-architecture', view: 'rag-architecture', titleKey: 'rag-architecture.title', active: 'RAG Architecture', clientScript: 'rag-architecture' },
  { path: '/chat', view: 'chat', titleKey: 'chat.title', active: 'Chat', clientScript: 'chat' },
  { path: '/resources', view: 'resources', titleKey: 'resources.title', active: 'Resources', clientScript: 'resources' },
  { path: '/graph', view: 'graph', titleKey: 'graph.title', active: 'Graph', clientScript: 'graph' },
  { path: '/entities', view: 'entities', titleKey: 'entities.title', active: 'Entities', clientScript: 'entities' },
  { path: '/analytics', view: 'analytics', titleKey: 'analytics.title', active: 'Analytics', clientScript: 'analytics' },
  { path: '/usage', view: 'usage', titleKey: 'usage.title', active: 'Usage', clientScript: 'usage' },
  { path: '/review-queue', view: 'review-queue', titleKey: 'review-queue.title', active: 'Review Queue', clientScript: 'review-queue' },
  { path: '/settings', view: 'settings', titleKey: 'settings.title', active: 'Settings', clientScript: 'settings' },
  { path: '/company', view: 'company', titleKey: 'company.title', active: 'Company', clientScript: 'company' },
  { path: '/logs', view: 'logs', titleKey: 'logs.title', active: 'Logs', clientScript: 'logs' },
];

for (const page of pages) {
  router.get(page.path, (_req, res) => {
    res.render(page.view, {
      apiBase: PUBLIC_API_URL,
      title: res.locals.t(page.titleKey),
      active: page.active,
      clientScript: page.clientScript,
    });
  });
}

// The redirect_uri an OAuth connector sends the user back to after consent
// -- one static path per connector id, matching what GMAIL_REDIRECT_URI /
// GDRIVE_REDIRECT_URI must be registered as on the provider's OAuth client.
const CONNECTOR_LABELS: Record<string, string> = { gmail: 'Gmail', google_drive: 'Google Drive' };

router.get('/connectors/callback/:id', (req, res) => {
  const connectorId = req.params.id;
  res.render('connectors-callback', {
    apiBase: PUBLIC_API_URL,
    title: res.locals.t('connectors-callback.pageTitle'),
    active: 'Connectors',
    clientScript: 'connectors-callback',
    connectorId,
    connectorLabel: CONNECTOR_LABELS[connectorId] ?? connectorId,
  });
});

export default router;
