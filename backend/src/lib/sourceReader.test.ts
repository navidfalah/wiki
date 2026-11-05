import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { zipSync, strToU8 } from 'fflate';
import { readSource, readSourceBytes } from './sourceReader';

describe('JavaScript source reader', () => {
  it('reads Office documents, spreadsheets and presentation notes without Python', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wiki-reader-'));
    try {
      const samples = [
        ['a.docx', { 'word/document.xml': '<w:document><w:p><w:r><w:t>Battery report</w:t></w:r></w:p></w:document>' }, 'Battery report'],
        ['b.xlsx', { 'xl/workbook.xml': '<workbook xmlns:r="r"><sheets><sheet name="Sheet" r:id="r1"/></sheets></workbook>', 'xl/_rels/workbook.xml.rels': '<Relationships><Relationship Id="r1" Target="worksheets/sheet1.xml"/></Relationships>', 'xl/worksheets/sheet1.xml': '<worksheet><row><c r="A1"><v>220</v></c></row></worksheet>' }, '220'],
        ['c.pptx', { 'ppt/presentation.xml': '<p:presentation xmlns:r="r"><p:sldId r:id="r1"/></p:presentation>', 'ppt/_rels/presentation.xml.rels': '<Relationships><Relationship Id="r1" Target="slides/slide1.xml"/></Relationships>', 'ppt/slides/slide1.xml': '<p:sld><a:p><a:t>Slide content</a:t></a:p></p:sld>' }, 'Slide content'],
      ] as const;
      for (const [name, entries, expected] of samples) {
        const filename = path.join(root, name);
        fs.writeFileSync(filename, zipSync(Object.fromEntries(Object.entries(entries).map(([key, value]) => [key, strToU8(value)]))));
        expect(await readSource(filename)).toContain(expected);
      }
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  });
  it('reports inaccessible content and never executes markup', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wiki-reader-'));
    try {
      const html = path.join(root, 'a.html'); fs.writeFileSync(html, '<script>alert(1)</script><p>Battery</p>');
      expect(await readSource(html)).not.toContain('alert');
      const broken = path.join(root, 'broken.xlsx'); fs.writeFileSync(broken, 'broken');
      expect(await readSource(broken)).toContain('content unavailable');
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  });

  it('reads text-oriented formats, strips active HTML, and lists ZIP entries without extracting them', async () => {
    for (const [name, text] of [
      ['a.csv', 'name,value\nfoo,1'], ['b.tsv', 'name\tvalue\nfoo\t1'],
      ['c.json', '{"key":"value"}'], ['d.xml', '<record>Battery</record>'],
      ['e.yaml', 'battery: 220'], ['f.log', 'battery warning'],
    ]) expect(await readSourceBytes(Buffer.from(text), name)).toContain(text);
    expect(await readSourceBytes(Buffer.from('<script>secret()</script><p>Battery</p>'), 'page.html')).not.toContain('secret');
    const zip = zipSync({ 'folder/readme.txt': strToU8('not extracted'), 'other.csv': strToU8('name,value') });
    const manifest = await readSourceBytes(Buffer.from(zip), 'archive.zip');
    expect(manifest).toContain('folder/readme.txt');
    expect(manifest).toContain('other.csv');
    expect(manifest).not.toContain('not extracted');
    expect(await readSourceBytes(Buffer.from('opaque'), 'file.rtf')).toContain('content not parsed');
  });
});
