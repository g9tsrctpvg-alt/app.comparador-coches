# 0004 — Fundamento de estilos: tokens y primitivos

- **Id:** technical/0004
- **Estado:** draft
- **Tipo:** technical
- **Fecha:** 2026-08-06
- **Specs relacionadas:** product/0009, product/0010, product/0011, technical/0001
- **ADRs relacionados:** 0006
- **Doc de estado:** `docs/estado/interfaz.md`, `docs/estado/arquitectura.md`

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
- **Las preferencias del sistema.** `prefers-color-scheme` y
  `prefers-reduced-motion` como media queries sobre los tokens.
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
- **Modo oscuro como opción del usuario.** Respetar `prefers-color-scheme`
  entra; un selector de tema en la interfaz está aplazado en el ADR 0006 con
  su disparador.
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
4. Los colores se declaran por **su papel, no por su tono**:
   `--color-text-primary`, `--color-surface`, `--color-accent`,
   `--color-danger`. Un token llamado `--color-azul` es un error: renombrar el
   tono obliga a renombrar el token cuando cambie la paleta.
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
    depende de que cada componente se acuerde.
11. Bajo `prefers-color-scheme: dark`, los tokens de color toman valores
    alternativos. **Solo cambian los tokens**: ninguna regla de ningún módulo
    consulta el esquema de color por su cuenta.
12. Existen como primitivos compartidos, al menos: la superficie de tarjeta,
    el indicador de foco, la barra de proporción, la marca de estado y el
    tratamiento del texto secundario. Un componente que necesite uno de ellos
    lo compone, no lo copia.
13. La CI falla si un fichero de `src/ui/` que no sea la hoja global de tokens
    contiene un literal de color hexadecimal, `rgb(`, `hsl(`, o una longitud
    en `px` o `rem` fuera de una media query. El mecanismo —regla de ESLint
    sobre CSS, comprobación propia bajo Vitest, o `stylelint`— lo decide la
    implementación, con la restricción de que `stylelint` sería dependencia
    nueva y por tanto necesita el 🟡 que el ADR 0006 ya negó para las de
    estilos: en la práctica, comprobación propia.
14. `npm run build` sigue produciendo un `dist/` desplegable bajo el subpath
    de GitHub Pages, con las hojas de estilo resueltas sin 404. Es la misma
    invariante que `technical/0001` fijó para los recursos.

## Criterios de aceptación

> Obligatorios y verificables.

- [ ] Existe una hoja global de tokens importada desde `src/main.tsx`, y
      ningún otro fichero la importa.
- [ ] Todo token declarado en `:root` pertenece a una de las siete familias
      con prefijo (`--color-`, `--space-`, `--font-`, `--radius-`,
      `--shadow-`, `--size-`, `--bp-`).
- [ ] Ningún token de color lleva un tono en el nombre; los cinco papeles
      mínimos —texto principal, texto secundario, superficie, acento,
      peligro— están declarados.
- [ ] Buscar `#`, `rgb(`, `hsl(` en los `.module.css` de `src/ui/` no
      devuelve ninguna coincidencia.
- [ ] Existe un test o comprobación en CI que falla ante un literal de diseño
      introducido a propósito en un módulo, y pasa al sustituirlo por su
      token.
- [ ] Navegando con el tabulador por la aplicación, cada control que recibe
      el foco lo muestra visiblemente. Se verifica a mano en navegador, sobre
      el build de producción.
- [ ] Buscar `outline: none` en `src/ui/` no devuelve ninguna coincidencia
      que no vaya acompañada de un indicador sustitutorio en la misma regla.
- [ ] Con `prefers-reduced-motion: reduce` forzado en el navegador, ninguna
      transición de la interfaz es perceptible.
- [ ] Con `prefers-color-scheme: dark` forzado, la aplicación es legible y el
      contraste de texto sobre superficie se mantiene en AA (4,5:1 para texto
      normal). El diff que lo consigue toca únicamente valores de tokens.
- [ ] Ninguna media query de `src/ui/` contiene un ancho que no corresponda a
      un token `--bp-*` declarado.
- [ ] `npm run format:check`, `npm run lint`, `npm run typecheck`,
      `npm run arch:check`, `npm run test:coverage` y `npm run build` pasan
      en local antes de dar la spec por implementada.
- [ ] El sitio desplegado en GitHub Pages carga sus hojas de estilo sin 404
      bajo el subpath del repositorio.

## Dependencias y supuestos

- **Depende del ADR 0006**, que decide CSS propio con tokens y CSS Modules,
  sin dependencias nuevas. Si el gate humano cambia esa decisión, esta spec
  se reescribe entera: no es adaptable a un framework de utilidades.
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

1. **Con qué se implementa el gate del requisito 13.** Las opciones sin
   dependencia nueva son una comprobación propia bajo Vitest —que lee los
   `.module.css` y busca literales, igual que `validateDocs.ts` lee los
   documentos— o una regla de ESLint. `stylelint` sería lo idiomático y es
   dependencia nueva, que el ADR 0006 descarta para el eje de estilos. Hay
   que cerrarla antes de aprobar.
2. **Si la paleta oscura entra en esta spec o en `product/0009`.** El
   requisito 11 y su criterio piden que exista y sea legible; los **valores**
   de la paleta son diseño. Cerrarlo en un sentido u otro antes de aprobar,
   para que no queden dos specs creyendo que la paleta oscura es de la otra.
