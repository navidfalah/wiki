# Wissensbau Apps Script source

The uploadable project is at repository root. Server logic belongs in `.gs`; the interface belongs in `.html`. `appsscript.json` is the required Apps Script manifest. Keep the root flat so these files can be copied directly into the Apps Script editor.

The app stores runtime data in the user's Google Drive workspace. English and German visible text must use `t()` and remain paired in `Translations.html`. Do not put API keys in source files or Drive content.

The local Node/Express compiler, frontend, Docker setup, generated wiki, and local data directories were removed. Google deployment and authorization still require setup in the user's Google account.
