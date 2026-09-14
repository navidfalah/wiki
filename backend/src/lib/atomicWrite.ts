/**
 * Atomic JSON file writes -- write to a sibling temp file, then rename
 * over the real path. A rename within the same directory is atomic on
 * both POSIX and Windows: a reader always sees either the old complete
 * file or the new complete file, never a partially-written one. Plain
 * `fs.writeFileSync` straight to the target path has no such guarantee --
 * a crash mid-write leaves a truncated file that every subsequent
 * `JSON.parse` on it fails, and every caller in this codebase treats that
 * failure as "empty/absent" rather than surfacing it, silently losing
 * whatever history was in the file.
 *
 * This also narrows (though, across two different processes with no
 * shared lock, can't fully eliminate) the window for a lost update when
 * something else writes the same file around the same time: the exposure
 * is however long the rename takes, not however long the full
 * JSON.stringify + write takes.
 *
 * Mirrors compiler/pipeline_tracker.py's own _atomic_write_json -- same
 * temp-file-plus-rename shape, so a file either side writes is safe
 * either way.
 */
import fs from 'node:fs';
import path from 'node:path';

export function atomicWriteJson(filePath: string, data: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2));
  fs.renameSync(tmpPath, filePath);
}
