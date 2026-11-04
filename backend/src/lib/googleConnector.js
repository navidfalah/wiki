'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { createCredentialStore } = require('./connectorCredentials');
const { readSourceBytes } = require('./sourceReader');

const scopes = { gmail: 'https://www.googleapis.com/auth/gmail.readonly', google_drive: 'https://www.googleapis.com/auth/drive.readonly' };
function createGoogleConnector(directory, env = process.env) {
  const store = () => createCredentialStore(directory, env.CONNECTOR_SECRET_KEY);
  function config(id) {
    if (!scopes[id]) throw new Error(`${id} does not use OAuth2`);
    const prefix = id === 'gmail' ? 'GMAIL' : 'GDRIVE';
    const clientId = env[`${prefix}_CLIENT_ID`], clientSecret = env[`${prefix}_CLIENT_SECRET`], redirectUri = env[`${prefix}_REDIRECT_URI`];
    if (!clientId || !clientSecret || !redirectUri) { const error = new Error(`${id} is not configured`); error.errorType = 'not_configured'; throw error; }
    return { clientId, clientSecret, redirectUri };
  }
  function pendingFile(id, state) {
    if (!scopes[id] || typeof state !== 'string' || !/^[A-Za-z0-9_-]{32}$/.test(state)) throw new Error('Unknown or expired OAuth state');
    return path.join(directory, '_pending', `${id}__${state}.json`);
  }
  function start(id) {
    const cfg = config(id), state = crypto.randomBytes(24).toString('base64url'), verifier = crypto.randomBytes(40).toString('base64url');
    const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
    const file = pendingFile(id, state); fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
    fs.writeFileSync(file, JSON.stringify({ connector_id: id, state, code_verifier: verifier, created_at: Date.now() / 1000 }), { mode: 0o600, flag: 'wx' });
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.search = new URLSearchParams({ client_id: cfg.clientId, redirect_uri: cfg.redirectUri, response_type: 'code', scope: scopes[id], state, access_type: 'offline', prompt: 'consent', code_challenge: challenge, code_challenge_method: 'S256' }).toString();
    return { authorization_url: url.toString(), state };
  }
  async function tokenRequest(cfg, fields) {
    const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: cfg.clientId, client_secret: cfg.clientSecret, ...fields }), signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`Google token request failed (HTTP ${response.status}).`);
    const result = await response.json(); if (!result.access_token) throw new Error('Google returned an invalid token.'); return result;
  }
  function credentials(id, label, result, oldRefresh = null) {
    const { access_token, refresh_token, expires_in, ...extra } = result;
    return { connector_id: id, account_label: label, access_token, refresh_token: refresh_token || oldRefresh, password: null, expires_at: expires_in == null ? null : Date.now() / 1000 + Number(expires_in), extra };
  }
  async function complete(id, code, state, label) {
    const cfg = config(id); if (!label || !code) throw new Error('Account label and authorization code are required.');
    const file = pendingFile(id, state); let pending;
    try { pending = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { throw new Error('Unknown or expired OAuth state'); }
    if (pending.connector_id !== id || pending.state !== state || !pending.code_verifier || !Number.isFinite(pending.created_at) || Date.now() / 1000 - pending.created_at > 600 || pending.created_at > Date.now() / 1000 + 60) { try { fs.unlinkSync(file); } catch { /* already removed */ } throw new Error('Unknown or expired OAuth state'); }
    // Consume state before the network request to prevent replay and concurrent redemption.
    fs.unlinkSync(file);
    const result = await tokenRequest(cfg, { code, code_verifier: pending.code_verifier, redirect_uri: cfg.redirectUri, grant_type: 'authorization_code' });
    store().save(credentials(id, label, result));
    return { connected: true, connector_id: id, account_label: label };
  }
  async function access(id, label) {
    const cfg = config(id), database = store(); let account = database.load(id, label);
    if (!account) { const error = new Error(`${id}/${label} is not connected`); error.errorType = 'not_connected'; throw error; }
    if (account.expires_at != null && Date.now() / 1000 >= account.expires_at) {
      if (!account.refresh_token) throw new Error('No refresh token; reconnect the account.');
      const result = await tokenRequest(cfg, { refresh_token: account.refresh_token, grant_type: 'refresh_token' });
      account = credentials(id, label, result, account.refresh_token); database.save(account);
    }
    return account.access_token;
  }
  async function get(url, token, params = {}, raw = false) {
    const target = new URL(url); Object.entries(params).forEach(([key, value]) => target.searchParams.set(key, String(value)));
    const response = await fetch(target, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`Google request failed (HTTP ${response.status}).`);
    if (raw === 'bytes') {
      const max = 40 * 1024 * 1024;
      if (Number(response.headers.get('content-length')) > max) throw new Error('Google Drive file exceeds the reader size limit.');
      const parts = []; let size = 0;
      for await (const chunk of response.body) { size += chunk.length; if (size > max) throw new Error('Google Drive file exceeds the reader size limit.'); parts.push(Buffer.from(chunk)); }
      return Buffer.concat(parts);
    }
    return raw ? response.text() : response.json();
  }
  async function list(id, label, query = '', limit = 20) {
    const token = await access(id, label); limit = Math.max(1, Math.min(100, Number(limit) || 20));
    if (id === 'google_drive') {
      const params = { pageSize: limit, fields: 'files(id,name,mimeType,webViewLink)' };
      if (query) params.q = `fullText contains '${String(query).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}' and trashed = false`;
      const result = await get('https://www.googleapis.com/drive/v3/files', token, params);
      return (result.files || []).map((file) => ({ id: file.id, title: file.name || '(untitled)', snippet: '', source_url: file.webViewLink || '', metadata: { mimeType: file.mimeType || '' } }));
    }
    const base = 'https://gmail.googleapis.com/gmail/v1/users/me/messages';
    const listing = await get(base, token, query ? { maxResults: limit, q: query } : { maxResults: limit });
    return Promise.all((listing.messages || []).map(async (item) => {
      const detail = await get(`${base}/${encodeURIComponent(item.id)}`, token, { format: 'metadata', metadataHeaders: 'Subject' });
      return { id: detail.id, title: (detail.payload?.headers || []).find((header) => header.name.toLowerCase() === 'subject')?.value || '(no subject)', snippet: detail.snippet || '', source_url: `https://mail.google.com/mail/u/0/#inbox/${encodeURIComponent(detail.id)}`, metadata: { threadId: detail.threadId || '' } };
    }));
  }
  async function fetchItem(id, label, itemId) {
    const token = await access(id, label);
    if (id === 'google_drive') {
      const base = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(itemId)}`;
      const info = await get(base, token, { fields: 'id,name,mimeType' });
      const native = {
        'application/vnd.google-apps.document': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.docx'],
        'application/vnd.google-apps.spreadsheet': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '.xlsx'],
        'application/vnd.google-apps.presentation': ['application/vnd.openxmlformats-officedocument.presentationml.presentation', '.pptx'],
      }[info.mimeType];
      if (native) return readSourceBytes(await get(`${base}/export`, token, { mimeType: native[0] }, 'bytes'), `${info.name || 'document'}${native[1]}`);
      if ((info.mimeType || '').startsWith('application/vnd.google-apps.')) return get(`${base}/export`, token, { mimeType: 'text/plain' }, true);
      return readSourceBytes(await get(base, token, { alt: 'media' }, 'bytes'), info.name || 'file');
    }
    const detail = await get(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(itemId)}`, token, { format: 'full' });
    function extract(part) { if ((part.mimeType || '').startsWith('text/') && part.body?.data) return Buffer.from(part.body.data, 'base64url').toString('utf8'); for (const child of part.parts || []) { const text = extract(child); if (text) return text; } return ''; }
    return extract(detail.payload || {});
  }
  return { start, complete, list, fetchItem };
}
module.exports = { createGoogleConnector };
