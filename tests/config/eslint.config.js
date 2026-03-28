module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-inferrable-types': 'off',
    '@typescript-eslint/ban-types': 'off',
    'no-console': 'off',
    'no-debugger': 'off',
    'no-case-declarations': 'off',
    'no-useless-escape': 'off',
    'no-inner-declarations': 'off',
    'no-useless-catch': 'off',
    'prefer-const': 'off',
    'no-var': 'off',
  },
  ignorePatterns: ['dist/', 'node_modules/', 'coverage/', 'src/__tests__/'],
};
