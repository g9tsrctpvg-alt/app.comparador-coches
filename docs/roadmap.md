# Roadmap y deuda

> Este documento es la **fuente de verdad del estado del proyecto**: fases,
> tareas y deudas abiertas. `CLAUDE.md` resume y no duplica: al cerrar una
> fase se actualiza este documento, no el índice.

**Última actualización:** 2026-08-01

## Fases

| Fase | Objetivo | Estado |
| --- | --- | --- |
| 0 — Base documental | Contrato instanciado, estructura de docs y specs, ADRs semilla, CI de gates documentales | Activo |
| 1 — Decisión de stack | Lenguaje, framework, gestor de dependencias, monorepo o app única; gates de código en CI | Pendiente |
| 2 — Primer dominio | Primera spec de producto aprobada, implementada, verificada y consolidada | Pendiente |
| 3 — Despliegue | Artefacto desplegable y entornos | Pendiente |

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

Es el desbloqueo con más dependencias colgando. Requiere ADR (🟡) y spec
técnica.

| Tarea | Estado |
| --- | --- |
| ADR de stack: lenguaje, framework, gestor de dependencias | Abierta |
| Decidir monorepo o app única, y en su caso `CLAUDE.md` por app | Abierta |
| Fijar `service.name` para los logs | Abierta |
| Formateador y lint de código en CI | Abierta |
| Tipado estático estricto en CI | Abierta |
| Contratos de arquitectura ejecutables en CI | Abierta |
| Ampliar Dependabot al ecosistema del stack | Abierta |
| Escribir el formateador de logs OTel-shaped (ADR 0001) | Abierta |

## Deudas abiertas

Toda deuda conocida se escribe. Una deuda no registrada no es una deuda: es
una sorpresa esperando fecha.

| Deuda | Detectada | Condición de cierre |
| --- | --- | --- |
| Suelo de cobertura sin fijar: no hay tests ni código | 2026-08-01 | Que exista el primer código; se fija por *ratcheting* al nivel que alcance la suite |
| Acciones de GitHub sin fijar por digest (`markdownlint-cli2`, `lychee`, TruffleHog usa `@main`) | 2026-08-01 | Fijar cada acción a un SHA y dejar que Dependabot las actualice |
| Seis áreas de estado sin doc (UI, contratos de API, modelo de datos, integraciones, autenticación, observabilidad) | 2026-08-01 | Que una spec las declare como *Doc de estado*; catálogo en `docs/proceso/consolidacion.md` §4 |
| `scripts/validate_docs.py` en Python con el stack sin decidir | 2026-08-01 | Que el stack elegido traiga un runtime con el que sea más natural mantenerlo |
| CI nunca ejecutada: el workflow no se ha validado contra GitHub Actions | 2026-08-01 | Primer push que dispare el workflow y termine en verde |
| Branch protection sin configurar: los checks no son obligatorios | 2026-08-01 | Configurar checks obligatorios e historia lineal en el repositorio |

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

Un disparador que se cumple y no se atiende deja de ser aplazamiento y pasa a
la tabla de deudas.
