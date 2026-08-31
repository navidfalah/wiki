import React, { useCallback, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { DEFAULT_WIKI_API_URL, fetchResources } from '@site/src/utils/wikiApi';

const TYPE_FILTERS = ['all', 'text', 'email', 'image', 'file'];

const TRUST_STYLES = {
  Unverified: 'bg-gray-100 text-gray-600',
  Low: 'bg-amber-50 text-amber-700',
  Medium: 'bg-blue-50 text-blue-700',
  High: 'bg-emerald-50 text-emerald-700',
  Verified: 'bg-emerald-100 text-emerald-800',
};

function TrustBadge({ label }) {
  return (
    <span className={clsx('rounded-full px-2 py-0.5 text-xs font-medium', TRUST_STYLES[label] ?? TRUST_STYLES.Unverified)}>
      {label}
    </span>
  );
}

function ResourceDetail({ resource, onClose }) {
  return (
    <div className="space-y-4">
      <button type="button" onClick={onClose} className="text-sm text-gray-600 hover:text-gray-900">
        ← Back to resources
      </button>

      <div>
        <h2 className="break-all text-base font-medium text-gray-900">{resource.source}</h2>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-gray-200 px-2 py-0.5 text-xs text-gray-600">
            {resource.source_type}
          </span>
          <TrustBadge label={resource.trust} />
          <span className="text-xs text-gray-400">
            Cited by {resource.citation_count} page{resource.citation_count === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-700">Cited independently by</h3>
        <ul className="mt-2 space-y-1">
          {resource.citing_pages.map((page) => (
            <li key={page.doc_path}>
              <a
                href={`/docs/${page.doc_path.replace(/\.md$/, '')}`}
                className="text-sm text-gray-900 underline decoration-gray-300 underline-offset-2 hover:decoration-gray-900">
                {page.title}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {resource.preview && (
        <div className="rounded-md border border-gray-200">
          <div className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700">
            Source preview
          </div>
          <pre className="max-h-96 overflow-auto p-3 font-mono text-xs whitespace-pre-wrap text-gray-800">
            {resource.preview}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function ResourcesExplorer() {
  const { siteConfig } = useDocusaurusContext();
  const apiBase = siteConfig.customFields?.wikiApiUrl ?? DEFAULT_WIKI_API_URL;

  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchResources({}, apiBase);
      setResources(data.resources ?? []);
    } catch {
      setError(`Cannot reach API at ${apiBase}. Run: cd compiler && ./run_server.sh`);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    let result = resources;
    if (typeFilter !== 'all') {
      result = result.filter((item) => item.source_type === typeFilter);
    }
    const needle = search.trim().toLowerCase();
    if (needle) {
      result = result.filter((item) => item.source.toLowerCase().includes(needle));
    }
    return result;
  }, [resources, search, typeFilter]);

  if (error && resources.length === 0 && !loading) {
    return (
      <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        {error}
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-4 py-3">
        <h2 className="text-base font-semibold text-gray-900">Resources</h2>
        <p className="text-sm text-gray-500">
          Every source cited anywhere in the wiki, deduped to one entry — browse and reuse each
          one independently of whichever page first cited it.
        </p>
      </div>

      <div className="px-4 py-3">
        {selected ? (
          <ResourceDetail resource={selected} onClose={() => setSelected(null)} />
        ) : (
          <>
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                {TYPE_FILTERS.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setTypeFilter(type)}
                    className={clsx(
                      'rounded-md px-3 py-1 text-sm capitalize',
                      typeFilter === type
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-600 hover:bg-gray-100',
                    )}>
                    {type}
                  </button>
                ))}
              </div>
              <input
                type="search"
                placeholder="Search sources…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm sm:max-w-xs"
              />
            </div>

            {loading ? (
              <p className="py-8 text-center text-sm text-gray-500">Loading resources…</p>
            ) : filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">
                No cited sources yet. Compile the wiki to populate references.
              </p>
            ) : (
              <ul className="max-h-[520px] divide-y divide-gray-100 overflow-auto rounded-md border border-gray-200">
                {filtered.map((resource) => (
                  <li key={resource.source}>
                    <button
                      type="button"
                      onClick={() => setSelected(resource)}
                      className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-gray-50">
                      <div className="min-w-0">
                        <code className="block truncate text-sm text-gray-800">{resource.source}</code>
                        <span className="text-xs text-gray-400">
                          Cited by {resource.citation_count} page{resource.citation_count === 1 ? '' : 's'}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-xs text-gray-500">{resource.source_type}</span>
                        <TrustBadge label={resource.trust} />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {error && resources.length > 0 && (
        <p className="border-t border-gray-200 px-4 py-3 text-sm text-red-700">{error}</p>
      )}
    </section>
  );
}
