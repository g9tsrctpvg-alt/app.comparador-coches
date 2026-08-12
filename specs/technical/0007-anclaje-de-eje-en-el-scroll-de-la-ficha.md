# 0007 — Anclaje de eje en el desplazamiento táctil de la ficha

- **Id:** technical/0007
- **Estado:** draft
- **Tipo:** technical
- **Fecha:** 2026-08-12
- **Specs relacionadas:** technical/0005
- **ADRs relacionados:** ninguno
- **Doc de estado:** `docs/estado/interfaz.md`

## Contexto

`.tableWrapper` (`src/ui/FichaPage.module.css`) desplaza en los dos ejes a
la vez, en el mismo contenedor: `overflow-x: auto` para las columnas de
modelo —con `scroll-snap-type: x mandatory`, cada `.modelHeader`/
`.modelCell` como punto de anclaje— y `overflow-y: auto`, acotado por
`--size-table-max-height`, para las filas cuando el conjunto «Completa» o
una pantalla baja hacen que la tabla no quepa entera. Los dos ejes viven a
propósito en el mismo elemento: es lo que permite que la cabecera se fije en
vertical dentro de su propio ancestro de scroll (`technical/0005`, requisito
5.1) — separarlos en dos contenedores reintroduciría el problema de la
cabecera sticky solapando la primera fila, ya corregido en esta misma fase.

En un gesto táctil, sin embargo, es difícil moverse en un eje puro: un
desplazamiento pensado como «hacia abajo» casi siempre lleva un componente
horizontal mínimo, y como el eje horizontal tiene anclaje de scroll, ese
componente mínimo puede bastar para saltar de una columna de modelo a la
siguiente. Quien mira la ficha en el móvil nota que el modelo que estaba
leyendo cambia solo, sin haberlo pedido.

## Objetivo

Que un gesto táctil sobre la tabla de la ficha quede anclado al eje que
domina su primer movimiento, y que el otro eje no reaccione hasta que el
gesto termine.

## Alcance

- El gesto táctil (`touchstart`/`touchmove`/`touchend`/`touchcancel`) sobre
  `.tableWrapper`.
- Determinar el eje dominante por la magnitud del primer movimiento
  significativo del gesto, una vez por gesto.
- Bloquear el eje no dominante mientras dure el gesto, sin tocar el
  comportamiento nativo —inercia incluida— del eje que sí domina.

## Fuera de alcance

- **El ratón o el trackpad** (eventos `wheel`): producen un `deltaX`/
  `deltaY` diagonal de otra forma, y bloquearlos exigiría interceptar y
  reaplicar el desplazamiento a mano, con riesgo de pelearse con
  `scroll-snap-type: x mandatory`. El usuario que reportó el problema lo
  describe específicamente en móvil.
- **Separar los dos ejes en contenedores distintos.** Reabriría el problema
  de la cabecera sticky que `technical/0005` ya cerró.
- **Cambiar el anclaje de scroll horizontal en sí** (`scroll-snap-align`,
  `scroll-padding-left`): siguen exactamente como los dejó `technical/0005`.

## Requisitos / comportamiento esperado

1. Un `useEffect` sobre `tableWrapperRef` (`src/ui/FichaPage.tsx`, ya
   existe: hoy solo se usa para `scrollTo({ left: 0 })` al fijar un modelo
   nuevo) añade los cuatro listeners táctiles, todos `passive: true` —el
   bloqueo no necesita `preventDefault`, así que no hace falta pagar el
   coste de un listener no pasivo.
2. **`touchstart`** guarda el punto de partida del gesto y limpia el eje
   bloqueado del gesto anterior.
3. **`touchmove`**, la primera vez que el movimiento acumulado supera 10px
   —para no decidir por el temblor natural del dedo—, compara el valor
   absoluto del desplazamiento horizontal contra el vertical y fija el eje
   dominante **una sola vez por gesto**. Mientras ese eje siga siendo el
   mismo, el `overflow` del eje contrario pasa a `'hidden'` —fijado como
   propiedad de `style` en JavaScript, no como literal de diseño en CSS: no
   afecta a `scripts/validateStyleTokens.ts`—. El eje dominante conserva su
   `overflow: auto` normal, así que el desplazamiento nativo de ese eje
   —inercia incluida— sigue resolviéndolo el navegador, no este código.
4. **`touchend`/`touchcancel`** limpian el eje bloqueado y quitan el
   `overflow` en línea de los dos ejes, devolviendo el control al CSS del
   módulo.
5. Ningún estado de React interviene: es una interacción de bajo nivel
   sobre el DOM, igual que `handleComparisonChange` ya usa el `ref` para
   `scrollTo` sin pasar por `useState`.

## Criterios de aceptación

> Obligatorios y verificables.

- [ ] Un gesto táctil simulado con desplazamiento mayoritariamente vertical
      (`dy` grande, `dx` pequeño) deja `overflowX` en `'hidden'` mientras
      dura, y lo quita al terminar. Verificado con Playwright, disparando la
      secuencia de eventos táctiles e inspeccionando `element.style`.
- [ ] Un gesto táctil simulado con desplazamiento mayoritariamente
      horizontal deja `overflowY` en `'hidden'` mientras dura, y lo quita al
      terminar. Mismo método de verificación.
- [ ] Un gesto por debajo del umbral de 10px no fija ningún eje —ninguno de
      los dos `overflow` cambia—. Verificado con Playwright.
- [ ] `touchcancel` limpia el bloqueo igual que `touchend` —un gesto
      interrumpido no deja un eje bloqueado para el siguiente—. Verificado
      con Playwright.
- [ ] El desplazamiento por teclado (flechas, con el contenedor enfocado) no
      cambia: este requisito no toca ninguna interacción de teclado.
- [ ] `npm run format:check`, `npm run lint`, `npm run typecheck`,
      `npm run arch:check`, `npm run test:coverage` y `npm run build` pasan
      en local antes de dar la spec por implementada.
- [ ] **Límite honesto de esta verificación**: lo anterior prueba que la
      lógica reacciona correctamente a la secuencia de eventos que se le da,
      no el gesto físico de un dedo sobre una pantalla táctil real —este
      entorno no tiene una—. No se marca ningún criterio como comprobado
      contra un dispositivo real que esta sesión no puede tocar.

## Dependencias y supuestos

- Depende de `technical/0005`, que declaró `.tableWrapper`,
  `scroll-snap-type` y el resto del mecanismo de desplazamiento que este
  cambio no toca, solo complementa.
- Se asume que alternar `overflow-x`/`overflow-y` a `hidden` a media
  interacción no interrumpe de forma perceptible el desplazamiento nativo
  del eje que sigue activo: es el mismo principio que ya usa el navegador
  para decidir, en un contenedor con overflow en un solo eje, si un gesto
  diagonal se queda en el elemento o sube al padre.
- Se asume que este comportamiento no necesita persistirse ni configurarse:
  es una corrección de la física del gesto, no una preferencia de quien
  mira la ficha.

## Decisiones abiertas

Ninguna.
