module.exports = {
  extends: [
    'airbnb-typescript',
    'airbnb/hooks',
    'plugin:@typescript-eslint/recommended',
    'plugin:jest/recommended',
    'prettier',
    'plugin:prettier/recommended',
  ],
  plugins: ['react', '@typescript-eslint', 'jest'],
  env: {
    browser: true,
    es2020: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
    project: ['./tsconfig.json'],
  },
  rules: {
    'max-len': 0,
    'react/prop-types': 0,
    'prettier/prettier': ['error', { singleQuote: true }],
    'react/jsx-filename-extension': [2, { extensions: ['.jsx', '.tsx'] }],
    'react/jsx-one-expression-per-line': 0,
    '@typescript-eslint/ban-ts-comment': 'off',
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        jsx: 'never',
        ts: 'never',
        tsx: 'never',
      },
    ],
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: ['**/*.test.tsx', '*/jest-configs/*'],
      },
    ],
  },
  settings: {
    'import/resolver': {
      "alias": [
        ["@components", "./src/components"],
        ["@customHooks", "./src/customHooks"],
        ["@helpers", "./src/helpers"],
        ["@pages", "./src/pages"],
        ["@templates", "./src/templates"],
        ["@utils/*", "./src/utils/*"],
        ["@api", "./src/apiMob"],
        ["@cms", "./src/cms"],
        ["@modules", "./src/modules"],
        ["@assets", "./src/assets"],
        ["@constants", "./src/constants"],
        ["@environment", "./src/environment"],
      ],
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      },
    },
  },
};
