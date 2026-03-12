#!/usr/bin/env node

import { createRequire } from 'node:module'
import minimist from 'minimist'
import { easyReplaceInFiles } from './src/app.js'

const require = createRequire(import.meta.url)
const { version } = require('./package.json')

const argv = minimist(process.argv.slice(2), {
  string: ['config'],
  boolean: ['verbose', 'dry-run', 'help', 'version'],
  alias: { h: 'help', v: 'version' }
})

if (argv.help) {
  console.log(`easy-replace-in-files — find and replace in files via a config file.

Usage: easy-replace-in-files [options]

Options:
  --config <path>   Config file (default: easy-replace-in-files.json or easy-replace.json, first found)
  --dry-run         Show what would be changed without writing
  --verbose         Log each rule and counts
  --help, -h        Show this help
  --version, -v     Show version`)
  process.exit(0)
}

if (argv.version) {
  console.log(version)
  process.exit(0)
}

const verbose = argv.verbose
const dryRun = argv['dry-run']
const configPath = typeof argv.config === 'string' && argv.config !== '' ? argv.config : undefined

if ('config' in argv && (configPath === undefined || configPath.startsWith('-'))) {
  console.error('error: --config requires a path (e.g. --config my-config.json)')
  process.exit(1)
}

const result = easyReplaceInFiles({ verbose, configPath, dryRun })
if (!result.ok) {
  process.exit(1)
}
