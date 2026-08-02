# Roadmap y deuda

> Este documento es la **fuente de verdad del estado del proyecto**: fases,
> tareas y deudas abiertas. `CLAUDE.md` resume y no duplica: al cerrar una
> fase se actualiza este documento, no el índice.

**Última actualización:** 2026-08-02

## Fases

| Fase | Objetivo | Estado |
| --- | --- | --- |
| 0 — Base documental | Contrato instanciado, estructura de docs y specs, ADRs semilla, CI de gates documentales | Activo |
| 1 — Decisión de stack | Lenguaje, framework, gestor de dependencias, despliegue; gates de código en CI | Activo |
| 2 — Andamiaje y dominio | Proyecto construible y explicabilidad de la puntuación | Base |
| 3 — Migración del artefacto | Traer el comparador React existente y su diseño responsive | Pendiente |

Ninguna fase se da por cerrada mientras tenga tareas abiertas en la tabla de
abajo.

## Fase 0 — Base documental

| Tarea | Estado |
| --- | --- |
| Instanciar el contrato como índice + satélites | Hecha |
| Docs de estado de arquitectura, dominio y despliegue | Hecha (como `Pendiente`) |
| Plantillas de spec y de ADR | Hecha |
| ADR 0001 (formato de logs) y ADR 0002 (modelo de trabajo) | Hecha |
| CI de gates documentales | Hecha |
| Configurar branch protection en el repositorio | Abierta |

`Hecha (como Pendiente)` significa que el artefacto existe y declara su hueco;
no que el área esté documentada.

## Fase 1 — Decisión de stack

| Tarea | Estado |
| --- | --- |
| ADR 0003: Vite · React · TypeScript · npm · GitHub Pages | Hecha |
| Addendum al ADR 0001: alcance de los logs sin servidor | Hecha |
| Fijar `service.name` (`comparador-coches-web`) | Hecha |
| Aplicación única, no monorepo | Hecha |
| Instalar los gates de código en CI | Abierta — `technical/0001` |
| Ampliar Dependabot al ecosistema `npm` | Abierta — `technical/0001` |
| Habilitar GitHub Pages en el repositorio | Abierta |
| Decidir si `validate_docs.py` se porta a TypeScript | Abierta |

## Fase 2 — Andamiaje y dominio

| Tarea | Estado |
| --- | --- |
| `technical/0001` — andamiaje del proyecto y gates de código | `draft` |
| `product/0001` — explicabilidad de la puntuación y fuentes | `draft` |
| Resolver las decisiones abiertas de `product/0001` | Abierta |
| Gate humano: aprobar ambas specs | **Esperando a una persona** |
| Definir la forma de `cars.json` antes de escribirlo | Abierta — `product/0001` |

Ninguna de las dos specs puede implementarse mientras siga en `draft`.
`product/0001` además no puede aprobarse con decisiones abiertas.

## Fase 3 — Migración del artefacto

Depende de la fase 2. Tareas conocidas, aún sin spec:

- Traer el artefacto React de un solo fichero al proyecto, extrayendo las
  fórmulas a `src/domain/`.
- Diseño responsive real: hoy está pensado para 560 px de ancho máximo.
- Persistencia en `localStorage` y configuración compartida por URL.
- Objetivar el eje de viaje, hoy el único que sigue siendo un juicio.
- Eje subjetivo de conducción, tras probar los coches.

## Deudas abiertas

Toda deuda conocida se escribe. Una deuda no registrada no es una deuda: es
una sorpresa esperando fecha.

| Deuda | Detectada | Condición de cierre |
| --- | --- | --- |
| Suelo de cobertura sin fijar: no hay tests ni código | 2026-08-01 | Que exista el primer código; se fija por *ratcheting* al nivel que alcance la suite |
| Acciones de GitHub sin fijar por digest (`markdownlint-cli2`, `lychee`, TruffleHog usa `@main`) | 2026-08-01 | Fijar cada acción a un SHA y dejar que Dependabot las actualice |
| Tres áreas de estado sin doc (interfaz, modelo de datos, observabilidad) | 2026-08-01 | Que una spec las declare como *Doc de estado*; catálogo en `docs/proceso/consolidacion.md` §4 |
| CI nunca ejecutada: el workflow no se ha validado contra GitHub Actions | 2026-08-01 | Primer push que dispare el workflow y termine en verde |
| Branch protection sin configurar: los checks no son obligatorios | 2026-08-01 | Configurar checks obligatorios e historia lineal en el repositorio |
| **Disparador cumplido:** `validate_docs.py` sigue en Python con el stack ya decidido en TypeScript. La CI arranca dos runtimes | 2026-08-02 | Portarlo a TypeScript y ejecutarlo con Vitest, o registrar por qué se mantiene en Python |
| Datos del catálogo con estimaciones sin marcar y precios de julio de 2026 | 2026-08-02 | `product/0001` obliga a declarar fuente y estimación por dato; los precios se reconfirman aparte |

## Aplazamientos con disparador

No son deuda: son decisiones conscientes de no hacer algo todavía. El registro
completo está en `docs/proceso/ci-y-guardarrailes.md`, §7, y en las
*Consecuencias* de cada ADR. Se listan aquí solo para no tener que buscarlos:

| Aplazado | Disparador |
| --- | --- |
| SDK completo de OpenTelemetry | Que exista un backend real al que exportar |
| Contract testing y *breaking changes* | Que exista un consumidor externo del contrato |
| Gates de CD (smoke tests, canary) | Que exista despliegue real |
| Suite E2E | Que la cobertura unitaria deje de detectar las regresiones que importan |
| Cobertura por *diff* | Que el suelo global deje de ser suficiente |
| Hooks de pre-commit locales | Que el ciclo de espera de CI moleste de verdad |
| Persistencia en servidor | Que haga falta compartir estado entre dispositivos sin pasar por la URL |
| *Pre-rendering* y posicionamiento | Que el comparador deje de ser de uso personal |
| Cloudflare Pages en vez de GitHub Pages | Necesitar dominio propio, cabeceras a medida o redirecciones |

Un disparador que se cumple y no se atiende deja de ser aplazamiento y pasa a
la tabla de deudas.
