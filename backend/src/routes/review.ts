import type { Express } from 'express';
import { HttpError, wrap } from '../lib/httpError';
import { logEvent } from '../lib/activityLog';
import { runCli } from '../lib/pythonBridge';

export function registerReviewRoutes(app: Express): void {
  // --- Review queue (bridged to active_learning.py, task #9) ---------------

  app.get(
    '/api/review-queue',
    wrap(async (_req, res) => {
      res.json(await runCli('review-queue'));
    }),
  );

  app.post(
    '/api/review-queue/correct',
    wrap(async (req, res) => {
      try {
        const { claim_id: claimId, group_id: groupId, verdict, note, quote } = req.body ?? {};
        const result = await runCli('review-correct', { claim_id: claimId, group_id: groupId, verdict, note, quote });
        logEvent(req.user?.username, 'Recorded review correction', String(claimId ?? ''));
        res.status(201).json(result);
      } catch (err: any) {
        throw new HttpError(400, err.message);
      }
    }),
  );

}
