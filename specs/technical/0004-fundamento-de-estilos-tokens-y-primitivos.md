# 0004 — Fundamento de estilos: tokens y primitivos

- **Id:** technical/0004
- **Estado:** verified
- **Tipo:** technical
- **Fecha:** 2026-08-06
- **Specs relacionadas:** product/0009, product/0010, product/0011, technical/0001
- **ADRs relacionados:** 0006
- **Doc de estado:** `docs/estado/interfaz.md`, `docs/estado/arquitectura.md`

> ⚠️ **Spec histórica — implementada, sin consolidar.** Describe un cambio ya
> implementado: su sección *Contexto* retrata el sistema **anterior** al
> cambio y hoy no es cierta. **No es referencia del estado actual** — para
> eso, ver el **Doc de estado** indicado arriba. Vigentes aquí los
> **criterios de aceptación**, como registro de verificación.

## Contexto

`src/ui/` no tiene estilos. No existe ningún fichero `.css` en el repositorio,
`index.html` no enlaza hoja alguna y ningún componente declara `className`.
Cada elemento se ve como el navegador lo pinte por defecto.

El ADR 0006 decide **con qué se escribe** el CSS —CSS propio, tokens en
*custom properties*, CSS Modules por componente, sin dependencias nuevas—,
pero un ADR no monta ficheros. Falta el andamiaje: qué tokens existen, con
qué nombres, dónde se declaran, cómo se cargan, qué primitivos comparten los
componentes y qué comprueba la CI.

Es un hueco que hay que tapar antes y no después. `product/0009` (el diseño
del comparador), `product/0010` (el responsive) y `product/0011` (la página
que explica los cálculos) escriben CSS las tres. Si cada una monta su propio
andamiaje, el resultado son tres modelos de estilos conviviendo, que es
exactamente el fallo que `estilo.md` §1 describe al decir que la coherencia
de una interfaz vive en sus primitivos compartidos y no en la disciplina de
quien la escribe.

Esta spec es **el fundamento, no el diseño**. No decide de qué color es nada:
decide que el color se llame por su token y que el token exista.

## Objetivo

Dejar montado el andamiaje de estilos —tokens, carga, módulos, primitivos y
reglas base— para que las specs de diseño de la fase 4 se ocupen del diseño y
no de la fontanería.

## Alcance

- **La hoja de tokens.** Un único fichero global con las *custom properties*
  de color, espaciado, tipografía, radios, sombras, anchos máximos y puntos
  de ruptura, declaradas en `:root`.
- **La carga.** Dónde se importa la hoja global para que llegue a toda la
  aplicación, y cómo importa cada componente su módulo.
- **El reset mínimo.** Caja, márgenes por defecto, herencia de tipografía en
  los controles de formulario, y `img`/`svg` que no desbordan.
- **`prefers-reduced-motion`** como media query global sobre las
  transiciones.
- **Los puntos de ruptura declarados una sola vez**, con nombre. Los valores
  concretos y qué pasa en cada uno son de `product/0010`; que existan como
  declaración única es de aquí.
- **Los primitivos compartidos** que más de un componente necesita: la
  superficie de tarjeta, el indicador de foco, la barra de proporción, la
  marca de estado, el texto secundario.
- **El gate de CI** que impide que un literal de diseño se cuele fuera de la
  hoja de tokens.

## Fuera de alcance

- **Qué aspecto tiene el comparador.** Los valores concretos de la paleta, la
  jerarquía visual y la composición del ranking son `product/0009`.
- **El comportamiento en cada tamaño de pantalla.** Es `product/0010`. Aquí
  solo se declara que los puntos de ruptura tienen nombre y sitio.
- **Cambiar el marcado por motivos de diseño.** Si un componente necesita
  otra estructura de elementos para poder estilarse, ese cambio pertenece a
  la spec de producto que lo pide, no a esta.
- **Cualquier dependencia nueva.** El ADR 0006 ya decidió que no hay ninguna,
  y esta spec no la reabre.
- **El esquema oscuro, en cualquiera de sus formas.** El artefacto de
  referencia tiene un solo aspecto —papel claro, tinta verde oscura— y
  añadirle una paleta oscura es inventar diseño que nadie ha pedido. Lo que
  esta spec sí garantiza es que **hacerlo después sea un cambio de tokens y
  nada más**: por eso el requisito 6 prohíbe los literales de color fuera de
  la hoja global. Queda aplazado con su disparador en el ADR 0006.
- **Meter `src/ui/` en el suelo de cobertura del 100%.** Es una deuda abierta
  del roadmap con su propia condición de cierre, y una hoja de estilos no la
  resuelve ni la agrava.

## Requisitos / comportamiento esperado

1. Existe una **única hoja global de tokens**, importada desde el punto de
   arranque de la aplicación (`src/main.tsx`), de forma que todo componente
   la tenga disponible sin importarla por su cuenta.
2. Los tokens se declaran como *custom properties* en `:root`, agrupadas por
   familia y con **prefijo por familia**: `--color-*`, `--space-*`,
   `--font-*`, `--radius-*`, `--shadow-*`, `--size-*`, `--bp-*`.
3. La escala de espaciado es **una sola escala**, no valores sueltos por
   componente. Un espaciado que no esté en la escala es un token nuevo, y
   añadirlo es una decisión visible en el diff de la hoja global.
4. Los colores se declaran por **su papel, no por su tono**. Los siete papeles
   del artefacto de referencia —fondo de página, superficie, texto principal,
   texto secundario, línea, acento y alerta— son los siete tokens mínimos, y
   sus valores los fija `product/0009`. Un token llamado `--color-verde` es un
   error: el nombre sobrevive al cambio de paleta y el tono no.
5. Cada componente que necesite estilos propios tiene un
   `Componente.module.css` **junto a su `.tsx`**, y lo importa desde él.
   Ningún módulo declara selectores de elemento global (`body`, `a`, `input`)
   fuera de la hoja global.
6. Ninguna regla fuera de la hoja global contiene un literal de color, de
   espaciado, de tamaño de fuente o de radio. Todos salen de `var(--…)`.
7. El reset mínimo fija `box-sizing: border-box` de forma heredada, quita los
   márgenes por defecto de los elementos de bloque de texto, hace que
   `input`, `button`, `select` y `textarea` hereden la tipografía, y acota
   `img`, `svg` y `canvas` a `max-width: 100%`.
8. **Todo elemento interactivo tiene un indicador de foco visible** con
   `:focus-visible`, definido como primitivo compartido y no reinventado por
   componente. Ningún módulo escribe `outline: none` sin sustituirlo por un
   indicador equivalente en la misma regla.
9. Los puntos de ruptura se declaran una sola vez como tokens `--bp-*` y se
   usan por nombre. Ningún módulo escribe un ancho en píxeles dentro de una
   media query que no corresponda a un punto de ruptura declarado.
10. Bajo `prefers-reduced-motion: reduce`, las transiciones y animaciones
    declaradas quedan sin efecto. La regla vive en la hoja global y no
    depende de que cada componente se acuerde. El artefacto tiene una sola
    transición —la barra del ranking, 0,35 s— y es justo la que hay que poder
    apagar.
11. **Dos familias tipográficas**, declaradas como tokens: una monoespaciada
    para las cifras y una sans para el texto, ambas pilas del sistema. Ningún
    componente nombra una fuente; usa `var(--font-mono)` o `var(--font-sans)`.
    Es la decisión característica del artefacto, y como token se aplica sola.
12. Existen como primitivos compartidos, al menos: la superficie de tarjeta,
    la superficie invertida, el rótulo de sección, el indicador de foco, la
    barra de proporción, la marca de estado y el tratamiento del texto
    secundario. Un componente que necesite uno de ellos lo compone, no lo
    copia. Los tres primeros ya existen en el artefacto —su `Label`, su
    tarjeta y su tarjeta de líder—: se migran como primitivos, no como estilos
    repetidos.
13. La CI falla si un fichero de `src/ui/` que no sea la hoja global de tokens
    contiene un literal de color hexadecimal, `rgb(`, `hsl(`, o una longitud
    en `px` o `rem` fuera de una media query. Se implementa como
    **comprobación propia bajo Vitest**, que lee los `.module.css` con
    `import.meta.glob` y aplica las reglas, igual que
    `scripts/validateDocsRepo.test.ts` hace con los documentos. `stylelint`
    sería lo idiomático y es dependencia nueva, que el ADR 0006 descarta; una
    regla de ESLint no ve dentro de un fichero CSS. El precedente del
    validador de docs demuestra que el camino propio funciona aquí.
14. `npm run build` sigue produciendo un `dist/` desplegable bajo el subpath
    de GitHub Pages, con las hojas de estilo resueltas sin 404. Es la misma
    invariante que `technical/0001` fijó para los recursos.

## Criterios de aceptación

> Obligatorios y verificables.

- [x] Existe una hoja global de tokens importada desde `src/main.tsx`, y
      ningún otro fichero la importa.
- [x] Todo token declarado en `:root` pertenece a una de las siete familias
      con prefijo (`--color-`, `--space-`, `--font-`, `--radius-`,
      `--shadow-`, `--size-`, `--bp-`).
- [x] Ningún token de color lleva un tono en el nombre, y los siete papeles
      del requisito 4 están declarados.
- [x] Existen exactamente dos tokens de familia tipográfica, y buscar
      `monospace`, `system-ui` o `sans-serif` en los `.module.css` no devuelve
      ninguna coincidencia.
- [x] Buscar `#`, `rgb(`, `hsl(` en los `.module.css` de `src/ui/` no
      devuelve ninguna coincidencia.
- [x] Existe un test o comprobación en CI que falla ante un literal de diseño
      introducido a propósito en un módulo, y pasa al sustituirlo por su
      token. `scripts/validateStyleTokens.test.ts`.
- [x] Navegando con el tabulador por la aplicación, cada control que recibe
      el foco lo muestra visiblemente. Se verifica a mano en navegador, sobre
      el build de producción: comprobado con Playwright contra
      `npm run preview`, el primer `Tab` deja un `outline` de 3 px en color
      acento sobre el primer control.
- [x] Buscar `outline: none` en `src/ui/` no devuelve ninguna coincidencia
      que no vaya acompañada de un indicador sustitutorio en la misma regla.
- [x] Con `prefers-reduced-motion: reduce` forzado en el navegador, ninguna
      transición de la interfaz es perceptible. La regla global neutraliza
      toda transición y animación; no hay ninguna transición aplicada a un
      elemento visible todavía —`proportionBarFill` no lo consume ningún
      componente hasta `product/0009`—, así que hoy se cumple por ausencia y
      se reverifica en la fase siguiente, cuando la barra exista de verdad.
- [x] Cambiar el valor de un token de color en la hoja global cambia ese
      color en toda la aplicación sin tocar ningún otro fichero. Es la
      propiedad que hace que un esquema oscuro futuro sea un cambio de tokens,
      y se comprueba haciendo el cambio y revirtiéndolo: comprobado
      cambiando `--color-accent` y compilando, viendo el nuevo valor en
      `dist/assets/*.css`, y revirtiéndolo.
- [x] Ninguna media query de `src/ui/` contiene un ancho que no corresponda a
      un token `--bp-*` declarado. No hay ninguna media query todavía; el
      gate de `validateStyleTokens` lo haría fallar si apareciera una fuera
      de los tokens.
- [x] `npm run format:check`, `npm run lint`, `npm run typecheck`,
      `npm run arch:check`, `npm run test:coverage` y `npm run build` pasan
      en local antes de dar la spec por implementada.
- [x] El sitio desplegado en GitHub Pages carga sus hojas de estilo sin 404
      bajo el subpath del repositorio. Comprobado contra la URL pública tras
      el despliegue real (PR #57 a `main`,
      `https://g9tsrctpvg-alt.github.io/app.comparador-coches/`): el
      `href` del `<link>` generado por `vite build` lleva el subpath del
      repositorio y responde `200`.

## Dependencias y supuestos

- **Depende del ADR 0006**, que decide CSS propio con tokens y CSS Modules,
  sin dependencias nuevas. Si el gate humano cambia esa decisión, esta spec
  se reescribe entera: no es adaptable a un framework de utilidades.
- **Los valores de los tokens los fija `product/0009`**, a partir del
  artefacto de referencia. Esta spec declara las familias y los nombres; sin
  aquélla, la hoja global quedaría con la estructura correcta y sin colores.
  El orden de implementación es esta primero, con valores provisionales, y
  `product/0009` fijándolos: al revés no hay dónde escribirlos.
- Se asume que Vite resuelve `*.module.css` de forma nativa, sin plugin ni
  configuración añadida. Es comportamiento estándar de Vite 8, que es la
  versión fijada en `package.json`.
- Se asume que los tests seguirán usando `renderToStaticMarkup`, que **no
  calcula estilos**. Por eso todos los criterios visuales de esta spec son o
  bien textuales sobre el fuente —comprobables mecánicamente— o bien
  verificaciones a mano en navegador declaradas como tales. No hay criterio
  que finja ser automático sin serlo.
- Se asume que el prefijo de rutas de GitHub Pages ya está resuelto por
  `technical/0001` y que las hojas de estilo heredan esa resolución sin
  trabajo extra. Si no fuera así, aparece en el último criterio.

## Decisiones abiertas

Ninguna.
