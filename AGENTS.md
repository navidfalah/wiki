# Wissensbau — Apps Script project

This repository is maintained as a Google Apps Script web application. The deployable runtime is in `apps-script/src/`; keep server code in `.gs`, browser/interface code in `.html`, and platform configuration in `appsscript.json`. Apps Script uses the V8 runtime. Do not add a Node server, Python runtime, npm library, or external font request to the deployed app.

## Runtime and data

- `apps-script/src/Core.gs` contains portable algorithms. `Store.gs`, `Readers.gs`, `Compiler.gs`, `Search.gs`, and `Code.gs` are Apps Script services and web entry points.
- `Index.html`, `Client.html`, `Styles.html`, `Fonts.html`, and `Translations.html` implement the interface. User-visible text must use `t()` and exist in both English and German dictionaries.
- Runtime files and state live in the user's private Google Drive workspace; the workspace pointer and optional API key live in User Properties.
- `data/raw/`, `wiki-app/docs/`, and `output/` are retained source/archive material. Treat them as user data; never rewrite or delete them during app development.
- The deployable project content is `apps-script/src/`. Installation packages are generated into `apps-script/dist/`.

## Development and verification

Node is only a development tool for the Apps Script project. From `apps-script/`, run:

```sh
npm run check
npm test
npm run package
```

The checks simulate Google services and do not prove live deployment, account authorization, or API reachability. Do not claim live validation unless it has been performed. `npm run package` creates the combined `Code.gs`, HTML files, manifest, project-content JSON and ZIP package.

Do not commit authenticated `.clasp.json` or `.clasprc.json` files. Never put API keys in Drive files, generated pages, HTML, snapshots, or logs.
