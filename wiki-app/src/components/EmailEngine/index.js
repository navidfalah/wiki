import React, { useCallback, useEffect, useMemo, useState } from 'react';
import useApiBase from '@site/src/utils/useApiBase';
import clsx from 'clsx';
import {
  fetchEmailDetail,
  fetchEmails,
} from '@site/src/utils/wikiApi';

const TRUST_STYLES = {
  unverified: 'bg-gray-100 text-gray-600',
  low: 'bg-amber-50 text-amber-700',
  medium: 'bg-blue-50 text-blue-700',
  high: 'bg-emerald-50 text-emerald-700',
  verified: 'bg-emerald-100 text-emerald-800',
};

function TrustBadge({ level }) {
  return (
    <span
      className={clsx(
        'rounded-full px-2 py-0.5 text-xs font-medium capitalize',
        TRUST_STYLES[level] ?? TRUST_STYLES.unverified,
      )}>
      {level}
    </span>
  );
}

function EmailDetail({ detail, onClose }) {
  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onClose}
        className="text-sm text-gray-600 hover:text-gray-900">
        ← Back to inbox
      </button>

      <div>
        <h2 className="text-base font-medium text-gray-900">{detail.subject}</h2>
        <dl className="mt-2 grid grid-cols-[3rem_1fr] gap-x-2 gap-y-1 text-sm text-gray-600">
          <dt className="text-gray-400">From</dt>
          <dd className="break-all">{detail.from || '—'}</dd>
          <dt className="text-gray-400">To</dt>
          <dd className="break-all">{(detail.to || []).join(', ') || '—'}</dd>
          {detail.cc?.length > 0 && (
            <>
              <dt className="text-gray-400">Cc</dt>
              <dd className="break-all">{detail.cc.join(', ')}</dd>
            </>
          )}
          <dt className="text-gray-400">Date</dt>
          <dd>{detail.date || '—'}</dd>
        </dl>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <TrustBadge level={detail.trust?.level} />
          <span className="text-xs text-gray-400">{detail.trust?.reason}</span>
        </div>
      </div>

      {detail.attachments?.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700">Attachments</h3>
          <ul className="mt-1 list-disc pl-5 text-sm text-gray-600">
            {detail.attachments.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-md border border-gray-200">
        <div className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700">
          Body
        </div>
        <pre className="max-h-96 overflow-auto p-3 font-mono text-xs whitespace-pre-wrap text-gray-800">
          {detail.body || '(empty body)'}
        </pre>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-700">
          Knowledge extracted ({detail.topics?.length ?? 0} topic
          {detail.topics?.length === 1 ? '' : 's'})
        </h3>
        {detail.topics?.length > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-2">
            {detail.topics.map((topic) => (
              <li
                key={topic}
                className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-700">
                {topic}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-gray-500">
            Not compiled into the wiki yet. Run the compiler to extract topics from this
            message.
          </p>
        )}
      </div>

      {detail.synthesized_pages?.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700">Wiki pages built from this thread</h3>
          <ul className="mt-2 space-y-1">
            {detail.synthesized_pages.map((page) => (
              <li key={page.doc_path}>
                <a
                  href={`/docs/${page.doc_path.replace(/\.md$/, '')}`}
                  className="text-sm text-gray-900 underline decoration-gray-300 underline-offset-2 hover:decoration-gray-900">
                  {page.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function EmailEngine({ refreshToken = 0 }) {
  const [apiBase] = useApiBase();

  const [emails, setEmails] = useState([]);
  const [selectedPath, setSelectedPath] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const loadEmails = useCallback(async () => {
    setLoadingList(true);
    setError(null);
    try {
      const data = await fetchEmails(apiBase);
      setEmails(data.emails ?? []);
    } catch {
      setError(`Cannot reach API at ${apiBase}. Run: cd compiler && ./run_server.sh`);
    } finally {
      setLoadingList(false);
    }
  }, [apiBase]);

  useEffect(() => {
    loadEmails();
  }, [loadEmails, refreshToken]);

  useEffect(() => {
    if (!selectedPath) {
      setDetail(null);
      return undefined;
    }
    let cancelled = false;
    setLoadingDetail(true);
    setError(null);

    fetchEmailDetail(selectedPath, apiBase)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch(() => {
        if (!cancelled) setError(`Failed to load ${selectedPath}`);
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedPath, apiBase]);

  const filteredEmails = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return emails;
    return emails.filter((email) =>
      [email.subject, email.from, ...(email.to ?? [])]
        .join(' ')
        .toLowerCase()
        .includes(needle),
    );
  }, [emails, search]);

  if (error && !detail && emails.length === 0 && !loadingList) {
    return (
      <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        {error}
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-4 py-3">
        <h2 className="text-base font-semibold text-gray-900">Email knowledge engine</h2>
        <p className="text-sm text-gray-500">
          Ingested .eml threads under data/raw/, browsable and searchable on their own — each
          one shows what it fed into the wiki.
        </p>
      </div>

      <div className="px-4 py-3">
        {selectedPath && detail && !loadingDetail ? (
          <EmailDetail detail={detail} onClose={() => setSelectedPath(null)} />
        ) : (
          <>
            <input
              type="search"
              placeholder="Search subject or sender…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="mb-3 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm sm:max-w-xs"
            />

            {loadingList ? (
              <p className="py-8 text-center text-sm text-gray-500">Loading emails…</p>
            ) : filteredEmails.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">
                No .eml sources found. Drop one into data/raw/emails/.
              </p>
            ) : (
              <ul className="max-h-[520px] divide-y divide-gray-100 overflow-auto rounded-md border border-gray-200">
                {filteredEmails.map((email) => (
                  <li key={email.path}>
                    <button
                      type="button"
                      onClick={() => setSelectedPath(email.path)}
                      className="flex w-full flex-col gap-1 px-3 py-2.5 text-left hover:bg-gray-50">
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate text-sm font-medium text-gray-900">
                          {email.subject}
                        </span>
                        <span className="shrink-0 text-xs text-gray-400">{email.date}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate text-xs text-gray-500">{email.from}</span>
                        <div className="flex shrink-0 items-center gap-2">
                          <TrustBadge level={email.trust?.level} />
                          <span
                            className={clsx(
                              'text-xs',
                              email.status === 'Processed' ? 'text-green-700' : 'text-amber-700',
                            )}>
                            {email.status}
                          </span>
                        </div>
                      </div>
                      {email.body_preview && (
                        <p className="truncate text-xs text-gray-400">{email.body_preview}</p>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {selectedPath && loadingDetail && (
              <p className="mt-4 text-sm text-gray-500">Loading email…</p>
            )}
          </>
        )}
      </div>

      {error && emails.length > 0 && (
        <p className="border-t border-gray-200 px-4 py-3 text-sm text-red-700">{error}</p>
      )}
    </section>
  );
}
