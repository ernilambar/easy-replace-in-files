import { describe, it } from 'node:test'
import assert from 'node:assert'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { spawnSync } from 'child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const indexPath = path.join(projectRoot, 'index.js')

describe('CLI', () => {
  it('exits 1 when config file is missing', () => {
    const tmp = fs.mkdtempSync(path.join(projectRoot, 'tmp-cli-test-'))
    try {
      const result = spawnSync(process.execPath, [indexPath], {
        cwd: tmp,
        encoding: 'utf8'
      })
      assert.strictEqual(result.status, 1)
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('replaces in file and exits 0', () => {
    const tmp = fs.mkdtempSync(path.join(projectRoot, 'tmp-cli-test-'))
    try {
      const config = {
        easyReplaceInFiles: [
          {
            files: 'target.txt',
            from: 'OLD',
            to: 'NEW'
          }
        ]
      }
      fs.writeFileSync(path.join(tmp, 'easy-replace-in-files.json'), JSON.stringify(config))
      fs.writeFileSync(path.join(tmp, 'target.txt'), 'OLD')

      const result = spawnSync(process.execPath, [indexPath], {
        cwd: tmp,
        encoding: 'utf8'
      })

      assert.strictEqual(result.status, 0)
      const content = fs.readFileSync(path.join(tmp, 'target.txt'), 'utf8')
      assert.strictEqual(content, 'NEW')
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('exits 1 when config is invalid JSON', () => {
    const tmp = fs.mkdtempSync(path.join(projectRoot, 'tmp-cli-test-'))
    try {
      fs.writeFileSync(path.join(tmp, 'easy-replace-in-files.json'), 'not json {')

      const result = spawnSync(process.execPath, [indexPath], {
        cwd: tmp,
        encoding: 'utf8'
      })

      assert.strictEqual(result.status, 1)
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('exits 1 when config is not a plain object', () => {
    const tmp = fs.mkdtempSync(path.join(projectRoot, 'tmp-cli-test-'))
    try {
      fs.writeFileSync(path.join(tmp, 'easy-replace-in-files.json'), '[]')
      const result = spawnSync(process.execPath, [indexPath], { cwd: tmp, encoding: 'utf8' })
      assert.strictEqual(result.status, 1)
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('exits 1 when easyReplaceInFiles is not an array', () => {
    const tmp = fs.mkdtempSync(path.join(projectRoot, 'tmp-cli-test-'))
    try {
      fs.writeFileSync(path.join(tmp, 'easy-replace-in-files.json'), JSON.stringify({ easyReplaceInFiles: {} }))
      const result = spawnSync(process.execPath, [indexPath], { cwd: tmp, encoding: 'utf8' })
      assert.strictEqual(result.status, 1)
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('exits 0 with empty rules array', () => {
    const tmp = fs.mkdtempSync(path.join(projectRoot, 'tmp-cli-test-'))
    try {
      fs.writeFileSync(path.join(tmp, 'easy-replace-in-files.json'), JSON.stringify({ easyReplaceInFiles: [] }))
      const result = spawnSync(process.execPath, [indexPath], { cwd: tmp, encoding: 'utf8' })
      assert.strictEqual(result.status, 0)
      assert.ok(result.stdout.includes('0 succeeded, 0 skipped, 0 failed'))
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('replaces using regex type', () => {
    const tmp = fs.mkdtempSync(path.join(projectRoot, 'tmp-cli-test-'))
    try {
      const config = {
        easyReplaceInFiles: [
          { files: 'target.txt', from: '\\d+', type: 'regex', to: 'N' }
        ]
      }
      fs.writeFileSync(path.join(tmp, 'easy-replace-in-files.json'), JSON.stringify(config))
      fs.writeFileSync(path.join(tmp, 'target.txt'), 'a1b22c')

      const result = spawnSync(process.execPath, [indexPath], { cwd: tmp, encoding: 'utf8' })
      assert.strictEqual(result.status, 0)
      assert.strictEqual(fs.readFileSync(path.join(tmp, 'target.txt'), 'utf8'), 'aNbNc')
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('handles array of files and multiple from/to', () => {
    const tmp = fs.mkdtempSync(path.join(projectRoot, 'tmp-cli-test-'))
    try {
      fs.writeFileSync(path.join(tmp, 'a.txt'), 'X')
      fs.writeFileSync(path.join(tmp, 'b.txt'), 'X')
      const config = {
        easyReplaceInFiles: [
          { files: ['a.txt', 'b.txt'], from: ['X', 'Y'], to: ['A', 'B'] }
        ]
      }
      fs.writeFileSync(path.join(tmp, 'easy-replace-in-files.json'), JSON.stringify(config))

      const result = spawnSync(process.execPath, [indexPath], { cwd: tmp, encoding: 'utf8' })
      assert.strictEqual(result.status, 0)
      assert.strictEqual(fs.readFileSync(path.join(tmp, 'a.txt'), 'utf8'), 'A')
      assert.strictEqual(fs.readFileSync(path.join(tmp, 'b.txt'), 'utf8'), 'A')
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('invalid rule in config fails validation; exits 1 with message', () => {
    const tmp = fs.mkdtempSync(path.join(projectRoot, 'tmp-cli-test-'))
    try {
      fs.writeFileSync(path.join(tmp, 'ok.txt'), 'x')
      const config = {
        easyReplaceInFiles: [
          { files: 'ok.txt', from: 'x', to: 'y' },
          { files: '', from: 'a', to: 'b' },
          { files: 'ok.txt', from: 'y', to: 'z' }
        ]
      }
      fs.writeFileSync(path.join(tmp, 'easy-replace-in-files.json'), JSON.stringify(config))

      const result = spawnSync(process.execPath, [indexPath], { cwd: tmp, encoding: 'utf8' })
      assert.strictEqual(result.status, 1)
      assert.ok(result.stderr.includes('Config validation failed'))
      assert.ok(result.stderr.includes('Rule 2') && result.stderr.includes('files'))
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('--verbose includes rule lines and summary', () => {
    const tmp = fs.mkdtempSync(path.join(projectRoot, 'tmp-cli-test-'))
    try {
      fs.writeFileSync(path.join(tmp, 'f.txt'), 'a')
      fs.writeFileSync(path.join(tmp, 'easy-replace-in-files.json'), JSON.stringify({
        easyReplaceInFiles: [{ files: 'f.txt', from: 'a', to: 'b' }]
      }))

      const result = spawnSync(process.execPath, [indexPath, '--verbose'], { cwd: tmp, encoding: 'utf8' })
      assert.strictEqual(result.status, 0)
      assert.ok(result.stdout.includes('Rule 1'))
      assert.ok(result.stdout.includes('f.txt'))
      assert.ok(result.stdout.includes('succeeded'))
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('uses --config when provided', () => {
    const tmp = fs.mkdtempSync(path.join(projectRoot, 'tmp-cli-test-'))
    try {
      fs.writeFileSync(path.join(tmp, 'target.txt'), 'OLD')
      fs.writeFileSync(path.join(tmp, 'custom.json'), JSON.stringify({
        easyReplaceInFiles: [{ files: 'target.txt', from: 'OLD', to: 'NEW' }]
      }))

      const result = spawnSync(process.execPath, [indexPath, '--config', 'custom.json'], {
        cwd: tmp,
        encoding: 'utf8'
      })
      assert.strictEqual(result.status, 0)
      assert.strictEqual(fs.readFileSync(path.join(tmp, 'target.txt'), 'utf8'), 'NEW')
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('exits 1 when --config is last (no path) and error on stderr', () => {
    const tmp = fs.mkdtempSync(path.join(projectRoot, 'tmp-cli-test-'))
    try {
      fs.writeFileSync(path.join(tmp, 'easy-replace-in-files.json'), JSON.stringify({ easyReplaceInFiles: [] }))
      const result = spawnSync(process.execPath, [indexPath, '--config'], {
        cwd: tmp,
        encoding: 'utf8'
      })
      assert.strictEqual(result.status, 1)
      assert.ok(result.stderr.includes('--config requires a path'))
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('exits 1 when --config is followed by another flag', () => {
    const tmp = fs.mkdtempSync(path.join(projectRoot, 'tmp-cli-test-'))
    try {
      fs.writeFileSync(path.join(tmp, 'easy-replace-in-files.json'), JSON.stringify({ easyReplaceInFiles: [] }))
      const result = spawnSync(process.execPath, [indexPath, '--config', '--verbose'], {
        cwd: tmp,
        encoding: 'utf8'
      })
      assert.strictEqual(result.status, 1)
      assert.ok(result.stderr.includes('--config requires a path'))
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('on replace failure, summary goes to stderr', () => {
    if (process.platform === 'win32') return
    const tmp = fs.mkdtempSync(path.join(projectRoot, 'tmp-cli-test-'))
    try {
      const unreadable = path.join(tmp, 'f.txt')
      fs.writeFileSync(path.join(tmp, 'easy-replace-in-files.json'), JSON.stringify({
        easyReplaceInFiles: [{ files: 'f.txt', from: 'x', to: 'y' }]
      }))
      fs.writeFileSync(unreadable, 'x')
      fs.chmodSync(unreadable, 0o000)
      try {
        const result = spawnSync(process.execPath, [indexPath], { cwd: tmp, encoding: 'utf8' })
        assert.strictEqual(result.status, 1)
        assert.ok(result.stderr.includes('failed') && result.stderr.includes('Replacing complete with errors'))
        assert.ok(!result.stdout.includes('Replacing complete with errors'))
      } finally {
        try { fs.chmodSync(unreadable, 0o644) } catch {}
      }
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('--dry-run exits 0 and does not modify files', () => {
    const tmp = fs.mkdtempSync(path.join(projectRoot, 'tmp-cli-test-'))
    try {
      fs.writeFileSync(path.join(tmp, 'easy-replace-in-files.json'), JSON.stringify({
        easyReplaceInFiles: [{ files: 'target.txt', from: 'OLD', to: 'NEW' }]
      }))
      fs.writeFileSync(path.join(tmp, 'target.txt'), 'OLD')

      const result = spawnSync(process.execPath, [indexPath, '--dry-run'], {
        cwd: tmp,
        encoding: 'utf8'
      })

      assert.strictEqual(result.status, 0)
      assert.strictEqual(fs.readFileSync(path.join(tmp, 'target.txt'), 'utf8'), 'OLD')
      assert.ok(result.stdout.includes('Dry run'))
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('--help exits 0 and prints usage to stdout', () => {
    const result = spawnSync(process.execPath, [indexPath, '--help'], { encoding: 'utf8' })
    assert.strictEqual(result.status, 0)
    assert.ok(result.stdout.includes('easy-replace-in-files'))
    assert.ok(result.stdout.includes('--config'))
    assert.ok(result.stdout.includes('--dry-run'))
    assert.ok(result.stdout.includes('--help'))
    assert.ok(result.stdout.includes('--version'))
  })

  it('--version exits 0 and prints version to stdout', () => {
    const result = spawnSync(process.execPath, [indexPath, '--version'], { encoding: 'utf8' })
    assert.strictEqual(result.status, 0)
    assert.match(result.stdout.trim(), /^\d+\.\d+\.\d+$/)
  })
})
