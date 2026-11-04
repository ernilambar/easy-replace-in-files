import { readPackageUpSync } from 'read-package-up'

/**
 * @param {unknown} obj
 * @returns {boolean}
 */
const isEmptyObject = (obj) => {
  return obj && Object.keys(obj).length === 0 && Object.getPrototypeOf(obj) === Object.prototype
}

/**
 * @param {unknown} obj
 * @returns {obj is Record<string, unknown>}
 */
const isPlainObject = (obj) =>
  obj !== null && typeof obj === 'object' && !Array.isArray(obj)

/**
 * @param {unknown} x
 * @returns {boolean}
 */
const isStringifiable = (x) =>
  x === null || typeof x === 'string' || typeof x === 'number' || typeof x === 'boolean'

/**
 * @param {unknown} v
 * @returns {boolean}
 */
const isValidFiles = (v) =>
  (typeof v === 'string' && v !== '') ||
  (Array.isArray(v) && v.length > 0 && v.every((x) => isStringifiable(x) && x !== ''))

/**
 * @param {unknown} v
 * @returns {boolean}
 */
const isValidFrom = (v) =>
  (typeof v === 'string' && v !== '') ||
  (Array.isArray(v) && v.length > 0 && v.every((x) => isStringifiable(x) && x !== ''))

/**
 * @param {unknown} v
 * @returns {boolean}
 */
const isValidTo = (v) =>
  typeof v === 'string' ||
  (Array.isArray(v) && v.every(isStringifiable))

/**
 * @param {string|unknown} str - Coerced to string (e.g. for preview of RegExp)
 * @param {number} [max=50]
 * @returns {string}
 */
const truncate = (str, max = 50) => {
  const s = String(str)
  return s.length <= max ? s : s.slice(0, max) + '...'
}

/**
 * @param {string} string
 * @returns {string}
 */
const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * String mode matches literally but globally (all occurrences).
 * @param {string} string
 * @param {string} [mode='string']
 * @returns {string|RegExp}
 */
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

  return new RegExp(escapeRegex(string), 'g')
}

/**
 * Expand $$ENV_VAR$$ and $$package__field$$ in a single pass; values are inserted literally.
 * @param {string} string
 * @param {{ escapeDollar?: boolean }} [opts] - Escape `$` in values so a later String.replace() keeps them literal (use for `to`)
 * @returns {string}
 */
const replacePlaceholders = (string, { escapeDollar = false } = {}) => {
  if (typeof string !== 'string') {
    return string
  }

  return string.replace(/\$\$(.*?)\$\$/g, (match, item) => {
    let value

    if (Object.prototype.hasOwnProperty.call(process.env, item)) {
      value = process.env[item]
    } else if (item.includes('package__')) {
      const pvar = item.replace('package__', '')

      let pkg
      try {
        const result = readPackageUpSync()
        pkg = result?.packageJson
      } catch {
        pkg = undefined
      }

      if (pkg && Object.prototype.hasOwnProperty.call(pkg, pvar)) {
        value = pkg[pvar]
      }
    }

    if (value === undefined) {
      return match
    }

    const str = String(value)
    return escapeDollar ? str.replaceAll('$', '$$$$') : str
  })
}

export {
  isEmptyObject,
  isPlainObject,
  isStringifiable,
  isValidFiles,
  isValidFrom,
  isValidTo,
  truncate,
  escapeRegex,
  getParamValue,
  replacePlaceholders
}
