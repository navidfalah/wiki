import type { Express } from 'express';
import { OUTPUT_DIR } from '../paths';
import { wrap } from '../lib/httpError';
import { emailService } from '../lib/emailService';
import { searchCorpusPage, type EmailSummary } from '../lib/searchEngine';

export function registerSearchRoutes(app: Express): void {
  // --- Cross-corpus search --------------------------------------------------
  // One query across wiki pages, resources, and emails -- previously each had
  // only its own local filter (see documentation/36-feature-roadmap.md).

  app.get(
    '/api/search',
    wrap(async (req, res) => {
      const q = String((req.query as Record<string, string | undefined>).q ?? '').trim();
      if (!q) {
        res.json({ query: '', total: 0, results: [] });
        return;
      }
      let emails: EmailSummary[] = [];
      try {
        const emailsData = await emailService.list(true);
        emails = emailsData.emails ?? [];
      } catch {
        // Emails are best-effort here -- a broken compiler bridge shouldn't
        // block search over wiki pages and resources, which are plain fs reads.
      }
      const { total, results } = searchCorpusPage(q, emails, OUTPUT_DIR, 100);
      res.json({ query: q, total, results });
    }),
  );

}
