import path from 'node:path';
import cookieParser from 'cookie-parser';
import express, { NextFunction, Request, Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { BACKEND_API_URL, PORT, PUBLIC_API_URL } from './config';
import wikiRouter from './routes/wiki';
import dashboardRouter from './routes/dashboard';
import simpleRouter from './routes/simple';
import usersRouter from './routes/users';
import authRouter from './routes/auth';
import { fetchCurrentUser, getToken } from './lib/auth';

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'src', 'views'));

app.use('/css', express.static(path.join(process.cwd(), 'dist-static', 'css')));
app.use('/js', express.static(path.join(process.cwd(), 'dist-static', 'js')));

app.use(cookieParser());

// Every client-side fetch/EventSource/<img>/<embed> call in the dashboard,
// chat, graph, etc. is written against `${apiBase}/api/...` where apiBase
// is PUBLIC_API_URL, embedded via <meta name="api-base">. Now that pages
// require login, PUBLIC_API_URL points at this server's own origin (see
// config.ts) instead of the backend directly, and this proxy is what
// forwards those calls on -- translating the browser's session cookie
// (HttpOnly, this origin only) into the Authorization header the backend's
// requireAuth middleware expects. This has to stay a byte-for-byte proxy
// (no body-parsing middleware in front of it) so SSE streaming and
// multipart file uploads keep working.
// Mounted with no path prefix on `app.use` deliberately: Express strips a
// `use(path, ...)` prefix from req.url before the middleware sees it, which
// would turn `/api/health` into `/health` by the time the proxy forwards
// it. `pathFilter` matches the same way without that rewrite.
app.use(
  createProxyMiddleware({
    target: BACKEND_API_URL,
    changeOrigin: true,
    pathFilter: '/api/**',
    on: {
      proxyReq: (proxyReq, req) => {
        const token = getToken(req as Request);
        if (token) proxyReq.setHeader('Authorization', `Bearer ${token}`);
      },
    },
  }),
);

app.use('/', authRouter);

app.use(async (req, res, next) => {
  const token = getToken(req);
  const user = await fetchCurrentUser(token);
  if (!user) {
    res.redirect(`/login?next=${encodeURIComponent(req.originalUrl)}`);
    return;
  }
  res.locals.currentUser = user;
  next();
});

app.get('/', (_req, res) => res.redirect('/dashboard'));
app.use('/wiki', wikiRouter);
app.use('/dashboard', dashboardRouter);
app.use('/', usersRouter);
app.use('/', simpleRouter);

app.use((_req, res) => {
  res.status(404).send('Not found');
});

// Without this, an unhandled error (e.g. the backend being unreachable
// from an SSR fetch) falls through to Express's default production error
// handler, which renders a blank page and logs nothing -- exactly what
// makes "nothing there" impossible to diagnose from the browser alone.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  // eslint-disable-next-line no-console
  console.error('[frontend] Unhandled request error:', err);
  res
    .status(500)
    .send(
      `<pre>Server error while rendering this page.\n\n` +
        `Likely cause: the frontend could not reach the backend at BACKEND_API_URL=${BACKEND_API_URL}.\n` +
        `Check: docker compose logs backend   (is it running and healthy?)\n` +
        `       docker compose exec frontend wget -qO- ${BACKEND_API_URL}/api/health\n\n` +
        `${err?.message ?? err}</pre>`,
    );
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`wiki-frontend listening on http://localhost:${PORT}`);
  // eslint-disable-next-line no-console
  console.log(`  BACKEND_API_URL (server-side fetches): ${BACKEND_API_URL}`);
  // eslint-disable-next-line no-console
  console.log(`  PUBLIC_API_URL (embedded for the browser): ${PUBLIC_API_URL}`);
});
