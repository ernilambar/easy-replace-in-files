import chalk from 'chalk'

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
 * @throws {SyntaxError} When mode is regex and the pattern is invalid
 */
const getParamValue = (string, mode = 'string') => {
  if (typeof string !== 'string') {
    return string
  }

  if (mode === 'regex') {
    return new RegExp(string, 'g')
  }

  return new RegExp(escapeRegex(string), 'g')
}

/**
 * Expand $$ENV_VAR$$ and $$package__field$$ in a single pass; values are inserted literally.
 * @param {string} string
 * @param {{ escapeDollar?: boolean, pkg?: Record<string, unknown> }} [opts] - `escapeDollar`: escape `$` in values so a later String.replace() keeps them literal (use for `to`). `pkg`: parsed package.json for `package__` lookups.
 * @returns {string}
 */
const replacePlaceholders = (string, { escapeDollar = false, pkg } = {}) => {
  if (typeof string !== 'string') {
    return string
  }

  return string.replace(/\$\$(.*?)\$\$/g, (match, item) => {
    let value

    if (Object.prototype.hasOwnProperty.call(process.env, item)) {
      value = process.env[item]
    } else if (item.includes('package__')) {
      const pvar = item.replace('package__', '')

      if (pkg && Object.prototype.hasOwnProperty.call(pkg, pvar)) {
        value = pkg[pvar]
        if (!['string', 'number', 'boolean'].includes(typeof value)) {
          console.log(`${chalk.cyan('WARN')}: ${chalk.yellow(match)} is not a string, number, or boolean. Leaving as is.`)
          value = undefined
        }
      }
    }

    // Unresolved placeholders are kept verbatim (escaped too, so `to` output still reads $$KEY$$)
    const str = value === undefined ? match : String(value)
    return escapeDollar ? str.replaceAll('$', '$$$$') : str
  })
}

export {
  truncate,
  getParamValue,
  replacePlaceholders
}
