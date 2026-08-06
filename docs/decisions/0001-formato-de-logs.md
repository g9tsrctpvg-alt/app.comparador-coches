# 0001 — Formato de logs: JSON por línea alineado a OpenTelemetry

- **Estado:** approved
- **Fecha:** 2026-08-01
- **Nivel:** 🟡

## Contexto

El proyecto arranca sin código y sin backend de observabilidad. La decisión de
qué es un log tiene que tomarse **antes** de que exista la primera línea que
loguea: cambiar el formato después obliga a reescribir todos los puntos de
emisión y a mantener dos formatos conviviendo mientras dura la migración.

Al mismo tiempo, no hay ningún *collector* al que exportar ni presupuesto de
complejidad para montarlo. La decisión debe servir hoy sin backend y no
estorbar el día que lo haya.

Esta decisión llega **heredada del modelo de trabajo** que instancia el
proyecto: forma parte del contrato, no del detalle de implementación.

## Decisión

1. **Un log lleva nombres de campo alineados al OpenTelemetry Logs Data
   Model** y sus *semantic conventions*: `Timestamp`, `SeverityText`, `Body`,
   `Attributes`, `Resource`. Dónde se emite depende del runtime:
   - **Con runtime de servidor:** un objeto JSON por línea a `stdout`, porque
     los runtimes modernos capturan la salida estándar. No se gestionan
     ficheros de log.
   - **En navegador:** la misma forma de campos a `console`, y **solo para
     errores**. No hay `stdout` que usar ni volumen que justifique más.
2. **Sin SDK de OpenTelemetry mientras no exista backend al que exportar.** Se
   emite el JSON «OTel-shaped» con la librería de logging estándar del stack
   más un formateador propio.
3. **Correlación por petición, donde hay peticiones:** con runtime de
   servidor, un middleware asigna `TraceId`/`SpanId` por request; todos los
   logs de esa petición los arrastran y se propagan a las llamadas externas.
   **En navegador no aplica**: no hay petición que correlacionar, así que no
   se emite `TraceId`.
4. **Las reglas de cuándo loguear, niveles y redacción son guardarrail 🔴.**

`service.name` es `comparador-coches-web`.

La regla operativa completa —campos mínimos, niveles, cuándo sí, cuándo no,
anti-patrones y redacción— vive en `docs/proceso/logging.md`. Este ADR
registra la razón; ese documento manda sobre la práctica.

## Alternativas consideradas

- **Texto plano.** Barato de emitir y cómodo de leer en local, pero no
  explotable: no se filtra por campo, no se agrupa y no se correlaciona.
  Descartada porque el coste de no poder explotar los logs aparece justo
  cuando más falta hacen, en un incidente.
- **JSON con esquema propio no estándar.** Explotable desde el primer día,
  pero genera *lock-in* con el propio esquema y exige reescribir los puntos de
  emisión para exportar a cualquier herramienta estándar. Descartada porque
  alinear los nombres de campo con OTel **cuesta cero** y elimina esa deuda
  antes de contraerla.
- **SDK completo de OpenTelemetry desde el día uno.** Es el destino final,
  pero hoy añade dependencias, configuración y peso de arranque para exportar
  a un backend que no existe. Descartada por sobre-ingeniería, no por
  desacuerdo: se aplaza con disparador.

## Consecuencias

- Los logs son exportables a un *collector* **sin reescribirlos** el día que
  haga falta.
- Se asume escribir y mantener un formateador propio en el stack que se
  elija, en lugar de usar una librería de terceros. Es la contrapartida
  aceptada de no añadir dependencias.
- **Aplazado:** adopción del SDK completo de OpenTelemetry.
  **Disparador:** que exista un backend real al que exportar.
- La disciplina de redacción (allow-list de campos, nunca objetos) cubre
  runtime; el escaneo de secretos de la CI cubre el repositorio. Son problemas
  distintos y ninguno sustituye al otro.
- Que hoy la aplicación sea una SPA sin servidor **no relaja las reglas de qué
  no se loguea**: siguen siendo 🔴 y el `Body` sigue siendo estático y de baja
  cardinalidad. Que no haya datos personales que redactar hace la regla barata
  de cumplir, no prescindible.

## Historial

- **2026-08-01** — ADR creado, con el formato pensado para un runtime de
  servidor: JSON a `stdout` y `TraceId` por petición asignado en middleware.
- **2026-08-02** — Acotado tras el ADR 0003, que fija una SPA estática sin
  backend: en un navegador no existe `stdout`, ni petición, ni middleware, así
  que los puntos 1 y 3 no eran instanciables tal cual. La decisión pasa a
  declarar el comportamiento en los dos runtimes en vez de suponer servidor, y
  `service.name` queda fijado a `comparador-coches-web`, que estaba pendiente
  de la decisión de stack. No se revoca nada: la forma de los campos y las
  reglas de redacción son las mismas.
