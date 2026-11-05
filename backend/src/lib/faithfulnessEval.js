'use strict';

const FAITHFULNESS_JUDGE_SYSTEM_PROMPT = `You are an NLI-style faithfulness judge for a wiki chat assistant.

Given SOURCE PASSAGES and a candidate ANSWER, decide whether every factual
claim in the ANSWER is entailed by (directly supported by) the SOURCE
PASSAGES. General framing sentences ("Based on the wiki...", "In summary...")
are not factual claims and should be ignored.

Return ONLY JSON: {"faithful": true|false, "unsupported_claims": ["<claim text>", ...]}
An empty unsupported_claims list is required when faithful is true.`;
const SNIPPET_BLOCK_RE = /\*\*(.+?) — (.+?)\*\*\n([\s\S]*?)(?=\n\n\*\*|$)/g;

async function judgeFaithfulness(answer, sourcesText, llm, { signal } = {}) {
  const raw = await llm.generate({
    system: FAITHFULNESS_JUDGE_SYSTEM_PROMPT,
    prompt: `SOURCE PASSAGES:\n${sourcesText}\n\n---\n\nANSWER:\n${answer}`,
    purpose: 'chat', step: 'faithfulness judge', signal,
    sampling: { temperature: 0 },
  });
  const match = String(raw).match(/\{[\s\S]*\}/);
  if (!match) return { faithful: false, unsupported_claims: [], parse_error: 'judge response did not contain JSON' };
  let data;
  try { data = JSON.parse(match[0]); }
  catch (error) { return { faithful: false, unsupported_claims: [], parse_error: `judge response was not valid JSON: ${error.message}` }; }
  return {
    faithful: Boolean(data.faithful),
    unsupported_claims: Array.isArray(data.unsupported_claims) ? data.unsupported_claims.map(String) : [],
    parse_error: null,
  };
}

function isExtractiveAnswerVerbatim(answer, corpus) {
  const blocks = [...String(answer).matchAll(SNIPPET_BLOCK_RE)];
  if (!blocks.length) return false;
  for (const [, title, heading, rawSnippet] of blocks) {
    let snippet = rawSnippet.trim();
    if (snippet.endsWith('…')) snippet = snippet.slice(0, -1);
    const matches = corpus.filter((passage) => passage.title === title.trim() && passage.heading === heading.trim());
    if (!matches.some((passage) => String(passage.text).startsWith(snippet))) return false;
  }
  return true;
}

async function evaluateExtractiveFaithfulness(queries, { corpus, answer, signal } = {}) {
  if (!Array.isArray(corpus) || typeof answer !== 'function') throw new TypeError('corpus and answer(query) are required.');
  let total = 0, verbatimCount = 0;
  for (const query of queries) {
    const result = await answer(query, { signal });
    if (result.mode !== 'extractive') continue;
    total++;
    if (isExtractiveAnswerVerbatim(result.answer, corpus)) verbatimCount++;
  }
  return { total, verbatim_count: verbatimCount, verbatim_rate: total ? verbatimCount / total : Number.NaN };
}

async function evaluateGeneratedFaithfulness(queries, { corpus, answer, retrieve, llm, signal } = {}) {
  if (!Array.isArray(corpus) || typeof answer !== 'function' || typeof retrieve !== 'function' || !llm) {
    throw new TypeError('corpus, answer(query), retrieve(query), and llm are required.');
  }
  let total = 0, faithfulCount = 0, parseErrors = 0;
  for (const query of queries) {
    const result = await answer(query, { signal });
    if (result.mode !== 'generated') continue;
    total++;
    const passages = await retrieve(query, corpus, { llm, signal });
    const sourcesText = passages.map((item) => item.passage?.text ?? item.text ?? '').join('\n\n');
    const verdict = await judgeFaithfulness(result.answer, sourcesText, llm, { signal });
    if (verdict.parse_error) parseErrors++;
    if (verdict.faithful) faithfulCount++;
  }
  return { total, faithful_count: faithfulCount, parse_errors: parseErrors, hallucination_rate: total ? 1 - faithfulCount / total : Number.NaN };
}

module.exports = {
  FAITHFULNESS_JUDGE_SYSTEM_PROMPT,
  judgeFaithfulness,
  isExtractiveAnswerVerbatim,
  evaluateExtractiveFaithfulness,
  evaluateGeneratedFaithfulness,
};
