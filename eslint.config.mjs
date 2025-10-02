import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
    eslint.configs.recommended,

    {
        files: ['**/*.ts'],
        extends: [
            tseslint.configs.strict,
            tseslint.configs.stylistic,
        ],
    },

    {
        ignores: [
            'dist/',
            'scripts/clean.js',
        ],
    }
)