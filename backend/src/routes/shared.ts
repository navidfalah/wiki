import path from 'node:path';
import { HttpError } from '../lib/httpError';

/** Resolve a client-supplied relative path within its allowed root. */
export function safePath(root: string, relPath: string): string {
  const candidate = path.resolve(root, relPath);
  const rootResolved = path.resolve(root);
  if (candidate !== rootResolved && !candidate.startsWith(rootResolved + path.sep)) {
    throw new HttpError(400, 'Invalid path');
  }
  return candidate;
}
