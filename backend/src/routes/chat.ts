import type { Express } from 'express';
import { HttpError, wrap } from '../lib/httpError';
import { appendAssistantTurn, appendUserTurn, createChatSession, deleteChatSession, listChatSessions, loadChatSession, renameChatSession, setChatSessionCorpusSource, setChatSessionLlmProfile, setChatSessionResourceScope, truncateChatSession } from '../lib/chatSessions';
import { logEvent } from '../lib/activityLog';
import { loadLlmSettings } from '../lib/llmSettings';
import { chatService } from '../lib/chatService';
import { Semaphore } from '../lib/semaphore';

const chatSlots = new Semaphore(Math.max(1, Number(process.env.CHAT_MAX_CONCURRENCY) || 2));
import { resolveDocPaths } from '../lib/resourcesEngine';

export function registerChatRoutes(app: Express): void {
  // --- Chat / retrieval ------------------------------------------------------

  app.get(
    '/api/chat/status',
    wrap((_req, res) => {
      res.json(chatService.status());
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
      if (req.body?.corpus_source !== undefined) {
        const source = req.body.corpus_source;
        if (source !== 'wiki' && source !== 'raw') throw new HttpError(400, "'corpus_source' must be 'wiki' or 'raw'");
        session = setChatSessionCorpusSource(req.params.id, source);
      }
      if (req.body?.llm_profile_id !== undefined) {
        const profileId = req.body.llm_profile_id;
        if (profileId !== null && typeof profileId !== 'string') {
          throw new HttpError(400, "'llm_profile_id' must be a string or null");
        }
        if (profileId !== null && !loadLlmSettings().profiles.some((p) => p.id === profileId)) {
          throw new HttpError(400, `Unknown LLM profile: ${profileId}`);
        }
        session = setChatSessionLlmProfile(req.params.id, profileId);
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

  // Backs "edit" and "resend" on a past user message -- the client drops
  // that message and everything after it (its own reply included), then
  // either re-populates the composer (edit) or immediately resubmits the
  // same text (resend) through the normal /stream endpoint.
  app.post(
    '/api/chat/sessions/:id/truncate',
    wrap((req, res) => {
      const keep = Number(req.body?.keep);
      if (!Number.isInteger(keep) || keep < 0) throw new HttpError(400, "'keep' must be a non-negative integer");
      const session = truncateChatSession(req.params.id, keep);
      if (!session) throw new HttpError(404, `Chat session not found or 'keep' out of range: ${req.params.id}`);
      res.json(session);
    }),
  );

  // Send extractive results over the existing SSE protocol.
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

    // Resource scoping is wiki-doc-path based, so it only applies in wiki
    // mode -- a raw-sources chat searches all of data/raw/ unscoped.
    const corpusSource = session.corpus_source === 'raw' ? 'raw' : 'wiki';
    const docScope = corpusSource === 'wiki' && session.resource_scope ? resolveDocPaths(session.resource_scope) : null;

    // Persisted before streamChat runs, not after it succeeds: streamChat
    // can fail partway through (a dropped connection, an LLM error), and
    // that used to mean the user's own question was never saved at all --
    // reopening the session made the whole exchange vanish with no trace,
    // even though the composer had already cleared it client-side.
    appendUserTurn(req.params.id, message);

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    const emit = (event: Record<string, unknown>) => res.write(`data: ${JSON.stringify(event)}\n\n`);
    const release = await chatSlots.acquire();
    try {
      if (res.destroyed) return;
      const result = await chatService.answer({ message, docScope, corpusSource });
      if (res.destroyed) return;
      const sourcesWithSlug = result.sources.map((source) =>
        corpusSource === 'wiki' ? { ...source, slug: source.doc_path.replace(/\.md$/, '') } : { ...source },
      );
      appendAssistantTurn(req.params.id, result.answer, sourcesWithSlug, result.faithfulness);
      emit({ type: 'sources', sources: sourcesWithSlug });
      emit({ type: 'delta', text: result.answer });
      emit({ type: 'done', ...result, sources: sourcesWithSlug });
    } catch {
      if (!res.destroyed) emit({ type: 'error', message: 'Could not search the selected sources.' });
    } finally {
      release();
      if (!res.destroyed) res.end();
    }
  });

}
