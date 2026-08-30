#!/usr/bin/env python3
"""Single entry point for the dev-only test-data generators in this folder.

These generators write throwaway ``[SAMPLE]`` / ``[DUMMY TEST DATA]`` files
under ``data/raw/`` for exercising the compiler pipeline. Each generator also
still works as a standalone script (``python generate_junk_data.py``) —
this dispatcher just gives them one shared, discoverable CLI:

    python generate_dummy_data.py junk
    python generate_dummy_data.py bulk --varied-only --count 10
    python generate_dummy_data.py extended --overwrite
    python generate_dummy_data.py varied --count 20
    python generate_dummy_data.py keep-aurora
"""

from __future__ import annotations

import argparse
import sys


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Run one of the dev test-data generators",
    )
    subparsers = parser.add_subparsers(dest="generator", required=True)
    subparsers.add_parser("junk", help="10 small seed files (generate_junk_data.py)")
    subparsers.add_parser("bulk", help="Bulk [SAMPLE]/[DUMMY] files (generate_bulk_dummy_data.py)")
    subparsers.add_parser("extended", help="Wave-2 files (generate_extended_dummy_data.py)")
    subparsers.add_parser("varied", help="Large varied files (generate_varied_dummy_data.py)")
    subparsers.add_parser("keep-aurora", help="Archive non-Aurora raw files (keep_aurora_raw.py)")

    args, remaining = parser.parse_known_args()

    module_by_generator = {
        "junk": "generate_junk_data",
        "bulk": "generate_bulk_dummy_data",
        "extended": "generate_extended_dummy_data",
        "varied": "generate_varied_dummy_data",
        "keep-aurora": "keep_aurora_raw",
    }
    module_name = module_by_generator[args.generator]
    module = __import__(module_name)

    # Forward any remaining flags (e.g. --overwrite, --count) to the target
    # generator's own argparse setup.
    sys.argv = [module_name, *remaining]
    module.main()


if __name__ == "__main__":
    main()
