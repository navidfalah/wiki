import React from 'react';
import Layout from '@theme/Layout';
import ResourcesExplorer from '@site/src/components/ResourcesExplorer';
import PageShell from '@site/src/components/PageShell';
import PageHeader from '@site/src/components/PageHeader';

export default function ResourcesPage() {
  return (
    <Layout title="Resources" description="Every cited source, browsable independently of any one page">
      <PageShell wide>
        <PageHeader
          title="Resources"
          description="Sources cited across the wiki, deduped into one list — open any resource on its own to see every page that references it."
        />
        <ResourcesExplorer />
      </PageShell>
    </Layout>
  );
}
