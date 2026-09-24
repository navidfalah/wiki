/**
 * Localizes the backend's user-facing error messages. The frontend proxy
 * forwards the visitor's UI language as `X-Lang`; the global error handler
 * (index.ts) runs every error `detail` through localizeMessage() so every
 * page's toast/inline error is in the language the UI is in, without each
 * route having to know about languages.
 *
 * English is the source text (and the fallback for anything not listed) --
 * only the German side needs a table. Add a row here whenever a new
 * user-facing HttpError/UserError message is introduced.
 */
import type { Request } from 'express';

export type Lang = 'en' | 'de';

export function langFromRequest(req: Pick<Request, 'headers'>): Lang {
  return String(req.headers['x-lang'] ?? '').toLowerCase().startsWith('de') ? 'de' : 'en';
}

const DE_EXACT: Record<string, string> = {
  "'connections' must be a list": "'connections' muss eine Liste sein",
  "'corpus_source' must be 'wiki' or 'raw'": "'corpus_source' muss 'wiki' oder 'raw' sein",
  "'enabled' is required": "'enabled' ist erforderlich",
  "'keep' must be a non-negative integer": "'keep' muss eine nicht-negative ganze Zahl sein",
  "'llm_profile_id' must be a string or null": "'llm_profile_id' muss eine Zeichenkette oder null sein",
  "'resource_scope' must be a list or null": "'resource_scope' muss eine Liste oder null sein",
  "'role' must be 'admin' or 'user'": "'role' muss 'admin' oder 'user' sein",
  "Provide 'role' and/or 'password'": "Geben Sie 'role' und/oder 'password' an",
  'Cannot add a folder that contains data/raw/ as a source': 'Ein Ordner, der data/raw/ enthält, kann nicht als Quelle hinzugefügt werden',
  'Cannot add data/raw/ (or a folder inside it) as a source': 'data/raw/ (oder ein Ordner darin) kann nicht als Quelle hinzugefügt werden',
  'Cannot delete data/raw/ itself': 'data/raw/ selbst kann nicht gelöscht werden',
  'Cannot delete the last admin account': 'Das letzte Admin-Konto kann nicht gelöscht werden',
  'Cannot demote the last admin account': 'Das letzte Admin-Konto kann nicht herabgestuft werden',
  'File path is required': 'Ein Dateipfad ist erforderlich',
  'Folder is not empty': 'Der Ordner ist nicht leer',
  'Folder name is required': 'Ein Ordnername ist erforderlich',
  'Invalid folder name': 'Ungültiger Ordnername',
  'Invalid path': 'Ungültiger Pfad',
  'Invalid username or password': 'Benutzername oder Passwort ist falsch',
  'No files provided': 'Es wurden keine Dateien übergeben',
  'Password must be at least 8 characters': 'Das Passwort muss mindestens 8 Zeichen lang sein',
  'Path escapes data/raw/': 'Der Pfad verlässt data/raw/',
  'Path is required': 'Ein Pfad ist erforderlich',
  'Preset not found': 'Voreinstellung nicht gefunden',
  'Source path is required': 'Ein Quellpfad ist erforderlich',
  'This folder is already registered': 'Dieser Ordner ist bereits registriert',
  'User not found': 'Nutzer nicht gefunden',
  'Username and password are required': 'Benutzername und Passwort sind erforderlich',
  'Username is required': 'Ein Benutzername ist erforderlich',
  'You cannot delete your own account': 'Sie können Ihr eigenes Konto nicht löschen',
  'body (string) is required': 'body (Zeichenkette) ist erforderlich',
  'index.json has no topics. Run the compiler pipeline first.': 'index.json enthält keine Themen. Führen Sie zuerst die Compiler-Pipeline aus.',
  'Not authenticated': 'Nicht angemeldet',
  'Admin access required': 'Administratorrechte erforderlich',
  'Internal server error': 'Interner Serverfehler',
};

// [pattern, German template]; $1, $2 … refer to capture groups.
const DE_PATTERNS: Array<[RegExp, string]> = [
  [/^A file named (.+) already exists there$/, 'Dort existiert bereits eine Datei namens $1'],
  [/^Already exists: (.+)$/, 'Existiert bereits: $1'],
  [/^Chat session not found or 'keep' out of range: (.+)$/, "Chat-Sitzung nicht gefunden oder 'keep' außerhalb des Bereichs: $1"],
  [/^Chat session not found: (.+)$/, 'Chat-Sitzung nicht gefunden: $1'],
  [/^Destination folder not found: (.+)$/, 'Zielordner nicht gefunden: $1'],
  [/^Doc not found: (.+)$/, 'Dokument nicht gefunden: $1'],
  [/^Docs directory not found: (.+)$/, 'Dokumentenverzeichnis nicht gefunden: $1'],
  [/^File not found: (.+)$/, 'Datei nicht gefunden: $1'],
  [/^Folder not found: (.+)$/, 'Ordner nicht gefunden: $1'],
  [/^Invalid file name: (.+)$/, 'Ungültiger Dateiname: $1'],
  [/^Invalid state\.json: (.+)$/, 'Ungültige state.json: $1'],
  [/^Not a directory: (.+)$/, 'Kein Verzeichnis: $1'],
  [/^Parent folder not found: (.+)$/, 'Übergeordneter Ordner nicht gefunden: $1'],
  [/^Pipeline run not found: (.+)$/, 'Pipeline-Lauf nicht gefunden: $1'],
  [/^Raw file not found: (.+)$/, 'Rohdatei nicht gefunden: $1'],
  [/^Resource not found: (.+)$/, 'Ressource nicht gefunden: $1'],
  [/^Source file not found: (.+)$/, 'Quelldatei nicht gefunden: $1'],
  [/^Source not found: (.+)$/, 'Quelle nicht gefunden: $1'],
  [/^Tag not found: (.+)$/, 'Tag nicht gefunden: $1'],
  [/^Unknown LLM profile: (.+)$/, 'Unbekanntes LLM-Profil: $1'],
  [/^Unsupported file type "(.*)" for (.+)$/, 'Nicht unterstützter Dateityp „$1“ für $2'],
  [/^User not found: (.+)$/, 'Nutzer nicht gefunden: $1'],
  [/^Username already taken: (.+)$/, 'Der Benutzername ist bereits vergeben: $1'],
  [/^Too many failed sign-in attempts\. Try again in (\d+) min\.$/, 'Zu viele fehlgeschlagene Anmeldeversuche. Bitte in $1 Min. erneut versuchen.'],
];

export function localizeMessage(message: string, lang: Lang): string {
  if (lang !== 'de' || !message) return message;
  const exact = DE_EXACT[message];
  if (exact) return exact;
  for (const [pattern, template] of DE_PATTERNS) {
    const match = message.match(pattern);
    if (match) return template.replace(/\$(\d)/g, (_, i) => match[Number(i)] ?? '');
  }
  return message;
}
