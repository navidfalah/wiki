"""Run main.py as a subprocess and stream stripped log lines."""

from __future__ import annotations

import asyncio
import json
import os
import re
import sys
import time
from collections.abc import AsyncIterator
from pathlib import Path

COMPILER_DIR = Path(__file__).resolve().parent
MAIN_PY = COMPILER_DIR / "main.py"

ANSI_ESCAPE_RE = re.compile(r"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])")

# Ceiling on how long a single compiler run may take before it's killed and
# reported as failed. Without this, a stuck LLM call or subprocess would hold
# `_build_lock` forever and silently block every future build.
DEFAULT_BUILD_TIMEOUT_SECONDS = 1800.0
# Grace period between SIGTERM and SIGKILL when a run times out.
TERMINATE_GRACE_SECONDS = 10.0


def _build_timeout_seconds() -> float:
    raw = os.getenv("COMPILER_BUILD_TIMEOUT_SECONDS")
    if not raw:
        return DEFAULT_BUILD_TIMEOUT_SECONDS
    try:
        value = float(raw)
    except ValueError:
        return DEFAULT_BUILD_TIMEOUT_SECONDS
    return value if value > 0 else DEFAULT_BUILD_TIMEOUT_SECONDS


async def _kill_process(process: asyncio.subprocess.Process) -> None:
    """Terminate a subprocess, escalating to SIGKILL if it won't stop."""
    if process.returncode is not None:
        return
    process.terminate()
    try:
        await asyncio.wait_for(process.wait(), timeout=TERMINATE_GRACE_SECONDS)
    except asyncio.TimeoutError:
        process.kill()
        await process.wait()


def strip_ansi(text: str) -> str:
    return ANSI_ESCAPE_RE.sub("", text)


def sse_event(event_type: str, payload: dict) -> str:
    body = {"type": event_type, **payload}
    return f"data: {json.dumps(body, ensure_ascii=False)}\n\n"


async def stream_compiler_build(
    *,
    force: bool = False,
    timeout_seconds: float | None = None,
) -> AsyncIterator[str]:
    """Yield Server-Sent Events while main.py runs.

    The run is killed and reported as a failed/timed-out build if it exceeds
    `timeout_seconds` (default: `COMPILER_BUILD_TIMEOUT_SECONDS` env var, or
    `DEFAULT_BUILD_TIMEOUT_SECONDS`), so a hung LLM call or subprocess can't
    hold the build lock forever.
    """
    if not MAIN_PY.is_file():
        yield sse_event("error", {"message": f"Compiler entrypoint not found: {MAIN_PY}"})
        yield sse_event("done", {"code": 1, "success": False})
        return

    timeout = timeout_seconds if timeout_seconds is not None else _build_timeout_seconds()

    cmd = [sys.executable, "-u", str(MAIN_PY)]
    if force:
        cmd.append("--force")

    yield sse_event(
        "start",
        {
            "message": "Starting compiler pipeline…",
            "command": " ".join(cmd),
            "timeout_seconds": timeout,
        },
    )

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
        await _kill_process(process)
        yield sse_event("done", {"code": 1, "success": False})
        return

    deadline = time.monotonic() + timeout
    timed_out = False

    while True:
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            timed_out = True
            break
        try:
            line_bytes = await asyncio.wait_for(process.stdout.readline(), timeout=remaining)
        except asyncio.TimeoutError:
            timed_out = True
            break
        if not line_bytes:
            break
        line = strip_ansi(line_bytes.decode("utf-8", errors="replace")).rstrip("\r\n")
        if line:
            yield sse_event("log", {"message": line})

    if timed_out:
        await _kill_process(process)
        yield sse_event(
            "error",
            {"message": f"Compiler pipeline timed out after {timeout:.0f}s and was terminated."},
        )
        yield sse_event(
            "done",
            {"code": -1, "success": False, "message": "Build timed out."},
        )
        return

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
