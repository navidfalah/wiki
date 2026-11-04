import type { Express } from 'express';
import { HttpError, wrap } from '../lib/httpError';
import { logEvent } from '../lib/activityLog';
import { describeLlmBackend } from '../lib/llmBackend';
import { loadLlmSettings } from '../lib/llmSettings';
import { loadPipelineSettings } from '../lib/pipelineSettings';
import { deletePipelineRun, getPipelineRun, listPipelineRuns } from '../lib/pipelineRuns';
import { computeUsageSummary } from '../lib/tokenUsage';
import { getCurrentRunId, isBuildRunning, stopBuild, streamCompilerBuild } from '../lib/buildService';

export function registerBuildRoutes(app: Express): void {
  // --- Build (SSE) ----------------------------------------------------------

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

    // Per-run model picks -- override the Settings page's standing
    // "default"/"thinking" assignments for just this build (see
    // llmSettings.ts's ProfileOverrides). Unknown ids are ignored rather
    // than rejected, so a run doesn't fail SSE mid-stream over a stale
    // profile picked before it was deleted -- it just falls back to the
    // standing assignment.
    const knownProfileIds = new Set(loadLlmSettings().profiles.map((p) => p.id));
    const defaultProfileId =
      typeof req.query.default_profile_id === 'string' && knownProfileIds.has(req.query.default_profile_id)
        ? req.query.default_profile_id
        : undefined;
    const thinkingProfileId =
      typeof req.query.thinking_profile_id === 'string' && knownProfileIds.has(req.query.thinking_profile_id)
        ? req.query.thinking_profile_id
        : undefined;

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
      defaultProfileId,
      thinkingProfileId,
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
      // isBuildRunning() alone only says *some* build is active, not that
      // it's this one -- a stale run stuck at status "running" (e.g. an
      // orphan-reconciliation write that failed) would otherwise cause
      // deleting it to stop a different, unrelated build that's genuinely
      // in progress.
      const wasRunning = run.status === 'running' && isBuildRunning() && getCurrentRunId() === req.params.id;
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

  // --- Token usage & cost --------------------------------------------------

  app.get(
    '/api/usage',
    wrap((_req, res) => {
      res.json({ ...computeUsageSummary(), llm_backend: describeLlmBackend() });
    }),
  );

}
