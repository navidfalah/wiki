import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  checkCorpusGroundedness,
  cleanMarkdownToProse,
  formatCorpusReport,
  parsePage,
  scoreTextAgainstSources,
  splitSentences,
} from './faithfulnessHeuristic.js';

let tempRoot: string | undefined;
afterEach(() => {
  if (tempRoot) rmSync(tempRoot, { recursive: true, force: true });
  tempRoot = undefined;
});

describe('faithfulness heuristic', () => {
  it('splits sentences and unwraps common markdown', () => {
    expect(splitSentences('First sentence. Second sentence! Third one?')).toEqual([
      'First sentence.', 'Second sentence!', 'Third one?',
    ]);
    const cleaned = cleanMarkdownToProse('## Heading\n\nThe **[Nova Widget](./nova.md)** uses `MeshSync`.\n```js\nignoreThis()\n```');
    expect(cleaned).toContain('Nova Widget');
    expect(cleaned).toContain('MeshSync');
    expect(cleaned).not.toContain('Heading');
    expect(cleaned).not.toContain('ignoreThis');
  });

  it('scores supported, unsupported and paraphrased claims while skipping framing', () => {
    const source = 'The Nova Widget ships with a CR2032 battery and a 15 minute read interval.';
    const supported = scoreTextAgainstSources('The Nova Widget uses a CR2032 battery with a 15 minute read interval.', source, { supportThreshold: 0.5 });
    expect(supported.checkableCount).toBe(1);
    expect(supported.sentenceReports[0].supported).toBe(true);
    const unsupported = scoreTextAgainstSources('The device was recalled in March 2024 due to a fire hazard in the charging port.', source);
    expect(unsupported.unsupported).toHaveLength(1);
    expect(scoreTextAgainstSources('Based on the sources, it works well. See above. Yes.', source).checkableCount).toBe(0);
    const paraphrase = scoreTextAgainstSources('Nova Widget Beta Boards: Beta boards for the Nova Widget have been received, marking a significant milestone in its development cycle and indicating readiness for further testing and validation.', 'mira: nova widget beta boards arrived');
    expect(paraphrase.sentenceReports[0].supportRatio).toBeLessThan(0.4);
    expect(Number.isNaN(scoreTextAgainstSources('', '').unsupportedRate)).toBe(true);
  });

  it('parses frontmatter, source bullets and trust tables, and omits pages without references', () => {
    const bulletPage = '---\nid: x\ntitle: X\n---\n\n# X\n\n## Overview\nSome prose here.\n\n## Sources\n*   `notes/a.md`\n*   `notes/b.txt`\n\n```python\nnot a path\n```';
    expect(parsePage(bulletPage)).toEqual({ body: '\n# X\n\n## Overview\nSome prose here.\n\n', sourcePaths: ['notes/a.md', 'notes/b.txt'] });
    expect(parsePage('---\nid: x\n---\n\n# X\n\nNo source section.')).toEqual({ body: '', sourcePaths: [] });
    expect(parsePage('---\nid: x\n---\n\n# X\nProse\n\n## References & Trust\n| # | Source | Type | Trust |\n|---|---|---|---|\n| 1 | `emails/a.eml` | email | Medium |\n'))
      .toEqual({ body: '\n# X\nProse\n\n', sourcePaths: ['emails/a.eml'] });
  });

  it('scores a local corpus, skips missing references, and rejects source path traversal', () => {
    tempRoot = mkdtempSync(path.join(tmpdir(), 'faithfulness-'));
    const docs = path.join(tempRoot, 'docs');
    const raw = path.join(tempRoot, 'raw');
    mkdirSync(docs);
    mkdirSync(raw);
    writeFileSync(path.join(raw, 'source.txt'), 'Nova Widget has a CR2032 battery.');
    writeFileSync(path.join(docs, 'a.md'), '---\nid: a\n---\n\nNova Widget uses a CR2032 battery.\n\n## Sources\n* `source.txt`\n* `missing.txt`\n* `../../outside.txt`\n');
    writeFileSync(path.join(docs, 'b.md'), '# no sources');
    const results = checkCorpusGroundedness({ docsDir: docs, rawDir: raw });
    expect(results).toHaveLength(1);
    expect(results[0].sourcePaths).toHaveLength(3);
    expect(results[0].report.checkableCount).toBe(1);
    expect(results[0].report.unsupportedRate).toBe(0);
    expect(formatCorpusReport(results)).toContain('1 compiled wiki pages');
  });

  it('checks the committed wiki corpus using its source references', () => {
    const results = checkCorpusGroundedness();
    expect(results.length).toBeGreaterThan(100);
    expect(results.every((result) => result.report.checkableCount >= 0)).toBe(true);
    expect(results.reduce((sum, result) => sum + result.report.checkableCount, 0)).toBeGreaterThan(1000);
  });
});
