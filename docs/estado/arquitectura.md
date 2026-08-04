# Estado: arquitectura

> Este documento es la **autoridad sobre cómo está construido el sistema
> hoy**: estructura de capas, límites entre módulos, dirección de las
> dependencias y punto de arranque. Si hay duda entre dos formas de
> estructurar algo, gana lo que diga este documento, no la preferencia del
> agente ni el precedente más cercano en el código.

**Estado:** Activo.

## Stack

Aplicación única, SPA estática sin backend: **Vite · React · TypeScript ·
npm**, decidida en `docs/decisions/0003-stack.md`. TypeScript corre en modo
`strict`, sin escapes sin comentario justificativo.

## Estructura de módulos

```text
src/
  domain/     núcleo: tipos, dominio de puntuación y validación, sin conocer UI ni React
    scoring/  motor de puntuación explicable — ver docs/estado/dominio.md
  data/       carga y validación del catálogo (JSON + Zod)
  logging/    logger de navegador, forma de campos OTel
  ui/         componentes React — ver docs/estado/interfaz.md
  main.tsx    único punto de wiring
scripts/      utillaje del repositorio, fuera del bundle
  validateDocs.ts  validador de specs y ADRs, corre bajo Vitest
```

`scripts/` no es código de la aplicación y nada de `src/` lo importa, así que
no entra en el bundle. Sí entra en `tsconfig.json` y en `eslint`: es
TypeScript del proyecto y se le exige lo mismo que al resto.

## Dirección de las dependencias

`domain/` no importa de `ui/`, de `react` ni de `react-dom`. `ui/` y
`main.tsx`, a su vez, no importan las piezas internas de fórmula de
`domain/scoring/` (`axes/`, `normalize.ts`, `mustGet.ts`): solo
`scoreCatalog` y tipos. Las dos reglas son **ejecutables**:
`dependency-cruiser` (`.dependency-cruiser.mjs`) las comprueba en CI
(`npm run arch:check`) y falla el paso de contratos de arquitectura si se
violan.

El tipo `Car` y su esquema de validación (`CarSchema`) viven en
`domain/car.ts`, declarados con Zod: el dominio fija la forma de sus datos, y
`data/` la usa para validar el JSON externo. Los tipos de dominio se derivan
de esa declaración (`z.infer<typeof CarSchema>`), no al revés.

`ui/` y `main.tsx` dependen de `domain/`, `data/` y `logging/`; nunca al
contrario.

## Carga y validación de datos

`src/data/cars.json` es el catálogo, embebido en el build (sin *fetch* en
tiempo de ejecución: no hay red que llamar en una SPA sin backend).
`src/data/loadCatalog.ts` lo valida contra `CarSchema` con Zod; un registro
que no valida lanza `CatalogValidationError`, identificando el campo y el
registro afectados —por `id` cuando existe en el dato crudo, si no por
índice—.

El **contenido** del catálogo —once candidatos reales, cada dato con su
estructura de fuentes— es responsabilidad de `product/0001`, ya
implementada: detalle en `docs/estado/dominio.md`.

## Logging

`src/logging/logger.ts` implementa el logger de navegador que fija el
addendum de `docs/decisions/0001-formato-de-logs.md`: un objeto JSON con
`Timestamp`, `SeverityText`, `Body`, `Attributes` y `Resource` (con
`service.name: comparador-coches-web`), **solo para errores**, sin
`TraceId` —no hay petición que correlacionar—. La regla `no-console` de
ESLint impide escribir a consola fuera de ese módulo.

## Tests y cobertura

Vitest, con cobertura v8 y suelo por *ratcheting* al 100% de líneas,
sentencias y funciones en `domain/`, `data/` y `logging/`
(`vite.config.ts`, bloque `test.coverage`). `ui/` y `main.tsx` quedan fuera
del suelo: es la interfaz real del comparador, no andamiaje a punto de
rehacerse, pero no tiene tests automatizados propios todavía —su
verificación ha sido manual, contra un navegador real—. Si debe entrar en el
suelo es una decisión pendiente, registrada como deuda en
`docs/roadmap.md`.

## Qué falta

Nada pendiente propio de este documento. El dominio de puntuación y la
interfaz que lo consume están descritos en `docs/estado/dominio.md` y
`docs/estado/interfaz.md` respectivamente.
