# 0007 — El reparto de áreas de estado de este proyecto

- **Estado:** approved
- **Fecha:** 2026-08-06
- **Nivel:** 🟡

## Contexto

`docs/proceso/consolidacion.md` §4 reparte el estado del sistema en seis
áreas, cada una con su doc responsable. Tres existen —`arquitectura.md`,
`dominio.md`, `despliegue.md`—, una se creó al llegar su primera spec
—`interfaz.md`, con `product/0001`— y **dos siguen declaradas como
«pendiente de crear»**: `datos.md` para el modelo de datos y
`observabilidad.md`. Esa pareja es una deuda registrada desde el 2026-08-01,
con condición de cierre «que una spec las declare como *Doc de estado*».

El catálogo de §4 no lo escribió nadie pensando en este proyecto: es el
reparto por defecto del modelo de trabajo que adoptó el ADR 0002. El propio
§4 ya reconoce que no encaja del todo, y declara que tres áreas —contratos de
API, integraciones externas y autenticación— **no aplican** mientras el
proyecto sea una SPA estática sin backend.

La fase 4 obliga a decidir, porque dos de sus specs preguntan lo mismo desde
dos sitios y ninguna puede aprobarse sin respuesta:

- `product/0011` añade una vista que explica el modelo de puntuación. ¿Es
  interfaz, o un artefacto con doc propio?
- `product/0012` añade un puerto de persistencia con su formato versionado.
  ¿Es interfaz y arquitectura, o es por fin el `datos.md` que falta?

Y hay un hecho que el catálogo no refleja: **el modelo de datos de este
proyecto ya está documentado**. La sección «Coche y dato con fuente» de
`docs/estado/dominio.md` describe `CarSchema`, `SourcedValue`, la regla de
que exactamente una fuente esté vigente y el comportamiento de `loadCatalog`.
El área tiene doc; lo que no tiene es el nombre de fichero que el reparto por
defecto le había asignado.

Decidirlo spec a spec garantiza respuestas distintas: es una pregunta de
reparto, y el reparto se decide una vez.

## Decisión

**El reparto de áreas de estado de este proyecto es el siguiente**, y
`consolidacion.md` §4 pasa a reflejarlo:

| Área | Doc de estado |
| --- | --- |
| Arquitectura | `docs/estado/arquitectura.md` |
| Dominio **y modelo de datos** | `docs/estado/dominio.md` |
| Infraestructura y despliegue | `docs/estado/despliegue.md` |
| Interfaz de usuario | `docs/estado/interfaz.md` |
| Observabilidad | `docs/estado/observabilidad.md` — pendiente de crear |
| Contratos de API · Integraciones externas · Autenticación | No aplican |

De donde se siguen las tres respuestas que la fase 4 necesitaba:

1. **`docs/estado/datos.md` no se crea.** El modelo de datos de este proyecto
   es el catálogo, el catálogo **es** el dominio, y su descripción ya vive en
   `dominio.md`. Un fichero aparte obligaría a partir en dos la descripción
   de `Car` —qué campos tiene aquí, qué reglas cumple allá—, que es
   precisamente la desincronización que el modelo de trabajo persigue.
2. **La configuración persistida de `product/0012` no es modelo de datos.**
   Es estado de usuario serializado: no tiene fuentes, no se audita, no entra
   en ninguna fórmula y no describe el mundo. Se consolida donde ya declara
   —`interfaz.md` el comportamiento, `arquitectura.md` el puerto—.
3. **La vista de explicación de `product/0011` es interfaz.** Es una
   superficie de la aplicación, y lo que presenta —el modelo de puntuación—
   ya tiene autoridad en `dominio.md`. Se consolida en `interfaz.md`.

**Un doc de estado responde a un área, no a un artefacto.** Es la regla que
gobierna los casos futuros: la pregunta ante una spec que no encaja no es
«¿merece esto un doc?», sino «¿de qué área es esto, y quién manda sobre esa
área?». Solo cuando la respuesta sea «de ninguna» falta un doc de estado.

## Alternativas consideradas

- **Crear `datos.md` ahora, con la configuración persistida dentro.** Cierra
  la deuda por la vía rápida. **Se descarta porque el nombre mentiría**: el
  doc se llamaría «modelo de datos» y contendría el formato de
  `localStorage`, mientras el modelo de datos de verdad —el catálogo— seguiría
  en `dominio.md`. Un doc cuyo título no describe su contenido es peor que la
  ausencia del doc, porque quien lo busque lo encontrará y se irá con la
  respuesta equivocada.
- **Crear `datos.md` y mover a él la descripción del catálogo.** Es la versión
  honesta de la anterior y **se descarta por dos motivos**. Uno: separa la
  forma del dato de las reglas que lo gobiernan, cuando aquí son lo mismo —el
  régimen de fuentes no es serialización, es la invariante de dominio que hace
  auditable una puntuación—. Dos: sería una refactorización documental
  arrastrada dentro de una spec que va de persistir preferencias, exactamente
  el tipo de cambio de contrabando que el proceso existe para evitar.
- **Dar doc de estado propio a la vista de explicación.** Tentador porque el
  contenido explicativo tiene vida propia. **Se descarta**: sería un doc para
  un componente, no para un área, y ese camino lleva a un doc de estado por
  pantalla. La coherencia del reparto se pierde en cuanto se admite la primera
  excepción.
- **Dejar el catálogo por defecto como está y decidir spec a spec.** Es lo que
  hay hoy. **Se descarta** porque produce respuestas distintas a la misma
  pregunta según quién la conteste y cuándo, y porque mantiene en §4 la
  promesa de un fichero que no se va a escribir. Una deuda que no se va a
  pagar no es deuda: es ruido en la tabla.
- **Declarar también que la observabilidad no aplica.** Sería coherente con lo
  que hay hoy —no hay backend al que exportar y el ADR 0001 acota los logs a
  la consola del navegador—. **Se descarta**: sí hay observabilidad, hay un
  formato de log decidido y un `service.name` fijado, y lo que falta es
  escribirla, no que no exista. Se queda pendiente de crear, con su
  disparador.

## Consecuencias

**Se gana:**

- Las decisiones abiertas de `product/0011` y `product/0012` quedan cerradas,
  y con la misma respuesta, que era el objetivo.
- **La mitad de la deuda de «dos áreas de estado sin doc» se cierra**: el
  modelo de datos tiene doc responsable y siempre lo tuvo. Queda solo
  observabilidad.
- Las specs futuras tienen una regla que aplicar —área, no artefacto— en vez
  de un juicio que repetir.

**Se pierde:**

- `dominio.md` carga con dos áreas y crecerá más que los demás docs de
  estado. Es el coste aceptado, y tiene disparador para revertirse.
- El reparto de este proyecto se separa del catálogo por defecto del modelo de
  trabajo. Quien venga de otro proyecto con el mismo modelo encontrará una
  tabla distinta; por eso la tabla vive aquí y `consolidacion.md` §4 apunta a
  este ADR en vez de repetirla.

**Queda aplazado:**

| Aplazado | Disparador |
| --- | --- |
| Partir `docs/estado/dominio.md` en dominio y modelo de datos | Que el doc deje de poder leerse de una sentada, o que aparezca un modelo de datos que no sea el catálogo —una API, una base de datos, un formato de intercambio— |
| Crear `docs/estado/observabilidad.md` | Que una spec lo declare como *Doc de estado*. Hoy lo que hay de observabilidad —formato de log, `service.name`— vive en el ADR 0001 y en `docs/proceso/logging.md` |
| Reabrir las tres áreas declaradas «no aplican» | Que aparezca un backend, un tercero o una identidad. Cada una vendría con su spec y su doc |

## Historial

- **2026-08-06 — Creación.** Se registra al toparse la fase 4 con la misma
  pregunta en `product/0011` y `product/0012`: si esta fase introduce un doc
  de estado nuevo. Se decide el reparto entero de una vez, en lugar de
  contestar dos veces por separado, y se cierra con ello la mitad de una deuda
  abierta desde el 2026-08-01.
