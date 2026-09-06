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
# Grace period between SIGTERM and SIGKILL when a run times out, and the cap
# we'll wait for the process to reap itself after a clean EOF.
TERMINATE_GRACE_SECONDS = 10.0

# The subprocess for the build currently in flight, if any. Only one build
# can run at a time (enforced by the caller's lock), so a single module-level
# slot is safe. Lets `stop_current_build()` (POST /api/build/stop) kill a run
# that's stuck or that the user no longer wants to wait on.
_current_process: asyncio.subprocess.Process | None = None
_stop_requested = False


def is_build_running() -> bool:
    return _current_process is not None and _current_process.returncode is None


async def stop_current_build() -> bool:
    """Kill the in-flight compiler process, if any. Returns True if one was signaled."""
    global _stop_requested
    if not is_build_running():
        return False
    _stop_requested = True
    await _kill_process(_current_process)
    return True


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
    """Terminate a subprocess, escalating to SIGKILL if it won't stop.

    Tolerates the process having already exited on its own between the
    caller's liveness check and this call (a normal race, not an error).
    """
    if process.returncode is not None:
        return
    try:
        process.terminate()
    except ProcessLookupError:
        return
    try:
        await asyncio.wait_for(process.wait(), timeout=TERMINATE_GRACE_SECONDS)
    except TimeoutError:
        try:
            process.kill()
        except ProcessLookupError:
            return
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

    Every exit path — clean finish, non-zero exit, timeout, user-requested
    stop, failure to spawn, the client disconnecting, or an unexpected bug
    here — ends in exactly one `done` event and always releases the
    subprocess and the module-level "current build" slot, so a broken run
    can never wedge `_build_lock` or leave an orphaned process behind.

    Each `error` event carries a `kind` so callers can distinguish causes
    (`missing_entrypoint`, `spawn_failed`, `timeout`, `unexpected`, ...).
    """
    global _current_process, _stop_requested

    if not MAIN_PY.is_file():
        yield sse_event(
            "error",
            {"kind": "missing_entrypoint", "message": f"Compiler entrypoint not found: {MAIN_PY}"},
        )
        yield sse_event("done", {"code": 1, "success": False, "message": "Build failed to start."})
        return

    timeout = timeout_seconds if timeout_seconds is not None else _build_timeout_seconds()
    if timeout <= 0:
        timeout = DEFAULT_BUILD_TIMEOUT_SECONDS

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

    try:
        process = await asyncio.create_subprocess_exec(
            *cmd,
            cwd=str(COMPILER_DIR),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
            env=env,
        )
    except OSError as exc:
        yield sse_event(
            "error",
            {"kind": "spawn_failed", "message": f"Failed to start compiler process: {exc}"},
        )
        yield sse_event("done", {"code": 1, "success": False, "message": "Build failed to start."})
        return

    _stop_requested = False
    _current_process = process

    try:
        if process.stdout is None:
            yield sse_event("error", {"kind": "no_stdout", "message": "Failed to capture compiler output"})
            await _kill_process(process)
            yield sse_event("done", {"code": 1, "success": False, "message": "Build failed to start."})
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
            except TimeoutError:
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
                {"kind": "timeout", "message": f"Compiler pipeline timed out after {timeout:.0f}s and was terminated."},
            )
            yield sse_event("done", {"code": -1, "success": False, "message": "Build timed out."})
            return

        try:
            return_code = await asyncio.wait_for(process.wait(), timeout=TERMINATE_GRACE_SECONDS)
        except TimeoutError:
            # Output hit EOF but the process itself hasn't been reaped yet
            # (rare, but seen with children that outlive their own stdout).
            await _kill_process(process)
            yield sse_event(
                "error",
                {"kind": "exit_wait_timeout", "message": "Compiler process did not exit after finishing its output; it was terminated."},
            )
            yield sse_event("done", {"code": -1, "success": False, "message": "Build failed to exit cleanly."})
            return

        if _stop_requested:
            yield sse_event("done", {"code": return_code, "success": False, "message": "Build stopped by user."})
            return

        success = return_code == 0
        yield sse_event(
            "done",
            {
                "code": return_code,
                "success": success,
                "message": "Build complete." if success else f"Build failed (exit {return_code}).",
            },
        )
    except asyncio.CancelledError:
        # The client disconnected (or the server is shutting down) — the
        # generator is being torn down, not run to completion, so clean up
        # the subprocess and propagate the cancellation without yielding.
        await _kill_process(process)
        raise
    except Exception as exc:
        # A bug here must never leave the process orphaned or the lock held
        # with the client (and the next build) waiting forever.
        await _kill_process(process)
        yield sse_event("error", {"kind": "unexpected", "message": f"Compiler pipeline crashed: {exc}"})
        yield sse_event("done", {"code": 1, "success": False, "message": "Build failed unexpectedly."})
    finally:
        _current_process = None
