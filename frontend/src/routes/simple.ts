import { Router } from 'express';
import { PUBLIC_API_URL } from '../config';

const router = Router();

const pages: { path: string; view: string; title: string; active: string; clientScript: string }[] = [
  { path: '/pipelines', view: 'pipelines', title: 'Pipelines', active: 'Pipelines', clientScript: 'pipelines' },
  {
    path: '/pipeline-architecture',
    view: 'pipeline-architecture',
    title: 'Pipeline Architecture',
    active: 'Pipeline Architecture',
    clientScript: 'pipeline-architecture',
  },
  { path: '/rag-architecture', view: 'rag-architecture', title: 'RAG Architecture', active: 'RAG Architecture', clientScript: 'rag-architecture' },
  { path: '/chat', view: 'chat', title: 'Chat', active: 'Chat', clientScript: 'chat' },
  { path: '/emails', view: 'emails', title: 'Emails', active: 'Emails', clientScript: 'emails' },
  { path: '/resources', view: 'resources', title: 'Resources', active: 'Resources', clientScript: 'resources' },
  { path: '/graph', view: 'graph', title: 'Topic Graph', active: 'Graph', clientScript: 'graph' },
  { path: '/analytics', view: 'analytics', title: 'Analytics', active: 'Analytics', clientScript: 'analytics' },
  { path: '/attention', view: 'attention', title: 'Attention', active: 'Attention', clientScript: 'attention' },
  { path: '/review', view: 'review', title: 'Review Queue', active: 'Review', clientScript: 'review' },
  { path: '/connectors', view: 'connectors', title: 'Connectors', active: 'Connectors', clientScript: 'connectors' },
  { path: '/settings', view: 'settings', title: 'Settings', active: 'Settings', clientScript: 'settings' },
  { path: '/company', view: 'company', title: 'Company Profile', active: 'Company', clientScript: 'company' },
  { path: '/logs', view: 'logs', title: 'Logs', active: 'Logs', clientScript: 'logs' },
];

for (const page of pages) {
  router.get(page.path, (_req, res) => {
    res.render(page.view, {
      apiBase: PUBLIC_API_URL,
      title: page.title,
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
    title: 'Finish connecting',
    active: 'Connectors',
    clientScript: 'connectors-callback',
    connectorId,
    connectorLabel: CONNECTOR_LABELS[connectorId] ?? connectorId,
  });
});

export default router;
