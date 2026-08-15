# 0010 — La barra de la ficha: cuatro controles con la misma forma

- **Id:** technical/0010
- **Estado:** verified
- **Tipo:** technical
- **Fecha:** 2026-08-14
- **Specs relacionadas:** product/0014, product/0018, product/0020,
  technical/0005, technical/0009
- **ADRs relacionados:** 0006
- **Doc de estado:** `docs/estado/interfaz.md`

> ⚠️ **Spec histórica — implementada, sin consolidar.** Describe un cambio ya
> implementado: su sección *Contexto* retrata el sistema **anterior** al
> cambio y hoy no es cierta. **No es referencia del estado actual** — para
> eso, ver el **Doc de estado** indicado arriba. Vigentes aquí los
> **criterios de aceptación**, como registro de verificación.

## Contexto

La barra de herramientas de `#/ficha` tiene cuatro controles y ocupa **tres
filas** en un móvil. Medido sobre el build de producción, con Playwright:

| Ancho | Filas | Alto de la barra |
| --- | --- | --- |
| 390px | **3** | **221px** |
| 592px | 2 | 133px |
| 960px y más | 1 | 69px |

Los 221px de un móvil son casi un tercio de la pantalla gastados antes de que
empiece la tabla, que es lo que la vista existe para enseñar. Y no es solo
tamaño: la barra tampoco se lee como un conjunto. Cuatro causas, de las que
únicamente una es «no caben»:

1. **El cuarto control no tiene la forma de los otros tres.** «Campos»,
   «Comparar contra» y «Orden» son `.toolbarControl` —columna, etiqueta
   encima—; «Vista de la foto» es `.viewSelector` —fila, etiqueta al lado—.
   Eso lo hace medir **265px frente a los 122–143px** de los demás, y es ese
   bloque, él solo, el que fuerza el salto de línea.
2. **Las etiquetas cuestan más ancho que los datos que rotulan.** Las cuatro
   usan el primitivo `label`: 11px monoespaciados, versalitas y
   `--letter-spacing-widest` (0,14em). «VISTA DE LA FOTO» son unos 145px de
   etiqueta para un valor que dice «Lateral».
3. **«Comparar contra» no es un selector.** Es un `<span>` de rótulo más un
   radio suelto con **una sola opción**, «Ninguno», metido en una caja con
   borde (`.noneOption`). Se lee como un control roto o a medio hacer, porque
   la elección de verdad no está ahí: está arriba, en los radios de las
   cabeceras de columna. La caja existe porque «Ninguno» no tiene una columna
   propia donde vivir, no porque sea un control.
4. **`align-items: flex-end` sobre `flex-wrap` con anchos dispares** deja el
   conjunto irregular: cada caja empieza y acaba donde le toca.

Comprobado inyectando CSS sobre la página real: solo con igualar la forma de
los cuatro y meterlos en una rejilla, el móvil baja a **2 filas y 149px** y el
escritorio deja de depender de la suerte —hoy los cuatro suman 713px de
contenido y caben en una fila por poco—.

## Objetivo

Que los cuatro controles de la ficha sean el mismo objeto, ocupen la mitad de
alto en móvil y se lean como una barra de filtros y no como cuatro cajas
distintas de anchos distintos.

## Alcance

- La forma visual de los cuatro controles de la barra y su distribución.
- El control de comparación de la barra, que pasa de radio suelto a `<select>`.
- Los rótulos de los cuatro, que se acortan.
- Los primitivos compartidos que ese cambio obliga a factorizar.

## Fuera de alcance

- **Los radios de las cabeceras de columna** (`.pinLabel`/`.pinInput`): siguen
  siendo el control principal de la comparación y no cambian ni de marcado ni
  de aspecto.
- **Qué enseña la tabla**: los conjuntos de campos, las magnitudes, las Δ, su
  polaridad y su formato son de `product/0018` y `product/0020`, y no se tocan.
- **Las fotos**: de dónde salen, cómo se encuadran y el diálogo de ampliación
  son de `product/0014` y `product/0016`. Aquí solo cambia el aspecto del
  selector que elige la vista.
- **Persistir la elección.** El modelo fijado, el conjunto de campos, el orden
  y la vista de foto siguen siendo estado efímero, como ya declaran
  `product/0014` y `product/0018`: no entran en `AppConfig` ni viajan en el
  enlace compartible de `product/0012`.
- **Plegar la barra tras un botón en móvil.** Se consideró y se descarta: los
  cuatro controles siguen visibles a cualquier ancho.
- **La jerarquía tipográfica** (`--font-size-2xl` y `--font-size-lg` sin
  consumidor), que es su propia deuda en `docs/roadmap.md`.

## Requisitos / comportamiento esperado

### 1. Una pastilla, cuatro veces

1.1. Cada uno de los cuatro controles es una **pastilla**: una sola caja con
borde, radio y sombra de control, de `--size-touch-min` de alto, con el rótulo
dentro a la izquierda y el `<select>` a la derecha, pegado a su flecha. Deja de
haber rótulo fuera de la caja, que es lo que hoy hace que cada control cueste
69px de alto (17 de rótulo + 8 de hueco + 44 de control) en vez de 44.

1.2. El rótulo de la pastilla **no va en versalitas** ni con
`--letter-spacing-widest`. Sigue siendo monoespaciado y apagado
(`--color-mute`), que es lo que lo distingue del valor, pero deja de ocupar
casi el doble de lo que mide su propio texto.

1.3. Los rótulos se acortan donde sobra palabra: **«Vista de la foto» → «Foto»**
y **«Comparar contra» → «Comparar»**. «Campos» y «Orden» ya son mínimos.

1.4. **El rótulo va encima del valor dentro de la pastilla, y siempre**, no al
lado. Es la conclusión de medir el peor caso: «Comparar» más el nombre de
modelo más largo del catálogo —«Kona Eléctrico»— pide unos 240px de pastilla en
una sola línea, y por debajo de 1200px de ventana no hay ancho de columna que
lo dé. Las otras dos salidas se probaron y se descartan por escrito:

- Dejar que **cada pastilla se parta sola** cuando su contenido no cabe
  —`min-width: min-content` en el `<select>`— daba una barra con pastillas de
  dos alturas distintas según la fila, y además empujaba la columna de la
  rejilla hasta **desbordar el documento en horizontal** a 320px, que es lo que
  `product/0010`, requisito 13, prohíbe.
- **Forzar una sola línea** recortaba el valor a media palabra —«Esencial» en
  vez de «Esenciales»— de forma distinta en cada control, porque lo que cada
  uno necesita depende de su propio texto.

Dos líneas siempre es la única de las tres que da la misma altura a las cuatro
pastillas a **cualquier** anchura, que es lo que hace que la barra se lea como
un conjunto.

1.5. **La pastilla entera es área accionable.** El `<select>` ocupa el
rectángulo completo y el rótulo va flotando encima con `pointer-events: none`;
si el rótulo ocupara sitio en el flujo, el control se quedaría en 24px de alto
y solo esa franja abriría el desplegable, por debajo del mínimo de 44px que
exige `product/0010`, requisito 8. El rótulo sigue siendo un `<label>`
asociado, así que para un lector de pantalla nada de esto cambia.

### 2. La barra es una rejilla, no una fila que envuelve

2.1. La barra pasa de `flex-wrap` a `display: grid` con columnas de ancho
mínimo declarado y reparto a partes iguales. A cualquier ancho las pastillas
miden lo mismo y quedan alineadas entre sí, en vez de escalonadas.

2.2. La distribución sale de la propia rejilla, **sin una sola media query**:
dos columnas en pantalla estrecha —los cuatro en 2×2— y una fila cuando cabe.
Es la única forma responsive de esta vista que no repite un punto de ruptura.

2.3. El ancho mínimo de columna se declara como **token** en
`src/styles/global.css`. Un `rem` suelto en un `.module.css` lo tumba
`scripts/validateStyleTokens.ts`, y con razón.

### 3. «Comparar» pasa a ser un selector de verdad

3.1. El radio suelto de la barra desaparece y en su lugar hay un `<select>`
cuyas opciones son **«Ninguno» más todos los modelos de la tabla**. Los cuatro
controles pasan así a ser el mismo objeto, y deja de haber una caja que parece
un control sin serlo.

3.2. Las opciones van **ordenadas por el criterio de orden vigente**, con la
misma `sortFicha` que ordena las columnas — no por el orden real de columna,
donde el modelo fijado va primero, porque entonces la opción elegida saltaría
al primer puesto justo al elegirla.

3.3. El `<select>` y los radios de cabecera **escriben el mismo estado**
(`comparisonId`), así que están sincronizados por construcción: elegir en uno
marca el otro. Elegir por cualquiera de los dos vuelve a llevar la tabla al
principio, que es lo que `handleComparisonChange` ya hace hoy.

3.4. **«Ninguno» sigue siendo la única forma de apagar las Δ.**
`product/0018`, requisito 2.3, lo fija así —«comparar contra nadie» y «no
enseñar diferencias» son la misma cosa dicha dos veces— y esta spec no lo
cambia: lo que desaparece es la caja aparte, no la opción.

3.5. **Esto enmienda `product/0018`, requisito 2.2**, que dice que el modelo de
comparación se fija «con el control que ya existe en la cabecera de cada
columna». A partir de aquí hay un segundo control para lo mismo. `product/0018`
está `consolidated`, así que **no se edita**: la enmienda se registra aquí y se
pliega en `docs/estado/interfaz.md`, igual que `technical/0007` enmendó a
`technical/0005` y `technical/0009` a `product/0009`.

### 4. Los primitivos que esto obliga a factorizar

4.1. `.select` (technical/0009) es hoy superficie *más* comportamiento de
selector en una sola clase. La pastilla necesita esa misma superficie con otra
cosa dentro, así que la superficie se extrae a `.controlSurface` —fondo, borde
de pelo, radio, sombra de control y sus estados— y `.select` pasa a
componerla. **El aspecto de `.select` no cambia**, y el `<select>` de la
cabecera en móvil, que lo compone, tampoco.

4.2. Se declaran `.field` (la pastilla), `.fieldLabel` (el rótulo de dentro) y
`.fieldSelect` (el `<select>` desnudo que vive dentro de la pastilla, sin
superficie propia porque ya la pone la pastilla). Con ellos desaparecen de
`FichaPage.module.css` las cinco clases que hoy hacen este trabajo:
`.toolbarControl`, `.toolbarSelect`, `.viewSelector`, `.viewSelect` y
`.noneOption`.

### 5. Lo que no puede empeorar

5.1. Cada `<select>` conserva su `<label>` asociado y su nombre accesible. El
rótulo de la pastilla **es** ese `<label>`: se mueve de sitio, no se sustituye
por texto decorativo ni se esconde.

5.2. El anillo de foco lo dibuja el `<select>` interior, y **debe verse entero**,
sin que lo recorte la pastilla que lo contiene.

5.3. Los cuatro siguen siendo alcanzables y manejables con teclado, y el
objetivo táctil sigue siendo de al menos 44px de alto (`product/0010`,
requisito 8).

## Criterios de aceptación

> Obligatorios y verificables.

- [x] A 390px la barra ocupa **como mucho 2 filas** y **no más de 120px** de
      alto, frente a las 3 filas y 221px de hoy. Medido sobre el build de
      producción, no estimado: **2 filas y 120px**, el mismo resultado de 320 a
      768px —donde antes eran 3 filas y 221px por debajo de 592, y 2 filas y
      133px por encima—.
- [x] A 960 y 1440px la barra ocupa **una sola fila**, y las cuatro pastillas
      tienen el mismo ancho y la misma altura. Medido: **1 fila y 54px**,
      frente a los 69px de hoy; anchos idénticos (223px a 960, 283px a 1440) y
      alturas idénticas (54px) a los siete anchos probados.
- [x] Los cuatro controles son `<select>`: no queda en la barra ningún radio
      ni ninguna caja que no sea una pastilla.
- [x] El `<select>` de comparación lista «Ninguno» más todos los modelos, en el
      orden que fija el criterio de orden vigente.
- [x] Elegir un modelo en el `<select>` marca el radio de esa columna, y marcar
      un radio de cabecera actualiza el `<select>`. Comprobado en las **dos**
      direcciones sobre un navegador real, y repetido tras el cambio de
      maquetación de la pastilla.
- [x] Elegir por el `<select>` devuelve la tabla al principio de su
      desplazamiento horizontal, igual que hacía el radio. Comprobado:
      `scrollLeft` a 0 tras elegir.
- [x] Con «Ninguno» elegido no se muestra ninguna Δ, y la columna fijada
      desaparece — el comportamiento que `product/0018` fija, intacto.
      Comprobado sobre el DOM: cero celdas con Δ y cero cabeceras fijadas.
- [x] Cada `<select>` tiene su `<label>` asociado y nombre accesible, los
      cuatro se alcanzan con tabulador —en el orden campos → comparación →
      orden → foto— y el anillo de foco se ve entero, sin recortar: rodea la
      pastilla completa, porque el control ocupa la pastilla completa.
- [x] **La pastilla entera es un objetivo táctil de al menos 44px** (requisito
      1.5). Medido sobre el elemento renderizado: la pastilla mide 54px y el
      `<select>` de dentro 52px, a 320 y a 1440px. Antes de mover el rótulo
      fuera del flujo, el `<select>` medía 24px.
- [x] **Ninguna pastilla recorta su valor a ninguna anchura** (requisito 1.4),
      y el documento no se desplaza en horizontal a ninguna de las siete
      probadas —incluida la de 320px con «Kona Eléctrico», el nombre más largo
      del catálogo, elegido—.
- [x] `.select` mantiene su aspecto: el `<select>` de la cabecera en móvil se
      ve exactamente igual que antes de este cambio — sigue componiendo la
      misma superficie, que es lo único que se ha factorizado.
- [x] Ningún `.module.css` declara un literal de diseño: el ancho mínimo de
      columna de la rejilla es un token.
      `scripts/validateStyleTokensRepo.test.ts` en verde.
- [x] `npm run format:check`, `npm run lint`, `npm run typecheck`,
      `npm run arch:check`, `npm run test:coverage` y `npm run build` pasan en
      local antes de dar la spec por implementada. 376 tests, cobertura 100 %.
- [x] Las únicas aserciones de `FichaPage.test.tsx` que cambian son las dos que
      miran el radio «Ninguno» de la barra, que pasan a mirar la opción
      equivalente del `<select>`. Las que comprueban el grupo `pinned-model` de
      las cabeceras siguen intactas y en verde.

## Dependencias y supuestos

- Depende de `technical/0009`, que trajo `.select`, `--icon-chevron` y
  `--shadow-control`; esta spec los reutiliza y solo factoriza la superficie
  común, sin inventar aspecto nuevo.
- Depende de `product/0018` para el comportamiento de la comparación, que
  conserva salvo en lo que el requisito 3.5 declara explícitamente.
- Se asume que un `<select>` nativo sigue siendo preferible a un desplegable a
  medida, por el mismo motivo que ya recogió `technical/0006`: es accesible por
  construcción y no hay que gestionarle el cierre.
- Se asume que tener **dos** controles para la comparación —el `<select>` de la
  barra y los radios de cabecera— es deseable y no una duplicación a corregir:
  el de cabecera es directo sobre la columna que se está mirando, el de la
  barra es alcanzable sin desplazar la tabla en horizontal para encontrar la
  columna. Es una decisión del usuario, tomada con la duplicación sobre la
  mesa.

## Decisiones abiertas

Ninguna.
