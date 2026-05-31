import React from 'react';
import Layout from '@theme/Layout';
import KnowledgeGraphExplorer from '@site/src/components/KnowledgeGraphExplorer';
import styles from './knowledge-graph.module.css';

export default function KnowledgeGraphPage() {
  return (
    <Layout
      title="Knowledge Graph Explorer"
      description="Browse topic cross-links and edit manual connection rules">
      <main className={styles.page}>
        <header className={styles.header}>
          <h1>Knowledge Graph Explorer</h1>
          <p>
            Topics come from <code>index.json</code>. Cross-links are detected from compiled
            markdown; you can add <strong>require</strong> or <strong>block</strong> rules that
            are saved to <code>data/link_overrides.json</code> for the next linker run.
          </p>
        </header>
        <KnowledgeGraphExplorer />
      </main>
    </Layout>
  );
}
