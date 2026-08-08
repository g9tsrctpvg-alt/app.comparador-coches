# 0005 — Refuerzo del sistema visual: jerarquía, estados y shell

- **Id:** technical/0005
- **Estado:** draft
- **Tipo:** technical
- **Fecha:** 2026-08-08
- **Specs relacionadas:** technical/0004, product/0009, product/0010, product/0018
- **ADRs relacionados:** 0006, 0008
- **Doc de estado:** `docs/estado/interfaz.md`

## Contexto

El sistema de estilos que montó `technical/0004` funciona: los tokens viven en
`:root`, cada componente tiene su módulo, y un gate de CI impide que se cuele
un literal de diseño. Lo que hay encima de ese fundamento, en cambio, es la
traducción literal de un artefacto que nunca fue un producto acabado, y se
nota en cuatro sitios concretos:

**No hay ni un estado de puntero.** Buscar `:hover` en los dieciséis ficheros
CSS del repositorio no devuelve ninguna coincidencia; `:active` tampoco. La
única señal de que algo es accionable es `cursor: pointer`, que aparece diez
veces. El ADR 0006 ya lo señaló como carencia del artefacto original —«no
tiene ni un estado de foco, ni un `:hover`, ni una media query en 385
líneas»— y arregló las otras dos. Ésta quedó.

**No hay jerarquía entre la marca y la vista.** Las cuatro páginas abren con
el mismo `<h1>Comparador de coches</h1>` a 30 px, de modo que el elemento más
grande de cada pantalla dice siempre lo mismo y nunca dice dónde estás. Debajo
va el conmutador de vistas y, suelto, un enlace `Cómo se calcula todo →`.

**Esa cabecera está copiada tres veces.** `App.tsx`, `FichaTecnicaPage.tsx` y
`FichaCompletaPage.tsx` repiten los mismos cuatro elementos con los mismos
nombres de clase, y `.page`, `.title` y `.explainLink` están declarados por
duplicado en los tres `.module.css`. `docs/proceso/estilo.md` §1 lo llama por
su nombre: si copias la misma construcción dos o más veces, extrae un
primitivo. Además la copia ya se ha desincronizado —`ExplicacionPage` es la
única vista sin conmutador, y el conmutador es el único sitio sin enlace a la
explicación—, que es exactamente lo que la duplicación produce.

**La escala está apretada por abajo y truncada por arriba.** El cuerpo de las
dos tablas va a `--font-size-xs`, 11 px. El titular más grande son 30 px. Hay
un token de 9,5 px (`--font-size-3xs`) y uno de sombra de foco
(`--shadow-focus`) que **no consume ningún componente**: son escala declarada
y nunca usada. Con una familia propia por delante (ADR 0008) es el momento de
fijar la escala que esa familia va a pintar, no después.

Nada de esto es un fallo de `technical/0004`: aquella spec declaró que el
color se llamara por su token y que el token existiera, y eso se cumple. Lo
que falta es el escalón siguiente, que aquella dejó fuera de alcance a
propósito.

## Objetivo

Llevar el sistema de estilos de «tokens correctos» a «producto acabado»:
escala tipográfica con rango, niveles de superficie, estados de interacción,
primitivos que hoy faltan y un shell de aplicación único que sustituya a la
cabecera copiada tres veces.

## Alcance

- **La escala tipográfica**: tamaños, alturas de línea, espaciados entre
  letras y pesos, como tokens.
- **Los niveles de superficie y profundidad**: un segundo nivel de tarjeta, un
  separador estructural frente al pelo de un píxel, tres niveles de texto, un
  radio grande y dos sombras nuevas.
- **Los estados de interacción**: `:hover` y `:active` en todo lo accionable,
  con sus tokens de tinte, duración y curva.
- **Los papeles de dirección** (`positive` / `negative`), que `product/0018`
  necesita para veinte magnitudes y hoy solo existen como `accent` y `signal`.
- **Los primitivos que faltan**: botón, superficie elevada, etiqueta, cifra
  tabular y envoltorio de tabla.
- **El shell de aplicación**: cabecera con marca y navegación, contenedor de
  página, pie, y el `<h1>` por vista.
- **La navegación única**, con la explicación como cuarto destino.
- **La densidad de tabla**: cabecera fija en vertical, realce de fila y cifras
  de ancho constante.
- **Un gate de contraste en CI**, que hoy no existe.

## Fuera de alcance

- **La paleta no cambia.** Los siete papeles de `product/0009` y sus dos
  derivados conservan su valor. Lo que se añade son niveles y alias, no tonos
  nuevos. Un cambio de paleta sería otra decisión y otro ADR.
- **El esquema oscuro.** Sigue aplazado por el ADR 0006 con su disparador.
- **Qué información muestra cada vista.** Esta spec mueve, agranda y colorea
  lo que ya se enseña; no añade ni quita un dato. Enseñar la foto del coche en
  la portada es `product/0019`, y la fusión de las dos fichas es
  `product/0018`.
- **La elección de la familia tipográfica**, que decide el ADR 0008. Aquí solo
  se fija la escala que esa familia pinta.
- **Los dos puntos de ruptura**, que fija `product/0010` y siguen siendo dos.
- **La cobertura de `src/ui/`**, que sigue fuera del suelo por deuda
  registrada en `docs/roadmap.md`.

## Requisitos / comportamiento esperado

### 1. Tokens

1.1. **La escala tipográfica sube el suelo y abre la cima**, y toda ella vive
en `--font-size-*`: 40 px para el título de vista (token nuevo), 28, 22, 18
(token nuevo), 16 para el texto base, 14 para controles y celdas, 12 para la
letra pequeña y 11 para el rótulo en versalitas. El cuerpo de tabla deja de ir
a 11 px. Se **retira** `--font-size-3xs`, declarado y sin un solo uso.

1.2. Existen tokens `--line-height-*` y `--letter-spacing-*`. Hoy el 1,5 del
cuerpo, el 1,05 de los titulares y los cinco valores de `letter-spacing`
repartidos por los módulos son literales que el gate de `technical/0004` no
caza precisamente porque no llevan unidad.

1.3. Existe `--font-weight-medium: 500`, que la fuente variable del ADR 0008
permite y la escala de tres pesos de hoy no tiene. Es el peso que separa un
rótulo de un valor sin recurrir al 600.

1.4. **Hay dos niveles de superficie y dos de línea**: `--color-card-raised`
sobre `--color-card`, y `--color-rule-strong` frente al pelo de
`--color-rule`. Y **tres niveles de texto**: `--color-ink`, `--color-mute` y
un `--color-ink-tertiary` nuevo para lo que hoy no tiene token y acaba usando
`mute` por defecto.

1.5. Existen `--radius-lg`, `--shadow-raised` y `--shadow-overlay`. La sombra
declarada y no consumida —`--shadow-focus`— se retira o se consume; no sigue
existiendo sin uso.

1.6. **Los papeles de dirección se llaman por lo que significan**:
`--color-positive` y `--color-negative`, derivados de `accent` y `signal`. Es
la regla 4 de `technical/0004` aplicada a un papel que hasta hoy no estaba
nombrado: una Δ favorable no es «de color acento», es positiva, y
`product/0018` va a pintar veinte magnitudes con ese criterio.

1.7. Existen `--duration-fast`, `--duration-base` y `--ease-out`. Hoy la única
transición del proyecto es un `0.35s ease` escrito a mano en
`primitives.module.css`.

1.8. Existe `--size-header-height`, que la cabecera del shell y la cabecera
fija de las tablas necesitan compartir para no solaparse.

### 2. Estados

2.1. **Todo elemento accionable tiene `:hover` y `:active` visibles**, y
ninguno los expresa moviendo el contenido de sitio: se resuelven con fondo,
color o línea. Cubre enlaces de navegación, botones, filas desplegables del
ranking, cabeceras de columna con radio, miniaturas de foto y el selector de
vista de foto.

2.2. `:hover` **no es el único portador de nada**. Un dispositivo táctil no
tiene puntero, así que ningún estado ni ninguna información aparece solo al
pasar por encima.

2.3. El indicador de foco global de `global.css` **no se toca**: ya es
correcto, vive en un único sitio y ningún módulo lo reinventa. Los estados
nuevos se componen con él sin taparlo.

2.4. Las transiciones nuevas usan los tokens de duración y curva, y quedan
neutralizadas bajo `prefers-reduced-motion: reduce` por la regla global que ya
existe, sin que ningún componente lo compruebe por su cuenta.

### 3. Primitivos

3.1. `src/ui/primitives.module.css` gana, al menos: **botón** en sus tres
formas (sólido, contorno y fantasma), **superficie elevada**, **etiqueta** —que
absorbe el `.referenceTag` hoy duplicado en las dos fichas—, **cifra tabular**
(`--font-mono` más `font-variant-numeric: tabular-nums`) y **envoltorio de
tabla** (el patrón de desplazamiento propio, borde y radio hoy copiado en las
dos fichas).

3.2. **Ningún módulo declara un botón desde cero.** Hoy no existe primitivo de
botón y hay cinco reinvenciones: el botón real de `ConfigActions`, y cuatro
«botones invisibles» que anulan `background`, `border` y `padding` por su
cuenta.

### 4. Shell

4.1. Existe un **shell de aplicación** que aporta la cabecera, el contenedor
de página y el pie, y que envuelve a las cuatro vistas. Ninguna vista declara
su propia cabecera ni su propio ancho máximo.

4.2. **La marca vive en la cabecera y el `<h1>` pasa a ser el título de la
vista.** Cada pantalla tiene exactamente un `<h1>`, y ese `<h1>` dice dónde
estás, no cómo se llama la aplicación.

4.3. **La navegación es una y lleva a los cuatro destinos**, incluida la
explicación. El enlace suelto `Cómo se calcula todo →` desaparece de las tres
páginas que lo repiten, y ninguna vista se queda sin navegación. Se conserva
`aria-current="page"` sobre la activa.

4.4. La cabecera queda fija al desplazar, con **fondo opaco**: nada de
`backdrop-filter`, que se degrada de forma distinta en cada motor y no aporta
información.

4.5. El pie declara la procedencia y la fecha de los datos y la leyenda de la
marca de estimado, que hoy se repite al pie de cada tabla.

4.6. **`.page`, `.title` y `.explainLink` dejan de estar declaradas en más de
un `.module.css`.**

### 5. Tablas

5.1. La cabecera de las tablas queda **fija en vertical** al desplazar,
desplazada por `--size-header-height` para no quedar debajo de la cabecera de
la aplicación. Hoy, al bajar por las veinte filas de la ficha, se pierde qué
modelo es cada columna.

5.2. La fila bajo el puntero se realza. En una tabla transpuesta la fila **es**
la magnitud que se está comparando, así que realzarla es exactamente la ayuda
que la lectura necesita.

5.3. Toda cifra se pinta con ancho de dígito constante, de modo que las
columnas numéricas alineen sin depender de qué dígitos toquen.

### 6. Verificación

6.1. **La CI comprueba el contraste.** Un script propio bajo Vitest —sin E/S,
recibiendo el CSS ya leído, igual que `validateStyleTokens.ts` y
`validateDocs.ts`— extrae los tokens `--color-*` de la hoja global, calcula la
relación de contraste de los pares declarados y falla por debajo de 4,5:1. Hoy
ese cálculo está hecho a mano una vez, en `product/0009`, y nada impide que un
token nuevo lo rompa en silencio.

6.2. `npm run build` sigue produciendo un `dist/` desplegable bajo el subpath
de GitHub Pages, con la fuente del ADR 0008 resuelta sin 404.

## Criterios de aceptación

> Obligatorios y verificables.

- [ ] Buscar `:hover` en `src/ui/` devuelve al menos una coincidencia por cada
      familia de elemento accionable del requisito 2.1, y buscar `:active`
      devuelve al menos una por cada una.
- [ ] Ningún estado `:hover` altera `width`, `height`, `padding`, `margin`,
      `top`, `left` ni `transform` de forma que mueva contenido vecino.
- [ ] Buscar `--font-size-3xs` y `--shadow-focus` en el repositorio no
      devuelve ninguna declaración huérfana: o los consume alguien, o no
      existen.
- [ ] Existen los tokens de los requisitos 1.1 a 1.8, todos con prefijo de
      familia y agrupados, y ninguno lleva un tono en el nombre.
- [ ] Buscar `line-height:` y `letter-spacing:` en los `.module.css` no
      devuelve ningún literal: todos salen de `var(--…)`.
- [ ] Cada página renderiza exactamente un `<h1>`, y su texto es el nombre de
      la vista, no el de la aplicación. Comprobado con un test sobre el
      marcado de las cuatro rutas.
- [ ] La navegación renderiza los cuatro destinos en las cuatro vistas, con
      `aria-current="page"` sobre la activa y sobre ninguna más. Comprobado
      con un test sobre el marcado.
- [ ] Buscar `Cómo se calcula todo` en `src/ui/` devuelve como mucho una
      coincidencia, y está en el componente de navegación.
- [ ] `.page`, `.title` y `.explainLink` no aparecen declaradas en más de un
      `.module.css`.
- [ ] Ningún `.module.css` declara un botón anulando `background`, `border` y
      `padding` sin componer el primitivo de botón.
- [ ] Existe una comprobación en CI que falla al introducir a propósito un par
      de colores por debajo de 4,5:1 en la hoja global, y pasa al corregirlo.
- [ ] `npm run format:check`, `npm run lint`, `npm run typecheck`,
      `npm run arch:check`, `npm run test:coverage` y `npm run build` pasan en
      local antes de dar la spec por implementada.
- [ ] Sobre el build de producción y en un navegador real, a 320, 592, 960 y
      1440 px de ancho: no hay desplazamiento horizontal del documento a
      ninguno de los cuatro; recorriendo con el tabulador, cada control que
      recibe el foco lo muestra; y la cabecera fija de la tabla no queda
      tapada por la cabecera de la aplicación.
- [ ] Con `prefers-reduced-motion: reduce` forzado, ninguna de las
      transiciones nuevas es perceptible.
- [ ] El sitio desplegado en GitHub Pages carga la fuente y las hojas de
      estilo sin 404 bajo el subpath del repositorio.

## Dependencias y supuestos

- **Depende del ADR 0008**, que decide la familia tipográfica. El requisito
  1.1 fija la escala que esa familia va a pintar, y los tamaños dependen
  de su altura de x: si el gate humano rechaza la fuente propia, la escala se
  revisa antes de implementarla, no después.
- **Amplía `technical/0004`, no la sustituye.** Sus catorce requisitos siguen
  vigentes; en particular el 6 —ningún literal fuera de los tokens— y el 13
  —el gate que lo comprueba—, que esta spec debe seguir cumpliendo mientras
  añade tokens nuevos.
- **`product/0009` y `product/0010` están consolidadas**, así que el estado
  desde el que se parte se lee en `docs/estado/interfaz.md` y no en ellas. Lo
  que esta spec cambia de aquéllas —la escala de tamaños y la composición de
  la cabecera— se consolidará sobre el mismo doc de estado, que es el camino
  que `docs/proceso/consolidacion.md` §3 declara para un comportamiento que
  vuelve a cambiar.
- **`product/0018` depende de ésta**, no al revés: la ficha unificada consume
  los papeles de dirección, el primitivo de tabla y el shell. El orden de
  implementación es ésta primero.
- Se asume que los tests seguirán usando `renderToStaticMarkup`, que **no
  calcula estilos ni tiene viewport**. Por eso todo criterio de esta spec es o
  bien textual sobre el fuente, o bien sobre el marcado renderizado, o bien
  una verificación a mano en navegador declarada como tal. Ninguno finge ser
  automático sin serlo.
- Se asume que el contraste se calcula sobre pares **declarados**, no sobre
  todas las combinaciones posibles de tokens: la mayoría de los pares que
  saldrían de un producto cartesiano no se dan nunca en pantalla, y hacerlos
  fallar convertiría el gate en ruido.

## Decisiones abiertas

Ninguna.
