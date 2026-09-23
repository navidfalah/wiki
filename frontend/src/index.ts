import path from 'node:path';
import cookieParser from 'cookie-parser';
import express, { NextFunction, Request, Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { BACKEND_API_URL, PORT, PUBLIC_API_URL, SHOW_SAMPLE_DB_HINT } from './config';
import wikiRouter from './routes/wiki';
import dashboardRouter from './routes/dashboard';
import simpleRouter from './routes/simple';
import usersRouter from './routes/users';
import authRouter from './routes/auth';
import landingRouter from './routes/landing';
import { fetchCurrentUser, getToken } from './lib/auth';
import { assetVersion } from './lib/assetVersion';
import { detectLang, i18nMiddleware } from './lib/i18nMiddleware';
import langRouter from './routes/lang';

const app = express();

app.disable('x-powered-by');
// TRUST_PROXY=1 when sitting behind Caddy (docker-compose.prod.yml) so
// req.ip/req.protocol reflect the real visitor; 0 otherwise, so a client on
// a directly-exposed dev port can't spoof X-Forwarded-For.
const trustProxyHops = Number.parseInt(process.env.TRUST_PROXY ?? '0', 10);
app.set('trust proxy', Number.isFinite(trustProxyHops) && trustProxyHops > 0 ? trustProxyHops : 0);

app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'src', 'views'));

// Unauthenticated liveness probe for Docker's healthcheck / uptime monitors.
// Deliberately doesn't touch the backend: it answers "is this process up".
app.get('/healthz', (_req, res) => {
  res.type('text/plain').send('ok');
});

// Asset URLs carry ?v=<assetVersion()> (see the views), which changes on
// every rebuild, so they're safe to cache for a year. Small servers thank you.
const staticOptions = { maxAge: '365d', immutable: true } as const;
app.use((_req, res, next) => {
  res.locals.assetV = assetVersion();
  next();
});
app.use('/css', express.static(path.join(process.cwd(), 'dist-static', 'css'), staticOptions));
// Font files keep the same name across deploys (referenced from the CSS), so a shorter cache.
app.use('/fonts', express.static(path.join(process.cwd(), 'dist-static', 'fonts'), { maxAge: '30d' }));
app.use('/js', express.static(path.join(process.cwd(), 'dist-static', 'js'), staticOptions));

app.use(cookieParser());
app.use((req, res, next) => {
  res.locals.currentPath = req.originalUrl;
  res.locals.showSampleDb = SHOW_SAMPLE_DB_HINT;
  next();
});
app.use(i18nMiddleware);

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
        // Always overwritten, never forwarded from the browser: the backend's
        // login throttle trusts this as the visitor's address.
        proxyReq.setHeader('X-Client-IP', (req as Request).ip ?? '');
        // The backend localizes its error messages to the UI language.
        proxyReq.setHeader('X-Lang', detectLang(req as Request));
      },
    },
  }),
);

app.use('/', langRouter);
app.use('/', authRouter);
// Public landing page + favicon/robots/sitemap -- must sit above the login gate below.
app.use('/', landingRouter);

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

app.use('/wiki', wikiRouter);
app.use('/dashboard', dashboardRouter);
app.use('/', usersRouter);
app.use('/', simpleRouter);

app.use((_req, res) => {
  res.status(404).send(res.locals.t('common.notFound'));
});

// Without this, an unhandled error (e.g. the backend being unreachable
// from an SSR fetch) falls through to Express's default production error
// handler, which renders a blank page and logs nothing -- exactly what
// makes "nothing there" impossible to diagnose from the browser alone.
// The details go to the server log; the page itself stays generic so an
// internal hostname or stack trace never reaches a public visitor.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  // eslint-disable-next-line no-console
  console.error(`[frontend] Unhandled request error (BACKEND_API_URL=${BACKEND_API_URL}):`, err);
  const t = res.locals.t as (key: string) => string;
  res.status(500).type('text/plain').send(`${t('common.serverError')}\n\n${t('common.serverErrorHint')}`);
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`wiki-frontend listening on http://localhost:${PORT}`);
  // eslint-disable-next-line no-console
  console.log(`  BACKEND_API_URL (server-side fetches): ${BACKEND_API_URL}`);
  // eslint-disable-next-line no-console
  console.log(`  PUBLIC_API_URL (embedded for the browser): ${PUBLIC_API_URL}`);
});
