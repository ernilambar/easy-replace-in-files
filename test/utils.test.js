import { describe, it } from 'node:test'
import assert from 'node:assert'
import { isEmptyObject, getParamValue, replacePlaceholders } from '../src/utils.js'

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
})
