import path from 'path'
import chalk from 'chalk'
import unixify from 'unixify'
import { replaceInFileSync } from 'replace-in-file'
import { readPackageUpSync } from 'read-package-up'

import {
  getParamValue,
  replacePlaceholders,
  truncate
} from './utils.js'
import { loadConfig } from './config.js'

/** @typedef {{ succeeded: number, skipped: number, failed: number, ok: boolean }} ReplaceResult */

/**
 * @typedef {Object} EasyReplaceOptions
 * @property {boolean} [verbose] - Log each rule (files, from, to)
 * @property {boolean} [dryRun] - If true, show what would be changed without writing (default: false)
 * @property {string} [cwd] - Working directory for config and relative file paths (default: process.cwd())
 * @property {string} [configPath] - Path to config file (default: easy-replace-in-files.json or easy-replace.json in cwd, first existing wins)
 * @property {boolean} [noExit] - If true, never call process.exit(); caller handles exit (default: false)
 */

/**
 * Run find-and-replace rules from config.
 * @param {EasyReplaceOptions} [opts] - Options
 * @returns {ReplaceResult}
 * @throws Never throws; load errors are reported via console and return value (ok: false).
 */
function easyReplaceInFiles (opts = {}) {
  const verbose = !!opts.verbose
  const dryRun = !!opts.dryRun
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

  let pkg
  try {
    pkg = readPackageUpSync({ cwd })?.packageJson
  } catch {
    pkg = undefined
  }

  const list = configData.easyReplaceInFiles
  let succeededCount = 0
  let skippedCount = 0
  let failedCount = 0

  list.forEach(function (item, index) {
    let filesValue = Array.isArray(item.files) ? item.files : [item.files]
    filesValue = filesValue.map((k) => replacePlaceholders(k, { pkg }))
    filesValue = filesValue.map((f) => (path.isAbsolute(f) ? f : path.resolve(cwd, f)))

    const fromStrings = Array.isArray(item.from) ? item.from : [item.from]
    let fromValue
    try {
      fromValue = fromStrings.map((element) => getParamValue(element, item.type))
    } catch (error) {
      failedCount += 1
      console.error(`Error in rule ${index + 1}:`, error.message)
      return
    }

    if (Array.isArray(item.to) && item.to.length !== fromStrings.length) {
      skippedCount += 1
      console.log(`${chalk.cyan('WARN')}: rule ${index + 1}: ${chalk.yellow('from')} and ${chalk.yellow('to')} must have the same number of items. Skipping.`)
      return
    }

    let toValue
    if (Array.isArray(item.to)) {
      toValue = item.to.map((element) => replacePlaceholders(element, { escapeDollar: true, pkg }))
    } else {
      toValue = replacePlaceholders(item.to, { escapeDollar: true, pkg })
    }

    const options = {
      files: filesValue,
      from: fromValue,
      to: toValue,
      dry: dryRun,
      allowEmptyPaths: true
    }

    if (verbose) {
      const fromPreview = fromStrings.length === 1 ? truncate(fromStrings[0]) : fromStrings.map((f) => truncate(f)).join(', ')
      const toPreview = Array.isArray(toValue) ? toValue.map(truncate).join(', ') : truncate(toValue)
      console.log(chalk.gray(`Rule ${index + 1}: files=${filesValue.join(', ')} from=${fromPreview} to=${toPreview}`))
    }

    try {
      const results = replaceInFileSync(options)
      const changed = results.filter((r) => r.hasChanged)
      if (dryRun) {
        if (changed.length > 0) {
          console.log(chalk.yellow(`Rule ${index + 1}: ${changed.length} file(s) would be changed`))
          if (verbose) {
            changed.forEach((r) => console.log(chalk.gray(`  - ${r.file}`)))
          }
        }
      } else if (verbose) {
        console.log(chalk.gray(`  ${changed.length} file(s) changed`))
      }
      succeededCount += 1
    } catch (error) {
      failedCount += 1
      console.error(`Error in rule ${index + 1} (files: ${filesValue.join(', ')}):`, error.message)
    }
  })

  const ok = failedCount === 0
  const summary = `${succeededCount} succeeded, ${skippedCount} skipped, ${failedCount} failed.`

  if (dryRun && failedCount === 0) {
    console.log(chalk.yellow('Dry run — no files written.'))
  }

  if (failedCount > 0) {
    console.error(chalk.red(`Replacing complete with errors. ${summary}`))
    if (!noExit) process.exit(1)
  } else {
    console.log(chalk.green(`Replacing complete. ${summary}`))
  }

  return { succeeded: succeededCount, skipped: skippedCount, failed: failedCount, ok }
}

export { easyReplaceInFiles }
