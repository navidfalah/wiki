"""Run main.py as a subprocess and stream stripped log lines."""

from __future__ import annotations

import asyncio
import json
import os
import re
import sys
from collections.abc import AsyncIterator
from pathlib import Path

COMPILER_DIR = Path(__file__).resolve().parent
MAIN_PY = COMPILER_DIR / "main.py"

ANSI_ESCAPE_RE = re.compile(r"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])")


def strip_ansi(text: str) -> str:
    return ANSI_ESCAPE_RE.sub("", text)


def sse_event(event_type: str, payload: dict) -> str:
    body = {"type": event_type, **payload}
    return f"data: {json.dumps(body, ensure_ascii=False)}\n\n"


async def stream_compiler_build(
    *,
    force: bool = False,
) -> AsyncIterator[str]:
    """Yield Server-Sent Events while main.py runs."""
    if not MAIN_PY.is_file():
        yield sse_event("error", {"message": f"Compiler entrypoint not found: {MAIN_PY}"})
        yield sse_event("done", {"code": 1, "success": False})
        return

    cmd = [sys.executable, "-u", str(MAIN_PY)]
    if force:
        cmd.append("--force")

    yield sse_event("start", {"message": "Starting compiler pipeline…", "command": " ".join(cmd)})

    env = os.environ.copy()
    env["PYTHONUNBUFFERED"] = "1"

    process = await asyncio.create_subprocess_exec(
        *cmd,
        cwd=str(COMPILER_DIR),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.STDOUT,
        env=env,
    )

    if process.stdout is None:
        yield sse_event("error", {"message": "Failed to capture compiler output"})
        yield sse_event("done", {"code": 1, "success": False})
        return

    while True:
        line_bytes = await process.stdout.readline()
        if not line_bytes:
            break
        line = strip_ansi(line_bytes.decode("utf-8", errors="replace")).rstrip("\r\n")
        if line:
            yield sse_event("log", {"message": line})

    return_code = await process.wait()
    success = return_code == 0
    yield sse_event(
        "done",
        {
            "code": return_code,
            "success": success,
            "message": "Build complete." if success else f"Build failed (exit {return_code}).",
        },
    )
