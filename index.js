#!/usr/bin/env node

import { easyReplaceInFiles } from './src/app.js'

const verbose = process.argv.includes('--verbose')
easyReplaceInFiles({ verbose })
