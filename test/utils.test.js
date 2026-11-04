import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  isEmptyObject,
  isPlainObject,
  isStringifiable,
  isValidFiles,
  isValidFrom,
  isValidTo,
  truncate,
  getParamValue,
  replacePlaceholders
} from '../src/utils.js'

describe('isPlainObject', () => {
  it('returns true for plain object', () => {
    assert.strictEqual(isPlainObject({}), true)
    assert.strictEqual(isPlainObject({ a: 1 }), true)
  })

  it('returns false for null', () => {
    assert.strictEqual(isPlainObject(null), false)
  })

  it('returns false for array', () => {
    assert.strictEqual(isPlainObject([]), false)
  })

  it('returns false for string', () => {
    assert.strictEqual(isPlainObject(''), false)
    assert.strictEqual(isPlainObject('x'), false)
  })

  it('returns false for number and boolean', () => {
    assert.strictEqual(isPlainObject(0), false)
    assert.strictEqual(isPlainObject(true), false)
  })

  it('returns true for Date and RegExp (current impl treats any non-array object as plain)', () => {
    assert.strictEqual(isPlainObject(new Date()), true)
    assert.strictEqual(isPlainObject(/x/), true)
  })
})

describe('isStringifiable', () => {
  it('returns true for string, number, boolean, null', () => {
    assert.strictEqual(isStringifiable(''), true)
    assert.strictEqual(isStringifiable('x'), true)
    assert.strictEqual(isStringifiable(0), true)
    assert.strictEqual(isStringifiable(null), true)
    assert.strictEqual(isStringifiable(true), true)
  })

  it('returns false for object and array', () => {
    assert.strictEqual(isStringifiable({}), false)
    assert.strictEqual(isStringifiable([]), false)
  })

  it('returns false for undefined', () => {
    assert.strictEqual(isStringifiable(undefined), false)
  })
})

describe('isValidFiles', () => {
  it('returns true for non-empty string', () => {
    assert.strictEqual(isValidFiles('a'), true)
    assert.strictEqual(isValidFiles('file.txt'), true)
  })

  it('returns false for empty string', () => {
    assert.strictEqual(isValidFiles(''), false)
  })

  it('returns false for empty array', () => {
    assert.strictEqual(isValidFiles([]), false)
  })

  it('returns true for non-empty array of stringifiable elements', () => {
    assert.strictEqual(isValidFiles(['a.txt', 'b.txt']), true)
    assert.strictEqual(isValidFiles(['x']), true)
  })

  it('returns false for array with an empty string element', () => {
    assert.strictEqual(isValidFiles(['']), false)
    assert.strictEqual(isValidFiles(['a', '']), false)
  })

  it('returns false for array with non-stringifiable element', () => {
    assert.strictEqual(isValidFiles(['a', {}]), false)
    assert.strictEqual(isValidFiles(['a', undefined]), false)
  })
})

describe('isValidFrom', () => {
  it('returns true for non-empty string', () => {
    assert.strictEqual(isValidFrom('x'), true)
  })

  it('returns false for empty string', () => {
    assert.strictEqual(isValidFrom(''), false)
  })

  it('returns false for empty array', () => {
    assert.strictEqual(isValidFrom([]), false)
  })

  it('returns true for non-empty array of stringifiable elements', () => {
    assert.strictEqual(isValidFrom(['a', 'b']), true)
  })

  it('returns false for array with an empty string element', () => {
    assert.strictEqual(isValidFrom(['']), false)
    assert.strictEqual(isValidFrom(['a', '']), false)
  })
})

describe('isValidTo', () => {
  it('returns true for string including empty', () => {
    assert.strictEqual(isValidTo(''), true)
    assert.strictEqual(isValidTo('x'), true)
  })

  it('returns true for array of stringifiable elements', () => {
    assert.strictEqual(isValidTo(['a', 'b']), true)
    assert.strictEqual(isValidTo([]), true)
  })

  it('returns false for array with non-stringifiable element', () => {
    assert.strictEqual(isValidTo(['a', {}]), false)
  })
})

describe('truncate', () => {
  it('returns string unchanged when length <= max', () => {
    assert.strictEqual(truncate('hi', 50), 'hi')
    assert.strictEqual(truncate('x'.repeat(50), 50), 'x'.repeat(50))
  })

  it('truncates and appends ... when length > max', () => {
    assert.strictEqual(truncate('hello world', 5), 'hello...')
    assert.strictEqual(truncate('abcdefghij', 10), 'abcdefghij')
    assert.strictEqual(truncate('abcdefghijk', 10), 'abcdefghij...')
  })

  it('uses default max 50', () => {
    const long = 'a'.repeat(60)
    assert.strictEqual(truncate(long), 'a'.repeat(50) + '...')
  })

  it('coerces non-string to string', () => {
    assert.strictEqual(truncate(123, 5), '123')
    assert.strictEqual(truncate(null, 5), 'null')
  })
})

describe('isEmptyObject', () => {
  it('returns true for empty plain object', () => {
    assert.strictEqual(isEmptyObject({}), true)
  })

  it('returns false for object with keys', () => {
    assert.strictEqual(isEmptyObject({ a: 1 }), false)
  })

  it('returns falsy for null', () => {
    assert.ok(!isEmptyObject(null))
  })

  it('returns false for array', () => {
    assert.strictEqual(isEmptyObject([]), false)
  })

  it('returns falsy for non-object', () => {
    assert.ok(!isEmptyObject(''))
    assert.ok(!isEmptyObject(0))
  })

  it('returns falsy for undefined', () => {
    assert.ok(!isEmptyObject(undefined))
  })

  it('returns true for object with symbol keys only (Object.keys omits symbols)', () => {
    const sym = Symbol('x')
    assert.strictEqual(isEmptyObject({ [sym]: 1 }), true)
  })
})

describe('getParamValue', () => {
  it('returns global literal RegExp when mode is string', () => {
    const result = getParamValue('foo', 'string')
    assert(result instanceof RegExp)
    assert.strictEqual(result.global, true)
    assert.strictEqual('foo foo foo'.replace(result, 'X'), 'X X X')
  })

  it('defaults to string mode', () => {
    assert.strictEqual('x x'.replace(getParamValue('x'), 'y'), 'y y')
  })

  it('string mode matches regex metacharacters literally', () => {
    const result = getParamValue('a.b(c)[d]*$', 'string')
    assert.strictEqual('a.b(c)[d]*$ axb(c)'.replace(result, 'Z'), 'Z axb(c)')
  })

  it('returns RegExp when mode is regex and pattern is valid', () => {
    const result = getParamValue('\\d+', 'regex')
    assert(result instanceof RegExp)
    assert.strictEqual(result.global, true)
    assert.strictEqual('a1b2'.replace(result, 'X'), 'aXbX')
  })

  it('throws SyntaxError when mode is regex and pattern is invalid', () => {
    assert.throws(() => getParamValue('[unclosed', 'regex'), SyntaxError)
  })

  it('returns non-string input as-is (defensive)', () => {
    assert.strictEqual(getParamValue(42), 42)
    assert.strictEqual(getParamValue(null), null)
  })

  it('handles unknown mode like string mode', () => {
    assert.strictEqual('a.a'.replace(getParamValue('.', 'unknown'), '-'), 'a-a')
  })

  it('handles regex with special chars that need escaping', () => {
    const result = getParamValue('\\s+', 'regex')
    assert(result instanceof RegExp)
    assert.strictEqual('a  b'.replace(result, ''), 'ab')
  })
})

describe('replacePlaceholders', () => {
  it('returns string unchanged when no placeholders', () => {
    assert.strictEqual(replacePlaceholders('hello'), 'hello')
    assert.strictEqual(replacePlaceholders(''), '')
  })

  it('returns non-string input as-is (defensive)', () => {
    assert.strictEqual(replacePlaceholders(123), 123)
    assert.strictEqual(replacePlaceholders(null), null)
  })

  it('replaces env var placeholder when set', () => {
    const key = 'TEST_PLACEHOLDER_REPLACE_' + Date.now()
    process.env[key] = 'env-value'
    try {
      assert.strictEqual(replacePlaceholders(`foo $$${key}$$ bar`), 'foo env-value bar')
    } finally {
      delete process.env[key]
    }
  })

  it('leaves placeholder when env var not set', () => {
    const key = 'DEFINITELY_NOT_SET_' + Date.now()
    assert.strictEqual(replacePlaceholders(`$$${key}$$`), `$$${key}$$`)
  })

  it('replaces multiple placeholders', () => {
    const a = 'A_' + Date.now()
    const b = 'B_' + Date.now()
    process.env[a] = '1'
    process.env[b] = '2'
    try {
      assert.strictEqual(replacePlaceholders(`$$${a}$$-$$${b}$$`), '1-2')
    } finally {
      delete process.env[a]
      delete process.env[b]
    }
  })

  it('leaves malformed placeholder unchanged', () => {
    assert.strictEqual(replacePlaceholders('$$noClosing'), '$$noClosing')
    assert.strictEqual(replacePlaceholders('noDollars'), 'noDollars')
  })

  it('handles placeholder at start and end', () => {
    const key = 'EDGE_' + Date.now()
    process.env[key] = 'v'
    try {
      assert.strictEqual(replacePlaceholders(`$$${key}$$x`), 'vx')
      assert.strictEqual(replacePlaceholders(`x$$${key}$$`), 'xv')
    } finally {
      delete process.env[key]
    }
  })

  it('handles empty string placeholder key', () => {
    const result = replacePlaceholders('$$$$')
    assert.ok(result === '$$$$' || result === '')
  })

  it('handles env value with special regex chars', () => {
    const key = 'SPECIAL_' + Date.now()
    process.env[key] = '$1.0'
    try {
      assert.strictEqual(replacePlaceholders(`ver: $$${key}$$`), 'ver: $1.0')
    } finally {
      delete process.env[key]
    }
  })

  it('inserts env value literally ($& and $\' not interpreted)', () => {
    const key = 'DOLLAR_' + Date.now()
    process.env[key] = "[$&-$'-$$]"
    try {
      assert.strictEqual(replacePlaceholders(`v=$$${key}$$`), "v=[$&-$'-$$]")
    } finally {
      delete process.env[key]
    }
  })

  it('escapeDollar doubles $ in values only, not in the template', () => {
    const key = 'ESC_' + Date.now()
    process.env[key] = '$1'
    try {
      assert.strictEqual(replacePlaceholders(`$2-$$${key}$$`, { escapeDollar: true }), '$2-$$1')
    } finally {
      delete process.env[key]
    }
  })

  it('escapeDollar also escapes unresolved placeholders', () => {
    const key = 'UNSET_' + Date.now()
    assert.strictEqual(replacePlaceholders(`$$${key}$$`, { escapeDollar: true }), `$$$$${key}$$$$`)
  })

  it('does not expand placeholders inside substituted values', () => {
    const a = 'CHAIN_A_' + Date.now()
    const b = 'CHAIN_B_' + Date.now()
    process.env[a] = `$$${b}$$`
    process.env[b] = 'secret'
    try {
      assert.strictEqual(replacePlaceholders(`$$${a}$$ $$${b}$$`), `$$${b}$$ secret`)
    } finally {
      delete process.env[a]
      delete process.env[b]
    }
  })

  it('replaces repeated placeholder everywhere', () => {
    const key = 'REPEAT_' + Date.now()
    process.env[key] = 'r'
    try {
      assert.strictEqual(replacePlaceholders(`$$${key}$$/$$${key}$$`), 'r/r')
    } finally {
      delete process.env[key]
    }
  })

  it('resolves package__ from given pkg; scalars only', () => {
    const pkg = { name: 'p', version: '1.2.3', private: true, n: 7, repository: { url: 'x' }, keywords: ['a'] }
    assert.strictEqual(
      replacePlaceholders('$$package__name$$@$$package__version$$ $$package__private$$ $$package__n$$', { pkg }),
      'p@1.2.3 true 7'
    )
    assert.strictEqual(replacePlaceholders('$$package__repository$$', { pkg }), '$$package__repository$$')
    assert.strictEqual(replacePlaceholders('$$package__keywords$$', { pkg }), '$$package__keywords$$')
    assert.strictEqual(replacePlaceholders('$$package__missing$$', { pkg }), '$$package__missing$$')
  })

  it('leaves package__ placeholder when no pkg given', () => {
    assert.strictEqual(replacePlaceholders('$$package__name$$'), '$$package__name$$')
  })

  it('package__ only resolves top-level keys (nested like package__scripts.build not supported)', () => {
    const result = replacePlaceholders('$$package__scripts.build$$')
    assert.strictEqual(result, '$$package__scripts.build$$')
  })
})
