# 0043 — Los anclajes ISOFIX: cuántos y en qué asientos

- **Id:** product/0043
- **Estado:** draft
- **Tipo:** product
- **Fecha:** 2026-09-15
- **Specs relacionadas:** product/0018, product/0021, product/0027,
  product/0031, product/0032, product/0034
- **ADRs relacionados:** ninguno
- **Doc de estado:** `docs/estado/dominio.md`, `docs/estado/interfaz.md`

## Contexto

La ficha completa compara hoy veintiocho magnitudes de cada coche y ninguna
dice nada sobre seguridad infantil. Quien compara con hijos pequeños —o con
la intención de tenerlos durante la vida útil del coche— necesita saber si
puede instalar una o dos sillas de niño atrás, y si además puede poner una
delante, sin abrir una ficha externa por cada candidato.

El dato existe y se publica con distinto nivel de detalle según la fuente:
la ficha técnica oficial del fabricante suele decir cuántas plazas llevan
anclaje; el informe de seguridad de EuroNCAP, en su apartado de protección
del ocupante infantil, dice además cuáles; y medios como km77, motor.es o
coches.net lo recogen normalmente en el apartado de equipamiento de
seguridad. Ninguna de las tres es km77 en exclusiva, y ninguna de las tres
es obligatoria: la que declare el detalle completo para la versión que el
catálogo compara es la que vale.

Se hereda el aviso de `product/0032` y `product/0034`: hay más de una cifra
posible detrás del mismo nombre. Aquí el riesgo no es confundir una medida
con otra, sino confundir «lleva ISOFIX» como equipamiento genérico —lo que
publica casi cualquier ficha comercial, sin más detalle— con el número y la
posición exactos de los anclajes, que es lo que esta spec declara.

## Objetivo

Que el catálogo declare, con fuente real, cuántas plazas de cada coche
llevan anclaje ISOFIX y cuáles son, y que se lea en la ficha completa junto
al resto de magnitudes: comparable por recuento, con Δ, ordenable y
disponible como criterio eliminatorio. Sin nota y sin eje.

## Alcance

- **Un campo nuevo y opcional en `Car`**: `isofix`, con la misma forma de
  dato con fuente que el resto (`SourcedValue`), cuyo valor es la lista de
  plazas —de un conjunto cerrado de cuatro— que llevan anclaje.
- **El mismo campo, también opcional, en `Reference`**, por el motivo por el
  que `product/0032` y `product/0034` lo añadieron allí: sin él, la Δ de
  esta magnitud saldría `'unavailable'` para los candidatos siempre que se
  compare contra la referencia.
- **Una magnitud derivada nueva en `FICHA_FIELDS`**, `isofixSeatCount`: el
  recuento de plazas, comparable, con Δ y con criterio eliminatorio, igual
  que `litersPerSquareMeter` deriva de otras magnitudes sin ser ella misma
  un campo de `Car`.
- **Una fila nueva en la ficha completa**, dentro de «Tamaño y espacio», con
  el recuento como valor comparable y las plazas concretas como texto de
  apoyo de la fila, el mismo trato que ya recibe `generationCode`.
- **La polaridad declarada** de la magnitud, para la Δ, el orden y el
  operador que `product/0031` fuerza en una regla.
- **El alta del dato para los registros de hoy** —publicados y despublicados
  por igual, más la referencia— con fuente real citada, donde la fuente lo
  publique con ese nivel de detalle para la versión que el catálogo
  compara.
- **La incorporación del campo a la skill `add-model`.**

## Fuera de alcance

- **Que el número de anclajes puntúe.** Ningún eje la lee, ningún peso
  cambia, ninguna nota se mueve, el mismo trato que `maxRoofLoadKg`
  (`product/0034`).
- **Compatibilidad i-Size y top tether.** Son datos relacionados que una
  misma fuente puede mencionar junto al anclaje inferior de dos puntos,
  pero no todas las fuentes candidatas los publican con la misma
  consistencia. Esta spec declara solo el anclaje de dos puntos —el que
  homogeneiza fabricante, EuroNCAP y prensa especializada—; ampliar a
  i-Size o top tether es una spec futura si hace falta.
- **Un diagrama o posición milimétrica del anclaje dentro del asiento.**
  Solo la plaza, de un conjunto cerrado de cuatro.
- **Añadirlo como criterio eliminatorio por defecto ni preconfigurado.**
  `product/0031` ya deja crear cualquier regla sobre cualquier magnitud de
  la ficha; en cuanto `isofixSeatCount` sea una, «al menos N plazas» es una
  regla más sin código propio, pero esta spec no la activa por nadie.
- **Backfill garantizado de los veintiún registros.** Se declara donde se
  encuentre publicado con el detalle exigido; lo que quede sin fuente se
  anota como deuda, no se rellena a ojo.

## Requisitos / comportamiento esperado

### 1. El dato

1.1. `Car` declara `isofix?: SourcedValue<IsofixSeatPosition[]>`,
reutilizando `sourcedValueSchema` (`src/domain/car.ts`) igual que
`SourcedNumberSchema` lo hace para `z.number()`, con la misma estructura de
fuentes que el resto: exactamente una vigente, y una descartada obliga a
declarar su motivo.

1.2. `IsofixSeatPosition` es un conjunto cerrado de cuatro valores —
`'rearLeft'`, `'rearCenter'`, `'rearRight'`, `'frontPassenger'` —, las
cuatro plazas donde un turismo puede llevar anclaje ISOFIX. `value` es la
lista de las plazas que sí lo llevan: sin duplicados y con al menos una.

1.3. Es opcional en la forma, y opcional de verdad, igual que
`maxRoofLoadKg` (product/0034): no hay ninguna invariante cruzada con
`technology`, y un registro sin el dato es un registro incompleto, no
inválido.

1.4. La magnitud declarada es **de qué plazas lleva anclaje ISOFIX de dos
puntos**, no si el asiento es compatible i-Size ni si lleva top tether
(fuera de alcance), y no «si el coche tiene ISOFIX» como equipamiento
genérico sin desglosar. Una fuente que solo diga «lleva ISOFIX» sin decir
cuántas plazas ni cuáles no vale para declarar el dato.

1.5. `Reference` declara el mismo campo, opcional, por el mismo motivo que
ya justifica `turningCircleM` y `maxRoofLoadKg` ahí.

### 2. En la ficha

2.1. `FICHA_FIELDS` gana `isofixSeatCount`: no es un campo propio de `Car`
ni de `Reference`, es derivado —el número de plazas en `isofix.value`—,
igual que `litersPerSquareMeter` deriva de otras tres magnitudes sin ser
ella misma un campo declarado (`litersPerSquareMeterCell`, `ficha.ts`).
Gana Δ, orden por columna (`product/0027`) y disponibilidad como criterio
eliminatorio (`product/0031`) sin código propio en ninguno de los tres.

2.2. Fila nueva «Anclajes ISOFIX» al final del bloque «Tamaño y espacio» de
la ficha completa, detrás de «Carga máxima en techo». Sin decimales ni
unidad de respaldo: es un recuento.

2.3. La fila muestra, además del recuento, las plazas concretas como texto
de apoyo —«trasero izquierdo y derecho», «trasero izquierdo, central y
derecho, y copiloto», etc.—, el mismo trato que ya recibe `generationCode`
junto a `generationLaunchYear` (product/0021, requisito 2.5): texto de
apoyo de la fila, no una celda comparable propia. `FichaEntity` expone
`isofixSeats?: IsofixSeatPosition[]`; la traducción de cada valor a su
etiqueta en español vive en la interfaz, igual que ya viven ahí las
etiquetas de `COMPLETE_BLOCKS`.

2.4. Su polaridad es `moreIsBetter`: a igualdad de todo lo demás, nadie
prefiere menos plazas con anclaje. Como consecuencia, `product/0031` solo
admite el operador `min` sobre esta magnitud.

2.5. Un coche sin el dato muestra la celda vacía, con Δ `'unavailable'`, y
no cuenta como incumplimiento de una regla eliminatoria por omisión — el
mismo trato que cualquier otro campo opcional ausente.

### 3. El alta del dato

3.1. Se declara con fuente real citada y enlace, para los registros donde se
encuentre publicada con el nivel de detalle del requisito 1.4: ficha
técnica oficial del fabricante, informe de EuroNCAP (apartado de protección
del ocupante infantil) o prensa especializada (km77, motor.es, coches.net…
sin exclusividad de ninguna).

3.2. Un valor que no se encuentre publicado con ese nivel de detalle se deja
ausente, no estimado ni inferido del equipamiento genérico del acabado.

3.3. Los registros que queden sin dato —publicados, despublicados y la
referencia— se anotan como deuda en `docs/roadmap.md`, con el mismo formato
que dejaron `product/0032` y `product/0034` para sus magnitudes opcionales.

3.4. La skill `add-model` pide el campo para cualquier alta futura, con la
definición del requisito 1.4 y el rechazo del requisito 3.2 escritos en su
guía.

## Criterios de aceptación

> Obligatorios y verificables.

- [ ] `CarSchema` y `ReferenceSchema` aceptan `isofix` opcional, con `value`
      un array no vacío de `IsofixSeatPosition` sin duplicados y la misma
      estructura de fuentes que el resto; un registro con dos fuentes
      vigentes, con una descartada sin motivo, o con un valor de plaza
      fuera del conjunto cerrado de cuatro, falla al cargar el catálogo
      nombrando el campo y el registro.
- [ ] Ninguna tecnología obliga a declarar el campo ni lo prohíbe: un `EV`,
      un `HEV` y un `ICE` con y sin el dato cargan los seis sin error.
- [ ] `FICHA_FIELDS` incluye `isofixSeatCount`, y `polarityOf` devuelve
      `'moreIsBetter'`.
- [ ] La ficha completa muestra «Anclajes ISOFIX» al final de «Tamaño y
      espacio», con el recuento como valor y las plazas en español como
      texto de apoyo.
- [ ] Una regla eliminatoria sobre `isofixSeatCount` solo admite `min`;
      `isOperatorAllowed` rechaza `max`, y una regla guardada con `max` se
      descarta sola al restaurar la configuración.
- [ ] Un coche sin el dato muestra la celda vacía y Δ `'unavailable'`, y no
      queda marcado como incumplidor por una regla sobre esta magnitud.
- [ ] Todo `isofix` presente en `cars.json` y en `references.json` lleva
      fuente con enlace, y ninguno está marcado `estimated: true`.
- [ ] La skill `add-model` pide el campo, con la definición del requisito
      1.4 y el rechazo del requisito 3.2 escritos en su guía.

## Dependencias y supuestos

Ninguna dependencia externa nueva. Se asume que existe, para al menos un
registro del catálogo, una fuente pública que declare el número y la plaza
del anclaje con el detalle del requisito 1.4 — si no la hubiera para
ninguno, la spec pasa a `implemented` sin ningún dato real y queda toda ella
registrada como deuda en `docs/roadmap.md`.

## Decisiones abiertas

Ninguna.
