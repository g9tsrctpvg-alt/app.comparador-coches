# 0006 — Menú de navegación: pastillas y selector en móvil

- **Id:** technical/0006
- **Estado:** closed
- **Tipo:** technical
- **Fecha:** 2026-08-12
- **Specs relacionadas:** technical/0005, technical/0014
- **ADRs relacionados:** 0013
- **Doc de estado:** `docs/estado/interfaz.md`

> ⚠️ **Spec cerrada sin verificar (2026-09-04).** Describe un cambio ya
> implementado: su sección *Contexto* retrata el sistema **anterior** al
> cambio y hoy es histórica. Para el estado actual, ver el **Doc de estado**
> indicado arriba. **No llegó a `verified`**: los criterios que siguen sin
> marcar no se cumplieron, y cada uno tiene su destino escrito en
> `docs/roadmap.md`. Se congela aquí como registro, con el ADR 0013 detrás.

## Contexto

`technical/0005` sacó la navegación de cada página y la centró en
`ViewSwitcher`, dentro de `AppHeader`: tres enlaces de texto plano, con un
trazo bajo el activo. Funciona y es accesible, pero es el elemento visual
más plano de la cabecera, y es el único que no reutiliza ningún primitivo
—ni botón, ni superficie— de los que la misma spec introdujo.

Además, `AppHeader.module.css` declara `overflow-x: auto` en `.inner`
—el contenedor de la marca y el conmutador— para que la fila de tres
enlaces no fuerce scroll horizontal del documento en los anchos más
estrechos. Es una salida de emergencia, no una solución: a partir de cierto
ancho, la cabecera misma se desplaza en horizontal, un gesto que ningún
otro elemento de la interfaz pide en móvil (`product/0010` fija que el
scroll horizontal, cuando hace falta, vive dentro de un contenedor concreto
—la tabla de la ficha—, nunca en la página ni en la cabecera).

## Objetivo

Dar a la navegación un tratamiento visual más trabajado en escritorio, y
resolver su estrechez en móvil sustituyendo el desplazamiento horizontal
por un control que no lo necesite.

## Alcance

- El aspecto visual de `ViewSwitcher` en escritorio.
- Un control alternativo, sin desplazamiento horizontal, para anchos
  estrechos.
- Si con el cambio deja de hacer falta, retirar `overflow-x: auto` de
  `AppHeader.module.css`.

## Fuera de alcance

- **Los tres destinos y sus rutas**: no cambian ni de número ni de hash.
- **La marca ni el resto de la cabecera** (`AppHeader`, `AppFooter`,
  `AppShell`): sin cambios.
- **Cualquier token nuevo**: el color, el radio y las duraciones que hacen
  falta ya existen desde `technical/0005`.

## Requisitos / comportamiento esperado

1. **En escritorio** (≥`--bp-columna`, 592px), los tres destinos viven
   dentro de un contenedor con borde y `--radius-md`. El destino activo
   lleva fondo `--color-accent-tint`, a modo de pastilla; los inactivos son
   texto plano que se resalta en `:hover` (`--color-card-raised`, a juego
   con el resto de la interfaz) y en `:active`. Las transiciones reutilizan
   `--duration-fast` y `--ease-out`, ya declarados. `aria-current="page"`
   se conserva sobre el destino activo, y sobre ninguno más.
2. **Por debajo de `--bp-columna`**, el grupo de pastillas no se renderiza
   visible: en su lugar aparece un `<select>` nativo con los tres destinos
   como `<option>`, el de la ruta activa marcado `selected`, y un nombre
   accesible. Cambiar su valor navega: `onChange` fija `window.location.hash`
   al valor elegido, que dispara el evento `hashchange` que
   `useHashRoute` (`src/ui/useHashRoute.ts`) ya escucha, sin ningún cambio
   en el enrutado.
3. **Un único componente, dos marcados condicionados por CSS**, no por
   estado de React: `ViewSwitcher` renderiza siempre el grupo de pastillas y
   el `<select>`; cuál se ve depende de `display: none`/`display: flex` a
   cada lado de `--bp-columna` — el mismo patrón que ya usa
   `FichaPage.module.css` para esconder y mostrar `.featureHeader` según el
   ancho.
4. **`overflow-x: auto` sale de `AppHeader.module.css:.inner`** si, verificado
   a mano en un navegador real a 320px, el contenedor ya no lo necesita —la
   marca más, según el ancho, las pastillas o el selector, deberían caber
   sin desplazamiento—. Si alguna combinación todavía lo necesitara, la
   regla se queda y este requisito se anota como no cumplido, con el motivo.
   > **No se cumple, medido.** A 320px, la marca («Comparador de coches»,
   > 168px) más el `<select>` (191px, por «Cómo se calcula», la opción más
   > larga) más el hueco y el relleno del contenedor (48px) suman 407px
   > sobre 320px disponibles: `.inner` sigue necesitando su propio scroll
   > interno, y a 592px —justo el borde donde aparecen las pastillas— le
   > faltan 31px. La regla se queda. Lo que sí mejora, y es lo que
   > `product/0010` exige de verdad: el **documento** no se desplaza en
   > horizontal a ningún ancho —confirmado con Playwright a 320/592/960/
   > 1440px—, porque el scroll, cuando hace falta, se queda dentro de
   > `.inner`, nunca sube a la página. Retirar la regla exigiría acortar la
   > marca o las etiquetas de destino, un cambio de contenido fuera del
   > alcance de esta spec.

## Criterios de aceptación

> Obligatorios y verificables.

- [x] En escritorio, los tres destinos aparecen dentro de un contenedor con
      borde, y el activo lleva un fondo distinto al de los otros dos.
      Verificado con Playwright: fondo `rgba(20, 101, 92, 0.07)`
      (`--color-accent-tint`) sobre el activo, transparente sobre los
      demás, contenedor con borde visible.
- [x] Por debajo de `--bp-columna` existe un `<select>` con tres `<option>`,
      uno por destino, y el de la ruta activa lleva `selected`. Comprobado
      con un test (`ViewSwitcher.test.tsx`).
- [x] El `<select>` tiene nombre accesible. Comprobado con un test
      (`aria-label="Vista"`, igual que el `<nav>`).
- [x] `aria-current="page"` sigue marcando solo el destino activo, tanto en
      el grupo de pastillas como en el `<select>` (el atributo no aplica al
      `<select>` en sí — se verifica que la opción activa es la
      seleccionada). Comprobado con un test.
- [x] Elegir un destino distinto en el `<select>` navega de verdad: cambiar
      su valor mueve `window.location.hash` y la vista que se renderiza
      después es la del destino elegido. Verificado a mano con Playwright
      sobre el build de producción, en las dos direcciones (Clasificación
      → Cómo se calcula y de vuelta).
- [x] `.buttonGhost`/`.buttonSolid` u otro primitivo de botón ya declarado
      queda compuesto por el grupo de pastillas, no reinventado —o, si el
      contenedor necesita algo que ningún primitivo actual cubre, la
      diferencia queda documentada aquí, no en el código sin más.
      **No se compone**, y queda documentado aquí por qué no: `.active`
      necesita un fondo persistente (`--color-accent-tint`, la pastilla),
      pero `.buttonGhost` ya fija `background: transparent` en su propia
      regla — y la composición entre ficheros de CSS Modules resuelve los
      conflictos a favor del primitivo (hallazgo empírico de
      `technical/0005`), así que ese fondo perdería siempre. Tampoco encaja
      en lo semántico: `.buttonGhost` es «sin superficie propia hasta que
      se interactúa», y un indicador de página activa necesita justo lo
      contrario, una superficie persistente. `.link`/`.active` sí reutilizan
      `mono` (la misma base tipográfica que compone toda la familia de
      botones) y los mismos tokens de color, radio y duración que
      `.buttonGhost` — la diferencia es solo el fondo persistente, no toda
      la superficie de la clase.
      **Marcado el 2026-09-04.** El criterio es una disyunción y su segunda
      rama —«o, si el contenedor necesita algo que ningún primitivo actual
      cubre, la diferencia queda documentada aquí»— es exactamente lo que
      hacen los párrafos de arriba. Dejarlo sin marcar fue un error de
      contabilidad, no un incumplimiento; el razonamiento está además
      consolidado en `docs/estado/interfaz.md`.
- [x] Ningún `.module.css` nuevo declara un color, radio, duración o
      tipografía como literal: todo sale de `var(--…)`.
      `scripts/validateStyleTokensRepo.test.ts` en verde.
- [x] `npm run format:check`, `npm run lint`, `npm run typecheck`,
      `npm run arch:check`, `npm run test:coverage` y `npm run build` pasan
      en local antes de dar la spec por implementada.
- [ ] Sobre el build de producción y en un navegador real, a 320, 592, 960
      y 1440px: no hay desplazamiento horizontal de la cabecera ni del
      documento; el elemento con el foco lo muestra, tanto en las pastillas
      como en el `<select>`.
      **El documento, sin desplazamiento horizontal a ningún ancho —
      confirmado—. La cabecera, no del todo**: sigue necesitándolo a 320px y
      justo en el borde de 592px (ver la nota de medición en el requisito
      4). El foco se muestra correctamente en ambos casos —pastillas y
      `<select>`—, confirmado con Playwright (segundo tabulador en
      escritorio, primer tabulador tras la marca en móvil).
      **Se queda sin marcar para siempre (2026-09-04).** Es el único criterio
      de esta spec que no se cumple, y no se va a cumplir sin un cambio de
      diseño —acortar la marca o esconderla a ese ancho— que nadie ha pedido.
      Su destino, como exige el ADR 0013: *Aplazamientos con disparador* de
      `docs/roadmap.md`, con este disparador — **que la cabecera cambie de
      contenido, marca o destinos, por cualquier motivo, o que el
      desplazamiento a 320px estorbe de verdad al usarla**. El límite queda
      además escrito en `docs/estado/interfaz.md`, con su medición.
- [x] El sitio desplegado en GitHub Pages sirve el marcado nuevo sin 404.
      Esperaba un `push` a `main` que desde entonces ha ocurrido decenas de
      veces. **Comprobado el 2026-09-04** contra la URL pública: `index.html`
      responde `200` y sirve `index-DEvpBliU.js` e `index-gCKKUTLA.css` —los
      mismos hashes que produce `npm run build` en local—, los dos también
      con `200`. Es la misma comprobación que cerró este criterio en
      `technical/0004`, `product/0011`, `technical/0005` y `product/0018`.

## Dependencias y supuestos

- Depende de `technical/0005`, que declaró `ViewSwitcher`, sus tres
  destinos y los tokens de color, radio y duración que este cambio
  reutiliza sin añadir ninguno nuevo.
- Se asume que `--bp-columna` (592px) sigue siendo el punto de ruptura
  correcto para este colapso: es el que ya usa el resto de la interfaz para
  decisiones equivalentes (aparecer/desaparecer una columna, pasar de una
  columna a dos), así que reutilizarlo no introduce un tercer punto de
  ruptura sin motivo propio.
- Se asume que un `<select>` nativo es preferible a un menú desplegable a
  medida: es accesible por construcción, no necesita gestionar el cierre al
  perder el foco ni al pulsar fuera, y sigue el patrón que la barra de
  herramientas de `FichaPage` ya usa para sus tres controles.

## Decisiones abiertas

Ninguna.
