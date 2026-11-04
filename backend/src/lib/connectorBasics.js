'use strict';
const { createCredentialStore } = require('./connectorCredentials');

const names = { gmail: 'Gmail', google_drive: 'Google Drive', imap: 'Email (IMAP)', postgres: 'PostgreSQL Database', sqlite: 'SQLite Database' };
const oauthEnv = { gmail: ['GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET', 'GMAIL_REDIRECT_URI'], google_drive: ['GDRIVE_CLIENT_ID', 'GDRIVE_CLIENT_SECRET', 'GDRIVE_REDIRECT_URI'] };

function createConnectorBasics(directory, env = process.env) {
  const store = () => createCredentialStore(directory, env.CONNECTOR_SECRET_KEY);
  function catalog() {
    return Object.entries(names).map(([id, display_name]) => ({ id, display_name, requires_oauth: !!oauthEnv[id], configured: oauthEnv[id] ? oauthEnv[id].every((name) => !!env[name]) : true, secret_key_set: !!env.CONNECTOR_SECRET_KEY, connected_accounts: env.CONNECTOR_SECRET_KEY ? store().list(id) : [] }));
  }
  function connect(id, params) {
    if (!['imap', 'postgres', 'sqlite'].includes(id)) throw new Error('Unknown connector');
    const required = id === 'imap' ? ['account_label', 'host', 'password'] : id === 'postgres' ? ['account_label', 'host', 'password', 'dbname', 'user'] : ['account_label', 'db_path'];
    required.forEach((name) => { if (!params[name] || typeof params[name] !== 'string') throw new Error(`'${name}' is required`); });
    const extra = id === 'imap' ? { host: params.host, port: params.port ?? 993, mailbox: params.mailbox || 'INBOX' } : id === 'postgres' ? { host: params.host, port: params.port ?? 5432, dbname: params.dbname, user: params.user, schema: params.schema || 'public' } : { db_path: params.db_path };
    store().save({ connector_id: id, account_label: params.account_label, access_token: null, refresh_token: null, password: params.password || null, expires_at: null, extra });
    return { connected: true, connector_id: id, account_label: params.account_label };
  }
  function disconnect(id, label) { return { disconnected: store().remove(id, label), connector_id: id, account_label: label }; }
  return { catalog, connect, disconnect };
}
module.exports = { createConnectorBasics };
