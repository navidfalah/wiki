import type { login as en } from '../en/login';

export const login: Record<keyof typeof en, string> = {
  'login.title': 'Anmelden',
  'login.subtitle': 'Melden Sie sich an, um fortzufahren.',
  'login.username': 'Benutzername oder E-Mail',
  'login.password': 'Passwort',
  'login.submit': 'Anmelden',
  'login.back': '← Zurück zu wissensbau.de',
  'login.errorInvalid': 'Benutzername oder Passwort ist falsch.',
  'login.errorUnreachable': 'Die API ist gerade nicht erreichbar. Bitte versuchen Sie es gleich noch einmal.',
  'login.errorThrottled_one': 'Zu viele fehlgeschlagene Anmeldeversuche. Bitte in {count} Minute erneut versuchen.',
  'login.errorThrottled_other': 'Zu viele fehlgeschlagene Anmeldeversuche. Bitte in {count} Minuten erneut versuchen.',
  'login.defaultHint.intro': 'Standard-Zugang:',
  'login.defaultHint.setEnvHtml': 'Setzen Sie <code class="rounded bg-white px-1 py-0.5">ADMIN_USERNAME</code>/<code class="rounded bg-white px-1 py-0.5">ADMIN_PASSWORD</code> vor dem ersten Start, um eigene Zugangsdaten zu wählen, oder ändern Sie sie nach der Anmeldung im Admin-Bereich.',
  'login.defaultHint.fill': 'Standard-Zugang eintragen',
};
