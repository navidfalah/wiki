import { expect, it } from 'vitest';
import { splitTextIntoChunks } from './textChunking';

it('carries a short paragraph across a boundary without exceeding the limit', () => {
  const result = splitTextIntoChunks(`${'a'.repeat(70)}\n\ncontext\n\n${'b'.repeat(70)}`, 100, 20);
  expect(result).toEqual([`${'a'.repeat(70)}\n\ncontext`, `context\n\n${'b'.repeat(70)}`]);
});
it('splits long paragraphs without cutting Unicode surrogate pairs', () => {
  const result = splitTextIntoChunks(`${'a'.repeat(9)}😀${'b'.repeat(11)}`, 10, 0);
  expect(result.join('')).toBe(`${'a'.repeat(9)}😀${'b'.repeat(11)}`);
  expect(result.every((part: string) => part.length <= 10)).toBe(true);
});
