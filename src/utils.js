import { readPackageUpSync } from 'read-pkg-up'

const isEmptyObject = (obj) => {
  return obj && Object.keys(obj).length === 0 && Object.getPrototypeOf(obj) === Object.prototype
}

const getParamValue = (string, mode = 'string') => {
  let output = string

  if (mode === 'regex') {
    output = new RegExp(string, 'g')
  }

  return output
}

const replacePlaceholders = (string) => {
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

      const pkg = readPackageUpSync().packageJson

      if (Object.prototype.hasOwnProperty.call(pkg, pvar)) {
        string = string.replace(`$$${item}$$`, pkg[pvar])
      }
    }
  })

  return string
}

export { isEmptyObject, getParamValue, replacePlaceholders }
