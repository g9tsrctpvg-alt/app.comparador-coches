# Estado: dominio

> Este documento es la **autoridad sobre qué modela el negocio hoy**:
> conceptos, invariantes, reglas y vocabulario. Si hay duda sobre cómo se
> llama algo o qué reglas cumple, gana lo que diga este documento, no el
> nombre que aparezca en el código.

**Estado:** Activo.

## Coche y dato con fuente

Un `Car` (`src/domain/car.ts`) tiene identidad (`id`, `name`, `brand`,
`technology`) y dieciocho magnitudes, cada una en uno de dos formatos:

- **`SourcedValue<T>`** — `{ value, unit?, sources }`. Es el formato de todo
  dato que viene de fuera: dimensiones, potencia, consumo, precio,
  fiabilidad OCU, garantía, valor residual, mantenimiento, aceleración. Cada
  fuente (`SourceEntry`) lleva `label`, `value`, `estimated` y `current`;
  **exactamente una** fuente por dato está marcada `current`, y su valor es
  el que entra en el cálculo — lo impone Zod (`superRefine` en
  `sourcedValueSchema`), no una convención. Una fuente descartada conserva
  su valor y exige `discardedReason` en cuanto hay más de una fuente: el
  caso que motivó la regla es el maletero, con cifra de catálogo medida
  hasta el techo frente a medición VDA independiente.
- **`UserRating`** — `{ value, unit? }`, sin `sources`. Es el formato de un
  juicio propio del usuario, no un dato con procedencia externa:
  `aestheticsExterior`, `aestheticsInterior` y `travelComfort`. Se edita
  desde el propio ranking y no lleva ni estimación ni fuente que declarar.

Un dato sin exactamente una fuente vigente no es un dato con la fuente
vacía: es un error de carga del catálogo, y `loadCatalog` lo rechaza
nombrando el campo y el registro.

## Puntuación explicable

El núcleo de puntuación (`src/domain/scoring/`) no expone una función que
devuelva solo un número. `scoreCatalog(cars, weights, assumptions,
budgetEur)` devuelve, por coche, un `CarScoreBreakdown`: sus seis
`AxisBreakdown` —uno por eje— y el `total`, que es la suma literal de sus
`contribution` (peso × puntuación 0-10 de cada eje). La interfaz solo
renderiza esta estructura; no recalcula nada, y no puede: `ui-no-scoring-internals`
(`.dependency-cruiser.mjs`) impide que `src/ui/` importe las piezas internas
de fórmula (`domain/scoring/axes/`, `normalize.ts`, `mustGet.ts`), y solo le
deja `scoreCatalog` y los tipos.

Cada `AxisBreakdown` declara: los datos de entrada usados (con fuente y si
son estimación), los supuestos globales aplicados, la descripción de la
fórmula, el valor crudo, la normalización —dirección, y qué modelo marca el
mínimo y el máximo del conjunto de candidatos recibido, con su valor—, las
penalizaciones condicionales como línea propia (condición, si está activa,
efecto en puntos) y el peso y la aportación del eje.

`normalizeAll` (`normalize.ts`) siempre normaliza sobre el conjunto completo
de candidatos que recibe, nunca en abstracto: `norm(v) = 10×(v−min)/(max−min)`
si mayor es mejor, invertido si menor es mejor, y `5` (punto neutro) si todos
los candidatos empatan.

## Los seis ejes

| Eje | Fórmula vigente | Cómo combina sus sumandos |
| --- | --- | --- |
| `diario` | `0,6×anchura + 0,4×longitud` (ponderación configurable), normalizada invertida | Una sola normalización sobre la dificultad compuesta |
| `prestaciones` | `0,5×norm(CV/t) + 0,5×norm(aceleración invertida)` | Cada sumando se normaliza por separado antes de combinarse |
| `fiabilidad` | `0,7×norm(OCU) + 0,3×norm(garantía)` | Cada sumando se normaliza por separado antes de combinarse |
| `estetica` | `mix×nota_exterior + (1−mix)×nota_interior` | Se combina en crudo; el compuesto se normaliza una sola vez |
| `coste` | `precio + (energía+mantenimiento)×años − residual` | Se combina en crudo; el compuesto se normaliza una sola vez |
| `viaje` | Sin fórmula: la valoración del usuario, normalizada tal cual | Un único sumando |

`prestaciones` y `fiabilidad` normalizan cada sumando antes de combinarlo
porque así están escritas sus fórmulas vigentes (`0,x×norm(...) +
0,y×norm(...)`). `estetica` y `coste` no lo hacen: sus fórmulas vigentes
combinan las magnitudes en crudo y normalizan el compuesto una sola vez, y
esta spec las muestra —con sus sumandos en crudo como pasos intermedios—,
no las cambia. Es una asimetría real entre los cuatro ejes de fórmula
compuesta, no una inconsistencia: viene de que las fórmulas en sí ya eran
distintas antes de que existiera el desglose.

`diario` lleva una penalización condicional: `−1,5` puntos si el coche es
eléctrico y el supuesto `cargaEnCasa` está desactivado.

## Supuestos globales

`GlobalAssumptions` (`src/domain/scoring/assumptions.ts`): `kmPorAnio`,
`anios`, `precioLitro`, `precioKwh`, `mezclaEstetica`,
`ponderacionAnchoDiario`, `pensandoVender`, `cargaEnCasa`. Se editan en un
único sitio (el panel de supuestos de la interfaz); todo eje que los usa
muestra el valor aplicado y remite a ese panel, sin ofrecer edición propia.

## Pesos

`AxisWeights` (`src/domain/scoring/weights.ts`), uno por eje, 0-10. Por
defecto: viaje 4, diario 3, fiabilidad 2, estética 2, prestaciones 1,
coste 1 — reflejan una prioridad personal, no una fórmula del negocio.

## El catálogo

`src/data/cars.json`: once candidatos reales, cada campo con su estructura
de fuentes. La fila de referencia del Alfa Romeo Giulietta que aparece en la
especificación original del proyecto **no está en el catálogo**: es dato de
referencia, no un candidato a comparar, y ninguna spec la ha pedido todavía.

## Qué queda fuera

Objetivar el eje `viaje` y añadir un eje de conducción subjetiva quedan
fuera del dominio actual — son extensiones futuras, no ausencias por
descuido. Corregir o completar los valores del catálogo tampoco es parte de
este dominio: esta spec fija cómo se declara fuente y estimación, no qué
valores son correctos.
