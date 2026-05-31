import React, { useCallback, useEffect, useMemo, useState } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Link from '@docusaurus/Link';
import { DEFAULT_WIKI_API_URL, fetchAnalytics } from '@site/src/utils/wikiApi';
import styles from './styles.module.css';

function MetricCard({ label, value, hint, tone = 'default' }) {
  return (
    <article className={`${styles.metricCard} ${styles[tone]}`}>
      <p className={styles.metricLabel}>{label}</p>
      <p className={styles.metricValue}>{value}</p>
      {hint && <p className={styles.metricHint}>{hint}</p>}
    </article>
  );
}

function tagCloudSize(count, maxCount) {
  if (maxCount <= 1) {
    return styles.tagMd;
  }
  const ratio = count / maxCount;
  if (ratio >= 0.75) {
    return styles.tagXl;
  }
  if (ratio >= 0.5) {
    return styles.tagLg;
  }
  if (ratio >= 0.25) {
    return styles.tagMd;
  }
  return styles.tagSm;
}

export default function AnalyticsAudit() {
  const { siteConfig } = useDocusaurusContext();
  const apiBase = siteConfig.customFields?.wikiApiUrl ?? DEFAULT_WIKI_API_URL;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await fetchAnalytics(apiBase);
      setData(payload);
      setSelectedTag((current) => {
        if (current && payload.tag_details?.[current]) {
          return current;
        }
        return payload.tags?.[0]?.tag ?? null;
      });
    } catch {
      setError(
        `Could not load analytics from ${apiBase}. Start the API with: cd compiler && python server.py`,
      );
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const filteredTags = useMemo(() => {
    const tags = data?.tags ?? [];
    const needle = filter.trim().toLowerCase();
    if (!needle) {
      return tags;
    }
    return tags.filter(
      (item) =>
        item.label.toLowerCase().includes(needle) || item.tag.toLowerCase().includes(needle),
    );
  }, [data, filter]);

  const maxTagCount = useMemo(() => {
    if (!filteredTags.length) {
      return 1;
    }
    return Math.max(...filteredTags.map((item) => item.count));
  }, [filteredTags]);

  const selectedDetail = selectedTag ? data?.tag_details?.[selectedTag] : null;

  if (loading) {
    return <p className={styles.message}>Loading analytics…</p>;
  }

  if (error && !data) {
    return <p className={styles.error}>{error}</p>;
  }

  const metrics = data?.metrics ?? {};

  return (
    <div className={styles.audit}>
      <div className={styles.toolbar}>
        <p className={styles.toolbarText}>Pipeline metrics and tag audit from the live compiler state.</p>
        <button type="button" className={styles.refreshButton} onClick={loadAnalytics}>
          Refresh
        </button>
      </div>

      {error && <p className={styles.errorInline}>{error}</p>}

      <section className={styles.metricsGrid}>
        <MetricCard
          label="Raw Files Processed"
          value={metrics.raw_files_processed ?? 0}
          hint={`${metrics.raw_files_total ?? 0} total in data/raw/`}
          tone="processed"
        />
        <MetricCard
          label="Wiki Pages Created"
          value={metrics.wiki_pages_created ?? 0}
          hint="Indexed topic pages from index.json"
          tone="pages"
        />
        <MetricCard
          label="Cross-Links Established"
          value={metrics.cross_links_established ?? 0}
          hint="Detected links between indexed topics"
          tone="links"
        />
        <MetricCard
          label="Dead Links Found"
          value={metrics.dead_links ?? 0}
          hint="Markdown links pointing to missing files"
          tone={metrics.dead_links > 0 ? 'danger' : 'safe'}
        />
      </section>

      {data?.dead_links?.length > 0 && (
        <section className={styles.deadLinksPanel}>
          <h2 className={styles.sectionTitle}>Dead link audit</h2>
          <ul className={styles.deadLinksList}>
            {data.dead_links.map((item) => (
              <li key={`${item.source}-${item.line}-${item.href}`}>
                <code>{item.source}:{item.line}</code> — [{item.text}]({item.href}) → missing{' '}
                <code>{item.missing}</code>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={styles.tagSection}>
        <div className={styles.tagHeader}>
          <h2 className={styles.sectionTitle}>Tag explorer</h2>
          <input
            type="search"
            className={styles.tagFilter}
            placeholder="Filter tags…"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          />
        </div>

        <div className={styles.tagCloud}>
          {filteredTags.length ? (
            filteredTags.map((item) => (
              <button
                key={item.tag}
                type="button"
                className={`${styles.tagChip} ${tagCloudSize(item.count, maxTagCount)} ${
                  selectedTag === item.tag ? styles.tagChipActive : ''
                }`}
                onClick={() => setSelectedTag(item.tag)}
                title={`${item.raw_count} raw chunks · ${item.page_count} pages`}>
                {item.label}
                <span className={styles.tagCount}>{item.count}</span>
              </button>
            ))
          ) : (
            <p className={styles.emptyHint}>No tags match your filter.</p>
          )}
        </div>

        {selectedDetail && (
          <div className={styles.tagDetail}>
            <h3>
              Tag: <span>{selectedDetail.label}</span>
            </h3>
            <div className={styles.detailColumns}>
              <div className={styles.detailPanel}>
                <h4>Raw chunks ({selectedDetail.raw_chunks.length})</h4>
                {selectedDetail.raw_chunks.length ? (
                  <ul className={styles.itemList}>
                    {selectedDetail.raw_chunks.map((chunk) => (
                      <li key={`${chunk.source}-${chunk.chunk_index}`}>
                        <code>{chunk.source}</code>
                        <span className={styles.itemMeta}>chunk {chunk.chunk_index}</span>
                        {chunk.topics?.length > 0 && (
                          <p className={styles.itemTopics}>
                            Topics: {chunk.topics.join(', ')}
                          </p>
                        )}
                        <p className={styles.preview}>{chunk.preview}…</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.emptyHint}>No raw chunks tagged with this label.</p>
                )}
              </div>

              <div className={styles.detailPanel}>
                <h4>Compiled pages ({selectedDetail.pages.length})</h4>
                {selectedDetail.pages.length ? (
                  <ul className={styles.itemList}>
                    {selectedDetail.pages.map((page) => (
                      <li key={page.path}>
                        <Link to={`/docs/${page.path.replace(/\.md$/, '')}`}>{page.title}</Link>
                        <span className={styles.itemMeta}>{page.path}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.emptyHint}>No compiled pages tagged with this label.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
