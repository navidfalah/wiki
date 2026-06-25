import React, { useCallback, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {
  DEFAULT_WIKI_API_URL,
  fetchRawFileDetail,
  fetchRawFiles,
} from '@site/src/utils/wikiApi';
import HighlightedMarkdown from './HighlightedMarkdown';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'processed', label: 'Processed' },
  { id: 'unprocessed', label: 'Unprocessed' },
];

function DetailView({ detail, activePageIndex, onPageChange, onClose }) {
  const activePage = detail.synthesized_pages[activePageIndex] ?? null;

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onClose}
        className="text-sm text-gray-600 hover:text-gray-900">
        ← Back to file list
      </button>

      <div>
        <h2 className="break-all text-base font-medium text-gray-900">{detail.path}</h2>
        <p className="mt-1 text-sm text-gray-500">
          {detail.status} · {detail.synthesized_pages.length} wiki page(s)
        </p>
      </div>

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
        <div className="rounded-md border border-gray-200">
          <div className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700">
            Raw source
          </div>
          <pre className="max-h-96 overflow-auto p-3 font-mono text-xs text-gray-800 whitespace-pre-wrap">
            {detail.content}
          </pre>
        </div>

        <div className="rounded-md border border-gray-200">
          <div className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700">
            {activePage ? activePage.title : 'Wiki output'}
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
      setError(`Cannot reach API at ${apiBase}. Run: cd compiler && ./run_server.sh`);
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
          setError(`Failed to load ${selectedPath}`);
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

  const filteredFiles = useMemo(() => {
    let result = [...files].sort((a, b) => a.path.localeCompare(b.path));

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
  }, [files, search, statusFilter]);

  if (error && !detail && files.length === 0 && !loadingList) {
    return (
      <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        {error}
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-4 py-3">
        <h2 className="text-base font-semibold text-gray-900">Raw files</h2>
        <p className="text-sm text-gray-500">Sources in data/raw/ and their wiki pages.</p>
      </div>

      <div className="border-b border-gray-200 px-4 py-3">
        {selectedPath && detail && !loadingDetail ? (
          <DetailView
            detail={detail}
            activePageIndex={activePageIndex}
            onPageChange={setActivePageIndex}
            onClose={() => setSelectedPath(null)}
          />
        ) : (
          <>
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-2">
                {FILTERS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id)}
                    className={clsx(
                      'rounded-md px-3 py-1 text-sm',
                      statusFilter === tab.id
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-600 hover:bg-gray-100',
                    )}>
                    {tab.label}
                    <span className="ml-1 text-xs opacity-70">
                      {tab.id === 'all'
                        ? summary.total
                        : tab.id === 'processed'
                          ? summary.processed
                          : summary.unprocessed}
                    </span>
                  </button>
                ))}
              </div>
              <input
                type="search"
                placeholder="Search paths…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm sm:max-w-xs"
              />
            </div>

            {loadingList ? (
              <p className="py-8 text-center text-sm text-gray-500">Loading files…</p>
            ) : filteredFiles.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">No files match.</p>
            ) : (
              <ul className="max-h-[420px] divide-y divide-gray-100 overflow-auto rounded-md border border-gray-200">
                {filteredFiles.map((file) => (
                  <li key={file.path}>
                    <button
                      type="button"
                      onClick={() => setSelectedPath(file.path)}
                      className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-gray-50">
                      <code className="break-all text-gray-800">{file.path}</code>
                      <span
                        className={clsx(
                          'shrink-0 text-xs',
                          file.status === 'Processed' ? 'text-green-700' : 'text-amber-700',
                        )}>
                        {file.status}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {selectedPath && loadingDetail && (
              <p className="mt-4 text-sm text-gray-500">Loading file…</p>
            )}
          </>
        )}
      </div>

      {error && files.length > 0 && (
        <p className="border-t border-gray-200 px-4 py-3 text-sm text-red-700">{error}</p>
      )}
    </section>
  );
}
