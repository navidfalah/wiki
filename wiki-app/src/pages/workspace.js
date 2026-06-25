import React, { useEffect, useState } from 'react';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import DataWorkspace from '@site/src/components/DataWorkspace';
import LiveBuild from '@site/src/components/LiveBuild';
import PageShell from '@site/src/components/PageShell';
import PageHeader from '@site/src/components/PageHeader';
import { DEFAULT_WIKI_API_URL, fetchAnalytics } from '@site/src/utils/wikiApi';

export default function WorkspacePage() {
  const { siteConfig } = useDocusaurusContext();
  const apiBase = siteConfig.customFields?.wikiApiUrl ?? DEFAULT_WIKI_API_URL;

  const [refreshToken, setRefreshToken] = useState(0);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    let cancelled = false;
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
      });
    return () => {
      cancelled = true;
    };
  }, [apiBase, refreshToken]);

  const summary = metrics
    ? `${metrics.raw_files_processed ?? 0} of ${metrics.raw_files_total ?? 0} raw files processed · ${metrics.wiki_pages_created ?? 0} wiki pages · ${metrics.dead_links ?? 0} dead links`
    : 'Start the API server (port 8000) to see live stats.';

  return (
    <Layout title="Dashboard" description="Compile raw notes into wiki pages">
      <PageShell>
        <PageHeader
          title="Dashboard"
          description="Run the compiler, then browse raw files and their wiki output."
        />

        <p className="mb-6 text-sm text-gray-600">{summary}</p>

        <div className="flex flex-col gap-6">
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
