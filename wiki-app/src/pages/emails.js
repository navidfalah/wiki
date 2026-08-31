import React from 'react';
import Layout from '@theme/Layout';
import EmailEngine from '@site/src/components/EmailEngine';
import PageShell from '@site/src/components/PageShell';
import PageHeader from '@site/src/components/PageHeader';

export default function EmailsPage() {
  return (
    <Layout title="Emails" description="Email knowledge engine — ingested threads as knowledge">
      <PageShell wide>
        <PageHeader
          title="Emails"
          description="Ingested .eml threads treated as first-class knowledge sources — search, read, and see what each one contributed to the wiki."
        />
        <EmailEngine />
      </PageShell>
    </Layout>
  );
}
