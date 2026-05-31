import React, { useCallback, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {
  DEFAULT_WIKI_API_URL,
  fetchRawFileDetail,
  fetchRawFiles,
} from '@site/src/utils/wikiApi';
import HighlightedMarkdown from './HighlightedMarkdown';

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'processed', label: 'Processed' },
  { id: 'unprocessed', label: 'Unprocessed' },
];

function fileExtension(path) {
  const segment = path.split('/').pop() ?? '';
  const dot = segment.lastIndexOf('.');
  return dot >= 0 ? segment.slice(dot + 1).toLowerCase() : 'file';
}

const EXT_COLORS = {
  md: 'bg-sky-50 text-sky-700 ring-sky-200/60',
  txt: 'bg-neutral-100 text-neutral-700 ring-neutral-200/60',
  html: 'bg-orange-50 text-orange-700 ring-orange-200/60',
  json: 'bg-violet-50 text-violet-700 ring-violet-200/60',
  file: 'bg-neutral-100 text-neutral-600 ring-neutral-200/60',
};

function StatusBadge({ status }) {
  const isProcessed = status === 'Processed';
  return (
    <span
      className={clsx(
        'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1',
        isProcessed
          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200/60'
          : 'bg-amber-50 text-amber-700 ring-amber-200/60',
      )}>
      {status}
    </span>
  );
}

function ChipList({ label, items, variant }) {
  if (!items?.length) {
    return null;
  }

  const chipClass = {
    tag: 'bg-violet-50 text-violet-800 ring-violet-200/60',
    entity: 'bg-amber-50 text-amber-900 ring-amber-200/60',
    concept: 'bg-sky-50 text-sky-900 ring-sky-200/60',
    link: 'bg-emerald-50 text-emerald-800 ring-emerald-200/60',
  }[variant];

  return (
    <div className="space-y-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => {
          const text = typeof item === 'string' ? item : item.name;
          return (
            <span
              key={`${label}-${text}`}
              className={clsx('rounded-full px-2 py-0.5 text-xs ring-1', chipClass)}>
              {text}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-neutral-200/60 bg-white p-4 shadow-card">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="h-4 w-3/4 animate-shimmer rounded-md bg-shimmer-gradient bg-[length:200%_100%]" />
        <div className="h-5 w-16 animate-shimmer rounded-full bg-shimmer-gradient bg-[length:200%_100%]" />
      </div>
      <div className="flex gap-3">
        <div className="h-3 w-16 animate-shimmer rounded bg-shimmer-gradient bg-[length:200%_100%]" />
        <div className="h-3 w-12 animate-shimmer rounded bg-shimmer-gradient bg-[length:200%_100%]" />
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}

function RawFileGrid({ files, selectedPath, onSelect }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {files.map((file) => {
        const isSelected = file.path === selectedPath;
        const ext = fileExtension(file.path);
        const extClass = EXT_COLORS[ext] ?? EXT_COLORS.file;

        return (
          <button
            key={file.path}
            type="button"
            className={clsx(
              'group rounded-2xl border bg-white p-4 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/25',
              isSelected
                ? 'border-emerald-400/80 shadow-card-hover ring-2 ring-emerald-500/15'
                : 'border-neutral-200/70 shadow-card hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-card-hover',
            )}
            onClick={() => onSelect(file.path)}>
            <div className="mb-3 flex items-start justify-between gap-2">
              <span
                className={clsx(
                  'shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ring-1',
                  extClass,
                )}>
                {ext}
              </span>
              <StatusBadge status={file.status} />
            </div>
            <code className="block break-all text-xs leading-snug text-neutral-600 transition-colors group-hover:text-neutral-900">
              {file.path}
            </code>
            <div className="mt-3 flex gap-4 border-t border-neutral-100 pt-3 text-xs text-neutral-400">
              <span>{file.chunk_count ?? 0} chunks</span>
              <span>{Math.round((file.size_bytes ?? 0) / 1024)} KB</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="h-4 w-24 animate-shimmer rounded bg-shimmer-gradient bg-[length:200%_100%]" />
      <div className="h-6 w-2/3 animate-shimmer rounded-lg bg-shimmer-gradient bg-[length:200%_100%]" />
      <div className="grid min-h-[480px] grid-cols-1 gap-4 lg:grid-cols-2">
        {[0, 1].map((panel) => (
          <div
            key={panel}
            className="overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-card">
            <div className="border-b border-neutral-100 px-4 py-3">
              <div className="h-4 w-32 animate-shimmer rounded bg-shimmer-gradient bg-[length:200%_100%]" />
            </div>
            <div className="space-y-2 p-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="h-3 animate-shimmer rounded bg-shimmer-gradient bg-[length:200%_100%]"
                  style={{ width: `${60 + (index % 3) * 12}%` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailView({ detail, activePageIndex, onPageChange, onClose }) {
  const activePage = detail.synthesized_pages[activePageIndex] ?? null;

  return (
    <section className="animate-fade-in space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <button
            type="button"
            className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-emerald-600 transition hover:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 rounded-md"
            onClick={onClose}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            All files
          </button>
          <h2 className="break-all text-lg font-semibold tracking-tight text-neutral-900">
            {detail.path}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-neutral-500">
            <StatusBadge status={detail.status} />
            <span>{detail.topics.length} topics</span>
            <span>{detail.synthesized_pages.length} synthesized pages</span>
          </div>
        </div>
      </div>

      {detail.synthesized_pages.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {detail.synthesized_pages.map((page, index) => (
            <button
              key={page.doc_path}
              type="button"
              className={clsx(
                'rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20',
                index === activePageIndex
                  ? 'border-emerald-400/60 bg-emerald-50 text-emerald-800 shadow-card'
                  : 'border-neutral-200/80 bg-white text-neutral-600 hover:border-neutral-300',
              )}
              onClick={() => onPageChange(index)}>
              {page.title}
            </button>
          ))}
        </div>
      )}

      <div className="grid min-h-[480px] grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-50/60 px-4 py-3">
            <h3 className="text-sm font-semibold text-neutral-900">Original source</h3>
            <span className="rounded-md bg-neutral-100 px-2 py-0.5 font-mono text-[10px] text-neutral-500">
              data/raw
            </span>
          </div>
          <pre className="flex-1 overflow-auto bg-neutral-950 p-4 font-mono text-xs leading-relaxed text-neutral-300">
            {detail.content}
          </pre>
        </div>

        <div className="flex flex-col overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-50/60 px-4 py-3">
            <h3 className="text-sm font-semibold text-neutral-900">
              {activePage ? activePage.title : 'Synthesized output'}
            </h3>
            <span className="max-w-[180px] truncate rounded-md bg-neutral-100 px-2 py-0.5 font-mono text-[10px] text-neutral-500">
              {activePage?.doc_path ?? 'wiki-app/docs'}
            </span>
          </div>

          {activePage ? (
            <>
              <div className="flex flex-wrap gap-2 border-b border-neutral-100 px-4 py-2.5">
                {[
                  ['Entity', 'bg-amber-50 text-amber-800 ring-amber-200/60'],
                  ['Concept', 'bg-sky-50 text-sky-800 ring-sky-200/60'],
                  ['Tag', 'bg-violet-50 text-violet-800 ring-violet-200/60'],
                  ['Link', 'bg-emerald-50 text-emerald-800 ring-emerald-200/60'],
                ].map(([label, cls]) => (
                  <span
                    key={label}
                    className={clsx('rounded-full px-2 py-0.5 text-[10px] font-medium ring-1', cls)}>
                    {label}
                  </span>
                ))}
              </div>

              <div className="space-y-3 border-b border-neutral-100 px-4 py-3">
                <ChipList label="Tags" items={activePage.tags} variant="tag" />
                <ChipList label="Entities" items={activePage.entities} variant="entity" />
                <ChipList label="Concepts" items={activePage.concepts} variant="concept" />
                {activePage.links?.length > 0 && (
                  <ChipList
                    label="Links"
                    items={activePage.links.map((l) => l.text)}
                    variant="link"
                  />
                )}
              </div>

              <div className="flex-1 overflow-auto px-4 py-3">
                <HighlightedMarkdown
                  body={activePage.body}
                  entities={activePage.entities}
                  concepts={activePage.concepts}
                  tags={activePage.tags}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">
                <svg
                  className="h-5 w-5 text-neutral-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-neutral-600">No wiki page yet</p>
              <p className="max-w-xs text-xs leading-relaxed text-neutral-400">
                Run the compiler pipeline to generate topic pages from this source.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default function DataWorkspace({ refreshToken = 0 }) {
  const { siteConfig } = useDocusaurusContext();
  const apiBase = siteConfig.customFields?.wikiApiUrl ?? DEFAULT_WIKI_API_URL;

  const [files, setFiles] = useState([]);
  const [summary, setSummary] = useState({ total: 0, processed: 0, unprocessed: 0 });
  const [selectedPath, setSelectedPath] = useState(null);
  const [detail, setDetail] = useState(null);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadFiles = useCallback(async () => {
    setLoadingList(true);
    setError(null);
    try {
      const data = await fetchRawFiles(apiBase);
      setFiles(data.files ?? []);
      setSummary({
        total: data.total ?? 0,
        processed: data.processed ?? 0,
        unprocessed: data.unprocessed ?? 0,
      });
    } catch {
      setError(
        `Could not reach the wiki API at ${apiBase}. Start it with: cd compiler && ./run_server.sh`,
      );
    } finally {
      setLoadingList(false);
    }
  }, [apiBase]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles, refreshToken]);

  useEffect(() => {
    if (!selectedPath) {
      setDetail(null);
      return undefined;
    }

    let cancelled = false;
    setLoadingDetail(true);
    setError(null);

    fetchRawFileDetail(selectedPath, apiBase)
      .then((data) => {
        if (!cancelled) {
          setDetail(data);
          setActivePageIndex(0);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(`Failed to load details for ${selectedPath}`);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingDetail(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedPath, apiBase]);

  const sortedFiles = useMemo(
    () => [...files].sort((a, b) => a.path.localeCompare(b.path)),
    [files],
  );

  const filteredFiles = useMemo(() => {
    let result = sortedFiles;

    if (statusFilter === 'processed') {
      result = result.filter((file) => file.status === 'Processed');
    } else if (statusFilter === 'unprocessed') {
      result = result.filter((file) => file.status !== 'Processed');
    }

    const needle = search.trim().toLowerCase();
    if (needle) {
      result = result.filter((file) => file.path.toLowerCase().includes(needle));
    }

    return result;
  }, [sortedFiles, search, statusFilter]);

  const tabCounts = useMemo(
    () => ({
      all: summary.total,
      processed: summary.processed,
      unprocessed: summary.unprocessed,
    }),
    [summary],
  );

  if (error && !detail && files.length === 0 && !loadingList) {
    return (
      <section className="animate-fade-in rounded-2xl border border-red-200/80 bg-red-50 px-5 py-4 text-sm text-red-700 shadow-card">
        {error}
      </section>
    );
  }

  return (
    <section className="animate-fade-in rounded-2xl border border-neutral-200/70 bg-white p-6 shadow-panel sm:p-7">
      {!selectedPath && (
        <>
          <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
                Data Workspace
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                Browse raw sources and compare with synthesized pages.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
              <input
                type="search"
                placeholder="Search files…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-xl border border-neutral-200/80 bg-neutral-50/80 py-2.5 pl-10 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 transition focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <div className="mb-6 flex flex-wrap gap-2 border-b border-neutral-100 pb-4">
            {FILTER_TABS.map((tab) => {
              const isActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={clsx(
                    'inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20',
                    isActive
                      ? 'bg-neutral-900 text-white shadow-card'
                      : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
                  )}
                  onClick={() => setStatusFilter(tab.id)}>
                  {tab.label}
                  <span
                    className={clsx(
                      'rounded-md px-1.5 py-0.5 text-[11px] tabular-nums',
                      isActive ? 'bg-white/15 text-white/90' : 'bg-white text-neutral-500 ring-1 ring-neutral-200/80',
                    )}>
                    {tabCounts[tab.id]}
                  </span>
                </button>
              );
            })}
          </div>

          {loadingList ? (
            <SkeletonGrid />
          ) : (
            <>
              <RawFileGrid
                files={filteredFiles}
                selectedPath={selectedPath}
                onSelect={setSelectedPath}
              />

              {filteredFiles.length === 0 && (
                <div className="mt-8 flex flex-col items-center py-8 text-center">
                  <p className="text-sm font-medium text-neutral-600">No files found</p>
                  <p className="mt-1 text-xs text-neutral-400">
                    {search
                      ? 'Try a different search term or filter.'
                      : 'Add sources to data/raw and run the compiler.'}
                  </p>
                </div>
              )}
            </>
          )}
        </>
      )}

      {selectedPath && loadingDetail && <DetailSkeleton />}

      {selectedPath && detail && !loadingDetail && (
        <DetailView
          detail={detail}
          activePageIndex={activePageIndex}
          onPageChange={setActivePageIndex}
          onClose={() => setSelectedPath(null)}
        />
      )}

      {error && files.length > 0 && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
          {error}
        </p>
      )}
    </section>
  );
}
