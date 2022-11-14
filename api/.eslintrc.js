module.exports = {
  extends: '@loopback/eslint-config',
  env: {
    node: true,
    mocha: true,
    es6: true,
  },
  plugins: ['mocha'],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module', // fix
  },
  overrides: [
    {
      files: ['**/*.js', '**/*.ts'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-misused-promises': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/prefer-optional-chain': 'off',
        '@typescript-eslint/prefer-nullish-coalescing': 'off',
      },
    },
  ],
  rules: {
    'comma-dangle': ['error', 'always-multiline'],
    'no-cond-assign': 'error',
    'no-console': 'off',
    'no-unused-expressions': 'error',
    'no-const-assign': 'error',
    'array-bracket-spacing': ['error', 'never'],
    'block-spacing': ['error', 'always'],
    'brace-style': ['error', '1tbs', {allowSingleLine: true}],
    camelcase: 'off',
    'no-unused-expressions': 'off',
    '@typescript-eslint/naming-convention': 'off',
    '@typescript-eslint/no-shadow': 'off',
    '@typescript-eslint/no-inferrable-types': 'off',
    'comma-spacing': ['error', {before: false, after: true}],
    'comma-style': ['error', 'last'],
    'computed-property-spacing': ['error', 'never'],
    'eol-last': ['error', 'unix'],
    'func-names': 0,
    'func-call-spacing': ['error', 'never'],
    'function-paren-newline': 'off',
    'key-spacing': ['error', {beforeColon: false, afterColon: true, mode: 'strict'}],
    'max-len': [
      'error',
      110,
      8,
      {
        ignoreComments: true,
        ignoreUrls: true,
        ignorePattern: '^\\s*var\\s.+=\\s*require\\s*\\(',
      },
    ],
    'mocha/handle-done-callback': 'error',
    'mocha/no-exclusive-tests': 'error',
    'mocha/no-identical-title': 'error',
    'mocha/no-nested-tests': 'error',
    'no-array-constructor': 2,
    'no-extra-semi': 'error',
    'no-multi-spaces': 'error',
    'no-multiple-empty-lines': ['error', {max: 1}],
    'no-redeclare': ['error'],
    'no-trailing-spaces': 2,
    'no-undef': 'error',
    'no-var': 'error',
    'object-curly-spacing': ['error', 'never'],
    'one-var': [
      'error',
      {
        initialized: 'never',
        uninitialized: 'always',
      },
    ],
    'operator-linebreak': 'off',
    'padded-blocks': ['error', 'never'],
    'prefer-const': 'error',
    'semi-spacing': ['error', {before: false, after: true}],
    semi: ['error', 'always'],
    'space-before-blocks': ['error', 'always'],
    'space-before-function-paren': 'off',
    'space-in-parens': ['error', 'never'],
    'space-infix-ops': ['error', {int32Hint: false}],
    'spaced-comment': [
      'error',
      'always',
      {
        line: {
          markers: ['/'],
          exceptions: ['-'],
        },
        block: {
          balanced: true,
          markers: ['!'],
          exceptions: ['*'],
        },
      },
    ],
    strict: ['error', 'global'],
  },
};
