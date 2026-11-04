import { createApp } from './app';
import { reconcileOrphanedPipelineRuns } from './lib/pipelineRuns';
import { ensureDefaultConnections } from './lib/defaultConnectors';
import { logSystemEvent } from './lib/activityLog';
import { startBackupScheduler } from './lib/backupScheduler';
import { BACKUPS_DIR, DATA_ROOT } from './paths';
import path from 'node:path';

const app = createApp();
const PORT = Number(process.env.PORT ?? 8000);

const reconciled = reconcileOrphanedPipelineRuns();
if (reconciled.length) {
  // eslint-disable-next-line no-console
  console.log(`Marked ${reconciled.length} orphaned pipeline run(s) as failed: ${reconciled.join(', ')}`);
  logSystemEvent(
    `Recovered ${reconciled.length} interrupted pipeline run(s)`,
    reconciled.join(', '),
    'warn',
  );
}

// Fire-and-forget: doesn't block startup, and a missing CONNECTOR_SECRET_KEY
// (or any other failure) just means the /database page falls back to its
// normal empty state -- logged here rather than surfaced to a user who
// didn't take any action to trigger it.
// SKIP_DEFAULT_CONNECTIONS=true (set in docker-compose.prod.yml) skips this
// entirely: a production install has no sample Postgres to point at, and it
// avoids creating sample data on production installations.
if (process.env.SKIP_DEFAULT_CONNECTIONS === 'true') {
  // eslint-disable-next-line no-console
  console.log('Skipped default sample connections (SKIP_DEFAULT_CONNECTIONS=true)');
} else {
  ensureDefaultConnections({ dataDir: path.join(DATA_ROOT, 'data') })
    .then(({ connected }: { connected: string[] }) => {
      if (connected.length) {
        // eslint-disable-next-line no-console
        console.log(`Connected default sample account(s): ${connected.join(', ')}`);
        logSystemEvent('Connected default sample account(s)', connected.join(', '));
      }
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.log(`Skipped default sample connections: ${err.message}`);
      logSystemEvent('Skipped default sample connections', err.message, 'warn');
    });
}

startBackupScheduler({ projectRoot: DATA_ROOT, backupsDir: BACKUPS_DIR });

logSystemEvent('Backend started', `pid ${process.pid}, port ${PORT}`);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`wiki-backend listening on http://localhost:${PORT}`);
});
