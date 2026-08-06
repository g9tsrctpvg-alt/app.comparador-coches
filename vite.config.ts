import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/app.comparador-coches/',
  plugins: [react()],
  test: {
    environment: 'node',
    // `false` por defecto stubbea todo import de CSS a un módulo vacío.
    // `validateStyleTokensRepo.test.ts` (technical/0004, requisito 13) lee
    // el contenido real de `.module.css` y de la hoja global con
    // `import.meta.glob`, así que necesita el CSS de verdad.
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/domain/**', 'src/data/**', 'src/logging/**'],
      exclude: ['**/testFixtures.ts'],
      thresholds: {
        lines: 100,
        statements: 100,
        functions: 100,
        branches: 100,
      },
    },
  },
});
