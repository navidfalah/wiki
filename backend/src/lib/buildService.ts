import path from 'node:path';
import type { Response } from 'express';
import { DATA_ROOT, INDEX_JSON, LINK_OVERRIDES_FILE, OUTPUT_DIR, PIPELINE_RUNS_DIR, RAW_DIR, STATE_FILE, STATIC_MEDIA_DIR, TEMP_OUTPUT_DIR } from '../paths';
import { atomicWriteJson } from './atomicWrite';
import { logSystemEvent } from './activityLog';
import { envOverridesForSpawn } from './llmSettings';
import { snapshotPage, isPageFile } from './pageHistory';
import { discoverRawSourceFiles } from './rawFiles';
import { createBuildManager } from './buildManager';

export interface CompilerBuildOptions {
  force?: boolean; excludeFolders?: string[]; criticPass?: boolean; criticSamples?: number;
  criticRegenerate?: boolean; useCorrections?: boolean; redactPii?: boolean; webSearch?: boolean;
  defaultProfileId?: string | null; thinkingProfileId?: string | null;
}

const manager = createBuildManager({
  runsDir: PIPELINE_RUNS_DIR, cacheFile: path.join(DATA_ROOT, 'data', '.js-compiler-cache.json'), atomicWriteJson,
  logError: (message: string) => logSystemEvent('Compiler build failed', message, 'error'),
  modelConfig: (opts: CompilerBuildOptions) => {
    const env = { ...process.env, ...envOverridesForSpawn({ ...(opts.defaultProfileId ? { default: opts.defaultProfileId } : {}), ...(opts.thinkingProfileId ? { thinking: opts.thinkingProfileId } : {}) }) };
    const sampling = (prefix: string) => {
      const number = (name: string): number | undefined => {
        const value = env[`${prefix}_${name}`];
        return value !== undefined && value.trim() !== '' && Number.isFinite(Number(value)) ? Number(value) : undefined;
      };
      return { temperature: number('TEMPERATURE'), top_p: number('TOP_P'), max_tokens: number('MAX_TOKENS'), reasoning_effort: env[`${prefix}_REASONING_EFFORT`] || undefined };
    };
    const standard = { apiKey: env.OPENAI_API_KEY || '', base: env.OPENAI_BASE_URL || 'https://api.openai.com/v1', model: env.OPENAI_MODEL || 'gpt-4o-mini', sampling: sampling('OPENAI') };
    return { default: standard, thinking: { apiKey: env.THINKING_OPENAI_API_KEY || standard.apiKey, base: env.THINKING_OPENAI_BASE_URL || standard.base, model: env.THINKING_OPENAI_MODEL || standard.model, sampling: sampling('THINKING') }, embeddingModel: env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small', transcriptionModel: env.OPENAI_TRANSCRIPTION_MODEL || 'whisper-1' };
  },
  compilerOptions: { rawDir: RAW_DIR, docsDir: OUTPUT_DIR, tempDir: TEMP_OUTPUT_DIR, stateFile: STATE_FILE, indexFile: INDEX_JSON,
    trustFile: path.join(DATA_ROOT, 'data', 'source_trust.json'), correctionsFile: path.join(DATA_ROOT, 'data', 'review_corrections.json'), overridesFile: LINK_OVERRIDES_FILE, staticDir: STATIC_MEDIA_DIR,
    discoverRawSourceFiles, snapshot: (file: string, reason: 'compile' | 'delete', content?: string) => { if (isPageFile(path.basename(file))) snapshotPage(file, reason, content); },
  },
});

export function streamCompilerBuild(res: Response, options: CompilerBuildOptions): void { manager.start(res, options); }
export function isBuildRunning(): boolean { return manager.running(); }
export function isBuildQueued(): boolean { return manager.queued(); }
export function getCurrentRunId(): string | null { return manager.currentRunId(); }
export function stopBuild(): boolean { return manager.stop(); }
