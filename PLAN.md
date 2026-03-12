# Implementation plan (phase-wise)

**Target: 2.0.0.** Breaking changes are allowed; we keep the tool **simple** and avoid overdoing it (no heavy new features, no TypeScript, no JSON Schema, no big restructure).

Priorities: **robust**, **tested**, **futureproof**, **edge-case safe**. Phases ordered so **minimal refactor** comes first.

---

## Phase 1: Lock in behavior with tests (no refactor)

**Goal:** Maximize test coverage for existing code so future changes are safe. No production code changes unless a test exposes a bug.

### 1.1 Config loader (`src/config.js`)

- [ ] **Unit tests for `loadConfig`**
  - Config file missing → throws with clear message (no `--config` hint when custom path given).
  - Config file path given but missing → throws "File not found: <path>".
  - Config unreadable (e.g. permission) → throws "Cannot read config file: ...".
  - Invalid JSON → throws "Invalid JSON in config file: ...".
  - Config is not a plain object (e.g. `[]`, `"x"`, `42`) → throws expected shape message.
  - Missing key `easyReplaceInFiles` → throws with expected shape message.
  - `easyReplaceInFiles` is not an array (e.g. `{}`, string) → throws.
  - Valid config (object + array, including empty array) → returns `{ configData, configFilePath }`.
  - `configPath` relative to `cwd` and absolute `configPath` resolve correctly.

### 1.2 Utils not yet covered

- [ ] **`isPlainObject`** — plain object, `null`, array, string, number, class instance.
- [ ] **`isValidFiles` / `isValidFrom` / `isValidTo`** — happy path and borders: empty string, empty array, array with empty string, non-stringifiable elements, valid arrays.
- [ ] **`truncate`** — string under/over max length; non-string coerced to string.
- [ ] **`isStringifiable`** (if used in validation) — string, number, boolean, null; reject object, array, undefined (if that affects validation).

### 1.3 App integration

- [ ] **Rule with invalid regex** — `type: 'regex'` and invalid pattern: ensure either rule is skipped or error is caught and counted as failed (and no crash).

**Exit criteria:** All current behavior covered by tests; `npm test` passes; no intentional production refactor.

---

## Phase 2: Edge cases and error handling (minimal refactor)

**Goal:** Define and implement behavior for edge cases and failure modes so the CLI is predictable and safe.

### 2.1 Config and CLI args

- [ ] **`--config` without value** — CLI: avoid reading `undefined` as path; exit 1 with clear message or treat as “use default path” (document choice).
- [ ] **Config has extra top-level keys** — Keep allowed (no change) and document; or validate strict shape (minimal code).

### 2.2 Rule validation and replace-in-file behavior

- [ ] **`from` and `to` array length mismatch** — `replace-in-file` behavior: document and/or validate (e.g. warn and skip rule, or align lengths by truncation/padding). Add test.
- [ ] **Empty `to`** — Allowed (replace with empty string). Add test so it stays allowed.
- [ ] **No files matching glob** — Does `replaceInFileSync` throw or return? Add test; if it throws, catch and count as failed with clear message.
- [ ] **Invalid regex in rule** — `getParamValue` returns string for invalid regex; `replace-in-file` may still fail. Either: (a) validate regex when `type === 'regex'` and skip rule with warn, or (b) catch replace error and count as failed. Add test.
- [ ] **Unreadable or unwritable file** — Catch replace errors and count as failed; don’t crash. Add test (e.g. permission or read-only).

### 2.3 Placeholders and paths

- [ ] **`package__` nested key (e.g. `package__scripts.build`)** — Current code uses `pkg[pvar]` so only top-level works. Document or extend (minimal impl: e.g. split by `.` and traverse). Test current behavior.
- [ ] **Placeholder key with `$$` inside** — Document behavior; add test for one pattern (e.g. `$$a$$b$$`).
- [ ] **Absolute path in rule `files`** — Already resolved when not absolute; test that absolute path is used as-is relative to `cwd` where relevant.
- [ ] **Empty string placeholder `$$$$`** — Already tested in utils; ensure app doesn’t break when used in `files`/`to`.

### 2.4 Environment and output

- [ ] **Stderr vs stdout** — Ensure errors and summary go to stderr on failure so scripts can rely on exit code and clean stdout. Add test (e.g. capture stderr).
- [ ] **Unicode and special characters** — One test with non-ASCII in file path (if supported) and in content; document any limits.

**Exit criteria:** Edge cases documented and tested; errors handled without crash; optional small validation/warning changes only.

---

## Phase 3: Futureproofing and maintainability (light refactor)

**Goal:** Make the codebase easier to maintain and extend without breaking the public API.

### 3.1 Contracts and types

- [ ] **JSDoc** — Complete `@param`, `@returns`, `@throws` for public functions (config, app, utils exports). Use `@typedef` for options and return types where helpful.
- [ ] **Config shape** — Document rule shape (files, from, to, type) and optionally add a small runtime check (e.g. allowed `type` values) with a clear error message.

### 3.2 Dependencies and Node

- [ ] **Engines** — `package.json` already has `>=18`; add to docs and CI (e.g. test on 18 and 20).
- [ ] **Dependency hygiene** — Periodically review `replace-in-file`, `read-pkg-up`, `chalk`, `unixify` for security and API stability; lockfile in CI.

### 3.3 Developer experience

- [ ] **README** — Document edge cases (empty `to`, no match, invalid regex, from/to length), and that summary/errors go to stderr on failure. Skip dry-run unless there’s a clear need; keep the tool simple.

**Exit criteria:** Docs and JSDoc complete; no large structural change.

---

## Phase 4: 2.0 breaking changes (minimal)

**Goal:** Use 2.0 to clean up in a small, well-defined way. No extra “major version” features.

- [ ] **Remove `easyRelaceInFiles`** — Delete the typo alias and its deprecation warning from `src/app.js`; export only `easyReplaceInFiles`. Document in CHANGELOG as breaking for anyone using the old name.
- [ ] **`--config` without value** — CLI: if `--config` is last arg or followed by another flag, exit 1 with a clear message (treat as invalid usage). Simple and predictable.
- [ ] **No other breaking changes** unless we discover a real bug (e.g. wrong behavior we must fix). Don’t add JSON Schema, TypeScript, or file renames just because it’s 2.0.

---

## Summary

| Phase | Focus                    | Refactor   |
|-------|--------------------------|------------|
| 1     | Tests for existing code  | None       |
| 2     | Edge cases, errors       | Minimal    |
| 3     | Docs, JSDoc               | Light      |
| 4     | 2.0 breaks (remove alias, fix --config) | Minimal |

**Order:** Phase 1 → 2 → 3, then Phase 4 when cutting 2.0.0.
