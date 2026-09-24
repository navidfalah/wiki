"""Guards compiler/all_source_extensions.json -- the single source of
truth backend/src/lib/rawFiles.ts reads directly (rather than hand-copying
the list in TypeScript, which drifted from synthesizer.py silently before
this manifest existed). If this test fails, synthesizer.ALL_SOURCE_EXTENSIONS
changed without regenerating the manifest file; regenerate it with:

    python -c "import json, synthesizer; \
        json.dump(sorted(synthesizer.ALL_SOURCE_EXTENSIONS), open('all_source_extensions.json', 'w'), indent=2)" \
        && echo >> all_source_extensions.json
"""

import json
from pathlib import Path

import synthesizer

MANIFEST_PATH = Path(__file__).resolve().parent.parent / "all_source_extensions.json"


def test_manifest_matches_synthesizer_all_source_extensions():
    manifest = json.loads(MANIFEST_PATH.read_text())
    assert manifest == sorted(synthesizer.ALL_SOURCE_EXTENSIONS)


def test_manifest_has_no_duplicates():
    manifest = json.loads(MANIFEST_PATH.read_text())
    assert len(manifest) == len(set(manifest))
