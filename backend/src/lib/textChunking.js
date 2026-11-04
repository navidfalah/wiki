'use strict';

// Keep short trailing paragraphs as context across extraction boundaries.
function splitTextIntoChunks(text, maxChars = 2000, overlapChars = Math.round(maxChars * 0.125)) {
  if (!Number.isInteger(maxChars) || maxChars < 2) throw new Error('maxChars must be at least 2');
  const paragraphs = String(text).replace(/\r\n?/g, '\n').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const chunks = []; let group = [], size = 0;
  for (const paragraph of paragraphs) {
    if (group.length && size + paragraph.length + 2 > maxChars) {
      chunks.push(group.join('\n\n'));
      const carry = []; let carrySize = 0;
      for (let i = group.length - 1; i >= 0; i--) {
        const next = carrySize + group[i].length + 2;
        if (next > overlapChars || next + paragraph.length > maxChars) break;
        carry.unshift(group[i]); carrySize = next;
      }
      group = carry; size = carrySize;
    }
    // Split unusually long paragraphs, retaining the existing hard size bound.
    let remaining = paragraph;
    while (remaining.length > maxChars) {
      if (group.length) { chunks.push(group.join('\n\n')); group = []; size = 0; }
      let end = remaining.lastIndexOf(' ', maxChars);
      if (end < maxChars / 2) end = maxChars;
      if (/[\uD800-\uDBFF]/.test(remaining[end - 1])) end--;
      chunks.push(remaining.slice(0, end).trim()); remaining = remaining.slice(end).trim();
    }
    if (remaining) { group.push(remaining); size += remaining.length + 2; }
  }
  if (group.length) chunks.push(group.join('\n\n'));
  return chunks;
}
module.exports = { splitTextIntoChunks };
