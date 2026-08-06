# 0010 — Diseño responsive real

- **Id:** product/0010
- **Estado:** implemented
- **Tipo:** product
- **Fecha:** 2026-08-06
- **Specs relacionadas:** product/0009, product/0011, technical/0004
- **ADRs relacionados:** 0006
- **Doc de estado:** `docs/estado/interfaz.md`

> ⚠️ **Spec histórica — implementada, sin consolidar.** Describe un cambio ya
> implementado: su sección *Contexto* retrata el sistema **anterior** al
> cambio y hoy no es cierta. **No es referencia del estado actual** — para
> eso, ver el **Doc de estado** indicado arriba. Vigentes aquí los
> **criterios de aceptación**, como registro de verificación.

## Contexto

El comparador se consulta en dos sitios muy distintos: en el escritorio,
mientras se ajustan pesos y supuestos, y en el móvil, delante del coche o en
el concesionario. Hoy no funciona bien en ninguno de los dos, y por el mismo
motivo: **no hay ninguna decisión de ancho tomada**.

`index.html` declara `<meta name="viewport" content="width=device-width,
initial-scale=1.0">`, que es la condición necesaria, y ahí acaba el trabajo.
Sin una sola línea de CSS, el contenido ocupa el ancho que tenga la ventana:

- En un monitor ancho, las líneas de texto del desglose se estiran de borde a
  borde. Una línea de 200 caracteres es medible: al llegar al final se pierde
  el principio de la siguiente.
- En un móvil, los seis `input[type="range"]` de los pesos están en `<label>`
  en línea, sin salto, y compiten por un ancho que no tienen. Los
  deslizadores del desglose, con paso de 0,5 sobre un rango de 1 a 5, exigen
  una precisión de arrastre que un dedo no da.
- Las líneas largas del desglose —normalizaciones con nombres de coche y dos
  cifras, fuentes descartadas con su motivo— no tienen a dónde partirse
  cómodamente.

El artefacto del que viene el proyecto está pensado para **560 px de ancho
máximo**: una columna centrada, sin una sola media query en todo el fichero.
Traer ese diseño tal cual no resuelve el problema, lo cambia de sitio —
pasaría de no funcionar en ningún sitio a funcionar en uno solo, con un
monitor de 27 pulgadas enseñando una columna estrecha rodeada de vacío.

El artefacto sí resuelve bien **un** caso, y conviene no perderlo: su tabla de
ficha técnica se desplaza en horizontal dentro de su propio contenedor, con la
columna del modelo fijada a la izquierda, de modo que doce columnas de datos
caben en un móvil sin que la página entera se mueva. Es exactamente la técnica
que el requisito 1 de esta spec generaliza.

Esta spec es lo que el roadmap llama «diseño responsive real»: no una hoja de
estilos con un par de media queries pegadas al final, sino una decisión sobre
qué pasa a cada tamaño.

## Objetivo

Que el comparador se use con comodidad desde 320 px hasta un monitor ancho,
sin scroll horizontal, sin líneas ilegibles y sin controles que no se puedan
accionar con el dedo.

## Alcance

- **Los puntos de ruptura**, con sus valores y su justificación, declarados
  como los tokens `--bp-*` que `technical/0004` establece.
- **La medida de línea**, acotada en el texto corrido del desglose y de la
  página de explicación, sin acotar por ello el ancho de la aplicación
  entera.
- **La composición del ranking a cada tamaño**: una columna en móvil; el
  ancho disponible aprovechado en escritorio sin estirar el texto.
- **La colocación de los controles** —pesos, supuestos, presupuesto— a cada
  tamaño: apilados y accesibles en móvil, sin obligar a desplazarse hasta el
  final para llegar al ranking.
- **El tamaño mínimo de los objetivos táctiles** y la separación entre ellos.
- **El comportamiento con zoom** hasta el 200 %, que es requisito de
  accesibilidad y no un caso raro.
- **El desbordamiento**: qué se parte, qué se recorta y qué obtiene su propio
  desplazamiento cuando no cabe.
- **La orientación apaisada en móvil**, donde la altura es la escasa.

## Fuera de alcance

- **La jerarquía visual y el diseño** en sí. Son `product/0009`. Esta spec
  decide cómo esa jerarquía sobrevive a cada ancho, no cuál es.
- **El andamiaje de tokens y media queries con nombre.** Es `technical/0004`.
  Aquí se fijan los **valores** de los puntos de ruptura y qué ocurre en cada
  uno.
- **Cambiar la información que se muestra según el tamaño.** Un móvil no ve
  una versión recortada del desglose: ve el mismo desglose, dispuesto de otra
  forma. Ocultar información en pantallas pequeñas es una decisión de
  producto distinta, y esta spec la rechaza explícitamente.
- **Funcionalidad exclusiva de un tamaño**, como comparar dos coches en
  paralelo aprovechando un monitor ancho. Es funcionalidad nueva, con su
  spec.
- **Aplicación instalable, modo sin conexión o *service worker*.** Nada de
  eso es diseño responsive, y no está pedido.
- **Soporte de navegadores antiguos.** Se asumen navegadores con soporte de
  *container queries*, `clamp()` y `dvh`: son los mismos a los que Vite 8 ya
  compila por defecto.

## Requisitos / comportamiento esperado

1. **No hay scroll horizontal a ningún ancho desde 320 px.** Es la invariante
   dura de esta spec: cualquier elemento que no quepa se parte, se ajusta o
   obtiene su propio contenedor con desplazamiento propio, y nunca empuja el
   ancho del documento.
2. Los **puntos de ruptura son dos**, declarados una sola vez como tokens
   `--bp-*`, con su motivo escrito junto a la declaración:

   | Token | Valor | Por qué ese valor |
   | --- | --- | --- |
   | `--bp-columna` | 592 px | Los 560 px de columna del artefacto más sus 16 px de relleno a cada lado. Por debajo, la columna deja de caber entera y el diseño pasa a ser de borde a borde; por encima, ya no crece |
   | `--bp-ancho` | 960 px | Donde caben dos columnas de contenido de medida legible con su separación. Es el punto en que dejar los controles apilados sobre el ranking desperdicia media pantalla |

   Dos, y no tres o cuatro, porque el diseño solo tiene dos formas: columna
   única y dos columnas. Un punto de ruptura que no cambia la forma es un
   número mágico esperando a que alguien lo mueva sin saber por qué.
3. El diseño se declara **móvil primero**: las reglas base valen para la
   pantalla estrecha y las media queries añaden a partir de ahí. Así el caso
   más restrictivo es el que no depende de que ninguna consulta se cumpla.
4. La **medida de línea del texto corrido** se acota a un rango legible —del
   orden de 60 a 80 caracteres— mediante `max-width` en unidades de carácter
   (`ch`), no fijando el ancho de la aplicación. El ranking y los controles
   pueden usar más ancho que el texto que contienen.
5. En pantalla estrecha, **cada control de peso ocupa su propia línea**, con
   la etiqueta y el valor por encima o al lado del deslizador, nunca los seis
   compartiendo una fila.
6. En pantalla estrecha, **el ranking es alcanzable sin recorrer todos los
   controles**. Los dos paneles del artefacto —«Pesos de decisión» y
   «Supuestos de coste y presupuesto»— suman once deslizadores y cuatro
   casillas por delante de la clasificación, que es lo que la persona ha
   venido a ver. **Se resuelven como paneles plegables, plegados por defecto
   por debajo de `--bp-columna`**, con su rótulo visible y un resumen de una
   línea de lo que contienen. Por encima de ese ancho van desplegados: ahí el
   espacio sobra y plegarlos solo añadiría un clic.
7. A partir de `--bp-ancho`, **los controles y la clasificación se disponen en
   dos columnas**: los paneles a un lado y el ranking al otro, de forma que
   mover un peso y ver el efecto no exija desplazarse. La columna de texto
   sigue acotada por el requisito 4; lo que se aprovecha es el ancho de la
   página, no el de la línea.
8. **Todo objetivo táctil mide al menos 44 × 44 px** de área accionable, y
   dos objetivos adyacentes están separados lo suficiente para no acertar en
   el equivocado. Aplica a los controles de despliegue, a las casillas y a
   los deslizadores. El artefacto declara sus casillas a **16 × 16 px**, que
   es menos de la mitad del mínimo: es una de las cosas que se corrigen al
   migrar, no de las que se copian.
9. Los **deslizadores son accionables con el dedo**: el punto de agarre tiene
   tamaño táctil, y todo deslizador tiene **una alternativa que no exige
   arrastrar con precisión** —el propio control acepta teclado, y el valor es
   visible mientras se mueve—. El caso más exigente es el de las valoraciones
   del desglose: paso de 0,5 sobre un recorrido de 1 a 5, es decir nueve
   posiciones en el ancho disponible.
10. Con **zoom del navegador al 200 %** sobre una ventana de 1280 px, el
    contenido sigue siendo utilizable y no aparece scroll horizontal: es el
    mismo caso que un viewport de 640 px, y las reglas responsive lo cubren
    sin trabajo adicional.
11. En **orientación apaisada en móvil**, donde la altura escasea, ningún
    elemento fija una altura que impida desplazarse por el contenido. Las
    alturas de viewport, si se usan, usan `dvh` y no `vh`, para no romperse
    con la barra de direcciones móvil. El artefacto usa `minHeight: 100vh`
    en su contenedor raíz: se migra como `100dvh`.
12. Las **líneas largas del desglose** —nombres de coche seguidos de cifras,
    motivos de descarte, etiquetas de fuente— se parten por espacios sin
    desbordar. Una cadena larga sin espacios se parte antes que desbordar.
13. **El contenido tabular ancho se desplaza dentro de su propio contenedor**,
    no arrastrando la página. Es la técnica que el artefacto ya usa en su
    ficha técnica, con la primera columna fijada para no perder de vista de
    qué coche es cada fila. Es la salida por defecto del requisito 1 cuando
    algo no cabe y no se puede partir.
14. **Ninguna información desaparece** por efecto del ancho. Se reordena, se
    apila o se pliega tras un control explícito; no se oculta con
    `display: none` sin sustituto.
15. Las media queries de la aplicación usan **exclusivamente** los puntos de
    ruptura declarados. Es la regla que `technical/0004` hace verificable.

## Criterios de aceptación

> Obligatorios y verificables.

- [x] A 320 px de ancho, y en cada punto de ruptura declarado, y a 1440 px,
      `document.documentElement.scrollWidth` no supera el ancho del viewport.
      Se comprueba con el desglose de un coche **abierto**, que es el estado
      con más contenido. Probado con Playwright sobre `npm run preview` a
      320, 375, 592, 593, 960, 961, 1024 y 1440 px: `scrollWidth === clientWidth`
      en los ocho.
- [x] Los puntos de ruptura son exactamente los dos del requisito 2, están
      declarados como tokens `--bp-*`, y cada uno lleva escrita la razón de su
      valor junto a la declaración. `src/styles/global.css`: `--bp-columna:
      37rem` (592px) y `--bp-ancho: 60rem` (960px), cada uno con su motivo en
      el comentario adyacente.
- [x] A 375 px los dos paneles de control aparecen plegados y el primer coche
      de la clasificación es visible sin desplazarse; a 1024 px aparecen
      desplegados. Comprobado con Playwright: a 375 px el contenido de ambos
      paneles tiene `display: none` y la fila del primer coche está dentro
      del viewport; a 1024 px ambos tienen `display: block`.
- [x] A 1440 px los controles y la clasificación ocupan dos columnas, y
      mover un peso cambia el ranking sin que haya que desplazarse.
      Comprobado: la sección de pesos y la lista de clasificación comparten
      el mismo `top` (189,5px) con la lista desplazada a la derecha
      (`left` 136 vs 716), ambas visibles sin desplazarse.
- [x] A 320 px, ninguna casilla mide menos de 44 × 44 px de área accionable:
      los 16 × 16 px del artefacto no se han migrado tal cual. La fila
      completa de la casilla (`primitives.checkboxRow`) mide 254×44-48px de
      área accionable, medida con Playwright.
- [x] Buscar media queries en `src/ui/` no devuelve ninguna con un ancho
      literal que no corresponda a un token declarado. Comprobado por
      `scripts/validateStyleTokensRepo.test.ts`.
- [x] A 320 px, los seis controles de peso ocupan seis líneas distintas, cada
      uno con su etiqueta y su valor visibles. Comprobado: seis `top`
      distintos y crecientes (294, 387, 480, 573, 666, 759).
- [x] A 320 px, todo control accionable mide al menos 44 × 44 px de área
      accionable, medido con las herramientas del navegador. Comprobado con
      Playwright sobre los deslizadores (`primitives.rangeInput`, 44px de
      alto), las casillas (`primitives.checkboxRow`, ≥44px) y los botones de
      despliegue (`min-height: var(--size-touch-min)`, 44px).
- [x] Con el navegador al 200 % de zoom sobre 1280 px de ancho, no hay scroll
      horizontal y todos los controles siguen alcanzables. El caso
      equivalente —viewport de 640px, como declara la sección
      *Dependencias y supuestos*— se comprobó sin scroll horizontal.
- [x] En un viewport apaisado de 740 × 360, se puede desplazar hasta el final
      del desglose de un coche sin que ningún elemento quede atrapado.
      Comprobado con Playwright: `window.scrollTo` alcanza el final del
      documento (scrollY 6554 de 6914px de alto) sin quedar bloqueado.
- [x] La medida de línea del texto corrido del desglose no supera los 80
      caracteres a ningún ancho de ventana. `--size-line-measure: 75ch`,
      aplicado a la fórmula, las fuentes y el texto introductorio; `ch` no
      depende del ancho de la ventana.
- [x] El conjunto de textos visibles a 320 px y a 1440 px es el mismo. Se
      comprueba comparando el texto renderizado en ambos anchos. Con los dos
      paneles desplegados a mano en los dos anchos, `document.body.textContent`
      normalizado es idéntico byte a byte (6.387 caracteres en ambos). El
      plegado por defecto a 320px no viola esto: `requisito 14` permite
      explícitamente «plegarse tras un control explícito», que es lo que
      hacen los paneles.
- [x] Buscar `vh` en `src/ui/` no devuelve ninguna coincidencia que no sea
      `dvh`. No hay ninguna coincidencia de ninguna de las dos: la interfaz no
      fija ninguna altura de viewport.
- [x] Todas las verificaciones anteriores se hacen sobre el **build de
      producción** servido con `npm run preview`, no sobre el servidor de
      desarrollo, y se dejan anotadas con los anchos exactos probados. Anchos
      probados: 320, 375, 592, 593, 640 (equivalente a 200% de zoom sobre
      1280), 740×360 (apaisado), 960, 961, 1024, 1440.
- [x] `npm run format:check`, `npm run lint`, `npm run typecheck`,
      `npm run arch:check`, `npm run test:coverage` y `npm run build` pasan
      en local.

## Dependencias y supuestos

- **Depende de `technical/0004`** para los tokens `--bp-*` y las media
  queries con nombre, y de **`product/0009`** para la jerarquía visual que
  esta spec reorganiza. Implementarla antes que ellas obliga a reorganizar
  dos veces.
- **No depende de la fase 3**, que además ya cerró. Los ejes cambiaron de
  escala, no de forma.
- Se asume que la verificación es **manual en navegador**: los tests actuales
  usan `renderToStaticMarkup`, que no calcula estilos, no tiene viewport y no
  puede medir un `scrollWidth`. Por eso los criterios están redactados con
  los anchos exactos y el build sobre el que se comprueban, para que la
  verificación sea repetible por otra persona aunque no esté automatizada.
- Se asume que 320 px es el ancho mínimo soportado. Es el del iPhone SE y el
  suelo de facto del diseño web; por debajo no se soporta nada y se declara
  así en vez de fingir que sí.
- Se asume que no hay imágenes en la interfaz, así que no hay imágenes
  responsive que resolver. Si algún día las hay, es otra spec.
- **El artefacto no aporta ninguna decisión responsive que copiar**: no tiene
  una sola media query, y su único acierto en este eje —la tabla con
  desplazamiento propio y columna fijada— pertenece a la vista de ficha
  técnica, que es `product/0013`. Los dos puntos de ruptura del requisito 2
  son, por tanto, **diseño nuevo**, y por eso llevan su justificación escrita.
- Se asume que la vista de ficha técnica (`product/0013`) cumplirá estos
  mismos requisitos cuando exista. El requisito 13 está redactado para valer
  para las dos vistas, no solo para la clasificación.

## Decisiones abiertas

Ninguna.
