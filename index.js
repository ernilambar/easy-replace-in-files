#!/usr/bin/env node

import { easyReplaceInFiles } from './src/app.js'

const argv = process.argv.slice(2)
const verbose = argv.includes('--verbose')
const configIndex = argv.indexOf('--config')
const nextArg = configIndex !== -1 ? argv[configIndex + 1] : undefined
const configPath = configIndex !== -1 && nextArg !== undefined && !nextArg.startsWith('-')
  ? nextArg
  : undefined

if (configIndex !== -1 && (nextArg === undefined || nextArg.startsWith('-'))) {
  console.error('error: --config requires a path (e.g. --config my-config.json)')
  process.exit(1)
}

const result = easyReplaceInFiles({ verbose, configPath })
if (!result.ok) {
  process.exit(1)
}
