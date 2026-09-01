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

export function fetchSources(apiBase = DEFAULT_WIKI_API_URL) {
  return apiFetch('/api/sources', apiBase);
}

export async function addSource(path, label, apiBase = DEFAULT_WIKI_API_URL) {
  const response = await fetch(`${apiBase}/api/sources`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, label }),
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Add source failed (${response.status})`);
  }
  return response.json();
}

export async function removeSource(sourceId, apiBase = DEFAULT_WIKI_API_URL) {
  const response = await fetch(`${apiBase}/api/sources/${encodeURIComponent(sourceId)}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Remove source failed (${response.status})`);
  }
  return response.json();
}

export async function setSourceEnabled(sourceId, enabled, apiBase = DEFAULT_WIKI_API_URL) {
  const response = await fetch(`${apiBase}/api/sources/${encodeURIComponent(sourceId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled }),
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Update source failed (${response.status})`);
  }
  return response.json();
}

export async function createRawFolder(parent, name, apiBase = DEFAULT_WIKI_API_URL) {
  const response = await fetch(`${apiBase}/api/raw-files/folders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ parent, name }),
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Create folder failed (${response.status})`);
  }
  return response.json();
}

export async function deleteRawFolder(folderPath, apiBase = DEFAULT_WIKI_API_URL) {
  const encoded = folderPath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  const response = await fetch(`${apiBase}/api/raw-files/folders/${encoded}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Delete folder failed (${response.status})`);
  }
  return response.json();
}

export async function moveRawFile(path, destination, apiBase = DEFAULT_WIKI_API_URL) {
  const response = await fetch(`${apiBase}/api/raw-files/move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, destination }),
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Move failed (${response.status})`);
  }
  return response.json();
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
  { force = false } = {},
) {
  const params = new URLSearchParams();
  if (force) {
    params.set('force', 'true');
  }
  const query = params.toString();
  return `${apiBase}/api/build/stream${query ? `?${query}` : ''}`;
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

export function fetchDocsList(apiBase = DEFAULT_WIKI_API_URL) {
  return apiFetch('/api/docs', apiBase);
}

export function fetchAnalyticsTag(tag, apiBase = DEFAULT_WIKI_API_URL) {
  const encoded = encodeURIComponent(tag);
  return apiFetch(`/api/analytics/tags/${encoded}`, apiBase);
}

export function fetchEmails(apiBase = DEFAULT_WIKI_API_URL) {
  return apiFetch('/api/emails', apiBase);
}

export function fetchEmailDetail(filePath, apiBase = DEFAULT_WIKI_API_URL) {
  const encoded = filePath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return apiFetch(`/api/emails/${encoded}`, apiBase);
}

export function fetchResources(
  { q = '', sourceType = '', trust = '' } = {},
  apiBase = DEFAULT_WIKI_API_URL,
) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (sourceType) params.set('source_type', sourceType);
  if (trust) params.set('trust', trust);
  const query = params.toString();
  return apiFetch(`/api/resources${query ? `?${query}` : ''}`, apiBase);
}

export function fetchResourceDetail(sourcePath, apiBase = DEFAULT_WIKI_API_URL) {
  const encoded = sourcePath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return apiFetch(`/api/resources/${encoded}`, apiBase);
}

export function fetchChatStatus(apiBase = DEFAULT_WIKI_API_URL) {
  return apiFetch('/api/chat/status', apiBase);
}

export async function sendChatMessage(message, history = [], apiBase = DEFAULT_WIKI_API_URL) {
  const response = await fetch(`${apiBase}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Chat request failed (${response.status})`);
  }
  return response.json();
}
