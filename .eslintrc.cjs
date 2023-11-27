/** @type {import("eslint").Linter.Config} */
const config = {
    root: true,
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended-type-checked',
        'plugin:@typescript-eslint/stylistic-type-checked',
        'prettier',
    ],
    env: {
        es2022: true,
        node: true,
    },
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: true,
    },
    plugins: ['@typescript-eslint', 'import'],
    rules: {
        'no-unused-vars': [
            1,
            {
                args: 'after-used',
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
            },
        ],
        'turbo/no-undeclared-env-vars': 'off',
        '@typescript-eslint/no-floating-promises': [1, { ignoreVoid: true, ignoreIIFE: false }],
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/consistent-type-definitions': [1, 'type'],
        '@typescript-eslint/no-unused-vars': [1, { args: 'after-used', argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
        '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports', fixStyle: 'separate-type-imports' }],
        '@typescript-eslint/no-misused-promises': [2, { checksVoidReturn: { attributes: false } }],
        'import/consistent-type-specifier-style': ['error', 'prefer-inline'],
    },
    ignorePatterns: ['**/.eslintrc.cjs', '**/*.config.js', '**/*.config.cjs', 'dist', 'pnpm-lock.yaml'],
    reportUnusedDisableDirectives: true,
};
module.exports = config;
