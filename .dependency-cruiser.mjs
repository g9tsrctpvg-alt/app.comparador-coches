export default {
  forbidden: [
    {
      name: 'domain-no-ui-or-react',
      comment:
        'domain/ es el núcleo: no conoce la interfaz ni el framework. Lo que ' +
        'necesita de fuera se declara como puerto, no se importa directo.',
      severity: 'error',
      from: { path: '^src/domain' },
      to: {
        path: '^(src/ui|src/main\\.tsx|node_modules/react(-dom)?($|/))',
      },
    },
    {
      name: 'ui-no-scoring-internals',
      comment:
        'La interfaz solo consume el desglose ya calculado (scoreCatalog) y ' +
        'los tipos; no puede importar las piezas internas de fórmula (ejes, ' +
        'normalización) y reproducir un cálculo por su cuenta (product/0001, ' +
        'requisito 2 y último criterio de aceptación).',
      severity: 'error',
      from: { path: '^(src/ui|src/main\\.tsx)' },
      to: { path: '^src/domain/scoring/(axes|normalize|mustGet)' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
  },
};
