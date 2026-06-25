import React from 'react';
import Layout from '@theme/Layout';
import WikiGraph from '@site/src/components/WikiGraph';
import PageShell from '@site/src/components/PageShell';
import PageHeader from '@site/src/components/PageHeader';

export default function GraphPage() {
  return (
    <Layout title="Topic Graph" description="Wiki topics and links">
      <PageShell wide>
        <PageHeader
          title="Topic graph"
          description="Each node is a wiki topic. Lines show links between pages. Click a node to open it."
        />
        <WikiGraph />
      </PageShell>
    </Layout>
  );
}
