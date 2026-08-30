import React, { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { PrimaryButton } from '@site/src/components/ui/Button';
import {
  DEFAULT_WIKI_API_URL,
  fetchChatStatus,
  sendChatMessage,
} from '@site/src/utils/wikiApi';

const MODE_LABELS = {
  generated: 'Answered from the wiki',
  extractive: 'Closest matches (no LLM configured)',
  no_match: 'No match found',
  empty: 'Nothing to search yet',
};

function Sources({ sources }) {
  if (!sources || sources.length === 0) return null;
  return (
    <ul className="mt-2 flex flex-wrap gap-2">
      {sources.map((source) => (
        <li key={source.doc_path}>
          <a
            href={`/docs/${source.doc_path.replace(/\.md$/, '')}`}
            className="rounded-full border border-gray-200 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50">
            {source.title}
            {source.heading && source.heading !== source.title ? ` · ${source.heading}` : ''}
          </a>
        </li>
      ))}
    </ul>
  );
}

function Message({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={clsx('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={clsx(
          'max-w-[85%] rounded-lg px-4 py-2.5 text-sm whitespace-pre-wrap',
          isUser ? 'bg-gray-900 text-white' : 'border border-gray-200 bg-white text-gray-800',
        )}>
        {!isUser && message.mode && (
          <div className="mb-1 text-xs font-medium text-gray-400">
            {MODE_LABELS[message.mode] ?? message.mode}
          </div>
        )}
        {message.content}
        {!isUser && <Sources sources={message.sources} />}
      </div>
    </div>
  );
}

export default function ChatEngine() {
  const { siteConfig } = useDocusaurusContext();
  const apiBase = siteConfig.customFields?.wikiApiUrl ?? DEFAULT_WIKI_API_URL;

  const [status, setStatus] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    fetchChatStatus(apiBase)
      .then(setStatus)
      .catch(() => setStatus(null));
  }, [apiBase]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const nextMessages = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setInput('');
    setSending(true);
    setError(null);

    try {
      const history = nextMessages
        .slice(-6)
        .map(({ role, content }) => ({ role, content }));
      const data = await sendChatMessage(text, history, apiBase);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.answer, sources: data.sources, mode: data.mode },
      ]);
    } catch {
      setError(`Cannot reach API at ${apiBase}. Run: cd compiler && ./run_server.sh`);
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="flex h-[70vh] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-4 py-3">
        <h2 className="text-base font-semibold text-gray-900">Ask the wiki</h2>
        <p className="text-sm text-gray-500">
          Retrieval-augmented chat over the compiled wiki — every answer cites the pages it came
          from.
        </p>
        {status && (
          <p className="mt-1 text-xs text-gray-400">
            {status.corpus_pages} page{status.corpus_pages === 1 ? '' : 's'} indexed ·{' '}
            {status.llm_available ? 'LLM answers enabled' : 'extractive mode (no LLM configured)'}
          </p>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">
            Ask a question about anything the compiler has ingested — notes, emails, specs.
          </p>
        ) : (
          messages.map((message, index) => <Message key={index} message={message} />)
        )}
        {sending && (
          <div className="flex justify-start">
            <div className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-400">
              Thinking…
            </div>
          </div>
        )}
      </div>

      {error && <p className="border-t border-gray-200 px-4 py-2 text-sm text-red-700">{error}</p>}

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-gray-200 px-4 py-3">
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask a question…"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <PrimaryButton type="submit" disabled={sending || !input.trim()}>
          Send
        </PrimaryButton>
      </form>
    </section>
  );
}
