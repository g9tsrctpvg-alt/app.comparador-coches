# 0014 — La ficha del modelo y sus fotos

- **Id:** product/0014
- **Estado:** draft
- **Tipo:** product
- **Fecha:** 2026-08-06
- **Specs relacionadas:** product/0001, product/0009, product/0010, product/0013
- **ADRs relacionados:** 0003, 0006
- **Doc de estado:** `docs/estado/dominio.md`, `docs/estado/interfaz.md`

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
- **Más de una foto por vista y modelo.** Ni galería, ni carrusel, ni zoom,
  ni fotos por acabado o color: una foto por vista, y punto.
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

1. Las fotos **no son requisito de alta**: un modelo sin ninguna aparece
   entero, con todos sus datos y su nota, exactamente como hoy.
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

## Criterios de aceptación

> Obligatorios y verificables.

- [ ] `CarSchema` y `ReferenceSchema` aceptan `photos`, y un registro **sin**
      `photos` sigue cargando sin error (test de `loadCatalog`).
- [ ] Una `url` que no sea absoluta `https` falla la carga nombrando el coche
      y la vista, no con un error genérico (test).
- [ ] Una foto sin `credit` o sin `shows` falla la carga (test).
- [ ] Cada `img` renderizada lleva `alt` no vacío que nombra modelo y vista
      (test de render).
- [ ] Una vista sin foto renderiza el hueco rotulado y **ninguna** etiqueta
      `img` (test de render).
- [ ] El hueco mide lo mismo con foto y sin ella, en los tres anchos de
      `product/0010` (revisión visual: el CSS no lo comprueba la CI).
- [ ] `scoreCatalog.snapshot.test.ts` pasa **sin tocarlo** tras cargar el
      catálogo con fotos.
- [ ] Los once candidatos y la Giulietta tienen las cinco vistas, o las que
      falten quedan registradas como deuda con su modelo y su vista.
- [ ] `npm run check:photos` responde 2xx en las sesenta URLs el día de la
      verificación.
- [ ] La CI entera pasa en local: `format:check`, `lint`, `typecheck`,
      `arch:check` y `test:coverage`.

## Dependencias y supuestos

- **Depende de `product/0013`**, que trajo la vista de ficha técnica y la fila
  de referencia. Esta spec la extiende; no la reescribe.
- **Uso personal y sin ánimo de lucro**, sin publicidad ni monetización: es lo
  que hace aceptable enseñar fotografía de prensa ajena. Se prefiere el medio
  oficial del fabricante como origen, y `credit` lo deja escrito en cada foto.
- **Quien recopila las URLs comprueba la versión**: la foto tiene que
  corresponder al modelo que el catálogo puntúa, y `shows` lo declara.
- **GitHub Pages sirve sin cabeceras propias** (ADR 0003): no hay `CSP` que
  restrinja `img-src`, así que un dominio externo carga sin configurar nada.
  El reverso es que tampoco hay dónde restringirlo si algún día se quisiera.

## Decisiones abiertas

Deben quedar vacías antes de pasar a `approved`.

1. **¿Enlazar o copiar?** Enlazar (lo propuesto) mantiene el catálogo como
   está y no mete binarios en el repositorio, pero deja la vista a merced de
   un tercero: enlaces que caducan, hosts que bloquean el enlazado directo y
   una IP de visitante que viaja a cada dominio. Copiar a `public/photos/`
   —sesenta imágenes, del orden de 5-8 MB en WebP— elimina las tres cosas a
   cambio de peso en el repositorio y de pasar de enlazar a redistribuir. Sea
   cual sea la respuesta, la URL de una foto se resuelve en **un solo punto**
   del código, de forma que cambiar de opinión no toque ni un componente.
2. **¿Dónde se ven?** Tres opciones: un bloque por modelo con las cinco vistas
   (lo natural para «ver la ficha entera»); una **tira de laterales sobre la
   tabla comparada, escalados a la longitud real de cada coche**, que es la
   forma más directa de enseñar el problema que el proyecto resuelve; o las
   dos. La segunda es funcionalidad nueva, no migración, y encarece la spec.
3. **¿Se exige un mínimo de vistas?** El requisito 4 dice que no, para no
   bloquear el alta de un modelo por una foto que no aparece. Cabe endurecerlo
   al lateral: sin él, la comparación visual no existe para ese coche.
4. **¿La ficha por modelo enseña las dieciocho magnitudes o un subconjunto?**
   El requisito 1 declara el conjunto completo; enseñarlo entero es una
   decisión distinta, y afecta a si la batalla deja de ser invisible.
