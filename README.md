# comparador-coches

Comparador de coches: once candidatos puntuados sobre seis ejes, con pesos
ajustables y recálculo en vivo.

El proyecto está en fase de base. Hay contrato de trabajo, estructura
documental, CI de gates documentales y **stack decidido** —SPA estática con
Vite, React y TypeScript, sin backend—, pero **todavía no hay código de
producción**: las dos specs que lo introducen siguen en `draft`, esperando el
gate humano.

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
