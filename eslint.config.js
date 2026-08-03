import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  { ignores: ['dist/**', 'coverage/**', 'node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'no-undef': 'off',
      'no-console': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { varsIgnorePattern: '^_', argsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['src/ui/**/*.{ts,tsx}', 'src/main.tsx'],
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  {
    files: ['src/logging/logger.ts'],
    rules: { 'no-console': 'off' },
  },
  {
    // Un test indexa fixtures que él mismo acaba de construir: sabe que el
    // elemento existe. El riesgo de una aserción no nula aquí es un mensaje
    // de fallo peor, no un bug de producción — no exige la misma
    // justificación caso a caso que el código de dominio.
    files: ['**/*.test.{ts,tsx}'],
    rules: { '@typescript-eslint/no-non-null-assertion': 'off' },
  },
);
