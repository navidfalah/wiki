import type { Express } from 'express';
import { HttpError, wrap } from '../lib/httpError';
import { logEvent } from '../lib/activityLog';
import { listConnectorEvents, logConnectorEvent } from '../lib/connectorActivity';
import { connectors, googleConnector, externalConnectors } from '../lib/connectorService';

export function registerConnectorRoutes(app: Express): void {
  // --- External connectors -------------------------------------------------

  app.get(
    '/api/connectors',
    wrap(async (_req, res) => {
      res.json({ connectors: connectors.catalog() });
    }),
  );

  app.post(
    '/api/connectors/:id/oauth/start',
    wrap(async (req, res) => {
      try {
        const result = googleConnector.start(req.params.id);
        res.json(result);
      } catch (err: any) {
        if (err.errorType === 'not_configured') throw new HttpError(400, err.message);
        throw new HttpError(400, err.message);
      }
    }),
  );

  app.post(
    '/api/connectors/:id/oauth/callback',
    wrap(async (req, res) => {
      const { code, state, account_label: accountLabel } = req.body ?? {};
      try {
        const result = await googleConnector.complete(req.params.id, code, state, accountLabel);
        logEvent(req.user?.username, 'Connected external account', `${req.params.id} → ${accountLabel}`);
        res.json(result);
      } catch (err: any) {
        throw new HttpError(400, err.message);
      }
    }),
  );

  app.post(
    '/api/connectors/imap/connect',
    wrap(async (req, res) => {
      const { account_label: accountLabel, host, password, port, mailbox } = req.body ?? {};
      try {
        const result = connectors.connect('imap', { account_label: accountLabel, host, password, port, mailbox });
        logEvent(req.user?.username, 'Connected external account', `imap → ${accountLabel}`);
        res.json(result);
      } catch (err: any) {
        throw new HttpError(400, err.message);
      }
    }),
  );

  app.post(
    '/api/connectors/postgres/connect',
    wrap(async (req, res) => {
      const { account_label: accountLabel, host, password, port, dbname, user, schema } = req.body ?? {};
      const startedAt = Date.now();
      try {
        const result = connectors.connect('postgres', { account_label: accountLabel, host, password, port, dbname, user, schema });
        logEvent(req.user?.username, 'Connected external account', `postgres → ${accountLabel}`);
        logConnectorEvent({
          username: req.user?.username,
          connectorId: 'postgres',
          accountLabel: accountLabel ?? null,
          action: 'connect',
          detail: `Connected to ${dbname}@${host}:${port ?? 5432}`,
          success: true,
          durationMs: Date.now() - startedAt,
        });
        res.json(result);
      } catch (err: any) {
        logConnectorEvent({
          username: req.user?.username,
          connectorId: 'postgres',
          accountLabel: accountLabel ?? null,
          action: 'connect',
          detail: `Failed to connect to ${dbname}@${host}:${port ?? 5432}`,
          success: false,
          durationMs: Date.now() - startedAt,
          error: err.message,
        });
        throw new HttpError(400, err.message);
      }
    }),
  );

  app.post(
    '/api/connectors/sqlite/connect',
    wrap(async (req, res) => {
      const { account_label: accountLabel, db_path: dbPath } = req.body ?? {};
      const startedAt = Date.now();
      try {
        const result = connectors.connect('sqlite', { account_label: accountLabel, db_path: dbPath });
        logEvent(req.user?.username, 'Connected external account', `sqlite → ${accountLabel}`);
        logConnectorEvent({
          username: req.user?.username,
          connectorId: 'sqlite',
          accountLabel: accountLabel ?? null,
          action: 'connect',
          detail: `Connected to ${dbPath}`,
          success: true,
          durationMs: Date.now() - startedAt,
        });
        res.json(result);
      } catch (err: any) {
        logConnectorEvent({
          username: req.user?.username,
          connectorId: 'sqlite',
          accountLabel: accountLabel ?? null,
          action: 'connect',
          detail: `Failed to connect to ${dbPath}`,
          success: false,
          durationMs: Date.now() - startedAt,
          error: err.message,
        });
        throw new HttpError(400, err.message);
      }
    }),
  );

  app.post(
    '/api/connectors/:id/items',
    wrap(async (req, res) => {
      const { account_label: accountLabel, query, limit } = req.body ?? {};
      const startedAt = Date.now();
      try {
        const result = { items: await externalConnectors.list(req.params.id, accountLabel, query, limit) };
        const count = Array.isArray(result?.items) ? result.items.length : undefined;
        logConnectorEvent({
          username: req.user?.username,
          connectorId: req.params.id,
          accountLabel: accountLabel ?? null,
          action: 'browse',
          detail: count !== undefined ? `Listed ${count} table(s)${query ? ` matching "${query}"` : ''}` : 'Listed tables',
          success: true,
          durationMs: Date.now() - startedAt,
        });
        res.json(result);
      } catch (err: any) {
        logConnectorEvent({
          username: req.user?.username,
          connectorId: req.params.id,
          accountLabel: accountLabel ?? null,
          action: 'browse',
          detail: 'Failed to list tables',
          success: false,
          durationMs: Date.now() - startedAt,
          error: err.message,
        });
        if (err.errorType === 'not_connected') throw new HttpError(409, err.message);
        if (err.errorType === 'not_configured') throw new HttpError(400, err.message);
        throw new HttpError(400, err.message);
      }
    }),
  );

  app.post(
    '/api/connectors/:id/items/import',
    wrap(async (req, res) => {
      const { account_label: accountLabel, item_id: itemId, item_title: itemTitle } = req.body ?? {};
      const startedAt = Date.now();
      try {
        const result = await externalConnectors.importItem(req.params.id, accountLabel, itemId, itemTitle);
        logEvent(req.user?.username, 'Imported item from connector', `${req.params.id} → ${result.raw_path}`);
        logConnectorEvent({
          username: req.user?.username,
          connectorId: req.params.id,
          accountLabel: accountLabel ?? null,
          action: 'import',
          detail: `Imported ${itemTitle ?? itemId} → ${result.raw_path}`,
          success: true,
          durationMs: Date.now() - startedAt,
        });
        res.json(result);
      } catch (err: any) {
        logConnectorEvent({
          username: req.user?.username,
          connectorId: req.params.id,
          accountLabel: accountLabel ?? null,
          action: 'import',
          detail: `Failed to import ${itemTitle ?? itemId}`,
          success: false,
          durationMs: Date.now() - startedAt,
          error: err.message,
        });
        if (err.errorType === 'not_connected') throw new HttpError(409, err.message);
        throw new HttpError(400, err.message);
      }
    }),
  );

  app.delete(
    '/api/connectors/:id/accounts/:accountLabel',
    wrap(async (req, res) => {
      const result = connectors.disconnect(req.params.id, req.params.accountLabel);
      logEvent(req.user?.username, 'Disconnected external account', `${req.params.id} → ${req.params.accountLabel}`);
      logConnectorEvent({
        username: req.user?.username,
        connectorId: req.params.id,
        accountLabel: req.params.accountLabel,
        action: 'disconnect',
        detail: `Disconnected ${req.params.accountLabel}`,
        success: true,
      });
      res.json(result);
    }),
  );

  app.get(
    '/api/connectors/:id/activity',
    wrap((req, res) => {
      res.json({ events: listConnectorEvents(req.params.id) });
    }),
  );

}
