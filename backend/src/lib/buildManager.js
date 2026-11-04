'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { compile } = require('./compilerEngine');
const { createModelClient } = require('./modelClient');

function createBuildManager(config) {
  let current = null, queued = null;
  const send = (res, event) => { if (!res.destroyed && !res.writableEnded) res.write(`data: ${JSON.stringify(event)}\n\n`); };
  const headers = (res) => { if (!res.headersSent) res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' }); };
  function save(run, index) {
    config.atomicWriteJson(path.join(config.runsDir, `${run.id}.json`), run);
    if (!index) return;
    let rows = []; try { rows = JSON.parse(fs.readFileSync(path.join(config.runsDir, 'index.json'), 'utf8')); } catch { /* new history */ }
    if (!Array.isArray(rows)) rows = [];
    const { steps: _steps, token_usage: _tokenUsage, error: _error, ...summary } = run;
    rows = [summary, ...rows.filter((row) => row.id !== run.id)].slice(0, 200);
    config.atomicWriteJson(path.join(config.runsDir, 'index.json'), rows);
  }
  function next() {
    current = null;
    if (!queued) return;
    const item = queued; queued = null;
    if (!item.res.destroyed) startNow(item.res, item.options);
  }
  function startNow(res, options) {
    current = { controller: new AbortController(), id: null };
    headers(res);
    const now = new Date(), stamp = now.toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '-');
    const id = `${stamp}-${crypto.randomBytes(3).toString('hex')}`; current.id = id;
    const controller = current.controller; let modelConfig;
    try { modelConfig = config.modelConfig(options); }
    catch (error) { config.logError(String(error.message || error)); send(res, { type: 'done', code: 1, success: false, stopped: false, message: 'Unable to load build settings.' }); res.end(); next(); return; }
    const model = createModelClient({ ...modelConfig, cacheFile: config.cacheFile });
    const snapshot = (profile) => ({ model: profile.model, base_url: profile.base, available: Boolean(profile.apiKey) });
    const run = { id, started_at: now.toISOString(), finished_at: null, status: 'running', force: Boolean(options.force), error: null, steps: [], token_usage: [], settings: { default: snapshot(modelConfig.default), thinking: snapshot(modelConfig.thinking), embedding: { model: modelConfig.embeddingModel } } };
    const stepByName = new Map(); let currentStep = null;
    const onProgress = ({ stage, current: count, total, detail }) => {
      if (!stepByName.has(stage)) { const step = { name: stage, status: 'running', started_at: new Date().toISOString(), finished_at: null, detail: null, error: null, data: null, progress: null }; run.steps.push(step); stepByName.set(stage, step); }
      currentStep = stepByName.get(stage); currentStep.progress = { current: count, total, recent: [detail] };
      save(run, false); send(res, { type: 'log', message: `${stage}: ${count}/${total} ${detail}` });
    };
    const finish = (status, error) => {
      const time = new Date().toISOString(); run.status = status; run.finished_at = time; run.error = error || null; run.token_usage = model.usage;
      for (const step of run.steps) { step.finished_at = time; step.status = status === 'success' ? 'success' : step === currentStep ? status : 'success'; if (step === currentStep && error) step.error = error; }
      save(run, true);
    };
    (async () => {
      try {
        save(run, true); send(res, { type: 'start', message: 'Starting JavaScript compiler…' }); send(res, { type: 'run_id', run_id: id });
        const result = await compile({ ...config.compilerOptions, model, signal: controller.signal, onProgress, force: options.force, excludeFolders: options.excludeFolders, redactPii: options.redactPii !== false, criticPass: options.criticPass, criticSamples: options.criticSamples, criticRegenerate: options.criticRegenerate, useCorrections: options.useCorrections, webSearch: options.webSearch });
        finish('success'); send(res, { type: 'done', code: 0, success: true, stopped: false, message: 'Build complete.', result });
      } catch (error) {
        const stopped = controller.signal.aborted || error.name === 'AbortError', message = stopped ? 'Build stopped by user.' : String(error.message || 'Build failed.');
        try { finish(stopped ? 'stopped' : 'error', message); } catch { /* report original failure */ }
        if (!stopped) config.logError(message);
        send(res, { type: 'done', code: 1, success: false, stopped, message });
      } finally { if (!res.destroyed && !res.writableEnded) res.end(); next(); }
    })();
  }
  function start(res, options) {
    if (!current) { startNow(res, options); return; }
    if (queued) { res.status(409).json({ detail: 'A build is already running and another is already queued' }); return; }
    headers(res); send(res, { type: 'queued', message: 'A build is already running -- this one will start automatically once it finishes.' });
    queued = { res, options }; res.on('close', () => { if (queued?.res === res) queued = null; });
  }
  function stop() {
    if (!current) return false;
    current.controller.abort(); return true;
  }
  return { start, stop, running: () => Boolean(current), queued: () => Boolean(queued), currentRunId: () => current?.id || null };
}
module.exports = { createBuildManager };
