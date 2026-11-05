import { describe, expect, it } from 'vitest';
import { parseEmail, renderEmail } from './emailIngest';

describe('JavaScript email ingestion', () => {
  it('preserves message headers, body and attachments', async () => {
    const source = [
      'From: Alex Example <alex@example.org>',
      'To: Research Team <team@example.org>',
      'Cc: Reviewer <reviewer@example.org>',
      'Subject: Battery report',
      'Date: Tue, 02 Jun 2026 10:00:00 +0000',
      'MIME-Version: 1.0',
      'Content-Type: multipart/mixed; boundary="part"',
      '', '--part', 'Content-Type: text/plain; charset=utf-8', 'Content-Transfer-Encoding: 7bit', '', 'Capacity fell to 82%.',
      '--part', 'Content-Type: text/plain; name="report.txt"', 'Content-Disposition: attachment; filename="report.txt"', 'Content-Transfer-Encoding: base64', '', 'Q2FwYWNpdHk=', '--part--', '',
    ].join('\r\n');
    const parsed = await parseEmail(Buffer.from(source));
    expect(parsed.cc).toContain('reviewer@example.org');
    expect(parsed.body).toContain('Capacity fell to 82%.');
    expect(parsed.attachments[0].filename).toBe('report.txt');
    expect(parsed.attachments[0].content.toString()).toBe('Capacity');
    const text = renderEmail(parsed, ['- [report.txt](../static/media/report.txt)']);
    expect(text).toContain('Cc:');
    expect(text).toContain('**Attachments:**');
  });

  it('renders safe fallbacks for incomplete email headers and body', () => {
    expect(renderEmail({ subject: '', from: '', to: '', cc: '', date: '', body: '' })).toContain('(empty body)');
  });
});
