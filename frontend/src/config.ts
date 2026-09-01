/**
 * Two different backend URLs, deliberately: BACKEND_API_URL is used by
 * this server's own SSR fetches (api.ts) -- inside Docker Compose that
 * has to be the service hostname (http://backend:8000), reachable only
 * on the Docker network. PUBLIC_API_URL is embedded into every rendered
 * page (the <meta name="api-base"> tag) for the browser's own fetch/
 * EventSource calls -- the browser runs on the host, not the Docker
 * network, so it needs the host-published URL (http://localhost:8000)
 * even when the two containers reach each other as `backend`/`frontend`.
 * Collapsing these into one value works for local (non-Docker) dev, where
 * both resolve to the same http://localhost:8000, but breaks silently
 * under Docker Compose.
 */
export const BACKEND_API_URL = process.env.BACKEND_API_URL ?? 'http://localhost:8000';
export const PUBLIC_API_URL = process.env.PUBLIC_API_URL ?? BACKEND_API_URL;
export const PORT = Number(process.env.PORT ?? 3000);
