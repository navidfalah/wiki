/**
 * Maps the handful of fixed, machine-generated strings the backend/compiler
 * emit (pipeline step names, build lifecycle messages, statuses) to the UI
 * language. Anything unrecognised is shown as-is -- free-form log lines and
 * error messages stay in the language they were produced in.
 */
import { t, tn } from './i18n';

function known(key: string): string | null {
  const value = t(key);
  return value === key ? null : value;
}

export function stepName(name: string): string {
  const match = /^(\d)\./.exec(name);
  return (match && known(`common.step.${match[1]}`)) || name;
}

export function buildMessage(message: string): string {
  const exact: Record<string, string> = {
    'Starting compiler pipeline…': 'common.build.starting',
    'A build is already running -- this one will start automatically once it finishes.': 'common.build.queued',
    'Build stopped by user.': 'common.build.stopped',
    'Build complete.': 'common.build.complete',
  };
  if (exact[message]) return t(exact[message]);
  const failed = /^Build failed \(exit (.+)\)\.$/.exec(message);
  if (failed) return t('common.build.failed', { code: failed[1] });
  const start = /^Failed to start compiler: (.*)$/.exec(message);
  if (start) return t('common.build.failedToStart', { error: start[1] });
  return message;
}

export function statusLabel(status: string): string {
  return known(`common.status.${status}`) ?? status;
}

export function levelLabel(level: string): string {
  return known(`common.level.${level}`) ?? level;
}

export function categoryLabel(category: string): string {
  return known(`common.category.${category}`) ?? category;
}

/** "5 min ago" style label, localized. */
export function ageLabel(savedAt: number): string {
  const minutes = Math.round((Date.now() - savedAt) / 60000);
  if (minutes < 1) return t('common.age.justNow');
  if (minutes < 60) return t('common.age.minutes', { count: minutes });
  const hours = Math.round(minutes / 60);
  if (hours < 24) return t('common.age.hours', { count: hours });
  return tn('common.age.days', Math.round(hours / 24));
}

/**
 * The Attention feed's sentences come from backend/src/lib/attentionEngine.ts
 * in English. They are a small fixed set (two carry a file:line), so they are
 * mapped here; the reviewer's free-text summaries pass through untouched.
 */
export function attentionDetail(detail: string): string {
  const exact: Record<string, string> = {
    'No other page links here, and this page links out to nothing -- fully isolated from the graph.': 'review-queue.detail.isolated',
    'No other page links here -- unreachable by browsing the graph.': 'review-queue.detail.unreachable',
    'This page does not link out to any other topic -- a dead end.': 'review-queue.detail.deadEnd',
    'No raw source chunk in the current compiler state maps to this topic -- the page may be stale or synthesized from data since removed.': 'review-queue.detail.ungrounded',
    'Changed since it was last processed -- run the compiler to pick up the edit.': 'review-queue.detail.changed',
    'Never processed -- run the compiler to bring it in.': 'review-queue.detail.neverProcessed',
    'Flagged by the LLM reviewer -- see the full report for details.': 'review-queue.detail.reviewer',
  };
  if (exact[detail]) return t(exact[detail]);
  const broken = /^Broken link in (.+) -- target file does not exist\.$/.exec(detail);
  if (broken) return t('review-queue.detail.brokenLink', { where: broken[1] });
  return detail;
}

/** Run-level messages the backend writes into a pipeline run (stopped / interrupted). Others pass through. */
export function runMessage(message: string | null | undefined): string {
  if (!message) return '';
  if (message === 'Stopped by user.') return t('common.run.stoppedByUser');
  if (message === 'Interrupted: the server process exited (crash or restart) while this run was in progress.') return t('common.run.interruptedRestart');
  const exit = /^Interrupted: process exited with code (.+)\.$/.exec(message);
  if (exit) return t('common.run.interruptedExit', { code: exit[1] });
  return message;
}
