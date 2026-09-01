import path from 'node:path';
import express, { NextFunction, Request, Response } from 'express';
import { BACKEND_API_URL, PORT, PUBLIC_API_URL } from './config';
import wikiRouter from './routes/wiki';
import dashboardRouter from './routes/dashboard';
import simpleRouter from './routes/simple';

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'src', 'views'));

app.use('/css', express.static(path.join(process.cwd(), 'dist-static', 'css')));
app.use('/js', express.static(path.join(process.cwd(), 'dist-static', 'js')));

app.get('/', (_req, res) => res.redirect('/wiki'));
app.use('/wiki', wikiRouter);
app.use('/dashboard', dashboardRouter);
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
