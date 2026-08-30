import React from 'react';
import Layout from '@theme/Layout';
import ChatEngine from '@site/src/components/ChatEngine';
import PageShell from '@site/src/components/PageShell';
import PageHeader from '@site/src/components/PageHeader';

export default function ChatPage() {
  return (
    <Layout title="Chat" description="Ask questions over the compiled wiki with cited answers">
      <PageShell wide>
        <PageHeader
          title="Chat"
          description="A RAG engine over the wiki's own cross-linked pages — ask a question and get an answer grounded in, and cited to, the pages it came from."
        />
        <ChatEngine />
      </PageShell>
    </Layout>
  );
}
