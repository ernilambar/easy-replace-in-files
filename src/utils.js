import { readPackageUpSync } from 'read-pkg-up'

const isEmptyObject = (obj) => {
  return obj && Object.keys(obj).length === 0 && Object.getPrototypeOf(obj) === Object.prototype
}

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

const getParamValue = (string, mode = 'string') => {
  if (typeof string !== 'string') {
    return string
  }

  if (mode === 'regex') {
    try {
      return new RegExp(string, 'g')
    } catch {
      return string
    }
  }

  return string
}

const replacePlaceholders = (string) => {
  if (typeof string !== 'string') {
    return string
  }

  const matches = string.match(/\$\$(.*?)\$\$/g)

  if (!Array.isArray(matches) || matches.length === 0) {
    return string
  }

  const keys = []

  matches.forEach(function (matchItem) {
    keys.push(matchItem.replace(/\$\$/g, ''))
  })

  keys.forEach(function (item) {
    if (Object.prototype.hasOwnProperty.call(process.env, item)) {
      string = string.replace(`$$${item}$$`, process.env[item])
    }

    if (item.includes('package__')) {
      const pvar = item.replace('package__', '')

      let pkg
      try {
        const result = readPackageUpSync()
        pkg = result?.packageJson
      } catch {
        pkg = undefined
      }

      if (pkg && Object.prototype.hasOwnProperty.call(pkg, pvar)) {
        string = string.replace(`$$${item}$$`, pkg[pvar])
      }
    }
  })

  return string
}

export {
  isEmptyObject,
  isPlainObject,
  isStringifiable,
  isValidFiles,
  isValidFrom,
  isValidTo,
  truncate,
  getParamValue,
  replacePlaceholders
}
