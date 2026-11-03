import fs from 'node:fs';
import path from 'node:path';
import type { Express } from 'express';
import multer from 'multer';
import { RAW_DIR } from '../paths';
import { HttpError, wrap } from '../lib/httpError';
import { logEvent } from '../lib/activityLog';
import { collectSourceMetadata, rawFileStatus, synthesizedPagesForTopics } from '../lib/docUtils';
import { createFolder, deleteFile, deleteFolder, discoverRawFolders, FolderError, moveFile, uploadFiles } from '../lib/rawFolders';
import { AUDIO_PREVIEW_EXTENSIONS, computeMd5, discoverRawSourceFiles, IMAGE_PREVIEW_EXTENSIONS, loadState, mimeTypeFor, rawFileSecurityHeaders, TEXT_PREVIEW_EXTENSIONS } from '../lib/rawFiles';
import { listSources } from '../lib/sourcesRegistry';
import { safePath } from './shared';
function sourceLabelFor(relPath: string, sources: { link_name: string; label: string }[]): string | null {
  const top = relPath.split('/')[0];
  return sources.find((s) => s.link_name === top)?.label ?? null;
}

function managedNames(): Set<string> {
  return new Set(listSources().map((s) => s.link_name));
}

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024, files: 20 } });

export function registerFileRoutes(app: Express): void {
  // --- Raw files + folders -------------------------------------------------

  app.get(
    '/api/raw-files',
    wrap((_req, res) => {
      const state = loadState();
      const sources = listSources();
      const files = discoverRawSourceFiles(RAW_DIR).map((filePath) => {
        const rel = path.relative(RAW_DIR, filePath).split(path.sep).join('/');
        const md5 = computeMd5(filePath);
        const status = rawFileStatus(rel, md5, state);
        const entry = state.files?.[rel] ?? {};
        return {
          path: rel,
          status,
          size_bytes: fs.statSync(filePath).size,
          md5,
          processed_at: entry.processed_at ?? null,
          chunk_count: (entry.chunks ?? []).length,
          source: sourceLabelFor(rel, sources),
        };
      });
      const processed = files.filter((f) => f.status === 'Processed').length;
      res.json({
        directory: RAW_DIR,
        total: files.length,
        processed,
        unprocessed: files.length - processed,
        files,
        folders: discoverRawFolders(RAW_DIR),
        managed_folders: sources.map((s) => s.link_name).sort(),
      });
    }),
  );

  app.get(
    '/api/raw-files/raw/*',
    wrap((req, res) => {
      const relPath = (req.params as any)[0] as string;
      const filePath = safePath(RAW_DIR, relPath);
      if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        throw new HttpError(404, `Raw file not found: ${relPath}`);
      }
      const mimeType = mimeTypeFor(filePath);
      res.setHeader('Content-Type', mimeType);
      for (const [name, value] of Object.entries(rawFileSecurityHeaders(mimeType))) res.setHeader(name, value);
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(path.basename(filePath))}"`);
      fs.createReadStream(filePath).pipe(res);
    }),
  );

  app.get(
    '/api/raw-files/*',
    wrap((req, res) => {
      const relPath = (req.params as any)[0] as string;
      const filePath = safePath(RAW_DIR, relPath);
      if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        throw new HttpError(404, `Raw file not found: ${relPath}`);
      }
      const rel = path.relative(RAW_DIR, filePath).split(path.sep).join('/');
      const ext = path.extname(filePath).toLowerCase();
      const isText = TEXT_PREVIEW_EXTENSIONS.has(ext);
      const isImage = IMAGE_PREVIEW_EXTENSIONS.has(ext);
      const isAudio = AUDIO_PREVIEW_EXTENSIONS.has(ext);
      const content = isText ? fs.readFileSync(filePath, 'utf-8') : null;
      const md5 = computeMd5(filePath);
      const state = loadState();
      const status = rawFileStatus(rel, md5, state);
      const stateEntry = state.files?.[rel] ?? {};
      const metadata = collectSourceMetadata(stateEntry);
      const synthesizedPages = synthesizedPagesForTopics(metadata.topics, metadata.entities, metadata.concepts);
      res.json({
        path: rel,
        status,
        content,
        is_text: isText,
        is_image: isImage,
        is_audio: isAudio,
        is_pdf: ext === '.pdf',
        mime: mimeTypeFor(filePath),
        raw_url: `/api/raw-files/raw/${rel.split('/').map(encodeURIComponent).join('/')}`,
        processed_at: stateEntry.processed_at ?? null,
        topics: metadata.topics,
        entities: metadata.entities,
        concepts: metadata.concepts,
        synthesized_pages: synthesizedPages,
      });
    }),
  );

  app.post(
    '/api/raw-files/upload',
    upload.array('files', 20),
    wrap((req, res) => {
      const parent = (req.body?.parent as string) ?? '';
      const files = ((req.files as Express.Multer.File[]) ?? []).map((f) => ({
        originalName: f.originalname,
        buffer: f.buffer,
      }));
      try {
        const saved = uploadFiles(RAW_DIR, parent, files, managedNames());
        logEvent(req.user?.username, `Uploaded ${saved.length} file${saved.length === 1 ? '' : 's'}`, saved.join(', '));
        res.json({ saved });
      } catch (err) {
        if (err instanceof FolderError) throw new HttpError(400, err.message);
        throw err;
      }
    }),
  );

  app.post(
    '/api/raw-files/folders',
    wrap((req, res) => {
      try {
        const relPath = createFolder(RAW_DIR, req.body?.parent ?? '', req.body?.name ?? '', managedNames());
        logEvent(req.user?.username, 'Created folder', relPath);
        res.json({ path: relPath });
      } catch (err) {
        if (err instanceof FolderError) throw new HttpError(400, err.message);
        throw err;
      }
    }),
  );

  app.delete(
    '/api/raw-files/folders/*',
    wrap((req, res) => {
      const folderPath = (req.params as any)[0] as string;
      try {
        deleteFolder(RAW_DIR, folderPath, managedNames());
        logEvent(req.user?.username, 'Deleted folder', folderPath);
        res.json({ removed: true, path: folderPath });
      } catch (err) {
        if (err instanceof FolderError) throw new HttpError(400, err.message);
        throw err;
      }
    }),
  );

  app.post(
    '/api/raw-files/move',
    wrap((req, res) => {
      try {
        const newPath = moveFile(RAW_DIR, req.body?.path ?? '', req.body?.destination ?? '', managedNames());
        logEvent(req.user?.username, 'Moved file', `${req.body?.path} → ${newPath}`);
        res.json({ path: newPath });
      } catch (err) {
        if (err instanceof FolderError) throw new HttpError(400, err.message);
        throw err;
      }
    }),
  );

  app.delete(
    '/api/raw-files/*',
    wrap((req, res) => {
      const relPath = (req.params as any)[0] as string;
      try {
        deleteFile(RAW_DIR, relPath, managedNames());
        logEvent(req.user?.username, 'Deleted file', relPath);
        res.json({ removed: true, path: relPath });
      } catch (err) {
        if (err instanceof FolderError) throw new HttpError(400, err.message);
        throw err;
      }
    }),
  );

}
