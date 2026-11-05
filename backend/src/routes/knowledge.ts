import fs from 'node:fs';
import type { Express } from 'express';
import { INDEX_JSON, OUTPUT_DIR, RAW_DIR, REVIEW_REPORT_PATH, STATE_FILE } from '../paths';
import { HttpError, wrap } from '../lib/httpError';
import { buildAnalytics, getTagDetail } from '../lib/analytics';
import { buildAttentionReport } from '../lib/attentionEngine';
import { logEvent } from '../lib/activityLog';
import { loadTopicIndex } from '../lib/docUtils';
import { buildKnowledgeGraphPayload, loadLinkOverrides, saveLinkOverrides, validateConnections } from '../lib/linkOverrides';
import { entityGraphPayload } from '../lib/entityGraph';
import { getResourceDetail, listResources } from '../lib/resourcesEngine';
import { loadTrustEvalDataset } from '../lib/trustEvalDataset';
import { buildGroupTimeline } from '../lib/temporalModel';

export function registerKnowledgeRoutes(app: Express): void {
  // --- Knowledge graph ---------------------------------------------------

  app.get(
    '/api/knowledge-graph',
    wrap((_req, res) => {
      const topicIndex = fs.existsSync(INDEX_JSON) ? loadTopicIndex() : {};
      if (Object.keys(topicIndex).length === 0) {
        const overrides = loadLinkOverrides();
        res.json({
          topics: [],
          detected_links: [],
          connections: overrides.connections,
          effective_links: [],
          outgoing_by_topic: {},
          overrides_path: null,
          updated_at: overrides.updated_at ?? null,
        });
        return;
      }
      res.json(buildKnowledgeGraphPayload(topicIndex, OUTPUT_DIR));
    }),
  );

  app.put(
    '/api/knowledge-graph/overrides',
    wrap((req, res) => {
      const topicIndex = loadTopicIndex();
      if (Object.keys(topicIndex).length === 0) {
        throw new HttpError(400, 'index.json has no topics. Run the compiler pipeline first.');
      }
      const rawConnections = req.body?.connections;
      if (!Array.isArray(rawConnections)) throw new HttpError(400, "'connections' must be a list");
      const connections = validateConnections(rawConnections, topicIndex);
      const savedPath = saveLinkOverrides({ version: 1, connections });
      const graph = buildKnowledgeGraphPayload(topicIndex, OUTPUT_DIR);
      logEvent(req.user?.username, 'Updated graph link overrides', `${connections.length} connection(s)`);
      res.json({ saved: true, path: savedPath, connection_count: connections.length, graph });
    }),
  );

  // --- Analytics ---------------------------------------------------------

  app.get(
    '/api/analytics',
    wrap((_req, res) => res.json(buildAnalytics(OUTPUT_DIR))),
  );

  app.get(
    '/api/analytics/tags/:tag',
    wrap((req, res) => {
      const detail = getTagDetail(req.params.tag, OUTPUT_DIR);
      if (!detail) throw new HttpError(404, `Tag not found: ${req.params.tag}`);
      res.json(detail);
    }),
  );

  // --- Attention (missed relations / missed data feed) ---------------------

  app.get(
    '/api/attention',
    wrap((_req, res) => res.json(buildAttentionReport(OUTPUT_DIR))),
  );

  // --- Resources -----------------------------------------------------------

  app.get(
    '/api/resources',
    wrap((req, res) => {
      const { q, source_type: sourceType, trust } = req.query as Record<string, string | undefined>;
      res.json(listResources(OUTPUT_DIR, q, sourceType, trust));
    }),
  );

  app.get(
    '/api/resources/*',
    wrap((req, res) => {
      const sourcePath = (req.params as any)[0] as string;
      const detail = getResourceDetail(sourcePath, OUTPUT_DIR, RAW_DIR);
      if (!detail) throw new HttpError(404, `Resource not found: ${sourcePath}`);
      res.json(detail);
    }),
  );

  // --- Entity graph ----------------------------------------------------------

  app.get(
    '/api/entity-graph',
    wrap((_req, res) => {
      let state: unknown = { files: {} };
      try { state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8')); } catch { /* missing or invalid state */ }
      res.json(entityGraphPayload(state));
    }),
  );

  app.get(
    '/api/temporal-facts',
    wrap((_req, res) => {
      const dataset = loadTrustEvalDataset();
      const groups = dataset.claim_groups.map((group: any) => {
        const timeline = buildGroupTimeline(group);
        const claims = new Map<string, any>(group.claims.map((claim: any) => [claim.id, claim] as [string, any]));
        const facts = Object.values(timeline).map((fact: any) => {
          const claim = claims.get(fact.claim_id)!;
          return { claim_id: fact.claim_id, value: claim.value, source_path: claim.source_path, date: claim.date, valid_from: fact.valid_from, valid_until: fact.valid_until, is_current: fact.is_current };
        }).sort((a: any, b: any) => {
          if (a.valid_from === null && b.valid_from !== null) return 1;
          if (b.valid_from === null && a.valid_from !== null) return -1;
          return String(a.valid_from || '').localeCompare(String(b.valid_from || '')) || a.claim_id.localeCompare(b.claim_id);
        });
        return { group_id: group.id, domain: group.domain, subject: group.subject, facts };
      });
      res.json({ groups });
    }),
  );

  // --- Review report -------------------------------------------------------

  app.get(
    '/api/review-report',
    wrap((_req, res) => {
      if (!fs.existsSync(REVIEW_REPORT_PATH)) {
        res.json({ path: REVIEW_REPORT_PATH, exists: false, content: '' });
        return;
      }
      res.json({
        path: REVIEW_REPORT_PATH,
        exists: true,
        content: fs.readFileSync(REVIEW_REPORT_PATH, 'utf-8'),
      });
    }),
  );
}
