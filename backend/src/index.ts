import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import { registerRoutes } from './routes';
import { reconcileOrphanedPipelineRuns } from './lib/pipelineRuns';
import { runCli } from './lib/pythonBridge';
import { logSystemEvent } from './lib/activityLog';
import { HttpError } from './lib/httpError';

const app = express();
const PORT = Number(process.env.PORT ?? 8000);

app.use(
  cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
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
  res.status(status).json({ detail });
});

const reconciled = reconcileOrphanedPipelineRuns();
if (reconciled.length) {
  // eslint-disable-next-line no-console
  console.log(`Marked ${reconciled.length} orphaned pipeline run(s) as failed: ${reconciled.join(', ')}`);
  logSystemEvent(
    `Recovered ${reconciled.length} interrupted pipeline run(s)`,
    reconciled.join(', '),
    'warn',
  );
}

// Fire-and-forget: doesn't block startup, and a missing CONNECTOR_SECRET_KEY
// (or any other failure) just means the /database page falls back to its
// normal empty state -- logged here rather than surfaced to a user who
// didn't take any action to trigger it.
runCli<{ connected: string[]; already_connected: string[] }>('connectors-ensure-defaults')
  .then(({ connected }) => {
    if (connected.length) {
      // eslint-disable-next-line no-console
      console.log(`Connected default sample account(s): ${connected.join(', ')}`);
      logSystemEvent('Connected default sample account(s)', connected.join(', '));
    }
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.log(`Skipped default sample connections: ${err.message}`);
    logSystemEvent('Skipped default sample connections', err.message, 'warn');
  });

logSystemEvent('Backend started', `pid ${process.pid}, port ${PORT}`);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`wiki-backend listening on http://localhost:${PORT}`);
});
