import path from 'node:path';
import { DATA_ROOT, OUTPUT_DIR, RAW_DIR } from '../paths';
import { parseFrontmatter, stripFrontmatter } from './docUtils';
import { envOverridesForSpawn } from './llmSettings';
import { loadRagSettings } from './ragSettings';
import { discoverRawSourceFiles } from './rawFiles';
import { createChatEngine } from './chatEngine';
import { createModelClient } from './modelClient';
import { scoreTextAgainstSources } from './faithfulnessHeuristic.js';

function chatModel() {
  const env = { ...process.env, ...envOverridesForSpawn() };
  const profile = {
    apiKey: env.CHAT_OPENAI_API_KEY || env.OPENAI_API_KEY || '',
    base: env.CHAT_OPENAI_BASE_URL || env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    model: env.CHAT_OPENAI_MODEL || env.OPENAI_MODEL || 'gpt-4o-mini',
    sampling: {
      temperature: Number(env.CHAT_TEMPERATURE ?? env.OPENAI_TEMPERATURE ?? 0.2),
      ...(env.CHAT_TOP_P ? { top_p: Number(env.CHAT_TOP_P) } : {}),
      ...(env.CHAT_MAX_TOKENS ? { max_tokens: Number(env.CHAT_MAX_TOKENS) } : {}),
      ...(env.CHAT_REASONING_EFFORT ? { reasoning_effort: env.CHAT_REASONING_EFFORT } : {}),
    },
  };
  if (!profile.apiKey) return null;
  return createModelClient({ default: profile });
}

export const chatService = createChatEngine({
  docsDir: OUTPUT_DIR, rawDir: RAW_DIR, parseFrontmatter, stripFrontmatter,
  discoverRawSourceFiles, loadSettings: loadRagSettings,
  isChatAvailable: () => Boolean(envOverridesForSpawn().CHAT_OPENAI_API_KEY || process.env.OPENAI_API_KEY),
  generateAnswer: async ({ message, context, sourceLabel }: { message: string; context: string; sourceLabel: string }) => {
    const client = chatModel();
    if (!client) return null;
    return client.generate({
      system: `You are a research assistant answering from the user's ${sourceLabel}. Use only the numbered excerpts in the context. Cite factual statements with their bracketed source numbers, for example [1]. If the excerpts do not support an answer, say so plainly. Do not infer missing facts.`,
      prompt: `Question: ${message}\n\nNumbered source excerpts:\n${context}`,
      step: 'chat answer',
    });
  },
  scoreAnswer: (answer: string, context: string) => {
    const report = scoreTextAgainstSources(answer, context);
    return {
      basis: 'heuristic' as const,
      unsupported_rate: Number.isFinite(report.unsupportedRate) ? report.unsupportedRate : 0,
      checkable_count: report.checkableCount,
    };
  },
  embeddingCacheFile: path.join(DATA_ROOT, 'data', '.js-embedding-cache.json'),
  vectorStoreFile: path.join(DATA_ROOT, 'data', 'vector_store.sqlite'),
  embeddingConfig: () => {
    const env = { ...process.env, ...envOverridesForSpawn() };
    return { apiKey: env.EMBEDDING_OPENAI_API_KEY || env.OPENAI_API_KEY || '', base: env.EMBEDDING_OPENAI_BASE_URL || env.OPENAI_BASE_URL || 'https://api.openai.com/v1', model: env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small' };
  },
});
