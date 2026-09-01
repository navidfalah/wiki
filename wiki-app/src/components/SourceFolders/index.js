import React, { useCallback, useEffect, useState } from 'react';
import clsx from 'clsx';
import useApiBase from '@site/src/utils/useApiBase';
import { addSource, fetchSources, removeSource, setSourceEnabled } from '@site/src/utils/wikiApi';
import { PrimaryButton, SecondaryButton, Switch, IconButton } from '@site/src/components/ui/Button';
import { FolderIcon, FolderPlusIcon, TrashIcon, XIcon } from '@site/src/components/ui/Icons';

function AddFolderForm({ onAdd, onCancel, busy, formError }) {
  const [path, setPath] = useState('');
  const [label, setLabel] = useState('');

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onAdd(path, label);
      }}
      className="animate-fade-in rounded-xl border border-dashed border-source-border bg-source-bg/60 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-medium text-gray-600">
          Folder path on disk
          <input
            autoFocus
            type="text"
            value={path}
            onChange={(event) => setPath(event.target.value)}
            placeholder="/home/user/Documents/exports"
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-source focus:outline-none focus:ring-2 focus:ring-source/20"
          />
        </label>
        <label className="text-xs font-medium text-gray-600">
          Display name (optional)
          <input
            type="text"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="Work emails"
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-source focus:outline-none focus:ring-2 focus:ring-source/20"
          />
        </label>
      </div>
      {formError && <p className="mt-2 text-xs text-red-600">{formError}</p>}
      <p className="mt-2 text-xs text-gray-500">
        Must be a folder the compiler API's host can already see (a mounted path inside the
        container, if running under Docker). Files aren't copied — the folder is linked in place.
      </p>
      <div className="mt-3 flex gap-2">
        <PrimaryButton type="submit" disabled={busy || !path.trim()} className="bg-source hover:bg-source-light">
          {busy ? 'Adding…' : 'Add folder'}
        </PrimaryButton>
        <SecondaryButton type="button" onClick={onCancel} disabled={busy}>
          Cancel
        </SecondaryButton>
      </div>
    </form>
  );
}

function FolderCard({ source, onToggle, onRemove, busy }) {
  const disabled = !source.enabled;
  return (
    <div
      className={clsx(
        'group relative flex flex-col gap-2 rounded-xl border bg-white p-4 shadow-card transition-all hover:shadow-card-hover',
        disabled ? 'border-gray-200 opacity-60' : 'border-source-border',
      )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={clsx(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
              disabled ? 'bg-gray-100 text-gray-400' : 'bg-source-bg text-source',
            )}>
            <FolderIcon size={20} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-900">{source.label}</p>
            <p className="truncate font-mono text-xs text-gray-400" title={source.path}>
              {source.path}
            </p>
          </div>
        </div>
        <IconButton
          label="Remove source"
          onClick={() => onRemove(source.id)}
          disabled={busy}
          className="opacity-0 group-hover:opacity-100 hover:!bg-red-50 hover:!text-red-600">
          <TrashIcon size={16} />
        </IconButton>
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-gray-500">
          {source.exists ? (
            <>{source.file_count} file{source.file_count === 1 ? '' : 's'}</>
          ) : (
            <span className="text-red-500">folder not found</span>
          )}
        </span>
        <Switch
          checked={source.enabled}
          onChange={(next) => onToggle(source.id, next)}
          disabled={busy}
          label={source.enabled ? 'Included in compile' : 'Excluded from compile'}
        />
      </div>
    </div>
  );
}

export default function SourceFolders({ refreshToken = 0, onChanged }) {
  const [apiBase] = useApiBase();
  const [rawDir, setRawDir] = useState(null);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchSources(apiBase);
      setSources(data.sources ?? []);
      setRawDir(data.raw_dir ?? null);
      setError(null);
    } catch {
      setError(`Cannot reach API at ${apiBase}.`);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    load();
  }, [load, refreshToken]);

  const handleAdd = async (path, label) => {
    setBusy(true);
    setFormError(null);
    try {
      await addSource(path, label, apiBase);
      setShowForm(false);
      await load();
      onChanged?.();
    } catch (err) {
      let message = err.message;
      try {
        message = JSON.parse(err.message).detail ?? message;
      } catch {
        // plain text error, use as-is
      }
      setFormError(message);
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (id) => {
    setBusy(true);
    try {
      await removeSource(id, apiBase);
      await load();
      onChanged?.();
    } catch {
      setError('Failed to remove source folder.');
    } finally {
      setBusy(false);
    }
  };

  const handleToggle = async (id, enabled) => {
    setBusy(true);
    setSources((prev) => prev.map((s) => (s.id === id ? { ...s, enabled } : s)));
    try {
      await setSourceEnabled(id, enabled, apiBase);
      onChanged?.();
    } catch {
      setError('Failed to update source folder.');
      await load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <FolderIcon size={18} className="text-source" />
            Source folders
          </h2>
          <p className="mt-0.5 text-xs text-gray-500">
            {rawDir ? (
              <>
                Always includes <code className="rounded bg-gray-100 px-1 py-0.5">{rawDir}</code>
                {sources.length > 0 && ' — plus the folders below'}
              </>
            ) : (
              'Folders the compiler reads raw notes, emails, and files from.'
            )}
          </p>
        </div>
        {!showForm && (
          <SecondaryButton
            onClick={() => {
              setShowForm(true);
              setFormError(null);
            }}
            className="border-source-border text-source hover:bg-source-bg">
            <FolderPlusIcon size={16} />
            Add folder
          </SecondaryButton>
        )}
      </div>

      <div className="space-y-3 p-5">
        {showForm && (
          <AddFolderForm
            onAdd={handleAdd}
            onCancel={() => setShowForm(false)}
            busy={busy}
            formError={formError}
          />
        )}

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {loading ? (
          <p className="py-6 text-center text-sm text-gray-500">Loading folders…</p>
        ) : sources.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-400">
            No extra folders registered yet. Add one to pull notes in from anywhere on disk.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sources.map((source) => (
              <FolderCard
                key={source.id}
                source={source}
                onToggle={handleToggle}
                onRemove={handleRemove}
                busy={busy}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
