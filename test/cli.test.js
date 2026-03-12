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
})
