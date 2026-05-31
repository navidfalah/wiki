import React, { useState } from 'react';
import Layout from '@theme/Layout';
import DataWorkspace from '@site/src/components/DataWorkspace';
import LiveBuild from '@site/src/components/LiveBuild';
import styles from './workspace.module.css';

export default function WorkspacePage() {
  const [refreshToken, setRefreshToken] = useState(0);

  return (
    <Layout
      title="Dashboard"
      description="Run the compiler and browse raw sources alongside synthesized wiki pages">
      <main className={styles.page}>
        <header className={styles.header}>
          <h1>Dashboard</h1>
          <p>
            Run the compiler pipeline, then inspect raw junk data alongside the
            synthesized markdown pages it produces.
          </p>
        </header>
        <LiveBuild
          onComplete={(result) => {
            if (result?.success) {
              setRefreshToken((value) => value + 1);
            }
          }}
        />
        <DataWorkspace refreshToken={refreshToken} />
      </main>
    </Layout>
  );
}
