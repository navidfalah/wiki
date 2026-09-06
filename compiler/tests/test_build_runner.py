"""Tests for build_runner's process management and error handling.

No async test plugin is used elsewhere in this suite, so each test wraps its
coroutine in `asyncio.run()` from an ordinary sync `def test_...`.
"""

from __future__ import annotations

import asyncio
import json
import os
import sys

import pytest

import build_runner


def _events_of(events: list[str]) -> list[dict]:
    return [json.loads(e[len("data: ") :]) for e in events]


async def _collect(**kwargs) -> list[dict]:
    events = []
    async for event in build_runner.stream_compiler_build(**kwargs):
        events.append(event)
    return _events_of(events)


def _write_script(tmp_path, body: str):
    path = tmp_path / "fake_main.py"
    path.write_text(body)
    return path


def test_missing_entrypoint(tmp_path, monkeypatch):
    monkeypatch.setattr(build_runner, "MAIN_PY", tmp_path / "does_not_exist.py")

    events = asyncio.run(_collect(force=False))

    assert events[0]["type"] == "error"
    assert events[0]["kind"] == "missing_entrypoint"
    assert events[1] == {"type": "done", "code": 1, "success": False, "message": "Build failed to start."}
    assert not build_runner.is_build_running()


def test_successful_run(tmp_path, monkeypatch):
    monkeypatch.setattr(build_runner, "MAIN_PY", _write_script(tmp_path, "print('line1')\nprint('line2')\n"))

    events = asyncio.run(_collect(force=False, timeout_seconds=5))

    assert [e["message"] for e in events if e["type"] == "log"] == ["line1", "line2"]
    done = events[-1]
    assert done == {"type": "done", "code": 0, "success": True, "message": "Build complete."}
    assert not build_runner.is_build_running()


def test_nonzero_exit_reports_failure_without_error_event(tmp_path, monkeypatch):
    monkeypatch.setattr(build_runner, "MAIN_PY", _write_script(tmp_path, "import sys\nsys.exit(3)\n"))

    events = asyncio.run(_collect(force=False, timeout_seconds=5))

    assert not any(e["type"] == "error" for e in events)
    done = events[-1]
    assert done == {"type": "done", "code": 3, "success": False, "message": "Build failed (exit 3)."}


def test_timeout_kills_the_process(tmp_path, monkeypatch):
    monkeypatch.setattr(
        build_runner, "MAIN_PY", _write_script(tmp_path, "import time\nprint('hi')\ntime.sleep(30)\n")
    )

    events = asyncio.run(_collect(force=False, timeout_seconds=0.5))

    kinds = [e.get("kind") for e in events if e["type"] == "error"]
    assert "timeout" in kinds
    done = events[-1]
    assert done["type"] == "done"
    assert done["success"] is False
    assert done["code"] == -1
    assert not build_runner.is_build_running()


def test_stop_current_build_mid_run(tmp_path, monkeypatch):
    monkeypatch.setattr(
        build_runner, "MAIN_PY", _write_script(tmp_path, "import time\nprint('hi')\ntime.sleep(30)\n")
    )

    async def scenario():
        events: list[str] = []

        async def consume():
            async for event in build_runner.stream_compiler_build(force=False, timeout_seconds=30):
                events.append(event)

        task = asyncio.create_task(consume())
        for _ in range(100):
            if build_runner.is_build_running():
                break
            await asyncio.sleep(0.02)
        assert build_runner.is_build_running()

        stopped = await build_runner.stop_current_build()
        assert stopped is True

        await asyncio.wait_for(task, timeout=15)
        return _events_of(events)

    events = asyncio.run(scenario())
    done = events[-1]
    assert done == {"type": "done", "code": done["code"], "success": False, "message": "Build stopped by user."}
    assert not build_runner.is_build_running()


def test_stop_current_build_when_nothing_running():
    assert asyncio.run(build_runner.stop_current_build()) is False


def test_spawn_failure_is_reported_not_raised(tmp_path, monkeypatch):
    monkeypatch.setattr(build_runner, "MAIN_PY", _write_script(tmp_path, "print('unreachable')\n"))

    async def failing_create(*args, **kwargs):
        raise FileNotFoundError("no such interpreter")

    monkeypatch.setattr(asyncio, "create_subprocess_exec", failing_create)

    events = asyncio.run(_collect(force=False, timeout_seconds=5))

    assert events[-2]["type"] == "error"
    assert events[-2]["kind"] == "spawn_failed"
    assert events[-1] == {"type": "done", "code": 1, "success": False, "message": "Build failed to start."}
    assert not build_runner.is_build_running()


def test_cancellation_kills_orphaned_process(tmp_path, monkeypatch):
    monkeypatch.setattr(
        build_runner, "MAIN_PY", _write_script(tmp_path, "import time\nprint('hi')\ntime.sleep(30)\n")
    )

    async def scenario():
        async def consume():
            async for _ in build_runner.stream_compiler_build(force=False, timeout_seconds=30):
                pass

        task = asyncio.create_task(consume())
        for _ in range(100):
            if build_runner.is_build_running():
                break
            await asyncio.sleep(0.02)
        assert build_runner.is_build_running()
        pid = build_runner._current_process.pid

        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass

        await asyncio.sleep(0.3)
        return pid

    pid = asyncio.run(scenario())
    assert not build_runner.is_build_running()

    with pytest.raises(ProcessLookupError):
        os.kill(pid, 0)


def test_kill_process_tolerates_already_exited(tmp_path, monkeypatch):
    monkeypatch.setattr(build_runner, "MAIN_PY", _write_script(tmp_path, "print('done')\n"))

    async def scenario():
        process = await asyncio.create_subprocess_exec(
            sys.executable, "-c", "pass", stdout=asyncio.subprocess.PIPE
        )
        await process.wait()
        # Process has already exited; killing it again must not raise.
        await build_runner._kill_process(process)

    asyncio.run(scenario())
