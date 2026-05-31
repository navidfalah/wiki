import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import DataWorkspace from '@site/src/components/DataWorkspace';
import LiveBuild from '@site/src/components/LiveBuild';
import { DEFAULT_WIKI_API_URL, fetchAnalytics } from '@site/src/utils/wikiApi';

const QUICK_NAV = [
  { label: 'Topic Graph', to: '/graph', description: 'Visual map' },
  { label: 'Knowledge Graph', to: '/knowledge-graph', description: 'Connections' },
  { label: 'Analytics', to: '/analytics', description: 'Audit & tags' },
];

function StatCard({ label, value, sublabel, tone = 'neutral', loading }) {
  const toneClasses = {
    neutral: 'text-neutral-900',
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
    sky: 'text-sky-600',
    red: 'text-red-600',
  };

  return (
    <div className="rounded-2xl border border-neutral-200/70 bg-white px-5 py-4 shadow-card transition-shadow duration-200 hover:shadow-card-hover">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
        {label}
      </p>
      {loading ? (
        <div className="mt-2 h-8 w-16 animate-shimmer rounded-lg bg-shimmer-gradient bg-[length:200%_100%]" />
      ) : (
        <p className={clsx('mt-1 text-2xl font-semibold tabular-nums tracking-tight', toneClasses[tone])}>
          {value ?? '—'}
        </p>
      )}
      {sublabel && !loading && (
        <p className="mt-0.5 text-xs text-neutral-500">{sublabel}</p>
      )}
    </div>
  );
}

export default function WorkspacePage() {
  const { siteConfig } = useDocusaurusContext();
  const apiBase = siteConfig.customFields?.wikiApiUrl ?? DEFAULT_WIKI_API_URL;

  const [refreshToken, setRefreshToken] = useState(0);
  const [metrics, setMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setMetricsLoading(true);

    fetchAnalytics(apiBase)
      .then((data) => {
        if (!cancelled) {
          setMetrics(data.metrics ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMetrics(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setMetricsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [apiBase, refreshToken]);

  return (
    <Layout
      title="Dashboard"
      description="Run the compiler and browse raw sources alongside synthesized wiki pages">
      <main className="min-h-[calc(100vh-60px)] bg-neutral-50/60">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <header className="mb-10 animate-fade-in">
            <nav className="mb-4 flex items-center gap-2 text-xs text-neutral-400">
              <Link to="/" className="transition hover:text-neutral-600">
                Home
              </Link>
              <span aria-hidden>/</span>
              <span className="font-medium text-neutral-600">Dashboard</span>
            </nav>

            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-pulse-soft rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Compiler control panel
                  </p>
                </div>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
                  Dashboard
                </h1>
                <p className="mt-2 max-w-xl text-base leading-relaxed text-neutral-500">
                  Run the pipeline, stream live logs, and inspect how raw sources become
                  linked wiki pages.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {QUICK_NAV.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="group flex items-center gap-2 rounded-xl border border-neutral-200/80 bg-white px-4 py-2.5 shadow-card transition-all duration-200 hover:border-neutral-300 hover:shadow-card-hover focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                    <span className="text-sm font-medium text-neutral-800 group-hover:text-neutral-900">
                      {item.label}
                    </span>
                    <span className="hidden text-xs text-neutral-400 sm:inline">
                      {item.description}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </header>

          <section className="mb-8 animate-fade-in" aria-label="Pipeline metrics">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
              <StatCard
                label="Raw files"
                value={metrics?.raw_files_total}
                sublabel="in data/raw"
                loading={metricsLoading}
              />
              <StatCard
                label="Processed"
                value={metrics?.raw_files_processed}
                tone="emerald"
                loading={metricsLoading}
              />
              <StatCard
                label="Wiki pages"
                value={metrics?.wiki_pages_created}
                tone="sky"
                loading={metricsLoading}
              />
              <StatCard
                label="Cross-links"
                value={metrics?.cross_links_established}
                tone="neutral"
                loading={metricsLoading}
              />
              <StatCard
                label="Dead links"
                value={metrics?.dead_links}
                tone={metrics?.dead_links > 0 ? 'red' : 'neutral'}
                loading={metricsLoading}
              />
            </div>
          </section>

          <div className="flex flex-col gap-8">
            <LiveBuild
              onComplete={(result) => {
                if (result?.success) {
                  setRefreshToken((value) => value + 1);
                }
              }}
            />
            <DataWorkspace refreshToken={refreshToken} />
          </div>
        </div>
      </main>
    </Layout>
  );
}
