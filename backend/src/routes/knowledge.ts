import fs from 'node:fs';
import type { Express } from 'express';
import { INDEX_JSON, OUTPUT_DIR, RAW_DIR, REVIEW_REPORT_PATH } from '../paths';
import { HttpError, wrap } from '../lib/httpError';
import { buildAnalytics, getTagDetail } from '../lib/analytics';
import { buildAttentionReport } from '../lib/attentionEngine';
import { logEvent } from '../lib/activityLog';
import { loadTopicIndex } from '../lib/docUtils';
import { buildKnowledgeGraphPayload, loadLinkOverrides, saveLinkOverrides, validateConnections } from '../lib/linkOverrides';
import { runCli } from '../lib/pythonBridge';
import { getResourceDetail, listResources } from '../lib/resourcesEngine';

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

  // --- Entity graph (bridged to entity_graph.py) ----------------------------

  app.get(
    '/api/entity-graph',
    wrap(async (_req, res) => {
      res.json(await runCli('entity-graph'));
    }),
  );

  // --- Temporal facts (bridged to temporal_model.py) ------------------------

  app.get(
    '/api/temporal-facts',
    wrap(async (_req, res) => {
      res.json(await runCli('temporal-facts'));
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
