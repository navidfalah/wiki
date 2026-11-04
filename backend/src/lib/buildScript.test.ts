import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { expect, it } from 'vitest';

it('builds the backend before compiling and then builds the frontend', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wiki-build-script-'));
  try {
    for (const folder of ['backend/node_modules', 'frontend/node_modules', 'compiler', 'bin']) fs.mkdirSync(path.join(root, folder), { recursive: true });
    fs.copyFileSync(path.resolve(__dirname, '../../../build_wiki.js'), path.join(root, 'build_wiki.js'));
    const log = path.join(root, 'calls.log');
    fs.writeFileSync(path.join(root, 'bin/npm'), '#!/usr/bin/env node\nrequire("fs").appendFileSync(process.env.WIKI_BUILD_TEST_LOG,`npm ${process.cwd().split("/").pop()} ${process.argv.slice(2).join(" ")}\\n`);\n', { mode: 0o755 });
    fs.writeFileSync(path.join(root, 'compiler/main.js'), 'require("fs").appendFileSync(process.env.WIKI_BUILD_TEST_LOG,`compiler ${process.argv.slice(2).join(" ")}\\n`);\n');
    const result = spawnSync(process.execPath, [path.join(root, 'build_wiki.js'), '--force'], { env: { ...process.env, WIKI_BUILD_TEST_LOG: log, PATH: `${path.join(root, 'bin')}${path.delimiter}${process.env.PATH}` }, encoding: 'utf8' });
    expect(result.status, result.stderr).toBe(0);
    expect(fs.readFileSync(log, 'utf8').trim().split('\n')).toEqual(['npm backend run build', 'compiler --force', 'npm frontend run build']);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
