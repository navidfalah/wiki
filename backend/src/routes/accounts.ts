import type { Express } from 'express';
import { HttpError, wrap } from '../lib/httpError';
import { listEvents, logEvent } from '../lib/activityLog';
import { requireAdmin } from '../lib/authMiddleware';
import { countActiveSessionsByUser, deleteSession, deleteSessionsForUser } from '../lib/sessions';
import { createUser, deleteUser, listUsers, resetPasswordById, setRole, UserError } from '../lib/users';

export function registerAccountRoutes(app: Express): void {
  app.post('/api/auth/logout', (req, res) => {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) deleteSession(header.slice('Bearer '.length).trim());
    logEvent(req.user?.username, 'Logged out');
    res.json({ ok: true });
  });

  app.get(
    '/api/activity',
    wrap((req, res) => {
      const requested = Number(req.query.limit);
      const limit = Number.isFinite(requested) && requested > 0 ? Math.min(requested, 5000) : 500;
      res.json({ events: listEvents(limit) });
    }),
  );

  app.get('/api/auth/me', (req, res) => {
    res.json({ user: req.user });
  });

  // --- User management (admin only) -----------------------------------------

  app.get(
    '/api/users',
    requireAdmin,
    wrap((_req, res) => {
      const sessionCounts = countActiveSessionsByUser();
      res.json({ users: listUsers().map((u) => ({ ...u, active_sessions: sessionCounts[u.id] ?? 0 })) });
    }),
  );

  // Recent sign-in / account-management events for the admin panel -- a
  // filtered view of the same activity log the Logs page shows.
  app.get(
    '/api/admin/auth-events',
    requireAdmin,
    wrap((_req, res) => {
      const events = listEvents(1000)
        .filter((e) => e.category === 'auth' || /login|logged|user|password|session/i.test(e.action))
        .slice(0, 30);
      res.json({ events });
    }),
  );

  app.post(
    '/api/users',
    requireAdmin,
    wrap((req, res) => {
      const username = String(req.body?.username ?? '').trim();
      const password = String(req.body?.password ?? '');
      const role = req.body?.role === 'admin' ? 'admin' : 'user';
      try {
        const user = createUser(username, password, role);
        logEvent(req.user?.username, `Created user ${user.username} (${user.role})`);
        res.json(user);
      } catch (err) {
        if (err instanceof UserError) throw new HttpError(400, err.message);
        throw err;
      }
    }),
  );

  // Partial update: { role?, password? }. Either change signs the user out
  // everywhere -- a demoted admin must not keep an admin session (roles are
  // snapshotted into the session at login), and a reset password should
  // invalidate whoever might have known the old one.
  app.put(
    '/api/users/:id',
    requireAdmin,
    wrap((req, res) => {
      const { role, password } = req.body ?? {};
      if (role === undefined && password === undefined) throw new HttpError(400, "Provide 'role' and/or 'password'");
      if (role !== undefined && role !== 'admin' && role !== 'user') throw new HttpError(400, "'role' must be 'admin' or 'user'");
      try {
        let user;
        if (role !== undefined) {
          user = setRole(req.params.id, role);
          logEvent(req.user?.username, `Changed role of user ${user.username} to ${role}`);
        }
        if (password !== undefined) {
          user = resetPasswordById(req.params.id, String(password));
          logEvent(req.user?.username, `Reset password of user ${user.username}`);
        }
        const revoked = deleteSessionsForUser(req.params.id);
        res.json({ user, sessions_revoked: revoked });
      } catch (err) {
        if (err instanceof UserError) throw new HttpError(400, err.message);
        throw err;
      }
    }),
  );

  app.delete(
    '/api/users/:id/sessions',
    requireAdmin,
    wrap((req, res) => {
      const revoked = deleteSessionsForUser(req.params.id);
      logEvent(req.user?.username, `Signed user ${req.params.id} out of ${revoked} session(s)`);
      res.json({ sessions_revoked: revoked });
    }),
  );

  app.delete(
    '/api/users/:id',
    requireAdmin,
    wrap((req, res) => {
      try {
        deleteUser(req.params.id, req.user!.id);
        deleteSessionsForUser(req.params.id);
        logEvent(req.user?.username, `Deleted user ${req.params.id}`);
        res.json({ removed: true, id: req.params.id });
      } catch (err) {
        if (err instanceof UserError) throw new HttpError(400, err.message);
        throw err;
      }
    }),
  );

}
