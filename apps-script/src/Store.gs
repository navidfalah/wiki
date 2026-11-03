/* Drive-backed storage. All helpers are private to google.script.run. */
var WB_LIMITS = Object.freeze({ uploadBytes: 10 * 1024 * 1024, sourceChars: 1000000, corpusChars: 8000000, files: 500, zipBytes: 40 * 1024 * 1024, zipEntries: 4000, jobMillis: 150000 });
function wbProps_() { return PropertiesService.getUserProperties(); }
function wbLock_(fn) {
  var lock = LockService.getUserLock();
  if (!lock.tryLock(1000)) throw new Error('BUSY');
  try { return fn(); } finally { lock.releaseLock(); }
}
function wbHash_(value) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value, Utilities.Charset.UTF_8);
  return bytes.map(function (b) { return ('0' + ((b + 256) % 256).toString(16)).slice(-2); }).join('');
}
function wbFile_(folder, name) { var files = folder.getFilesByName(name); return files.hasNext() ? files.next() : null; }
function wbFolder_(parent, name) { var folders = parent.getFoldersByName(name); return folders.hasNext() ? folders.next() : parent.createFolder(name); }
function wbWrite_(folder, name, content, mime) {
  var file = wbFile_(folder, name), blob = Utilities.newBlob(content, mime || 'application/json', name);
  if (blob.getBytes().length > 32 * 1024 * 1024) throw new Error('STORAGE_SIZE_LIMIT');
  // Blob uploads avoid the small string-overload limits of createFile/setContent.
  if (file) Drive.Files.update({}, file.getId(), blob, { fields: 'id' });
  else file = folder.createFile(blob);
  return file;
}
function wbRead_(folder, name, fallback) {
  var file = wbFile_(folder, name);
  if (!file) return fallback;
  try { return JSON.parse(file.getBlob().getDataAsString('UTF-8')); } catch (e) { throw new Error('STORAGE_INVALID'); }
}
function wbWorkspace_() {
  var id = wbProps_().getProperty('WB_ROOT');
  if (!id) throw new Error('SETUP_REQUIRED');
  var root = DriveApp.getFolderById(id);
  var meta = wbRead_(root, 'workspace.json', null);
  if (!meta || meta.version !== 1) throw new Error('WORKSPACE_INVALID');
  var result = { root: root };
  ['inbox', 'builds', 'cache', 'chats', 'scratch'].forEach(function (name) { result[name] = DriveApp.getFolderById(meta[name]); });
  return result;
}
function wbDefaults_() { return { version: 1, language: 'en', aiCompile: false, aiChat: false, apiBase: 'https://api.openai.com/v1', model: 'gpt-4o-mini', topK: 5, autoResume: false, convertLegacy: true }; }
function wbSettings_(workspace) { return Object.assign(wbDefaults_(), wbRead_(workspace.root, 'settings.json', {})); }
function wbSnapshot_(workspace) {
  var active = wbRead_(workspace.root, 'active.json', null);
  if (!active) return { sources: [], pages: [], entities: [], version: null };
  var file = DriveApp.getFileById(active.snapshotFileId);
  var parents = file.getParents(), belongs = false;
  while (parents.hasNext()) if (parents.next().getId() === active.buildFolderId) belongs = true;
  if (!belongs) throw new Error('STORAGE_INVALID');
  return JSON.parse(file.getBlob().getDataAsString('UTF-8'));
}
function wbListSources_(folder, prefix, out, visited) {
  out = out || []; visited = visited || {};
  if (visited[folder.getId()]) return out;
  visited[folder.getId()] = true;
  var files = folder.getFiles();
  while (files.hasNext()) {
    var file = files.next();
    if (file.isTrashed()) continue;
    if (file.getMimeType() === 'application/vnd.google-apps.shortcut') continue;
    if (out.length >= WB_LIMITS.files) throw new Error('SOURCE_COUNT_LIMIT');
    out.push({ id: file.getId(), title: file.getName(), path: (prefix || '') + file.getName(), mime: file.getMimeType(), modified: file.getLastUpdated().toISOString(), size: file.getSize(), url: file.getUrl() });
  }
  var children = folder.getFolders();
  while (children.hasNext()) {
    var child = children.next();
    wbListSources_(child, (prefix || '') + child.getName() + '/', out, visited);
  }
  return out.sort(function (a, b) { return a.path.localeCompare(b.path); });
}
function wbId_(value) {
  var s = String(value || '').trim();
  if (/^[A-Za-z0-9_-]{10,}$/.test(s)) return s;
  var match = s.match(/\/(?:d|folders)\/([A-Za-z0-9_-]+)/) || s.match(/[?&]id=([A-Za-z0-9_-]+)/);
  if (!match) throw new Error('DRIVE_ID_INVALID');
  return match[1];
}
function wbSafeName_(name) { return String(name || 'source').replace(/[\x00-\x1f/\\]/g, '-').slice(0, 180); }
function wbReply_(fn) {
  try { return { ok: true, data: fn() }; }
  catch (error) {
    var code = String(error.message || 'UNKNOWN');
    // Do not send provider responses, tokens, or stack traces to the browser.
    if (!/^[A-Z][A-Z0-9_]+$/.test(code)) code = 'OPERATION_FAILED';
    return { ok: false, error: code };
  }
}
function apiBootstrap() {
  return wbReply_(function () {
    if (!wbProps_().getProperty('WB_ROOT')) return { ready: false };
    var ws = wbWorkspace_(), snapshot = wbSnapshot_(ws), job = wbJob_(ws);
    return { ready: true, workspace: { name: ws.root.getName(), url: ws.root.getUrl(), inboxUrl: ws.inbox.getUrl() }, settings: wbPublicSettings_(ws), counts: { sources: wbListSources_(ws.inbox).length, pages: snapshot.pages.length, entities: snapshot.entities.length }, version: snapshot.version, job: wbJobSummary_(job) };
  });
}
function apiSetup(folderId) {
  return wbReply_(function () { return wbLock_(function () {
    if (wbProps_().getProperty('WB_ROOT')) return { ready: true };
    // A supplied folder is a parent; never overwrite its existing files.
    var root = folderId ? DriveApp.getFolderById(wbId_(folderId)).createFolder('Wissensbau') : DriveApp.createFolder('Wissensbau');
    var meta = { version: 1, createdAt: new Date().toISOString() };
    ['inbox', 'builds', 'cache', 'chats', 'scratch'].forEach(function (name) { meta[name] = root.createFolder(name).getId(); });
    wbWrite_(root, 'workspace.json', JSON.stringify(meta));
    wbWrite_(root, 'settings.json', JSON.stringify(wbDefaults_()));
    wbProps_().setProperty('WB_ROOT', root.getId());
    return { ready: true, url: root.getUrl() };
  }); });
}
function wbPublicSettings_(ws) {
  var settings = wbSettings_(ws); settings.hasApiKey = Boolean(wbProps_().getProperty('WB_API_KEY')); return settings;
}
function apiSaveSettings(input) {
  return wbReply_(function () { return wbLock_(function () {
    var ws = wbWorkspace_(), old = wbSettings_(ws); input = input || {};
    var base = String(input.apiBase || old.apiBase).replace(/\/+$/, '');
    if (!/^https:\/\/[A-Za-z0-9.-]+(?::443)?(?:\/[^\s?#]*)?$/.test(base) || /^https:\/\/(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.)/i.test(base)) throw new Error('API_URL_INVALID');
    var model = String(input.model || old.model).trim(); if (!model || model.length > 150) throw new Error('MODEL_INVALID');
    var settings = Object.assign(old, { apiBase: base, model: model, aiCompile: Boolean(input.aiCompile), aiChat: Boolean(input.aiChat), autoResume: Boolean(input.autoResume), convertLegacy: Boolean(input.convertLegacy), language: input.language === 'de' ? 'de' : 'en', topK: Math.max(1, Math.min(10, Number(input.topK) || 5)) });
    var proposedKey = input.clearApiKey ? '' : String(input.apiKey || wbProps_().getProperty('WB_API_KEY') || '').trim();
    if (proposedKey.length > 500) throw new Error('API_KEY_INVALID');
    if ((settings.aiCompile || settings.aiChat) && !proposedKey) throw new Error('API_KEY_REQUIRED');
    if (proposedKey) wbProps_().setProperty('WB_API_KEY', proposedKey); else wbProps_().deleteProperty('WB_API_KEY');
    wbWrite_(ws.root, 'settings.json', JSON.stringify(settings)); return wbPublicSettings_(ws);
  }); });
}
function apiSources() { return wbReply_(function () { var ws = wbWorkspace_(); return { sources: wbListSources_(ws.inbox), inboxUrl: ws.inbox.getUrl() }; }); }
function apiUpload(input) {
  return wbReply_(function () { return wbLock_(function () {
    var ws = wbWorkspace_();
    if (!input || typeof input.base64 !== 'string' || input.base64.length > Math.ceil(WB_LIMITS.uploadBytes * 4 / 3) + 8) throw new Error('UPLOAD_LIMIT');
    var bytes = Utilities.base64Decode(input.base64); if (bytes.length > WB_LIMITS.uploadBytes) throw new Error('UPLOAD_LIMIT');
    var name = wbSafeName_(input.name);
    var file = ws.inbox.createFile(Utilities.newBlob(bytes, String(input.mime || 'application/octet-stream'), name));
    return { id: file.getId(), title: file.getName(), url: file.getUrl() };
  }); });
}
function apiImportDrive(value) {
  return wbReply_(function () { return wbLock_(function () {
    var ws = wbWorkspace_(), file = DriveApp.getFileById(wbId_(value));
    if (file.getMimeType() === 'application/vnd.google-apps.shortcut') throw new Error('SHORTCUT_UNSUPPORTED');
    var copy = file.makeCopy(file.getName(), ws.inbox);
    return { id: copy.getId(), title: copy.getName(), url: copy.getUrl() };
  }); });
}
function apiPages() { return wbReply_(function () { var snapshot = wbSnapshot_(wbWorkspace_()); return { pages: snapshot.pages.map(function (p) { return { slug: p.slug, title: p.title, generated: p.generated, sources: p.sourceIds }; }), version: snapshot.version }; }); }
function apiPage(slug) {
  return wbReply_(function () {
    var snapshot = wbSnapshot_(wbWorkspace_());
    var page = snapshot.pages.filter(function (p) { return p.slug === slug; })[0]; if (!page) throw new Error('PAGE_NOT_FOUND');
    return { title: page.title, slug: page.slug, markdown: page.markdown, url: page.url, generated: page.generated, sources: snapshot.sources.filter(function (s) { return page.sourceIds.indexOf(s.id) >= 0; }).map(function (s) { return { id: s.id, title: s.title, url: s.url }; }) };
  });
}
function apiGraph() {
  return wbReply_(function () {
    var snapshot = wbSnapshot_(wbWorkspace_()), links = [];
    snapshot.pages.forEach(function (page) { var re = /\]\(\.\/([^)]+)\.md\)/g, match; while ((match = re.exec(page.markdown))) links.push({ from: page.slug, to: match[1] }); });
    return { nodes: snapshot.pages.map(function (p) { return { id: p.slug, title: p.title }; }), links: links, entities: snapshot.entities };
  });
}
function apiHistory() {
  return wbReply_(function () {
    var ws = wbWorkspace_(), folders = ws.builds.getFolders(), jobs = [];
    while (folders.hasNext()) { var folder = folders.next(), job = wbRead_(folder, 'job.json', null); if (job) jobs.push(wbJobSummary_(job)); }
    return jobs.sort(function (a, b) { return b.startedAt.localeCompare(a.startedAt); }).slice(0, 30);
  });
}
