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

  it('returns true for array with one empty string (elements only need to be stringifiable)', () => {
    assert.strictEqual(isValidFiles(['']), true)
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

  it('returns true for array with one empty string (elements only need to be stringifiable)', () => {
    assert.strictEqual(isValidFrom(['']), true)
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
  it('returns string as-is when mode is string', () => {
    assert.strictEqual(getParamValue('hello'), 'hello')
    assert.strictEqual(getParamValue('foo bar'), 'foo bar')
  })

  it('returns string as-is when mode is default', () => {
    assert.strictEqual(getParamValue('x'), 'x')
  })

  it('returns RegExp when mode is regex and pattern is valid', () => {
    const result = getParamValue('\\d+', 'regex')
    assert(result instanceof RegExp)
    assert.strictEqual(result.global, true)
    assert.strictEqual('a1b2'.replace(result, 'X'), 'aXbX')
  })

  it('returns string when mode is regex but pattern is invalid', () => {
    const result = getParamValue('[unclosed', 'regex')
    assert.strictEqual(typeof result, 'string')
    assert.strictEqual(result, '[unclosed')
  })

  it('returns non-string input as-is (defensive)', () => {
    assert.strictEqual(getParamValue(42), 42)
    assert.strictEqual(getParamValue(null), null)
  })

  it('returns empty string as-is in string mode', () => {
    assert.strictEqual(getParamValue('', 'string'), '')
  })

  it('handles unknown mode like string mode', () => {
    assert.strictEqual(getParamValue('x', 'unknown'), 'x')
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

  it('package__ only resolves top-level keys (nested like package__scripts.build not supported)', () => {
    const result = replacePlaceholders('$$package__scripts.build$$')
    assert.strictEqual(result, '$$package__scripts.build$$')
  })
})
