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
      assert.strictEqual(result.succeeded, 2)
      assert.strictEqual(result.skipped, 1)
      assert.strictEqual(result.failed, 0)
      assert.strictEqual(result.ok, true)
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
})
