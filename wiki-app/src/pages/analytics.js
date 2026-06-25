import React from 'react';
import Layout from '@theme/Layout';
import AnalyticsAudit from '@site/src/components/AnalyticsAudit';
import PageShell from '@site/src/components/PageShell';
import PageHeader from '@site/src/components/PageHeader';

export default function AnalyticsPage() {
  return (
    <Layout title="Analytics" description="Wiki compiler stats and audits">
      <PageShell wide>
        <PageHeader
          title="Analytics"
          description="Counts, broken links, and tags from the last compile."
        />
        <AnalyticsAudit />
      </PageShell>
    </Layout>
  );
}
