/**
 * Thin client for the wiki's HTTP API, authenticated with a personal API
 * token (Settings -> API tokens). Read-only by construction: it only ever
 * issues GET requests, so a read-scoped token is enough.
 */
export class WikiApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'WikiApiError';
  }
}

export interface WikiClientOptions {
  baseUrl: string;
  token: string;
  /** Per-request timeout in milliseconds. */
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

/**
 * Encodes each path segment but keeps the slashes, for /api/docs/<path>.
 *
 * "." and ".." segments are refused, not encoded: the URL parser resolves
 * them (even as %2e), so "../users" would climb out of /api/docs/ and turn a
 * page read into a request to any other endpoint. The server refuses such
 * paths too; this keeps the tools inside the routes they are meant for.
 */
export function encodePath(path: string): string {
  const segments = path.split('/').filter((segment) => segment !== '');
  if (!segments.length || segments.some((segment) => segment === '.' || segment === '..')) {
    throw new WikiApiError(`Invalid path "${path}".`, 400);
  }
  return segments.map(encodeURIComponent).join('/');
}

export class WikiClient {
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: WikiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.token = options.token;
    this.timeoutMs = options.timeoutMs ?? 30_000;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async get<T = any>(path: string, query?: Record<string, string | number | undefined>): Promise<T> {
    const url = new URL(this.baseUrl + path);
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
    let res: Response;
    try {
      res = await this.fetchImpl(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${this.token}`, Accept: 'application/json' },
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (err: any) {
      const reason = err?.name === 'TimeoutError' ? `timed out after ${this.timeoutMs / 1000}s` : (err?.cause?.code ?? err?.message ?? 'network error');
      throw new WikiApiError(`Could not reach the wiki at ${this.baseUrl}: ${reason}`, 0);
    }
    const text = await res.text();
    let body: any = text;
    try {
      body = JSON.parse(text);
    } catch {
      /* non-JSON body: keep the text */
    }
    if (!res.ok) {
      const detail = typeof body === 'object' && body && 'detail' in body ? String(body.detail) : String(text).slice(0, 200);
      if (res.status === 401) {
        throw new WikiApiError('The wiki rejected the API token (401): it is wrong, revoked or expired. Create a new one under Settings -> API tokens.', 401);
      }
      throw new WikiApiError(detail || `Request failed (${res.status})`, res.status);
    }
    return body as T;
  }
}
