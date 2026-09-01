import fs from 'node:fs';
import path from 'node:path';
import type { Express } from 'express';

import { INDEX_JSON, OUTPUT_DIR, RAW_DIR, REVIEW_REPORT_PATH, STATE_FILE } from '../paths';
import { HttpError, wrap } from '../lib/httpError';
import { buildAnalytics, getTagDetail } from '../lib/analytics';
import {
  collectSourceMetadata,
  parseFrontmatter,
  readDocPayload,
  rawFileStatus,
  loadTopicIndex,
  synthesizedPagesForTopics,
} from '../lib/docUtils';
import {
  buildKnowledgeGraphPayload,
  loadLinkOverrides,
  saveLinkOverrides,
  validateConnections,
} from '../lib/linkOverrides';
import { isBuildRunning, runCli, streamCompilerBuild } from '../lib/pythonBridge';
import { createFolder, deleteFolder, discoverRawFolders, FolderError, moveFile } from '../lib/rawFolders';
import { computeMd5, discoverRawSourceFiles, loadState } from '../lib/rawFiles';
import { getResourceDetail, listResources } from '../lib/resourcesEngine';
import { addSource, listSources, removeSource, setEnabled, SourceError, syncSymlinks } from '../lib/sourcesRegistry';

function safePath(root: string, relPath: string): string {
  const candidate = path.resolve(root, relPath);
  const rootResolved = path.resolve(root);
  if (candidate !== rootResolved && !candidate.startsWith(rootResolved + path.sep)) {
    throw new HttpError(400, 'Invalid path');
  }
  return candidate;
}

function sourceLabelFor(relPath: string, sources: { link_name: string; label: string }[]): string | null {
  const top = relPath.split('/')[0];
  return sources.find((s) => s.link_name === top)?.label ?? null;
}

function managedNames(): Set<string> {
  return new Set(listSources().map((s) => s.link_name));
}

export function registerRoutes(app: Express): void {
  syncSymlinks();

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  // --- Source folder registry ---------------------------------------------

  app.get(
    '/api/sources',
    wrap((_req, res) => {
      res.json({ raw_dir: RAW_DIR, sources: listSources() });
    }),
  );

  app.post(
    '/api/sources',
    wrap((req, res) => {
      try {
        const entry = addSource(req.body?.path, req.body?.label ?? null);
        res.json(entry);
      } catch (err) {
        if (err instanceof SourceError) throw new HttpError(400, err.message);
        throw err;
      }
    }),
  );

  app.delete(
    '/api/sources/:id',
    wrap((req, res) => {
      if (!removeSource(req.params.id)) throw new HttpError(404, `Source not found: ${req.params.id}`);
      res.json({ removed: true, id: req.params.id });
    }),
  );

  app.put(
    '/api/sources/:id',
    wrap((req, res) => {
      if (req.body?.enabled === undefined) throw new HttpError(400, "'enabled' is required");
      const entry = setEnabled(req.params.id, Boolean(req.body.enabled));
      if (!entry) throw new HttpError(404, `Source not found: ${req.params.id}`);
      res.json(entry);
    }),
  );

  // --- Raw files + folders -------------------------------------------------

  app.get(
    '/api/raw-files',
    wrap((_req, res) => {
      const state = loadState();
      const sources = listSources();
      const files = discoverRawSourceFiles(RAW_DIR).map((filePath) => {
        const rel = path.relative(RAW_DIR, filePath).split(path.sep).join('/');
        const md5 = computeMd5(filePath);
        const status = rawFileStatus(rel, md5, state);
        const entry = state.files?.[rel] ?? {};
        return {
          path: rel,
          status,
          size_bytes: fs.statSync(filePath).size,
          md5,
          processed_at: entry.processed_at ?? null,
          chunk_count: (entry.chunks ?? []).length,
          source: sourceLabelFor(rel, sources),
        };
      });
      const processed = files.filter((f) => f.status === 'Processed').length;
      res.json({
        directory: RAW_DIR,
        total: files.length,
        processed,
        unprocessed: files.length - processed,
        files,
        folders: discoverRawFolders(RAW_DIR),
        managed_folders: sources.map((s) => s.link_name).sort(),
      });
    }),
  );

  app.get(
    '/api/raw-files/*',
    wrap((req, res) => {
      const relPath = (req.params as any)[0] as string;
      const filePath = safePath(RAW_DIR, relPath);
      if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        throw new HttpError(404, `Raw file not found: ${relPath}`);
      }
      const rel = path.relative(RAW_DIR, filePath).split(path.sep).join('/');
      const content = fs.readFileSync(filePath, 'utf-8');
      const md5 = computeMd5(filePath);
      const state = loadState();
      const status = rawFileStatus(rel, md5, state);
      const stateEntry = state.files?.[rel] ?? {};
      const metadata = collectSourceMetadata(stateEntry);
      const synthesizedPages = synthesizedPagesForTopics(metadata.topics, metadata.entities, metadata.concepts);
      res.json({
        path: rel,
        status,
        content,
        processed_at: stateEntry.processed_at ?? null,
        topics: metadata.topics,
        entities: metadata.entities,
        concepts: metadata.concepts,
        synthesized_pages: synthesizedPages,
      });
    }),
  );

  app.post(
    '/api/raw-files/folders',
    wrap((req, res) => {
      try {
        const relPath = createFolder(RAW_DIR, req.body?.parent ?? '', req.body?.name ?? '', managedNames());
        res.json({ path: relPath });
      } catch (err) {
        if (err instanceof FolderError) throw new HttpError(400, err.message);
        throw err;
      }
    }),
  );

  app.delete(
    '/api/raw-files/folders/*',
    wrap((req, res) => {
      const folderPath = (req.params as any)[0] as string;
      try {
        deleteFolder(RAW_DIR, folderPath, managedNames());
        res.json({ removed: true, path: folderPath });
      } catch (err) {
        if (err instanceof FolderError) throw new HttpError(400, err.message);
        throw err;
      }
    }),
  );

  app.post(
    '/api/raw-files/move',
    wrap((req, res) => {
      try {
        const newPath = moveFile(RAW_DIR, req.body?.path ?? '', req.body?.destination ?? '', managedNames());
        res.json({ path: newPath });
      } catch (err) {
        if (err instanceof FolderError) throw new HttpError(400, err.message);
        throw err;
      }
    }),
  );

  // --- Emails (bridged to email_engine.py) ----------------------------------

  app.get(
    '/api/emails',
    wrap(async (_req, res) => {
      res.json(await runCli('emails-list'));
    }),
  );

  app.get(
    '/api/emails/*',
    wrap(async (req, res) => {
      const relPath = (req.params as any)[0] as string;
      try {
        res.json(await runCli('email-detail', { path: relPath }));
      } catch (err: any) {
        if (err.errorType === 'not_an_email') throw new HttpError(400, err.message);
        if (err.errorType === 'not_found') throw new HttpError(404, err.message);
        throw err;
      }
    }),
  );

  // --- Docs ------------------------------------------------------------------

  app.get(
    '/api/docs',
    wrap((_req, res) => {
      if (!fs.existsSync(OUTPUT_DIR)) throw new HttpError(404, `Docs directory not found: ${OUTPUT_DIR}`);
      const pages = fs
        .readdirSync(OUTPUT_DIR)
        .filter((f) => f.endsWith('.md'))
        .sort()
        .map((name) => {
          const filePath = path.join(OUTPUT_DIR, name);
          const raw = fs.readFileSync(filePath, 'utf-8');
          const meta = parseFrontmatter(raw);
          const stem = path.basename(name, '.md');
          const title =
            (typeof meta.title === 'string' && meta.title) ||
            stem.replace(/-/g, ' ').replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1));
          return {
            path: name,
            title,
            id: meta.id ?? null,
            slug: meta.slug ?? null,
            size_bytes: fs.statSync(filePath).size,
          };
        });
      res.json({ directory: OUTPUT_DIR, total: pages.length, pages });
    }),
  );

  app.get(
    '/api/docs/*',
    wrap((req, res) => {
      const relPath = (req.params as any)[0] as string;
      const docPath = safePath(OUTPUT_DIR, relPath);
      if (!fs.existsSync(docPath) || !fs.statSync(docPath).isFile()) {
        throw new HttpError(404, `Doc not found: ${relPath}`);
      }
      res.json(readDocPayload(docPath));
    }),
  );

  app.get(
    '/api/state',
    wrap((_req, res) => {
      if (!fs.existsSync(STATE_FILE)) {
        res.json({ path: STATE_FILE, exists: false, content: { version: 1, files: {}, runs: [] } });
        return;
      }
      try {
        const content = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
        res.json({ path: STATE_FILE, exists: true, content });
      } catch (err: any) {
        throw new HttpError(500, `Invalid state.json: ${err.message}`);
      }
    }),
  );

  // --- Build (SSE, spawns python3 main.py) -----------------------------------

  app.get('/api/build/status', (_req, res) => res.json({ running: isBuildRunning() }));

  app.get('/api/build/stream', (req, res) => {
    const force = req.query.force === 'true';
    streamCompilerBuild(res, force);
  });

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

  // --- Chat / RAG (bridged to rag_engine.py) --------------------------------

  app.post(
    '/api/chat',
    wrap(async (req, res) => {
      const message = String(req.body?.message ?? '').trim();
      if (!message) throw new HttpError(400, "'message' is required");
      const history = req.body?.history;
      if (history !== undefined && !Array.isArray(history)) {
        throw new HttpError(400, "'history' must be a list");
      }
      res.json(await runCli('chat', { message, history }));
    }),
  );

  app.get(
    '/api/chat/status',
    wrap(async (_req, res) => {
      res.json(await runCli('chat-status'));
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
