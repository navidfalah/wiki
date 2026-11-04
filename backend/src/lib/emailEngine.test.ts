import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createEmailEngine } from './emailEngine';

const roots: string[] = [];
afterEach(() => roots.splice(0).forEach((root) => fs.rmSync(root, { recursive: true, force: true })));
function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wiki-email-js-'));
  roots.push(root);
  const rawDir = path.join(root, 'raw'); fs.mkdirSync(rawDir);
  const engine = createEmailEngine({ rawDir, docsDir: root, stateFile: path.join(root, 'state.json'), trustFile: path.join(root, 'trust.json'),
    collectSourceMetadata: () => ({ topics: [], entities: [], concepts: [] }),
    synthesizedPagesForTopics: () => [], rawFileStatus: () => 'Unprocessed',
    discoverRawSourceFiles: (dir: string) => fs.readdirSync(dir).map((name) => path.join(dir, name)),
  });
  return { root, rawDir, engine };
}

describe('JavaScript MIME email reader', () => {
  it('decodes multipart text, encoded subjects and attachment names', async () => {
    const { rawDir, engine } = fixture();
    fs.writeFileSync(path.join(rawDir, 'sample.eml'), [
      'From: Mira Chen <mira@example.test>', 'To: Sam <sam@example.test>',
      'Subject: =?UTF-8?B?QmF0dGVyeSBuby4gMQ==?=', 'Date: Tue, 02 Jun 2026 12:00:00 +0000',
      'MIME-Version: 1.0', 'Content-Type: multipart/mixed; boundary="b"', '',
      '--b', 'Content-Type: text/plain; charset=utf-8', 'Content-Transfer-Encoding: quoted-printable', '', 'Battery =C3=A4 data.',
      '--b', 'Content-Type: application/pdf', 'Content-Disposition: attachment; filename="report.pdf"', 'Content-Transfer-Encoding: base64', '', 'YWJj', '--b--', '',
    ].join('\r\n'));
    const result = await engine.detail('sample.eml');
    expect(result.subject).toBe('Battery no. 1');
    expect(result.body).toBe('Battery ä data.');
    expect(result.to).toEqual(['Sam <sam@example.test>']);
    expect(result.attachments).toEqual(['report.pdf']);
    expect(result.date).toContain('02 Jun 2026');
    expect((await engine.list(true)).emails[0].body).toBe(result.body);
  });
  it('refuses traversal and symlinks outside the raw source folder', async () => {
    const { root, rawDir, engine } = fixture();
    fs.writeFileSync(path.join(root, 'outside.eml'), 'Subject: outside\n\nprivate');
    fs.symlinkSync(path.join(root, 'outside.eml'), path.join(rawDir, 'link.eml'));
    await expect(engine.detail('../outside.eml')).rejects.toMatchObject({ errorType: 'not_an_email' });
    await expect(engine.detail('link.eml')).rejects.toMatchObject({ errorType: 'not_an_email' });
    expect((await engine.list()).total).toBe(0);
  });
  it('reports missing and non-email files with the established error types', async () => {
    const { rawDir, engine } = fixture(); fs.writeFileSync(path.join(rawDir, 'note.txt'), 'note');
    await expect(engine.detail('missing.eml')).rejects.toMatchObject({ errorType: 'not_found' });
    await expect(engine.detail('note.txt')).rejects.toMatchObject({ errorType: 'not_an_email' });
  });
});

describe('JavaScript email editing', () => {
  it('creates, updates and removes an email while retaining UTF-8 content', async () => {
    const { engine } = fixture();
    const created = await engine.create({ subject: 'Überprüfung', from: 'Mira Chen <mira@example.test>', to: ['Sam <sam@example.test>'], cc: [], date: '', body: 'Grüße aus Berlin' });
    expect(created.subject).toBe('Überprüfung'); expect(created.body).toBe('Grüße aus Berlin');
    expect(created.to).toEqual(['Sam <sam@example.test>']);
    const updated = await engine.update(created.path, { subject: 'Updated', from: 'mira@example.test', to: [], cc: [], body: 'Updated message' });
    expect(updated.subject).toBe('Updated'); expect(updated.body).toBe('Updated message');
    expect(engine.remove(created.path)).toEqual({ deleted: true, path: created.path });
    await expect(engine.detail(created.path)).rejects.toMatchObject({ errorType: 'not_found' });
  });
  it('rejects email header injection without creating a file', async () => {
    const { rawDir, engine } = fixture();
    await expect(engine.create({ subject: 'Hello\nBcc: evil@example.test', from: 'mira@example.test' })).rejects.toMatchObject({ errorType: 'invalid' });
    expect(fs.readdirSync(rawDir)).toEqual([]);
  });
});
