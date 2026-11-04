import { describe, it } from 'node:test'
import assert from 'node:assert'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { easyReplaceInFiles } from '../src/app.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')

describe('easyReplaceInFiles (programmatic)', () => {
  it('returns result object with succeeded, skipped, failed, ok', () => {
    const tmp = fs.mkdtempSync(path.join(projectRoot, 'tmp-app-test-'))
    try {
      fs.writeFileSync(path.join(tmp, 'easy-replace-in-files.json'), JSON.stringify({
        easyReplaceInFiles: [
          { files: 'f.txt', from: 'a', to: 'b' }
        ]
      }))
      fs.writeFileSync(path.join(tmp, 'f.txt'), 'a')

      const result = easyReplaceInFiles({ cwd: tmp, noExit: true })
      assert.strictEqual(result.succeeded, 1)
      assert.strictEqual(result.skipped, 0)
      assert.strictEqual(result.failed, 0)
      assert.strictEqual(result.ok, true)
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('returns ok: false and does not exit when noExit and config missing', () => {
    const tmp = fs.mkdtempSync(path.join(projectRoot, 'tmp-app-test-'))
    try {
      const result = easyReplaceInFiles({ cwd: tmp, noExit: true })
      assert.strictEqual(result.ok, false)
      assert.strictEqual(result.succeeded, 0)
      assert.strictEqual(result.failed, 0)
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('return value includes succeeded, skipped, failed counts and ok', () => {
    const tmp = fs.mkdtempSync(path.join(projectRoot, 'tmp-app-test-'))
    try {
      fs.writeFileSync(path.join(tmp, 'ok.txt'), 'a')
      fs.writeFileSync(path.join(tmp, 'easy-replace-in-files.json'), JSON.stringify({
        easyReplaceInFiles: [
          { files: 'ok.txt', from: 'a', to: 'b' },
          { files: '', from: 'x', to: 'y' },
          { files: 'ok.txt', from: 'b', to: 'c' }
        ]
      }))

      const result = easyReplaceInFiles({ cwd: tmp, noExit: true })
      // Invalid rule (empty files) fails schema validation at load; no rules run
      assert.strictEqual(result.succeeded, 0)
      assert.strictEqual(result.skipped, 0)
      assert.strictEqual(result.failed, 0)
      assert.strictEqual(result.ok, false)
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('uses configPath when provided', () => {
    const tmp = fs.mkdtempSync(path.join(projectRoot, 'tmp-app-test-'))
    try {
      fs.writeFileSync(path.join(tmp, 'my-config.json'), JSON.stringify({
        easyReplaceInFiles: [{ files: 'f.txt', from: 'X', to: 'Y' }]
      }))
      fs.writeFileSync(path.join(tmp, 'f.txt'), 'X')

      const result = easyReplaceInFiles({ cwd: tmp, configPath: 'my-config.json', noExit: true })
      assert.strictEqual(result.ok, true)
      assert.strictEqual(fs.readFileSync(path.join(tmp, 'f.txt'), 'utf8'), 'Y')
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('rule with invalid regex fails without crashing; file untouched, other rules still run', () => {
    const tmp = fs.mkdtempSync(path.join(projectRoot, 'tmp-app-test-'))
    try {
      fs.writeFileSync(path.join(tmp, 'easy-replace-in-files.json'), JSON.stringify({
        easyReplaceInFiles: [
          { files: 'f.txt', from: '[unclosed', type: 'regex', to: 'FIXED' },
          { files: 'f.txt', from: 'after', to: 'later' }
        ]
      }))
      fs.writeFileSync(path.join(tmp, 'f.txt'), 'before [unclosed after')

      const result = easyReplaceInFiles({ cwd: tmp, noExit: true })
      assert.strictEqual(result.succeeded, 1)
      assert.strictEqual(result.failed, 1)
      assert.strictEqual(result.ok, false)
      assert.strictEqual(fs.readFileSync(path.join(tmp, 'f.txt'), 'utf8'), 'before [unclosed later')
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('accepts config with extra top-level keys (ignored)', () => {
    const tmp = fs.mkdtempSync(path.join(projectRoot, 'tmp-app-test-'))
    try {
      fs.writeFileSync(path.join(tmp, 'easy-replace-in-files.json'), JSON.stringify({
        easyReplaceInFiles: [{ files: 'f.txt', from: 'a', to: 'b' }],
        extraKey: true,
        another: 42
      }))
      fs.writeFileSync(path.join(tmp, 'f.txt'), 'a')
      const result = easyReplaceInFiles({ cwd: tmp, noExit: true })
      assert.strictEqual(result.ok, true)
      assert.strictEqual(fs.readFileSync(path.join(tmp, 'f.txt'), 'utf8'), 'b')
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('allows empty string as to (replace with empty string)', () => {
    const tmp = fs.mkdtempSync(path.join(projectRoot, 'tmp-app-test-'))
    try {
      fs.writeFileSync(path.join(tmp, 'easy-replace-in-files.json'), JSON.stringify({
        easyReplaceInFiles: [{ files: 'f.txt', from: 'DELETE', to: '' }]
      }))
      fs.writeFileSync(path.join(tmp, 'f.txt'), 'a DELETE b')
      const result = easyReplaceInFiles({ cwd: tmp, noExit: true })
      assert.strictEqual(result.ok, true)
      assert.strictEqual(fs.readFileSync(path.join(tmp, 'f.txt'), 'utf8'), 'a  b')
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('from/to item count mismatch: rule skipped with WARN, file untouched', () => {
    const tmp = fs.mkdtempSync(path.join(projectRoot, 'tmp-app-test-'))
    try {
      fs.writeFileSync(path.join(tmp, 'f.txt'), 'A B C')
      fs.writeFileSync(path.join(tmp, 'easy-replace-in-files.json'), JSON.stringify({
        easyReplaceInFiles: [
          { files: 'f.txt', from: ['A', 'B', 'C'], to: ['1', '2'] },
          { files: 'f.txt', from: 'A', to: ['1', '2'] },
          { files: 'f.txt', from: 'A', to: [] }
        ]
      }))
      const result = easyReplaceInFiles({ cwd: tmp, noExit: true })
      assert.strictEqual(result.succeeded, 0)
      assert.strictEqual(result.skipped, 3)
      assert.strictEqual(result.failed, 0)
      assert.strictEqual(result.ok, true)
      assert.strictEqual(fs.readFileSync(path.join(tmp, 'f.txt'), 'utf8'), 'A B C')
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('string to with array from applies to every from item', () => {
    const tmp = fs.mkdtempSync(path.join(projectRoot, 'tmp-app-test-'))
    try {
      fs.writeFileSync(path.join(tmp, 'f.txt'), 'A B C')
      fs.writeFileSync(path.join(tmp, 'easy-replace-in-files.json'), JSON.stringify({
        easyReplaceInFiles: [{ files: 'f.txt', from: ['A', 'B'], to: 'X' }]
      }))
      const result = easyReplaceInFiles({ cwd: tmp, noExit: true })
      assert.strictEqual(result.succeeded, 1)
      assert.strictEqual(result.skipped, 0)
      assert.strictEqual(fs.readFileSync(path.join(tmp, 'f.txt'), 'utf8'), 'X X C')
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('string mode replaces all occurrences, metacharacters literal', () => {
    const tmp = fs.mkdtempSync(path.join(projectRoot, 'tmp-app-test-'))
    try {
      fs.writeFileSync(path.join(tmp, 'f.txt'), 'X X X a.b axb')
      fs.writeFileSync(path.join(tmp, 'easy-replace-in-files.json'), JSON.stringify({
        easyReplaceInFiles: [
          { files: 'f.txt', from: 'X', to: 'Y' },
          { files: 'f.txt', from: ['a.b'], to: ['Z'] }
        ]
      }))
      const result = easyReplaceInFiles({ cwd: tmp, noExit: true })
      assert.strictEqual(result.ok, true)
      assert.strictEqual(fs.readFileSync(path.join(tmp, 'f.txt'), 'utf8'), 'Y Y Y Z axb')
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('empty string in from/files array fails validation; file untouched', () => {
    const tmp = fs.mkdtempSync(path.join(projectRoot, 'tmp-app-test-'))
    try {
      fs.writeFileSync(path.join(tmp, 'f.txt'), 'hello')
      for (const rule of [
        { files: 'f.txt', from: [''], to: 'INJECT' },
        { files: [''], from: 'hello', to: 'x' }
      ]) {
        fs.writeFileSync(path.join(tmp, 'easy-replace-in-files.json'), JSON.stringify({ easyReplaceInFiles: [rule] }))
        const result = easyReplaceInFiles({ cwd: tmp, noExit: true })
        assert.strictEqual(result.ok, false)
        assert.strictEqual(fs.readFileSync(path.join(tmp, 'f.txt'), 'utf8'), 'hello')
      }
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('placeholder values with $ patterns are written literally; template backrefs still work', () => {
    const tmp = fs.mkdtempSync(path.join(projectRoot, 'tmp-app-test-'))
    const key = 'APP_DOLLAR_' + Date.now()
    process.env[key] = "[$&-$1-$'-$$]"
    try {
      fs.writeFileSync(path.join(tmp, 'f.txt'), 'v=X ver=1.2')
      fs.writeFileSync(path.join(tmp, 'easy-replace-in-files.json'), JSON.stringify({
        easyReplaceInFiles: [
          { files: 'f.txt', from: 'X', to: `$$${key}$$` },
          { files: 'f.txt', from: 'ver=(\\d)', type: 'regex', to: `ver=$1:$$${key}$$` }
        ]
      }))
      const result = easyReplaceInFiles({ cwd: tmp, noExit: true })
      assert.strictEqual(result.ok, true)
      assert.strictEqual(
        fs.readFileSync(path.join(tmp, 'f.txt'), 'utf8'),
        "v=[$&-$1-$'-$$] ver=1:[$&-$1-$'-$$].2"
      )
    } finally {
      delete process.env[key]
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('placeholder in files path with $ is used literally', () => {
    const tmp = fs.mkdtempSync(path.join(projectRoot, 'tmp-app-test-'))
    const key = 'APP_FILE_' + Date.now()
    process.env[key] = 'a$&b'
    try {
      fs.writeFileSync(path.join(tmp, 'a$&b.txt'), 'X')
      fs.writeFileSync(path.join(tmp, 'easy-replace-in-files.json'), JSON.stringify({
        easyReplaceInFiles: [{ files: `$$${key}$$.txt`, from: 'X', to: 'Y' }]
      }))
      const result = easyReplaceInFiles({ cwd: tmp, noExit: true })
      assert.strictEqual(result.ok, true)
      assert.strictEqual(fs.readFileSync(path.join(tmp, 'a$&b.txt'), 'utf8'), 'Y')
    } finally {
      delete process.env[key]
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('package__ placeholders resolve from package.json nearest to cwd, not process.cwd()', () => {
    const tmp = fs.mkdtempSync(path.join(projectRoot, 'tmp-app-test-'))
    try {
      fs.writeFileSync(path.join(tmp, 'package.json'), JSON.stringify({ name: 'inner-pkg', version: '9.9.9', repository: { url: 'x' } }))
      fs.writeFileSync(path.join(tmp, 'f.txt'), 'N V R')
      fs.writeFileSync(path.join(tmp, 'easy-replace-in-files.json'), JSON.stringify({
        easyReplaceInFiles: [{ files: 'f.txt', from: ['N', 'V', 'R'], to: ['$$package__name$$', '$$package__version$$', '$$package__repository$$'] }]
      }))
      const result = easyReplaceInFiles({ cwd: tmp, noExit: true })
      assert.strictEqual(result.ok, true)
      assert.strictEqual(fs.readFileSync(path.join(tmp, 'f.txt'), 'utf8'), 'inner-pkg 9.9.9 $$package__repository$$')
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('unresolved placeholder in to is written verbatim', () => {
    const tmp = fs.mkdtempSync(path.join(projectRoot, 'tmp-app-test-'))
    const key = 'APP_UNSET_' + Date.now()
    try {
      fs.writeFileSync(path.join(tmp, 'f.txt'), 'X')
      fs.writeFileSync(path.join(tmp, 'easy-replace-in-files.json'), JSON.stringify({
        easyReplaceInFiles: [{ files: 'f.txt', from: 'X', to: `a $$${key}$$ b` }]
      }))
      const result = easyReplaceInFiles({ cwd: tmp, noExit: true })
      assert.strictEqual(result.ok, true)
      assert.strictEqual(fs.readFileSync(path.join(tmp, 'f.txt'), 'utf8'), `a $$${key}$$ b`)
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('glob matching no files does not throw; rule succeeds', () => {
    const tmp = fs.mkdtempSync(path.join(projectRoot, 'tmp-app-test-'))
    try {
      fs.writeFileSync(path.join(tmp, 'easy-replace-in-files.json'), JSON.stringify({
        easyReplaceInFiles: [
          { files: 'no-matches-*.xyz', from: 'x', to: 'y' }
        ]
      }))
      const result = easyReplaceInFiles({ cwd: tmp, noExit: true })
      assert.strictEqual(result.succeeded, 1)
      assert.strictEqual(result.failed, 0)
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('unreadable file: rule fails, counted as failed, no crash', () => {
    if (process.platform === 'win32') return
    const tmp = fs.mkdtempSync(path.join(projectRoot, 'tmp-app-test-'))
    try {
      const f = path.join(tmp, 'f.txt')
      fs.writeFileSync(path.join(tmp, 'easy-replace-in-files.json'), JSON.stringify({
        easyReplaceInFiles: [{ files: 'f.txt', from: 'x', to: 'y' }]
      }))
      fs.writeFileSync(f, 'x')
      fs.chmodSync(f, 0o000)
      try {
        const result = easyReplaceInFiles({ cwd: tmp, noExit: true })
        assert.strictEqual(result.succeeded, 0)
        assert.strictEqual(result.failed, 1)
        assert.strictEqual(result.ok, false)
      } finally {
        try { fs.chmodSync(f, 0o644) } catch {}
      }
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('absolute path in files is used as-is', () => {
    const tmp = fs.mkdtempSync(path.join(projectRoot, 'tmp-app-test-'))
    try {
      const absFile = path.join(tmp, 'abs.txt')
      fs.writeFileSync(absFile, 'X')
      fs.writeFileSync(path.join(tmp, 'easy-replace-in-files.json'), JSON.stringify({
        easyReplaceInFiles: [{ files: absFile, from: 'X', to: 'Y' }]
      }))
      const result = easyReplaceInFiles({ cwd: tmp, noExit: true })
      assert.strictEqual(result.ok, true)
      assert.strictEqual(fs.readFileSync(absFile, 'utf8'), 'Y')
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('empty placeholder $$$$ in to does not break (no crash)', () => {
    const tmp = fs.mkdtempSync(path.join(projectRoot, 'tmp-app-test-'))
    try {
      fs.writeFileSync(path.join(tmp, 'easy-replace-in-files.json'), JSON.stringify({
        easyReplaceInFiles: [{ files: 'f.txt', from: 'X', to: 'prefix$$$$suffix' }]
      }))
      fs.writeFileSync(path.join(tmp, 'f.txt'), 'X')
      const result = easyReplaceInFiles({ cwd: tmp, noExit: true })
      assert.strictEqual(result.ok, true)
      const content = fs.readFileSync(path.join(tmp, 'f.txt'), 'utf8')
      assert.ok(content.includes('prefix') && content.includes('suffix'))
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('unicode in content is preserved', () => {
    const tmp = fs.mkdtempSync(path.join(projectRoot, 'tmp-app-test-'))
    try {
      fs.writeFileSync(path.join(tmp, 'easy-replace-in-files.json'), JSON.stringify({
        easyReplaceInFiles: [{ files: 'f.txt', from: 'café', to: 'tea' }]
      }))
      fs.writeFileSync(path.join(tmp, 'f.txt'), 'hello café world', 'utf8')
      const result = easyReplaceInFiles({ cwd: tmp, noExit: true })
      assert.strictEqual(result.ok, true)
      assert.strictEqual(fs.readFileSync(path.join(tmp, 'f.txt'), 'utf8'), 'hello tea world')
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('dryRun does not write to files; returns ok and counts rule as succeeded', () => {
    const tmp = fs.mkdtempSync(path.join(projectRoot, 'tmp-app-test-'))
    try {
      fs.writeFileSync(path.join(tmp, 'easy-replace-in-files.json'), JSON.stringify({
        easyReplaceInFiles: [
          { files: 'f.txt', from: 'REPLACE_ME', to: 'DONE' }
        ]
      }))
      fs.writeFileSync(path.join(tmp, 'f.txt'), 'before REPLACE_ME after')

      const result = easyReplaceInFiles({ cwd: tmp, noExit: true, dryRun: true })

      assert.strictEqual(result.ok, true)
      assert.strictEqual(result.succeeded, 1)
      assert.strictEqual(result.failed, 0)
      assert.strictEqual(fs.readFileSync(path.join(tmp, 'f.txt'), 'utf8'), 'before REPLACE_ME after')
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })
})
