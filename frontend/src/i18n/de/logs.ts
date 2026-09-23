import type { logs as en } from '../en/logs';

export const logs: Record<keyof typeof en, string> = {
  'logs.title': 'Protokolle',
  'logs.intro': 'Nutzeraktionen (Dateien, Ordner, Quellen, Einstellungen, Compiler) und Systemereignisse (Start, Absturzwiederherstellung, fehlgeschlagene Anmeldungen, unbehandelte Fehler) in einer Zeitleiste. Reines Lesen (eine Datei ansehen, dem Chat eine Frage stellen) wird hier weiterhin nicht protokolliert – dies ist ein Änderungsprotokoll mit auffälligen Ereignissen, kein vollständiges Anfrageprotokoll.',
  'logs.levelAll': 'Alle Stufen',
  'logs.categoryAll': 'Alle Kategorien',
  'logs.searchPlaceholder': 'Nutzer, Aktion, Details suchen …',
  'logs.autoRefresh': 'Automatisch aktualisieren',
  'logs.th.when': 'Zeitpunkt',
  'logs.th.level': 'Stufe',
  'logs.th.category': 'Kategorie',
  'logs.th.user': 'Nutzer',
  'logs.th.action': 'Aktion',
  'logs.th.detail': 'Details',
  'logs.th.copy': 'Kopieren',
  'logs.count_one': '{count} Ereignis',
  'logs.count_other': '{count} Ereignisse',
  'logs.countOf_one': '{shown} von {count} Ereignis',
  'logs.countOf_other': '{shown} von {count} Ereignissen',
  'logs.noMatch': 'Keine Ereignisse passen zu diesen Filtern.',
  'logs.empty': 'Noch keine Aktivität aufgezeichnet.',
};
