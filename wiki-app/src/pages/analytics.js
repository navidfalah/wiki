import React from 'react';
import Layout from '@theme/Layout';
import AnalyticsAudit from '@site/src/components/AnalyticsAudit';
import PageShell from '@site/src/components/PageShell';
import PageHeader from '@site/src/components/PageHeader';
import NavPill from '@site/src/components/ui/NavPill';

const QUICK_NAV = [
  { label: 'Dashboard', to: '/workspace', description: 'Compiler' },
  { label: 'Topic Graph', to: '/graph', description: 'Visual map' },
  { label: 'Knowledge Graph', to: '/knowledge-graph', description: 'Connections' },
];

export default function AnalyticsPage() {
  return (
    <Layout
      title="Analytics & Audit"
      description="Wiki pipeline metrics, dead-link audit, and tag explorer">
      <PageShell wide>
        <PageHeader
          eyebrow="Pipeline intelligence"
          title="Analytics & Audit"
          description="Key compiler metrics, dead-link findings, and an interactive tag explorer across raw chunks and compiled wiki pages."
          breadcrumbs={[
            { label: 'Home', to: '/' },
            { label: 'Analytics' },
          ]}
          actions={QUICK_NAV.map((item) => (
            <NavPill key={item.to} {...item} />
          ))}
        />
        <AnalyticsAudit />
      </PageShell>
    </Layout>
  );
}
