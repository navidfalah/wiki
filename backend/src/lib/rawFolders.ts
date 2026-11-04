/** Typed route facade over the plain JavaScript raw folder operations. */
export interface UploadCandidate { originalName: string; buffer: Buffer }

interface Implementation {
  FolderError: new (message: string) => Error;
  discoverRawFolders(rawDir: string): string[];
  createFolder(rawDir: string, parent: string, name: string, managedNames: Set<string>): string;
  deleteFolder(rawDir: string, relPath: string, managedNames: Set<string>): void;
  uploadFiles(rawDir: string, parent: string, files: UploadCandidate[], managedNames: Set<string>): string[];
  deleteFile(rawDir: string, relPath: string, managedNames: Set<string>): void;
  moveFile(rawDir: string, sourceRel: string, destinationDirRel: string, managedNames: Set<string>): string;
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const implementation = require('../../../compiler/raw_folders.js') as Implementation;
export const FolderError = implementation.FolderError;
export const discoverRawFolders = implementation.discoverRawFolders;
export const createFolder = implementation.createFolder;
export const deleteFolder = implementation.deleteFolder;
export const uploadFiles = implementation.uploadFiles;
export const deleteFile = implementation.deleteFile;
export const moveFile = implementation.moveFile;
