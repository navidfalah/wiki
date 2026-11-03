import type { Express } from 'express';
import { HttpError, wrap } from '../lib/httpError';
import { logEvent } from '../lib/activityLog';
import { loadLlmSettings, LlmSettingsError, saveLlmSettings, toPublicSettings } from '../lib/llmSettings';
import { CompanySettingsError, loadCompanySettings, saveCompanySettings } from '../lib/companySettings';
import { loadPipelineSettings, PipelineSettingsError, savePipelineSettings } from '../lib/pipelineSettings';
import { loadRagSettings, RagSettingsError, saveRagSettings } from '../lib/ragSettings';
import { applyRagPreset, deleteRagPreset, listRagPresets, saveRagPreset } from '../lib/ragPresets';

export function registerSettingsRoutes(app: Express): void {
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

  // Named RAG presets -- saved snapshots of the settings above, so the RAG
  // Architecture page can switch between several tuned configurations
  // instead of only ever having the one active config.

  app.get(
    '/api/settings/rag/presets',
    wrap((_req, res) => {
      res.json({ presets: listRagPresets() });
    }),
  );

  app.post(
    '/api/settings/rag/presets',
    wrap((req, res) => {
      try {
        const saved = saveRagPreset(req.body?.name, req.body?.settings);
        logEvent(req.user?.username, `Saved RAG preset "${saved.name}"`);
        res.json(saved);
      } catch (err) {
        if (err instanceof RagSettingsError) throw new HttpError(400, err.message);
        throw err;
      }
    }),
  );

  app.post(
    '/api/settings/rag/presets/:id/apply',
    wrap((req, res) => {
      try {
        const saved = applyRagPreset(req.params.id);
        logEvent(req.user?.username, 'Applied RAG preset');
        res.json(saved);
      } catch (err) {
        if (err instanceof RagSettingsError) throw new HttpError(400, err.message);
        throw err;
      }
    }),
  );

  app.delete(
    '/api/settings/rag/presets/:id',
    wrap((req, res) => {
      const result = deleteRagPreset(req.params.id);
      if (!result.removed) throw new HttpError(404, 'Preset not found');
      logEvent(req.user?.username, 'Deleted RAG preset');
      res.json(result);
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

}
