/**
 * fs.readdirSync(dir, { withFileTypes: true })'s Dirent.isFile()/
 * isDirectory() report the *directory entry's own* type (DT_REG, DT_DIR,
 * DT_LNK, ...) -- for a symlink entry they're both false regardless of
 * what the link points at, so code that branches on them silently skips
 * every symlinked file or directory. Since every source-folder mirror
 * (sourcesRegistry.ts) is made entirely of symlinks, every recursive
 * walker in this codebase needs to resolve through the link with
 * fs.statSync (not lstatSync) instead of trusting the Dirent flags.
 * Caught directly: a mirrored file was invisible to /api/raw-files until
 * this fix.
 */
import fs from 'node:fs';
import path from 'node:path';

export function statFollowingSymlink(fullPath: string): fs.Stats | null {
  try {
    return fs.statSync(fullPath);
  } catch {
    return null; // broken symlink, permission error, race with deletion, etc.
  }
}

export function walkEntries(
  dir: string,
  onEntry: (fullPath: string, name: string, stat: fs.Stats) => void,
): void {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = statFollowingSymlink(full);
    if (!stat) continue;
    onEntry(full, name, stat);
  }
}
