module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    '@electron-toolkit/eslint-config-ts/recommended',
    '@electron-toolkit/eslint-config-prettier'
  ],
  parserOptions: {
    warnOnUnsupportedTypeScriptVersion: false
  },
  plugins: ['simple-import-sort', 'unused-imports'],
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'prettier/prettier': ['error', { endOfLine: 'auto' }],
    'react/prop-types': 'off',

    'simple-import-sort/exports': 'error',

    // import sorting
    'simple-import-sort/imports': [
      'error',
      {
        groups: [
          // 1. Node.js built-ins
          ['^node:', `^(${require('module').builtinModules.join('|')})(/|$)`],

          // 2. NPM packages (react luôn đứng đầu)
          ['^react', '^@?\\w'],

          // 3. Alias imports (theo dải thư mục của bạn)
          ['^@renderer/components', '^@renderer/context', '^@renderer/lib', '^@renderer/icons'],
          ['^@shared'],

          // 4. Relative imports (../ or ./)
          ['^\\.'],

          // 5. Styles
          ['\\.css$', '\\.scss$']
        ]
      }
    ],

    // unused imports
    'unused-imports/no-unused-imports': 'error',

    'unused-imports/no-unused-vars': [
      'warn',
      {
        args: 'after-used',
        argsIgnorePattern: '^_',
        vars: 'all',
        varsIgnorePattern: '^_'
      }
    ]
  },
  settings: {
    react: {
      version: 'detect'
    }
  }
}
