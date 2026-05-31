import React, { useCallback, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Link from '@docusaurus/Link';
import EmptyState from '@site/src/components/ui/EmptyState';
import { Skeleton, SkeletonGrid } from '@site/src/components/ui/Skeleton';
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

const TONE_STYLES = {
  processed: 'border-t-emerald-500',
  pages: 'border-t-sky-500',
  links: 'border-t-violet-500',
  danger: 'border-t-red-500',
  safe: 'border-t-emerald-500',
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

function MetricCard({ label, value, hint, tone = 'processed', onClick, active }) {
  const interactive = Boolean(onClick);
  const className = clsx(
    'w-full rounded-2xl border border-slate-200/80 border-t-[3px] bg-white px-5 py-4 text-left shadow-card transition-all duration-200',
    interactive && 'cursor-pointer hover:-translate-y-0.5 hover:shadow-card-hover focus:outline-none focus:ring-2 focus:ring-emerald-500/25',
    active && 'ring-2 ring-emerald-500/30 shadow-card-hover',
    TONE_STYLES[tone],
  );

  const content = (
    <>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-slate-900">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
      {interactive && (
        <p className="mt-2 text-[11px] font-medium text-emerald-600">Click to explore →</p>
      )}
    </>
  );

  if (interactive) {
    return (
      <button type="button" className={className} onClick={onClick} aria-pressed={active}>
        {content}
      </button>
    );
  }

  return <article className={className}>{content}</article>;
}

function tagCloudSize(count, maxCount) {
  if (maxCount <= 1) {
    return 'text-sm';
  }
  const ratio = count / maxCount;
  if (ratio >= 0.75) {
    return 'text-base font-bold';
  }
  if (ratio >= 0.5) {
    return 'text-sm font-semibold';
  }
  if (ratio >= 0.25) {
    return 'text-sm';
  }
  return 'text-xs';
}

function PageListItem({ page, onSelect, highlight }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(page.path)}
        className={clsx(
          'flex w-full flex-col gap-0.5 px-4 py-3 text-left transition hover:bg-slate-50 focus:outline-none focus:bg-emerald-50/50',
          highlight && 'bg-emerald-50/60 ring-1 ring-inset ring-emerald-200/60',
        )}>
        <span className="text-sm font-medium text-slate-900">{page.title}</span>
        <span className="font-mono text-[11px] text-slate-400">{page.path}</span>
      </button>
    </li>
  );
}

function PagePreviewPanel({ detail, loading, error, highlightLine, onClose }) {
  if (loading) {
    return (
      <section className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-panel">
        <div className="border-b border-slate-100 px-5 py-4">
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-2">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-red-200/80 bg-red-50 px-5 py-6 shadow-card">
        <EmptyState title="Could not load page" hint={error} className="py-4" />
        <SecondaryButton className="mt-4" onClick={onClose}>
          Close preview
        </SecondaryButton>
      </section>
    );
  }

  if (!detail) {
    return null;
  }

  return (
    <section className="animate-fade-in overflow-hidden rounded-2xl border border-emerald-200/60 bg-white shadow-panel">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 bg-emerald-50/30 px-5 py-4">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={onClose}
            className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-emerald-600 transition hover:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 rounded-md">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to list
          </button>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">{detail.title}</h2>
          <p className="mt-0.5 font-mono text-xs text-slate-500">{detail.path}</p>
        </div>
        <Link
          to={docHref(detail)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-emerald-200/80 bg-white px-4 py-2 text-sm font-medium text-emerald-700 shadow-card transition hover:bg-emerald-50">
          Open in wiki
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-0 lg:grid-cols-[minmax(260px,320px)_1fr]">
        <aside className="space-y-4 border-b border-slate-100 px-5 py-5 lg:border-b-0 lg:border-r">
          {detail.id && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">ID</p>
              <p className="mt-1 font-mono text-sm text-slate-700">{detail.id}</p>
            </div>
          )}
          {detail.slug && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Slug</p>
              <p className="mt-1 font-mono text-sm text-slate-700">{detail.slug}</p>
            </div>
          )}
          {detail.tags?.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {detail.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs text-violet-800 ring-1 ring-violet-200/60">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          {detail.links?.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Outgoing links ({detail.links.length})
              </p>
              <ul className="max-h-40 space-y-1 overflow-auto text-xs text-slate-600">
                {detail.links.map((link, index) => (
                  <li key={`${link.href}-${index}`} className="truncate">
                    [{link.text}]({link.href})
                  </li>
                ))}
              </ul>
            </div>
          )}
          {highlightLine != null && (
            <div className="rounded-xl bg-red-50 px-3 py-2 ring-1 ring-red-100">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-red-600">Dead link</p>
              <p className="mt-1 text-xs text-red-800">Line {highlightLine} in this page</p>
            </div>
          )}
        </aside>

        <div className="flex min-h-[280px] flex-col">
          <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3">
            <h3 className="text-sm font-semibold text-slate-900">Markdown preview</h3>
          </div>
          <pre className="flex-1 overflow-auto whitespace-pre-wrap break-words px-5 py-4 font-mono text-xs leading-relaxed text-slate-700">
            {detail.body}
          </pre>
        </div>
      </div>
    </section>
  );
}

function ExplorerPanel({ title, description, onClose, children, loading }) {
  return (
    <section className="animate-fade-in overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-panel">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
        </div>
        <SecondaryButton onClick={onClose}>Close</SecondaryButton>
      </div>
      {loading ? (
        <div className="p-5">
          <Skeleton className="mb-2 h-10 w-full rounded-xl" />
          <Skeleton className="mb-2 h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      ) : (
        children
      )}
    </section>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-9 w-24 rounded-xl" />
      </div>
      <SkeletonGrid count={4} columns="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" />
      <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-panel">
        <Skeleton className="mb-4 h-5 w-32" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 12 }).map((_, index) => (
            <Skeleton
              key={index}
              className={clsx('h-7 rounded-full', ['w-16', 'w-20', 'w-24', 'w-28'][index % 4])}
            />
          ))}
        </div>
      </div>
    </div>
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
      setError(
        `Could not load analytics from ${apiBase}. Start the API with: cd compiler && python server.py`,
      );
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
        setPageDetailError(`Could not load ${docPath} from the API.`);
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
        setError(`Could not load ${panel} data from ${apiBase}.`);
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

  const maxTagCount = useMemo(() => {
    if (!filteredTags.length) {
      return 1;
    }
    return Math.max(...filteredTags.map((item) => item.count));
  }, [filteredTags]);

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
    return <AnalyticsSkeleton />;
  }

  if (error && !data) {
    return (
      <div className="rounded-2xl border border-red-200/80 bg-red-50 px-6 py-8 shadow-card">
        <EmptyState
          title="Could not load analytics"
          hint={error}
          icon={
            <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          }
        />
      </div>
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
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 px-5 py-4 shadow-card">
        <p className="text-sm text-slate-600">
          Click a metric card to browse raw files, generated pages, cross-links, or dead-link sources.
        </p>
        <SecondaryButton onClick={loadAnalytics}>Refresh</SecondaryButton>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">{error}</p>
      )}

      <section aria-label="Pipeline metrics">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Key metrics
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          <MetricCard
            label="Raw Files Processed"
            value={metrics.raw_files_processed ?? 0}
            hint={`${metrics.raw_files_total ?? 0} total in data/raw/`}
            tone="processed"
            active={activePanel === PANEL.raw}
            onClick={() => openPanel(PANEL.raw)}
          />
          <MetricCard
            label="Wiki Pages Created"
            value={metrics.wiki_pages_created ?? 0}
            hint="All markdown pages under wiki-app/docs"
            tone="pages"
            active={activePanel === PANEL.pages}
            onClick={() => openPanel(PANEL.pages)}
          />
          <MetricCard
            label="Cross-Links Established"
            value={metrics.cross_links_established ?? 0}
            hint="Detected links between indexed topics"
            tone="links"
            active={activePanel === PANEL.links}
            onClick={() => openPanel(PANEL.links)}
          />
          <MetricCard
            label="Dead Links Found"
            value={metrics.dead_links ?? 0}
            hint="Click a finding below to inspect the source page"
            tone={metrics.dead_links > 0 ? 'danger' : 'safe'}
            active={activePanel === PANEL.dead}
            onClick={() => openPanel(PANEL.dead)}
          />
        </div>
      </section>

      {selectedPagePath && (
        <PagePreviewPanel
          detail={pageDetail}
          loading={pageDetailLoading}
          error={pageDetailError}
          highlightLine={highlightLine}
          onClose={closePageDetail}
        />
      )}

      {activePanel === PANEL.pages && !selectedPagePath && (
        <ExplorerPanel
          title="Generated wiki pages"
          description={`${docsPages.length} markdown files from the compiler output`}
          onClose={() => setActivePanel(null)}
          loading={panelLoading}>
          <div className="border-b border-slate-100 px-5 py-3">
            <input
              type="search"
              placeholder="Search pages…"
              value={pageSearch}
              onChange={(event) => setPageSearch(event.target.value)}
              className="w-full max-w-md rounded-xl border border-slate-200/80 bg-slate-50/80 py-2 px-4 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          {filteredDocsPages.length ? (
            <ul className="max-h-[420px] divide-y divide-slate-100 overflow-auto">
              {filteredDocsPages.map((page) => (
                <PageListItem key={page.path} page={page} onSelect={openPageDetail} />
              ))}
            </ul>
          ) : (
            <EmptyState title="No pages match" hint="Try a different search." className="py-8" />
          )}
        </ExplorerPanel>
      )}

      {activePanel === PANEL.raw && !selectedPagePath && (
        <ExplorerPanel
          title="Raw source files"
          description={`${metrics.raw_files_processed ?? 0} of ${metrics.raw_files_total ?? 0} processed`}
          onClose={() => setActivePanel(null)}
          loading={panelLoading}>
          {rawFiles.length ? (
            <ul className="max-h-[420px] divide-y divide-slate-100 overflow-auto text-sm">
              {rawFiles.map((file) => (
                <li key={file.path} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                  <code className="text-xs text-slate-800">{file.path}</code>
                  <span
                    className={clsx(
                      'rounded-full px-2.5 py-0.5 text-[10px] font-medium ring-1',
                      file.status === 'Processed'
                        ? 'bg-emerald-50 text-emerald-800 ring-emerald-200/60'
                        : 'bg-amber-50 text-amber-800 ring-amber-200/60',
                    )}>
                    {file.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No raw files" hint="Add files under data/raw/." className="py-8" />
          )}
          <div className="border-t border-slate-100 px-5 py-3">
            <Link to="/workspace" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
              Open Data Workspace for full source preview →
            </Link>
          </div>
        </ExplorerPanel>
      )}

      {activePanel === PANEL.links && !selectedPagePath && (
        <ExplorerPanel
          title="Cross-links between topics"
          description={`${crossLinks.length} link${crossLinks.length === 1 ? '' : 's'} — click a topic to open its page`}
          onClose={() => setActivePanel(null)}
          loading={panelLoading}>
          {crossLinks.length ? (
            <ul className="max-h-[420px] divide-y divide-slate-100 overflow-auto text-sm">
              {crossLinks.map((link) => {
                const sourcePath = topicPathByTitle.get(link.source_topic);
                const targetPath = topicPathByTitle.get(link.target_topic);
                return (
                  <li key={`${link.source_topic}-${link.target_topic}-${link.origin}`} className="px-5 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {sourcePath ? (
                        <button
                          type="button"
                          onClick={() => openPageDetail(sourcePath)}
                          className="font-medium text-emerald-600 hover:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 rounded">
                          {link.source_topic}
                        </button>
                      ) : (
                        <span className="font-medium text-slate-800">{link.source_topic}</span>
                      )}
                      <span className="text-slate-400">→</span>
                      {targetPath ? (
                        <button
                          type="button"
                          onClick={() => openPageDetail(targetPath)}
                          className="font-medium text-emerald-600 hover:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 rounded">
                          {link.target_topic}
                        </button>
                      ) : (
                        <span className="font-medium text-slate-800">{link.target_topic}</span>
                      )}
                      <span
                        className={clsx(
                          'rounded-full px-2 py-0.5 text-[10px] ring-1',
                          link.origin === 'override'
                            ? 'bg-violet-50 text-violet-700 ring-violet-200/60'
                            : 'bg-sky-50 text-sky-700 ring-sky-200/60',
                        )}>
                        {link.origin}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState title="No cross-links" hint="Run the compiler to index topics." className="py-8" />
          )}
        </ExplorerPanel>
      )}

      {data?.dead_links?.length > 0 && (activePanel === PANEL.dead || activePanel === null) && (
        <section
          className={clsx(
            'overflow-hidden rounded-2xl border bg-white shadow-panel',
            activePanel === PANEL.dead ? 'border-red-300/80 ring-2 ring-red-200/40' : 'border-red-200/60',
          )}>
          <div className="border-b border-red-100 bg-red-50/50 px-5 py-4">
            <h2 className="text-sm font-semibold text-red-800">Dead link audit</h2>
            <p className="mt-0.5 text-xs text-red-600/80">
              {data.dead_links.length} broken reference{data.dead_links.length === 1 ? '' : 's'} — click a row to
              preview the source page
            </p>
          </div>
          <ul className="divide-y divide-slate-100 px-2 py-2 text-sm">
            {data.dead_links.map((item) => {
              const key = `${item.source}-${item.line}-${item.href}`;
              const isSelected = selectedDeadLinkKey === key;
              return (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => handleDeadLinkClick(item)}
                    className={clsx(
                      'w-full rounded-xl px-3 py-3 text-left leading-relaxed text-slate-700 transition hover:bg-red-50/50 focus:outline-none focus:ring-2 focus:ring-red-300/30',
                      isSelected && 'bg-red-50 ring-1 ring-red-200/80',
                    )}>
                    <code className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700">
                      {item.source}:{item.line}
                    </code>{' '}
                    — [{item.text}]({item.href}) → missing{' '}
                    <code className="rounded-md bg-red-50 px-1.5 py-0.5 font-mono text-xs text-red-700">
                      {item.missing}
                    </code>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-panel">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Tag explorer</h2>
          <div className="relative w-full sm:w-64">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="search"
              placeholder="Filter tags…"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="w-full rounded-xl border border-slate-200/80 bg-slate-50/80 py-2 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 px-5 py-4">
          {filteredTags.length ? (
            filteredTags.map((item) => {
              const isActive = selectedTag === item.tag;
              return (
                <button
                  key={item.tag}
                  type="button"
                  className={clsx(
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20',
                    tagCloudSize(item.count, maxTagCount),
                    isActive
                      ? 'border-emerald-400/60 bg-emerald-50 text-emerald-800 shadow-card'
                      : 'border-slate-200/80 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white',
                  )}
                  onClick={() => {
                    setSelectedTag(item.tag);
                    closePageDetail();
                  }}
                  title={`${item.raw_count} raw chunks · ${item.page_count} pages`}>
                  {item.label}
                  <span className="text-[10px] tabular-nums opacity-70">{item.count}</span>
                </button>
              );
            })
          ) : (
            <EmptyState
              title="No tags match your filter"
              hint="Try a different search term."
              className="w-full py-6"
            />
          )}
        </div>

        {selectedDetail && (
          <div className="border-t border-slate-100 bg-slate-50/40 px-5 py-5">
            <h3 className="mb-4 text-sm font-semibold text-slate-900">
              Tag: <span className="text-emerald-600">{selectedDetail.label}</span>
            </h3>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card">
                <div className="border-b border-slate-100 px-4 py-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Raw chunks ({selectedDetail.raw_chunks.length})
                  </h4>
                </div>
                {selectedDetail.raw_chunks.length ? (
                  <ul className="divide-y divide-slate-100">
                    {selectedDetail.raw_chunks.map((chunk) => (
                      <li key={`${chunk.source}-${chunk.chunk_index}`} className="px-4 py-3">
                        <code className="text-xs text-slate-800">{chunk.source}</code>
                        <span className="mt-0.5 block text-[11px] text-slate-400">
                          chunk {chunk.chunk_index}
                        </span>
                        {chunk.topics?.length > 0 && (
                          <p className="mt-1 text-xs text-slate-600">
                            Topics: {chunk.topics.join(', ')}
                          </p>
                        )}
                        <p className="mt-1 text-xs leading-relaxed text-slate-500">{chunk.preview}…</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState
                    title="No raw chunks"
                    hint="No raw chunks tagged with this label."
                    className="py-6"
                  />
                )}
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card">
                <div className="border-b border-slate-100 px-4 py-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Compiled pages ({selectedDetail.pages.length})
                  </h4>
                </div>
                {selectedDetail.pages.length ? (
                  <ul className="divide-y divide-slate-100">
                    {selectedDetail.pages.map((page) => (
                      <li key={page.path}>
                        <button
                          type="button"
                          onClick={() => openPageDetail(page.path)}
                          className="flex w-full flex-col gap-0.5 px-4 py-3 text-left transition hover:bg-emerald-50/50 focus:outline-none focus:bg-emerald-50/50">
                          <span className="text-sm font-medium text-emerald-600">{page.title}</span>
                          <span className="font-mono text-[11px] text-slate-400">{page.path}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState
                    title="No compiled pages"
                    hint="No compiled pages tagged with this label."
                    className="py-6"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
