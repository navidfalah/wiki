/**
 * A copy-to-clipboard button usable anywhere a block of log/traceback text
 * is rendered -- Dashboard/Pipelines step errors, Pipelines run-level
 * errors, Logs rows. One delegated document-level click listener (wired
 * once via initCopyButtons(), safe to call from every page that uses this)
 * handles every `.copy-btn` regardless of which page rendered it.
 *
 * Usage: wrap the text to copy and the button in a `.copy-wrap` container,
 * mark the text node `.copy-source`, and drop copyButtonHtml() in beside
 * it -- the button reads its sibling's textContent at click time rather
 * than duplicating the text into a data-attribute (simpler, and no
 * attribute-escaping/size concerns for a multi-KB traceback):
 *
 *   <div class="copy-wrap ...">
 *     <pre class="copy-source">...</pre>
 *     ${copyButtonHtml()}
 *   </div>
 */

const COPY_ICON =
  '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
const CHECK_ICON =
  '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';

export function copyButtonHtml(extraClass = ''): string {
  return `<button type="button" class="copy-btn inline-flex shrink-0 items-center justify-center rounded p-1 text-current opacity-60 hover:opacity-100 ${extraClass}" title="Copy to clipboard" aria-label="Copy to clipboard">${COPY_ICON}</button>`;
}

let wired = false;

/** Safe to call from every page that uses copyButtonHtml() -- the second
 * and later calls are no-ops, so each client script can just call this at
 * load time without coordinating with any other page's script. */
export function initCopyButtons(): void {
  if (wired) return;
  wired = true;
  document.addEventListener('click', (event) => {
    const btn = (event.target as HTMLElement).closest<HTMLElement>('.copy-btn');
    if (!btn) return;
    const source = btn.closest('.copy-wrap')?.querySelector<HTMLElement>('.copy-source');
    const text = source?.textContent ?? '';
    if (!text) return;
    navigator.clipboard
      ?.writeText(text)
      .then(() => {
        const original = btn.innerHTML;
        btn.innerHTML = CHECK_ICON;
        setTimeout(() => {
          btn.innerHTML = original;
        }, 1200);
      })
      .catch(() => {
        (window as any).showToast?.('Could not copy to clipboard.', 'error');
      });
  });
}
