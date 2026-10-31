# Changelog

## Unreleased
- Changed: Require Node.js 22.13+.
- Changed: Replaced deprecated `read-pkg-up` with `read-package-up`.
- Updated: `replace-in-file` 9, `chalk` 6, `ajv` 8.20, `unixify` 1.
- Updated (dev): `eslint` 10, `neostandard` 0.14 (ESLint 10 support).
- Security: Added `overrides` pinning `glob` 14 and `minimatch` 11 to clear
  GHSA-3g3m-2fjr-6pw4 and GHSA-g3hv-75wg-m249 (`npm audit` now reports 0).

## 2.0.0 - 2026-03-12
- Added: Config validation via JSON Schema; invalid config fails at load.
- Added: Optional config file `easy-replace.json`
- Added: Introduce `--dry-run` flag.
- Changed: Invalid rules fail at load instead of being skipped at runtime.
- Changed: Removed typo alias `easyRelaceInFiles`; use `easyReplaceInFiles`.

## 1.0.4 - 2026-03-12
- Added: Exit code 1 on config/rule errors; per-rule failure tracking and summary.
- Added: Config validation (object, `easyReplaceInFiles` array, rule shape).
- Added: Summary counts and `--verbose`.

## 1.0.0 - 2022-08-19
- Added: Find/replace via config; globs, regex, placeholders; CLI.
