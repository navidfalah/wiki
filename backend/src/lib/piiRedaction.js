'use strict';
// Deterministic pattern-based redaction before sending source text to a model.
const patterns = {
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  credit_card: /\b\d(?:[ -]?\d){12,18}\b/g,
  phone_number: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/g,
  api_key: /\b(?:sk|pk|rk)-[A-Za-z0-9]{16,}\b|\b(?=[A-Za-z0-9_-]{32,}\b)(?=[A-Za-z0-9_-]*[0-9])(?=[A-Za-z0-9_-]*[A-Za-z])[A-Za-z0-9_-]{32,}\b/g,
  ipv4_address: /\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g,
  email: /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g,
};
const DEFAULT_CATEGORIES = ['ssn', 'credit_card', 'api_key', 'phone_number', 'ipv4_address'];
function luhnValid(digits) {
  let total = 0; const parity = digits.length % 2;
  for (let i = 0; i < digits.length; i++) { let n = Number(digits[i]); if (i % 2 === parity) { n *= 2; if (n > 9) n -= 9; } total += n; }
  return total % 10 === 0;
}
function redactText(text, categories = DEFAULT_CATEGORIES) {
  const matches = [];
  for (const category of categories) {
    if (!patterns[category]) continue;
    for (const match of String(text).matchAll(patterns[category])) {
      if (category === 'credit_card' && !luhnValid(match[0].replace(/\D/g, ''))) continue;
      matches.push({ start: match.index, end: match.index + match[0].length, category, original: match[0] });
    }
  }
  matches.sort((a, b) => a.start - b.start || b.end - a.end);
  const placeholders = new Map(), counts = {}, findings = []; let cursor = 0, output = '';
  for (const match of matches) {
    if (match.start < cursor) continue;
    const key = `${match.category}\0${match.original}`;
    if (!placeholders.has(key)) { counts[match.category] = (counts[match.category] || 0) + 1; placeholders.set(key, `[${match.category.toUpperCase()}_${counts[match.category]}]`); }
    const placeholder = placeholders.get(key);
    output += String(text).slice(cursor, match.start) + placeholder;
    findings.push({ ...match, placeholder }); cursor = match.end;
  }
  return { text: output + String(text).slice(cursor), findings, had_findings: findings.length > 0 };
}
module.exports = { redactText, luhnValid, DEFAULT_CATEGORIES };
