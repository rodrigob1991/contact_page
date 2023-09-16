/* eslint-env node */
module.exports = {
    extends: ['plugin:@typescript-eslint/strict-type-checked'],
    parser: '@typescript-eslint/parser',
    parserOptions: {project: true},
    plugins: ['@typescript-eslint'],
    root: true,
};