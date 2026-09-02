/**
 * RAG Architecture: lets the wiki UI pick which retrieval architecture chat
 * uses. "hybrid" is hybrid_retrieval.py's three-tier stack (BM25 always;
 * embedding fusion and LLM reranking each optional, chosen via
 * retrieval_mode -- see rag_engine.py's module docstring); the other
 * architecture values are compiler/rag_architectures.py's self-contained
 * strategies (naive, HyDE, RAG-Fusion, GraphRAG-lite, Corrective RAG -- see
 * documentation/34-rag-architectures.md), each ignoring retrieval_mode
 * entirely. Also tunes BM25's k1/b, opts into vector_store.py's persistent
 * embedding store instead of re-embedding the corpus every call (only
 * meaningful for the "hybrid" architecture), and forces extractive answers
 * (skip the chat model entirely) even when one is configured.
 *
 * Persisted to data/rag_settings.json, which compiler/rag_settings.py
 * reads directly -- unlike llmSettings.ts, there's no env-var mirroring
 * step here: retrieval happens inside chat/chat-stream subprocesses
 * (cli.py, spawned by pythonBridge.ts), not the main.py build, and Python
 * just reads this same JSON file straight from data/.
 */
import fs from 'node:fs';
import path from 'node:path';
import { PROJECT_ROOT } from '../paths';

export const RAG_SETTINGS_FILE = path.join(PROJECT_ROOT, 'data', 'rag_settings.json');

export type Architecture = 'hybrid' | 'naive' | 'hyde' | 'fusion' | 'graph' | 'corrective';
export type RetrievalMode = 'bm25' | 'hybrid' | 'hybrid_rerank';
export type AnswerMode = 'auto' | 'extractive';

const ARCHITECTURES: Architecture[] = ['hybrid', 'naive', 'hyde', 'fusion', 'graph', 'corrective'];
const RETRIEVAL_MODES: RetrievalMode[] = ['bm25', 'hybrid', 'hybrid_rerank'];
const ANSWER_MODES: AnswerMode[] = ['auto', 'extractive'];

export interface RagSettings {
  architecture: Architecture;
  retrieval_mode: RetrievalMode;
  top_k: number;
  bm25_k1: number;
  bm25_b: number;
  use_vector_store: boolean;
  answer_mode: AnswerMode;
}

const DEFAULT_SETTINGS: RagSettings = {
  architecture: 'hybrid',
  retrieval_mode: 'hybrid_rerank',
  top_k: 5,
  bm25_k1: 1.5,
  bm25_b: 0.75,
  use_vector_store: false,
  answer_mode: 'auto',
};

function readJsonSafe(filePath: string): any | null {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

export function loadRagSettings(): RagSettings {
  const parsed = readJsonSafe(RAG_SETTINGS_FILE);
  if (!parsed) return { ...DEFAULT_SETTINGS };
  const topK = Number(parsed.top_k);
  const k1 = Number(parsed.bm25_k1);
  const b = Number(parsed.bm25_b);
  return {
    architecture: ARCHITECTURES.includes(parsed.architecture) ? parsed.architecture : DEFAULT_SETTINGS.architecture,
    retrieval_mode: RETRIEVAL_MODES.includes(parsed.retrieval_mode) ? parsed.retrieval_mode : DEFAULT_SETTINGS.retrieval_mode,
    top_k: Number.isFinite(topK) && topK > 0 ? Math.floor(topK) : DEFAULT_SETTINGS.top_k,
    bm25_k1: Number.isFinite(k1) ? k1 : DEFAULT_SETTINGS.bm25_k1,
    bm25_b: Number.isFinite(b) ? b : DEFAULT_SETTINGS.bm25_b,
    use_vector_store: Boolean(parsed.use_vector_store),
    answer_mode: ANSWER_MODES.includes(parsed.answer_mode) ? parsed.answer_mode : DEFAULT_SETTINGS.answer_mode,
  };
}

export class RagSettingsError extends Error {}

export function saveRagSettings(input: any): RagSettings {
  if (!input || typeof input !== 'object') {
    throw new RagSettingsError('Invalid settings payload');
  }
  if (input.architecture !== undefined && !ARCHITECTURES.includes(input.architecture)) {
    throw new RagSettingsError(`"architecture" must be one of: ${ARCHITECTURES.join(', ')}`);
  }
  if (input.retrieval_mode !== undefined && !RETRIEVAL_MODES.includes(input.retrieval_mode)) {
    throw new RagSettingsError(`"retrieval_mode" must be one of: ${RETRIEVAL_MODES.join(', ')}`);
  }
  if (input.answer_mode !== undefined && !ANSWER_MODES.includes(input.answer_mode)) {
    throw new RagSettingsError(`"answer_mode" must be one of: ${ANSWER_MODES.join(', ')}`);
  }
  const topK = Number(input.top_k);
  if (input.top_k !== undefined && (!Number.isFinite(topK) || topK < 1)) {
    throw new RagSettingsError('"top_k" must be a positive number');
  }
  const k1 = Number(input.bm25_k1);
  if (input.bm25_k1 !== undefined && !Number.isFinite(k1)) {
    throw new RagSettingsError('"bm25_k1" must be a number');
  }
  const b = Number(input.bm25_b);
  if (input.bm25_b !== undefined && !Number.isFinite(b)) {
    throw new RagSettingsError('"bm25_b" must be a number');
  }

  const existing = loadRagSettings();
  const settings: RagSettings = {
    architecture: input.architecture ?? existing.architecture,
    retrieval_mode: input.retrieval_mode ?? existing.retrieval_mode,
    top_k: Number.isFinite(topK) && topK > 0 ? Math.floor(topK) : existing.top_k,
    bm25_k1: Number.isFinite(k1) ? k1 : existing.bm25_k1,
    bm25_b: Number.isFinite(b) ? b : existing.bm25_b,
    use_vector_store: input.use_vector_store !== undefined ? Boolean(input.use_vector_store) : existing.use_vector_store,
    answer_mode: input.answer_mode ?? existing.answer_mode,
  };
  fs.mkdirSync(path.dirname(RAG_SETTINGS_FILE), { recursive: true });
  fs.writeFileSync(RAG_SETTINGS_FILE, JSON.stringify(settings, null, 2));
  return settings;
}
