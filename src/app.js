import path from 'path'
import chalk from 'chalk'
import unixify from 'unixify'
import { replaceInFileSync } from 'replace-in-file'

import {
  getParamValue,
  replacePlaceholders,
  isValidFiles,
  isValidFrom,
  isValidTo,
  truncate
} from './utils.js'
import { loadConfig } from './config.js'

let deprecationWarned = false

/**
 * Run find-and-replace rules from config.
 * @param {Object} [opts] - Options
 * @param {boolean} [opts.verbose] - Log each rule
 * @param {string} [opts.cwd] - Working directory for config and relative file paths (default: process.cwd())
 * @param {string} [opts.configPath] - Path to config file (default: easy-replace-in-files.json in cwd)
 * @param {boolean} [opts.noExit] - If true, never call process.exit(); caller handles exit (default: false)
 * @returns {{ succeeded: number, skipped: number, failed: number, ok: boolean }}
 */
function easyReplaceInFiles (opts = {}) {
  const verbose = !!opts.verbose
  const noExit = !!opts.noExit
  const cwd = unixify(opts.cwd ?? process.cwd())

  let configData
  try {
    const loaded = loadConfig(cwd, opts.configPath)
    configData = loaded.configData
  } catch (err) {
    console.error(err.message)
    if (!noExit) process.exit(1)
    return { succeeded: 0, skipped: 0, failed: 0, ok: false }
  }

  const list = configData.easyReplaceInFiles
  let succeededCount = 0
  let skippedCount = 0
  let failedCount = 0

  list.forEach(function (item, index) {
    const defaults = { files: '', from: '', to: '', type: 'string' }
    item = { ...defaults, ...item }

    if (!isValidFiles(item.files)) {
      skippedCount += 1
      console.log(`${chalk.cyan('WARN')}: rule ${index + 1}: ${chalk.yellow('files')} must be a non-empty string or non-empty array of strings. Skipping.`)
      return
    }

    let filesValue = Array.isArray(item.files) ? item.files.map(String) : [String(item.files)]
    filesValue = filesValue.map((k) => replacePlaceholders(k))
    if (cwd) {
      filesValue = filesValue.map((f) => (path.isAbsolute(f) ? f : path.resolve(cwd, f)))
    }

    if (!isValidFrom(item.from)) {
      skippedCount += 1
      console.log(`${chalk.cyan('WARN')}: rule ${index + 1}: ${chalk.yellow('from')} must be a non-empty string or non-empty array of strings. Skipping.`)
      return
    }

    let fromValue = Array.isArray(item.from) ? item.from.map(String) : [String(item.from)]
    fromValue = fromValue.map((element) => getParamValue(element, item.type))

    if (!isValidTo(item.to)) {
      skippedCount += 1
      console.log(`${chalk.cyan('WARN')}: rule ${index + 1}: ${chalk.yellow('to')} must be a string or array of strings. Skipping.`)
      return
    }

    let toValue
    if (Array.isArray(item.to)) {
      toValue = item.to.map((element) => replacePlaceholders(String(element)))
    } else {
      toValue = replacePlaceholders(String(item.to))
    }

    const options = {
      files: filesValue,
      from: fromValue,
      to: toValue
    }

    if (verbose) {
      const fromPreview = fromValue.length === 1 ? truncate(fromValue[0]) : fromValue.map(truncate).join(', ')
      const toPreview = Array.isArray(toValue) ? toValue.map(truncate).join(', ') : truncate(toValue)
      console.log(chalk.gray(`Rule ${index + 1}: files=${filesValue.join(', ')} from=${fromPreview} to=${toPreview}`))
    }

    try {
      replaceInFileSync(options)
      succeededCount += 1
    } catch (error) {
      failedCount += 1
      console.error(`Error in rule ${index + 1} (files: ${filesValue.join(', ')}):`, error.message)
    }
  })

  const ok = failedCount === 0
  const summary = `${succeededCount} succeeded, ${skippedCount} skipped, ${failedCount} failed.`

  if (failedCount > 0) {
    console.error(chalk.red(`Replacing complete with errors. ${summary}`))
    if (!noExit) process.exit(1)
  } else {
    console.log(chalk.green(`Replacing complete. ${summary}`))
  }

  return { succeeded: succeededCount, skipped: skippedCount, failed: failedCount, ok }
}

/**
 * @deprecated Use easyReplaceInFiles instead. This typo alias will be removed in the next major version.
 * @param {Object} [opts] - Same as easyReplaceInFiles
 * @returns {{ succeeded: number, skipped: number, failed: number, ok: boolean }}
 */
function easyRelaceInFiles (opts = {}) {
  if (!deprecationWarned) {
    deprecationWarned = true
    console.warn('easyRelaceInFiles is deprecated; use easyReplaceInFiles. This alias will be removed in v2.0.0.')
  }
  return easyReplaceInFiles(opts)
}

export { easyReplaceInFiles, easyRelaceInFiles }
