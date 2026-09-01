import { Router } from 'express';
import { PUBLIC_API_URL } from '../config';

const router = Router();

const pages: { path: string; view: string; title: string; active: string; clientScript: string }[] = [
  { path: '/chat', view: 'chat', title: 'Chat', active: 'Chat', clientScript: 'chat' },
  { path: '/emails', view: 'emails', title: 'Emails', active: 'Emails', clientScript: 'emails' },
  { path: '/resources', view: 'resources', title: 'Resources', active: 'Resources', clientScript: 'resources' },
  { path: '/graph', view: 'graph', title: 'Topic Graph', active: 'Graph', clientScript: 'graph' },
  { path: '/analytics', view: 'analytics', title: 'Analytics', active: 'Analytics', clientScript: 'analytics' },
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
