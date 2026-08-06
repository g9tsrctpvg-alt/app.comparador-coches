# 0010 — Diseño responsive real

- **Id:** product/0010
- **Estado:** draft
- **Tipo:** product
- **Fecha:** 2026-08-06
- **Specs relacionadas:** product/0009, product/0011, technical/0004
- **ADRs relacionados:** 0006
- **Doc de estado:** `docs/estado/interfaz.md`

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

El artefacto del que viene el proyecto estaba pensado para **560 px de ancho
máximo**: un móvil grande. Traer ese diseño tal cual no resuelve el problema,
lo cambia de sitio — pasaría de no funcionar en ningún sitio a funcionar en
uno solo.

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
2. Los **puntos de ruptura son pocos y con nombre**, declarados una sola vez
   como tokens `--bp-*`. La justificación de cada valor se escribe junto a su
   declaración: un punto de ruptura sin motivo escrito es un número mágico.
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
   controles**. Si el panel de supuestos y pesos queda por delante, se puede
   plegar, o el ranking tiene un salto directo. La forma concreta la decide
   la implementación; el requisito es que llegar al ranking no cueste toda la
   pantalla.
7. **Todo objetivo táctil mide al menos 44 × 44 px** de área accionable, y
   dos objetivos adyacentes están separados lo suficiente para no acertar en
   el equivocado. Aplica a los controles de despliegue, a las casillas y a
   los deslizadores.
8. Los **deslizadores son accionables con el dedo**: el punto de agarre tiene
   tamaño táctil, y todo deslizador tiene **una alternativa que no exige
   arrastrar con precisión** —el propio control acepta teclado, y el valor es
   visible mientras se mueve—.
9. Con **zoom del navegador al 200 %** sobre una ventana de 1280 px, el
   contenido sigue siendo utilizable y no aparece scroll horizontal: es el
   mismo caso que un viewport de 640 px, y las reglas responsive lo cubren
   sin trabajo adicional.
10. En **orientación apaisada en móvil**, donde la altura escasea, ningún
    elemento fija una altura que impida desplazarse por el contenido. Las
    alturas de viewport, si se usan, usan `dvh` y no `vh`, para no romperse
    con la barra de direcciones móvil.
11. Las **líneas largas del desglose** —nombres de coche seguidos de cifras,
    motivos de descarte, etiquetas de fuente— se parten por espacios sin
    desbordar. Una cadena larga sin espacios se parte antes que desbordar.
12. **Ninguna información desaparece** por efecto del ancho. Se reordena, se
    apila o se pliega tras un control explícito; no se oculta con
    `display: none` sin sustituto.
13. Las media queries de la aplicación usan **exclusivamente** los puntos de
    ruptura declarados. Es la regla que `technical/0004` hace verificable.

## Criterios de aceptación

> Obligatorios y verificables.

- [ ] A 320 px de ancho, y en cada punto de ruptura declarado, y a 1440 px,
      `document.documentElement.scrollWidth` no supera el ancho del viewport.
      Se comprueba con el desglose de un coche **abierto**, que es el estado
      con más contenido.
- [ ] Los puntos de ruptura son como mucho tres, están declarados como tokens
      `--bp-*`, y cada uno lleva escrita la razón de su valor.
- [ ] Buscar media queries en `src/ui/` no devuelve ninguna con un ancho
      literal que no corresponda a un token declarado.
- [ ] A 320 px, los seis controles de peso ocupan seis líneas distintas, cada
      uno con su etiqueta y su valor visibles.
- [ ] A 320 px, todo control accionable mide al menos 44 × 44 px de área
      accionable, medido con las herramientas del navegador.
- [ ] Con el navegador al 200 % de zoom sobre 1280 px de ancho, no hay scroll
      horizontal y todos los controles siguen alcanzables.
- [ ] En un viewport apaisado de 740 × 360, se puede desplazar hasta el final
      del desglose de un coche sin que ningún elemento quede atrapado.
- [ ] La medida de línea del texto corrido del desglose no supera los 80
      caracteres a ningún ancho de ventana.
- [ ] El conjunto de textos visibles a 320 px y a 1440 px es el mismo. Se
      comprueba comparando el texto renderizado en ambos anchos.
- [ ] Buscar `vh` en `src/ui/` no devuelve ninguna coincidencia que no sea
      `dvh`.
- [ ] Todas las verificaciones anteriores se hacen sobre el **build de
      producción** servido con `npm run preview`, no sobre el servidor de
      desarrollo, y se dejan anotadas con los anchos exactos probados.
- [ ] `npm run format:check`, `npm run lint`, `npm run typecheck`,
      `npm run arch:check`, `npm run test:coverage` y `npm run build` pasan
      en local.

## Dependencias y supuestos

- **Depende de `technical/0004`** para los tokens `--bp-*` y las media
  queries con nombre, y de **`product/0009`** para la jerarquía visual que
  esta spec reorganiza. Implementarla antes que ellas obliga a reorganizar
  dos veces.
- **No depende de la fase 3.** Los ejes cambian de escala, no de forma.
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

## Decisiones abiertas

1. **Los valores concretos de los puntos de ruptura.** El requisito 2 exige
   que sean pocos y justificados; esta spec no los fija. Hay que elegirlos
   —y escribir el porqué de cada uno— antes de aprobar, porque «pocos y con
   motivo» no es verificable hasta que existen.
2. **Cómo se resuelve el requisito 6 en móvil**: panel de controles plegable,
   salto al ranking, o los controles después del ranking. Son tres soluciones
   con consecuencias distintas para quien llega por primera vez, y la
   decisión es de producto, no de implementación.
3. **Si la referencia de 560 px del artefacto original sigue significando
   algo.** Depende de la decisión abierta 1 de `product/0009`: si el fuente
   del artefacto se adjunta, sus decisiones de ancho son punto de partida; si
   se declara que el diseño se hace de cero, esa cifra deja de ser una
   restricción y pasa a ser un dato histórico.
