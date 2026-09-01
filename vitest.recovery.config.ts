import { defineConfig } from 'vitest/config';

/**
 * La medición empírica de `product/0035`, que la tanda de tests por omisión
 * excluye por lenta (ver `vite.config.ts`). Este config existe solo para
 * poder pedirla explícitamente con `npm run test:recovery`.
 *
 * No hereda de `vite.config.ts` a propósito: heredarlo arrastraría su
 * `exclude` —que es justo lo que aquí hay que anular, porque `mergeConfig`
 * concatena arrays en vez de sustituirlos— y además no hace falta nada de
 * él. Este fichero solo ejercita `src/domain/`: ni CSS, ni React, ni umbral
 * de cobertura, porque no es una tanda completa y no pretende cubrir nada.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.recovery.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
});
