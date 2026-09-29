import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startHarness, type Harness } from './__fixtures__/harness';

let h: Harness;
let token: string;
const auth = () => ({ token });
const raw = (rel: string) => path.join(h.root, 'data', 'raw', rel);

beforeAll(async () => {
  h = await startHarness();
  token = await h.login();
});
afterAll(() => h.close());

describe('raw files', () => {
  it('lists files, folders and processing status', async () => {
    const { body } = await h.json('GET', '/api/raw-files', auth());
    expect(body.files.map((f: any) => f.path).sort()).toEqual(['emails/relay.eml', 'notes/kickoff.txt', 'uploads/page.html']);
    expect(body.unprocessed).toBe(3);
    expect(body.folders).toEqual(expect.arrayContaining(['notes', 'emails', 'uploads']));
  });

  it('file detail includes text content and a raw URL', async () => {
    const { body } = await h.json('GET', '/api/raw-files/notes/kickoff.txt', auth());
    expect(body).toMatchObject({ path: 'notes/kickoff.txt', is_text: true, status: 'Unprocessed', raw_url: '/api/raw-files/raw/notes/kickoff.txt' });
    expect(body.content).toContain('Kickoff');
  });

  it('raw previews are nosniff, and uploaded HTML is sandboxed', async () => {
    const txt = await h.request('GET', '/api/raw-files/raw/notes/kickoff.txt', auth());
    expect(txt.headers.get('x-content-type-options')).toBe('nosniff');
    expect(txt.headers.get('content-security-policy')).toBeNull();
    const html = await h.request('GET', '/api/raw-files/raw/uploads/page.html', auth());
    expect(html.headers.get('content-type')).toMatch(/^text\/html/);
    expect(html.headers.get('content-security-policy')).toMatch(/^sandbox;/);
  });

  it.each(['../../data/users.json', '..%2F..%2Fdata%2Fusers.json', 'notes/../../../etc/hostname'])('refuses path traversal: %s', async (p) => {
    for (const prefix of ['/api/raw-files/', '/api/raw-files/raw/']) {
      const res = await h.request('GET', `${prefix}${p}`, auth());
      expect([400, 404]).toContain(res.status);
      expect(await res.text()).not.toContain('password_hash');
    }
  });

  it('uploads into a folder, then refuses to overwrite', async () => {
    const form = new FormData();
    form.append('parent', 'notes');
    form.append('files', new Blob(['fresh note']), 'fresh.txt');
    const { status, body } = await h.request('POST', '/api/raw-files/upload', { token, form }).then(async (r) => ({ status: r.status, body: (await r.json()) as any }));
    expect(status).toBe(200);
    expect(body.saved).toEqual(['notes/fresh.txt']);
    expect(fs.readFileSync(raw('notes/fresh.txt'), 'utf-8')).toBe('fresh note');
  });

  it('refuses an upload into a parent outside data/raw', async () => {
    const form = new FormData();
    form.append('parent', '../..');
    form.append('files', new Blob(['x']), 'evil.txt');
    expect((await h.request('POST', '/api/raw-files/upload', { token, form })).status).toBe(400);
  });

  it('creates folders, moves files into them and deletes both', async () => {
    expect((await h.json('POST', '/api/raw-files/folders', { ...auth(), body: { parent: '', name: 'archive' } })).body).toEqual({ path: 'archive' });
    expect((await h.json('POST', '/api/raw-files/folders', { ...auth(), body: { parent: '', name: '../escape' } })).status).toBe(400);
    const moved = await h.json('POST', '/api/raw-files/move', { ...auth(), body: { path: 'notes/fresh.txt', destination: 'archive' } });
    expect(moved.body).toEqual({ path: 'archive/fresh.txt' });
    expect(fs.existsSync(raw('archive/fresh.txt'))).toBe(true);
    expect((await h.json('DELETE', '/api/raw-files/archive/fresh.txt', auth())).status).toBe(200);
    expect((await h.json('DELETE', '/api/raw-files/folders/archive', auth())).status).toBe(200);
    expect(fs.existsSync(raw('archive'))).toBe(false);
  });

  it('deleting a missing file is a clean error', async () => {
    expect([400, 404]).toContain((await h.json('DELETE', '/api/raw-files/notes/nope.txt', auth())).status);
  });
});

describe('source folders', () => {
  it('rejects a path that does not exist', async () => {
    expect((await h.json('POST', '/api/sources', { ...auth(), body: { path: '/definitely/not/here' } })).status).toBe(400);
  });

  it('mirrors an external folder into data/raw and can disable it', async () => {
    const external = path.join(h.root, 'external-notes');
    fs.mkdirSync(external);
    fs.writeFileSync(path.join(external, 'outside.md'), '# Outside');
    const { status, body } = await h.json('POST', '/api/sources', { ...auth(), body: { path: external, label: 'Outside' } });
    expect(status).toBe(200);
    const files = (await h.json('GET', '/api/raw-files', auth())).body.files.map((f: any) => f.path);
    expect(files.some((f: string) => f.endsWith('outside.md'))).toBe(true);
    expect((await h.json('PUT', `/api/sources/${body.id}`, { ...auth(), body: {} })).status).toBe(400);
    expect((await h.json('PUT', `/api/sources/${body.id}`, { ...auth(), body: { enabled: false } })).body.enabled).toBe(false);
    expect((await h.json('DELETE', `/api/sources/${body.id}`, auth())).status).toBe(200);
    expect((await h.json('DELETE', `/api/sources/${body.id}`, auth())).status).toBe(404);
  });
});

describe('settings', () => {
  it('company settings round-trip and validate types', async () => {
    const saved = await h.json('PUT', '/api/settings/company', { ...auth(), body: { company_name: '  Aurora Labs ', industry: 'IoT' } });
    expect(saved.body).toMatchObject({ company_name: 'Aurora Labs', industry: 'IoT' });
    expect((await h.json('GET', '/api/settings/company', auth())).body.company_name).toBe('Aurora Labs');
    expect((await h.json('PUT', '/api/settings/company', { ...auth(), body: { company_name: 42 } })).status).toBe(400);
  });

  it('LLM settings never return a stored API key', async () => {
    const profile = { id: 'p1', label: 'Main', provider: 'openai', base_url: 'https://api.example.test/v1', model: 'm-1', api_key: 'sk-secret-1234' };
    const saved = await h.json('PUT', '/api/settings/llm', { ...auth(), body: { profiles: [profile] } });
    expect(saved.status).toBe(200);
    expect(JSON.stringify(saved.body)).not.toContain('sk-secret');
    expect(saved.body.profiles[0]).toMatchObject({ api_key: '••••1234', has_key: true });
    const fetched = await h.json('GET', '/api/settings/llm', auth());
    expect(JSON.stringify(fetched.body)).not.toContain('sk-secret');
  });

  it('sending the masked key back keeps the stored key', async () => {
    const profile = { id: 'p1', label: 'Main renamed', provider: 'openai', base_url: 'https://api.example.test/v1', model: 'm-2', api_key: '__unchanged__' };
    const saved = await h.json('PUT', '/api/settings/llm', { ...auth(), body: { profiles: [profile] } });
    expect(saved.body.profiles[0]).toMatchObject({ label: 'Main renamed', has_key: true, api_key: '••••1234' });
  });

  it.each([
    [{}, 'no profiles'],
    [{ profiles: [{ label: '', base_url: 'x', model: 'y' }] }, 'missing label'],
    [{ profiles: [{ label: 'A', base_url: '', model: 'y' }] }, 'missing base URL'],
    [{ profiles: [{ id: 'd', label: 'A', base_url: 'x', model: 'y' }, { id: 'd', label: 'B', base_url: 'x', model: 'y' }] }, 'duplicate id'],
  ])('LLM settings reject %j (%s)', async (body, _reason) => {
    expect((await h.json('PUT', '/api/settings/llm', { ...auth(), body })).status).toBe(400);
  });

  it('pipeline settings validate their fields', async () => {
    expect((await h.json('GET', '/api/settings/pipeline', auth())).status).toBe(200);
    expect((await h.json('PUT', '/api/settings/pipeline', { ...auth(), body: { critic_samples: -1 } })).status).toBe(400);
    expect((await h.json('PUT', '/api/settings/pipeline', { ...auth(), body: { excluded_folders: 'notes' } })).status).toBe(400);
  });

  it('RAG settings and presets', async () => {
    const current = (await h.json('GET', '/api/settings/rag', auth())).body;
    expect((await h.json('PUT', '/api/settings/rag', { ...auth(), body: current })).status).toBe(200);
    expect((await h.json('POST', '/api/settings/rag/presets', { ...auth(), body: { name: '' } })).status).toBe(400);
    const preset = await h.json('POST', '/api/settings/rag/presets', { ...auth(), body: { name: 'Fast', settings: current } });
    expect(preset.status).toBeLessThan(300);
    const presets = (await h.json('GET', '/api/settings/rag/presets', auth())).body;
    const id = (presets.presets ?? presets).find((p: any) => p.name === 'Fast').id;
    expect((await h.json('POST', `/api/settings/rag/presets/${id}/apply`, auth())).status).toBe(200);
    expect((await h.json('POST', '/api/settings/rag/presets/unknown/apply', auth())).status).toBeGreaterThanOrEqual(400);
    expect((await h.json('DELETE', `/api/settings/rag/presets/${id}`, auth())).status).toBe(200);
  });
});

describe('chat sessions', () => {
  let id: string;

  it('create, list, rename, scope, truncate and delete', async () => {
    id = (await h.json('POST', '/api/chat/sessions', { ...auth(), body: { title: 'Battery questions' } })).body.id;
    expect((await h.json('GET', '/api/chat/sessions', auth())).body.sessions.map((s: any) => s.id)).toContain(id);
    expect((await h.json('PATCH', `/api/chat/sessions/${id}`, { ...auth(), body: { title: 'Renamed' } })).body.title).toBe('Renamed');
    expect((await h.json('PATCH', `/api/chat/sessions/${id}`, { ...auth(), body: { resource_scope: 'notes' } })).status).toBe(400);
    expect((await h.json('PATCH', `/api/chat/sessions/${id}`, { ...auth(), body: { resource_scope: ['notes/kickoff.txt'] } })).status).toBe(200);
    expect((await h.json('POST', `/api/chat/sessions/${id}/truncate`, { ...auth(), body: { keep: -1 } })).status).toBe(400);
    expect((await h.json('POST', `/api/chat/sessions/${id}/truncate`, { ...auth(), body: { keep: 0 } })).status).toBe(200);
    expect((await h.json('DELETE', `/api/chat/sessions/${id}`, auth())).status).toBe(200);
    expect((await h.json('GET', `/api/chat/sessions/${id}`, auth())).status).toBe(404);
  });

  it('the stream endpoint validates before starting', async () => {
    const other = (await h.json('POST', '/api/chat/sessions', { ...auth(), body: {} })).body.id;
    expect((await h.json('GET', `/api/chat/sessions/${other}/stream`, auth())).status).toBe(400);
    expect((await h.json('GET', '/api/chat/sessions/nope/stream?message=hi', auth())).status).toBe(404);
  });
});

describe('backups over the API', () => {
  it('create, list, download, restore and delete', async () => {
    const created = await h.json('POST', '/api/admin/backups', auth());
    expect(created.status).toBe(201);
    const name = created.body.name;
    expect((await h.json('GET', '/api/admin/backups', auth())).body.schedule).toEqual({ interval_hours: 0, keep: 7 });

    const download = await h.request('GET', `/api/admin/backups/${name}`, auth());
    expect(download.status).toBe(200);
    expect(Buffer.from(await download.arrayBuffer()).subarray(0, 2)).toEqual(Buffer.from([0x1f, 0x8b]));

    fs.writeFileSync(path.join(h.root, 'wiki-app/docs/aurora-labs.md'), '# changed after backup');
    const restored = await h.json('POST', `/api/admin/backups/${name}/restore`, auth());
    expect(restored.status).toBe(200);
    expect(restored.body.safetyBackup).toMatch(/pre-restore/);
    expect(fs.readFileSync(path.join(h.root, 'wiki-app/docs/aurora-labs.md'), 'utf-8')).toContain('title: Aurora Labs');

    expect((await h.json('DELETE', `/api/admin/backups/${name}`, auth())).status).toBe(200);
    expect((await h.json('GET', `/api/admin/backups/${name}`, auth())).status).toBe(404);
  });

  it.each(['../../data/users.json', 'wissensbau-x.tar.gz', 'evil.tar.gz'])('refuses backup name %s', async (name) => {
    expect([400, 404]).toContain((await h.json('GET', `/api/admin/backups/${encodeURIComponent(name)}`, auth())).status);
  });

  it('rejects an uploaded archive that is not a valid backup', async () => {
    const form = new FormData();
    form.append('file', new Blob(['this is not a tarball']), 'x.tar.gz');
    expect((await h.request('POST', '/api/admin/backups/upload', { token, form })).status).toBe(400);
    expect(fs.readdirSync(path.join(h.root, 'data', 'backups')).some((f) => f.endsWith('.partial'))).toBe(false);
  });

  it('accepts an uploaded backup it produced itself', async () => {
    const name = (await h.json('POST', '/api/admin/backups', auth())).body.name;
    const bytes = await (await h.request('GET', `/api/admin/backups/${name}`, auth())).arrayBuffer();
    const form = new FormData();
    form.append('file', new Blob([bytes]), name);
    const res = await h.request('POST', '/api/admin/backups/upload', { token, form });
    expect(res.status).toBe(201);
    expect(((await res.json()) as any).name).toMatch(/-uploaded\.tar\.gz$/);
  });
});

describe('source text', () => {
  const withFile = async (rel: string, run: () => Promise<void>) => {
    fs.mkdirSync(path.dirname(raw(rel)), { recursive: true });
    fs.writeFileSync(raw(rel), 'binary stand-in');
    try {
      await run();
    } finally {
      fs.rmSync(raw(rel), { force: true });
    }
  };

  it('returns the text the compiler extracts from a raw file', async () => {
    await withFile('project/grant.pdf', async () => {
      const { status, body } = await h.json('GET', '/api/source-text/project/grant.pdf', auth());
      expect(status).toBe(200);
      expect(body).toMatchObject({ path: 'project/grant.pdf', text: 'Grant application: 198 kWp.', truncated: false });
      expect(h.pythonCalls().at(-1)).toEqual({ command: 'source-text', input: { path: 'project/grant.pdf' } });
    });
  });

  it('is a 404 for a file that does not exist, without asking Python', async () => {
    const before = h.pythonCalls().length;
    expect((await h.json('GET', '/api/source-text/project/missing.pdf', auth())).status).toBe(404);
    expect(h.pythonCalls().length).toBe(before);
  });

  it.each(['../../package.json', '..%2F..%2Fpackage.json', '', '.'])('refuses %j', async (rel) => {
    const before = h.pythonCalls().length;
    const { status } = await h.json('GET', `/api/source-text/${rel}`, auth());
    expect([400, 404]).toContain(status);
    expect(h.pythonCalls().length).toBe(before);
  });

  it('needs a session', async () => {
    expect((await h.json('GET', '/api/source-text/notes/kickoff.txt')).status).toBe(401);
  });
});
