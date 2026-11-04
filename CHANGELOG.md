# Changelog

## X.X.X - YYYY-MM-DD
- Changed: String mode replaces all occurrences (breaking).
- Changed: Invalid regex fails the rule (breaking).
- Changed: `from`/`to` length mismatch skips the rule (breaking).
- Changed: Unresolved placeholders in `to` kept as-is (breaking).
- Changed: Require Node.js 22.13+ (breaking).
- Fixed: Empty `files`/`from` array items rejected.
- Fixed: Placeholder values inserted literally (`$&`, `$1`, `$$`).
- Fixed: `package__*` reads `package.json` from `cwd`.

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
