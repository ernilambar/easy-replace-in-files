import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import unixify from 'unixify'
import { replaceInFileSync } from 'replace-in-file'

import { getParamValue, replacePlaceholders } from './utils.js'

const cwd = unixify(process.cwd())

const isPlainObject = (obj) =>
  obj !== null && typeof obj === 'object' && !Array.isArray(obj)

const isStringifiable = (x) =>
  x === null || typeof x === 'string' || typeof x === 'number' || typeof x === 'boolean'

const isValidFiles = (v) =>
  (typeof v === 'string' && v !== '') ||
  (Array.isArray(v) && v.length > 0 && v.every(isStringifiable))

const isValidFrom = (v) =>
  (typeof v === 'string' && v !== '') ||
  (Array.isArray(v) && v.length > 0 && v.every(isStringifiable))

const isValidTo = (v) =>
  typeof v === 'string' ||
  (Array.isArray(v) && v.every(isStringifiable))

const truncate = (str, max = 50) => {
  const s = String(str)
  return s.length <= max ? s : s.slice(0, max) + '...'
}

const easyReplaceInFiles = (opts = {}) => {
  const verbose = !!opts.verbose
  let configFile = ''

  if (fs.existsSync(path.resolve(cwd, 'easy-replace-in-files.json'))) {
    configFile = 'easy-replace-in-files.json'
  } else {
    console.error(`Config file not found! Please create ${chalk.yellow('easy-replace-in-files.json')} file.`)
    process.exit(1)
  }

  const configFilePath = path.join(cwd, configFile)

  let configData
  try {
    configData = JSON.parse(fs.readFileSync(configFilePath, 'utf8'))
  } catch (err) {
    console.error('Invalid config file:', err.message)
    process.exit(1)
  }

  if (!isPlainObject(configData)) {
    console.error('Config file must export a plain object (e.g. { "easyReplaceInFiles": [] }).')
    process.exit(1)
  }

  if (!Object.prototype.hasOwnProperty.call(configData, 'easyReplaceInFiles')) {
    console.error(`${chalk.yellow('easyReplaceInFiles')} key not found in config file.`)
    process.exit(1)
  }

  const list = configData.easyReplaceInFiles
  if (!Array.isArray(list)) {
    console.error(`${chalk.yellow('easyReplaceInFiles')} must be an array of rules.`)
    process.exit(1)
  }

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

  const summary = `${succeededCount} succeeded, ${skippedCount} skipped, ${failedCount} failed.`
  if (failedCount > 0) {
    console.error(chalk.red(`Replacing complete with errors. ${summary}`))
    process.exit(1)
  }

  console.log(chalk.green(`Replacing complete. ${summary}`))
}

const easyRelaceInFiles = easyReplaceInFiles
export { easyReplaceInFiles, easyRelaceInFiles }
