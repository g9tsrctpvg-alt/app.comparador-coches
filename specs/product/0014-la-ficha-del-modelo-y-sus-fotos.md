# 0014 — La ficha del modelo y sus fotos

- **Id:** product/0014
- **Estado:** implemented
- **Tipo:** product
- **Fecha:** 2026-08-06
- **Specs relacionadas:** product/0001, product/0009, product/0010,
  product/0011, product/0012, product/0013, technical/0004
- **ADRs relacionados:** 0003, 0006
- **Doc de estado:** `docs/estado/dominio.md`, `docs/estado/interfaz.md`

> ⚠️ **Spec histórica — implementada, sin consolidar.** Describe un cambio ya
> implementado: su sección *Contexto* retrata el sistema **anterior** al
> cambio y hoy no es cierta. **No es referencia del estado actual** — para
> eso, ver el **Doc de estado** indicado arriba. Vigentes aquí los
> **criterios de aceptación**, como registro de verificación.

## Contexto

**«La ficha» no está definida en ninguna parte.** El catálogo
(`src/data/cars.json`, `CarSchema`) lleva dieciocho magnitudes por coche más
su identidad, y la vista «Ficha técnica» que trajo `product/0013` enseña
**cinco de ellas** —longitud, anchura, altura, altura libre al suelo y
maletero— más una derivada, los litros por metro cuadrado. Las otras trece
solo se ven repartidas por el desglose de los seis ejes, cada una junto a la
nota que ayuda a producir, y una —la **batalla** (`wheelbaseMm`)— no se ve en
ningún sitio de la aplicación: entra en el eje de viaje y sale del otro lado
convertida en puntos. Lo que hoy se llama ficha es la lista de columnas que
una tabla concreta eligió, no un conjunto declarado.

**La aplicación no tiene ni una sola imagen.** Todo lo que se sabe de un
coche son cifras. Eso tiene dos consecuencias:

- El eje de estética se puntúa **de memoria**. `aestheticsExterior` y
  `aestheticsInterior` son juicios del usuario (`UserRating`, sin fuente ni
  estimación, editables desde el ranking), y no hay nada en pantalla contra
  lo que emitirlos ni con lo que revisarlos meses después.
- El problema declarado del proyecto —los sustitutos son más grandes que el
  coche a sustituir— se ve hoy como un `Δ +80 mm` en la columna de anchura.
  La cifra es correcta y no se *ve*. Una silueta lateral al lado de otra sí.

**El catálogo no tiene todavía ningún campo que no sea número o identidad.**
Toda magnitud externa se guarda como `SourcedValue<T>` —valor, unidad y una
lista de fuentes con exactamente una vigente— porque el problema que ese
formato resuelve es arbitrar entre mediciones que se contradicen (el caso que
lo motivó fue el maletero, catálogo hasta el techo frente a medición VDA). Una
foto no es una medición y no tiene ese problema, así que su forma está por
decidir y no puede copiarse por inercia.

## Objetivo

Declarar qué datos componen la ficha de un modelo —los que ya existen y cinco
fotos nuevas por modelo— y hacer que esa ficha se pueda ver entera.

## Alcance

- **La definición de la ficha**: el inventario de campos agrupado en bloques,
  escrito de una vez, incluidos los que hoy no se enseñan en ninguna vista.
- **Una tercera vista** que enseña la ficha entera: una columna por modelo,
  una fila por característica, con desplazamiento horizontal propio y las
  fotos como cabecera de cada columna.
- **Cinco fotos por modelo**: frontal, lateral, trasera con portón cerrado,
  maletero abierto e interior en vista general.
- **La forma del dato foto** en el catálogo: URL absoluta más procedencia y
  qué versión del coche se ve.
- **Las fotos de la fila de referencia** (Alfa Romeo Giulietta): es la
  silueta contra la que se compara todo, y sin ella la comparación visual no
  tiene línea base.
- **La convención de encuadre** de cada una de las cinco vistas, para que las
  fotos sean comparables entre modelos y no una colección de posturas.
- **El comportamiento cuando una foto falta o no carga.**
- **Texto alternativo, carga diferida y hueco reservado**, coherentes con lo
  que `product/0009` y `product/0010` ya exigen a la interfaz.

## Fuera de alcance

- **Puntuar con fotos.** Ninguna nota, peso ni aportación cambia. La estética
  sigue siendo el `UserRating` que el usuario edita; la foto es el material
  con el que lo emite, no una entrada del cálculo.
- **Más de una foto por vista y modelo.** Ni galería, ni carrusel, ni fotos
  por acabado o color: una foto por vista, y punto. La ampliación al pulsar
  (requisito 8.4) enseña esa misma foto en grande, no otra.
- **Escalar las fotos entre sí a la longitud real de cada coche.** Todas se
  ajustan al ancho de su columna, que es el mismo para todos: la tira de
  fotos compara **formas**, no tamaños. El tamaño lo comparan las filas de
  medidas y la tabla de `product/0013`, que son las que llevan cifras. Es
  funcionalidad distinta y necesitaría spec propia.
- **Retirar o rehacer la vista de `product/0013`.** La ficha técnica
  comparada sigue siendo la única que calcula Δ contra la referencia. Esta
  vista no calcula ninguno: enseña dato bruto de todos los modelos.
- **Procesar imágenes** —recortar, redimensionar, quitar fondo, generar
  miniaturas—. Se enlaza o se copia lo que hay; no se edita.
- **Vídeo, vistas 360º y configuradores del fabricante.**
- **Magnitudes nuevas en el catálogo.** La autonomía y el tiempo de repostaje
  siguen donde estaban: en el roadmap, con spec propia pendiente.
- **Ordenar, filtrar o seleccionar por foto.** La tabla sigue ordenada por
  longitud (`product/0013`).

## Requisitos / comportamiento esperado

### 1. La ficha, declarada por bloques

La ficha de un modelo son estos seis bloques. La columna «Se ve hoy» describe
el sistema **antes** de esta spec:

| Bloque | Campos | Se ve hoy |
| --- | --- | --- |
| Identidad | `id`, `name`, `brand`, `technology`, `notes` | Ranking y ficha técnica |
| Tamaño y espacio | `lengthMm`, `widthMm`, `heightMm`, `wheelbaseMm`, `groundClearanceMm`, `trunkLiters`, y la derivada L/m² | Todo menos `wheelbaseMm` |
| Mecánica y prestaciones | `powerCv`, `weightKg`, `acceleration0to100`, `consumption` | Solo dentro del desglose de sus ejes |
| Coste | `priceEur`, `maintenanceEurYear`, `residualPct5y` | Precio y mantenimiento, en el desglose de `coste`; el residual no lo usa ningún eje |
| Fiabilidad y respaldo | `reliabilityOcu`, `warrantyYears`, `warrantyExtension` | En el desglose de `fiabilidad` |
| Juicio propio | `aestheticsExterior`, `aestheticsInterior`, `travelComfort` | Editables desde el desglose |
| **Fotos** | `photos`: `front`, `side`, `rear`, `trunk`, `interior` | **No existen** |

Cada dato conserva la forma que ya tiene: `SourcedValue<T>` para lo que viene
de fuera, `UserRating` para el juicio propio. Esta spec **no cambia ni un
campo existente**; los declara como conjunto y añade el séptimo bloque.

### 2. La forma de una foto

`photos` se declara en `Car` **y** en `Reference`, con las cinco vistas
opcionales una a una y el bloque entero con valor por defecto vacío:

```ts
export const PhotoSchema = z.object({
  /** Absoluta y https: la sirve un tercero, no este despliegue. */
  url: z.string().url().startsWith('https://'),
  /** De dónde sale la imagen: medio, fabricante o autor. */
  credit: z.string().min(1),
  /** Qué se ve: versión, acabado y color, en las palabras del catálogo. */
  shows: z.string().min(1),
});

export const PhotosSchema = z
  .object({
    front: PhotoSchema.optional(),
    side: PhotoSchema.optional(),
    rear: PhotoSchema.optional(),
    trunk: PhotoSchema.optional(),
    interior: PhotoSchema.optional(),
  })
  .default({});
```

**Las imágenes se enlazan, no se copian.** El catálogo guarda la URL del
tercero y este despliegue no aloja ninguna imagen. Para que esa decisión sea
reversible sin tocar la interfaz, la URL que acaba en el atributo `src` sale
de **una única función** —`photoSrc(photo)`, en `src/domain/`— que hoy
devuelve `photo.url` tal cual. Copiar las sesenta imágenes a `public/` más
adelante sería cambiar esa función y nada más.

**Por qué no reutiliza `sourcedValueSchema`.** Ese formato existe para
arbitrar entre mediciones que se contradicen y para marcar lo estimado: una
foto no se estima ni compite con otra medición de sí misma. Lo que sí necesita
es lo que ninguna magnitud numérica necesita —de quién es la imagen y **qué
versión enseña**—, y por eso `credit` y `shows` son obligatorios en cuanto hay
foto. `shows` no es decorativo: el catálogo fija que el CR-V es la HEV 4x4 y
que el Corolla Cross es el 140H, y una foto de otro acabado —otras llantas,
otro paragolpes, otra parrilla— enseña un coche que no es el que se puntúa.

### 3. Qué encuadre tiene cada vista

La comparación solo funciona si las cinco vistas significan lo mismo en los
doce modelos. La convención es requisito de la spec, no consejo:

| Vista | Encuadre exigido |
| --- | --- |
| `front` | Frontal recto, coche centrado y ruedas rectas. No vale un tres cuartos |
| `side` | **Lateral estricto a 90º**, coche completo y horizonte recto. Es la vista que permite comparar siluetas: si solo se consigue una, que sea esta |
| `rear` | Trasera recta con el **portón cerrado** |
| `trunk` | Portón abierto, **asientos traseros sin abatir** y maletero vacío, que es la configuración en la que están medidos los litros del catálogo |
| `interior` | Vista general del habitáculo delantero —salpicadero, volante y consola en el mismo encuadre—, no un detalle |

Se prefiere foto de estudio o fondo neutro, y color claro en el lateral: un
coche oscuro sobre fondo oscuro parece más pequeño de lo que es, y esta
aplicación existe para comparar tamaños.

### 4. Qué pasa cuando no hay foto

1. Las fotos **no son requisito de alta**, y **no hay mínimo de vistas**: un
   modelo sin ninguna foto aparece entero, con todos sus datos y su nota,
   exactamente como hoy, y con su columna completa en la vista nueva.
2. Una vista sin foto renderiza un **hueco visible con el rótulo de la vista**
   («Lateral — sin foto»), nunca una imagen rota ni un espacio en blanco.
3. Una foto declarada que **falla al cargar** degrada al mismo hueco.
4. El hueco ocupa **lo mismo** que ocuparía la foto: la rejilla no se
   descoloca según qué modelos tengan material.

### 5. Cómo se renderiza

1. `alt` **siempre** presente y descriptivo, en español, nombrando modelo y
   vista: «Kia EV3, vista lateral». Nunca decorativa, nunca vacía.
2. Hueco de **relación de aspecto fija** y `object-fit: contain`: recortar
   deforma la comparación justo en los extremos que importan —morro y cola—,
   así que la imagen se ajusta dentro del hueco y no al revés.
3. `loading="lazy"` y `decoding="async"`: doce modelos por cinco vistas son
   sesenta peticiones a terceros y ninguna es crítica para la primera
   pantalla.
4. `referrerpolicy="no-referrer"`: la visita no le cuenta al host de la imagen
   desde qué página se la pide.
5. Las medidas y el hueco salen de los tokens de `technical/0004` (ADR 0006).
   Ningún literal de color, espaciado o radio fuera de la hoja de tokens.

### 6. Las fotos no tocan la puntuación

Ni `scoreCatalog` ni ningún `AxisBreakdown` leen `photos`. El campo no aparece
en ningún desglose, ni como `info`. La regla se comprueba sola: el snapshot de
puntuación no debe cambiar ni un dígito al añadir las sesenta fotos.

### 7. Comprobación de enlaces, bajo demanda y fuera del gate

Un enlace a un recurso de terceros se rompe en silencio: el dato sigue en el
JSON, valida, y lo único que falla es lo que se ve. Se añade un script
(`npm run check:photos`) que pide cada URL y reporta su código HTTP.

**No entra en la CI obligatoria.** Convertir un tercero en condición de merge
importa su disponibilidad a este repositorio, que es justo lo que
`docs/proceso/ci-y-guardarrailes.md` evita. Se ejecuta a mano, y su resultado
del día es lo que sostiene el criterio de aceptación correspondiente.

### 8. La pantalla: una columna por modelo

**8.1 Una vista nueva, la tercera.** Se añade al conmutador
(`ViewSwitcher`), rotulada **«Ficha completa»** y con fragmento
`#/ficha-completa`, por el mismo mecanismo de `useHashRoute` que ya usan la
explicación y la ficha técnica. Se rotula así y no «Ficha del modelo» para
que nadie tenga que distinguir «ficha» de «ficha técnica» por el contexto.

**8.2 La tabla va transpuesta.** Una **columna por modelo** —los once
candidatos y la Giulietta— y una **fila por característica**, con las
dieciocho magnitudes de los seis bloques del requisito 1, agrupadas y con un
encabezado de bloque por grupo. Es la disposición que responde a la pregunta
de esta vista: **la misma característica en varios modelos a la vez**. El
desplazamiento horizontal vive **dentro del contenedor de la tabla**; la
página nunca se desplaza en horizontal a ningún ancho, que es invariante
declarada en `docs/estado/interfaz.md`.

**8.3 La columna de comparación la elige el usuario, y queda fija.** Junto a
la de **nombres de característica** —que no es un modelo y siempre está a la
izquierda, sin ella una fila desplazada es una cifra sin etiqueta— hay una
segunda columna fija: la del modelo **contra el que se quiere comparar**. No
es siempre la Giulietta.

1. Cada cabecera de modelo lleva una **marca de selección**. La que está
   marcada es la columna fija; marcar otra la sustituye. La Giulietta viene
   marcada al abrir la vista, porque es el coche a sustituir y es la
   comparación que el proyecto existe para hacer.
2. **Es una elección única, y se declara como tal**: aunque se dibuje como
   una casilla, el control es un grupo de `radio` con un nombre común y una
   etiqueta accesible por modelo («Comparar contra el Kia EV3»). Un grupo de
   `checkbox` de los que solo uno puede estar marcado le miente al lector de
   pantalla sobre lo que va a pasar al pulsarlo.
3. El modelo fijado **sale de la secuencia desplazable**: aparece una vez, no
   dos, y desplazarse no lo trae de vuelta.
4. **Es la misma mecánica en todos los anchos, sujeto a la corrección del
   2026-08-07 que reescribe el requisito 9.** Se pensó así: la columna de
   características y la fijada se quedan quietas a cualquier ancho, y las
   demás desfilan al lado. En la práctica, por debajo de `--bp-columna`
   (37rem) esas dos columnas fijas dejaban solo **una** columna de modelo
   legible, y ganaban una franja de sitio que hoy se reparte entre dos
   columnas de modelo enteras. Por encima de `--bp-columna` la mecánica no
   cambia: la de características y la fijada se quedan quietas, y las demás
   desfilan al lado.
5. **Qué columna está fijada es estado efímero**, como la foto elegida (8.6):
   no se persiste ni viaja en el enlace compartible de `product/0012`.

**8.4 Las fotos son la cabecera de cada columna.** Van dentro de la celda de
encabezado de su modelo, no en una tira aparte: así el ancho de la foto es el
ancho de la columna por construcción, y no hay dos desplazamientos que
sincronizar. Se ajustan al ancho de la columna con la relación de aspecto y
el `contain` del requisito 5. Al pulsarlas se **amplían** sobre la pantalla,
con `credit` y `shows` como pie. La ampliación:

- se abre con ratón, con teclado (`Enter`/`Espacio` sobre un control real,
  no un `div` con `onClick`) y con lector de pantalla;
- se cierra con `Escape`, pulsando fuera y con un botón de cierre visible;
- devuelve el foco al control que la abrió;
- no añade ninguna dependencia: es `<dialog>` del navegador, no una librería.

**8.5 Un selector elige qué vista se enseña.** Cinco opciones —frontal,
lateral, trasera, maletero, interior— y **una sola activa a la vez** para
todos los modelos: la tira de cabeceras enseña siempre lo mismo de cada
coche, que es lo que la hace comparable. Arranca en **lateral**, que es la
vista que más dice de la silueta. El modelo que no tenga esa foto muestra el
hueco rotulado del requisito 4, no una columna más estrecha.

**8.6 La foto elegida es estado efímero.** No se persiste ni viaja en el
enlace compartible de `product/0012`, igual que no lo hace qué fila del
ranking está desplegada: es una preferencia de lectura del momento.

**8.7 Esta vista no puntúa ni edita.** Ni notas, ni pesos, ni valoraciones
editables: las tres de `UserRating` se enseñan con su valor y se siguen
editando solo desde el desglose del ranking, que es su único sitio.

### 9. El móvil, que es donde esto se pone difícil

Una tabla de doce columnas en 320px de ancho no cabe de ninguna manera.

> **Corrección del 2026-08-07.** La primera versión de este requisito
> mantenía la columna de características y la fijada quietas a cualquier
> ancho (requisito 8.3), y por debajo de `--bp-columna` eso dejaba sitio para
> **una sola** columna de modelo legible junto a las dos fijas. Comparar de
> uno en uno en el ancho donde más se usa la aplicación resultó una mala
> experiencia: mucho scroll vertical para leer poco por pantalla. Esta
> versión libera esa franja quitando ambas columnas fijas por debajo de
> `--bp-columna` y repartiendo el ancho entero entre modelos, así que **lo
> que se enseña en un móvil pasa a ser dos modelos cualesquiera de la
> secuencia**, no necesariamente el fijado y su vecino. El requisito sigue
> siendo el mismo: no es que quepa todo, es que lo que se ve se lea entero.

1. **Por debajo de `--bp-columna` (37rem) no hay columna de características
   ni columna fija.** El rótulo de cada característica —«Longitud»,
   «Potencia»...— se repite dentro de cada celda de dato en vez de vivir en
   una columna aparte, y el modelo elegido para comparar (requisito 8.3) deja
   de estar pegado a la izquierda: es una columna desplazable más, la
   primera de la secuencia. Se ven **dos columnas de modelo completas**, de
   `9rem` cada una, con cifras del mismo tamaño que el resto de la
   aplicación. La cabecera de bloque —«Tamaño y espacio», «Mecánica y
   prestaciones»...— sigue ocupando el ancho completo, sin cambios: sigue
   siendo el separador entre grupos de características.
2. **Anclaje de desplazamiento** (`scroll-snap-type: x mandatory`, con cada
   columna de modelo como punto de anclaje, incluida la que esté fijada): el
   gesto cae siempre en un modelo completo, nunca entre dos. Al no haber ya
   columnas que se queden quietas, desplazarse saca de pantalla al modelo
   fijado igual que a cualquier otro — dejó de ser una comparación cerrada
   contra él en cada parada, y pasó a ser explorar la secuencia entera de
   dos en dos.
3. **La marca de selección sigue siendo alcanzable en móvil**: se llega a
   ella desplazándose hasta la cabecera del modelo que se quiere fijar, y al
   marcarla la tabla vuelve al principio del desplazamiento — así el modelo
   recién fijado abre la secuencia en vez de quedar fuera de pantalla justo
   al elegirlo.
4. **En escritorio la mecánica no cambia**: por encima de `--bp-columna` la
   columna de características y la fijada vuelven a quedarse quietas, las
   columnas de modelo miden `11rem` y se ven todas las que quepan, con la
   fijada siempre a la izquierda —la mecánica original del requisito 8.3—.
   Solo hay una media query, y solo cambia qué columnas son fijas y cuánto
   miden las de modelo; no hay un tercer diseño intermedio.
5. **La fila del nombre del modelo queda fija arriba** al desplazarse en
   vertical. La foto **no**: ocupa demasiado alto para llevarla pegada toda
   la lectura, y su sitio es el principio.
6. **El contenedor desplazable es alcanzable con teclado** (`tabindex="0"`,
   `role="group"` y `aria-label`), porque una región que solo se desplaza con
   gesto deja fuera a quien navega con teclado.
7. **Ningún objetivo pulsable baja de 44×44px** de área accionable —foto,
   marca de selección, opciones del selector y botón de cierre incluidos—,
   como el resto de la interfaz desde `product/0010`.
8. **Se verifica a mano en los tres anchos** de `product/0010` (320, 768 y
   1440px): el CSS no lo comprueba la CI, y esta vista es justo la que más
   depende de él.

## Criterios de aceptación

> Obligatorios y verificables.

- [x] `CarSchema` y `ReferenceSchema` aceptan `photos`, y un registro **sin**
      `photos` sigue cargando sin error (test de `loadCatalog`).
- [x] Una `url` que no sea absoluta `https` falla la carga nombrando el coche
      y la vista, no con un error genérico (test).
- [x] Una foto sin `credit` o sin `shows` falla la carga (test).
- [x] Cada `img` renderizada lleva `alt` no vacío que nombra modelo y vista
      (test de render).
- [x] Una vista sin foto renderiza el hueco rotulado y **ninguna** etiqueta
      `img` (test de render).
- [ ] El hueco mide lo mismo con foto y sin ella, en los tres anchos de
      `product/0010` (revisión visual: el CSS no lo comprueba la CI. Pendiente
      de revisar en navegador).
- [x] `scoreCatalog.snapshot.test.ts` pasa **sin tocarlo** tras cargar el
      catálogo con fotos.
- [x] Los once candidatos y la Giulietta tienen las cinco vistas, o las que
      falten quedan registradas como deuda con su modelo y su vista.
      **37 de las 60 fotos posibles están cargadas** —de Wikimedia Commons,
      con `credit` y `shows` verificados contra el acabado real cuando la
      nota del catálogo lo exige (CR-V AWD, no la 4x2; NX 350h, no el
      300h)—; solo `toyota-corolla-cross` tiene las cinco. De las 23 vistas
      que faltan, 11 son de maletero (todos los modelos salvo el Corolla
      Cross), 8 de interior, 3 de lateral y 1 de trasera. Quedan registradas
      como deuda en `docs/roadmap.md`, con su modelo y su vista.
- [x] `npm run check:photos` responde 2xx en todas las URLs declaradas el día
      de la verificación. **37/37 en verde** el 2026-08-06.
- [ ] La vista nueva existe en `#/ficha-completa`, está en el conmutador y
      recargar esa dirección la abre (no da 404 bajo el subpath de Pages).
      Lo primero, hecho y probado; lo segundo exige el despliegue real, igual
      que la misma deuda abierta para `product/0011` y `product/0013`.
- [x] La tabla tiene una columna por candidato más la de referencia, y una
      fila por cada una de las dieciocho magnitudes, agrupadas por bloque
      (test de render: se cuentan filas y columnas).
- [ ] En escritorio (≥`--bp-columna`), al desplazar en horizontal, la columna
      de características y la del modelo fijado permanecen visibles; por
      debajo de `--bp-columna` ninguna columna es fija (requisito 9,
      corrección 2026-08-07) (revisión visual en los tres anchos. Pendiente
      de revisar en navegador).
- [x] Cada celda de dato lleva su propio rótulo de característica, oculto por
      CSS en escritorio y visible por debajo de `--bp-columna` (requisito
      9.1, test de render: se cuenta un rótulo por columna en una magnitud;
      correcto por construcción para el resto — todas las celdas de dato
      pasan por el mismo marcado).
- [x] La cabecera de columna «Característica» no es visible, solo accesible
      por lector de pantalla (requisito 8.3, test de render).
- [x] La vista abre con la Giulietta fijada, y marcar la cabecera de otro
      modelo la sustituye como columna fija (test de render del estado
      inicial; el cambio, revisión manual — `renderToStaticMarkup` no marca,
      pero el cableado es directo: un único `useState` compartido).
- [x] El modelo fijado no aparece además entre las columnas desplazables
      (test de render: su nombre sale una vez).
- [x] Los controles de fijación son un grupo `radio` con el mismo `name` y
      etiqueta accesible por modelo, no casillas independientes (test de
      render sobre el marcado).
- [ ] A 320px se leen enteras **dos** columnas de modelo completas, sin
      columna de características aparte y sin que ninguna cifra se parta
      (requisito 9.1, corrección 2026-08-07) (revisión visual. Pendiente de
      revisar en navegador).
- [x] El selector cambia la foto de **todas** las columnas a la vez, y
      arranca en lateral (test de render sobre el estado inicial; el cambio
      es correcto por construcción — todas las cabeceras leen el mismo
      `photoView`).
- [ ] La foto se abre ampliada con teclado, se cierra con `Escape` y el foco
      vuelve al control que la abrió (revisión manual: los tests de `ui/`
      usan `renderToStaticMarkup` y no hacen clic — deuda ya registrada).
- [ ] La página no se desplaza en horizontal a 320, 768 ni 1440px; el
      desplazamiento ocurre dentro del contenedor de la tabla (revisión
      visual. Pendiente de revisar en navegador).
- [x] La configuración compartible de `product/0012` no cambia de forma: el
      enlace no lleva qué foto está elegida (test de `configUrl`, sin tocar:
      la foto y el modelo fijado viven en estado local de la página, no en
      `AppConfig`).
- [x] La CI entera pasa en local: `format:check`, `lint`, `typecheck`,
      `arch:check` y `test:coverage`, con cobertura al 100%.

## Dependencias y supuestos

- **Depende de `product/0013`**, que trajo la vista de ficha técnica y la fila
  de referencia. Esta spec la extiende; no la reescribe.
- **Depende de `product/0011`** para la navegación por fragmento de URL y de
  `technical/0004` para los tokens: la vista nueva reutiliza las dos piezas y
  no monta enrutador ni paleta propios.
- **Tres vistas de datos van a convivir** —clasificación, ficha técnica y
  ficha completa—, y las cinco medidas aparecen en dos de ellas. Es
  deliberado: una lleva Δ contra la referencia y la otra lleva las dieciocho
  magnitudes. Si al usarlas la duplicidad molesta, la que sobra es la de
  `product/0013`, y retirarla sería spec propia.
- **Uso personal y sin ánimo de lucro**, sin publicidad ni monetización: es lo
  que hace aceptable enseñar fotografía de prensa ajena. Se prefiere el medio
  oficial del fabricante como origen, y `credit` lo deja escrito en cada foto.
- **Quien recopila las URLs comprueba la versión**: la foto tiene que
  corresponder al modelo que el catálogo puntúa, y `shows` lo declara.
- **GitHub Pages sirve sin cabeceras propias** (ADR 0003): no hay `CSP` que
  restrinja `img-src`, así que un dominio externo carga sin configurar nada.
  El reverso es que tampoco hay dónde restringirlo si algún día se quisiera.

## Decisiones abiertas

> Las cuatro que esta spec abrió se cerraron el 2026-08-06, y su respuesta
> está en los requisitos, no aquí: **enlazar** las imágenes en vez de
> copiarlas (requisito 2), **sin mínimo de vistas** para dar de alta un
> modelo (requisito 4.1), **las dieciocho magnitudes** en la ficha
> (requisito 8.2) y **una pantalla nueva** con una columna por modelo,
> desplazamiento horizontal, la foto como cabecera de columna y la columna
> de comparación elegible desde su cabecera (requisitos 8 y 9).

Ninguna.
