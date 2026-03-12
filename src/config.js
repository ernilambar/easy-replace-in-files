import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import chalk from 'chalk'
import Ajv from 'ajv'

const DEFAULT_CONFIG_FILE = 'easy-replace-in-files.json'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const schemaPath = path.join(__dirname, 'schemas', 'config.schema.json')
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'))

const ajv = new Ajv({ allErrors: true })
const validateConfig = ajv.compile(schema)

/**
 * Format Ajv validation errors into a readable message (one line per error).
 * @param {import('ajv').ErrorObject[]} errors
 * @returns {string}
 */
function formatValidationErrors (errors) {
  const lines = errors.map((e) => {
    const segments = e.instancePath.split('/').filter(Boolean)
    const fieldName = e.params?.missingProperty ?? (segments.length >= 3 ? segments[2] : null)

    if (segments.length >= 2) {
      const ruleNum = Number(segments[1]) + 1
      const fieldPart = fieldName ? `, field ${chalk.yellow(fieldName)}` : ''
      return `  Rule ${ruleNum}${fieldPart}: ${e.message}`
    }
    if (segments.length === 1) {
      return `  ${chalk.yellow(segments[0])}: ${e.message}`
    }
    return `  ${e.message}`
  })
  return `${chalk.red('Config validation failed:')}\n${lines.join('\n')}`
}

/**
 * @typedef {Object} LoadConfigResult
 * @property {{ easyReplaceInFiles: Array<{ files: string|string[], from: string|string[], to: string|string[], type?: string }> }} configData
 * @property {string} configFilePath
 */

/**
 * Load and validate config from the given directory or explicit path.
 * @param {string} cwd - Working directory for resolving relative config path
 * @param {string} [configPath] - Optional path to config file (relative to cwd or absolute)
 * @returns {LoadConfigResult}
 * @throws {Error} When config file is missing, invalid JSON, or invalid shape (with clear message)
 */
export function loadConfig (cwd, configPath) {
  const configFilePath = configPath
    ? path.resolve(cwd, configPath)
    : path.join(cwd, DEFAULT_CONFIG_FILE)

  if (!fs.existsSync(configFilePath)) {
    const hint = configPath
      ? `File not found: ${configFilePath}`
      : `Config file not found. Create ${chalk.yellow(DEFAULT_CONFIG_FILE)} in the project root, or use --config <path>.`
    throw new Error(hint)
  }

  let raw
  try {
    raw = fs.readFileSync(configFilePath, 'utf8')
  } catch (err) {
    throw new Error(`Cannot read config file: ${err.message}`)
  }

  let configData
  try {
    configData = JSON.parse(raw)
  } catch (err) {
    throw new Error(`Invalid JSON in config file: ${err.message}`)
  }

  const valid = validateConfig(configData)
  if (!valid) {
    throw new Error(formatValidationErrors(validateConfig.errors))
  }

  return { configData, configFilePath }
}
