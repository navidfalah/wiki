/**
 * Aggregates data-quality signals already computed elsewhere (link
 * detection, dead-link checking, raw-file processing status, the LLM
 * review report) into one "things that need a human look" feed for the
 * /attention page. Nothing here re-derives data another module already
 * owns -- it just reads their outputs and reshapes them.
 */
import fs from 'node:fs';
import path from 'node:path';
import { OUTPUT_DIR, RAW_DIR, REVIEW_REPORT_PATH } from '../paths';
import { findBrokenLinks } from './deadLinkChecker';
import { buildKnowledgeGraphPayload } from './linkOverrides';
import { loadTopicIndex, normalizeTopic } from './docUtils';
import { computeMd5, discoverRawSourceFiles, loadState } from './rawFiles';

export type Severity = 'high' | 'medium' | 'low';

export interface AttentionItem {
  kind: 'orphan_topic' | 'dead_end_topic' | 'dead_link' | 'ungrounded_topic' | 'unprocessed_file' | 'review_finding';
  severity: Severity;
  title: string;
  detail: string;
  doc_path?: string;
  raw_path?: string;
}

function groupTopicsFromState(state: { files?: Record<string, any> }): Set<string> {
  const grounded = new Set<string>();
  for (const fileEntry of Object.values(state.files ?? {})) {
    for (const chunk of (fileEntry as any).chunks ?? []) {
      for (const topic of chunk.topics ?? []) {
        const normalized = normalizeTopic(topic).toLowerCase();
        if (normalized) grounded.add(normalized);
      }
    }
  }
  return grounded;
}

function parseReviewReport(text: string): AttentionItem[] {
  // Mirrors compiler/reviewer.py's format_report() layout: pages are
  // separated by a "----...----" rule, each starting with "PAGE: <topic>",
  // "FILE: <path>", "SEVERITY: MAJOR|MINOR", optional "SUMMARY: ...".
  const items: AttentionItem[] = [];
  const blocks = text.split(/^-{10,}$/m).map((b) => b.trim()).filter(Boolean);
  for (const block of blocks) {
    const pageMatch = block.match(/^PAGE:\s*(.+)$/m);
    if (!pageMatch) continue;
    const fileMatch = block.match(/^FILE:\s*(.+)$/m);
    const severityMatch = block.match(/^SEVERITY:\s*(MAJOR|MINOR)$/m);
    const summaryMatch = block.match(/^SUMMARY:\s*(.+)$/m);
    const severity: Severity = severityMatch?.[1] === 'MAJOR' ? 'high' : 'medium';
    items.push({
      kind: 'review_finding',
      severity,
      title: pageMatch[1].trim(),
      detail: summaryMatch?.[1]?.trim() || 'Flagged by the LLM reviewer -- see the full report for details.',
      doc_path: fileMatch ? path.basename(fileMatch[1].trim()) : undefined,
    });
  }
  return items;
}

export function buildAttentionReport(docsDir: string = OUTPUT_DIR) {
  const topicIndex = loadTopicIndex();
  const items: AttentionItem[] = [];

  // --- Missed relations: topics no other page links to, and topics that
  // link out to nothing themselves. Both make a page effectively
  // unreachable from browsing the graph. ---------------------------------
  let orphanCount = 0;
  let deadEndCount = 0;
  if (Object.keys(topicIndex).length > 0) {
    const graph = buildKnowledgeGraphPayload(topicIndex, docsDir);
    const incoming = new Set<string>();
    for (const link of graph.effective_links as any[]) incoming.add(link.target_topic);

    for (const topic of graph.topics as any[]) {
      const outgoing = (graph.outgoing_by_topic as any)[topic.title] ?? [];
      const hasIncoming = incoming.has(topic.title);
      const hasOutgoing = outgoing.length > 0;
      if (!hasIncoming && !hasOutgoing) {
        orphanCount++;
        items.push({
          kind: 'orphan_topic',
          severity: 'high',
          title: topic.title,
          detail: 'No other page links here, and this page links out to nothing -- fully isolated from the graph.',
          doc_path: topic.filename,
        });
      } else if (!hasIncoming) {
        orphanCount++;
        items.push({
          kind: 'orphan_topic',
          severity: 'medium',
          title: topic.title,
          detail: 'No other page links here -- unreachable by browsing the graph.',
          doc_path: topic.filename,
        });
      } else if (!hasOutgoing) {
        deadEndCount++;
        items.push({
          kind: 'dead_end_topic',
          severity: 'low',
          title: topic.title,
          detail: 'This page does not link out to any other topic -- a dead end.',
          doc_path: topic.filename,
        });
      }
    }
  }

  // --- Missed relations: links that point at a file that doesn't exist. -
  const broken = fs.existsSync(docsDir) ? findBrokenLinks(docsDir) : [];
  for (const b of broken) {
    items.push({
      kind: 'dead_link',
      severity: 'high',
      title: `[${b.text}] → ${b.missing}`,
      detail: `Broken link in ${b.source}:${b.line} -- target file does not exist.`,
      doc_path: b.source,
    });
  }

  // --- Missed data: pages with no raw source chunks backing them, i.e.
  // topics in index.json that never showed up in any processed file's
  // chunk.topics list. -----------------------------------------------------
  const state = loadState();
  const grounded = groupTopicsFromState(state);
  let ungroundedCount = 0;
  for (const [title, filename] of Object.entries(topicIndex)) {
    if (!grounded.has(normalizeTopic(title).toLowerCase())) {
      ungroundedCount++;
      items.push({
        kind: 'ungrounded_topic',
        severity: 'high',
        title,
        detail: 'No raw source chunk in the current compiler state maps to this topic -- the page may be stale or synthesized from data since removed.',
        doc_path: filename,
      });
    }
  }

  // --- Missed data: raw files sitting in data/raw/ that the compiler
  // hasn't (re)ingested yet. -------------------------------------------
  let unprocessedCount = 0;
  if (fs.existsSync(RAW_DIR)) {
    for (const filePath of discoverRawSourceFiles(RAW_DIR)) {
      const rel = path.relative(RAW_DIR, filePath).split(path.sep).join('/');
      const md5 = computeMd5(filePath);
      const entry = state.files?.[rel];
      if (!entry || entry.md5 !== md5) {
        unprocessedCount++;
        items.push({
          kind: 'unprocessed_file',
          severity: 'medium',
          title: rel,
          detail: entry ? 'Changed since it was last processed -- run the compiler to pick up the edit.' : 'Never processed -- run the compiler to bring it in.',
          raw_path: rel,
        });
      }
    }
  }

  // --- Structural/faithfulness issues the LLM reviewer already found,
  // if a review report has been generated. -----------------------------
  let reviewFindings: AttentionItem[] = [];
  let reviewReportGeneratedAt: string | null = null;
  if (fs.existsSync(REVIEW_REPORT_PATH)) {
    const text = fs.readFileSync(REVIEW_REPORT_PATH, 'utf-8');
    reviewFindings = parseReviewReport(text);
    items.push(...reviewFindings);
    reviewReportGeneratedAt = fs.statSync(REVIEW_REPORT_PATH).mtime.toISOString();
  }

  const severityRank: Record<Severity, number> = { high: 0, medium: 1, low: 2 };
  items.sort((a, b) => severityRank[a.severity] - severityRank[b.severity] || a.kind.localeCompare(b.kind));

  return {
    generated_at: new Date().toISOString(),
    counts: {
      orphan_or_dead_end_topics: orphanCount + deadEndCount,
      dead_links: broken.length,
      ungrounded_topics: ungroundedCount,
      unprocessed_files: unprocessedCount,
      review_findings: reviewFindings.length,
      total: items.length,
    },
    review_report: {
      exists: fs.existsSync(REVIEW_REPORT_PATH),
      generated_at: reviewReportGeneratedAt,
    },
    items,
  };
}
