import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startHarness, type Harness } from './__fixtures__/harness';

let h: Harness;
let token: string;
// Imported after startHarness(): paths.ts reads WIKI_DATA_ROOT when first loaded.
let clearFactCoverageCache: () => void;
const auth = () => ({ token });
const pythonCalls = () =>
  fs.existsSync(h.pythonLog) ? fs.readFileSync(h.pythonLog, 'utf-8').split('\n').filter((l) => l.includes('"fact-coverage"')).length : 0;

beforeAll(async () => {
  h = await startHarness();
  token = await h.login();
  ({ clearFactCoverageCache } = await import('../lib/factCoverage'));
});
afterAll(() => h.close());

describe('GET /api/fact-coverage', () => {
  it('returns the report and caches it until a page or source changes', async () => {
    clearFactCoverageCache();
    const before = pythonCalls();
    const first = await h.json('GET', '/api/fact-coverage', auth());
    expect(first.status).toBe(200);
    expect(first.body).toMatchObject({ cached: false, report: { recall_cited: 0.5, uncited_sources: [{ source: 'notes/orphan.txt' }] } });
    expect(first.body.report.sources[0]).toMatchObject({ source: 'notes/kickoff.txt', missing: ['19 August 2026'] });

    const second = await h.json('GET', '/api/fact-coverage', auth());
    expect(second.body.cached).toBe(true);
    expect(second.body.computed_at).toBe(first.body.computed_at);
    expect(pythonCalls()).toBe(before + 1);

    fs.writeFileSync(path.join(h.root, 'wiki-app', 'docs', 'fresh-page.md'), '---\ntitle: Fresh\n---\n\nNew.\n');
    expect((await h.json('GET', '/api/fact-coverage', auth())).body.cached).toBe(false);
    expect(pythonCalls()).toBe(before + 2);
  });

  it('reports a failed check as an error and does not cache it', async () => {
    clearFactCoverageCache();
    process.env.FAKE_FACT_COVERAGE_FAIL = '1';
    try {
      expect((await h.json('GET', '/api/fact-coverage', auth())).status).toBeGreaterThanOrEqual(500);
    } finally {
      delete process.env.FAKE_FACT_COVERAGE_FAIL;
    }
    expect((await h.json('GET', '/api/fact-coverage', auth())).status).toBe(200);
  });

  it('requires authentication', async () => {
    expect((await h.json('GET', '/api/fact-coverage')).status).toBe(401);
  });
});
