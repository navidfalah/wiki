import { describe, expect, it } from 'vitest';
import { DEFAULT_POLICY, NER_AUGMENTED_POLICY, NER_CATEGORIES, STRICT_CATEGORIES, STRICT_POLICY, redactText } from './piiRedaction';

describe('JavaScript redaction', () => {
  it('redacts supported categories consistently and keeps names and emails by default', () => {
    const result = redactText('Mira mira@example.test: 123-45-6789, 123-45-6789, 192.168.1.1, 212-555-1234, 4111 1111 1111 1111.');
    expect(result.text).toContain('mira@example.test');
    expect(result.text).toContain('[SSN_1], [SSN_1]');
    expect(result.text).toContain('[IPV4_ADDRESS_1]');
    expect(result.text).toContain('[PHONE_NUMBER_1]');
    expect(result.text).toContain('[CREDIT_CARD_1]');
  });
  it('does not redact a card-shaped number that fails Luhn', () => {
    expect(redactText('4111 1111 1111 1112').text).toBe('4111 1111 1111 1112');
  });
  it('supports strict email redaction when explicitly selected', () => {
    expect(redactText('mira@example.test', ['email']).text).toBe('[EMAIL_1]');
    expect(redactText('mira@example.test', STRICT_POLICY).text).toBe('[EMAIL_1]');
  });
  it('supports an injected location recognizer only when that policy enables the category', () => {
    const recognizeAustin = (text: string): Array<[number, number, string, string]> => {
      const start = text.indexOf('Austin');
      return start < 0 ? [] : [[start, start + 6, 'location', 'Austin']];
    };
    expect(redactText('Team in Austin.', DEFAULT_POLICY, { nerBackend: recognizeAustin }).text).toContain('Austin');
    const result = redactText('Team in Austin, SSN 123-45-6789.', NER_AUGMENTED_POLICY, { nerBackend: recognizeAustin });
    expect(result.text).toContain('[LOCATION_1]');
    expect(result.text).toContain('[SSN_1]');
    expect(result.findings.map((finding: any) => finding.category)).toEqual(['location', 'ssn']);
    expect(NER_CATEGORIES).toEqual(['location']);
    expect(NER_CATEGORIES).not.toContain('person');
    expect(STRICT_CATEGORIES).not.toContain('location');
  });
});
