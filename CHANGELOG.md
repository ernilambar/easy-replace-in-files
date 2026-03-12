# Changelog

## [2.0.0] - 2026-03-12

* Added - Config validation via JSON Schema; invalid config fails at load.
* Added - Optional config file `easy-replace.json`
* Added - Introduce `--dry-run` flag.
* Changed - Invalid rules fail at load instead of being skipped at runtime.
* Removed - Typo alias `easyRelaceInFiles`; use `easyReplaceInFiles`.

## [1.0.4] - 2026-03-12

* Added - Exit code 1 on config/rule errors; per-rule failure tracking and summary.
* Added - Config validation (object, `easyReplaceInFiles` array, rule shape).
* Added - Summary counts and `--verbose`.

## [1.0.0]

* Added - Find/replace via config; globs, regex, placeholders; CLI.
