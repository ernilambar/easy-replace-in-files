import { readPackageUpSync } from 'read-pkg-up'

const isEmptyObject = (obj) => {
  return obj && Object.keys(obj).length === 0 && Object.getPrototypeOf(obj) === Object.prototype
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

export { isEmptyObject, getParamValue, replacePlaceholders }
