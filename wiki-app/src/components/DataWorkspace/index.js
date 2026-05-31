import React, { useCallback, useEffect, useMemo, useState } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {
  DEFAULT_WIKI_API_URL,
  fetchRawFileDetail,
  fetchRawFiles,
} from '@site/src/utils/wikiApi';
import HighlightedMarkdown from './HighlightedMarkdown';
import styles from './styles.module.css';

function StatusBadge({ status }) {
  const className =
    status === 'Processed' ? styles.badgeProcessed : styles.badgeUnprocessed;
  return <span className={className}>{status}</span>;
}

function ChipList({ label, items, chipClass }) {
  if (!items?.length) {
    return null;
  }

  return (
    <div className={styles.chipGroup}>
      <span className={styles.chipLabel}>{label}</span>
      <div className={styles.chipRow}>
        {items.map((item) => {
          const text = typeof item === 'string' ? item : item.name;
          return (
            <span key={`${label}-${text}`} className={chipClass}>
              {text}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function RawFileGrid({ files, selectedPath, onSelect }) {
  return (
    <div className={styles.grid}>
      {files.map((file) => {
        const isSelected = file.path === selectedPath;
        return (
          <button
            key={file.path}
            type="button"
            className={`${styles.card} ${isSelected ? styles.cardSelected : ''}`}
            onClick={() => onSelect(file.path)}>
            <div className={styles.cardHeader}>
              <code className={styles.cardPath}>{file.path}</code>
              <StatusBadge status={file.status} />
            </div>
            <div className={styles.cardMeta}>
              <span>{file.chunk_count ?? 0} chunks</span>
              <span>{Math.round((file.size_bytes ?? 0) / 1024)} KB</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function DetailView({ detail, activePageIndex, onPageChange, onClose }) {
  const activePage = detail.synthesized_pages[activePageIndex] ?? null;

  return (
    <section className={styles.detail}>
      <div className={styles.detailHeader}>
        <div>
          <button type="button" className={styles.backButton} onClick={onClose}>
            ← All files
          </button>
          <h2 className={styles.detailTitle}>{detail.path}</h2>
          <div className={styles.detailMeta}>
            <StatusBadge status={detail.status} />
            <span>{detail.topics.length} topics</span>
            <span>{detail.synthesized_pages.length} synthesized pages</span>
          </div>
        </div>
      </div>

      {detail.synthesized_pages.length > 1 && (
        <div className={styles.pageTabs}>
          {detail.synthesized_pages.map((page, index) => (
            <button
              key={page.doc_path}
              type="button"
              className={`${styles.pageTab} ${
                index === activePageIndex ? styles.pageTabActive : ''
              }`}
              onClick={() => onPageChange(index)}>
              {page.title}
            </button>
          ))}
        </div>
      )}

      <div className={styles.splitView}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3>Original junk data</h3>
            <span className={styles.panelHint}>data/raw</span>
          </div>
          <pre className={styles.rawContent}>{detail.content}</pre>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3>{activePage ? activePage.title : 'Synthesized output'}</h3>
            <span className={styles.panelHint}>
              {activePage?.doc_path ?? 'wiki-app/docs'}
            </span>
          </div>

          {activePage ? (
            <>
              <div className={styles.legend}>
                <span className={styles.legendEntity}>Entity</span>
                <span className={styles.legendConcept}>Concept</span>
                <span className={styles.legendTag}>Tag</span>
                <span className={styles.legendLink}>Internal link</span>
              </div>

              <div className={styles.metaPanel}>
                <ChipList
                  label="Tags"
                  items={activePage.tags}
                  chipClass={styles.tagChip}
                />
                <ChipList
                  label="Entities"
                  items={activePage.entities}
                  chipClass={styles.entityChip}
                />
                <ChipList
                  label="Concepts"
                  items={activePage.concepts}
                  chipClass={styles.conceptChip}
                />
                {activePage.links?.length > 0 && (
                  <div className={styles.chipGroup}>
                    <span className={styles.chipLabel}>Links</span>
                    <div className={styles.chipRow}>
                      {activePage.links.map((link) => (
                        <span key={`${link.href}-${link.text}`} className={styles.linkChip}>
                          {link.text}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.markdownPanel}>
                <HighlightedMarkdown
                  body={activePage.body}
                  entities={activePage.entities}
                  concepts={activePage.concepts}
                  tags={activePage.tags}
                />
              </div>
            </>
          ) : (
            <div className={styles.emptyPanel}>
              No synthesized wiki page mapped to this source yet. Run the compiler
              pipeline to generate topic pages.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default function DataWorkspace({ refreshToken = 0 }) {
  const { siteConfig } = useDocusaurusContext();
  const apiBase = siteConfig.customFields?.wikiApiUrl ?? DEFAULT_WIKI_API_URL;

  const [files, setFiles] = useState([]);
  const [summary, setSummary] = useState({ total: 0, processed: 0, unprocessed: 0 });
  const [selectedPath, setSelectedPath] = useState(null);
  const [detail, setDetail] = useState(null);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState(null);

  const loadFiles = useCallback(async () => {
    setLoadingList(true);
    setError(null);
    try {
      const data = await fetchRawFiles(apiBase);
      setFiles(data.files ?? []);
      setSummary({
        total: data.total ?? 0,
        processed: data.processed ?? 0,
        unprocessed: data.unprocessed ?? 0,
      });
    } catch (err) {
      setError(
        `Could not reach the wiki API at ${apiBase}. Start it with: cd compiler && python server.py`,
      );
    } finally {
      setLoadingList(false);
    }
  }, [apiBase]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles, refreshToken]);

  useEffect(() => {
    if (!selectedPath) {
      setDetail(null);
      return undefined;
    }

    let cancelled = false;
    setLoadingDetail(true);
    setError(null);

    fetchRawFileDetail(selectedPath, apiBase)
      .then((data) => {
        if (!cancelled) {
          setDetail(data);
          setActivePageIndex(0);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(`Failed to load details for ${selectedPath}`);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingDetail(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedPath, apiBase]);

  const sortedFiles = useMemo(
    () => [...files].sort((a, b) => a.path.localeCompare(b.path)),
    [files],
  );

  if (loadingList) {
    return <p className={styles.message}>Loading raw files…</p>;
  }

  if (error && !detail && files.length === 0) {
    return <p className={styles.error}>{error}</p>;
  }

  return (
    <div className={styles.workspace}>
      {!selectedPath && (
        <>
          <div className={styles.summaryBar}>
            <span>
              <strong>{summary.total}</strong> raw files
            </span>
            <span className={styles.summaryProcessed}>
              {summary.processed} processed
            </span>
            <span className={styles.summaryUnprocessed}>
              {summary.unprocessed} unprocessed
            </span>
          </div>
          <RawFileGrid
            files={sortedFiles}
            selectedPath={selectedPath}
            onSelect={setSelectedPath}
          />
        </>
      )}

      {selectedPath && loadingDetail && (
        <p className={styles.message}>Loading source details…</p>
      )}

      {selectedPath && detail && !loadingDetail && (
        <DetailView
          detail={detail}
          activePageIndex={activePageIndex}
          onPageChange={setActivePageIndex}
          onClose={() => setSelectedPath(null)}
        />
      )}

      {error && <p className={styles.errorInline}>{error}</p>}
    </div>
  );
}
