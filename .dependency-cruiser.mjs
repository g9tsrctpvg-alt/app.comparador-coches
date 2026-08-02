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
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
  },
};
