/** Shared DOM helpers -- previously copy-pasted independently into every
 * client page. */

export function el(id: string): HTMLElement {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Missing #${id}`);
  return found;
}

export function escapeHtml(text: string | null | undefined): string {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}
