/**
 * Port of compiler/raw_folders.py -- create/delete folders and move files
 * inside data/raw/, backing the file-explorer dashboard UI.
 *
 * Same safety rule as the Python original: every operand is checked for
 * symlink-ness and containment *before* being resolved (realpath), never
 * after -- resolving first would follow a symlink to whatever it points
 * at and silently operate on the real target instead of refusing.
 */
import fs from 'node:fs';
import path from 'node:path';
import { walkEntries } from './fsWalk';

export class FolderError extends Error {}

function topSegment(relPath: string): string {
  return relPath.split('/')[0];
}

function assertWithin(rawDir: string, candidate: string): void {
  const resolved = fs.existsSync(candidate) ? fs.realpathSync(candidate) : path.resolve(candidate);
  const rawResolved = fs.realpathSync(rawDir);
  if (resolved !== rawResolved && !resolved.startsWith(rawResolved + path.sep)) {
    throw new FolderError('Path escapes data/raw/');
  }
}

function checkNotManaged(relPath: string, managedNames: Set<string>): void {
  if (relPath && managedNames.has(topSegment(relPath))) {
    throw new FolderError(
      "This path belongs to a registered source folder -- edit files there directly, or in the Source folders panel.",
    );
  }
}

export function discoverRawFolders(rawDir: string): string[] {
  if (!fs.existsSync(rawDir)) return [];
  const folders: string[] = [];
  const walk = (dir: string) => {
    walkEntries(dir, (full, name, stat) => {
      if (!stat.isDirectory()) return;
      if (name.startsWith('.') || name === '_archive') return;
      folders.push(path.relative(rawDir, full).split(path.sep).join('/'));
      walk(full);
    });
  };
  walk(rawDir);
  return folders.sort();
}

export function createFolder(
  rawDir: string,
  parent: string,
  name: string,
  managedNames: Set<string>,
): string {
  name = (name || '').trim();
  if (!name) throw new FolderError('Folder name is required');
  if (name.includes('/') || name.includes('\\') || name === '.' || name === '..' || name.startsWith('.')) {
    throw new FolderError('Invalid folder name');
  }

  parent = (parent || '').trim().replace(/^\/+|\/+$/g, '');
  checkNotManaged(parent, managedNames);
  const parentDir = parent ? path.join(rawDir, parent) : rawDir;
  assertWithin(rawDir, parentDir);
  if (parent && !(fs.existsSync(parentDir) && fs.statSync(parentDir).isDirectory())) {
    throw new FolderError(`Parent folder not found: ${parent}`);
  }

  const relPath = parent ? `${parent}/${name}` : name;
  checkNotManaged(relPath, managedNames);
  const newDir = path.join(rawDir, relPath);
  assertWithin(rawDir, path.dirname(newDir));
  if (fs.existsSync(newDir)) throw new FolderError(`Already exists: ${relPath}`);

  fs.mkdirSync(newDir);
  return relPath;
}

export function deleteFolder(rawDir: string, relPath: string, managedNames: Set<string>): void {
  relPath = (relPath || '').trim().replace(/^\/+|\/+$/g, '');
  if (!relPath) throw new FolderError('Cannot delete data/raw/ itself');
  checkNotManaged(relPath, managedNames);
  const target = path.join(rawDir, relPath);
  assertWithin(rawDir, target);
  const stat = fs.existsSync(target) ? fs.lstatSync(target) : null;
  if (!stat || stat.isSymbolicLink() || !stat.isDirectory()) {
    throw new FolderError(`Folder not found: ${relPath}`);
  }
  if (fs.readdirSync(target).length > 0) throw new FolderError('Folder is not empty');
  fs.rmdirSync(target);
}

export function moveFile(
  rawDir: string,
  sourceRel: string,
  destinationDirRel: string,
  managedNames: Set<string>,
): string {
  sourceRel = (sourceRel || '').trim().replace(/^\/+|\/+$/g, '');
  destinationDirRel = (destinationDirRel || '').trim().replace(/^\/+|\/+$/g, '');
  if (!sourceRel) throw new FolderError('Source path is required');

  checkNotManaged(sourceRel, managedNames);
  checkNotManaged(destinationDirRel, managedNames);

  const source = path.join(rawDir, sourceRel);
  assertWithin(rawDir, path.dirname(source));
  const sourceStat = fs.existsSync(source) ? fs.lstatSync(source) : null;
  if (!sourceStat || sourceStat.isSymbolicLink() || !sourceStat.isFile()) {
    throw new FolderError(`Source file not found: ${sourceRel}`);
  }

  const destDir = destinationDirRel ? path.join(rawDir, destinationDirRel) : rawDir;
  assertWithin(rawDir, destDir);
  if (!(fs.existsSync(destDir) && fs.statSync(destDir).isDirectory())) {
    throw new FolderError(`Destination folder not found: ${destinationDirRel}`);
  }

  const baseName = path.basename(source);
  const destination = path.join(destDir, baseName);
  if (fs.existsSync(destination)) {
    throw new FolderError(`A file named ${baseName} already exists there`);
  }

  fs.renameSync(source, destination);
  return destinationDirRel ? `${destinationDirRel}/${baseName}` : baseName;
}
