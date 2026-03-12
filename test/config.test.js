import { describe, it } from 'node:test'
import assert from 'node:assert'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { loadConfig } from '../src/config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')

describe('loadConfig', () => {
  it('throws when config file is missing (default path)', () => {
    const tmp = fs.mkdtempSync(path.join(projectRoot, 'tmp-config-'))
    try {
      assert.throws(
        () => loadConfig(tmp),
        (err) => {
          assert.ok(err.message.includes('Config file not found'))
          assert.ok(err.message.includes('easy-replace-in-files.json'))
          assert.ok(err.message.includes('easy-replace.json'))
          return true
        }
      )
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('uses easy-replace.json when easy-replace-in-files.json is missing', () => {
    const tmp = fs.mkdtempSync(path.join(projectRoot, 'tmp-config-'))
    try {
      const config = { easyReplaceInFiles: [{ files: 'x', from: 'a', to: 'b' }] }
      fs.writeFileSync(path.join(tmp, 'easy-replace.json'), JSON.stringify(config))
      const { configData, configFilePath } = loadConfig(tmp)
      assert.strictEqual(configData.easyReplaceInFiles.length, 1)
      assert.ok(configFilePath.endsWith('easy-replace.json'))
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('prefers easy-replace-in-files.json over easy-replace.json when both exist', () => {
    const tmp = fs.mkdtempSync(path.join(projectRoot, 'tmp-config-'))
    try {
      const primary = { easyReplaceInFiles: [{ files: 'a', from: 'x', to: 'primary' }] }
      const fallback = { easyReplaceInFiles: [{ files: 'b', from: 'y', to: 'fallback' }] }
      fs.writeFileSync(path.join(tmp, 'easy-replace-in-files.json'), JSON.stringify(primary))
      fs.writeFileSync(path.join(tmp, 'easy-replace.json'), JSON.stringify(fallback))
      const { configData, configFilePath } = loadConfig(tmp)
      assert.strictEqual(configData.easyReplaceInFiles[0].to, 'primary')
      assert.ok(configFilePath.endsWith('easy-replace-in-files.json'))
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('throws "File not found: <path>" when configPath given but file missing', () => {
    const tmp = fs.mkdtempSync(path.join(projectRoot, 'tmp-config-'))
    try {
      assert.throws(
        () => loadConfig(tmp, 'custom.json'),
        (err) => {
          assert.ok(err.message.includes('File not found'))
          assert.ok(err.message.includes('custom.json'))
          return true
        }
      )
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('throws when config file exists but is unreadable (e.g. directory)', () => {
    const tmp = fs.mkdtempSync(path.join(projectRoot, 'tmp-config-'))
    const dirPath = path.join(tmp, 'dir')
    fs.mkdirSync(dirPath)
    try {
      assert.throws(
        () => loadConfig(tmp, 'dir'),
        (err) => {
          assert.ok(err.message.includes('Cannot read config file'))
          return true
        }
      )
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('throws when config file has invalid JSON', () => {
    const tmp = fs.mkdtempSync(path.join(projectRoot, 'tmp-config-'))
    try {
      fs.writeFileSync(path.join(tmp, 'easy-replace-in-files.json'), 'not json {')
      assert.throws(
        () => loadConfig(tmp),
        (err) => {
          assert.ok(err.message.includes('Invalid JSON in config file'))
          return true
        }
      )
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('throws when config is not a plain object (array)', () => {
    const tmp = fs.mkdtempSync(path.join(projectRoot, 'tmp-config-'))
    try {
      fs.writeFileSync(path.join(tmp, 'easy-replace-in-files.json'), '[]')
      assert.throws(
        () => loadConfig(tmp),
        (err) => {
          assert.ok(err.message.includes('Config validation failed'))
          assert.ok(err.message.includes('object'))
          return true
        }
      )
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('throws when config is not a plain object (string)', () => {
    const tmp = fs.mkdtempSync(path.join(projectRoot, 'tmp-config-'))
    try {
      fs.writeFileSync(path.join(tmp, 'easy-replace-in-files.json'), '"x"')
      assert.throws(
        () => loadConfig(tmp),
        (err) => {
          assert.ok(err.message.includes('Config validation failed'))
          return true
        }
      )
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('throws when config is not a plain object (number)', () => {
    const tmp = fs.mkdtempSync(path.join(projectRoot, 'tmp-config-'))
    try {
      fs.writeFileSync(path.join(tmp, 'easy-replace-in-files.json'), '42')
      assert.throws(
        () => loadConfig(tmp),
        (err) => {
          assert.ok(err.message.includes('Config validation failed'))
          return true
        }
      )
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('throws when easyReplaceInFiles key is missing', () => {
    const tmp = fs.mkdtempSync(path.join(projectRoot, 'tmp-config-'))
    try {
      fs.writeFileSync(path.join(tmp, 'easy-replace-in-files.json'), '{}')
      assert.throws(
        () => loadConfig(tmp),
        (err) => {
          assert.ok(err.message.includes('Config validation failed'))
          assert.ok(err.message.includes('easyReplaceInFiles'))
          return true
        }
      )
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('throws when easyReplaceInFiles is not an array (object)', () => {
    const tmp = fs.mkdtempSync(path.join(projectRoot, 'tmp-config-'))
    try {
      fs.writeFileSync(path.join(tmp, 'easy-replace-in-files.json'), JSON.stringify({ easyReplaceInFiles: {} }))
      assert.throws(
        () => loadConfig(tmp),
        (err) => {
          assert.ok(err.message.includes('Config validation failed'))
          assert.ok(err.message.includes('array'))
          return true
        }
      )
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('throws when easyReplaceInFiles is not an array (string)', () => {
    const tmp = fs.mkdtempSync(path.join(projectRoot, 'tmp-config-'))
    try {
      fs.writeFileSync(path.join(tmp, 'easy-replace-in-files.json'), JSON.stringify({ easyReplaceInFiles: 'x' }))
      assert.throws(
        () => loadConfig(tmp),
        (err) => {
          assert.ok(err.message.includes('Config validation failed'))
          assert.ok(err.message.includes('array'))
          return true
        }
      )
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('returns configData and configFilePath for valid config with empty rules array', () => {
    const tmp = fs.mkdtempSync(path.join(projectRoot, 'tmp-config-'))
    try {
      const configPath = path.join(tmp, 'easy-replace-in-files.json')
      fs.writeFileSync(configPath, JSON.stringify({ easyReplaceInFiles: [] }))
      const result = loadConfig(tmp)
      assert.strictEqual(result.configFilePath, configPath)
      assert.deepStrictEqual(result.configData, { easyReplaceInFiles: [] })
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('returns configData and configFilePath for valid config with rules', () => {
    const tmp = fs.mkdtempSync(path.join(projectRoot, 'tmp-config-'))
    try {
      const configPath = path.join(tmp, 'easy-replace-in-files.json')
      const config = { easyReplaceInFiles: [{ files: 'a.txt', from: 'x', to: 'y' }] }
      fs.writeFileSync(configPath, JSON.stringify(config))
      const result = loadConfig(tmp)
      assert.strictEqual(result.configFilePath, configPath)
      assert.deepStrictEqual(result.configData, config)
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('resolves configPath relative to cwd', () => {
    const tmp = fs.mkdtempSync(path.join(projectRoot, 'tmp-config-'))
    try {
      const subdir = path.join(tmp, 'sub')
      fs.mkdirSync(subdir)
      const configPath = path.join(subdir, 'custom.json')
      fs.writeFileSync(configPath, JSON.stringify({ easyReplaceInFiles: [] }))
      const result = loadConfig(tmp, 'sub/custom.json')
      assert.strictEqual(result.configFilePath, configPath)
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('resolves absolute configPath', () => {
    const tmp = fs.mkdtempSync(path.join(projectRoot, 'tmp-config-'))
    try {
      const configPath = path.join(tmp, 'absolute.json')
      fs.writeFileSync(configPath, JSON.stringify({ easyReplaceInFiles: [] }))
      const result = loadConfig('/other', configPath)
      assert.strictEqual(result.configFilePath, configPath)
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('throws when rule has invalid type (from: number)', () => {
    const tmp = fs.mkdtempSync(path.join(projectRoot, 'tmp-config-'))
    try {
      fs.writeFileSync(
        path.join(tmp, 'easy-replace-in-files.json'),
        JSON.stringify({ easyReplaceInFiles: [{ files: 'a.txt', from: 42, to: 'y' }] })
      )
      assert.throws(
        () => loadConfig(tmp),
        (err) => {
          assert.ok(err.message.includes('Config validation failed'))
          assert.ok(err.message.includes('Rule 1'))
          assert.ok(err.message.includes('from'))
          return true
        }
      )
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('throws when rule is missing required field (from)', () => {
    const tmp = fs.mkdtempSync(path.join(projectRoot, 'tmp-config-'))
    try {
      fs.writeFileSync(
        path.join(tmp, 'easy-replace-in-files.json'),
        JSON.stringify({ easyReplaceInFiles: [{ files: 'a.txt', to: 'y' }] })
      )
      assert.throws(
        () => loadConfig(tmp),
        (err) => {
          assert.ok(err.message.includes('Config validation failed'))
          assert.ok(err.message.includes('Rule 1'))
          assert.ok(err.message.includes('from'))
          return true
        }
      )
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })
})
