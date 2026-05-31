import React, { useCallback, useEffect, useMemo, useState } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {
  DEFAULT_WIKI_API_URL,
  fetchKnowledgeGraph,
  saveKnowledgeGraphOverrides,
} from '@site/src/utils/wikiApi';
import styles from './styles.module.css';

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
  const className =
    link.origin === 'override' ? styles.badgeOverride : styles.badgeDetected;
  return (
    <span className={className}>
      {link.target_topic}
      {link.rule === 'block' ? ' (blocked)' : ''}
    </span>
  );
}

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
    return <p className={styles.message}>Loading knowledge graph…</p>;
  }

  if (error && !graph) {
    return <p className={styles.error}>{error}</p>;
  }

  return (
    <div className={styles.explorer}>
      <div className={styles.toolbar}>
        <div className={styles.stats}>
          <span>{graph?.topics?.length ?? 0} topics</span>
          <span>{graph?.detected_links?.length ?? 0} detected links</span>
          <span>{connections.length} override rules</span>
        </div>
        <div className={styles.toolbarActions}>
          <button type="button" className={styles.secondaryButton} onClick={loadGraph}>
            Refresh
          </button>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleSave}
            disabled={!dirty || saving}>
            {saving ? 'Saving…' : 'Save overrides'}
          </button>
        </div>
      </div>

      {saveMessage && <p className={styles.success}>{saveMessage}</p>}
      {error && graph && <p className={styles.errorInline}>{error}</p>}
      {dirty && <p className={styles.notice}>You have unsaved connection rule changes.</p>}

      <div className={styles.layout}>
        <section className={styles.topicsPanel}>
          <h2 className={styles.sectionTitle}>Topics</h2>
          <div className={styles.topicList}>
            {(graph?.topics ?? []).map((topic) => {
              const outgoing = effectiveByTopic[topic.title] ?? [];
              return (
                <button
                  key={topic.id}
                  type="button"
                  className={`${styles.topicItem} ${
                    selectedTopic === topic.title ? styles.topicItemActive : ''
                  }`}
                  onClick={() => setSelectedTopic(topic.title)}>
                  <span className={styles.topicName}>{topic.title}</span>
                  <span className={styles.topicMeta}>
                    {outgoing.length} link{outgoing.length === 1 ? '' : 's'}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className={styles.detailPanel}>
          <h2 className={styles.sectionTitle}>{selectedTopic ?? 'Select a topic'}</h2>
          {selectedTopic && (
            <>
              <div className={styles.linkSection}>
                <h3>Effective cross-links</h3>
                <div className={styles.linkRow}>
                  {selectedOutgoing.length ? (
                    selectedOutgoing.map((link) => (
                      <LinkBadge
                        key={`${link.source_topic}-${link.target_topic}`}
                        link={link}
                      />
                    ))
                  ) : (
                    <span className={styles.emptyHint}>No outgoing links for this topic.</span>
                  )}
                </div>
              </div>
              <div className={styles.linkSection}>
                <h3>Auto-detected from build</h3>
                <div className={styles.linkRow}>
                  {selectedDetected.length ? (
                    selectedDetected.map((link) => (
                      <span key={`${link.source_topic}-${link.target_topic}`} className={styles.badgeDetected}>
                        {link.target_topic}
                      </span>
                    ))
                  ) : (
                    <span className={styles.emptyHint}>No auto-detected links.</span>
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      <section className={styles.rulesPanel}>
        <h2 className={styles.sectionTitle}>Connection rules</h2>
        <p className={styles.helpText}>
          <strong>Require</strong> adds a cross-link on the next build. <strong>Block</strong>{' '}
          prevents linking between topics. Rules are saved to <code>data/link_overrides.json</code>{' '}
          and applied by <code>linker.py</code>.
        </p>

        <form className={styles.ruleForm} onSubmit={handleAddOrUpdate}>
          <label>
            Source topic
            <select
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
          </label>
          <label>
            Target topic
            <select
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
          </label>
          <label>
            Rule
            <select
              value={form.rule}
              onChange={(event) => setForm({ ...form, rule: event.target.value })}>
              <option value="require">Require link</option>
              <option value="block">Block link</option>
            </select>
          </label>
          <label className={styles.noteField}>
            Note
            <input
              type="text"
              value={form.note}
              placeholder="Optional note"
              onChange={(event) => setForm({ ...form, note: event.target.value })}
            />
          </label>
          <div className={styles.formActions}>
            <button type="submit" className={styles.primaryButton}>
              {editingId ? 'Update rule' : 'Add rule'}
            </button>
            {editingId && (
              <button type="button" className={styles.secondaryButton} onClick={resetForm}>
                Cancel edit
              </button>
            )}
          </div>
        </form>

        <div className={styles.rulesTableWrap}>
          <table className={styles.rulesTable}>
            <thead>
              <tr>
                <th>Source</th>
                <th>Target</th>
                <th>Rule</th>
                <th>Note</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {connections.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.emptyRow}>
                    No manual connection rules yet.
                  </td>
                </tr>
              ) : (
                connections.map((connection) => (
                  <tr key={connection.id}>
                    <td>{connection.source_topic}</td>
                    <td>{connection.target_topic}</td>
                    <td>
                      <span
                        className={
                          connection.rule === 'block' ? styles.ruleBlock : styles.ruleRequire
                        }>
                        {connection.rule}
                      </span>
                    </td>
                    <td>{connection.note || '—'}</td>
                    <td className={styles.rowActions}>
                      <button type="button" onClick={() => handleEdit(connection)}>
                        Edit
                      </button>
                      <button type="button" onClick={() => handleDelete(connection.id)}>
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
