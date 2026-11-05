import { createWriteStream } from 'node:fs';
import { mkdir, rename, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const repo = process.env.MODEL_REPO;
const modelFile = process.env.MODEL_FILE;
if (!repo || !modelFile) throw new Error('MODEL_REPO and MODEL_FILE must be set.');
if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo)) throw new Error('MODEL_REPO must be an owner/repository pair.');
if (path.isAbsolute(modelFile) || modelFile.split(/[\\/]/).some((part) => !part || part === '.' || part === '..')) {
  throw new Error('MODEL_FILE must be a relative path inside the models directory.');
}

const destination = path.join('/models', modelFile);
await mkdir(path.dirname(destination), { recursive: true });
try {
  if ((await stat(destination)).isFile()) {
    process.stdout.write(`[local-llm] ${modelFile} already exists; skipping download.\n`);
    process.exit(0);
  }
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

const url = `https://huggingface.co/${repo}/resolve/main/${modelFile.split(/[\\/]/).map(encodeURIComponent).join('/')}`;
const headers = process.env.HF_TOKEN ? { Authorization: `Bearer ${process.env.HF_TOKEN}` } : {};
process.stdout.write(`[local-llm] downloading ${modelFile} from ${repo}…\n`);
const response = await fetch(url, { headers, redirect: 'follow', signal: AbortSignal.timeout(6 * 60 * 60 * 1000) });
if (!response.ok || !response.body) {
  throw new Error(`Model download failed (HTTP ${response.status}). Check MODEL_REPO, MODEL_FILE and HF_TOKEN.`);
}
const temporary = `${destination}.${process.pid}.partial`;
try {
  await pipeline(Readable.fromWeb(response.body), createWriteStream(temporary, { flags: 'wx' }));
  await rename(temporary, destination);
  process.stdout.write(`[local-llm] downloaded ${modelFile}.\n`);
} catch (error) {
  await rm(temporary, { force: true });
  throw error;
}
