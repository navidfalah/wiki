import type { connectorsCallback as en } from '../en/connectors-callback';

export const connectorsCallback: Record<keyof typeof en, string> = {
  'connectors-callback.pageTitle': 'Verbindung abschließen',
  'connectors-callback.title': '{name} fertig verbinden',
  'connectors-callback.intro': 'Der Anbieter hat Sie mit einem Autorisierungscode hierher zurückgeleitet. Vergeben Sie eine Bezeichnung für dieses Konto (meist die E-Mail-Adresse), damit es unter einem wiedererkennbaren Namen gespeichert wird, und schließen Sie dann ab.',
  'connectors-callback.label': 'Kontobezeichnung',
  'connectors-callback.submit': 'Verbindung abschließen',
  'connectors-callback.errProvider': 'Der Anbieter hat einen Fehler gemeldet: {error}',
  'connectors-callback.errMissing': 'Im Callback-Link fehlen code/state – versuchen Sie die Verbindung erneut über den Tab „Konnektoren“ der Seite „Ressourcen“.',
  'connectors-callback.connected': '{label} verbunden.',
  'connectors-callback.failed': 'Verbindung konnte nicht abgeschlossen werden.',
};
