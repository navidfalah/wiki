import fs from 'node:fs';
import path from 'node:path';
import type { Express } from 'express';
import multer from 'multer';
import { BACKUPS_DIR, DATA_ROOT } from '../paths';
import { HttpError, wrap } from '../lib/httpError';
import { logEvent } from '../lib/activityLog';
import { requireAdmin } from '../lib/authMiddleware';
import { isBuildRunning } from '../lib/buildService';
import { BackupError, backupPath, createBackup, deleteBackup, listBackups, restoreBackup, validateArchive } from '../lib/backups';
import { backupSchedule } from '../lib/backupScheduler';
import { syncSymlinks } from '../lib/sourcesRegistry';

export function registerBackupRoutes(app: Express): void {
  // --- Backups (admin only; see lib/backups.ts) ------------------------------

  const backupRoots = { projectRoot: DATA_ROOT, backupsDir: BACKUPS_DIR };
  const backupUpload = multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => {
        fs.mkdirSync(BACKUPS_DIR, { recursive: true });
        cb(null, BACKUPS_DIR);
      },
      filename: (_req, _file, cb) => cb(null, `upload-${Date.now()}.partial`),
    }),
    limits: { fileSize: Number(process.env.BACKUP_MAX_UPLOAD_MB || 1024) * 1024 * 1024, files: 1 },
  });

  function backupError(err: unknown): never {
    if (err instanceof BackupError) throw new HttpError(/not found/i.test(err.message) ? 404 : 400, err.message);
    throw err;
  }

  app.get(
    '/api/admin/backups',
    requireAdmin,
    wrap((_req, res) => {
      res.json({ backups: listBackups(backupRoots), schedule: backupSchedule() });
    }),
  );

  app.post(
    '/api/admin/backups',
    requireAdmin,
    wrap(async (req, res) => {
      const info = await createBackup(backupRoots, 'manual').catch(backupError);
      logEvent(req.user?.username, 'Created backup', info.name);
      res.status(201).json(info);
    }),
  );

  app.post(
    '/api/admin/backups/upload',
    requireAdmin,
    backupUpload.single('file'),
    wrap(async (req, res) => {
      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file) throw new HttpError(400, 'file is required');
      try {
        await validateArchive(file.path);
      } catch (err) {
        fs.rmSync(file.path, { force: true });
        backupError(err);
      }
      const name = `wissensbau-${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')}-uploaded.tar.gz`;
      fs.renameSync(file.path, path.join(BACKUPS_DIR, name));
      logEvent(req.user?.username, 'Uploaded backup', name);
      res.status(201).json(listBackups(backupRoots).find((b) => b.name === name));
    }),
  );

  app.get(
    '/api/admin/backups/:name',
    requireAdmin,
    wrap((req, res) => {
      let file: string;
      try {
        file = backupPath(backupRoots, req.params.name);
      } catch (err) {
        backupError(err);
      }
      res.download(file!, req.params.name);
    }),
  );

  app.delete(
    '/api/admin/backups/:name',
    requireAdmin,
    wrap((req, res) => {
      try {
        deleteBackup(backupRoots, req.params.name);
      } catch (err) {
        backupError(err);
      }
      logEvent(req.user?.username, 'Deleted backup', req.params.name);
      res.json({ deleted: req.params.name });
    }),
  );

  app.post(
    '/api/admin/backups/:name/restore',
    requireAdmin,
    wrap(async (req, res) => {
      if (isBuildRunning()) throw new HttpError(409, 'A compile is running -- restore after it finishes.');
      let archive: string;
      try {
        archive = backupPath(backupRoots, req.params.name);
      } catch (err) {
        backupError(err);
      }
      const result = await restoreBackup(backupRoots, archive!).catch(backupError);
      syncSymlinks();
      logEvent(req.user?.username, 'Restored backup', `${req.params.name} (safety copy: ${result.safetyBackup})`);
      res.json({ restored: req.params.name, ...result });
    }),
  );

}
