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
  `aestheticsExterior` y `aestheticsInterior`, los dos únicos. Se edita
  desde el propio ranking y no lleva ni estimación ni fuente que declarar.
  Solo la estética se juzga así, porque el gusto no tiene referente externo
  contra el que anclar; todo lo demás que el modelo puntúa es una
  afirmación sobre el mundo y se mide.

Un dato sin exactamente una fuente vigente no es un dato con la fuente
vacía: es un error de carga del catálogo, y `loadCatalog` lo rechaza
nombrando el campo y el registro.

## Puntuación explicable

El núcleo de puntuación (`src/domain/scoring/`) no expone una función que
devuelva solo un número. `scoreCatalog(cars, weights, assumptions,
budgetEur)` devuelve, por coche, un `CarScoreBreakdown`: sus seis
`AxisBreakdown` —uno por eje—, el `total`, que es la suma literal de sus
`contribution` (peso × puntuación 0-10 de cada eje), y `percentage`, que es
`total` expresado sobre el máximo posible con los pesos vigentes —`10 × Σ
pesos`—, en vez de una suma cuyo techo depende de qué pesos se hayan
elegido. `percentageOf` (`src/domain/scoring/score.ts`) es 0, no `NaN`,
cuando la suma de pesos es 0. Es el campo que la fila del ranking muestra en
vez del `total` (`docs/estado/interfaz.md`): la interfaz solo renderiza esta
estructura; no recalcula nada, y no puede: `ui-no-scoring-internals`
(`.dependency-cruiser.mjs`) impide que `src/ui/` importe las piezas internas
de fórmula (`domain/scoring/axes/`, `normalize.ts`, `mustGet.ts`,
`scale.ts`), y solo le deja `scoreCatalog` y los tipos.

Cada `AxisBreakdown` declara: los datos de entrada usados (con fuente y si
son estimación), los supuestos globales aplicados, la descripción de la
fórmula, el valor crudo, las penalizaciones condicionales como línea propia
(condición, si está activa, efecto en puntos) y el peso y la aportación del
eje. Cada sumando se puntúa contra el conjunto de candidatos o contra una
escala absoluta, nunca las dos cosas — ver la siguiente sección. Un campo
opcional más, `info`, muestra dato del propio coche que no entra en ninguna
nota. Lo usan `fiabilidad`, para la extensión de garantía condicionada;
`coste`, para declarar qué precio unitario de la energía se ha aplicado y
que es la tecnología del coche quien lo decide (product/0008); y `diario`,
para declarar que la penalización por carga en casa solo puede aplicar a un
vehículo eléctrico, esté activa o no. Es distinto de `assumptionsUsed`: no
es un supuesto global,
es información del coche.

## Cómo se puntúa un sumando

El ADR 0004 fija el principio: una nota debe decir si un coche es bueno, no
en qué puesto va de once. **Los seis ejes puntúan hoy contra escalas
absolutas** — cada magnitud se puntúa contra dos anclajes fijos, razonados
contra el mundo y no contra el catálogo: uno de saturación (nota 10, por
debajo o por encima ya no mejora) y uno de rechazo (nota 0). Ninguna nota
depende de qué otros coches haya en el catálogo: un coche solo en la lista
saca la misma nota que si hubiera once. El `SubcomponentBreakdown` de un
sumando lleva un `AbsoluteScale` —valor, los dos anclajes y la nota—; no
nombra ningún modelo del catálogo, porque la escala absoluta no tiene
extremos que nombrar.

Entre anclajes, la forma de la curva no es única. Cinco ejes (`diario`,
`coste`, `viaje`, `prestaciones`, `fiabilidad`) siguen una curva en S
(*smoothstep*, `scoreOnAbsoluteScale` en `scale.ts`):

```text
t    = posición entre anclajes, 0 en el bueno y 1 en el malo
nota = 10 × (1 − t²(3 − 2t))
```

La pendiente es cero en los dos anclajes y máxima en el centro: afinar cerca
del extremo bueno no compra casi nada, y estar cerca del extremo malo es casi
tan malo como estarlo. `estetica` es la excepción: su escala es lineal, sin
`scoreOnAbsoluteScale` de por medio — el 1-5 que da el usuario ya es su
juicio completo, y comprimir los extremos otra vez lo deformaría dos veces.
`AbsoluteScale` no distingue cuál de las dos produjo la nota; describe los
anclajes y el resultado, no la fórmula entre ambos.

**La normalización relativa (`normalizeAll`, `normalize.ts`) ya no la llama
ningún eje.** Fue el mecanismo de antes del ADR 0004 —
`norm(v) = 10×(v−min)/(max−min)` si mayor es mejor, invertido si menor es
mejor, `5` si todos empatan, siempre sobre el conjunto de candidatos
recibido— y los seis ejes lo usaron hasta migrar, entre `product/0002` y
`product/0007`. La función y el tipo `Normalization` siguen en el árbol,
sin más llamador que su propio test: retirarlos o dejarlos para un eje
futuro que vuelva a necesitar normalización relativa es una decisión
pendiente, registrada en `docs/roadmap.md`.

Un conjunto de candidatos **vacío** no tiene sentido que se puntúe: antes lo
impedía `normalizeAll` por su cuenta, dentro de cada eje; hoy que ningún eje
depende del conjunto para nada, la comprobación vive en la entrada única,
`scoreCatalog` (`score.ts`), con el mismo error con nombre propio —
`EmptyCandidateSetError`— en vez de un fallo genérico a mitad de cálculo.

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
| `viaje` | `0,5×escala(maletero) + 0,25×escala(batalla) + 0,25×escala(anchura de hombros)`, escala absoluta | Cada magnitud se puntúa contra su escala absoluta antes de combinarse |
| `prestaciones` | `0,5×escala(CV/t) + 0,5×escala(aceleración invertida)`, escala absoluta | Cada magnitud se puntúa contra su escala absoluta antes de combinarse |
| `fiabilidad` | `0,7×escala(OCU) + 0,3×escala(garantía incondicional)`, escala absoluta | Cada magnitud se puntúa contra su escala absoluta antes de combinarse |

**Los seis ejes están migrados a escala absoluta** — `product/0002` a
`product/0007`, entre el 2026-08-04 y el 2026-08-06 —. Ninguno normaliza ya
contra el conjunto de candidatos: un peso solo significa lo que dice si se
aplica sobre notas ya comparables, y eso rige ahora en los seis por igual.

`prestaciones` y `fiabilidad` llegaban a este cambio ya sanos
estructuralmente —normalizaban cada sumando por separado desde
`product/0001`, con sus fórmulas ya escritas como `0,x×norm(...) +
0,y×norm(...)`—, así que migrarlos fue sustituir `normalizeAll` por
`scoreOnAbsoluteScale` en cada sumando sin tocar el reparto declarado, que
ya regía sobre notas comparables.

**`viaje` ya no es una valoración subjetiva.** Antes de `product/0005` era
un 1-5 que el usuario daba sobre fotos de catálogo — el único de los seis
ejes sin fórmula—, y resultó estar midiendo lo bonito que parecía el
interior (r = 0,77 con la estética) y no el espacio (r = 0,08 con el
maletero, la única medida de espacio del catálogo). Los tres coches con la
valoración subjetiva más alta eran los tres de marca premium juzgados en
fotos, y eran justo los tres con menos maletero de los once. Hoy mide
`trunkLiters`, `wheelbaseMm` y `rearShoulderWidthMm` — datos del catálogo
con su fuente — y la valoración subjetiva ha desaparecido por completo: no
se puntúa, no se edita desde el ranking y el campo `travelComfort` ya no
existe ni en `Car` ni en `cars.json`. El confort de viaje es un dato
calculado, no una nota que nadie dé.

**`estetica` es el único de los seis sin curva en S.** Su escala
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
| Anchura de hombros (2ª fila) | 1.390 mm | 1.310 mm |

El techo de las tres escalas es el Skoda Superb —690 L de maletero, 2.841 mm
de batalla, 1.390 mm de anchura de hombros—, la referencia generalista de
«coche para viajar en familia»: a partir de ahí el problema deja de existir
y lo que hay por encima son monovolúmenes y furgonetas, otra categoría. El
suelo es un utilitario de ciudad, donde el equipaje de cuatro personas ya no
cabe y tres atrás van agolpados: Dacia Sandero y Alfa Romeo Giulietta miden
ambos 1.310 mm de hombros, y el Sandero da los 328 L que fijan el suelo de
maletero.

**El maletero pesa 0,5 y las otras dos 0,25 cada una** porque el maletero es
la restricción que se **incumple** —el equipaje cabe o no cabe, y si no cabe
se deja en casa—, mientras que el espacio de atrás es gradual. Batalla y
anchura de hombros miden ese mismo espacio en dos direcciones, a lo largo y
a lo ancho, y pesan igual entre sí porque ninguna es mejor proxy que la
otra: la batalla reparte entre habitáculo y vanos, así que dos coches con la
misma batalla pueden dar distinto sitio a las piernas; la anchura de hombros
se mide dentro del habitáculo pero solo a una altura.

Las dos magnitudes de espacio trasero son **flojas entre los candidatos del
catálogo** —recorren menos de su escala que el maletero—, y eso es
comportamiento correcto según el ADR 0004: un eje en el que los candidatos
apenas difieren debe influir poco, no fabricar diferencias. En anchura de
hombros varios candidatos saturan el 10, y alguno supera al propio Superb:
también es correcto. El anclaje bueno significa «a partir de aquí deja de
mejorar», no «lo mejor que existe», y en una berlina grande o un SUV medio
caber tres atrás dejó de ser el problema mucho antes de llegar al coche más
ancho del mercado.

**La anchura de hombros se publica en centímetros enteros** (km77, ficha de
mediciones propias, fila «Anchura» de la segunda fila). Se guarda en
milímetros por coherencia con el resto de medidas, pero su resolución real
es de 10 mm y no debe leerse como precisión milimétrica.

### Los anclajes de `prestaciones`

| Magnitud | Nota 10 desde | Nota 0 hasta |
| --- | --- | --- |
| CV por tonelada | 145 | 75 |
| Aceleración 0-100 | 6,5 s | 13,0 s |

Los ceros están anclados en coches reales que van justos, no en un supuesto:
el Fiat Panda 1.0 Hybrid GSE (71,4 CV/t) y el Dacia Sandero TCe 90 (13,4 s)
son el suelo práctico del mercado — coches que funcionan, pero en los que
incorporarse a una autovía cargado es un cálculo. Los dieces están donde el
empuje deja de ser un tema: el Alfa Romeo Giulietta 1.4 MultiAir 170 CV
(125,5 CV/t, 7,7 s) es la referencia de primera mano de «esto ya no se puede
pedir», y el 10 se pone con margen por encima de él, en territorio de Golf
GTI — 145 CV/t y 6,5 s —, para que un 10 signifique «esto ya no se puede
pedir» y no «lo que ya tengo». El peso no entra dos veces: ya paga en
`diario` por tamaño y en `coste` por consumo; aquí solo divide a los CV, que
es justo lo que el eje mide.

### Los anclajes de `fiabilidad`

| Magnitud | Nota 10 desde | Nota 0 hasta |
| --- | --- | --- |
| Índice de fiabilidad OCU | 93 | 64 |
| Años de garantía incondicional | 7 | 0 |

**El índice OCU no necesita anclajes inventados: son los extremos que la
propia OCU publica** sobre 39 marcas — Lexus con 93, Land Rover con 64—, así
que la escala es el mercado tal como se publica y no hay que justificar
ningún recorte. Consecuencia asumida y no un fallo: nueve de los once
candidatos del catálogo salen de marcas que caen en el tercio alto de esas
39, así que el eje deja de separarlos — la escala relativa fabricaba un
ranking donde solo había un empate.

**La garantía puntúa solo los años incondicionales.** El 10 va en 7 años
—Kia, MG, Omoda, Jaecoo—, el techo real del mercado sin condiciones. El 0 va
en 0 años y no en los 3 del mínimo legal español: quedarse en el mínimo es
una estrategia comercial, no una señal de que el coche se rompe, y anclar
ahí habría convertido esa elección en un cero absoluto. Una extensión sujeta
a mantenimiento en red oficial —campo `warrantyExtension` en `Car`— no suma
a esta magnitud: es un compromiso del comprador, renovado servicio a
servicio, no uno del fabricante. El desglose la muestra igual, como
información que no entra en la nota (`AxisBreakdown.info`), con sus años, su
límite de kilómetros si lo declara y su condición.

**El índice OCU es por marca, no por modelo — 39 marcas sobre 392 modelos
analizados — y ese es el límite real del eje.** Ninguna escala lo arregla:
mientras no exista un índice por modelo publicado, `fiabilidad` puntúa la
marca y lo presenta como fiabilidad del coche. El desglose lo declara en su
propia descripción de fórmula, no solo aquí.

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
de fuentes.

Un catálogo **sin ningún coche** no es un catálogo válido: `loadCatalog` lo
rechaza igual que rechaza un registro mal formado, así que el fallo se
declara al cargar y no a mitad del primer ranking. `scoreCatalog` lleva
además su propia comprobación — con los seis ejes en escala absoluta, nada
dentro de ellos falla por su cuenta si de todos modos se le pasara un
catálogo vacío.

Los valores numéricos **no declaran cota** todavía: un precio o una dimensión
negativos validan sin error. Está registrado como deuda en
`docs/roadmap.md`.

## Referencias

`src/data/references.json` (`Reference`, `src/domain/reference.ts`,
`loadReferences.ts`): coches que **no son candidatos** — no se puntúan, no
entran en el ranking—, sino puntos de comparación para la ficha
(`product/0013`, requisitos 3 y 4). Comparten con `Car` la forma de un dato
con fuente (`SourcedNumber`), pero no su lista de campos: una `Reference`
solo declara identidad, tecnología, fotos y cinco magnitudes dimensionales
—longitud, anchura, altura, altura libre al suelo y maletero—, nada de lo
que solo sirve para puntuar. Una lista separada, no un campo en `Car`, hace
que pasarle una `Reference` a `scoreCatalog` sea un error de tipos, no un
olvido posible en tiempo de ejecución.

`references.json` trae hoy al Alfa Romeo Giulietta de la especificación
original del proyecto —la fila que `product/0001` dejó fuera a propósito
por no ser un candidato—, con sus cinco magnitudes fuente por fuente.

## Ficha

`src/domain/ficha.ts` (product/0014, fundido con la antigua ficha técnica
por product/0018): compara candidatos y referencias entre sí, magnitud por
magnitud, sobre veinte campos de `Car`/`Reference` —diecinueve propios más
`litersPerSquareMeter`, derivada—. No calcula puntuación: es lectura, no
juicio agregado, así que vive fuera de `scoring/`.

- **`litrosPorMetroCuadrado(trunkLiters, lengthMm, widthMm)`** — litros de
  maletero por metro cuadrado de huella en el suelo: cuánto espacio da un
  coche por el sitio que ocupa (`product/0013`, requisito 11).
- **`FICHA_FIELDS`/`FichaField`** — las veinte claves, en el orden en que
  se declaran; la interfaz decide etiqueta, unidad y agrupación por bloque
  a partir de ahí, no aquí.
- **`buildFicha(cars, references)`** — un `FichaEntity` por candidato y por
  referencia, en el orden del catálogo, sin ordenar y sin Δ todavía: eso
  son pasos aparte, deliberadamente, porque el orden y el modelo de
  comparación los elige quien mira la ficha. Una celda es `'sourced'`
  (valor, unidad, estimado), `'rating'` (una nota de usuario, sobre 5) o
  `'missing'` —el campo no existe en esa entidad, no un cero—: una
  `Reference` solo declara cinco de las veinte, así que comparar contra
  ella deja quince celdas `'missing'` por construcción, no por caso
  especial.
- **La tabla de polaridad** (`POLARITY`, `Record<FichaField,
  DeltaPolarity>` — TypeScript exige las veinte claves en tiempo de
  compilación, así que ninguna puede quedar sin dirección declarada por
  descuido) fija si más es mejor, peor o si el dato no tiene una dirección
  declarada, con su razón junto a cada una:
  - **`moreIsWorse`** — `lengthMm`, `widthMm` (el problema que el proyecto
    resuelve es que los sustitutos son más grandes), `weightKg` (penaliza
    consumo, frenada y agilidad), `acceleration0to100` (son segundos: más
    es más lento), `consumption`, `priceEur`, `maintenanceEurYear`.
  - **`moreIsBetter`** — `trunkLiters`, `litersPerSquareMeter` (mejor
    aprovechado el espacio), `rearShoulderWidthMm` (la magnitud que
    `product/0017` añadió porque mide si caben tres personas atrás),
    `powerCv`, `residualPct5y` (lo que se recupera al vender),
    `reliabilityOcu`, `warrantyYears`, `warrantyExtensionYears`,
    `aestheticsExterior`, `aestheticsInterior` (notas de usuario sobre 5:
    más nota es mejor en las dos).
  - **`neutral`** — `heightMm`, `groundClearanceMm`, y `wheelbaseMm` —más
    batalla da más espacio dentro y más coche fuera; el proyecto no ha
    declarado cuál de las dos cosas le importa más, y ante la duda no se
    inventa un juicio de color—.
- **`withComparison(entities, comparisonId)`** — recalcula la Δ de cada
  celda de cada entidad frente a la entidad `comparisonId`.
  `comparisonId === null` —«Ninguno»— apaga todas las Δ: es la misma vía
  que comparar contra una entidad que no existe, sin rama aparte. La propia
  entidad de comparación nunca lleva Δ contra sí misma —sería siempre cero
  y no dice nada—, y una celda `'missing'` en cualquiera de las dos partes
  deja la Δ en `null`, nunca en un cero engañoso.
- **`sortFicha(entities, criterion)`** — ordena por `catalog` (el orden del
  propio catálogo), `lengthMm`, `widthMm` o `priceEur`, ascendente. Una
  entidad sin la magnitud por la que se ordena va al final: no hay dato que
  defender en esa posición, y el orden relativo entre dos entidades que
  ambas carecen del dato no se declara.

## Qué queda fuera

Un eje de autonomía y repostaje, y un eje de conducción subjetiva tras
probar los coches, quedan fuera del dominio actual — son extensiones
futuras, registradas en `docs/roadmap.md`, no ausencias por descuido.
Corregir o completar los valores del catálogo tampoco es parte de este
dominio: las specs de eje fijan cómo se declara fuente y estimación y contra
qué se puntúa, no qué valores son correctos.
