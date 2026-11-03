/**
 * Boots the real Express app (createApp) against a throwaway data root and
 * a fake Python bridge, on a random port. Import it before anything that
 * reads ../paths -- the env it sets decides where the app reads and writes.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';

export const ADMIN = { username: 'admin', password: 'harness-admin-pw' };

export interface Harness {
  root: string;
  baseUrl: string;
  pythonLog: string;
  request(method: string, url: string, opts?: { token?: string; body?: unknown; headers?: Record<string, string>; form?: FormData }): Promise<Response>;
  json<T = any>(method: string, url: string, opts?: { token?: string; body?: unknown; headers?: Record<string, string> }): Promise<{ status: number; body: T }>;
  login(username?: string, password?: string): Promise<string>;
  pythonCalls(): { command: string; input: any }[];
  close(): Promise<void>;
}

function write(root: string, rel: string, content: string) {
  const full = path.join(root, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
}

export const AURORA_PAGE = `---
id: aurora-labs
title: Aurora Labs
tags:
  - company
  - iot
last_updated: 2026-01-01T00:00:00+00:00
---

# Aurora Labs

Aurora Labs builds the [Nova Widget](./nova-widget.md), a soil sensor powered by a CR2032 cell.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | \`notes/kickoff.txt\` | text | High |
| 2 | \`emails/relay.eml\` | email | Medium |
`;

export const NOVA_PAGE = `---
id: nova-widget
title: Nova Widget
tags:
  - product
---

# Nova Widget

The Nova Widget reads soil moisture every 15 minutes over the MeshSync mesh.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | \`notes/kickoff.txt\` | text | High |
`;

export function seed(root: string) {
  write(root, 'wiki-app/docs/aurora-labs.md', AURORA_PAGE);
  write(root, 'wiki-app/docs/nova-widget.md', NOVA_PAGE);
  write(root, 'data/raw/notes/kickoff.txt', 'Kickoff: Mira and Jonah start Aurora Labs. Battery target 2 years.');
  write(root, 'data/raw/emails/relay.eml', 'Subject: Relay battery drain\n\nBatch 4 units drain faster.');
  write(root, 'data/raw/uploads/page.html', '<script>alert(document.cookie)</script><p>hi</p>');
  write(root, 'compiler/temp_output/index.json', JSON.stringify({ topics: { 'Aurora Labs': 'aurora-labs.md', 'Nova Widget': 'nova-widget.md' } }));
  write(root, 'data/state.json', JSON.stringify({ version: 1, files: {}, runs: [] }));
}

export async function startHarness(): Promise<Harness> {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'routes-'));
  seed(root);
  const fakePython = path.join(root, 'fake-python');
  fs.copyFileSync(path.join(__dirname, 'fakePython.cjs'), fakePython);
  fs.chmodSync(fakePython, 0o755);
  const pythonLog = path.join(root, 'fake-python-calls.jsonl');

  Object.assign(process.env, {
    WIKI_DATA_ROOT: root,
    PYTHON_BIN: fakePython,
    FAKE_PYTHON_LOG: pythonLog,
    PY_WORKER: '0',
    ADMIN_USERNAME: ADMIN.username,
    ADMIN_PASSWORD: ADMIN.password,
    BACKUP_INTERVAL_HOURS: '0',
  });

  const { createApp } = await import('../../app');
  const server: Server = await new Promise((resolve) => {
    const s = createApp().listen(0, '127.0.0.1', () => resolve(s));
  });
  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  const request: Harness['request'] = (method, url, opts = {}) => {
    const headers: Record<string, string> = { ...(opts.headers ?? {}) };
    if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
    let body: RequestInit['body'];
    if (opts.form) body = opts.form;
    else if (opts.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(opts.body);
    }
    return fetch(`${baseUrl}${url}`, { method, headers, body });
  };

  const json: Harness['json'] = async (method, url, opts) => {
    const res = await request(method, url, opts);
    const text = await res.text();
    let body: any = text;
    try {
      body = JSON.parse(text);
    } catch {
      /* non-JSON body */
    }
    return { status: res.status, body };
  };

  return {
    root,
    baseUrl,
    pythonLog,
    request,
    json,
    async login(username = ADMIN.username, password = ADMIN.password) {
      const res = await json('POST', '/api/auth/login', { body: { username, password } });
      if (res.status !== 200) throw new Error(`login failed: ${res.status} ${JSON.stringify(res.body)}`);
      return res.body.token as string;
    },
    pythonCalls() {
      if (!fs.existsSync(pythonLog)) return [];
      return fs.readFileSync(pythonLog, 'utf-8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
    },
    async close() {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}
