# AGENTS.md

## Overview

`easy-replace-in-files` is a Node 22+ ESM CLI that runs find-and-replace rules from a JSON config. Core stack: Node ESM, `replace-in-file`, `minimist`, `ajv`, `chalk`, `xo` lint, `node:test`.

## Setup

```sh
node --version # must be >=22
npm ci
```

If dev dependencies are skipped (e.g. `NODE_ENV=production`), run `npm ci --include=dev` — `xo` is a dev dependency. No env vars, dotenv, or extra configuration required; placeholders read from `process.env` and nearest `package.json` at runtime.

## Commands

```sh
echo "no build step - pure ESM, no bundling"
npm test # node --test test/*.test.js
npm run lint # xo
npm run format # xo --fix
echo "no typecheck - JSDoc types only, no tsc"
```

Run the CLI locally with `node index.js --help` or `node index.js --dry-run --verbose`.

## Conventions

- ESM only: `type: module`, use `import` and explicit `.js` extensions in relative imports.
- Linter is `xo` configured in `xo.config.js`.
- Never throw from `easyReplaceInFiles(opts)`; catch `loadConfig` errors, print to stderr, return `{ succeeded, skipped, failed, ok }`. Only `index.js` calls `process.exit(1)` on `ok: false`. Library/tests must pass `noExit: true`.
- Config precedence is `easy-replace-in-files.json` over `easy-replace.json`, with `--config <path>` overriding both; resolve relative paths against `cwd` and normalize with `unixify`.
- Schema in `src/schemas/config.schema.json` is the source of truth; invalid rules are skipped with `WARN`, failures increment `failed`, and `ok` is `failedCount === 0`. Keep runtime validators in `src/utils.js` in sync.
- Placeholders (`$$ENV_VAR$$`, `$$package__field$$`) are expanded in `to` and `files` only, env first then `package.json` via `read-pkg-up`; `dry-run` must pass `dry: true` and never write files.

## Quality gate

Run in order; each must exit `0` before declaring a task complete:

```sh
npm ci
npm run lint
npm test
```
