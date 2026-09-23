# 41 — English/German UI, Fonts and the Admin Panel

The whole app (sign-in, dashboard and every page) works in **English and
German**. The landing page at [wissensbau.de](https://wissensbau.de) is German
at `/` and English at `/en`.

## Language selection

| Where | How |
|---|---|
| Switcher | `EN` / `DE` at the bottom of the sidebar, on the sign-in page and on the landing pages |
| Persistence | `lang` cookie (1 year, functional only) set by `GET /lang/:code?next=/path` |
| Default | Cookie → browser `Accept-Language` → English (app) / German (landing page) |
| Backend messages | The frontend proxy forwards the language as `X-Lang`; API errors are translated in `backend/src/lib/localizeMessage.ts` |

What is **not** translated, on purpose: content that is data rather than UI —
compiled wiki pages, chat answers, the free-text lines in the activity log and
compiler step details. Wiki/chat language follows the source documents and the
question.

## How translations are organized (`frontend/src/i18n/`)

- One namespace file per page, twice: `en/<ns>.ts` (source of truth) and
  `de/<ns>.ts`, typed as `Record<keyof typeof en, string>` — a missing or extra
  key is a **compile error**.
- Keys are flat and prefixed by namespace: `dashboard.run.title`. Values may use
  `{name}` placeholders; plurals use a `_one` / `_other` pair (`tn('wiki.pages', n)`).
- `index.ts` merges all namespaces (it is generated from the directory listing).

Using them:

| Context | Call |
|---|---|
| EJS view | `<%= t('wiki.title') %>` · `<%- t('x.introHtml') %>` for trusted markup · `th()` escapes placeholders |
| Browser script (`src/client/*.ts`) | `import { t, th, tn } from './lib/i18n'` — the server embeds `common.*` + the script's own namespace as JSON (`#i18n-data`), so no dictionary is bundled |
| Dates/numbers | `formatDateTime`, `formatNumber` (follow the UI language, not the OS) |
| Fixed server strings (step names, build messages, statuses) | `src/client/lib/serverText.ts` |

**Adding a string:** add the key to both `en/` and `de/`, use it, then run
`npm run typecheck` in `frontend/` — it type-checks the server and the browser
scripts and runs `scripts/check-i18n.mjs`, which fails if any `t('…')` key used
in a view or script is missing in either language or if placeholders differ.
CI runs the same command.

## Fonts

**Sora** (UI, headings, brand) and **Inter** (long-form reading: rendered wiki
articles, chat answers) — both **self-hosted** as variable WOFF2 files
(`@fontsource-variable/*`, Latin subset, which covers ä ö ü ß), copied to
`dist-static/fonts` by `npm run build:fonts`. No request ever goes to Google
Fonts, which keeps the site GDPR-friendly. Tailwind: `font-sans` = Sora,
`font-body` = Inter.

## Admin panel (`/users`, also `/admin`)

Admin-only. Stat cards (accounts, admins, users, active sessions), and per
account: change role, reset password, sign out everywhere, delete; plus the
recent sign-in/account activity. Guards: the last admin cannot be demoted or
deleted, you cannot delete yourself, and a role change / password reset /
deletion immediately revokes that user's sessions (API: `PUT /api/users/:id`,
`DELETE /api/users/:id/sessions`, `GET /api/admin/auth-events`).

The first admin comes from `ADMIN_USERNAME` / `ADMIN_PASSWORD` (created only
while `data/users.json` has no users).
