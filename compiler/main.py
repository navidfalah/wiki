#!/usr/bin/env python3
"""Compiler entry point. Build implementation lives in pipeline/.

The stage functions remain importable here for existing Python callers.
New code should import stages from their owning pipeline modules.
"""
from pipeline.command_line import main
from pipeline.extraction import step_extract as step_extract
from pipeline.indexing import step_index as step_index
from pipeline.linking import step_link as step_link
from pipeline.reading import step_read_data as step_read_data
from pipeline.runner import run_pipeline as run_pipeline
from pipeline.synthesis import step_synthesize as step_synthesize

if __name__ == "__main__":
    main()
