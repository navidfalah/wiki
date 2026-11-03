import { describe, expect, it } from 'vitest';
import { mimeTypeFor, rawFileSecurityHeaders } from './rawFiles';

describe('rawFileSecurityHeaders', () => {
  it.each(['page.html', 'page.htm', 'feed.xml'])('sandboxes active content (%s)', (name) => {
    const headers = rawFileSecurityHeaders(mimeTypeFor(name));
    expect(headers['Content-Security-Policy']).toMatch(/^sandbox;/);
    expect(headers['Content-Security-Policy']).toContain("default-src 'none'");
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
  });

  it('sandboxes SVG even though it is an image type', () => {
    expect(rawFileSecurityHeaders('image/svg+xml')['Content-Security-Policy']).toMatch(/^sandbox;/);
  });

  it.each(['notes.txt', 'report.pdf', 'photo.png', 'clip.mp3', 'unknown.bin'])('does not sandbox passive content (%s)', (name) => {
    const headers = rawFileSecurityHeaders(mimeTypeFor(name));
    expect(headers['Content-Security-Policy']).toBeUndefined();
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
  });
});
