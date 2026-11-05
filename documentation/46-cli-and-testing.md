# 46 — JavaScript CLI and verification commands

The repository workflow entrypoint is the Node script at the root. The app and compiler code run on JavaScript/TypeScript; compiler functionality lives in `backend/` and `compiler/`.

## Commands

| Command | Purpose |
|---|---|
| `./wiki doctor` | Report Node, npm, git, installed packages, optional Playwright and Docker. |
| `./wiki setup [--browsers]` | Install backend and frontend npm dependencies; optionally install Chromium. |
| `./wiki dev` | Start the backend and frontend development servers together. |
| `./wiki lint` | Run backend and frontend linters. |
| `./wiki typecheck` | Run backend and frontend TypeScript checks. |
| `./wiki test` | Run backend and frontend Vitest suites. |
| `./wiki coverage` | Run Vitest coverage with the configured package floors. |
| `./wiki build` | Build the backend and frontend. |
| `./wiki eval` | Run the offline compiler evaluation gate. |
| `./wiki bench` | Run compiler and retrieval benchmarks. |
| `./wiki e2e [-- ARGS]` | Build the frontend and run Playwright with forwarded arguments. |
| `./wiki docker` | Validate production Compose configurations and build images. |
| `./wiki audit` | Audit production npm dependencies. |
| `./wiki check` | Run lint, typecheck and unit tests. |
| `./wiki ci [--e2e] [--docker]` | Run the project verification sequence, optionally including browser and Docker checks. |
| `./wiki list` | Print the available workflow commands. |

Use `--only backend` or `--only frontend` to select a package for package-scoped commands. Use `--dry-run` to print commands without running them and `--fail-fast` to stop after the first failed step.

The current automated test suites are Vitest suites in `backend/src/` and `frontend/`. The old Python CLI, compiler modules, pytest suite and Python test-data generators have been removed; they are not part of the runtime or setup process.

The former JSON command bridge has a JavaScript compatibility entry point at `node compiler/cli.js <command>`. Build the backend first with `npm run build --prefix backend`. It supports chat, email, review, entity/temporal facts, and connector commands; use `node compiler/cli.js --serve` for the persistent NDJSON worker protocol. The root `./wiki` command remains the recommended workflow interface.
