"""Tests for the repository's ./wiki command line (a Python script at the repo root)."""

import json
import os
import subprocess
import sys
from importlib.machinery import SourceFileLoader
from importlib.util import module_from_spec, spec_from_loader
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]


def _load():
    loader = SourceFileLoader("wiki_cli", str(ROOT / "wiki"))
    module = module_from_spec(spec_from_loader("wiki_cli", loader))
    sys.modules["wiki_cli"] = module  # dataclasses look their module up here
    loader.exec_module(module)
    return module


cli = _load()


@pytest.fixture(autouse=True)
def _outside_ci(monkeypatch):
    """These tests also run *on* GitHub Actions: don't let the real job's
    environment change the CLI's behaviour or leak into its step summary."""
    monkeypatch.setattr(cli, "IN_CI", False)
    monkeypatch.delenv("GITHUB_STEP_SUMMARY", raising=False)


def ns(**kw):
    import argparse

    defaults = {"changed": False, "only": None, "package": None, "base": "origin/main"}
    return argparse.Namespace(**{**defaults, **kw})


class TestPackageSelection:
    def test_defaults_to_everything(self):
        assert cli.select_packages(ns()) == list(cli.PACKAGES)

    def test_comma_separated_and_repeated(self):
        assert cli.select_packages(ns(only=["compiler,backend"])) == ["compiler", "backend"]
        assert cli.select_packages(ns(only=["frontend", "compiler"])) == ["frontend", "compiler"]

    def test_positional_package(self):
        assert cli.select_packages(ns(package="backend")) == ["backend"]

    def test_unknown_package_is_an_error(self):
        with pytest.raises(SystemExit, match="Unknown package"):
            cli.select_packages(ns(only=["compiler,docs"]))


class TestStepComposition:
    def test_ci_runs_lint_types_coverage_eval_and_build_per_package(self):
        steps = cli.ci_steps(["compiler", "backend"], e2e=False, docker=False)
        assert [(s.package, s.name) for s in steps] == [
            ("compiler", "lint"),
            ("compiler", "coverage"),
            ("compiler", "eval-gate"),
            ("backend", "lint"),
            ("backend", "typecheck"),
            ("backend", "coverage"),
            ("backend", "build"),
        ]

    def test_ci_extras(self):
        names = [s.name for s in cli.ci_steps([], e2e=True, docker=True)]
        assert names[:2] == ["build", "e2e"]
        assert "images" in names and "compose-config" in names

    def test_coverage_uses_the_floors(self):
        compiler, backend, *_ = cli.test_steps(["compiler", "backend", "frontend"], coverage=True)
        assert f"--cov-fail-under={cli.COVERAGE_FLOORS['compiler']}" in compiler.cmd
        assert f"--coverage.thresholds.statements={cli.COVERAGE_FLOORS['backend']}" in backend.cmd

    def test_filter_expression(self):
        compiler, backend = cli.test_steps(["compiler", "backend"], expr="search")
        assert compiler.cmd[-2:] == ["-k", "search"]
        assert backend.cmd[-1] == "search"

    def test_lint_covers_the_cli_itself(self):
        (compiler,) = cli.lint_steps(["compiler"])
        assert "../wiki" in compiler.cmd

    def test_eval_update_baseline(self):
        assert cli.eval_steps(update_baseline=True)[0].cmd[-1] == "--update-baseline"


def step(cmd, **kw):
    return cli.Step("t", kw.pop("package", "compiler"), cmd, kw.pop("cwd", ROOT), **kw)


class TestRunning:
    def test_pass_and_fail(self):
        ok = cli.run_step(step([sys.executable, "-c", "print('hi')"]), stream=False)
        bad = cli.run_step(step([sys.executable, "-c", "import sys; print('boom'); sys.exit(3)"]), stream=False)
        assert (ok.status, ok.output.strip()) == ("pass", "hi")
        assert (bad.status, bad.note) == ("fail", "exit 3")
        assert "boom" in bad.output

    def test_missing_node_modules_is_a_skip_not_a_failure(self, tmp_path):
        r = cli.run_step(step(["npm", "run", "lint"], cwd=tmp_path, requires="node_modules"), stream=False)
        assert r.status == "skip" and "node_modules" in r.note

    def test_missing_python_module_is_a_skip(self):
        r = cli.run_step(step([sys.executable, "-m", "no_such_module_xyz"], requires="python:no_such_module_xyz"), stream=False)
        assert r.status == "skip" and "no_such_module_xyz" in r.note

    def test_audit_covers_python_dependencies_too(self):
        steps = cli.audit_steps(list(cli.PACKAGES))
        assert [s.package for s in steps] == ["compiler", "backend", "frontend", "mcp"]
        assert steps[0].cmd[1:3] == ["-m", "pip_audit"] and steps[0].requires == "python:pip_audit"

    def test_fail_fast_stops_after_the_first_failure(self):
        steps = [step([sys.executable, "-c", "raise SystemExit(1)"]), step([sys.executable, "-c", "pass"])]
        assert len(cli.run_all(steps, stream=False, fail_fast=True, parallel=False)) == 1
        assert len(cli.run_all(steps, stream=False, fail_fast=False, parallel=False)) == 2

    def test_parallel_keeps_every_result(self):
        steps = [step([sys.executable, "-c", "pass"], package=p) for p in ("compiler", "backend", "frontend")]
        results = cli.run_all(steps, stream=False, fail_fast=False, parallel=True)
        assert sorted(r.step.package for r in results) == ["backend", "compiler", "frontend"]


class TestReport:
    def results(self):
        return [
            cli.Result(step([sys.executable]), "pass", 1.2),
            cli.Result(step([sys.executable], package="backend"), "fail", 0.5, output="line1\nline2", note="exit 1"),
            cli.Result(step([sys.executable], package="frontend"), "skip", 0.0, note="no node_modules"),
        ]

    def test_exit_code_reflects_failures(self, capsys):
        assert cli.report(self.results(), "x", None) == 1
        assert cli.report(self.results()[:1], "x", None) == 0
        out = capsys.readouterr().out
        assert "1 failed" in out and "line2" in out

    def test_a_skip_passes_locally_but_fails_on_ci(self, capsys):
        only_skip = [self.results()[0], self.results()[2]]
        assert cli.report(only_skip, "x", None, strict=False) == 0
        assert cli.report(only_skip, "x", None, strict=True) == 1
        assert "1 failed" in capsys.readouterr().out

    def test_json_and_github_step_summary(self, tmp_path, monkeypatch):
        summary = tmp_path / "summary.md"
        monkeypatch.setenv("GITHUB_STEP_SUMMARY", str(summary))
        report_file = tmp_path / "report.json"
        cli.report(self.results(), "ci (all)", str(report_file))
        data = json.loads(report_file.read_text())
        assert [r["status"] for r in data] == ["pass", "fail", "skip"]
        md = summary.read_text()
        assert md.startswith("### ci (all)") and "| backend | t | ❌ fail |" in md


def run_cli(*args, cwd=ROOT):
    env = {k: v for k, v in os.environ.items() if k not in ("GITHUB_ACTIONS", "CI", "GITHUB_STEP_SUMMARY")}
    return subprocess.run([sys.executable, str(ROOT / "wiki"), *args], cwd=cwd, capture_output=True, text=True, timeout=60, env=env)


class TestCommandLine:
    def test_help_lists_the_commands(self):
        out = run_cli("--help").stdout
        for command in ("doctor", "check", "coverage", "eval", "e2e", "docker", "ci", "dev"):
            assert command in out

    def test_dry_run_prints_commands_without_running(self):
        proc = run_cli("ci", "--only", "compiler", "--dry-run")
        assert proc.returncode == 0
        assert "pytest" in proc.stdout and "eval_gate.py" in proc.stdout

    def test_docker_command(self):
        proc = run_cli("docker", "--dry-run")
        assert proc.returncode == 0
        assert "compose" in proc.stdout and "caddy validate" in proc.stdout and "build" in proc.stdout

    def test_list(self):
        assert "Coverage floors" in run_cli("list").stdout

    def test_unknown_package_exits_non_zero(self):
        proc = run_cli("test", "--only", "nope")
        assert proc.returncode != 0 and "Unknown package" in (proc.stdout + proc.stderr)


class TestChangedPackages:
    def git(self, repo, *args):
        subprocess.run(["git", *args], cwd=repo, check=True, capture_output=True)

    @pytest.fixture
    def repo(self, tmp_path, monkeypatch):
        self.git(tmp_path, "init", "-q", "-b", "main")
        self.git(tmp_path, "config", "user.email", "t@example.test")
        self.git(tmp_path, "config", "user.name", "t")
        for pkg in cli.PACKAGES:
            (tmp_path / pkg).mkdir()
            (tmp_path / pkg / "a.txt").write_text("a")
        self.git(tmp_path, "add", ".")
        self.git(tmp_path, "commit", "-q", "-m", "init")
        monkeypatch.setattr(cli, "ROOT", tmp_path)
        return tmp_path

    def test_only_the_touched_package(self, repo):
        (repo / "backend" / "b.txt").write_text("new")
        assert cli.changed_packages("main") == ["backend"]

    def test_shared_files_select_everything(self, repo):
        (repo / ".github").mkdir()
        (repo / ".github" / "ci.yml").write_text("x")
        assert cli.changed_packages("main") == list(cli.PACKAGES)

    def test_the_cli_itself_selects_everything(self, repo):
        (repo / "wiki").write_text("x")
        assert cli.changed_packages("main") == list(cli.PACKAGES)

    def test_wiki_app_is_not_mistaken_for_the_cli(self, repo):
        (repo / "wiki-app" / "docs").mkdir(parents=True)
        (repo / "wiki-app" / "docs" / "page.md").write_text("x")
        (repo / "frontend" / "b.txt").write_text("new")
        assert cli.changed_packages("main") == ["frontend"]

    def test_nothing_changed(self, repo):
        assert cli.changed_packages("main") == []

    def test_bad_base_falls_back_to_everything(self, repo):
        assert cli.changed_packages("no-such-ref") == list(cli.PACKAGES)
