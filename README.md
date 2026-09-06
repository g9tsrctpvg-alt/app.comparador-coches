# comparador-coches

Comparador de coches: dieciocho candidatos publicados puntuados sobre ocho
ejes, con pesos ajustables y recálculo en vivo.

La aplicación está **en producción sobre GitHub Pages**, con el catálogo, la
clasificación y la ficha comparada implementados sobre el stack decidido —SPA
estática con Vite, React y TypeScript, sin backend— y el suelo de CI completo.
Qué fase sigue abierta y qué deuda arrastra está en `docs/roadmap.md`.

## Por dónde empezar

| Si buscas | Ve a |
| --- | --- |
| Cómo se trabaja aquí | [`CLAUDE.md`](CLAUDE.md) |
| En qué punto está el proyecto | [`docs/roadmap.md`](docs/roadmap.md) |
| Por qué se decidió algo | [`docs/decisions/`](docs/decisions/) |
| Cómo funciona el sistema hoy | [`docs/estado/`](docs/estado/) |
| Qué se va a construir | [`specs/`](specs/) |

`CLAUDE.md` es el punto de entrada real, tanto para personas como para
agentes: es un índice corto que enlaza al resto.

## Reglas que conviene saber antes de tocar nada

- **No se escribe código de producción sin una spec `approved`.** El tamaño
  del cambio no es el criterio.
- **Para saber cómo funciona el sistema hoy se leen los docs de estado**,
  nunca las specs: su sección *Contexto* es histórica por diseño.
- **La CI es la fuente de verdad.** Se pasa entera en local antes de dar algo
  por hecho.

## Verificación local

```bash
npm run test:coverage
npx --yes markdownlint-cli2 "**/*.md"
```

La secuencia completa y qué comprueba cada paso están en
[`docs/proceso/ci-y-guardarrailes.md`](docs/proceso/ci-y-guardarrailes.md).
