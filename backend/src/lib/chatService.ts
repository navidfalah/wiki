import path from 'node:path';
import { DATA_ROOT, OUTPUT_DIR, RAW_DIR } from '../paths';
import { parseFrontmatter, stripFrontmatter } from './docUtils';
import { envOverridesForSpawn } from './llmSettings';
import { loadRagSettings } from './ragSettings';
import { discoverRawSourceFiles } from './rawFiles';
import { createChatEngine } from './chatEngine';

export const chatService = createChatEngine({
  docsDir: OUTPUT_DIR, rawDir: RAW_DIR, parseFrontmatter, stripFrontmatter,
  discoverRawSourceFiles, loadSettings: loadRagSettings,
  isChatAvailable: () => Boolean(envOverridesForSpawn().CHAT_OPENAI_API_KEY || process.env.OPENAI_API_KEY),
  embeddingCacheFile: path.join(DATA_ROOT, 'data', '.js-embedding-cache.json'),
  embeddingConfig: () => {
    const env = { ...process.env, ...envOverridesForSpawn() };
    return { apiKey: env.EMBEDDING_OPENAI_API_KEY || env.OPENAI_API_KEY || '', base: env.EMBEDDING_OPENAI_BASE_URL || env.OPENAI_BASE_URL || 'https://api.openai.com/v1', model: env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small' };
  },
});
