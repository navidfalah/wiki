const fs = require('node:fs');
const path = require('node:path');

const WORD_RE = /[a-z0-9]+/g;
const STOPWORDS = new Set(`
  a an the is are was were be been being and or but if then of to in on
  at for with as by from that this these those it its their his her he
  she they we you i not no do does did has have had will would can could
  should may might also than so such which who whom about into over under
  between per via based summary overview according general while when
  where how what
`.trim().split(/\s+/));
const FRAMING_PREFIXES = [
  'based on', 'according to', 'in summary', 'overall', 'in general',
  'to summarize', 'in conclusion',
];

function contentTokens(text) {
  return new Set((String(text).toLowerCase().match(WORD_RE) || [])
    .filter((word) => word.length > 2 && !STOPWORDS.has(word)));
}

function cleanMarkdownToProse(text) {
  return String(text)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^#{1,6}\s.*$/gm, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
    .replace(/^\s*[*-]\s+/gm, '');
}

function splitSentences(text) {
  return String(text).split(/(?<=[.!?])\s+/).map((sentence) => sentence.trim()).filter(Boolean);
}

function makeReport(sentenceReports = []) {
  const unsupported = sentenceReports.filter((report) => !report.supported);
  return {
    sentenceReports,
    checkableCount: sentenceReports.length,
    unsupported,
    unsupportedRate: sentenceReports.length ? unsupported.length / sentenceReports.length : Number.NaN,
  };
}

function scoreTextAgainstSources(candidateText, sourcesText, options = {}) {
  const supportThreshold = options.supportThreshold ?? 0.4;
  const minContentWords = options.minContentWords ?? 3;
  if (!(supportThreshold >= 0 && supportThreshold <= 1)) throw new RangeError('supportThreshold must be between 0 and 1');
  if (!Number.isInteger(minContentWords) || minContentWords < 0) throw new RangeError('minContentWords must be a non-negative integer');
  const sourceTokens = contentTokens(sourcesText);
  const reports = [];
  for (const sentence of splitSentences(candidateText)) {
    const tokens = contentTokens(sentence);
    if (tokens.size < minContentWords || FRAMING_PREFIXES.some((prefix) => sentence.toLowerCase().startsWith(prefix))) continue;
    let shared = 0;
    for (const token of tokens) if (sourceTokens.has(token)) shared += 1;
    const supportRatio = shared / tokens.size;
    reports.push({ sentence, supportRatio, supported: supportRatio >= supportThreshold });
  }
  return makeReport(reports);
}

const SOURCES_SECTION_RE = /^## (?:Sources|References & Trust)\n(.*?)(?=\n##|\n```|(?![\s\S]))/ms;
const SOURCES_HEADING_RE = /^## (?:Sources|References & Trust)\n/m;
const SOURCE_BULLET_RE = /^\*\s+`([^`]+)`\s*$/gm;
const SOURCE_TABLE_ROW_RE = /^\|\s*\d+\s*\|\s*`([^`]+)`\s*\|/gm;
const FRONTMATTER_RE = /^---\n[\s\S]*?\n---\n/;

function parsePage(pageText) {
  const body = String(pageText).replace(FRONTMATTER_RE, '');
  const heading = SOURCES_HEADING_RE.exec(body);
  if (!heading) return { body: '', sourcePaths: [] };
  const contentBefore = body.slice(0, heading.index);
  const section = SOURCES_SECTION_RE.exec(body)?.[1];
  if (section === undefined) return { body: contentBefore, sourcePaths: [] };
  const bullets = [...section.matchAll(SOURCE_BULLET_RE)].map((match) => match[1]);
  const tableRows = [...section.matchAll(SOURCE_TABLE_ROW_RE)].map((match) => match[1]);
  return { body: contentBefore, sourcePaths: [...bullets, ...tableRows] };
}

function safeSourcePath(rawDir, relativePath) {
  const root = path.resolve(rawDir);
  const file = path.resolve(root, relativePath);
  return file === root || file.startsWith(`${root}${path.sep}`) ? file : null;
}

function checkCorpusGroundedness(options = {}) {
  const docsDir = options.docsDir || path.resolve(__dirname, '../../../wiki-app/docs');
  const rawDir = options.rawDir || path.resolve(__dirname, '../../../data/raw');
  const supportThreshold = options.supportThreshold ?? 0.4;
  if (!fs.existsSync(docsDir)) return [];
  return fs.readdirSync(docsDir).filter((name) => name.endsWith('.md')).sort().flatMap((name) => {
    const pageText = fs.readFileSync(path.join(docsDir, name), 'utf8');
    const { body, sourcePaths } = parsePage(pageText);
    if (!sourcePaths.length) return [];
    const sourceTexts = sourcePaths.flatMap((relativePath) => {
      const file = safeSourcePath(rawDir, relativePath);
      if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) return [];
      return [fs.readFileSync(file, 'utf8')];
    });
    return [{ page: name, sourcePaths, report: scoreTextAgainstSources(cleanMarkdownToProse(body), sourceTexts.join('\n\n'), { supportThreshold }) }];
  });
}

function formatCorpusReport(results) {
  const total = results.reduce((sum, result) => sum + result.report.checkableCount, 0);
  const unsupported = results.reduce((sum, result) => sum + result.report.unsupported.length, 0);
  const lines = [
    `=== Offline lexical-overlap groundedness check: ${results.length} compiled wiki pages ===`,
    total ? `checkable sentences=${total}  flagged (below threshold)=${unsupported}  flagged_rate=${(unsupported / total * 100).toFixed(2)}%` : 'no checkable sentences',
    '',
    'Top 10 pages by flagged rate (candidates for a real critic pass):',
  ];
  const worst = [...results].filter((result) => result.report.checkableCount).sort((a, b) => b.report.unsupportedRate - a.report.unsupportedRate);
  for (const result of worst.slice(0, 10)) {
    lines.push(`  ${result.page.padEnd(45)} ${result.report.unsupported.length}/${result.report.checkableCount} flagged (${Math.round(result.report.unsupportedRate * 100)}%)`);
  }
  lines.push('', 'Example flagged sentences from the single worst page:');
  for (const sentence of worst[0]?.report.unsupported.slice(0, 5) || []) {
    lines.push(`  [${Math.round(sentence.supportRatio * 100)}% support] ${sentence.sentence}`);
  }
  return lines.join('\n');
}

module.exports = {
  cleanMarkdownToProse,
  splitSentences,
  scoreTextAgainstSources,
  parsePage,
  checkCorpusGroundedness,
  formatCorpusReport,
};
