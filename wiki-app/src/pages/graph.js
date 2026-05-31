import React from 'react';
import Layout from '@theme/Layout';
import WikiGraph from '@site/src/components/WikiGraph';
import styles from './graph.module.css';

export default function GraphPage() {
  return (
    <Layout title="Topic Graph" description="Interactive map of wiki topics and cross-links">
      <main className={styles.page}>
        <header className={styles.header}>
          <h1>Topic Graph</h1>
          <p>
            Nodes are topics from <code>index.json</code>; edges are cross-links between pages.
            Click a node to open that topic.
          </p>
        </header>
        <WikiGraph />
      </main>
    </Layout>
  );
}
