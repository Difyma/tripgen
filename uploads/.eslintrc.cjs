module.exports = {
  root: true,
  env: { 
    browser: true, 
    es2020: true
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': 'warn',
    '@typescript-eslint/no-unused-vars': 'warn',
    'no-unused-vars': 'off',
    'react-hooks/exhaustive-deps': 'warn',
    'no-useless-escape': 'off',
    'no-misleading-character-class': 'off',
    'no-undef': 'off',
    'no-empty': 'off',
    'no-prototype-builtins': 'off',
    'getter-return': 'off',
    'no-fallthrough': 'off',
    'no-constant-condition': 'off',
    'no-unreachable': 'off',
    'no-redeclare': 'off',
    'no-self-assign': 'off',
    'no-cond-assign': 'off',
    'no-control-regex': 'off',
    'valid-typeof': 'off',
    'no-sparse-arrays': 'off',
    'require-yield': 'off',
    'no-func-assign': 'off'
  }
}