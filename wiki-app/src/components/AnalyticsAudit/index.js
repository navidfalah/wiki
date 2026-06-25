import React, { useCallback, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Link from '@docusaurus/Link';
import { SecondaryButton } from '@site/src/components/ui/Button';
import {
  DEFAULT_WIKI_API_URL,
  fetchAnalytics,
  fetchDocDetail,
  fetchDocsList,
  fetchKnowledgeGraph,
  fetchRawFiles,
} from '@site/src/utils/wikiApi';

const PANEL = {
  raw: 'raw',
  pages: 'pages',
  links: 'links',
  dead: 'dead',
};

function docSlug(page) {
  if (page.slug) {
    const slug = page.slug.startsWith('/') ? page.slug.slice(1) : page.slug;
    return slug.replace(/^docs\//, '');
  }
  return page.path.replace(/\.md$/, '');
}

function docHref(page) {
  return `/docs/${docSlug(page)}`;
}

function MetricButton({ label, value, hint, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'rounded-lg border px-4 py-3 text-left',
        active ? 'border-gray-900 bg-gray-50' : 'border-gray-200 bg-white hover:bg-gray-50',
      )}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-gray-900">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-gray-500">{hint}</p>}
    </button>
  );
}

function Panel({ title, description, onClose, children, loading }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          {description && <p className="text-xs text-gray-500">{description}</p>}
        </div>
        <SecondaryButton onClick={onClose}>Close</SecondaryButton>
      </div>
      {loading ? (
        <p className="px-4 py-8 text-center text-sm text-gray-500">Loading…</p>
      ) : (
        children
      )}
    </section>
  );
}

function PagePreview({ detail, loading, error, highlightLine, onClose }) {
  if (loading) {
    return (
      <section className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        Loading page…
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        {error}
        <div className="mt-3">
          <SecondaryButton onClick={onClose}>Close</SecondaryButton>
        </div>
      </section>
    );
  }

  if (!detail) {
    return null;
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-200 px-4 py-3">
        <div>
          <button
            type="button"
            onClick={onClose}
            className="mb-2 text-sm text-gray-600 hover:text-gray-900">
            ← Back
          </button>
          <h2 className="text-base font-semibold text-gray-900">{detail.title}</h2>
          <p className="font-mono text-xs text-gray-500">{detail.path}</p>
        </div>
        <Link to={docHref(detail)} className="text-sm text-gray-700 underline hover:text-gray-900">
          Open in wiki
        </Link>
      </div>

      <div className="grid gap-0 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-3 border-b border-gray-200 p-4 text-sm lg:border-b-0 lg:border-r">
          {detail.id && (
            <div>
              <p className="text-xs text-gray-500">ID</p>
              <p className="font-mono text-gray-800">{detail.id}</p>
            </div>
          )}
          {detail.slug && (
            <div>
              <p className="text-xs text-gray-500">Slug</p>
              <p className="font-mono text-gray-800">{detail.slug}</p>
            </div>
          )}
          {detail.tags?.length > 0 && (
            <div>
              <p className="mb-1 text-xs text-gray-500">Tags</p>
              <p className="text-gray-700">{detail.tags.join(', ')}</p>
            </div>
          )}
          {detail.links?.length > 0 && (
            <div>
              <p className="mb-1 text-xs text-gray-500">Outgoing links ({detail.links.length})</p>
              <ul className="max-h-32 space-y-1 overflow-auto text-xs text-gray-600">
                {detail.links.map((link, index) => (
                  <li key={`${link.href}-${index}`} className="truncate">
                    [{link.text}]({link.href})
                  </li>
                ))}
              </ul>
            </div>
          )}
          {highlightLine != null && (
            <p className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-800">
              Dead link at line {highlightLine}
            </p>
          )}
        </aside>

        <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words p-4 font-mono text-xs text-gray-700">
          {detail.body}
        </pre>
      </div>
    </section>
  );
}

export default function AnalyticsAudit() {
  const { siteConfig } = useDocusaurusContext();
  const apiBase = siteConfig.customFields?.wikiApiUrl ?? DEFAULT_WIKI_API_URL;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);

  const [activePanel, setActivePanel] = useState(null);
  const [panelLoading, setPanelLoading] = useState(false);
  const [docsPages, setDocsPages] = useState([]);
  const [rawFiles, setRawFiles] = useState([]);
  const [crossLinks, setCrossLinks] = useState([]);
  const [topicFilenames, setTopicFilenames] = useState(new Map());
  const [pageSearch, setPageSearch] = useState('');

  const [selectedPagePath, setSelectedPagePath] = useState(null);
  const [pageDetail, setPageDetail] = useState(null);
  const [pageDetailLoading, setPageDetailLoading] = useState(false);
  const [pageDetailError, setPageDetailError] = useState(null);
  const [highlightLine, setHighlightLine] = useState(null);
  const [selectedDeadLinkKey, setSelectedDeadLinkKey] = useState(null);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await fetchAnalytics(apiBase);
      setData(payload);
      setSelectedTag((current) => {
        if (current && payload.tag_details?.[current]) {
          return current;
        }
        return payload.tags?.[0]?.tag ?? null;
      });
    } catch {
      setError(`Cannot reach API at ${apiBase}. Run: cd compiler && ./run_server.sh`);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const openPageDetail = useCallback(
    async (docPath, { line } = {}) => {
      setSelectedPagePath(docPath);
      setHighlightLine(line ?? null);
      setPageDetail(null);
      setPageDetailError(null);
      setPageDetailLoading(true);
      try {
        const detail = await fetchDocDetail(docPath, apiBase);
        setPageDetail(detail);
      } catch {
        setPageDetailError(`Could not load ${docPath}`);
      } finally {
        setPageDetailLoading(false);
      }
    },
    [apiBase],
  );

  const closePageDetail = useCallback(() => {
    setSelectedPagePath(null);
    setPageDetail(null);
    setPageDetailError(null);
    setHighlightLine(null);
    setSelectedDeadLinkKey(null);
  }, []);

  const loadPanelData = useCallback(
    async (panel) => {
      setPanelLoading(true);
      try {
        if (panel === PANEL.pages) {
          const docs = await fetchDocsList(apiBase);
          setDocsPages(docs.pages ?? []);
        } else if (panel === PANEL.raw) {
          const raw = await fetchRawFiles(apiBase);
          setRawFiles(raw.files ?? []);
        } else if (panel === PANEL.links) {
          const kg = await fetchKnowledgeGraph(apiBase);
          setCrossLinks(kg.effective_links?.length ? kg.effective_links : kg.detected_links ?? []);
          const filenames = new Map();
          for (const topic of kg.topics ?? []) {
            filenames.set(topic.title, topic.filename);
          }
          setTopicFilenames(filenames);
        }
      } catch {
        setError(`Could not load ${panel} data.`);
      } finally {
        setPanelLoading(false);
      }
    },
    [apiBase],
  );

  const openPanel = useCallback(
    (panel) => {
      setActivePanel((current) => (current === panel ? null : panel));
      closePageDetail();
      if (panel !== PANEL.dead) {
        loadPanelData(panel);
      }
    },
    [closePageDetail, loadPanelData],
  );

  const filteredTags = useMemo(() => {
    const tags = data?.tags ?? [];
    const needle = filter.trim().toLowerCase();
    if (!needle) {
      return tags;
    }
    return tags.filter(
      (item) =>
        item.label.toLowerCase().includes(needle) || item.tag.toLowerCase().includes(needle),
    );
  }, [data, filter]);

  const selectedDetail = selectedTag ? data?.tag_details?.[selectedTag] : null;

  const filteredDocsPages = useMemo(() => {
    const needle = pageSearch.trim().toLowerCase();
    if (!needle) {
      return docsPages;
    }
    return docsPages.filter(
      (page) =>
        page.title.toLowerCase().includes(needle) || page.path.toLowerCase().includes(needle),
    );
  }, [docsPages, pageSearch]);

  const topicPathByTitle = useMemo(() => {
    const map = new Map(topicFilenames);
    for (const page of docsPages) {
      map.set(page.title, page.path);
    }
    for (const bucket of Object.values(data?.tag_details ?? {})) {
      for (const page of bucket.pages ?? []) {
        map.set(page.title, page.path);
      }
    }
    return map;
  }, [docsPages, data, topicFilenames]);

  if (loading) {
    return <p className="text-sm text-gray-500">Loading analytics…</p>;
  }

  if (error && !data) {
    return (
      <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        {error}
      </section>
    );
  }

  const metrics = data?.metrics ?? {};

  const handleDeadLinkClick = (item) => {
    const key = `${item.source}-${item.line}-${item.href}`;
    setSelectedDeadLinkKey(key);
    setActivePanel(PANEL.dead);
    openPageDetail(item.source, { line: item.line });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">Click a metric to browse details.</p>
        <SecondaryButton onClick={loadAnalytics}>Refresh</SecondaryButton>
      </div>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricButton
          label="Raw files processed"
          value={metrics.raw_files_processed ?? 0}
          hint={`${metrics.raw_files_total ?? 0} total`}
          active={activePanel === PANEL.raw}
          onClick={() => openPanel(PANEL.raw)}
        />
        <MetricButton
          label="Wiki pages"
          value={metrics.wiki_pages_created ?? 0}
          active={activePanel === PANEL.pages}
          onClick={() => openPanel(PANEL.pages)}
        />
        <MetricButton
          label="Cross-links"
          value={metrics.cross_links_established ?? 0}
          active={activePanel === PANEL.links}
          onClick={() => openPanel(PANEL.links)}
        />
        <MetricButton
          label="Dead links"
          value={metrics.dead_links ?? 0}
          active={activePanel === PANEL.dead}
          onClick={() => openPanel(PANEL.dead)}
        />
      </div>

      {selectedPagePath && (
        <PagePreview
          detail={pageDetail}
          loading={pageDetailLoading}
          error={pageDetailError}
          highlightLine={highlightLine}
          onClose={closePageDetail}
        />
      )}

      {activePanel === PANEL.pages && !selectedPagePath && (
        <Panel
          title="Wiki pages"
          description={`${docsPages.length} files`}
          onClose={() => setActivePanel(null)}
          loading={panelLoading}>
          <div className="border-b border-gray-200 px-4 py-2">
            <input
              type="search"
              placeholder="Search pages…"
              value={pageSearch}
              onChange={(event) => setPageSearch(event.target.value)}
              className="w-full max-w-md rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            />
          </div>
          {filteredDocsPages.length ? (
            <ul className="max-h-96 divide-y divide-gray-100 overflow-auto">
              {filteredDocsPages.map((page) => (
                <li key={page.path}>
                  <button
                    type="button"
                    onClick={() => openPageDetail(page.path)}
                    className="flex w-full flex-col gap-0.5 px-4 py-2 text-left text-sm hover:bg-gray-50">
                    <span className="font-medium text-gray-900">{page.title}</span>
                    <span className="font-mono text-xs text-gray-500">{page.path}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-8 text-center text-sm text-gray-500">No pages match.</p>
          )}
        </Panel>
      )}

      {activePanel === PANEL.raw && !selectedPagePath && (
        <Panel
          title="Raw files"
          description={`${metrics.raw_files_processed ?? 0} of ${metrics.raw_files_total ?? 0} processed`}
          onClose={() => setActivePanel(null)}
          loading={panelLoading}>
          {rawFiles.length ? (
            <ul className="max-h-96 divide-y divide-gray-100 overflow-auto text-sm">
              {rawFiles.map((file) => (
                <li key={file.path} className="flex items-center justify-between gap-2 px-4 py-2">
                  <code className="text-xs text-gray-800">{file.path}</code>
                  <span
                    className={clsx(
                      'text-xs',
                      file.status === 'Processed' ? 'text-green-700' : 'text-amber-700',
                    )}>
                    {file.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-8 text-center text-sm text-gray-500">No raw files.</p>
          )}
          <div className="border-t border-gray-200 px-4 py-2">
            <Link to="/workspace" className="text-sm text-gray-700 underline">
              Open Dashboard for full preview
            </Link>
          </div>
        </Panel>
      )}

      {activePanel === PANEL.links && !selectedPagePath && (
        <Panel
          title="Cross-links"
          description={`${crossLinks.length} links`}
          onClose={() => setActivePanel(null)}
          loading={panelLoading}>
          {crossLinks.length ? (
            <ul className="max-h-96 divide-y divide-gray-100 overflow-auto text-sm">
              {crossLinks.map((link) => {
                const sourcePath = topicPathByTitle.get(link.source_topic);
                const targetPath = topicPathByTitle.get(link.target_topic);
                return (
                  <li
                    key={`${link.source_topic}-${link.target_topic}-${link.origin}`}
                    className="px-4 py-2">
                    {sourcePath ? (
                      <button
                        type="button"
                        onClick={() => openPageDetail(sourcePath)}
                        className="text-gray-900 underline">
                        {link.source_topic}
                      </button>
                    ) : (
                      <span>{link.source_topic}</span>
                    )}
                    {' → '}
                    {targetPath ? (
                      <button
                        type="button"
                        onClick={() => openPageDetail(targetPath)}
                        className="text-gray-900 underline">
                        {link.target_topic}
                      </button>
                    ) : (
                      <span>{link.target_topic}</span>
                    )}
                    <span className="ml-2 text-xs text-gray-500">({link.origin})</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-4 py-8 text-center text-sm text-gray-500">No cross-links yet.</p>
          )}
        </Panel>
      )}

      {data?.dead_links?.length > 0 && (activePanel === PANEL.dead || activePanel === null) && (
        <section className="rounded-lg border border-red-200 bg-white">
          <div className="border-b border-red-100 bg-red-50 px-4 py-3">
            <h2 className="text-sm font-semibold text-red-900">Dead links</h2>
            <p className="text-xs text-red-700">Click a row to see the source page.</p>
          </div>
          <ul className="divide-y divide-gray-100 text-sm">
            {data.dead_links.map((item) => {
              const key = `${item.source}-${item.line}-${item.href}`;
              return (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => handleDeadLinkClick(item)}
                    className={clsx(
                      'w-full px-4 py-2 text-left hover:bg-red-50',
                      selectedDeadLinkKey === key && 'bg-red-50',
                    )}>
                    <code className="text-xs">{item.source}:{item.line}</code> — [{item.text}](
                    {item.href}) → missing <code className="text-xs text-red-700">{item.missing}</code>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="rounded-lg border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-900">Tags</h2>
          <input
            type="search"
            placeholder="Filter tags…"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm sm:max-w-xs"
          />
        </div>

        <div className="flex flex-wrap gap-2 px-4 py-3">
          {filteredTags.length ? (
            filteredTags.map((item) => (
              <button
                key={item.tag}
                type="button"
                onClick={() => {
                  setSelectedTag(item.tag);
                  closePageDetail();
                }}
                className={clsx(
                  'rounded-md border px-3 py-1 text-sm',
                  selectedTag === item.tag
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50',
                )}>
                {item.label} ({item.count})
              </button>
            ))
          ) : (
            <p className="text-sm text-gray-500">No tags match.</p>
          )}
        </div>

        {selectedDetail && (
          <div className="border-t border-gray-200 bg-gray-50 p-4">
            <h3 className="mb-3 text-sm font-medium text-gray-900">Tag: {selectedDetail.label}</h3>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-md border border-gray-200 bg-white">
                <div className="border-b border-gray-200 px-3 py-2 text-xs font-medium text-gray-600">
                  Raw chunks ({selectedDetail.raw_chunks.length})
                </div>
                {selectedDetail.raw_chunks.length ? (
                  <ul className="max-h-64 divide-y divide-gray-100 overflow-auto text-sm">
                    {selectedDetail.raw_chunks.map((chunk) => (
                      <li key={`${chunk.source}-${chunk.chunk_index}`} className="px-3 py-2">
                        <code className="text-xs">{chunk.source}</code>
                        <span className="block text-xs text-gray-500">chunk {chunk.chunk_index}</span>
                        {chunk.topics?.length > 0 && (
                          <p className="text-xs text-gray-600">Topics: {chunk.topics.join(', ')}</p>
                        )}
                        <p className="text-xs text-gray-500">{chunk.preview}…</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-3 py-4 text-sm text-gray-500">None</p>
                )}
              </div>

              <div className="rounded-md border border-gray-200 bg-white">
                <div className="border-b border-gray-200 px-3 py-2 text-xs font-medium text-gray-600">
                  Pages ({selectedDetail.pages.length})
                </div>
                {selectedDetail.pages.length ? (
                  <ul className="max-h-64 divide-y divide-gray-100 overflow-auto text-sm">
                    {selectedDetail.pages.map((page) => (
                      <li key={page.path}>
                        <button
                          type="button"
                          onClick={() => openPageDetail(page.path)}
                          className="flex w-full flex-col gap-0.5 px-3 py-2 text-left hover:bg-gray-50">
                          <span className="font-medium text-gray-900">{page.title}</span>
                          <span className="font-mono text-xs text-gray-500">{page.path}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-3 py-4 text-sm text-gray-500">None</p>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
