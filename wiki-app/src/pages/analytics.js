import React from 'react';
import Layout from '@theme/Layout';
import AnalyticsAudit from '@site/src/components/AnalyticsAudit';
import styles from './analytics.module.css';

export default function AnalyticsPage() {
  return (
    <Layout
      title="Analytics & Audit"
      description="Wiki pipeline metrics, dead-link audit, and tag explorer">
      <main className={styles.page}>
        <header className={styles.header}>
          <h1>Analytics & Audit</h1>
          <p>
            Key compiler metrics, dead-link findings, and an interactive tag explorer across
            raw chunks and compiled wiki pages.
          </p>
        </header>
        <AnalyticsAudit />
      </main>
    </Layout>
  );
}
