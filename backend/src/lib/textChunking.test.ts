import { expect, it } from 'vitest';
import { splitTextIntoChunks } from './textChunking';

it('returns no chunks for empty content and one when paragraphs fit', () => {
  expect(splitTextIntoChunks('')).toEqual([]);
  expect(splitTextIntoChunks('   ')).toEqual([]);
  expect(splitTextIntoChunks('a\n\nb\n\nc')).toEqual(['a\n\nb\n\nc']);
});
it('splits paragraphs when they exceed the configured size', () => {
  expect(splitTextIntoChunks('Para one.\n\nPara two.\n\nPara three.', 15)).toEqual(['Para one.', 'Para two.', 'Para three.']);
});
it('carries a boundary paragraph forward when overlap is enabled', () => {
  const paraA = 'A'.repeat(40), paraB = 'The device ships with a 4200mAh battery cell.', paraC = 'C'.repeat(40);
  const chunks = splitTextIntoChunks(`${paraA}\n\n${paraB}\n\n${paraC}`, 90, 60);
  expect(chunks).toHaveLength(2);
  expect(chunks[0]).toContain(paraB);
  expect(chunks[1]).toContain(paraB);
  expect(chunks[1]).toContain(paraC);
});
it('disables overlap at zero and scales the default overlap with maxChars', () => {
  const chunks = splitTextIntoChunks(['A', 'B', 'C'].map((letter) => letter.repeat(40)).join('\n\n'), 50, 0);
  expect(chunks).toEqual(['A'.repeat(40), 'B'.repeat(40), 'C'.repeat(40)]);
  const fact = 'The recall covers units manufactured before March 2024.';
  const long = [...Array.from({ length: 20 }, (_, i) => `Filler paragraph ${i}.`), fact,
    ...Array.from({ length: 20 }, (_, i) => `Trailing paragraph ${i}.`)].join('\n\n');
  const scaled = splitTextIntoChunks(long, 400);
  expect(scaled.length).toBeGreaterThan(1);
  expect(scaled.some((chunk) => chunk.includes(fact))).toBe(true);
});

it('carries a short paragraph across a boundary without exceeding the limit', () => {
  const result = splitTextIntoChunks(`${'a'.repeat(70)}\n\ncontext\n\n${'b'.repeat(70)}`, 100, 20);
  expect(result).toEqual([`${'a'.repeat(70)}\n\ncontext`, `context\n\n${'b'.repeat(70)}`]);
});
it('splits long paragraphs without cutting Unicode surrogate pairs', () => {
  const result = splitTextIntoChunks(`${'a'.repeat(9)}😀${'b'.repeat(11)}`, 10, 0);
  expect(result.join('')).toBe(`${'a'.repeat(9)}😀${'b'.repeat(11)}`);
  expect(result.every((part: string) => part.length <= 10)).toBe(true);
});
