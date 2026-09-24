/**
 * Standard accessibility wiring for the app's hand-built modal overlays
 * (dashboard.ts's file preview, resources.ts's email view/edit) -- each
 * one built its own `.fixed inset-0` overlay with only a `✕` button, no
 * `role`/`aria-modal`, no focus management, and no Escape-to-close.
 *
 * Call this right after setting the modal's innerHTML (so the dialog's
 * own focusable content exists to find), passing the function that
 * actually hides/clears it. Returns a `close()` that does the same
 * cleanup plus removing the Escape listener and restoring focus -- wire
 * every close trigger inside the modal (the ✕ button, Cancel, a
 * successful save, ...) to the returned function instead of the raw one,
 * so all of them get the same cleanup.
 */
export function wireModalA11y(modal: HTMLElement, hide: () => void): () => void {
  const previouslyFocused = document.activeElement as HTMLElement | null;

  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');

  const focusable = modal.querySelector<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  );
  focusable?.focus();

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    }
  };
  document.addEventListener('keydown', handleKeydown);

  function close() {
    document.removeEventListener('keydown', handleKeydown);
    hide();
    previouslyFocused?.focus();
  }

  return close;
}
