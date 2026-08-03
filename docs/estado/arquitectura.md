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
  domain/     núcleo: tipos y validación de dominio, sin conocer UI ni React
  data/       carga y validación del catálogo (JSON + Zod)
  logging/    logger de navegador, forma de campos OTel
  ui/         componentes React
  main.tsx    único punto de wiring
```

## Dirección de las dependencias

`domain/` no importa de `ui/`, de `react` ni de `react-dom`. La regla es
**ejecutable**: `dependency-cruiser` (`.dependency-cruiser.mjs`) la comprueba
en CI (`npm run arch:check`) y falla el paso de contratos de arquitectura si
se viola.

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

El **contenido** del catálogo —los coches, sus fuentes, el desglose de
puntuación— es responsabilidad de `product/0001`, todavía sin implementar.
Lo que hay hoy es un catálogo mínimo de prueba: dos modelos con dimensiones,
precio y tecnología, sin la estructura de fuentes por dato que introducirá
esa spec.

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
del suelo: hoy son andamiaje mínimo de cableado que `product/0001` va a
reemplazar, y exigirles el mismo suelo obligaría a testear una interfaz que
está a punto de rehacerse. Se incluyen en el suelo cuando dejen de ser eso —
seguimiento en `docs/roadmap.md`.

## Qué falta

El dominio real del comparador —ejes de puntuación, normalización,
desgloses explicables— no existe todavía: es el alcance de `product/0001`.
`ui/App.tsx` es un cableado mínimo que lista los coches del catálogo para
probar que la carga y el build funcionan; no es la interfaz del comparador.
