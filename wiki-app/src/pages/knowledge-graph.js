import React from 'react';
import Layout from '@theme/Layout';
import KnowledgeGraphExplorer from '@site/src/components/KnowledgeGraphExplorer';
import PageShell from '@site/src/components/PageShell';
import PageHeader from '@site/src/components/PageHeader';
import NavPill from '@site/src/components/ui/NavPill';

const QUICK_NAV = [
  { label: 'Dashboard', to: '/workspace', description: 'Compiler' },
  { label: 'Topic Graph', to: '/graph', description: 'Visual map' },
  { label: 'Analytics', to: '/analytics', description: 'Audit & tags' },
];

export default function KnowledgeGraphPage() {
  return (
    <Layout
      title="Knowledge Graph Explorer"
      description="Browse topic cross-links and edit manual connection rules">
      <PageShell wide>
        <PageHeader
          eyebrow="Link management"
          title="Knowledge Graph Explorer"
          description={
            <>
              Topics come from{' '}
              <code className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-sm text-slate-700">
                index.json
              </code>
              . Cross-links are detected from compiled markdown; add{' '}
              <strong className="font-medium text-slate-700">require</strong> or{' '}
              <strong className="font-medium text-slate-700">block</strong> rules saved to{' '}
              <code className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-sm text-slate-700">
                data/link_overrides.json
              </code>{' '}
              for the next linker run.
            </>
          }
          breadcrumbs={[
            { label: 'Home', to: '/' },
            { label: 'Knowledge Graph' },
          ]}
          actions={QUICK_NAV.map((item) => (
            <NavPill key={item.to} {...item} />
          ))}
        />
        <KnowledgeGraphExplorer />
      </PageShell>
    </Layout>
  );
}
