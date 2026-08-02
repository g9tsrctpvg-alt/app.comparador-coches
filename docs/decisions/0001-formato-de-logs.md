# 0001 — Formato de logs: JSON por línea alineado a OpenTelemetry

- **Estado:** approved
- **Fecha:** 2026-08-01
- **Nivel:** 🟡

> Acotado por el **addendum de 2026-08-02**, al final de este documento.

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

1. **Un log = un objeto JSON por línea a `stdout`**, con nombres de campo
   alineados al **OpenTelemetry Logs Data Model** y sus *semantic
   conventions*. `stdout` porque los runtimes modernos capturan la salida
   estándar; no se gestionan ficheros de log.
2. **Sin SDK de OpenTelemetry mientras no exista backend al que exportar.** Se
   emite el JSON «OTel-shaped» con la librería de logging estándar del stack
   más un formateador propio.
3. **Correlación por petición:** un middleware asigna `TraceId`/`SpanId` por
   request; todos los logs de esa petición los arrastran y se propagan a las
   llamadas externas.
4. **Las reglas de cuándo loguear, niveles y redacción son guardarrail 🔴.**

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
- El valor de `service.name` queda **pendiente** hasta la decisión de stack;
  hasta entonces `docs/proceso/logging.md` lo declara como hueco.
- **Aplazado:** adopción del SDK completo de OpenTelemetry.
  **Disparador:** que exista un backend real al que exportar.
- La disciplina de redacción (allow-list de campos, nunca objetos) cubre
  runtime; el escaneo de secretos de la CI cubre el repositorio. Son problemas
  distintos y ninguno sustituye al otro.

## Addendum 2026-08-02 — alcance en una aplicación sin servidor

La decisión de stack (`0003-stack.md`) fija una SPA estática sin backend. En
un navegador no existe `stdout`, ni petición, ni middleware donde asignar
`TraceId`: los puntos 1 y 3 de la decisión no son instanciables tal cual.

Se acota, no se revoca:

- La decisión original **rige íntegra para cualquier código con runtime de
  servidor**, si algún día lo hay.
- **En navegador** se emite la misma forma de campos —`Timestamp`,
  `SeverityText`, `Body`, `Attributes`, `Resource`— a `console`, y **solo para
  errores**. Sin `TraceId`, porque no hay petición que correlacionar.
- `service.name` queda fijado a `comparador-coches-web`.

Lo que **no** cambia: las reglas de qué no se loguea siguen siendo 🔴, y el
`Body` sigue siendo estático y de baja cardinalidad. Que hoy no haya datos
personales que redactar no relaja la regla; la hace barata de cumplir.

La regla operativa vigente está en `docs/proceso/logging.md`.
