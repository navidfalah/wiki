import fs from 'node:fs';
import path from 'node:path';
import type { Express } from 'express';
import multer from 'multer';

import { INDEX_JSON, OUTPUT_DIR, RAW_DIR, REVIEW_REPORT_PATH, STATE_FILE } from '../paths';
import { HttpError, wrap } from '../lib/httpError';
import { buildAnalytics, getTagDetail } from '../lib/analytics';
import { buildAttentionReport } from '../lib/attentionEngine';
import {
  appendChatSessionTurn,
  createChatSession,
  deleteChatSession,
  listChatSessions,
  loadChatSession,
  renameChatSession,
  setChatSessionResourceScope,
} from '../lib/chatSessions';
import { listEvents, logEvent } from '../lib/activityLog';
import { describeLlmBackend } from '../lib/llmBackend';
import { requireAdmin, requireAuth } from '../lib/authMiddleware';
import { createSession, deleteSession } from '../lib/sessions';
import { createUser, deleteUser, ensureBootstrapAdmin, listUsers, UserError, verifyPassword } from '../lib/users';
import { loadLlmSettings, LlmSettingsError, saveLlmSettings, toPublicSettings } from '../lib/llmSettings';
import { CompanySettingsError, loadCompanySettings, saveCompanySettings } from '../lib/companySettings';
import { loadPipelineSettings, PipelineSettingsError, savePipelineSettings } from '../lib/pipelineSettings';
import { loadRagSettings, RagSettingsError, saveRagSettings } from '../lib/ragSettings';
import {
  collectSourceMetadata,
  parseFrontmatter,
  readDocPayload,
  rawFileStatus,
  loadTopicIndex,
  synthesizedPagesForTopics,
} from '../lib/docUtils';
import { categorizePages } from '../lib/docCategories';
import {
  buildKnowledgeGraphPayload,
  loadLinkOverrides,
  saveLinkOverrides,
  validateConnections,
} from '../lib/linkOverrides';
import { deletePipelineRun, getPipelineRun, listPipelineRuns } from '../lib/pipelineRuns';
import { isBuildRunning, runCli, stopBuild, streamChat, streamCompilerBuild } from '../lib/pythonBridge';
import { createFolder, deleteFile, deleteFolder, discoverRawFolders, FolderError, moveFile, uploadFiles } from '../lib/rawFolders';
import {
  AUDIO_PREVIEW_EXTENSIONS,
  computeMd5,
  discoverRawSourceFiles,
  IMAGE_PREVIEW_EXTENSIONS,
  loadState,
  mimeTypeFor,
  TEXT_PREVIEW_EXTENSIONS,
} from '../lib/rawFiles';
import { getResourceDetail, listResources, resolveDocPaths } from '../lib/resourcesEngine';
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

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024, files: 20 } });

export function registerRoutes(app: Express): void {
  syncSymlinks();
  ensureBootstrapAdmin();

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  // --- Auth ------------------------------------------------------------------
  // Registered before the requireAuth gate below, so login itself doesn't
  // need a session yet.

  app.post(
    '/api/auth/login',
    wrap((req, res) => {
      const username = String(req.body?.username ?? '').trim();
      const password = String(req.body?.password ?? '');
      if (!username || !password) throw new HttpError(400, 'Username and password are required');
      const user = verifyPassword(username, password);
      if (!user) throw new HttpError(401, 'Invalid username or password');
      const publicUser = { id: user.id, username: user.username, role: user.role, created_at: user.created_at };
      const token = createSession(publicUser);
      logEvent(publicUser.username, 'Logged in');
      res.json({ token, user: publicUser });
    }),
  );

  app.use('/api', requireAuth);

  app.post('/api/auth/logout', (req, res) => {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) deleteSession(header.slice('Bearer '.length).trim());
    logEvent(req.user?.username, 'Logged out');
    res.json({ ok: true });
  });

  app.get(
    '/api/activity',
    wrap((_req, res) => {
      res.json({ events: listEvents() });
    }),
  );

  app.get('/api/auth/me', (req, res) => {
    res.json({ user: req.user });
  });

  // --- User management (admin only) -----------------------------------------

  app.get(
    '/api/users',
    requireAdmin,
    wrap((_req, res) => {
      res.json({ users: listUsers() });
    }),
  );

  app.post(
    '/api/users',
    requireAdmin,
    wrap((req, res) => {
      const username = String(req.body?.username ?? '').trim();
      const password = String(req.body?.password ?? '');
      const role = req.body?.role === 'admin' ? 'admin' : 'user';
      try {
        const user = createUser(username, password, role);
        logEvent(req.user?.username, `Created user ${user.username} (${user.role})`);
        res.json(user);
      } catch (err) {
        if (err instanceof UserError) throw new HttpError(400, err.message);
        throw err;
      }
    }),
  );

  app.delete(
    '/api/users/:id',
    requireAdmin,
    wrap((req, res) => {
      try {
        deleteUser(req.params.id, req.user!.id);
        logEvent(req.user?.username, `Deleted user ${req.params.id}`);
        res.json({ removed: true, id: req.params.id });
      } catch (err) {
        if (err instanceof UserError) throw new HttpError(400, err.message);
        throw err;
      }
    }),
  );

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
        logEvent(req.user?.username, 'Added source folder', `${entry.label} (${entry.path})`);
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
      logEvent(req.user?.username, 'Removed source folder', req.params.id);
      res.json({ removed: true, id: req.params.id });
    }),
  );

  app.put(
    '/api/sources/:id',
    wrap((req, res) => {
      if (req.body?.enabled === undefined) throw new HttpError(400, "'enabled' is required");
      const entry = setEnabled(req.params.id, Boolean(req.body.enabled));
      if (!entry) throw new HttpError(404, `Source not found: ${req.params.id}`);
      logEvent(req.user?.username, entry.enabled ? 'Enabled source folder' : 'Disabled source folder', entry.label);
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
    '/api/raw-files/raw/*',
    wrap((req, res) => {
      const relPath = (req.params as any)[0] as string;
      const filePath = safePath(RAW_DIR, relPath);
      if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        throw new HttpError(404, `Raw file not found: ${relPath}`);
      }
      res.setHeader('Content-Type', mimeTypeFor(filePath));
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(path.basename(filePath))}"`);
      fs.createReadStream(filePath).pipe(res);
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
      const ext = path.extname(filePath).toLowerCase();
      const isText = TEXT_PREVIEW_EXTENSIONS.has(ext);
      const isImage = IMAGE_PREVIEW_EXTENSIONS.has(ext);
      const isAudio = AUDIO_PREVIEW_EXTENSIONS.has(ext);
      const content = isText ? fs.readFileSync(filePath, 'utf-8') : null;
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
        is_text: isText,
        is_image: isImage,
        is_audio: isAudio,
        is_pdf: ext === '.pdf',
        mime: mimeTypeFor(filePath),
        raw_url: `/api/raw-files/raw/${rel.split('/').map(encodeURIComponent).join('/')}`,
        processed_at: stateEntry.processed_at ?? null,
        topics: metadata.topics,
        entities: metadata.entities,
        concepts: metadata.concepts,
        synthesized_pages: synthesizedPages,
      });
    }),
  );

  app.post(
    '/api/raw-files/upload',
    upload.array('files', 20),
    wrap((req, res) => {
      const parent = (req.body?.parent as string) ?? '';
      const files = ((req.files as Express.Multer.File[]) ?? []).map((f) => ({
        originalName: f.originalname,
        buffer: f.buffer,
      }));
      try {
        const saved = uploadFiles(RAW_DIR, parent, files, managedNames());
        logEvent(req.user?.username, `Uploaded ${saved.length} file${saved.length === 1 ? '' : 's'}`, saved.join(', '));
        res.json({ saved });
      } catch (err) {
        if (err instanceof FolderError) throw new HttpError(400, err.message);
        throw err;
      }
    }),
  );

  app.post(
    '/api/raw-files/folders',
    wrap((req, res) => {
      try {
        const relPath = createFolder(RAW_DIR, req.body?.parent ?? '', req.body?.name ?? '', managedNames());
        logEvent(req.user?.username, 'Created folder', relPath);
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
        logEvent(req.user?.username, 'Deleted folder', folderPath);
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
        logEvent(req.user?.username, 'Moved file', `${req.body?.path} → ${newPath}`);
        res.json({ path: newPath });
      } catch (err) {
        if (err instanceof FolderError) throw new HttpError(400, err.message);
        throw err;
      }
    }),
  );

  app.delete(
    '/api/raw-files/*',
    wrap((req, res) => {
      const relPath = (req.params as any)[0] as string;
      try {
        deleteFile(RAW_DIR, relPath, managedNames());
        logEvent(req.user?.username, 'Deleted file', relPath);
        res.json({ removed: true, path: relPath });
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
        const result = await runCli('email-create', emailPayload(req.body));
        logEvent(req.user?.username, 'Created email', result.path);
        res.status(201).json(result);
      } catch (err: any) {
        if (err.errorType === 'not_an_email') throw new HttpError(400, err.message);
        if (!err.errorType) throw new HttpError(400, err.message);
        throw err;
      }
    }),
  );

  app.put(
    '/api/emails/*',
    wrap(async (req, res) => {
      const relPath = (req.params as any)[0] as string;
      try {
        const result = await runCli('email-update', { path: relPath, ...emailPayload(req.body) });
        logEvent(req.user?.username, 'Updated email', relPath);
        res.json(result);
      } catch (err: any) {
        if (err.errorType === 'not_an_email') throw new HttpError(400, err.message);
        if (err.errorType === 'not_found') throw new HttpError(404, err.message);
        if (!err.errorType) throw new HttpError(400, err.message);
        throw err;
      }
    }),
  );

  app.delete(
    '/api/emails/*',
    wrap(async (req, res) => {
      const relPath = (req.params as any)[0] as string;
      try {
        const result = await runCli('email-delete', { path: relPath });
        logEvent(req.user?.username, 'Deleted email', relPath);
        res.json(result);
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
            tags: meta.tags_list ?? [],
          };
        });
      const categories = categorizePages(pages);
      const pagesWithCategory = pages.map(({ tags: _tags, ...page }) => ({
        ...page,
        category: categories.get(page.path) ?? null,
      }));
      res.json({ directory: OUTPUT_DIR, total: pagesWithCategory.length, pages: pagesWithCategory });
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

  app.put(
    '/api/docs/*',
    wrap((req, res) => {
      const relPath = (req.params as any)[0] as string;
      const docPath = safePath(OUTPUT_DIR, relPath);
      if (!fs.existsSync(docPath) || !fs.statSync(docPath).isFile()) {
        throw new HttpError(404, `Doc not found: ${relPath}`);
      }
      const body = (req.body as any)?.body;
      if (typeof body !== 'string') throw new HttpError(400, 'body (string) is required');

      const raw = fs.readFileSync(docPath, 'utf-8');
      let next = body;
      if (raw.startsWith('---')) {
        const first = raw.indexOf('---');
        const second = raw.indexOf('---', first + 3);
        if (second !== -1) {
          next = raw.slice(0, second + 3) + '\n\n' + body.replace(/^\n+/, '');
        }
      }
      fs.writeFileSync(docPath, next, 'utf-8');
      logEvent(req.user?.username, 'Edited wiki page', relPath);
      res.json(readDocPayload(docPath));
    }),
  );

  app.delete(
    '/api/docs/*',
    wrap((req, res) => {
      const relPath = (req.params as any)[0] as string;
      const docPath = safePath(OUTPUT_DIR, relPath);
      if (!fs.existsSync(docPath) || !fs.statSync(docPath).isFile()) {
        throw new HttpError(404, `Doc not found: ${relPath}`);
      }
      fs.unlinkSync(docPath);
      logEvent(req.user?.username, 'Deleted wiki page', relPath);
      res.json({ deleted: relPath });
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
    // Query params, when given, override the Pipeline Architecture page's
    // saved defaults (loadPipelineSettings()) for this one run -- e.g. the
    // Pipelines page's "Rebuild all files" checkbox always sends `force`
    // explicitly. Anything the caller doesn't specify falls back to what
    // was last saved on that settings page, so a configured pipeline
    // architecture applies to every build without re-selecting it each time.
    const pipelineDefaults = loadPipelineSettings();
    const force = req.query.force === 'true';
    const excludeFolders =
      req.query.exclude_folders !== undefined
        ? String(req.query.exclude_folders)
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : pipelineDefaults.excluded_folders;
    const criticPass = req.query.critic_pass !== undefined ? req.query.critic_pass === 'true' : pipelineDefaults.critic_pass;
    const criticSamplesRaw = req.query.critic_samples !== undefined ? Number(req.query.critic_samples) : pipelineDefaults.critic_samples;
    const criticSamples = Number.isFinite(criticSamplesRaw) && criticSamplesRaw > 0 ? Math.floor(criticSamplesRaw) : undefined;
    const criticRegenerate =
      req.query.critic_regenerate !== undefined ? req.query.critic_regenerate === 'true' : pipelineDefaults.critic_regenerate;
    const useCorrections =
      req.query.use_corrections !== undefined ? req.query.use_corrections === 'true' : pipelineDefaults.use_corrections;
    const redactPii = req.query.redact_pii !== undefined ? req.query.redact_pii === 'true' : pipelineDefaults.redact_pii;
    const webSearch = req.query.web_search !== undefined ? req.query.web_search === 'true' : pipelineDefaults.web_search;

    logEvent(
      req.user?.username,
      'Started compiler run',
      [
        force ? 'forced' : 'incremental',
        excludeFolders.length ? `excluding ${excludeFolders.join(', ')}` : null,
        criticPass ? `critic pass${criticSamples && criticSamples > 1 ? ` x${criticSamples}` : ''}${criticRegenerate ? ' +regen' : ''}` : null,
        useCorrections ? 'use corrections' : null,
        redactPii ? 'redact PII' : null,
        webSearch ? 'web search' : null,
      ]
        .filter(Boolean)
        .join(' · '),
    );
    streamCompilerBuild(res, {
      force,
      excludeFolders,
      criticPass,
      criticSamples,
      criticRegenerate,
      useCorrections,
      redactPii,
      webSearch,
    });
  });

  app.post('/api/build/stop', (req, res) => {
    const stopped = stopBuild();
    if (stopped) logEvent(req.user?.username, 'Stopped compiler run');
    res.json({ stopped });
  });

  // --- Pipeline run history -------------------------------------------------

  app.get(
    '/api/pipelines',
    wrap((_req, res) => {
      res.json({ runs: listPipelineRuns(), llm_backend: describeLlmBackend() });
    }),
  );

  app.get(
    '/api/pipelines/:id',
    wrap((req, res) => {
      const run = getPipelineRun(req.params.id);
      if (!run) throw new HttpError(404, `Pipeline run not found: ${req.params.id}`);
      res.json({ ...run, llm_backend: describeLlmBackend() });
    }),
  );

  app.delete(
    '/api/pipelines/:id',
    wrap((req, res) => {
      const run = getPipelineRun(req.params.id);
      if (!run) throw new HttpError(404, `Pipeline run not found: ${req.params.id}`);
      const wasRunning = run.status === 'running' && isBuildRunning();
      if (wasRunning) {
        stopBuild();
        logEvent(req.user?.username, 'Stopped compiler run', req.params.id);
      }
      const result = deletePipelineRun(req.params.id);
      if (!result.removed) throw new HttpError(404, `Pipeline run not found: ${req.params.id}`);
      logEvent(req.user?.username, 'Deleted pipeline run', req.params.id);
      res.json({ removed: true, id: req.params.id, stopped: wasRunning });
    }),
  );

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

  // --- Chat / RAG (bridged to rag_engine.py) --------------------------------

  app.get(
    '/api/chat/status',
    wrap(async (_req, res) => {
      res.json(await runCli('chat-status'));
    }),
  );

  app.get(
    '/api/chat/sessions',
    wrap((_req, res) => {
      res.json({ sessions: listChatSessions() });
    }),
  );

  app.post(
    '/api/chat/sessions',
    wrap((req, res) => {
      const session = createChatSession(req.body?.title);
      res.json(session);
    }),
  );

  app.get(
    '/api/chat/sessions/:id',
    wrap((req, res) => {
      const session = loadChatSession(req.params.id);
      if (!session) throw new HttpError(404, `Chat session not found: ${req.params.id}`);
      res.json(session);
    }),
  );

  app.patch(
    '/api/chat/sessions/:id',
    wrap((req, res) => {
      let session = loadChatSession(req.params.id);
      if (!session) throw new HttpError(404, `Chat session not found: ${req.params.id}`);
      if (typeof req.body?.title === 'string') {
        session = renameChatSession(req.params.id, req.body.title);
      }
      if (req.body?.resource_scope !== undefined) {
        const scope = req.body.resource_scope;
        if (scope !== null && !Array.isArray(scope)) throw new HttpError(400, "'resource_scope' must be a list or null");
        session = setChatSessionResourceScope(req.params.id, scope);
      }
      res.json(session);
    }),
  );

  app.delete(
    '/api/chat/sessions/:id',
    wrap((req, res) => {
      if (!deleteChatSession(req.params.id)) throw new HttpError(404, `Chat session not found: ${req.params.id}`);
      logEvent(req.user?.username, 'Deleted chat session', req.params.id);
      res.json({ removed: true, id: req.params.id });
    }),
  );

  // Not wrap()'d: streamChat() writes SSE headers immediately (like
  // streamCompilerBuild's /api/build/stream above), so any failure after
  // that point has to be reported as an SSE 'error' event, not a JSON
  // error response -- see streamChat's own error handling for that.
  app.get('/api/chat/sessions/:id/stream', async (req, res) => {
    const message = String(req.query.message ?? '').trim();
    if (!message) {
      res.status(400).json({ detail: "'message' is required" });
      return;
    }
    const session = loadChatSession(req.params.id);
    if (!session) {
      res.status(404).json({ detail: `Chat session not found: ${req.params.id}` });
      return;
    }

    const docScope = session.resource_scope ? resolveDocPaths(session.resource_scope) : null;
    const history = session.messages.map((m) => ({ role: m.role, content: m.content }));

    try {
      const result = await streamChat(res, { message, history, docScope });
      const sourcesWithSlug = (result.sources ?? []).map((s) => ({
        ...s,
        slug: s.doc_path.replace(/\.md$/, ''),
      }));
      appendChatSessionTurn(req.params.id, message, result.answer, sourcesWithSlug);
    } catch {
      /* already reported to the client as an SSE 'error' event by streamChat */
    }
  });

  // --- Company profile (general org context) --------------------------------

  app.get(
    '/api/settings/company',
    wrap((_req, res) => {
      res.json(loadCompanySettings());
    }),
  );

  app.put(
    '/api/settings/company',
    wrap((req, res) => {
      try {
        const saved = saveCompanySettings(req.body);
        logEvent(req.user?.username, 'Updated company settings');
        res.json(saved);
      } catch (err) {
        if (err instanceof CompanySettingsError) throw new HttpError(400, err.message);
        throw err;
      }
    }),
  );

  // --- LLM settings (providers, API keys, local Gemma config) --------------

  app.get(
    '/api/settings/llm',
    wrap((_req, res) => {
      res.json(toPublicSettings(loadLlmSettings()));
    }),
  );

  app.put(
    '/api/settings/llm',
    wrap((req, res) => {
      try {
        const saved = saveLlmSettings(req.body);
        logEvent(req.user?.username, 'Updated LLM settings');
        res.json(toPublicSettings(saved));
      } catch (err) {
        if (err instanceof LlmSettingsError) throw new HttpError(400, err.message);
        throw err;
      }
    }),
  );

  // --- Pipeline architecture (persisted default build flags) ---------------

  app.get(
    '/api/settings/pipeline',
    wrap((_req, res) => {
      res.json(loadPipelineSettings());
    }),
  );

  app.put(
    '/api/settings/pipeline',
    wrap((req, res) => {
      try {
        const saved = savePipelineSettings(req.body);
        logEvent(req.user?.username, 'Updated pipeline architecture settings');
        res.json(saved);
      } catch (err) {
        if (err instanceof PipelineSettingsError) throw new HttpError(400, err.message);
        throw err;
      }
    }),
  );

  // --- RAG architecture (retrieval tiers, BM25 tuning, answer mode) --------

  app.get(
    '/api/settings/rag',
    wrap((_req, res) => {
      res.json(loadRagSettings());
    }),
  );

  app.put(
    '/api/settings/rag',
    wrap((req, res) => {
      try {
        const saved = saveRagSettings(req.body);
        logEvent(req.user?.username, 'Updated RAG architecture settings');
        res.json(saved);
      } catch (err) {
        if (err instanceof RagSettingsError) throw new HttpError(400, err.message);
        throw err;
      }
    }),
  );

  app.get(
    '/api/settings/llm/local-status',
    wrap(async (_req, res) => {
      const settings = loadLlmSettings();
      const localProfile = settings.profiles.find((p) => p.provider === 'local');
      const baseUrl = (localProfile?.base_url || 'http://local-llm:8080/v1').replace(/\/+$/, '');
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2500);
        const response = await fetch(`${baseUrl}/models`, { signal: controller.signal });
        clearTimeout(timeout);
        res.json({ reachable: response.ok, base_url: baseUrl });
      } catch {
        res.json({ reachable: false, base_url: baseUrl });
      }
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
