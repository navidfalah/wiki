import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startHarness, type Harness } from './__fixtures__/harness';

let h: Harness;
let token: string;
const auth = () => ({ token });
const RUN_ID = '20260927-120000-abcdef'; // what the fake compiler reports
const docs = (file: string) => path.join(h.root, 'wiki-app', 'docs', file);

const page = (title: string, body: string) => `---\ntitle: ${title}\n---\n\n${body}\n`;

/** UTC stamp in page_history's format: 20260927T124500123456Z. */
function stampNow(): string {
  const iso = new Date().toISOString();
  return `${iso.slice(0, 10).replace(/-/g, '')}T${iso.slice(11, 19).replace(/:/g, '')}${iso.slice(20, 23)}000Z`;
}

/** What linker.py does to a page: keep the old content in page history, then replace or remove it. */
function compilerReplaces(file: string, reason: 'compile' | 'delete', newContent?: string) {
  const stem = path.basename(file, '.md');
  const dir = path.join(h.root, 'data', 'page_history', stem);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${stampNow()}-${reason}.md`), fs.readFileSync(docs(file), 'utf-8'));
  if (newContent === undefined) fs.rmSync(docs(file));
  else fs.writeFileSync(docs(file), newContent);
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function runBuild(duringBuild?: () => void): Promise<any[]> {
  process.env.FAKE_BUILD_SLEEP_MS = '600';
  try {
    const streaming = h.request('GET', '/api/build/stream', auth()).then((res) => res.text());
    if (duringBuild) {
      await sleep(250);
      duringBuild();
    }
    const text = await streaming;
    return text
      .split('\n\n')
      .filter((b) => b.startsWith('data: '))
      .map((b) => JSON.parse(b.slice('data: '.length)));
  } finally {
    delete process.env.FAKE_BUILD_SLEEP_MS;
  }
}

beforeAll(async () => {
  h = await startHarness();
  token = await h.login();
  // The run the fake compiler will report must exist for the API to serve it.
  const runsDir = path.join(h.root, 'data', 'pipeline_runs');
  fs.mkdirSync(runsDir, { recursive: true });
  const run = { id: RUN_ID, started_at: '2026-09-27T12:00:00Z', finished_at: '2026-09-27T12:01:00Z', status: 'success', force: false, error: null, steps: [], token_usage: [] };
  fs.writeFileSync(path.join(runsDir, `${RUN_ID}.json`), JSON.stringify(run));
  const { steps: _s, token_usage: _t, error: _e, ...summary } = run;
  fs.writeFileSync(path.join(runsDir, 'index.json'), JSON.stringify([summary]));
  fs.writeFileSync(docs('aurora-labs.md'), page('Aurora Labs', 'line one\nline two'));
});
afterAll(() => h.close());

describe('compile "what changed" report', () => {
  it('a run has no report until a build has finished', async () => {
    expect((await h.json('GET', `/api/pipelines/${RUN_ID}/changes`, auth())).body).toEqual({ report: null });
    expect((await h.json('GET', '/api/pipelines', auth())).body.runs[0].changes).toBeNull();
  });

  it('records the pages a build added, changed and removed, with line counts', async () => {
    const events = await runBuild(() => {
      compilerReplaces('aurora-labs.md', 'compile', page('Aurora Labs', 'line one\nline two\nline three\nline four'));
      compilerReplaces('nova-widget.md', 'delete');
      fs.writeFileSync(docs('fresh-page.md'), page('Fresh page', 'hello'));
    });
    expect(events.at(-1)).toMatchObject({ type: 'done', success: true });

    const { report } = (await h.json('GET', `/api/pipelines/${RUN_ID}/changes`, auth())).body;
    expect(report.totals).toEqual({ added: 1, changed: 1, removed: 1, unchanged: 0 });
    expect(report.pages).toEqual([
      { path: 'fresh-page.md', title: 'Fresh page', status: 'added', lines_added: 5, lines_removed: null },
      { path: 'aurora-labs.md', title: 'Aurora Labs', status: 'changed', lines_added: 2, lines_removed: 0 },
      { path: 'nova-widget.md', title: expect.any(String), status: 'removed', lines_added: null, lines_removed: expect.any(Number) },
    ]);
    expect(report.run_id).toBe(RUN_ID);

    const listed = (await h.json('GET', '/api/pipelines', auth())).body.runs.find((r: any) => r.id === RUN_ID);
    expect(listed.changes).toEqual({ added: 1, changed: 1, removed: 1, unchanged: 0 });
  });

  it('also writes a report for a failed build, so partial changes are visible', async () => {
    process.env.FAKE_BUILD_EXIT = '3';
    try {
      const events = await runBuild(() => fs.writeFileSync(docs('half-done.md'), page('Half done', 'x')));
      expect(events.at(-1)).toMatchObject({ type: 'done', success: false, code: 3 });
    } finally {
      delete process.env.FAKE_BUILD_EXIT;
    }
    const { report } = (await h.json('GET', `/api/pipelines/${RUN_ID}/changes`, auth())).body;
    expect(report.totals).toMatchObject({ added: 1, changed: 0, removed: 0 });
    expect(report.pages[0].path).toBe('half-done.md');
  });

  it('reports a build that changed nothing as such', async () => {
    await runBuild();
    const { report } = (await h.json('GET', `/api/pipelines/${RUN_ID}/changes`, auth())).body;
    expect(report.totals).toMatchObject({ added: 0, changed: 0, removed: 0 });
    expect(report.totals.unchanged).toBeGreaterThan(0);
    expect(report.pages).toEqual([]);
  });

  it('needs a session, and unknown or malformed run ids are 404', async () => {
    expect((await h.json('GET', `/api/pipelines/${RUN_ID}/changes`)).status).toBe(401);
    expect((await h.json('GET', '/api/pipelines/20990101-000000-ffffff/changes', auth())).status).toBe(404);
    expect((await h.json('GET', '/api/pipelines/..%2F..%2Fusers/changes', auth())).status).toBe(404);
  });

  it('deleting a run deletes its report', async () => {
    const file = path.join(h.root, 'data', 'compile_reports', `${RUN_ID}.json`);
    expect(fs.existsSync(file)).toBe(true);
    expect((await h.json('DELETE', `/api/pipelines/${RUN_ID}`, auth())).status).toBe(200);
    expect(fs.existsSync(file)).toBe(false);
    expect(JSON.parse(fs.readFileSync(path.join(h.root, 'data', 'compile_reports', 'index.json'), 'utf-8'))).toEqual({});
  });
});
