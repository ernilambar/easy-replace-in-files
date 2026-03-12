# Changelog

## [1.0.4] - 2026-03-12

* Added - Error handling: exit code 1 on config not found, invalid JSON, missing key, or failed rules; per-rule failure tracking with summary.
* Added - Config validation: plain object required; `easyReplaceInFiles` must be an array; rule validation for files/from/to with skip and coercion.
* Added - Summary counts (succeeded/skipped/failed); `--verbose` flag.

## [1.0.0]

* Added - Find and replace in files via config file; globs, regex type, env and package placeholders; CLI.
