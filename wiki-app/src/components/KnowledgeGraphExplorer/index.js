import React, { useCallback, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import EmptyState from '@site/src/components/ui/EmptyState';
import { Skeleton } from '@site/src/components/ui/Skeleton';
import { PrimaryButton, SecondaryButton } from '@site/src/components/ui/Button';
import {
  DEFAULT_WIKI_API_URL,
  fetchKnowledgeGraph,
  saveKnowledgeGraphOverrides,
} from '@site/src/utils/wikiApi';

const EMPTY_FORM = {
  source_topic: '',
  target_topic: '',
  rule: 'require',
  note: '',
};

function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `conn-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function LinkBadge({ link }) {
  const isOverride = link.origin === 'override';
  return (
    <span
      className={clsx(
        'rounded-full px-2.5 py-0.5 text-xs ring-1',
        isOverride
          ? 'bg-violet-50 text-violet-800 ring-violet-200/60 ring-dashed'
          : 'bg-sky-50 text-sky-800 ring-sky-200/60',
      )}>
      {link.target_topic}
      {link.rule === 'block' ? ' (blocked)' : ''}
    </span>
  );
}

function ExplorerSkeleton() {
  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-slate-50/60 px-5 py-4">
        <div className="flex gap-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(240px,320px)_1fr]">
        <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-card">
          <Skeleton className="mb-4 h-4 w-16" />
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="mb-2 h-10 w-full rounded-xl" />
          ))}
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-card">
          <Skeleton className="mb-4 h-5 w-40" />
          <Skeleton className="mb-2 h-4 w-32" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-6 w-20 rounded-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, children, className }) {
  return (
    <label className={clsx('flex flex-col gap-1.5', className)}>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  'rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20';

export default function KnowledgeGraphExplorer() {
  const { siteConfig } = useDocusaurusContext();
  const apiBase = siteConfig.customFields?.wikiApiUrl ?? DEFAULT_WIKI_API_URL;

  const [graph, setGraph] = useState(null);
  const [connections, setConnections] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState(null);
  const [saveMessage, setSaveMessage] = useState(null);

  const loadGraph = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchKnowledgeGraph(apiBase);
      setGraph(data);
      setConnections(data.connections ?? []);
      setDirty(false);
      setSelectedTopic((current) => current ?? data.topics?.[0]?.title ?? null);
    } catch {
      setError(
        `Could not load the knowledge graph from ${apiBase}. Start the API with: cd compiler && python server.py`,
      );
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  const topicTitles = useMemo(
    () => (graph?.topics ?? []).map((topic) => topic.title),
    [graph],
  );

  const effectiveByTopic = useMemo(() => {
    const map = {};
    for (const link of graph?.effective_links ?? []) {
      if (!map[link.source_topic]) {
        map[link.source_topic] = [];
      }
      map[link.source_topic].push(link);
    }
    return map;
  }, [graph]);

  const selectedOutgoing = effectiveByTopic[selectedTopic] ?? [];
  const selectedDetected = (graph?.detected_links ?? []).filter(
    (link) => link.source_topic === selectedTopic,
  );

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const handleAddOrUpdate = (event) => {
    event.preventDefault();
    if (!form.source_topic || !form.target_topic) {
      return;
    }
    if (form.source_topic === form.target_topic) {
      return;
    }

    const payload = {
      id: editingId ?? createId(),
      source_topic: form.source_topic,
      target_topic: form.target_topic,
      rule: form.rule,
      enabled: true,
      note: form.note.trim(),
    };

    setConnections((previous) => {
      const filtered = previous.filter((item) => item.id !== payload.id);
      return [...filtered, payload];
    });
    setDirty(true);
    resetForm();
  };

  const handleEdit = (connection) => {
    setEditingId(connection.id);
    setForm({
      source_topic: connection.source_topic,
      target_topic: connection.target_topic,
      rule: connection.rule,
      note: connection.note ?? '',
    });
  };

  const handleDelete = (connectionId) => {
    setConnections((previous) => previous.filter((item) => item.id !== connectionId));
    setDirty(true);
    if (editingId === connectionId) {
      resetForm();
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    setError(null);
    try {
      const result = await saveKnowledgeGraphOverrides(connections, apiBase);
      setGraph(result.graph);
      setConnections(result.graph.connections ?? []);
      setDirty(false);
      setSaveMessage(`Saved ${result.connection_count} rule(s) to data/link_overrides.json`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <ExplorerSkeleton />;
  }

  if (error && !graph) {
    return (
      <div className="rounded-2xl border border-red-200/80 bg-red-50 px-6 py-8 shadow-card">
        <EmptyState
          title="Could not load knowledge graph"
          hint={error}
          icon={
            <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          }
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/70 bg-slate-50/60 px-5 py-4 shadow-card">
        <div className="flex flex-wrap gap-4 text-sm text-slate-600">
          <span>
            <span className="font-semibold tabular-nums text-slate-900">{graph?.topics?.length ?? 0}</span>{' '}
            topics
          </span>
          <span>
            <span className="font-semibold tabular-nums text-slate-900">{graph?.detected_links?.length ?? 0}</span>{' '}
            detected links
          </span>
          <span>
            <span className="font-semibold tabular-nums text-slate-900">{connections.length}</span>{' '}
            override rules
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <SecondaryButton onClick={loadGraph}>Refresh</SecondaryButton>
          <PrimaryButton onClick={handleSave} disabled={!dirty || saving}>
            {saving ? 'Saving…' : 'Save overrides'}
          </PrimaryButton>
        </div>
      </div>

      {saveMessage && (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-emerald-100">
          {saveMessage}
        </p>
      )}
      {error && graph && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">{error}</p>
      )}
      {dirty && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-100">
          You have unsaved connection rule changes.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(240px,320px)_1fr]">
        <section className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-panel">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Topics</h2>
          </div>
          <div className="max-h-[420px] space-y-1 overflow-auto p-2">
            {(graph?.topics ?? []).map((topic) => {
              const outgoing = effectiveByTopic[topic.title] ?? [];
              const isActive = selectedTopic === topic.title;
              return (
                <button
                  key={topic.id}
                  type="button"
                  className={clsx(
                    'flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20',
                    isActive
                      ? 'border border-emerald-400/60 bg-emerald-50/80 shadow-card'
                      : 'border border-transparent bg-slate-50/80 hover:border-slate-200 hover:bg-white',
                  )}
                  onClick={() => setSelectedTopic(topic.title)}>
                  <span className="text-sm text-slate-800">{topic.title}</span>
                  <span className="shrink-0 text-[11px] tabular-nums text-slate-400">
                    {outgoing.length} link{outgoing.length === 1 ? '' : 's'}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-panel">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">
              {selectedTopic ?? 'Select a topic'}
            </h2>
          </div>
          <div className="space-y-5 p-4">
            {selectedTopic ? (
              <>
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Effective cross-links
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedOutgoing.length ? (
                      selectedOutgoing.map((link) => (
                        <LinkBadge
                          key={`${link.source_topic}-${link.target_topic}`}
                          link={link}
                        />
                      ))
                    ) : (
                      <p className="text-sm text-slate-400">No outgoing links for this topic.</p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Auto-detected from build
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedDetected.length ? (
                      selectedDetected.map((link) => (
                        <span
                          key={`${link.source_topic}-${link.target_topic}`}
                          className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs text-sky-800 ring-1 ring-sky-200/60">
                          {link.target_topic}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-slate-400">No auto-detected links.</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <EmptyState
                title="Select a topic"
                hint="Choose a topic from the list to view its cross-links."
                className="py-8"
              />
            )}
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-panel">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Connection rules</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            <strong className="font-medium text-slate-700">Require</strong> adds a cross-link on the next build.{' '}
            <strong className="font-medium text-slate-700">Block</strong> prevents linking between topics. Rules
            are saved to{' '}
            <code className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700">
              data/link_overrides.json
            </code>{' '}
            and applied by{' '}
            <code className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700">
              linker.py
            </code>
            .
          </p>
        </div>

        <form
          className="grid grid-cols-1 items-end gap-4 border-b border-slate-100 px-5 py-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5"
          onSubmit={handleAddOrUpdate}>
          <FormField label="Source topic">
            <select
              className={inputClass}
              value={form.source_topic}
              onChange={(event) => setForm({ ...form, source_topic: event.target.value })}
              required>
              <option value="">Select…</option>
              {topicTitles.map((title) => (
                <option key={`source-${title}`} value={title}>
                  {title}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Target topic">
            <select
              className={inputClass}
              value={form.target_topic}
              onChange={(event) => setForm({ ...form, target_topic: event.target.value })}
              required>
              <option value="">Select…</option>
              {topicTitles.map((title) => (
                <option key={`target-${title}`} value={title}>
                  {title}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Rule">
            <select
              className={inputClass}
              value={form.rule}
              onChange={(event) => setForm({ ...form, rule: event.target.value })}>
              <option value="require">Require link</option>
              <option value="block">Block link</option>
            </select>
          </FormField>
          <FormField label="Note">
            <input
              type="text"
              className={inputClass}
              value={form.note}
              placeholder="Optional note"
              onChange={(event) => setForm({ ...form, note: event.target.value })}
            />
          </FormField>
          <div className="flex flex-wrap gap-2">
            <PrimaryButton type="submit">{editingId ? 'Update rule' : 'Add rule'}</PrimaryButton>
            {editingId && (
              <SecondaryButton type="button" onClick={resetForm}>
                Cancel edit
              </SecondaryButton>
            )}
          </div>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-left">
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Source
                </th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Target
                </th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Rule
                </th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Note
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {connections.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      title="No manual rules yet"
                      hint="Add a require or block rule above to override auto-detected links."
                      className="py-8"
                    />
                  </td>
                </tr>
              ) : (
                connections.map((connection) => (
                  <tr key={connection.id} className="transition hover:bg-slate-50/50">
                    <td className="px-5 py-3 text-slate-800">{connection.source_topic}</td>
                    <td className="px-5 py-3 text-slate-800">{connection.target_topic}</td>
                    <td className="px-5 py-3">
                      <span
                        className={clsx(
                          'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1',
                          connection.rule === 'block'
                            ? 'bg-red-50 text-red-700 ring-red-200/60'
                            : 'bg-emerald-50 text-emerald-700 ring-emerald-200/60',
                        )}>
                        {connection.rule}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{connection.note || '—'}</td>
                    <td className="whitespace-nowrap px-5 py-3">
                      <button
                        type="button"
                        className="mr-3 text-sm font-medium text-emerald-600 hover:text-emerald-700"
                        onClick={() => handleEdit(connection)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-sm font-medium text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(connection.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
