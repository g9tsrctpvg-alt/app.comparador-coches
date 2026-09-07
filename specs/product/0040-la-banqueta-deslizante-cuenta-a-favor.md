# 0040 — La banqueta deslizante cuenta a favor, no en contra

- **Id:** product/0040
- **Estado:** consolidated
- **Tipo:** product
- **Fecha:** 2026-09-07
- **Specs relacionadas:** product/0001, product/0013, product/0014,
  product/0018, product/0027, product/0031, product/0039
- **ADRs relacionados:** ninguno — no toca los anclajes de `habitabilidad`
  (ADR 0010), solo qué valor de un coche entra en la escala
- **Doc de estado:** `docs/estado/dominio.md`, `docs/estado/interfaz.md`

> ⚠️ **Spec consolidada (2026-09-07).** Describe un cambio en el momento en
> que se redactó; su sección *Contexto* retrata el sistema **anterior** al
> cambio y hoy es histórica. Para el estado actual, ver
> `docs/estado/dominio.md` y `docs/estado/interfaz.md`. Vigentes aquí solo
> los **criterios de aceptación**, como registro de verificación.

## Contexto

`product/0039` sustituyó la batalla por el espacio de piernas atrás
(`rearLegroomMm`) como magnitud puntuada por `habitabilidad`, declarando
para cada coche «Distancia del respaldo al respaldo delantero» de las
mediciones propias de km77. Para la mayoría de candidatos esa fuente da un
número fijo. Para dos —el Nissan X-Trail e-Power (77-56 cm) y el BMW X1
xDrive25e despublicado (76-62 cm)— da un **rango**, porque la segunda fila
es deslizante: el hueco crece cuando el banco se desplaza hacia atrás y se
reduce cuando se desplaza hacia delante para ganar maletero.

`product/0039` decidió declarar el **mínimo** de ese rango, razonándolo por
analogía con el maletero del Citroën C5 Aircross: «la cifra que no depende
de cómo se reparta el hueco con el maletero». La analogía no traslada.
Maletero y plazas comparten un banco físico, así que el mínimo de maletero
es la garantía que sí importa cuando se decide meter equipaje. Pero el
espacio de piernas del candidato con banco fijo **no tiene ese mínimo**: es
un único número, ya el mejor que ese coche va a dar nunca. Comparar el peor
caso del X-Trail contra el único caso del Tucson no es comparar lo mismo, y
el efecto medido no es un matiz: con el mínimo (56 cm), el X-Trail saca
**0** en ese sumando —satura el suelo de la escala—; con el máximo (77 cm)
sacaría **9,13**, exactamente igual que el Tucson, que es literalmente el
mismo hueco. Poder mover el banco hacia atrás es una capacidad que el
Tucson no tiene, y hoy penaliza a quien sí la tiene.

Está detectado el 2026-09-07 al revisar el dato con el usuario, que
confirma la lectura del rango contra la fuente.

## Objetivo

Que el espacio de piernas de un coche con banqueta deslizante puntúe por lo
que ese banco permite dar como máximo, y que la ficha diga que ese máximo
depende de una banqueta que se puede mover — información que hoy no existe
en ningún sitio del catálogo y que el usuario quiere ver como lo que es:
una ventaja, no una nota a pie de página.

## Alcance

- **Un campo nuevo en `SourceEntry`**: `adjustable?: boolean`, junto a
  `estimated` — no es una magnitud nueva, es una propiedad de **la fuente**
  de un dato ya existente, con la misma estructura que ya usa `estimated`.
- **Cambia el criterio del requisito 3 de `product/0039`** para
  `rearLegroomMm`: cuando la fuente publique un rango por banqueta
  deslizante, se declara el **máximo**, marcando `adjustable: true` en su
  fuente. El resto de la magnitud —fuente, resolución de centímetros,
  prohibición de corregir la medida— no cambia.
- **Un indicador en la ficha completa**: la celda de una magnitud
  `adjustable` lleva una marca junto al valor, con el mismo patrón visual y
  de accesibilidad que la tilde de estimado (`EstimatedMark`), pero con su
  propio texto y sin connotación de duda — es una capacidad del coche, no
  una reserva sobre el dato.
- **La re-declaración de los dos registros afectados** —Nissan X-Trail
  e-Power y BMW X1 xDrive25e— con el valor máximo y la fuente marcada.
- **La actualización del *snapshot* de puntuación**, que sube la nota de
  `habitabilidad` del X-Trail a propósito.

## Fuera de alcance

- **El desglose del eje `habitabilidad`** (`AxisBreakdown`/`InputDatum`, lo
  que se expande en la fila del ranking): no lleva el indicador de
  banqueta deslizante en esta spec. El usuario pidió que se viera en la
  ficha; hacerlo también ahí es una extensión simétrica razonable, pero no
  la pidió nadie todavía, y **queda como límite explícito**, no como olvido
  — registrado en `docs/roadmap.md` por si se quiere igualar.
- **Modelar el mecanismo de la banqueta**: cuánto recorrido tiene, en qué
  posición viene de fábrica, o cómo afecta al maletero cuando se desplaza.
  Esta spec declara que el hueco puede llegar al máximo declarado, no cómo
  se llega hasta él.
- **Aplicar `adjustable` a ninguna otra magnitud.** El campo vive en
  `SourceEntry` porque es la misma estructura que ya usa `estimated`, y eso
  lo deja disponible para el día que otra magnitud lo necesite, pero esta
  spec solo lo declara para `rearLegroomMm` en los dos registros con
  banqueta deslizante.
- **Corregir la deuda de anchura de hombros mezclando mínimo y máximo.** Es
  una magnitud distinta, con una fuente que no publica las dos filas para
  el mismo coche —lo contrario de este caso, donde sí hay una sola fuente
  con un rango legítimo—, y sigue abierta con su propia condición de cierre
  en `docs/roadmap.md`.

## Requisitos / comportamiento esperado

### 1. La fuente

1.1. `SourceEntrySchema` declara `adjustable: z.boolean().optional()`. Sin
el campo, una fuente se comporta exactamente igual que hoy: `adjustable`
ausente y `adjustable: false` significan lo mismo, sin distinción
observable en ningún sitio.

1.2. `adjustable: true` declara que el valor de esa fuente es un extremo de
un rango publicado por un componente móvil del coche —hoy, una banqueta
deslizante—, no una medida fija. No implica nada sobre si el valor es una
estimación: los dos campos son independientes, y una fuente puede llevar
los dos, ninguno o solo uno.

### 2. El criterio de `rearLegroomMm` con banqueta deslizante

2.1. Cuando la fuente de `rearLegroomMm` publique un rango por banqueta
deslizante, el catálogo declara el **máximo** del rango como `value`, con
`adjustable: true` en esa fuente. La etiqueta de la fuente cita el rango
completo tal como lo publica km77 (los dos números), no solo el máximo
declarado.

2.2. Esto **sustituye**, solo para `rearLegroomMm`, el criterio del mínimo
que fijó `product/0039` —consolidada, no editable—: esta spec es la que
corrige esa decisión, con el razonamiento del *Contexto* de más arriba. No
afecta a ninguna otra magnitud que en el futuro pudiera publicarse como
rango.

2.3. Nissan X-Trail e-Power: `rearLegroomMm` pasa de 560 mm (mínimo) a
770 mm (máximo del rango 77-56 cm), `adjustable: true`. BMW X1 xDrive25e:
de 620 mm a 760 mm (máximo del rango 76-62 cm), `adjustable: true`. Las
notas de los dos coches se actualizan para explicar el cambio de criterio,
sin borrar que el rango existe.

### 3. La ficha

3.1. `FichaCell`, en su variante `'sourced'`, gana `adjustable: boolean`,
calculado igual que `estimated` —desde la fuente vigente del dato,
`currentSourceOf(sourced).adjustable ?? false`—.

3.2. La ficha completa muestra, junto al valor de una celda `adjustable`,
una marca visual con texto accesible junto a ella —el mismo patrón que
`EstimatedMark`—, pero con contenido propio: declara que el coche tiene un
componente ajustable ahí y que el valor mostrado es el máximo alcanzable,
en un tono que no es una advertencia. Ninguna otra celda cambia.

3.3. La marca aparece exactamente donde `adjustable` es `true` en la fuente
vigente: hoy, `rearLegroomMm` de los dos coches del requisito 2.3, ninguno
más.

### 4. El movimiento de la nota

4.1. `scoreCatalog.snapshot.test.ts` se actualiza **a propósito**: el
X-Trail e-Power sube en `habitabilidad`. Que el test falle antes de
actualizarlo es la señal esperada.

4.2. La verificación declara el movimiento medido —puesto y porcentaje
antes y después, para el X-Trail publicado— con las cifras reales.

## Criterios de aceptación

> Obligatorios y verificables.

- [x] `SourceEntrySchema` acepta `adjustable` opcional; su ausencia y
      `adjustable: false` son observacionalmente idénticos en cualquier
      lugar que lo lea.
- [x] `rearLegroomMm` del Nissan X-Trail e-Power vale 770 mm y el del BMW X1
      xDrive25e vale 760 mm, cada uno con su fuente vigente marcando
      `adjustable: true` y citando el rango completo en la etiqueta.
- [x] Ningún otro `rearLegroomMm` del catálogo cambia de valor ni gana
      `adjustable: true`.
- [x] `FichaCell` de tipo `'sourced'` expone `adjustable`, y la ficha
      completa renderiza la marca junto al valor exactamente en las celdas
      con `adjustable: true` en su fuente vigente, ninguna otra.
- [x] La marca tiene texto accesible propio, distinto del de
      `EstimatedMark`, y no se confunde visualmente con la tilde de
      estimado.
- [x] `habitabilidad` puntúa el X-Trail e-Power con el nuevo valor sin
      ningún cambio de fórmula ni de anclaje.
- [x] El *snapshot* de puntuación está actualizado, y la verificación
      declara el movimiento medido del X-Trail e-Power en el ranking
      publicado.
- [x] La skill `add-model` menciona el criterio del requisito 2.1 para una
      magnitud con banqueta deslizante.
- [x] El límite del requisito de alcance —sin indicador en el desglose del
      eje— está anotado en `docs/roadmap.md`.
- [x] La CI entera pasa en local: `format:check`, `lint`, `typecheck`,
      `arch:check`, `test:coverage` con el suelo de cobertura vigente,
      `markdownlint` y `build`.

## Dependencias y supuestos

- **No reabre `product/0039`.** Es una spec nueva que corrige, con su
  propio razonamiento, una decisión de una spec consolidada —mismo
  precedente que `product/0036` sobre `product/0035`—: `product/0039`
  sigue `consolidated` y sin tocar, y el criterio nuevo vive aquí.
- **Supone que ningún otro candidato del catálogo tiene banqueta
  deslizante hoy.** Si al dar de alta un coche futuro apareciera un tercer
  caso, se declara con el mismo criterio de esta spec sin necesitar una
  spec nueva: el requisito 2.1 ya lo cubre en general, no solo para los dos
  registros nombrados.
- **El máximo declarado sigue siendo un dato con fuente, no una
  estimación.** km77 lo publica como parte del mismo rango que el mínimo;
  elegirlo no es inventar un número, es leer la otra mitad de la misma
  fuente.

## Decisiones abiertas

Ninguna.
