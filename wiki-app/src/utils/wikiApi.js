export const DEFAULT_WIKI_API_URL = 'http://localhost:8000';

async function apiFetch(path, apiBase) {
  const response = await fetch(`${apiBase}${path}`);
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `API request failed (${response.status})`);
  }
  return response.json();
}

export function fetchRawFiles(apiBase = DEFAULT_WIKI_API_URL) {
  return apiFetch('/api/raw-files', apiBase);
}

export function fetchRawFileDetail(filePath, apiBase = DEFAULT_WIKI_API_URL) {
  const encoded = filePath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return apiFetch(`/api/raw-files/${encoded}`, apiBase);
}

export function fetchDocDetail(docPath, apiBase = DEFAULT_WIKI_API_URL) {
  const encoded = docPath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return apiFetch(`/api/docs/${encoded}`, apiBase);
}

export function buildStreamUrl(
  apiBase = DEFAULT_WIKI_API_URL,
  { heuristicOnly = true, force = false } = {},
) {
  const params = new URLSearchParams();
  if (heuristicOnly) {
    params.set('heuristic_only', 'true');
  } else {
    params.set('heuristic_only', 'false');
  }
  if (force) {
    params.set('force', 'true');
  }
  return `${apiBase}/api/build/stream?${params.toString()}`;
}

export function fetchBuildStatus(apiBase = DEFAULT_WIKI_API_URL) {
  return apiFetch('/api/build/status', apiBase);
}

export function fetchKnowledgeGraph(apiBase = DEFAULT_WIKI_API_URL) {
  return apiFetch('/api/knowledge-graph', apiBase);
}

export async function saveKnowledgeGraphOverrides(connections, apiBase = DEFAULT_WIKI_API_URL) {
  const response = await fetch(`${apiBase}/api/knowledge-graph/overrides`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ connections }),
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Save failed (${response.status})`);
  }
  return response.json();
}

export function fetchAnalytics(apiBase = DEFAULT_WIKI_API_URL) {
  return apiFetch('/api/analytics', apiBase);
}
