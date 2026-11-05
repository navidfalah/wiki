const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { afterEach, describe, expect, it } = require('vitest');
const trust = require('./trust');

const tempDirs = [];
function tempFile() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'source-trust-'));
  tempDirs.push(dir);
  return path.join(dir, 'source_trust.json');
}
afterEach(() => { for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true }); });

describe('source trust and references', () => {
  it('uses source-type defaults and medium fallback for unknown types', () => {
    expect(trust.resolveTrust('notes/foo.md', 'text').level).toBe('medium');
    expect(trust.resolveTrust('images/shot.png', 'image').level).toBe('low');
    expect(trust.resolveTrust('weird/x.bin', 'mystery').level).toBe('medium');
  });

  it('applies the first matching glob rule and normalizes invalid levels', () => {
    const config = { default_by_source_type: {}, rules: [
      { pattern: 'emails/verified/**', level: 'verified', reason: 'Verified thread' },
      { pattern: 'samples/**', level: 'unverified' },
      { pattern: 'samples/verified/**', level: 'verified' },
    ] };
    expect(trust.resolveTrust('emails/verified/thread.eml', 'email', config)).toMatchObject({ level: 'verified', reason: 'Verified thread' });
    expect(trust.resolveTrust('samples/verified/x.md', 'text', config).level).toBe('unverified');
    expect(trust.resolveTrust('anything.md', 'text', { rules: [{ pattern: '*', level: 'very-trusted' }] }).level).toBe('medium');
    expect(trust.TRUST_SCORES.unverified).toBeLessThan(trust.TRUST_SCORES.verified);
  });

  it('loads defaults for missing or malformed config and round trips saved config', () => {
    const file = tempFile();
    expect(trust.loadTrustConfig(file)).toMatchObject({ rules: [], default_by_source_type: trust.DEFAULT_TRUST_BY_SOURCE_TYPE });
    fs.writeFileSync(file, '{broken');
    expect(trust.loadTrustConfig(file).default_by_source_type).toEqual(trust.DEFAULT_TRUST_BY_SOURCE_TYPE);
    const config = { version: 1, default_by_source_type: { email: 'high' }, rules: [{ pattern: 'verified/**', level: 'verified' }] };
    trust.saveTrustConfig(config, file);
    expect(trust.loadTrustConfig(file)).toMatchObject(config);
  });

  it('deduplicates references by first source occurrence and renders stable markdown', () => {
    const refs = trust.buildReferences([
      { source: 'notes/a.md', chunk_index: 0, source_type: 'text' },
      { source: 'notes/a.md', chunk_index: 1, source_type: 'text' },
      { source: 'emails/b.eml', chunk_index: 0, source_type: 'email' },
    ], trust.DEFAULT_CONFIG);
    expect(refs.map((item) => item.source_path)).toEqual(['notes/a.md', 'emails/b.eml']);
    expect(refs.map((item) => item.index)).toEqual([1, 2]);
    expect(refs[0].chunk_index).toBe(0);
    expect(trust.renderReferencesMarkdown([])).toBe('');
    expect(trust.renderReferencesMarkdown(refs)).toContain('| 1 | `notes/a.md` | text | Medium |');
  });
});
