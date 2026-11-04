'use strict';

const MD_SEGMENT_RE = /(\[[^\]]*\]\([^)]*\)|```[\s\S]*?```|`[^`\n]+`)/g;

function escapeOutsideSegments(text, { escapeBraces = true } = {}) {
  let escaped = text.replace(/<([^<>\s]+@[^<>\s]+)>/g, '&lt;$1&gt;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  if (escapeBraces) escaped = escaped.replace(/{/g, '&#123;').replace(/}/g, '&#125;');
  return escaped;
}

function sanitizeForMdx(body) {
  return String(body).split(MD_SEGMENT_RE).map((part, index) => index % 2 ? part : escapeOutsideSegments(part)).join('');
}

module.exports = { sanitizeForMdx };
