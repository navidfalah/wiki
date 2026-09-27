/**
 * The Express app: middleware, routes and the error handler. No port and
 * no startup side effects -- index.ts does those -- so tests can create it
 * against a temporary data root (see routes.test.ts).
 */
import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import { registerRoutes } from './routes';
import { logSystemEvent } from './lib/activityLog';
import { langFromRequest, localizeMessage } from './lib/localizeMessage';
import { HttpError } from './lib/httpError';

export function createApp(): express.Express {
  const app = express();

  app.disable('x-powered-by');

  // In production the browser only ever talks to the frontend origin (which
  // proxies /api), so CORS is irrelevant there; it's kept for local dev where
  // the browser may hit :8000 directly. Set CORS_ORIGINS (comma-separated) to
  // allow other origins, e.g. https://wissensbau.de.
  const corsOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:3000,http://127.0.0.1:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.use(
    cors({
      origin: corsOrigins,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    }),
  );
  app.use(express.json());

  // This is an API-only server -- there's no page here. "Cannot GET /" from
  // Express's default 404 reads like a broken deployment; this makes it
  // obvious that :8000 is working as intended and points at the actual site.
  app.get('/', (_req, res) => {
    res.json({
      service: 'wiki-backend',
      status: 'ok',
      message: 'This is the API server, not the site. Open the frontend instead.',
      frontend: 'http://localhost:3000',
      health: '/api/health',
    });
  });

  registerRoutes(app);

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status ?? 500;
    // Only genuine server errors, not routine 4xx (bad input, not found, a
    // wrong password already logged separately) -- those aren't "the system
    // is broken," they're expected client-facing outcomes, and logging every
    // one would drown out the errors actually worth noticing.
    if (status >= 500) {
      logSystemEvent('Unhandled request error', `${req.method} ${req.originalUrl} -- ${err.message ?? err}`, 'error');
    }
    // HttpError messages are deliberately client-facing (routes throw them on
    // purpose). Anything else reaching here is an unexpected exception --
    // its .message can carry internal detail (file paths, SQL errors, stack
    // text) that shouldn't leak to the client, so it's logged above but not echoed.
    const detail = err instanceof HttpError ? err.message : 'Internal server error';
    res.status(status).json({ detail: localizeMessage(detail, langFromRequest(req)) });
  });

  return app;
}
