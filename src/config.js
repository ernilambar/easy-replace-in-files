import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import { isPlainObject } from './utils.js'

const DEFAULT_CONFIG_FILE = 'easy-replace-in-files.json'

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
 * @throws {Error} When config file is missing, invalid JSON, or wrong shape (with clear message)
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

  if (!isPlainObject(configData)) {
    throw new Error(
      'Config must be a plain object. Expected shape: { "easyReplaceInFiles": [] }'
    )
  }

  if (!Object.prototype.hasOwnProperty.call(configData, 'easyReplaceInFiles')) {
    throw new Error(
      `Config must include key ${chalk.yellow('easyReplaceInFiles')}. Expected shape: { "easyReplaceInFiles": [] }`
    )
  }

  const list = configData.easyReplaceInFiles
  if (!Array.isArray(list)) {
    throw new Error(
      `Config key ${chalk.yellow('easyReplaceInFiles')} must be an array of rules, got ${typeof list}.`
    )
  }

  return { configData, configFilePath }
}
