import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import { registerRoutes } from './routes';

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status ?? 500;
  res.status(status).json({ detail: err.message ?? 'Internal server error' });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`wiki-backend listening on http://localhost:${PORT}`);
});
