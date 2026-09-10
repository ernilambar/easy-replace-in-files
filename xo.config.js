const jsFiles = ['**/*.{js,cjs,mjs,ts,cts,mts,tsx}']

const xoConfig = [
  {
    ignores: ['**/*.md'],
  },
  {
    files: jsFiles,
    space: true,
    semicolon: false,
    rules: {
      // Keep the legacy `standard`-era code style; avoid large reformats.

      // Stylistic rules that conflict with the existing code
      '@stylistic/object-curly-spacing': 'off',
      '@stylistic/comma-dangle': 'off',
      '@stylistic/arrow-parens': 'off',
      '@stylistic/object-curly-newline': 'off',
      '@stylistic/block-spacing': 'off',
      '@stylistic/space-before-function-paren': ['error', {anonymous: 'always', named: 'always', asyncArrow: 'always'}],
      '@stylistic/padding-line-between-statements': 'off',
      '@stylistic/operator-linebreak': 'off',
      '@stylistic/max-statements-per-line': 'off',

      // Unicorn rules that conflict with the existing code
      'unicorn/name-replacements': 'off',
      'unicorn/prefer-node-protocol': 'off',
      'unicorn/no-array-callback-reference': 'off',
      'unicorn/no-for-each': 'off',
      'unicorn/consistent-boolean-name': 'off',
      'unicorn/prefer-string-raw': 'off',
      'unicorn/catch-error-name': 'off',
      'unicorn/no-unsafe-string-replacement': 'off',
      'unicorn/no-process-exit': 'off',
      'unicorn/consistent-assert': 'off',
      'unicorn/prefer-ternary': 'off',
      'unicorn/prefer-string-replace-all': 'off',

      // ESLint core rules that conflict with the existing code
      curly: ['error', 'multi-line'],
      'prefer-arrow-callback': 'off',
      'no-implicit-coercion': 'off',
      'prefer-destructuring': 'off',
      'arrow-body-style': 'off',
      'prefer-const': 'off',
      'prefer-object-has-own': 'off',

      // Node / test / jsdoc / misc rules that conflict with the existing code
      'n/prefer-global/process': 'off',
      'node-test/no-process-env-mutation': 'off',
      'node-test/no-compound-assertion': 'off',
      'node-test/consistent-assert-style': 'off',
      'jsdoc/require-asterisk-prefix': 'off',
      'jsdoc/require-returns-description': 'off',
      'jsdoc/require-param-description': 'off',
      'jsdoc/require-description': 'off',
      'jsdoc/check-types': 'off',
      'jsdoc/require-property-description': 'off',
      'jsdoc/require-throws-type': 'off',
      'require-unicode-regexp': 'off',
      'regexp/prefer-named-capture-group': 'off',
      'import-x/order': 'off',
      'preserve-caught-error': 'off',
    },
  },
]

export default xoConfig
