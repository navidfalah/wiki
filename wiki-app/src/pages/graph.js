import React from 'react';
import Layout from '@theme/Layout';
import WikiGraph from '@site/src/components/WikiGraph';
import PageShell from '@site/src/components/PageShell';
import PageHeader from '@site/src/components/PageHeader';
import NavPill from '@site/src/components/ui/NavPill';

const QUICK_NAV = [
  { label: 'Dashboard', to: '/workspace', description: 'Compiler' },
  { label: 'Analytics', to: '/analytics', description: 'Audit & tags' },
  { label: 'Knowledge Graph', to: '/knowledge-graph', description: 'Connections' },
];

export default function GraphPage() {
  return (
    <Layout title="Topic Graph" description="Interactive map of wiki topics and cross-links">
      <PageShell wide>
        <PageHeader
          eyebrow="Visual explorer"
          title="Topic Graph"
          description={
            <>
              Nodes are topics from{' '}
              <code className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-sm text-slate-700">
                index.json
              </code>
              ; edges are cross-links between pages. Click a node to open that topic.
            </>
          }
          breadcrumbs={[
            { label: 'Home', to: '/' },
            { label: 'Topic Graph' },
          ]}
          actions={QUICK_NAV.map((item) => (
            <NavPill key={item.to} {...item} />
          ))}
        />
        <WikiGraph />
      </PageShell>
    </Layout>
  );
}
