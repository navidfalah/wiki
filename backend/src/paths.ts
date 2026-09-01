/**
 * Shared path constants -- mirrors compiler/models.py exactly, so this
 * backend reads/writes the same files the Python compiler does. Nothing
 * about the Python pipeline's on-disk layout changes.
 */
import path from 'node:path';

export const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
export const COMPILER_DIR = path.join(PROJECT_ROOT, 'compiler');
export const RAW_DIR = path.join(PROJECT_ROOT, 'data', 'raw');
export const OUTPUT_DIR = path.join(PROJECT_ROOT, 'wiki-app', 'docs');
export const STATE_FILE = path.join(PROJECT_ROOT, 'data', 'state.json');
export const SOURCES_FILE = path.join(PROJECT_ROOT, 'data', 'sources.json');
export const LINK_OVERRIDES_FILE = path.join(PROJECT_ROOT, 'data', 'link_overrides.json');
export const CHAT_HISTORY_FILE = path.join(PROJECT_ROOT, 'data', 'chat_history.json');
export const CHAT_SESSIONS_DIR = path.join(PROJECT_ROOT, 'data', 'chat_sessions');
export const CHAT_SESSIONS_INDEX = path.join(CHAT_SESSIONS_DIR, 'index.json');
export const USERS_FILE = path.join(PROJECT_ROOT, 'data', 'users.json');
export const SESSIONS_FILE = path.join(PROJECT_ROOT, 'data', 'sessions.json');
export const ACTIVITY_LOG_FILE = path.join(PROJECT_ROOT, 'data', 'activity_log.json');
export const INDEX_JSON = path.join(COMPILER_DIR, 'temp_output', 'index.json');
export const REVIEW_REPORT_PATH = path.join(COMPILER_DIR, 'review_report.txt');
export const PIPELINE_RUNS_DIR = path.join(PROJECT_ROOT, 'data', 'pipeline_runs');
export const PIPELINE_RUNS_INDEX = path.join(PIPELINE_RUNS_DIR, 'index.json');
export const PYTHON_BIN = process.env.PYTHON_BIN ?? 'python3';
