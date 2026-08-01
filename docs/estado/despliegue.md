# Estado: infraestructura y despliegue

> Este documento es la **autoridad sobre cómo se construye, se configura y se
> despliega el sistema hoy**: entornos, variables, artefactos y pipeline. Si
> hay duda sobre cómo llega el código a un entorno, gana lo que diga este
> documento.

**Estado:** Pendiente — no hay despliegue.

## Situación actual

No existe artefacto desplegable, ni entornos, ni pipeline de despliegue. Lo
único que corre automáticamente es la CI de gates documentales descrita en
`docs/proceso/ci-y-guardarrailes.md`.

En consecuencia, **no hay secretos ni credenciales gestionados en este
repositorio**. Cualquier necesidad futura de credenciales o proveedores
externos es 🔴: se pregunta antes, siempre.

## Qué lo desbloquea

La decisión de stack y la primera spec técnica de empaquetado y despliegue. Al
consolidarse, este documento pasa a describir en presente:

- Entornos existentes y qué distingue a cada uno.
- Artefacto que se construye y cómo se versiona.
- Variables de configuración y de dónde salen (nunca del repositorio).
- Pipeline de despliegue y sus gates.
- Valores de `service.version` y `deployment.environment` que consumen los
  logs (ver `docs/proceso/logging.md`).

Seguimiento en `docs/roadmap.md`.

## Aplazamientos vigentes

Los gates de CD —smoke tests, canary— están **aplazados con disparador
explícito**: se activan cuando exista despliegue real. El registro completo de
aplazamientos está en `docs/proceso/ci-y-guardarrailes.md`, §7.
