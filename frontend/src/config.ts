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

/**
 * Public-deployment settings (see docker-compose.prod.yml / README).
 * SITE_URL is the canonical origin used in the landing page's <link
 * rel="canonical">, Open Graph tags, robots.txt and sitemap.xml.
 * COOKIE_SECURE=true marks the session cookie Secure -- required once the
 * site is served over HTTPS (Caddy in docker-compose.prod.yml), but left
 * off by default so plain-http local dev keeps working.
 * SHOW_DEFAULT_LOGIN_HINT=false hides the "admin / aurora_admin" box on the
 * sign-in page; production must not advertise a default password.
 * LEGAL_IMPRINT_URL / LEGAL_PRIVACY_URL add Impressum / Datenschutz links to
 * the landing footer (legally required for German sites) when set.
 */
export const SITE_URL = (process.env.SITE_URL ?? 'https://wissensbau.de').replace(/\/+$/, '');
export const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true';
export const SHOW_DEFAULT_LOGIN_HINT = process.env.SHOW_DEFAULT_LOGIN_HINT !== 'false';
export const LEGAL_IMPRINT_URL = process.env.LEGAL_IMPRINT_URL ?? '';
export const LEGAL_PRIVACY_URL = process.env.LEGAL_PRIVACY_URL ?? '';

/**
 * SHOW_SAMPLE_DB_HINT=false hides the "sample Postgres container" callout on
 * the Resources > Database tab (production has no sample container; see
 * docker-compose.prod.yml).
 */
export const SHOW_SAMPLE_DB_HINT = process.env.SHOW_SAMPLE_DB_HINT !== 'false';
