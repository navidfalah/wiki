/**
 * Port of compiler/sources_registry.py -- registers external folders as a
 * mirrored tree of per-file symlinks under data/raw/, so the Python
 * compiler's discover_raw_source_files() (which walks RAW_DIR recursively,
 * same non-symlink-following-directory caveat that motivated per-file
 * mirroring in the Python original) picks every file up unchanged.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { RAW_DIR, SOURCES_FILE } from '../paths';
import { walkEntries } from './fsWalk';

export interface SourceEntry {
  id: string;
  label: string;
  path: string;
  link_name: string;
  enabled: boolean;
  added_at: string;
}

export interface SourceEntryWithStatus extends SourceEntry {
  exists: boolean;
  file_count: number;
}

interface Registry {
  version: number;
  sources: SourceEntry[];
}

export class SourceError extends Error {}

function slugifyLabel(label: string): string {
  const slug = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'source';
}

function uniqueLinkName(label: string, existing: Set<string>): string {
  const base = slugifyLabel(label);
  let name = base;
  let counter = 2;
  while (existing.has(name)) {
    name = `${base}-${counter}`;
    counter += 1;
  }
  return name;
}

function load(): Registry {
  if (!fs.existsSync(SOURCES_FILE)) {
    return { version: 1, sources: [] };
  }
  try {
    const data = JSON.parse(fs.readFileSync(SOURCES_FILE, 'utf-8'));
    if (!Array.isArray(data.sources)) data.sources = [];
    return data;
  } catch {
    return { version: 1, sources: [] };
  }
}

function save(data: Registry): void {
  fs.mkdirSync(path.dirname(SOURCES_FILE), { recursive: true });
  fs.writeFileSync(SOURCES_FILE, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

function countFiles(dir: string): number {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return 0;
  let count = 0;
  const walk = (d: string) => {
    walkEntries(d, (full, name, stat) => {
      if (name.startsWith('.')) return;
      if (stat.isDirectory()) walk(full);
      else if (stat.isFile()) count += 1;
    });
  };
  try {
    walk(dir);
  } catch {
    return count;
  }
  return count;
}

export function listSources(): SourceEntryWithStatus[] {
  const { sources } = load();
  return sources.map((entry) => {
    const exists = fs.existsSync(entry.path) && fs.statSync(entry.path).isDirectory();
    return { ...entry, exists, file_count: countFiles(entry.path) };
  });
}

export function addSource(rawPath: string, label?: string | null): SourceEntry {
  if (!rawPath || !rawPath.trim()) throw new SourceError('Path is required');
  const resolved = path.resolve(rawPath.trim());
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
    throw new SourceError(`Not a directory: ${resolved}`);
  }

  const rawResolved = path.resolve(RAW_DIR);
  if (resolved === rawResolved || resolved.startsWith(rawResolved + path.sep)) {
    throw new SourceError('Cannot add data/raw/ (or a folder inside it) as a source');
  }
  if (rawResolved.startsWith(resolved + path.sep)) {
    throw new SourceError('Cannot add a folder that contains data/raw/ as a source');
  }

  const data = load();
  if (data.sources.some((entry) => path.resolve(entry.path) === resolved)) {
    throw new SourceError('This folder is already registered');
  }

  const existingNames = new Set(data.sources.map((entry) => entry.link_name));
  const linkName = uniqueLinkName(label || path.basename(resolved), existingNames);

  const entry: SourceEntry = {
    id: crypto.randomBytes(6).toString('hex'),
    label: (label || path.basename(resolved)).trim() || path.basename(resolved),
    path: resolved,
    link_name: linkName,
    enabled: true,
    added_at: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
  };
  data.sources.push(entry);
  save(data);
  syncSymlinks();
  return entry;
}

export function removeSource(id: string): boolean {
  const data = load();
  const removed = data.sources.find((entry) => entry.id === id);
  if (!removed) return false;
  data.sources = data.sources.filter((entry) => entry.id !== id);
  save(data);
  removeMirror(path.join(RAW_DIR, removed.link_name));
  syncSymlinks();
  return true;
}

export function setEnabled(id: string, enabled: boolean): SourceEntry | null {
  const data = load();
  const entry = data.sources.find((item) => item.id === id);
  if (!entry) return null;
  entry.enabled = enabled;
  save(data);
  syncSymlinks();
  return entry;
}

function removeMirror(root: string): void {
  let stat;
  try {
    stat = fs.lstatSync(root);
  } catch {
    return;
  }
  if (stat.isSymbolicLink()) {
    fs.unlinkSync(root);
    return;
  }
  if (!stat.isDirectory()) return;

  const entries: string[] = [];
  const walk = (d: string) => {
    for (const child of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, child.name);
      entries.push(full);
      if (child.isDirectory() && !child.isSymbolicLink()) walk(full);
    }
  };
  walk(root);
  // Deepest first so a directory is only rmdir'd once it's empty.
  entries.sort((a, b) => b.split(path.sep).length - a.split(path.sep).length);
  for (const entry of entries) {
    const entryStat = fs.lstatSync(entry);
    if (entryStat.isSymbolicLink()) {
      fs.unlinkSync(entry);
    } else if (entryStat.isDirectory()) {
      try {
        fs.rmdirSync(entry);
      } catch {
        /* not empty -- leave real content alone */
      }
    }
  }
  try {
    fs.rmdirSync(root);
  } catch {
    /* not empty */
  }
}

function mirrorSource(linkRoot: string, target: string): void {
  fs.mkdirSync(linkRoot, { recursive: true });
  const liveRelPaths = new Set<string>();

  const walkTarget = (dir: string) => {
    walkEntries(dir, (full, _name, stat) => {
      if (stat.isDirectory()) {
        walkTarget(full);
      } else if (stat.isFile()) {
        const rel = path.relative(target, full);
        liveRelPaths.add(rel);
        const dest = path.join(linkRoot, rel);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        let shouldLink = true;
        try {
          const destStat = fs.lstatSync(dest);
          if (destStat.isSymbolicLink()) {
            const resolvedDest = fs.realpathSync(dest);
            if (resolvedDest === fs.realpathSync(full)) {
              shouldLink = false;
            } else {
              fs.unlinkSync(dest);
            }
          } else {
            shouldLink = false; // a real file already occupies this path
          }
        } catch {
          /* dest doesn't exist -- create it */
        }
        if (shouldLink) {
          try {
            fs.symlinkSync(full, dest);
          } catch {
            /* ignore */
          }
        }
      }
    });
  };
  walkTarget(target);

  // Remove mirrored symlinks whose source file no longer exists.
  const pruneStale = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      const rel = path.relative(linkRoot, full);
      if (entry.isSymbolicLink()) {
        if (!liveRelPaths.has(rel)) fs.unlinkSync(full);
      } else if (entry.isDirectory()) {
        pruneStale(full);
        try {
          fs.rmdirSync(full);
        } catch {
          /* not empty */
        }
      }
    }
  };
  pruneStale(linkRoot);
}

export function syncSymlinks(): void {
  fs.mkdirSync(RAW_DIR, { recursive: true });
  const { sources } = load();
  const wanted = new Map(sources.filter((s) => s.enabled).map((s) => [s.link_name, s.path]));
  const allNames = new Set(sources.map((s) => s.link_name));

  for (const entry of fs.readdirSync(RAW_DIR, { withFileTypes: true })) {
    if (allNames.has(entry.name) && !wanted.has(entry.name)) {
      removeMirror(path.join(RAW_DIR, entry.name));
    }
  }

  for (const [name, target] of wanted) {
    const linkRoot = path.join(RAW_DIR, name);
    try {
      const stat = fs.lstatSync(linkRoot);
      if (stat.isSymbolicLink()) {
        fs.unlinkSync(linkRoot); // replace a stale top-level symlink with a real mirror dir
      } else if (!stat.isDirectory()) {
        continue; // a real file already occupies this name
      }
    } catch {
      /* doesn't exist yet */
    }
    if (!fs.existsSync(target) || !fs.statSync(target).isDirectory()) continue;
    mirrorSource(linkRoot, target);
  }
}
