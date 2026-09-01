/** Server-side fetch helper against the Express+TS backend. */
import { BACKEND_API_URL } from './config';

export async function apiGet<T = any>(path: string, token?: string): Promise<T> {
  const res = await fetch(`${BACKEND_API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `Backend request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}
