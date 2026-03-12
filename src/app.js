import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import unixify from 'unixify'
import { replaceInFileSync } from 'replace-in-file'

import { isEmptyObject, getParamValue, replacePlaceholders } from './utils.js'

const cwd = unixify(process.cwd())

const easyRelaceInFiles = () => {
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

  const list = ('easyReplaceInFiles' in configData) ? configData.easyReplaceInFiles : {}

  if (isEmptyObject(list)) {
    console.error(`${chalk.yellow('easyReplaceInFiles')} key not found in config file.`)
    process.exit(1)
  }

  let failedCount = 0

  list.forEach(function (item, index) {
    const defaults = { files: '', from: '', to: '', type: 'string' }

    item = { ...defaults, ...item }

    if (!Array.isArray(item.files) && item.files === '') {
      console.log(`${chalk.cyan('WARN')}: ${chalk.yellow('files')} key missing in the rule. Skipping.`)
      return
    }

    let filesValue = (Array.isArray(item.files)) ? item.files : [item.files]

    filesValue = filesValue.map((k) => replacePlaceholders(k))

    if (!Array.isArray(item.from) && item.from === '') {
      console.log(`${chalk.cyan('WARN')}: ${chalk.yellow('from')} key missing in the rule. Skipping.`)
      return
    }

    let fromValue = (Array.isArray(item.from)) ? item.from : [item.from]

    fromValue = fromValue.map((element) => getParamValue(element, item.type))

    let toValue = ''

    if (Array.isArray(item.to)) {
      toValue = item.to.map((element) => replacePlaceholders(element))
    } else {
      toValue = replacePlaceholders(item.to)
    }

    const options = {
      files: filesValue,
      from: fromValue,
      to: toValue
    }

    try {
      replaceInFileSync(options)
    } catch (error) {
      failedCount += 1
      console.error(`Error in rule ${index + 1} (files: ${filesValue.join(', ')}):`, error.message)
    }
  })

  if (failedCount > 0) {
    console.error(chalk.red(`Replacing complete with errors. ${failedCount} rule(s) failed.`))
    process.exit(1)
  }

  console.log(chalk.green('Replacing complete.'))
}

export { easyRelaceInFiles }
