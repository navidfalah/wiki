import { describe, expect, it } from 'vitest';
import { langFromRequest, localizeMessage } from './localizeMessage';

describe('localizeMessage', () => {
  it('leaves English untouched', () => {
    expect(localizeMessage('Invalid path', 'en')).toBe('Invalid path');
  });

  it('translates exact German messages', () => {
    expect(localizeMessage('Password must be at least 8 characters', 'de')).toBe('Das Passwort muss mindestens 8 Zeichen lang sein');
  });

  it('translates parameterized messages, keeping the parameters', () => {
    expect(localizeMessage('Username already taken: alice', 'de')).toBe('Der Benutzername ist bereits vergeben: alice');
    expect(localizeMessage('Unsupported file type ".xyz" for a.xyz', 'de')).toBe('Nicht unterstützter Dateityp „.xyz“ für a.xyz');
  });

  it('falls back to the original text for unknown messages', () => {
    expect(localizeMessage('Something brand new', 'de')).toBe('Something brand new');
  });

  it('reads the language from X-Lang', () => {
    expect(langFromRequest({ headers: { 'x-lang': 'de' } } as any)).toBe('de');
    expect(langFromRequest({ headers: {} } as any)).toBe('en');
  });
});
