import React, { useEffect, useState } from 'react';
import useApiBase from '@site/src/utils/useApiBase';
import { DEFAULT_WIKI_API_URL } from '@site/src/utils/wikiApi';
import { PrimaryButton, SecondaryButton, IconButton } from '@site/src/components/ui/Button';
import { XIcon } from '@site/src/components/ui/Icons';

export default function SettingsPanel({ open, onClose }) {
  const [apiBase, setApiBase, isOverridden] = useApiBase();
  const [draft, setDraft] = useState(apiBase);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft(apiBase);
      setSaved(false);
    }
  }, [open, apiBase]);

  if (!open) return null;

  const handleSave = () => {
    setApiBase(draft);
    setSaved(true);
  };

  const handleReset = () => {
    setApiBase('');
    setDraft(DEFAULT_WIKI_API_URL);
    setSaved(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close settings"
        onClick={onClose}
        className="absolute inset-0 bg-gray-900/30 backdrop-blur-[1px]"
      />
      <div className="animate-fade-in relative flex h-full w-full max-w-sm flex-col bg-white shadow-panel">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">Settings</h2>
          <IconButton label="Close" onClick={onClose}>
            <XIcon size={18} />
          </IconButton>
        </div>

        <div className="flex-1 space-y-6 overflow-auto px-5 py-5">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Compiler API URL</h3>
            <p className="mt-1 text-xs text-gray-500">
              Where the Docusaurus UI reaches the FastAPI backend (<code>server.py</code>).
              Defaults to <code>{DEFAULT_WIKI_API_URL}</code>.
            </p>
            <input
              type="text"
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
                setSaved(false);
              }}
              placeholder={DEFAULT_WIKI_API_URL}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
            <div className="mt-2 flex items-center gap-2">
              <PrimaryButton onClick={handleSave} disabled={!draft.trim()}>
                Save
              </PrimaryButton>
              {isOverridden && (
                <SecondaryButton onClick={handleReset}>Reset to default</SecondaryButton>
              )}
              {saved && <span className="text-xs text-accent">Saved — reload to apply</span>}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5">
            <h3 className="text-sm font-medium text-gray-900">About sources</h3>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              Raw notes, emails, and files live under <code>data/raw/</code> on the compiler
              host. Use the <strong>Source folders</strong> panel on the Dashboard to link in
              additional folders from elsewhere on disk — nothing is copied, and each one can be
              toggled on or off without deleting it.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
