---
name: add-model
description: Añade un coche nuevo al catálogo de comparador-coches (src/data/cars.json) — investiga en la web sus 20 magnitudes con fuente real (incluida su generación), busca y verifica sus 5 fotos (frontal, lateral, trasera, maletero, interior), y deja el repositorio en verde antes de comitear. Úsala en cuanto el usuario pida "añadir un coche", "meter un modelo nuevo en la comparativa", "comparar también el/la <marca modelo>", o describa un coche que quiere ver en el ranking o en la ficha completa — aunque no mencione explícitamente "catálogo" ni "cars.json". No la uses para corregir un dato de un coche que ya está en el catálogo (eso es una edición puntual, no un alta) ni para cambiar la referencia (`references.json`, hoy solo el Alfa Romeo Giulietta).
---

# Añadir un modelo al catálogo

Esta skill reproduce a mano, para un coche nuevo, exactamente el trabajo que
`product/0001` (las 19 magnitudes) y `product/0014` (las 5 fotos) ya
definieron para los once candidatos actuales. No es una spec nueva — el
formato del catálogo ya está `consolidated`/`implemented`; dar de alta un
coche es aplicar ese formato a datos nuevos, con la misma disciplina de
fuentes que ya rige el resto del catálogo.

**El motivo de que esto tarde y no se pueda acelerar de verdad**: cada
magnitud tiene que venir de una fuente real y consultable, y cada foto de
una imagen que de verdad se ha mirado. Un catálogo con un dato inventado o
una foto del coche equivocado es peor que un catálogo incompleto — pasa la
validación de Zod igual, pero miente. Trátalo como investigación, no como
relleno de formulario.

## Resumen del flujo

1. Rama nueva para esta unidad de trabajo (`docs/proceso/trazabilidad.md`).
2. Identidad: `id`, `name`, `brand`, `technology`, `generation`.
3. Las 20 magnitudes, cada una con una fuente real — la sección más larga.
4. Las 5 fotos — flujo completo en `references/photo-sourcing.md`.
5. Las valoraciones subjetivas, **enseñándole las fotos del paso 4 al
   usuario** para que las puntúe. Es interactivo por diseño: van después de
   las fotos porque se valoran sobre ellas.
6. Actualizar los dos tests que dan por hecho once candidatos.
7. Registrar como deuda lo que falte, en `docs/roadmap.md`.
8. CI local entera en verde.
9. Un commit `data(web): add <marca> <modelo> to the catalogue`, en inglés.

## 1. Antes de escribir nada

Lee `src/domain/car.ts` para tener el esquema exacto delante — no lo
transcribas de memoria, los campos y sus tipos son la fuente de verdad, y
esta skill puede quedarse desactualizada si el esquema cambia. Confirma
también que el `id` propuesto (kebab-case, `marca-modelo`, por ejemplo
`toyota-rav4-hev`) no existe ya en `src/data/cars.json`.

Si el usuario no ha dicho qué coche exactamente —marca, modelo **y**
motorización/acabado— pregúntaselo antes de investigar nada: `technology`
(`ICE`, `MHEV`, `HEV`, `PHEV`, `EV`) cambia qué versión hay que buscar, y
buscar la genérica cuando hay varias en el mercado es la forma más directa
de acabar mezclando datos de dos coches distintos.

## 2. Las 20 magnitudes

**La generación va aparte y no puntúa.** `generation` (product/0021, ADR
0009) es obligatoria y no es una de las magnitudes con las que se puntúa:
declara en qué punto tecnológico está el coche, para que se pueda leer en
la ficha, y ningún eje la usa nunca — el ADR 0009 decide que el calendario
no entra en la puntuación. Tiene tres campos:

- `launchYear` (`SourcedNumber`, obligatorio): el año en que el
  fabricante **presentó** la generación —no el de comercialización en
  España si son distintos—. Busca la fecha de la revelación mundial de esa
  generación (Wikipedia en inglés suele tenerla precisa, por modelo:
  «revealed on», «unveiled on»); no vale una estimación a partir del año
  de matriculación de la unidad que se compara.
- `faceliftYear` (`SourcedNumber`, opcional): el año del retoque de mitad
  de ciclo, **solo si la versión concreta que vas a puntuar es la
  retocada**. Si no puedes confirmar con la fuente que la versión que
  puntúas es la posterior al retoque (y no la anterior), omite el campo en
  vez de adivinar — es exactamente el mismo criterio que ya aplicas al
  resto de magnitudes: mejor un dato ausente que uno inventado.
- `code` (texto, opcional): el código de generación del fabricante
  (`NX4`, `U11`, `AZ20`…) cuando lo publica. Si no lo encuentras, omítelo.

`CarSchema` tiene además dos formatos para el resto de magnitudes, y no son
intercambiables:

- **`SourcedNumber`** — `{ value, unit?, sources: [{ label, value,
  estimated, current, discardedReason? }] }`.
  Es el formato de todo lo que viene de fuera: `lengthMm`, `widthMm`,
  `heightMm`, `wheelbaseMm`, `rearShoulderWidthMm`, `groundClearanceMm`,
  `trunkLiters`, `powerCv`, `weightKg`, `acceleration0to100`, `consumption`,
  `maintenanceEurYear`, `priceEur`, `reliabilityOcu`, `warrantyYears`,
  `residualPct5y` (opcional),
  y el objeto opcional `warrantyExtension` (`{ years: SourcedNumber,
  kmLimit?: SourcedNumber, condition }`). Zod exige **exactamente una**
  fuente con `current: true`, y su `value` tiene que coincidir con el
  `value` de fuera — no son dos sitios independientes, son el mismo dato
  escrito dos veces por diseño, para que quede trazado de dónde sale.
- **`UserRating`** — `{ value: 1-5, label }`. Es el formato de las
  valoraciones de **estética**, `aestheticsExterior` y
  `aestheticsInterior`: un juicio propio, no un dato con procedencia. **No
  los rellenes tú**, ni siquiera «de momento un 3» a modo de relleno. Se
  piden al usuario en la sesión interactiva de la sección 6, que va después
  de las fotos porque se valoran mirándolas.

  **El confort de viaje no es una valoración subjetiva.** Es un dato
  objetivo, calculado por el eje `viaje` a partir de magnitudes medidas
  (`src/domain/scoring/axes/viaje.ts`) — nunca preguntes al usuario una
  «nota de viaje» ni una «nota de confort». El campo `travelComfort` que
  aún sobrevive en `CarSchema` es un resto sin uso que `product/0005` dejó
  pendiente de retirar y que `product/0017` retira; si al dar el alta ese
  campo todavía existe en el esquema, míralo en `car.ts` y trátalo como
  deuda de migración, no como algo que valore una persona.

**Cómo investigar cada magnitud**: busca la ficha técnica oficial del
fabricante para el mercado español (o europeo si no la hay en español) y,
donde puedas, contrástala con un medio especializado con fecha
(km77, motor.es, auto-data.net...). Usa la fecha de la fuente en el
`label`, tal como ya hace el catálogo actual — por ejemplo
`"motor.es, ficha de medidas (agosto 2026)"`. Si dos fuentes no coinciden
en un dato (el caso típico es el maletero: catálogo del fabricante medido
hasta el techo frente a medición independiente VDA), declara las dos
fuentes, marca `current: true` solo en la que uses de verdad, y explica en
`discardedReason` por qué se descarta la otra — no elijas en silencio.

**`priceEur` es siempre el PVP de catálogo, sin descuentos.** El proyecto
no modela descuentos todavía —es trabajo futuro—, así que un precio con un
descuento de fábrica o de concesionario ya restado rompe la comparación
con el resto del catálogo sin que nada lo avise: pasa la validación de Zod
igual que un PVP limpio. Si la fuente que encuentras da el precio ya
rebajado (por ejemplo, km77 declarando un «descuento oficial» aparte del
PVP), busca o reconstruye el PVP sin descontar y ponlo como `current:
true`; el precio con descuento va como fuente descartada, con el
`discardedReason` explicando que incluía un descuento. Es el error que
tuvo el alta del Kia EV5: quedó con el precio ya rebajado (51.437 €) en
vez del PVP de catálogo (53.071 €).

Si de verdad no encuentras una cifra fiable para algún dato, no la
estimes a ojo y la marques `estimated: true` sin más: escribe en una nota
del coche (`notes`, un array de strings) qué falta y por qué, igual que ya
hace el catálogo con el Corolla Cross y su aceleración sin verificar
(`docs/roadmap.md`, tabla de deudas). Una cifra estimada sin explicar es
indistinguible de una inventada para quien lea el catálogo después.

**Casos que ya han dado problemas en este catálogo** — compruébalos
siempre, no solo cuando "parezca" que puede haber ambigüedad:

- Un modelo con **varias motorizaciones o carrocerías** bajo el mismo
  nombre comercial (el CR-V e:HEV es 4x2 o 4x4 AWD, con maleteros
  distintos; el Corolla Cross tiene una versión 200 AWD-i que no cumple
  los requisitos del proyecto). Dilo explícitamente en una nota qué
  versión exacta se ha puntuado.
- Un **cambio de generación reciente** donde el nombre no cambia (el NX
  350h actual frente al NX 300h descatalogado que comparte gama de
  precios de segunda mano). Verifica que la ficha técnica que usas es de
  la generación que se vende hoy, no de la anterior.
- Un **precio con el descuento oficial ya restado** en la fuente (el caso
  del Kia EV5: km77 daba el PVP con un descuento de fábrica de 1.634 €
  aplicado). Usa siempre el PVP de catálogo sin descontar; ver la nota
  sobre `priceEur` más arriba.

## 3. Añadir el registro

Añade el coche a `src/data/cars.json` como un objeto más del array, con el
mismo formato que los que ya hay — mejor copiar la estructura de un coche
existente y sustituir los valores que ir escribiéndolo desde cero, para no
desviarte del formato sin darte cuenta.

## 4. Los dos tests que dan por hecho once candidatos

Dos tests están escritos con el número de candidatos actual **a propósito**
(no son un descuido a arreglar, son la forma en que el proyecto detecta
cambios no intencionados en el catálogo o en la puntuación):

- `src/data/loadCatalog.test.ts` — `expect(cars).toHaveLength(11)`. Súbelo
  al nuevo total.
- `src/domain/scoring/scoreCatalog.snapshot.test.ts` — un objeto
  `EXPECTED_TOTALS` con el `id` y la puntuación total de cada candidato
  contra el catálogo real, pesos y supuestos por defecto. Añade una entrada
  para el coche nuevo con su **puntuación real**, no una cifra provisional:
  ejecuta `npx vitest run src/domain/scoring/scoreCatalog.snapshot.test.ts`,
  el fallo te va a decir "expected undefined, received —el total de
  verdad—" para el `id` nuevo; copia ese número. No toques ninguna de las
  puntuaciones que ya había — si alguna cambia, es que algo en los datos
  del coche nuevo o en el propio motor de puntuación se ha movido, y eso
  hay que entenderlo antes de aceptarlo, no silenciarlo actualizando el
  número.

## 5. Las fotos

Lee `references/photo-sourcing.md` antes de buscar la primera imagen: ahí
está el flujo completo (dónde buscar, cómo evitar el límite de peticiones
de Wikimedia, el encuadre exacto de cada vista, y cómo construir `credit` y
`shows`). En resumen — un coche sin fotos sigue siendo un alta válida, y
una vista sin foto se deja vacía; una foto del coche, generación o
motorización equivocados no es aceptable bajo ninguna circunstancia.

## 6. Las valoraciones de estética, con el usuario delante

**Este paso es interactivo y no se puede resolver solo.** Las dos notas de
estética son un juicio del usuario, y un juicio necesita mirar el coche:
por eso van después de las fotos y no antes.

Cuando tengas las fotos de la sección 5 verificadas, **enséñaselas** —las
mismas que van a quedar en la ficha, no otras buscadas aparte— y pídele las
dos notas:

- `aestheticsExterior`, sobre las vistas frontal, lateral y trasera.
- `aestheticsInterior`, sobre la vista de interior.

Aprovechar las fotos de la ficha para esto no es un atajo: es lo correcto.
Garantiza que el usuario puntúa **la misma versión y el mismo acabado** que
el catálogo declara, en vez de una impresión general de la gama formada con
imágenes distintas.

Si el usuario no puede valorar en ese momento, deja los campos ausentes y
regístralo como deuda (sección 7). Un coche sin las notas de estética sigue
siendo un alta válida; un coche con notas inventadas, no.

El `label` de cada `UserRating` describe **cómo se emitió el juicio**, no
repite la nota — el catálogo actual usa
`"Valoración del usuario sobre fotos de catálogo"`.

## 7. Registrar lo que falte

Cualquier vista sin foto, cualquier magnitud estimada, cualquier nota de
estética pendiente: todo eso va como fila nueva en la tabla **Deudas
abiertas** de `docs/roadmap.md`, nombrando el coche y el campo o la vista
exactos — sigue el estilo de las filas que ya hay ahí para
`product/0014`. Una deuda sin registrar no es una deuda, es una sorpresa
para quien abra el catálogo después.

## 8. Antes de dar la tarea por terminada

Corre la CI entera en local, en este orden — cada paso depende de que el
anterior esté limpio:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run arch:check
npm run test:coverage   # exige 100% de cobertura
npm run check:photos    # 2xx en todas las fotos, no solo las nuevas
```

Si `test:coverage` falla por algo que no sea los dos tests de la sección 4,
no lo ignores: en este proyecto una cobertura por debajo del 100% no se
tolera nunca, así que un fallo aquí es una señal real.

## 9. El commit

Un commit, `data(web): add <marca> <modelo> to the catalogue`, en inglés,
que solo toque `src/data/cars.json` y los dos tests de la sección 4 —y
`docs/roadmap.md` si se ha añadido alguna deuda—. No mezcles esto con
cambios de código: si al investigar descubres algo que de verdad necesita
tocar `src/domain/` o `src/ui/`, es una tarea aparte.

No hagas `push` a `main` ni abras PR por tu cuenta: deja el commit en la
rama para que el usuario lo revise, salvo que te haya pedido explícitamente
en esta conversación que empujes o abras PR.
