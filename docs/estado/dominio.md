# Estado: dominio

> Este documento es la **autoridad sobre qué modela el negocio hoy**:
> conceptos, invariantes, reglas y vocabulario. Si hay duda sobre cómo se
> llama algo o qué reglas cumple, gana lo que diga este documento, no el
> nombre que aparezca en el código.

**Estado:** Activo.

## Coche y dato con fuente

Un `Car` (`src/domain/car.ts`) tiene identidad (`id`, `name`, `brand`,
`technology`) y veinte magnitudes, cada una en uno de dos formatos:

- **`SourcedValue<T>`** — `{ value, unit?, sources }`. Es el formato de todo
  dato que viene de fuera: dimensiones, potencia, consumo, precio,
  fiabilidad OCU, garantía, valor residual, mantenimiento, aceleración. Dos
  de las veinte, `batteryCapacityKwh` y `electricRangeKm`, solo las declara
  un `PHEV` — la validación las exige ahí y las prohíbe en cualquier otra
  tecnología (product/0028). Cada
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

## Generación: en qué punto tecnológico está el coche

Un `Car` declara además `generation` (product/0021), obligatoria y aparte de
las dieciocho magnitudes que puntúan: `launchYear` (`SourcedNumber`,
obligatorio) es el año en que el fabricante presentó la generación —manda la
presentación, no la comercialización en España si son distintas—;
`faceliftYear` (`SourcedNumber`, opcional) es el año del retoque de mitad de
ciclo, solo si la versión que el catálogo compara es la posterior a él;
`code` (texto, opcional) es el código de generación del fabricante
(`NX4`, `U11`, `AZ20`…). Zod rechaza un `faceliftYear` anterior a
`launchYear`, nombrando el campo.

**Ningún eje la usa.** El ADR 0009 decide que el calendario no entra en la
puntuación: una escala anclada en un año movería la nota de un coche sin que
cambiara ningún dato suyo, sin más que pasar el tiempo. `generation` se
declara y se muestra —en la ficha, con Δ— pero no produce ninguna nota,
mismo trato que ya recibe `warrantyExtension`: informativa por diseño, no un
descuido de puntuación.

`Reference` declara `generation` también, con las mismas reglas —única
excepción a su regla de «solo magnitudes dimensionales»: la referencia
existe para dar contexto, y de cuándo es el coche contra el que se compara
todo es precisamente eso.

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
que es la tecnología del coche quien lo decide (product/0008), y para un
`PHEV` la autonomía eléctrica real y el reparto de kilómetros entre modo
eléctrico y térmico (product/0028); y `diario`, para declarar que la
penalización por carga en casa solo puede aplicar a un vehículo enchufable,
esté activa o no. Es distinto de `assumptionsUsed`: no es un supuesto
global, es información del coche.

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

`diario` lleva una penalización condicional que alcanza a todo vehículo
enchufable (`isPlugIn`, `car.ts`: cierto para `EV` y `PHEV`) cuando el
supuesto `cargaEnCasa` está desactivado: `−1,5` puntos para un `EV`, `−0,75`
para un `PHEV` (product/0028). La mitad, porque a un eléctrico sin enchufe
en casa le va la viabilidad —depende de la carga pública— y a un enchufable
solo la comodidad: sigue moviéndose exactamente igual, sin cargarlo nunca.
Con carga en casa, ninguno de los dos penaliza. Se aplica después de
combinar las dos escalas, y el resultado se acota de nuevo a 0-10.

**Los anclajes de `diario`, `viaje` y `prestaciones` son los extremos del
mercado, no de la gama comparada** (ADR 0010, `product/0026`). El ADR 0004
ya exigía que cada escala se ancle contra algo externo al conjunto de
candidatos, pero no fijaba con qué criterio se elige el número: los siete
anclajes de estos tres ejes se habían ido apretando contra los candidatos
que en cada momento se comparaban, hasta el punto de que un 10 en maletero
llegaba a significar 620 litros con 910 ya a la venta. El criterio vigente
es que el 10 es el mejor valor de esa magnitud en un turismo generalista de
venta al público —sin deportivos, versiones de prestaciones, ultralujo,
comerciales ni cuadriciclos— y el 0 el peor, cada uno con su modelo y su
fuente publicada. `coste` queda fuera a propósito —su 0 de precio es el
presupuesto declarado, no una cifra de mercado— y `fiabilidad` ya cumplía el
criterio sin cambiar nada, porque sus extremos son los que la propia OCU
publica.

### Los anclajes de `diario`

| Magnitud | Nota 10 hasta | Nota 0 desde |
| --- | --- | --- |
| Anchura | 1.600 mm | 2.000 mm |
| Longitud | 3.600 mm | 5.400 mm |

Ambas medidas son de carrocería, sin espejos. Los dos anclajes son los
extremos del turismo generalista de venta al público, no un umbral de
utilidad (ADR 0010): el 10 es el mejor valor a la venta, el 0 el peor.
**Anchura:** el Kia Picanto —1.595 mm— marca el suelo del mercado, nada más
estrecho se vende como turismo; 2.000 mm es el techo real —Range Rover
(2.003 mm) y BMW X7 (2.000 mm) lo rozan por los dos lados—. **Longitud:** el
mismo Picanto marca el suelo —3.605 mm, el turismo más corto a la venta—; el
techo lo pone el BMW i7 —5.391 mm—, el techo real del mercado y no el tamaño
de una plaza de aparcamiento. Fuente de ambos modelos:
[motor.es](https://www.motor.es/).

### Los anclajes de `coste`

| Magnitud | Nota 10 hasta | Nota 0 desde |
| --- | --- | --- |
| Precio de compra | 25.000 € | 47.000 € |
| Coste de uso mensual | 100 €/mes | 250 €/mes |

El coste de uso mensual sale de sumar la energía anual y el mantenimiento
anual, y dividir entre doce; no multiplica por ningún horizonte de tenencia
porque ya es una cifra mensual. La energía anual reparte los kilómetros del
año entre modo eléctrico (a `precioKwh`) y modo térmico (a `precioLitro`)
según la tecnología (product/0028): un `EV` hace el año entero en eléctrico,
un `ICE`/`MHEV`/`HEV` entero en térmico, y un `PHEV` reparte según haya o no
carga en casa. Sin carga en casa, un `PHEV` hace el año entero en térmico —
el mismo cálculo que un no enchufable—; con carga en casa, los kilómetros
diarios (`kmPorAnio × 0,75`; el 0,25 restante son los trayectos largos que
ninguna batería de enchufable cubre, `CUOTA_VIAJE` en `coste.ts`, una
constante razonada y no un supuesto editable) se hacen en eléctrico hasta el
límite de su autonomía eléctrica homologada WLTP (`electricRangeKm`,
publicada), y el resto en térmico. El consumo eléctrico no lo publica km77
de forma homogénea para un enchufable, así que se deriva de esa autonomía y
de la capacidad de la batería (`batteryCapacityKwh`, la bruta: la útil no
está publicada por igual para los dos enchufables del catálogo). Las dos
magnitudes nuevas son obligatorias en `CarSchema` para un `PHEV` y prohibidas
para el resto. `consumption` de un `PHEV` es el consumo en modo híbrido con
la batería vacía —lo que km77 llama «consumo híbrido»—, no el WLTP combinado,
que para un enchufable ya supone que se carga y por tanto respondería de
antemano la pregunta que hace `cargaEnCasa`. El anclaje de rechazo del
precio son los 47.000 € ya
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
| Maletero | 910 L | 185 L |
| Batalla | 3.200 mm | 2.400 mm |
| Anchura de hombros (2ª fila) | 1.460 mm | 1.260 mm |

Los tres anclajes son los extremos del turismo generalista de venta al
público (ADR 0010), no el mejor y el peor de la gama que se está comparando.
**Maletero:** el techo lo pone el Škoda Kodiaq —910 L a cinco plazas—, el
maletero generalista más grande del mercado; el suelo lo pone el Fiat 500
Hybrid —185 L—. **Batalla:** el BMW i7 —3.215 mm— marca el techo real; el Kia
Picanto —2.400 mm, la batalla más corta a la venta— marca el suelo.
**Anchura de hombros:** el Mercedes Clase E —146 cm, según las mediciones
propias de km77— marca el techo; el mismo Picanto —126 cm, km77— marca el
suelo. Dimensiones y maleteros de [motor.es](https://www.motor.es/) salvo la
anchura de hombros, que es de [km77](https://www.km77.com/) porque es la
fuente que ya usa el catálogo para esa magnitud.

**El maletero pesa 0,5 y las otras dos 0,25 cada una** porque el maletero es
la restricción que se **incumple** —el equipaje cabe o no cabe, y si no cabe
se deja en casa—, mientras que el espacio de atrás es gradual. Batalla y
anchura de hombros miden ese mismo espacio en dos direcciones, a lo largo y
a lo ancho, y pesan igual entre sí porque ninguna es mejor proxy que la
otra: la batalla reparte entre habitáculo y vanos, así que dos coches con la
misma batalla pueden dar distinto sitio a las piernas; la anchura de hombros
se mide dentro del habitáculo pero solo a una altura.

Con anclajes de mercado, ningún candidato del catálogo satura ya un extremo
salvo el Hyundai IONIQ 5 en anchura de hombros —mide exactamente 1.460 mm—.
Es un techo legítimo, no una escala mal puesta: el ADR 0010 no comprueba una
escala mirando si los candidatos se apiñan, porque esa comprobación es
precisamente el fallo que corrige — cuánto separa un eje lo deciden los
pesos, no el ancho del recorrido entre sus dos anclajes.

**La anchura de hombros se publica en centímetros enteros** (km77, ficha de
mediciones propias, segunda fila). Se guarda en milímetros por coherencia
con el resto de medidas, pero su resolución real es de 10 mm y no debe
leerse como precisión milimétrica. km77 la publica en dos filas distintas
—«Anchura hombros máxima» y «Anchura hombros mínima»— y casi nunca rellena
las dos: da una u otra. El catálogo guarda la que publique cada ficha sin
anotar cuál es, y los anclajes de esta magnitud mezclan las dos —el Clase E
solo tiene máxima y el Picanto solo mínima—: es una deuda conocida, en
`docs/roadmap.md`.

### Los anclajes de `prestaciones`

| Magnitud | Nota 10 desde | Nota 0 hasta |
| --- | --- | --- |
| CV por tonelada | 260 | 65 |
| Aceleración 0-100 | 4,4 s | 16,7 s |

Los dos anclajes son los extremos del turismo generalista de venta al
público (ADR 0010), no un supuesto ni el mejor y el peor de la gama que se
está comparando. **El universo excluye deportivos, superdeportivos y
versiones de prestaciones** —anclar la aceleración en un superdeportivo no
informa de nada sobre un SUV híbrido—, así que los dos extremos los ponen los
mismos dos coches: el suelo lo marca el Dacia Sandero SCe 65 —67 CV,
1.012 kg, 66,2 CV/t, 16,7 s, el coche más barato del mercado
([larevueautomobile](https://www.larevueautomobile.com/), fuente del
fabricante para la aceleración)—, y el techo lo marca el Tesla Model 3 Gran
Autonomía tracción integral —498 CV, 1.899 kg, 262,2 CV/t, 4,4 s
([km77](https://www.km77.com/))—, una berlina de venta normal y no una
versión de prestaciones. El peso no entra dos veces: ya paga en `diario` por
tamaño y en `coste` por consumo; aquí solo divide a los CV, que es justo lo
que el eje mide.

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
por product/0018; product/0021 añade las dos de generación): compara
candidatos y referencias entre sí, magnitud por magnitud, sobre veintidós
campos de `Car`/`Reference` —veintiuno propios más `litersPerSquareMeter`,
derivada—. No calcula puntuación: es lectura, no juicio agregado, así que
vive fuera de `scoring/`.

- **`litrosPorMetroCuadrado(trunkLiters, lengthMm, widthMm)`** — litros de
  maletero por metro cuadrado de huella en el suelo: cuánto espacio da un
  coche por el sitio que ocupa (`product/0013`, requisito 11).
- **`FICHA_FIELDS`/`FichaField`** — las veintidós claves, en el orden en
  que se declaran; la interfaz decide etiqueta, unidad y agrupación por
  bloque a partir de ahí, no aquí.
- **`buildFicha(cars, references)`** — un `FichaEntity` por candidato y por
  referencia, en el orden del catálogo, sin ordenar y sin Δ todavía: eso
  son pasos aparte, deliberadamente, porque el orden y el modelo de
  comparación los elige quien mira la ficha. Una celda es `'sourced'`
  (valor, unidad, estimado), `'rating'` (una nota de usuario, sobre 5) o
  `'missing'` —el campo no existe en esa entidad, no un cero—: una
  `Reference` declara siempre siete de las veintidós —las cinco
  dimensionales, `litersPerSquareMeter` derivada y el año de lanzamiento de
  su generación, obligatorio—, así que comparar contra ella deja catorce
  celdas `'missing'` por construcción, no por caso especial; una
  decimoquinta, el año de retoque, depende de si esa referencia concreta lo
  declara.
- **La tabla de polaridad** (`POLARITY`, `Record<FichaField,
  DeltaPolarity>` — TypeScript exige las veintidós claves en tiempo de
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
  - **`neutral`** — `heightMm`, `groundClearanceMm`, `wheelbaseMm` —más
    batalla da más espacio dentro y más coche fuera; el proyecto no ha
    declarado cuál de las dos cosas le importa más, y ante la duda no se
    inventa un juicio de color—; `generationLaunchYear` y
    `generationFaceliftYear` —el ADR 0009 decide que el calendario no
    entra en la puntuación, y sin nota que juzgar no hay dirección que
    declarar: más nuevo no está dicho que sea mejor—.
- **`withComparison(entities, comparisonId)`** — recalcula la Δ de cada
  celda de cada entidad frente a la entidad `comparisonId`, en tres estados
  posibles, no dos: `null` —sin comparación activa, o esta es la propia
  celda de referencia— frente a `'unavailable'` —hay comparación, pero esta
  celda concreta no se puede comparar contra ella—. `comparisonId === null`
  —«Ninguno»— deja la Δ en `null` en todas las celdas: es la misma vía que
  comparar contra una entidad que no existe, sin rama aparte. La propia
  entidad de comparación tampoco lleva Δ contra sí misma —sería siempre
  cero y no dice nada—, así que también queda en `null`. `'unavailable'` es
  el estado distinto: una celda `'missing'` en la entidad de comparación
  (le falta el dato), o las dos celdas en unidades distintas —`consumption`
  mezcla `l/100km` de combustión con `kWh/100km` eléctrico, y restar esos
  números no diría nada—. La interfaz muestra los dos como la misma raya
  con texto accesible, nunca como un cero engañoso, pero el dominio los
  distingue: apagar la Δ a propósito no es lo mismo que no poder calcularla.
- **`sortFicha(entities, criterion)`** — ordena por `catalog` (el orden del
  propio catálogo) o por **cualquiera de las veintidós magnitudes**:
  `FICHA_SORT_CRITERIA` se declara como `['catalog', ...FICHA_FIELDS]`, no
  como una lista aparte, así que una magnitud nueva en la ficha es ordenable
  el mismo día que existe. La **dirección la fija la tabla de polaridad**, no
  el criterio: `moreIsBetter` ordena descendente y `moreIsWorse` ascendente
  —las dos, mejor primero— y `neutral` ascendente, que es el orden natural de
  leer un número y no afirma ningún mérito. Ordenar y colorear la Δ leen la
  misma tabla porque son la misma afirmación aplicada a dos sitios: si una
  magnitud cambiara de polaridad, cambiarían las dos a la vez. Una entidad
  sin la magnitud por la que se ordena va al final **en las dos
  direcciones** —la ausencia de dato no es un valor extremo que deba
  encabezar un orden descendente—, y el orden relativo entre dos entidades
  que ambas carecen del dato no se declara.

## Qué queda fuera

Un eje de autonomía y repostaje, y un eje de conducción subjetiva tras
probar los coches, quedan fuera del dominio actual — son extensiones
futuras, registradas en `docs/roadmap.md`, no ausencias por descuido.
Corregir o completar los valores del catálogo tampoco es parte de este
dominio: las specs de eje fijan cómo se declara fuente y estimación y contra
qué se puntúa, no qué valores son correctos.
