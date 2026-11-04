import type { Express } from 'express';
import { HttpError, wrap } from '../lib/httpError';
import { logEvent } from '../lib/activityLog';
import { emailService } from '../lib/emailService';

export function registerEmailRoutes(app: Express): void {
  // --- Email sources ----------------------------------------------------------

  app.get(
    '/api/emails',
    wrap(async (_req, res) => {
      res.json(await emailService.list());
    }),
  );

  app.get(
    '/api/emails/*',
    wrap(async (req, res) => {
      const relPath = (req.params as any)[0] as string;
      try {
        res.json(await emailService.detail(relPath));
      } catch (err: any) {
        if (err.errorType === 'not_an_email') throw new HttpError(400, err.message);
        if (err.errorType === 'not_found') throw new HttpError(404, err.message);
        throw err;
      }
    }),
  );

  function emailPayload(body: any) {
    return {
      subject: body?.subject,
      from: body?.from,
      to: Array.isArray(body?.to) ? body.to : String(body?.to ?? '').split(',').map((s: string) => s.trim()).filter(Boolean),
      cc: Array.isArray(body?.cc) ? body.cc : String(body?.cc ?? '').split(',').map((s: string) => s.trim()).filter(Boolean),
      date: body?.date,
      body: body?.body,
    };
  }

  app.post(
    '/api/emails',
    wrap(async (req, res) => {
      try {
        const result = await emailService.create(emailPayload(req.body));
        logEvent(req.user?.username, 'Created email', result.path);
        res.status(201).json(result);
      } catch (err: any) {
        if (err.errorType === 'not_an_email') throw new HttpError(400, err.message);
        if (!err.errorType || err.errorType === 'invalid') throw new HttpError(400, err.message);
        throw err;
      }
    }),
  );

  app.put(
    '/api/emails/*',
    wrap(async (req, res) => {
      const relPath = (req.params as any)[0] as string;
      try {
        const result = await emailService.update(relPath, emailPayload(req.body));
        logEvent(req.user?.username, 'Updated email', relPath);
        res.json(result);
      } catch (err: any) {
        if (err.errorType === 'not_an_email') throw new HttpError(400, err.message);
        if (err.errorType === 'not_found') throw new HttpError(404, err.message);
        if (!err.errorType || err.errorType === 'invalid') throw new HttpError(400, err.message);
        throw err;
      }
    }),
  );

  app.delete(
    '/api/emails/*',
    wrap(async (req, res) => {
      const relPath = (req.params as any)[0] as string;
      try {
        const result = emailService.remove(relPath);
        logEvent(req.user?.username, 'Deleted email', relPath);
        res.json(result);
      } catch (err: any) {
        if (err.errorType === 'not_an_email') throw new HttpError(400, err.message);
        if (err.errorType === 'not_found') throw new HttpError(404, err.message);
        throw err;
      }
    }),
  );

}
