import React, { useCallback, useEffect, useState } from 'react';
import Layout from '@theme/Layout';
import useApiBase from '@site/src/utils/useApiBase';
import DataWorkspace from '@site/src/components/DataWorkspace';
import LiveBuild from '@site/src/components/LiveBuild';
import SourceFolders from '@site/src/components/SourceFolders';
import PageShell from '@site/src/components/PageShell';
import PageHeader from '@site/src/components/PageHeader';
import { FolderIcon, DocumentIcon, ArrowRightIcon, AlertIcon } from '@site/src/components/ui/Icons';
import { fetchAnalytics } from '@site/src/utils/wikiApi';

function StatCard({ icon, label, value, tone }) {
  const tones = {
    source: 'bg-source-bg text-source',
    generated: 'bg-generated-bg text-generated',
    neutral: 'bg-gray-100 text-gray-600',
    warn: 'bg-red-50 text-red-600',
  };
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-card">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tones[tone]}`}>
        {icon}
      </span>
      <div>
        <p className="text-lg font-semibold leading-none text-gray-900">{value}</p>
        <p className="mt-1 text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}

export default function WorkspacePage() {
  const [apiBase] = useApiBase();

  const [refreshToken, setRefreshToken] = useState(0);
  const [metrics, setMetrics] = useState(null);

  const loadMetrics = useCallback(() => {
    fetchAnalytics(apiBase)
      .then((data) => setMetrics(data.metrics ?? null))
      .catch(() => setMetrics(null));
  }, [apiBase]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics, refreshToken]);

  return (
    <Layout title="Dashboard" description="Compile raw notes into wiki pages">
      <PageShell wide>
        <PageHeader
          title="Dashboard"
          description="Point the compiler at your source folders, run it, and browse what came out."
        />

        {metrics && (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              icon={<FolderIcon size={18} />}
              tone="source"
              value={`${metrics.raw_files_processed ?? 0} / ${metrics.raw_files_total ?? 0}`}
              label="Raw files processed"
            />
            <StatCard
              icon={<DocumentIcon size={18} />}
              tone="generated"
              value={metrics.wiki_pages_created ?? 0}
              label="Wiki pages created"
            />
            <StatCard
              icon={<ArrowRightIcon size={18} />}
              tone="neutral"
              value={metrics.cross_links_established ?? 0}
              label="Cross-links"
            />
            <StatCard
              icon={<AlertIcon size={18} />}
              tone={metrics.dead_links ? 'warn' : 'neutral'}
              value={metrics.dead_links ?? 0}
              label="Dead links"
            />
          </div>
        )}

        <div className="flex flex-col gap-6">
          <LiveBuild
            onComplete={(result) => {
              if (result?.success) {
                setRefreshToken((value) => value + 1);
              }
            }}
          />
          <SourceFolders refreshToken={refreshToken} onChanged={loadMetrics} />
          <DataWorkspace refreshToken={refreshToken} />
        </div>
      </PageShell>
    </Layout>
  );
}
