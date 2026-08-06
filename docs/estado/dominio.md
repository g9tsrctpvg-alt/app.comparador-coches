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
de fórmula (`domain/scoring/axes/`, `normalize.ts`, `mustGet.ts`,
`scale.ts`), y solo le deja `scoreCatalog` y los tipos.

Cada `AxisBreakdown` declara: los datos de entrada usados (con fuente y si
son estimación), los supuestos globales aplicados, la descripción de la
fórmula, el valor crudo, las penalizaciones condicionales como línea propia
(condición, si está activa, efecto en puntos) y el peso y la aportación del
eje. Cada sumando se puntúa contra el conjunto de candidatos o contra una
escala absoluta, nunca las dos cosas — ver la siguiente sección.

## Dos formas de puntuar un sumando

El ADR 0004 fija el principio: una nota debe decir si un coche es bueno, no
en qué puesto va de once. El modelo tiene hoy dos mecanismos, y cuál usa cada
eje depende de si ya se ha migrado al segundo:

**Normalización relativa** (`normalizeAll`, `normalize.ts`) — la de antes del
ADR 0004, y la que siguen usando los ejes sin migrar. Siempre normaliza sobre
el conjunto completo de candidatos que recibe, nunca en abstracto:
`norm(v) = 10×(v−min)/(max−min)` si mayor es mejor, invertido si menor es
mejor, y `5` (punto neutro) si todos los candidatos empatan. Un conjunto
**vacío** no tiene extremos contra los que normalizar, así que es un error con
nombre propio —`EmptyCandidateSetError`— y no un fallo genérico a mitad de
cálculo. El `AxisBreakdown` (o el `SubcomponentBreakdown`, en ejes compuestos)
lleva su `Normalization`: dirección, y qué modelo marca el mínimo y el máximo
del conjunto recibido, con su valor.

**Escala absoluta** (`scoreOnAbsoluteScale`, `scale.ts`) — la que fija el ADR
0004 para los ejes ya migrados. Cada magnitud se puntúa contra dos anclajes
fijos, razonados contra el mundo y no contra el catálogo: uno de saturación
(nota 10, por debajo o por encima ya no mejora) y uno de rechazo (nota 0). No
depende de qué otros coches haya en el catálogo: un coche solo en la lista
saca la misma nota que si hubiera once. Entre anclajes, la nota sigue una
curva en S (*smoothstep*):

```text
t    = posición entre anclajes, 0 en el bueno y 1 en el malo
nota = 10 × (1 − t²(3 − 2t))
```

La pendiente es cero en los dos anclajes y máxima en el centro: afinar cerca
del extremo bueno no compra casi nada, y estar cerca del extremo malo es casi
tan malo como estarlo. El `SubcomponentBreakdown` de un sumando migrado lleva
un `AbsoluteScale` —valor, los dos anclajes y la nota— en vez de una
`Normalization`; ninguno de los dos nombra un modelo del catálogo, porque la
escala absoluta no tiene extremos que nombrar.

Tres de los dieciocho campos los edita el usuario desde el ranking. El
subcomponente que los representa lleva la clave `editableRating`
(`breakdown.ts`), que nombra el campo de `Car` que cambia al moverlo: es el
contrato entre dominio e interfaz, y existe para que la interfaz no tenga que
reconocer un control por el texto de su etiqueta. `applyOverride`
(`overrides.ts`) aplica esas ediciones revalidando contra
`UserRatingSchema`: la cota 1-5 es del dominio, y una valoración fuera de
rango falla en vez de entrar al cálculo.

## Los seis ejes

| Eje | Fórmula vigente | Cómo combina sus sumandos |
| --- | --- | --- |
| `diario` | `0,6×escala(anchura) + 0,4×escala(longitud)` (ponderación configurable), escala absoluta | Cada magnitud se puntúa contra su escala absoluta antes de combinarse |
| `prestaciones` | `0,5×norm(CV/t) + 0,5×norm(aceleración invertida)` | Cada sumando se normaliza por separado antes de combinarse |
| `fiabilidad` | `0,7×norm(OCU) + 0,3×norm(garantía)` | Cada sumando se normaliza por separado antes de combinarse |
| `estetica` | `mix×nota_exterior + (1−mix)×nota_interior` | Se combina en crudo; el compuesto se normaliza una sola vez |
| `coste` | `precio + (energía+mantenimiento)×años − residual` | Se combina en crudo; el compuesto se normaliza una sola vez |
| `viaje` | Sin fórmula: la valoración del usuario, normalizada tal cual | Un único sumando |

`diario` es, de los seis, el único ya migrado a escala absoluta —
`product/0002`—. Los cinco restantes siguen con normalización relativa hasta
que cada uno tenga su propia spec de migración.

`prestaciones` y `fiabilidad` normalizan cada sumando antes de combinarlo
porque así están escritas sus fórmulas vigentes (`0,x×norm(...) +
0,y×norm(...)`). `estetica` y `coste` no lo hacen: sus fórmulas vigentes
combinan las magnitudes en crudo y normalizan el compuesto una sola vez, y
esta spec las muestra —con sus sumandos en crudo como pasos intermedios—,
no las cambia. Es una asimetría real entre los cuatro ejes de fórmula
compuesta, no una inconsistencia: viene de que las fórmulas en sí ya eran
distintas antes de que existiera el desglose.

`diario` lleva una penalización condicional: `−1,5` puntos si el coche es
eléctrico y el supuesto `cargaEnCasa` está desactivado. Se aplica después de
combinar las dos escalas, y el resultado se acota de nuevo a 0-10.

### Los anclajes de `diario`

| Magnitud | Nota 10 hasta | Nota 0 desde |
| --- | --- | --- |
| Anchura | 1.765 mm | 2.000 mm |
| Longitud | 4.000 mm | 5.200 mm |

Ambas medidas son de carrocería, sin espejos. **Anchura:** 1.765 mm es la
referencia de «esto ya no es un problema» (Corsa, Polo); 2.000 mm es el techo
práctico del mercado de turismos (Clase S, X7, Q7, Range Rover caben en
56 mm). Anclar el 0 más arriba, en algo verdaderamente inmanejable, hundiría
la escala y dejaría a todos los candidatos indistinguibles cerca del 10.
**Longitud:** por debajo de 4.000 mm el coche aparca en cualquier hueco; el
0 en 5.200 mm lo pone el tamaño de una plaza de aparcamiento con margen, no
el mercado — 5.000 mm exactos resultaba severo con candidatos de 4,7 m que sí
caben en una plaza normal.

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

Un catálogo **sin ningún coche** no es un catálogo válido: `loadCatalog` lo
rechaza igual que rechaza un registro mal formado. Sin candidatos no hay
extremos contra los que normalizar, así que el fallo se declara al cargar y
no a mitad del primer ranking.

Los valores numéricos **no declaran cota** todavía: un precio o una dimensión
negativos validan sin error. Está registrado como deuda en
`docs/roadmap.md`.

## Qué queda fuera

Objetivar el eje `viaje` y añadir un eje de conducción subjetiva quedan
fuera del dominio actual — son extensiones futuras, no ausencias por
descuido. Corregir o completar los valores del catálogo tampoco es parte de
este dominio: esta spec fija cómo se declara fuente y estimación, no qué
valores son correctos.
