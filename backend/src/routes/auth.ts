import type { Express } from 'express';
import { HttpError, wrap } from '../lib/httpError';
import { LoginThrottle } from '../lib/loginThrottle';
import { logEvent } from '../lib/activityLog';
import { createSession } from '../lib/sessions';
import { verifyPassword } from '../lib/users';
const loginThrottle = new LoginThrottle();

export function registerPublicAuthRoutes(app: Express): void {
  // --- Auth ------------------------------------------------------------------
  // Registered before the requireAuth gate below, so login itself doesn't
  // need a session yet.

  app.post(
    '/api/auth/login',
    wrap((req, res) => {
      const username = String(req.body?.username ?? '').trim();
      const password = String(req.body?.password ?? '');
      if (!username || !password) throw new HttpError(400, 'Username and password are required');
      // The frontend proxy stamps the real client address into X-Client-IP
      // (overwriting whatever the browser sent); direct calls fall back to
      // the socket address.
      const clientIp = String(req.headers['x-client-ip'] ?? req.socket.remoteAddress ?? 'unknown');
      const retryAfter = loginThrottle.retryAfterSeconds(clientIp, username);
      if (retryAfter > 0) {
        res.setHeader('Retry-After', String(retryAfter));
        throw new HttpError(429, `Too many failed sign-in attempts. Try again in ${Math.ceil(retryAfter / 60)} min.`);
      }
      const user = verifyPassword(username, password);
      if (!user) {
        loginThrottle.recordFailure(clientIp, username);
        logEvent(username || '(blank)', 'Failed login attempt', `Unknown username or wrong password`, {
          level: 'warn',
          category: 'auth',
        });
        throw new HttpError(401, 'Invalid username or password');
      }
      loginThrottle.recordSuccess(clientIp);
      const publicUser = { id: user.id, username: user.username, role: user.role, created_at: user.created_at };
      const token = createSession(publicUser);
      logEvent(publicUser.username, 'Logged in');
      res.json({ token, user: publicUser });
    }),
  );

}
