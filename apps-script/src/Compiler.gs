/* Resumable compiler. Every completed unit is checkpointed in Drive. */
function wbJob_(ws) {
  var pointer = wbRead_(ws.root, 'job-pointer.json', null);
  return pointer ? wbRead_(DriveApp.getFolderById(pointer.folderId), 'job.json', null) : null;
}
function wbSaveJob_(job) { wbWrite_(DriveApp.getFolderById(job.folderId), 'job.json', JSON.stringify(job)); }
function wbJobSummary_(job) {
  if (!job) return null;
  return { id: job.id, status: job.status, phase: job.phase, cursor: job.cursor, total: job.total, startedAt: job.startedAt, finishedAt: job.finishedAt || null, failures: job.failures || [], warnings: job.warnings || [], sourceCount: job.sources.length, pageCount: job.pages.length, ai: job.settings.aiCompile, calls: job.calls || 0, cacheHits: job.cacheHits || 0 };
}
function wbRemoveTriggers_() { ScriptApp.getProjectTriggers().filter(function (t) { return t.getHandlerFunction() === 'runQueuedBuild'; }).forEach(function (t) { ScriptApp.deleteTrigger(t); }); }
function wbSchedule_(job) {
  if (!job.settings.autoResume || job.status !== 'running') return;
  wbRemoveTriggers_(); ScriptApp.newTrigger('runQueuedBuild').timeBased().after(60000).create();
}
function apiStartBuild(force) {
  return wbReply_(function () { return wbLock_(function () {
    var ws = wbWorkspace_(), prior = wbJob_(ws);
    if (prior && prior.status === 'running') return wbJobSummary_(prior);
    var settings = wbSettings_(ws);
    if (settings.aiCompile && !wbProps_().getProperty('WB_API_KEY')) throw new Error('API_KEY_REQUIRED');
    var id = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14) + '-' + Utilities.getUuid().slice(0, 8), folder = ws.builds.createFolder(id);
    var sources = wbListSources_(ws.inbox);
    var job = { id: id, folderId: folder.getId(), status: 'running', phase: 'reading', cursor: 0, total: sources.length, queue: sources, sources: [], groups: [], pages: [], failures: [], warnings: [], calls: 0, cacheHits: 0, startedAt: new Date().toISOString(), settings: settings, force: Boolean(force), keyFingerprint: settings.aiCompile ? wbHash_(wbProps_().getProperty('WB_API_KEY')) : null, previous: wbSnapshot_(ws), textChars: 0 };
    wbProps_().deleteProperty('WB_CANCEL');
    wbSaveJob_(job); wbWrite_(ws.root, 'job-pointer.json', JSON.stringify({ folderId: folder.getId() })); wbSchedule_(job);
    return wbJobSummary_(job);
  }); });
}
function wbModel_(ws, settings, prompt, job) {
  var key = wbProps_().getProperty('WB_API_KEY'); if (!key) throw new Error('API_KEY_REQUIRED');
  if (job && job.keyFingerprint !== wbHash_(key)) throw new Error('API_SETTINGS_CHANGED');
  if (prompt.user.length + prompt.system.length > 60000) throw new Error('MODEL_CONTEXT_LIMIT');
  var signature = wbHash_(JSON.stringify({ model: settings.model, apiBase: settings.apiBase, prompt: prompt })), name = signature + '.json';
  var cached = wbRead_(ws.cache, name, null);
  if (cached) { if (job) job.cacheHits++; return cached.text; }
  var response;
  for (var attempt = 0; attempt < 2; attempt++) {
    response = UrlFetchApp.fetch(settings.apiBase + '/chat/completions', {
      method: 'post', contentType: 'application/json', headers: { Authorization: 'Bearer ' + key },
      payload: JSON.stringify({ model: settings.model, messages: [{ role: 'system', content: prompt.system }, { role: 'user', content: prompt.user }] }),
      muteHttpExceptions: true, followRedirects: false, validateHttpsCertificates: true
    });
    var code = response.getResponseCode();
    if (code >= 200 && code < 300) break;
    if ((code === 429 || code >= 500) && attempt === 0) { Utilities.sleep(500); continue; }
    throw new Error(code === 401 || code === 403 ? 'API_AUTH_FAILED' : code === 429 ? 'API_RATE_LIMIT' : 'API_REQUEST_FAILED');
  }
  var data;
  try { data = JSON.parse(response.getContentText()); } catch (e) { throw new Error('API_RESPONSE_INVALID'); }
  var result = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if (typeof result !== 'string' || !result.trim()) throw new Error('API_RESPONSE_INVALID');
  wbWrite_(ws.cache, name, JSON.stringify({ text: result, createdAt: new Date().toISOString() }));
  if (job) job.calls++;
  return result;
}
function wbCompileUnit_(job, ws) {
  if (job.phase === 'reading') {
    if (job.cursor >= job.queue.length) {
      if (job.failures.length) { job.status = 'error'; job.finishedAt = new Date().toISOString(); return; }
      job.phase = 'extracting'; job.cursor = 0; job.total = job.sources.reduce(function (n, s) { return n + s.chunks.length; }, 0); return;
    }
    var source = job.queue[job.cursor++];
    try {
      var read = wbReadSource_(source, ws, job.settings);
      job.textChars += read.text.length;
      if (job.textChars > WB_LIMITS.corpusChars) throw new Error('CORPUS_TEXT_LIMIT');
      var signature = wbHash_(WikiCore.VERSION + '\n' + source.title + '\n' + source.path + '\n' + job.settings.aiCompile + '\n' + job.settings.model + '\n' + job.settings.apiBase + '\n' + read.text);
      var old = job.previous.sources.filter(function (s) { return s.id === source.id && s.signature === signature; })[0];
      source.signature = signature; source.warnings = read.warnings;
      source.chunks = old && !job.force ? old.chunks : WikiCore.chunks(read.text).map(function (text) { return { text: text, topics: [], entities: [], extracted: false }; });
      source.chunks.forEach(function (chunk) { if (old && !job.force) chunk.extracted = true; });
      read.warnings.forEach(function (code) { job.warnings.push({ source: source.title, code: code }); });
      job.sources.push(source);
    } catch (error) { job.failures.push({ source: source.title, code: /^[A-Z][A-Z0-9_]+$/.test(String(error.message)) ? error.message : 'SOURCE_READ_FAILED' }); }
    return;
  }
  if (job.phase === 'extracting') {
    var target = null, owner = null;
    for (var i = 0; i < job.sources.length && !target; i++) {
      for (var c = 0; c < job.sources[i].chunks.length; c++) if (!job.sources[i].chunks[c].extracted) { target = job.sources[i].chunks[c]; owner = job.sources[i]; break; }
    }
    if (!target) {
      job.groups = WikiCore.groupSources(job.sources); job.phase = 'writing'; job.cursor = 0; job.total = job.groups.length; return;
    }
    if (job.settings.aiCompile) {
      var result = WikiCore.extraction(wbModel_(ws, job.settings, WikiCore.extractionPrompt(owner, target.text), job));
      target.topics = result.topics; target.entities = result.entities;
    } else { target.topics = [owner.title.replace(/\.[^.]+$/, '') || owner.title]; target.entities = []; }
    target.extracted = true;
    job.cursor = job.sources.reduce(function (n, s) { return n + s.chunks.filter(function (chunk) { return chunk.extracted; }).length; }, 0);
    return;
  }
  if (job.phase === 'writing') {
    if (job.cursor >= job.groups.length) { job.phase = 'publishing'; job.cursor = 0; job.total = job.pages.length + 1; return; }
    var group = job.groups[job.cursor++];
    var fingerprint = wbHash_(JSON.stringify({ title: group.title, entries: group.entries, ai: job.settings.aiCompile, model: job.settings.model, base: job.settings.apiBase }));
    var previousPage = job.previous.pages.filter(function (p) { return p.fingerprint === fingerprint; })[0];
    var body = previousPage && !job.force ? previousPage.body : job.settings.aiCompile ? wbModel_(ws, job.settings, WikiCore.synthesisPrompt(group), job) : WikiCore.localDraft(group);
    body = body.replace(/^---\n[\s\S]*?\n---\n/, '').replace(/\n## (?:Sources|References)[\s\S]*$/i, '');
    job.pages.push({ slug: group.slug, title: group.title, body: body, generated: job.settings.aiCompile, group: group, fingerprint: fingerprint, sourceIds: Array.from(new Set(group.entries.map(function (entry) { return entry.sourceId; }))) });
    return;
  }
  if (job.phase === 'publishing') {
    var folder = DriveApp.getFolderById(job.folderId), index = Object.create(null);
    job.pages.forEach(function (page) { index[page.title] = page.slug; });
    if (job.cursor < job.pages.length) {
      var page = job.pages[job.cursor++]; page.markdown = WikiCore.documentMarkdown(page, index);
      page.url = wbWrite_(folder, page.slug + '.md', page.markdown, 'text/markdown').getUrl(); return;
    }
    // Detect additions, removals and edits while this build was working.
    var current = wbListSources_(ws.inbox).map(function (s) { return s.id + ':' + s.modified; }).sort();
    var original = job.queue.map(function (s) { return s.id + ':' + s.modified; }).sort();
    if (JSON.stringify(current) !== JSON.stringify(original)) throw new Error('SOURCES_CHANGED');
    job.sources.forEach(function (s) { if (s.referenceId && DriveApp.getFileById(s.referenceId).getLastUpdated().toISOString() !== s.referenceModified) throw new Error('SOURCES_CHANGED'); });
    var snapshot = { version: job.id, createdAt: new Date().toISOString(), sources: job.sources, pages: job.pages.map(function (p) { var copy = Object.assign({}, p); delete copy.group; return copy; }), entities: WikiCore.exactEntities(job.sources) };
    wbWrite_(folder, 'index.md', '# Wissensbau\n\n' + job.pages.map(function (p) { return '- [' + p.title.replace(/[\[\]]/g, '') + '](./' + p.slug + '.md)'; }).join('\n'), 'text/markdown');
    var snapshotFile = wbWrite_(folder, 'snapshot.json', JSON.stringify(snapshot));
    // Publish by switching one pointer only after every output exists.
    wbWrite_(ws.root, 'active.json', JSON.stringify({ buildFolderId: job.folderId, snapshotFileId: snapshotFile.getId(), version: job.id }));
    job.status = 'success'; job.finishedAt = new Date().toISOString(); job.cursor = job.total;
    delete job.previous; job.previous = { sources: [], pages: [] };
    return;
  }
  throw new Error('BUILD_STATE_INVALID');
}
function wbAdvanceBuild_() {
  return wbLock_(function () {
    var ws = wbWorkspace_(), job = wbJob_(ws);
    if (!job || job.status !== 'running') return wbJobSummary_(job);
    var started = Date.now(), units = 0;
    try {
      while (job.status === 'running' && Date.now() - started < WB_LIMITS.jobMillis && units++ < 20) {
        if (wbProps_().getProperty('WB_CANCEL') === job.id) { job.status = 'stopped'; job.finishedAt = new Date().toISOString(); wbSaveJob_(job); break; }
        wbCompileUnit_(job, ws); wbSaveJob_(job);
      }
    } catch (error) {
      job.status = 'error'; job.finishedAt = new Date().toISOString();
      job.failures.push({ source: '', code: /^[A-Z][A-Z0-9_]+$/.test(String(error.message)) ? error.message : 'BUILD_FAILED' }); wbSaveJob_(job);
    }
    if (job.status === 'running') wbSchedule_(job); else wbRemoveTriggers_();
    return wbJobSummary_(job);
  });
}
function apiContinueBuild() { return wbReply_(wbAdvanceBuild_); }
function apiBuildStatus() { return wbReply_(function () { return wbJobSummary_(wbJob_(wbWorkspace_())); }); }
function apiCancelBuild() {
  return wbReply_(function () {
    var ws = wbWorkspace_(), job = wbJob_(ws);
    if (!job || job.status !== 'running') return wbJobSummary_(job);
    // A running fetch cannot be interrupted. Set a separate flag without
    // waiting for its lock; the worker observes it before its next unit.
    wbProps_().setProperty('WB_CANCEL', job.id);
    wbRemoveTriggers_();
    try {
      return wbLock_(function () { job = wbJob_(ws); if (job.status === 'running') { job.status = 'stopped'; job.finishedAt = new Date().toISOString(); wbSaveJob_(job); } return wbJobSummary_(job); });
    } catch (error) {
      if (error.message !== 'BUSY') throw error;
      return Object.assign(wbJobSummary_(job), { cancelRequested: true });
    }
  });
}
function runQueuedBuild() {
  try { wbAdvanceBuild_(); } catch (error) {
    if (String(error.message) === 'BUSY') { var job = wbJob_(wbWorkspace_()); if (job) wbSchedule_(job); }
  }
}
