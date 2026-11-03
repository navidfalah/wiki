/** Shared DOM helpers -- previously copy-pasted independently into every
 * client page. */

export function el(id: string): HTMLElement {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Missing #${id}`);
  return found;
}

/**
 * Escape for HTML text *and* attribute values. The old textContent/innerHTML
 * trick left quotes alone, so a raw file named `x" style="...` broke out of
 * the 50-odd `attr="${escapeHtml(...)}"` sites in the client scripts.
 */
export function escapeHtml(text: string | null | undefined): string {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
