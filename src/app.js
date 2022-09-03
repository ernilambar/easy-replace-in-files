import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import unixify from 'unixify'
import replaceInFile from 'replace-in-file'

import { isEmptyObject, getParamValue, replacePlaceholders } from './utils.js'

const cwd = unixify(process.cwd())

const easyRelaceInFiles = () => {
  let configFile = ''

  if (fs.existsSync(path.resolve(cwd, 'easy-replace-in-files.json'))) {
    configFile = 'easy-replace-in-files.json'
  } else {
    console.log(`Config file not found! Please create ${chalk.yellow('easy-replace-in-files.json')} file.`)
    process.exit()
  }

  const configFilePath = path.join(cwd, configFile)

  let configData

  try {
    configData = JSON.parse(fs.readFileSync(configFilePath))
  } catch (err) {
    console.error(err)
  }

  const list = ('easyReplaceInFiles' in configData) ? configData.easyReplaceInFiles : {}

  if (isEmptyObject(list)) {
    console.log(`${chalk.yellow('easyReplaceInFiles')} key not found in config file.`)
    process.exit()
  }

  list.forEach(function (item) {
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
      replaceInFile.sync(options)
    } catch (error) {
      console.error('Error occurred:', error)
    }
  })

  console.log(chalk.green('Replacing complete.'))
}

export { easyRelaceInFiles }
