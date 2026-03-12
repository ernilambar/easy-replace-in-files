# Changelog

## [2.0.0] - 2026-03-12

### Breaking

* **Removed** `easyRelaceInFiles` (typo alias). Use `easyReplaceInFiles` only. If you were using the old name in code, rename to `easyReplaceInFiles`.
* **CLI** `--config` with no path (e.g. `--config` as last arg or `--config --verbose`) now exits with code 1 and an error message instead of falling back to the default config file.

## [1.0.4] - 2026-03-12

* Added - Error handling: exit code 1 on config not found, invalid JSON, missing key, or failed rules; per-rule failure tracking with summary.
* Added - Config validation: plain object required; `easyReplaceInFiles` must be an array; rule validation for files/from/to with skip and coercion.
* Added - Summary counts (succeeded/skipped/failed); `--verbose` flag.

## [1.0.0]

* Added - Find and replace in files via config file; globs, regex type, env and package placeholders; CLI.
