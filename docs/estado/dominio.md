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

**Escala absoluta** — la que fija el ADR 0004 para los ejes ya migrados. Cada
magnitud se puntúa contra dos anclajes fijos, razonados contra el mundo y no
contra el catálogo: uno de saturación (nota 10, por debajo o por encima ya no
mejora) y uno de rechazo (nota 0). No depende de qué otros coches haya en el
catálogo: un coche solo en la lista saca la misma nota que si hubiera once.
El `SubcomponentBreakdown` de un sumando migrado lleva un `AbsoluteScale`
—valor, los dos anclajes y la nota— en vez de una `Normalization`; ninguno
de los dos nombra un modelo del catálogo, porque la escala absoluta no tiene
extremos que nombrar.

Entre anclajes, la forma de la curva no es única. La mayoría (`diario`,
`coste`) sigue una curva en S (*smoothstep*, `scoreOnAbsoluteScale` en
`scale.ts`):

```text
t    = posición entre anclajes, 0 en el bueno y 1 en el malo
nota = 10 × (1 − t²(3 − 2t))
```

La pendiente es cero en los dos anclajes y máxima en el centro: afinar cerca
del extremo bueno no compra casi nada, y estar cerca del extremo malo es casi
tan malo como estarlo. `estetica` es la excepción: su escala es lineal, sin
`scoreOnAbsoluteScale` de por medio — ver su fila en la siguiente sección.
`AbsoluteScale` no distingue cuál de las dos produjo la nota; describe los
anclajes y el resultado, no la fórmula entre ambos.

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
| `coste` | `0,5×escala(precio) + 0,5×escala(uso mensual)`, escala absoluta | Cada magnitud se puntúa contra su escala absoluta antes de combinarse |
| `estetica` | `mix×nota_exterior + (1−mix)×nota_interior`, escala absoluta lineal | Cada valoración se traduce a nota antes de combinarse |
| `viaje` | `0,6×escala(maletero) + 0,4×escala(batalla)`, escala absoluta | Cada magnitud se puntúa contra su escala absoluta antes de combinarse |
| `prestaciones` | `0,5×norm(CV/t) + 0,5×norm(aceleración invertida)` | Cada sumando se normaliza por separado antes de combinarse |
| `fiabilidad` | `0,7×norm(OCU) + 0,3×norm(garantía)` | Cada sumando se normaliza por separado antes de combinarse |

`diario`, `coste`, `estetica` y `viaje` son, de los seis, los cuatro ya
migrados a escala absoluta — `product/0002`, `product/0003`, `product/0004`
y `product/0005`—. Los dos restantes siguen con normalización relativa hasta
que cada uno tenga su propia spec de migración.

`prestaciones` y `fiabilidad` normalizan cada sumando antes de combinarlo
porque así están escritas sus fórmulas vigentes (`0,x×norm(...) +
0,y×norm(...)`); `diario`, `coste`, `estetica` y `viaje`, ya migrados,
puntúan cada magnitud contra su propia escala absoluta antes de combinarla,
por el mismo motivo de fondo — un peso solo significa lo que dice si se
aplica sobre notas ya comparables.

**`viaje` ya no es una valoración subjetiva.** Antes de `product/0005` era
un 1-5 que el usuario daba sobre fotos de catálogo — el único de los seis
ejes sin fórmula—, y resultó estar midiendo lo bonito que parecía el
interior (r = 0,77 con la estética) y no el espacio (r = 0,08 con el
maletero, la única medida de espacio del catálogo). Los tres coches con la
valoración subjetiva más alta eran los tres de marca premium juzgados en
fotos, y eran justo los tres con menos maletero de los once. Hoy mide
`trunkLiters` y `wheelbaseMm` — datos del catálogo con su fuente — y la
valoración subjetiva ha desaparecido: ya no se puntúa ni se edita desde el
ranking. El campo `travelComfort` sigue declarado en `Car` y en
`cars.json`, sin ningún eje que lo lea; retirarlo del todo es una decisión
pendiente, no tomada por esta spec.

**`estetica` es el único de los tres migrados sin curva en S.** Su escala
absoluta es lineal —`nota = (valoración − 1) × 2,5`—, no *smoothstep*: la
valoración 1-5 que da el usuario ya es su juicio completo (1 = «no hay nada
que salvar», 5 = «tan guapo como hace falta»), y comprimir los extremos con
la misma curva que traduce milímetros o euros deformaría ese juicio dos
veces. `AbsoluteScale` (`breakdown.ts`) no distingue qué forma de curva
produjo la nota — describe los dos anclajes y el resultado, no la fórmula
entre ambos — así que el mismo campo `scale` sirve para los tres ejes ya
migrados sin necesitar un tipo nuevo.

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

### Los anclajes de `coste`

| Magnitud | Nota 10 hasta | Nota 0 desde |
| --- | --- | --- |
| Precio de compra | 25.000 € | 47.000 € |
| Coste de uso mensual | 100 €/mes | 250 €/mes |

El coste de uso mensual sale de sumar la energía anual (consumo × km/año ×
precio del litro o del kWh, según tecnología) y el mantenimiento anual, y
dividir entre doce; no multiplica por ningún horizonte de tenencia porque ya
es una cifra mensual. El anclaje de rechazo del precio son los 47.000 € ya
declarados como presupuesto — un techo duro, no se compra por encima —, y
25.000 € es donde el precio deja de preocupar. **El peso 50/50 no es una
preferencia, es una equivalencia:** el recorrido de la escala de precio son
22.000 € (47.000 − 25.000); el de la escala de uso, 1.800 €/año
((250 − 100) €/mes × 12). 22.000 € ÷ 1.800 €/año ≈ 12,2 años: teniendo el
coche unos doce años, las dos escalas cubren la misma cantidad de dinero, y
con recorridos equivalentes 50/50 es la única combinación coherente. Ese
horizonte de doce años es el razonamiento detrás del peso, no un valor
editable — `anios` ha dejado de existir como supuesto global.

El valor residual y «pienso venderlo» (`residualPct5y`, `pensandoVender`)
siguen declarados en el dominio y en el panel de supuestos, pero `coste` ya
no los usa: su fórmula vigente no resta residual de ninguna de las dos
escalas. Quedan inertes a propósito — retirarlos del todo es decisión de una
spec futura que analice la reventa con un horizonte explícito, no de esta.

### Los anclajes de `viaje`

| Magnitud | Nota 10 desde | Nota 0 hasta |
| --- | --- | --- |
| Maletero | 620 L | 250 L |
| Batalla | 2.850 mm | 2.400 mm |

El techo de las dos escalas es el Skoda Superb —690 L de maletero, 2.841 mm
de batalla—, la referencia generalista de «coche para viajar en familia»: a
partir de ahí el problema deja de existir y lo que hay por encima son
monovolúmenes y furgonetas, otra categoría. El suelo es un utilitario de
ciudad, donde el equipaje de cuatro personas ya no cabe. El maletero pesa
0,6 y la batalla 0,4 porque el maletero es la restricción que se
**incumple** —el equipaje cabe o no cabe, y si no cabe se deja en casa—,
mientras que el espacio de atrás es gradual y su medida es indirecta: dos
coches con la misma batalla pueden repartir distinto sitio entre habitáculo
y vanos. La batalla es una magnitud floja entre los once candidatos del
catálogo —recorre menos de su escala que el maletero—, y eso es
comportamiento correcto según el ADR 0004: un eje en el que los candidatos
apenas difieren debe influir poco, no fabricar diferencias.

## Supuestos globales

`GlobalAssumptions` (`src/domain/scoring/assumptions.ts`): `kmPorAnio`,
`precioLitro`, `precioKwh`, `mezclaEstetica`, `ponderacionAnchoDiario`,
`pensandoVender`, `cargaEnCasa`. Se editan en un único sitio (el panel de
supuestos de la interfaz); todo eje que los usa muestra el valor aplicado y
remite a ese panel, sin ofrecer edición propia.

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

Un eje de autonomía y repostaje, y un eje de conducción subjetiva tras
probar los coches, quedan fuera del dominio actual — son extensiones
futuras, registradas en `docs/roadmap.md`, no ausencias por descuido.
Corregir o completar los valores del catálogo tampoco es parte de este
dominio: las specs de eje fijan cómo se declara fuente y estimación y contra
qué se puntúa, no qué valores son correctos.
