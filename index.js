#!/usr/bin/env node

import { easyReplaceInFiles } from './src/app.js'

const argv = process.argv.slice(2)
const verbose = argv.includes('--verbose')
const configIndex = argv.indexOf('--config')
const configPath = configIndex !== -1 && argv[configIndex + 1] ? argv[configIndex + 1] : undefined

const result = easyReplaceInFiles({ verbose, configPath })
if (!result.ok) {
  process.exit(1)
}
