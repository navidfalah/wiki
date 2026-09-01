/**
 * Two different backend URLs, deliberately: BACKEND_API_URL is used by
 * this server's own SSR fetches (api.ts) -- inside Docker Compose that
 * has to be the service hostname (http://backend:8000), reachable only
 * on the Docker network.
 *
 * PUBLIC_API_URL is embedded into every rendered page (the
 * <meta name="api-base"> tag) for the browser's own fetch/EventSource/
 * <img>/<embed> calls. Now that pages require login (see index.ts),
 * this defaults to '' (relative) rather than the backend's own host-
 * published URL: the browser's session cookie lives on THIS origin, so
 * client-side calls go through this server's own `/api` proxy, which
 * translates that cookie into the Authorization header the backend
 * expects. Point it at the backend directly only if you've deliberately
 * disabled the login gate.
 */
export const BACKEND_API_URL = process.env.BACKEND_API_URL ?? 'http://localhost:8000';
export const PUBLIC_API_URL = process.env.PUBLIC_API_URL ?? '';
export const PORT = Number(process.env.PORT ?? 3000);
