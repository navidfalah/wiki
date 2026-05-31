import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import DataWorkspace from '@site/src/components/DataWorkspace';
import LiveBuild from '@site/src/components/LiveBuild';
import PageShell, { SectionLabel } from '@site/src/components/PageShell';
import PageHeader from '@site/src/components/PageHeader';
import NavPill from '@site/src/components/ui/NavPill';
import { DEFAULT_WIKI_API_URL, fetchAnalytics } from '@site/src/utils/wikiApi';

const QUICK_NAV = [
  { label: 'Topic Graph', to: '/graph', description: 'Visual map' },
  { label: 'Knowledge Graph', to: '/knowledge-graph', description: 'Connections' },
  { label: 'Analytics', to: '/analytics', description: 'Audit & tags' },
];

function StatCard({ label, value, sublabel, tone = 'neutral', loading }) {
  const toneClasses = {
    neutral: 'text-slate-900',
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
    sky: 'text-sky-600',
    red: 'text-red-600',
  };

  return (
    <div className="group rounded-2xl border border-slate-200/80 bg-white px-5 py-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-card-hover">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
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
        <p className="mt-0.5 text-xs text-slate-500">{sublabel}</p>
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
      <PageShell>
        <PageHeader
          eyebrow="Compiler control panel"
          title="Dashboard"
          description="Run the pipeline, stream live logs, and inspect how raw sources become linked wiki pages."
          live
          breadcrumbs={[
            { label: 'Home', to: '/' },
            { label: 'Dashboard' },
          ]}
          actions={QUICK_NAV.map((item) => (
            <NavPill key={item.to} {...item} />
          ))}
        />

        <section className="mb-8 animate-fade-in" aria-label="Pipeline metrics">
          <SectionLabel className="mb-4">Pipeline overview</SectionLabel>
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
      </PageShell>
    </Layout>
  );
}
