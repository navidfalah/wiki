/**
 * Scheduled backups. Every hour, if the newest scheduled backup is older
 * than BACKUP_INTERVAL_HOURS (default 24; 0 disables), take one and keep
 * only the newest BACKUP_KEEP (default 7) scheduled backups. Manual,
 * uploaded and pre-restore backups are never pruned automatically.
 */
import { logSystemEvent } from './activityLog';
import { createBackup, listBackups, pruneScheduled, type BackupRoots } from './backups';

const CHECK_EVERY_MS = 60 * 60 * 1000;

function envNumber(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

export function backupSchedule(): { interval_hours: number; keep: number } {
  return { interval_hours: envNumber('BACKUP_INTERVAL_HOURS', 24), keep: envNumber('BACKUP_KEEP', 7) };
}

/** Takes a scheduled backup if one is due. Exported for tests. */
export async function runScheduledBackupIfDue(roots: BackupRoots, now: Date = new Date()): Promise<string | null> {
  const { interval_hours: intervalHours, keep } = backupSchedule();
  if (intervalHours <= 0) return null;
  const newest = listBackups(roots).find((b) => /-scheduled(-\d+)?\.tar\.gz$/.test(b.name));
  if (newest && now.getTime() - Date.parse(newest.created_at) < intervalHours * 3600 * 1000) return null;
  const info = await createBackup(roots, 'scheduled', now);
  pruneScheduled(roots, Math.max(1, keep));
  return info.name;
}

export function startBackupScheduler(roots: BackupRoots): void {
  if (backupSchedule().interval_hours <= 0) return;
  const tick = () =>
    runScheduledBackupIfDue(roots)
      .then((name) => name && logSystemEvent('Scheduled backup created', name))
      .catch((err) => logSystemEvent('Scheduled backup failed', err.message, 'error'));
  setTimeout(tick, 60 * 1000).unref(); // first check a minute after boot, off the startup path
  setInterval(tick, CHECK_EVERY_MS).unref();
}
