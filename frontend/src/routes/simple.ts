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
  { path: '/review-queue', view: 'review-queue', title: 'Review Queue', active: 'Review Queue', clientScript: 'review-queue' },
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

export default router;
