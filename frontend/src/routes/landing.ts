/**
 * Public, unauthenticated routes for wissensbau.de: the landing page (German
 * at `/`, English at `/en`), plus favicon, robots.txt and sitemap.xml. Mounted
 * above the login gate in index.ts.
 */
import { Router } from 'express';
import { LEGAL_IMPRINT_URL, LEGAL_PRIVACY_URL, SITE_URL } from '../config';
import { fetchCurrentUser, getToken } from '../lib/auth';
import { explicitLang } from '../lib/i18nMiddleware';
import { LANDING_COPY, Lang } from '../lib/landingContent';

const router = Router();

async function renderLanding(lang: Lang, req: import('express').Request, res: import('express').Response) {
  // Only ask the backend who this is when there's a cookie to check; anonymous
  // visitors (the common case) cost nothing beyond rendering the template.
  const token = getToken(req);
  const user = token ? await fetchCurrentUser(token) : null;
  res.render('landing', {
    t: LANDING_COPY[lang],
    lang,
    signedIn: Boolean(user),
    siteUrl: SITE_URL,
    canonical: lang === 'de' ? `${SITE_URL}/` : `${SITE_URL}/en`,
    imprintUrl: LEGAL_IMPRINT_URL,
    privacyUrl: LEGAL_PRIVACY_URL,
    year: new Date().getFullYear(),
  });
}

// `/` is the German landing page unless the visitor's saved language (cookie)
// or browser says English -- then they're sent to `/en`. Crawlers send no
// language and so get German, matching the hreflang="x-default" declaration.
router.get('/', (req, res, next) => {
  if (explicitLang(req) === 'en') {
    res.redirect('/en');
    return;
  }
  renderLanding('de', req, res).catch(next);
});
router.get('/en', (req, res, next) => {
  renderLanding('en', req, res).catch(next);
});

// Amber background, matching the brand's brick mark and the accent color.
const FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#b45309"/><g fill="#fff"><rect x="6" y="19" width="9" height="7" rx="1.5"/><rect x="17" y="19" width="9" height="7" rx="1.5"/><rect x="11.5" y="8" width="9" height="9" rx="1.5" opacity=".85"/></g></svg>`;

router.get('/favicon.svg', (_req, res) => {
  res.type('image/svg+xml').set('Cache-Control', 'public, max-age=86400').send(FAVICON);
});

router.get('/robots.txt', (_req, res) => {
  res
    .type('text/plain')
    .send(`User-agent: *\nAllow: /$\nAllow: /en$\nDisallow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
});

router.get('/sitemap.xml', (_req, res) => {
  res.type('application/xml').send(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      `  <url><loc>${SITE_URL}/</loc></url>\n  <url><loc>${SITE_URL}/en</loc></url>\n</urlset>\n`,
  );
});

export default router;
