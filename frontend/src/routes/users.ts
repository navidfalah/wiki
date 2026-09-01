/**
 * Admin-only "manage users" page -- gated here (not just hidden from the
 * nav) since the nav link is just CSS; the actual mutation endpoints are
 * separately gated by requireAdmin on the backend (backend/src/lib/
 * authMiddleware.ts), so this is defense in depth, not the only lock.
 */
import { Router } from 'express';
import { PUBLIC_API_URL } from '../config';

const router = Router();

router.get('/users', (_req, res) => {
  if (res.locals.currentUser?.role !== 'admin') {
    res.status(403).send('Admin access required.');
    return;
  }
  res.render('users', {
    apiBase: PUBLIC_API_URL,
    title: 'Users',
    active: 'Users',
    clientScript: 'users',
  });
});

export default router;
