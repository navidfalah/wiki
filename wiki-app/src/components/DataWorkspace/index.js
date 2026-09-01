import React, { useCallback, useEffect, useMemo, useState } from 'react';
import useApiBase from '@site/src/utils/useApiBase';
import clsx from 'clsx';
import {
  createRawFolder,
  deleteRawFolder,
  fetchRawFileDetail,
  fetchRawFiles,
  moveRawFile,
} from '@site/src/utils/wikiApi';
import HighlightedMarkdown from './HighlightedMarkdown';
import { Badge, IconButton, PrimaryButton, SecondaryButton } from '@site/src/components/ui/Button';
import {
  DocumentIcon,
  EyeIcon,
  FileIcon,
  FolderIcon,
  FolderPlusIcon,
  HomeIcon,
  MoreIcon,
  TrashIcon,
  XIcon,
} from '@site/src/components/ui/Icons';

function parentOf(path) {
  const idx = path.lastIndexOf('/');
  return idx === -1 ? '' : path.slice(0, idx);
}

function nameOf(path) {
  const idx = path.lastIndexOf('/');
  return idx === -1 ? path : path.slice(idx + 1);
}

function topSegment(path) {
  return path.split('/', 1)[0];
}

function extensionOf(path) {
  const idx = path.lastIndexOf('.');
  return idx === -1 ? '' : path.slice(idx + 1).toUpperCase();
}

function PreviewModal({ path, detail, loading, activePageIndex, onPageChange, onClose }) {
  const activePage = detail?.synthesized_pages?.[activePageIndex] ?? null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-[1px]">
      <div className="animate-fade-in flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-panel">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <FileIcon size={16} className="shrink-0 text-source" />
            <h2 className="truncate text-sm font-medium text-gray-900">{path}</h2>
          </div>
          <IconButton label="Close preview" onClick={onClose}>
            <XIcon size={18} />
          </IconButton>
        </div>

        <div className="flex-1 overflow-auto p-5">
          {loading || !detail ? (
            <p className="py-10 text-center text-sm text-gray-500">Loading…</p>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                {detail.status} · {detail.synthesized_pages.length} wiki page(s)
              </p>

              {detail.synthesized_pages.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {detail.synthesized_pages.map((page, index) => (
                    <button
                      key={page.doc_path}
                      type="button"
                      onClick={() => onPageChange(index)}
                      className={clsx(
                        'rounded-md border px-3 py-1 text-xs',
                        index === activePageIndex
                          ? 'border-gray-900 bg-gray-900 text-white'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50',
                      )}>
                      {page.title}
                    </button>
                  ))}
                </div>
              )}

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="overflow-hidden rounded-xl border border-source-border">
                  <div className="flex items-center gap-2 border-b border-source-border bg-source-bg px-3 py-2 text-sm font-medium text-source">
                    <FolderIcon size={15} />
                    Source (raw, unedited)
                  </div>
                  <pre className="max-h-96 overflow-auto p-3 font-mono text-xs text-gray-800 whitespace-pre-wrap">
                    {detail.content}
                  </pre>
                </div>

                <div className="overflow-hidden rounded-xl border border-generated-border">
                  <div className="flex items-center gap-2 border-b border-generated-border bg-generated-bg px-3 py-2 text-sm font-medium text-generated">
                    <DocumentIcon size={15} />
                    {activePage ? activePage.title : 'Generated wiki page'}
                  </div>
                  {activePage ? (
                    <div className="max-h-96 overflow-auto p-3 text-sm">
                      <HighlightedMarkdown
                        body={activePage.body}
                        entities={activePage.entities}
                        concepts={activePage.concepts}
                        tags={activePage.tags}
                      />
                    </div>
                  ) : (
                    <p className="p-4 text-sm text-gray-500">No wiki page yet. Run the compiler.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NewFolderRow({ onCreate, onCancel, busy, formError }) {
  const [name, setName] = useState('');
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onCreate(name);
      }}
      className="col-span-full flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2">
      <FolderPlusIcon size={16} className="shrink-0 text-gray-400" />
      <input
        autoFocus
        type="text"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="New folder name…"
        className="min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
      />
      {formError && <span className="text-xs text-red-600">{formError}</span>}
      <PrimaryButton type="submit" disabled={busy || !name.trim()} className="px-3 py-1 text-xs">
        Create
      </PrimaryButton>
      <SecondaryButton type="button" onClick={onCancel} disabled={busy} className="px-3 py-1 text-xs">
        Cancel
      </SecondaryButton>
    </form>
  );
}

function FolderTile({ name, path, itemCount, managed, onOpen, onDelete }) {
  return (
    <div className="group relative flex flex-col items-center gap-1.5 rounded-lg p-3 text-center hover:bg-gray-50">
      <button
        type="button"
        onClick={() => onOpen(path)}
        className="flex flex-col items-center gap-1.5"
        title={path}>
        <span
          className={clsx(
            'flex h-12 w-12 items-center justify-center rounded-xl',
            managed ? 'bg-source-bg text-source' : 'bg-amber-50 text-amber-600',
          )}>
          <FolderIcon size={26} />
        </span>
        <span className="line-clamp-2 w-24 text-xs font-medium text-gray-800">{name}</span>
        <span className="text-[11px] text-gray-400">
          {itemCount} item{itemCount === 1 ? '' : 's'}
        </span>
      </button>
      {!managed && (
        <IconButton
          label="Delete folder"
          onClick={() => onDelete(path)}
          className="absolute right-1 top-1 h-7 w-7 opacity-0 group-hover:opacity-100 hover:!bg-red-50 hover:!text-red-600">
          <TrashIcon size={14} />
        </IconButton>
      )}
    </div>
  );
}

function FileTile({ file, managed, onPreview, onMove, folderOptions }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ext = extensionOf(file.path);
  const processed = file.status === 'Processed';

  return (
    <div className="group relative flex flex-col items-center gap-1.5 rounded-lg p-3 text-center hover:bg-gray-50">
      <button
        type="button"
        onClick={() => onPreview(file.path)}
        className="flex flex-col items-center gap-1.5"
        title={file.path}>
        <span className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
          <FileIcon size={24} />
          <span
            className={clsx(
              'absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white',
              processed ? 'bg-emerald-500' : 'bg-amber-500',
            )}
            title={file.status}
          />
        </span>
        <span className="line-clamp-2 w-24 text-xs font-medium text-gray-800">{nameOf(file.path)}</span>
        {ext && <span className="text-[10px] font-medium tracking-wide text-gray-400">{ext}</span>}
        {file.source && (
          <Badge tone="source" className="!px-1.5 !py-0 text-[10px]">
            {file.source}
          </Badge>
        )}
      </button>

      {!managed && (
        <div className="absolute right-1 top-1">
          <IconButton
            label="File actions"
            onClick={() => setMenuOpen((v) => !v)}
            className="h-7 w-7 opacity-0 group-hover:opacity-100">
            <MoreIcon size={16} />
          </IconButton>
          {menuOpen && (
            <>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
                className="fixed inset-0 z-10 cursor-default"
              />
              <div className="absolute right-0 top-8 z-20 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-panel">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onPreview(file.path);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50">
                  <EyeIcon size={14} /> Preview
                </button>
                <p className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-gray-400">
                  Move to
                </p>
                <div className="max-h-40 overflow-auto">
                  {folderOptions.map((option) => (
                    <button
                      key={option.path}
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onMove(file.path, option.path);
                      }}
                      disabled={option.path === parentOf(file.path)}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-default disabled:text-gray-300 disabled:hover:bg-transparent">
                      <FolderIcon size={14} className={option.path ? 'text-amber-500' : 'text-gray-400'} />
                      <span className="truncate">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function DataWorkspace({ refreshToken = 0 }) {
  const [apiBase] = useApiBase();

  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [managedFolders, setManagedFolders] = useState([]);
  const [summary, setSummary] = useState({ total: 0, processed: 0, unprocessed: 0 });
  const [currentPath, setCurrentPath] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const [previewPath, setPreviewPath] = useState(null);
  const [previewDetail, setPreviewDetail] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [activePageIndex, setActivePageIndex] = useState(0);

  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [folderBusy, setFolderBusy] = useState(false);
  const [folderFormError, setFolderFormError] = useState(null);

  const loadFiles = useCallback(async () => {
    setLoadingList(true);
    setError(null);
    try {
      const data = await fetchRawFiles(apiBase);
      setFiles(data.files ?? []);
      setFolders(data.folders ?? []);
      setManagedFolders(data.managed_folders ?? []);
      setSummary({
        total: data.total ?? 0,
        processed: data.processed ?? 0,
        unprocessed: data.unprocessed ?? 0,
      });
    } catch {
      setError(`Cannot reach API at ${apiBase}. Run: cd compiler && ./run_server.sh`);
    } finally {
      setLoadingList(false);
    }
  }, [apiBase]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles, refreshToken]);

  useEffect(() => {
    if (!previewPath) {
      setPreviewDetail(null);
      return undefined;
    }
    let cancelled = false;
    setPreviewLoading(true);
    fetchRawFileDetail(previewPath, apiBase)
      .then((data) => {
        if (!cancelled) {
          setPreviewDetail(data);
          setActivePageIndex(0);
        }
      })
      .catch(() => {
        if (!cancelled) setError(`Failed to load ${previewPath}`);
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [previewPath, apiBase]);

  const isManaged = useCallback(
    (relPath) => managedFolders.includes(topSegment(relPath)),
    [managedFolders],
  );

  const childFolders = useMemo(
    () => folders.filter((f) => parentOf(f) === currentPath),
    [folders, currentPath],
  );

  const childFiles = useMemo(() => {
    let result = files.filter((f) => parentOf(f.path) === currentPath);
    const needle = search.trim().toLowerCase();
    if (needle) {
      result = result.filter((f) => nameOf(f.path).toLowerCase().includes(needle));
    }
    return result.sort((a, b) => a.path.localeCompare(b.path));
  }, [files, currentPath, search]);

  const itemCountFor = useCallback(
    (folderPath) => {
      const directFiles = files.filter((f) => parentOf(f.path) === folderPath).length;
      const directSubfolders = folders.filter((f) => parentOf(f) === folderPath).length;
      return directFiles + directSubfolders;
    },
    [folders, files],
  );

  const folderOptions = useMemo(() => {
    const options = [{ path: '', label: 'Data root' }];
    for (const path of folders) {
      if (isManaged(path)) continue;
      options.push({ path, label: path });
    }
    return options;
  }, [folders, isManaged]);

  const breadcrumbs = useMemo(() => {
    if (!currentPath) return [];
    const parts = currentPath.split('/');
    return parts.map((part, index) => ({
      label: part,
      path: parts.slice(0, index + 1).join('/'),
    }));
  }, [currentPath]);

  const handleCreateFolder = async (name) => {
    setFolderBusy(true);
    setFolderFormError(null);
    try {
      await createRawFolder(currentPath, name, apiBase);
      setNewFolderOpen(false);
      await loadFiles();
    } catch (err) {
      let message = err.message;
      try {
        message = JSON.parse(err.message).detail ?? message;
      } catch {
        // plain text error
      }
      setFolderFormError(message);
    } finally {
      setFolderBusy(false);
    }
  };

  const handleDeleteFolder = async (path) => {
    try {
      await deleteRawFolder(path, apiBase);
      await loadFiles();
    } catch (err) {
      let message = err.message;
      try {
        message = JSON.parse(err.message).detail ?? message;
      } catch {
        // plain text error
      }
      setError(message);
    }
  };

  const handleMoveFile = async (path, destination) => {
    try {
      await moveRawFile(path, destination, apiBase);
      await loadFiles();
    } catch (err) {
      let message = err.message;
      try {
        message = JSON.parse(err.message).detail ?? message;
      } catch {
        // plain text error
      }
      setError(message);
    }
  };

  if (error && files.length === 0 && !loadingList) {
    return (
      <section className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        {error}
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-card">
      <div className="border-b border-gray-100 px-5 py-4">
        <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
          <FolderIcon size={18} className="text-source" />
          Files
        </h2>
        <p className="mt-0.5 text-sm text-gray-500">
          {summary.processed} of {summary.total} files compiled into the wiki. Browse like a file
          manager — click a folder to open it, click a file to preview what it produced.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-5 py-2.5">
        <nav className="flex min-w-0 flex-wrap items-center gap-1 text-sm" aria-label="Breadcrumb">
          <button
            type="button"
            onClick={() => setCurrentPath('')}
            className={clsx(
              'flex items-center gap-1 rounded-md px-1.5 py-0.5 hover:bg-gray-100',
              currentPath === '' ? 'font-medium text-gray-900' : 'text-gray-500',
            )}>
            <HomeIcon size={14} />
            data/raw
          </button>
          {breadcrumbs.map((crumb) => (
            <React.Fragment key={crumb.path}>
              <span className="text-gray-300">/</span>
              <button
                type="button"
                onClick={() => setCurrentPath(crumb.path)}
                className={clsx(
                  'rounded-md px-1.5 py-0.5 hover:bg-gray-100',
                  crumb.path === currentPath ? 'font-medium text-gray-900' : 'text-gray-500',
                )}>
                {crumb.label}
              </button>
            </React.Fragment>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <input
            type="search"
            placeholder="Search this folder…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-40 rounded-lg border border-gray-300 px-2.5 py-1 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
          {!isManaged(currentPath) && (
            <SecondaryButton onClick={() => setNewFolderOpen(true)} className="px-3 py-1 text-xs">
              <FolderPlusIcon size={14} />
              New folder
            </SecondaryButton>
          )}
        </div>
      </div>

      <div className="p-4">
        {error && (
          <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {loadingList ? (
          <p className="py-10 text-center text-sm text-gray-500">Loading files…</p>
        ) : (
          <div className="grid grid-cols-3 gap-1 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {newFolderOpen && (
              <NewFolderRow
                onCreate={handleCreateFolder}
                onCancel={() => setNewFolderOpen(false)}
                busy={folderBusy}
                formError={folderFormError}
              />
            )}
            {childFolders.map((path) => (
              <FolderTile
                key={path}
                path={path}
                name={nameOf(path)}
                itemCount={itemCountFor(path)}
                managed={isManaged(path)}
                onOpen={setCurrentPath}
                onDelete={handleDeleteFolder}
              />
            ))}
            {childFiles.map((file) => (
              <FileTile
                key={file.path}
                file={file}
                managed={isManaged(file.path)}
                onPreview={setPreviewPath}
                onMove={handleMoveFile}
                folderOptions={folderOptions}
              />
            ))}
            {!newFolderOpen && childFolders.length === 0 && childFiles.length === 0 && (
              <p className="col-span-full py-10 text-center text-sm text-gray-400">
                This folder is empty.
              </p>
            )}
          </div>
        )}
      </div>

      {previewPath && (
        <PreviewModal
          path={previewPath}
          detail={previewDetail}
          loading={previewLoading}
          activePageIndex={activePageIndex}
          onPageChange={setActivePageIndex}
          onClose={() => setPreviewPath(null)}
        />
      )}
    </section>
  );
}
