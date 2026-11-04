import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  truncate,
  getParamValue,
  replacePlaceholders
} from '../src/utils.js'

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
