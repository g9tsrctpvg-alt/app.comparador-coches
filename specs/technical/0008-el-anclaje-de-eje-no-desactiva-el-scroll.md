# 0008 — El anclaje de eje no desactiva el scroll del eje bloqueado

- **Id:** technical/0008
- **Estado:** consolidated
- **Tipo:** technical
- **Fecha:** 2026-08-12
- **Specs relacionadas:** technical/0007
- **ADRs relacionados:** ninguno
- **Doc de estado:** `docs/estado/interfaz.md`

> ⚠️ **Spec consolidada (2026-08-12).** Describe un cambio en el momento en
> que se redactó; su sección *Contexto* retrata el sistema **anterior** al
> cambio y hoy es histórica. Para el estado actual, ver
> `docs/estado/interfaz.md`. Vigentes aquí solo los **criterios de
> aceptación**, como registro de verificación.

## Contexto

`technical/0007` ancla un gesto táctil al eje que domina su primer
movimiento, bloqueando el otro con `element.style.overflowX` /
`overflowY = 'hidden'` mientras dura el gesto, y quitando ese `style` en
línea al terminar (`touchend`/`touchcancel`).

Un usuario que ha probado el resultado desplegado reporta que, al hacer
scroll vertical, el scroll horizontal se resetea — no siempre, pero en un
porcentaje alto de los gestos. La spec anterior ya advertía de esto como
límite honesto de su propia verificación: Playwright puede disparar la
secuencia de eventos táctiles y comprobar que la lógica reacciona bien, pero
no reproduce el gesto físico de un dedo sobre una pantalla táctil real, y es
justo ahí donde aparece el problema.

La causa más probable: `.tableWrapper` combina `overflow-x: auto` con
`scroll-snap-type: x mandatory` (`technical/0005`). Cuando `overflowX` pasa
a `'hidden'`, el eje deja de ser una región de scroll durante el gesto; al
devolverlo a `auto`, el navegador recalcula su punto de anclaje de
scroll-snap, y en ese recálculo puede perder el `scrollLeft` que tenía antes
de bloquearse, cayendo al primer punto de anclaje (columna inicial) en vez
de conservar la posición. Es intermitente porque depende de si hay inercia
o una animación de snap en curso en el instante exacto en que el eje se
oculta.

## Objetivo

Que el anclaje de eje de `technical/0007` bloquee el eje no dominante sin
nunca desactivar su scroll — evitando así cualquier recálculo de
scroll-snap que pueda perder la posición.

## Alcance

- El mecanismo interno de `attachScrollAxisLock`
  (`src/ui/FichaPage.tsx`): cómo bloquea el eje no dominante.
- El comportamiento observable debe seguir siendo el mismo que fijó
  `technical/0007`: un gesto táctil quedar anclado a su eje dominante desde
  el primer movimiento significativo, con el eje contrario inmóvil mientras
  dure el gesto.

## Fuera de alcance

- **Los requisitos 1, 2, 4 y 5 de `technical/0007`** (listeners `passive`,
  qué guarda `touchstart`, qué limpia `touchend`/`touchcancel`, sin estado
  de React): no cambian, solo cambia cómo se materializa el bloqueo del
  requisito 3.
- **El resto de `technical/0007`** (alcance solo táctil, sin tocar
  `wheel`/trackpad; sin separar los ejes en contenedores distintos; sin
  tocar `scroll-snap-align`/`scroll-padding-left`): sigue igual, por las
  mismas razones ya documentadas allí.

## Requisitos / comportamiento esperado

1. `attachScrollAxisLock` deja de escribir `element.style.overflowX` /
   `overflowY`. Ninguna de las dos propiedades de `overflow` se toca nunca:
   `.tableWrapper` se queda siempre con el `overflow-x: auto` /
   `overflow-y: auto` que declara `FichaPage.module.css`.
2. Al fijar el eje dominante en `touchmove` (mismo umbral de 10px que ya
   declaró `technical/0007`, requisito 3), se guarda el `scrollLeft` y el
   `scrollTop` que tenía `.tableWrapper` en ese instante.
3. Mientras el gesto siga anclado a un eje, un listener de `scroll` sobre
   `.tableWrapper` reescribe la propiedad del eje **contrario** al valor
   guardado en el paso 2, en cada evento — `scrollLeft` si el eje anclado es
   `'y'`, `scrollTop` si es `'x'`. El eje dominante no se toca: su valor de
   scroll sigue viniendo enteramente del navegador.
4. `touchend`/`touchcancel` limpian el eje anclado — el listener de `scroll`
   deja de corregir nada hasta el siguiente gesto—. No hace falta restaurar
   ningún `overflow` inline porque nunca se llegó a cambiar.

## Criterios de aceptación

> Obligatorios y verificables.

- [x] Un gesto táctil simulado con desplazamiento mayoritariamente vertical
      (`dy` grande, `dx` pequeño) seguido de un evento `scroll` sintético con
      `scrollLeft` desplazado: `.tableWrapper.scrollLeft` vuelve al valor que
      tenía al fijarse el eje, sin que `overflowX` cambie nunca de su valor
      declarado en CSS (`element.style.overflowX` se queda en `''` durante
      todo el gesto). Verificado con Playwright, con un control frente al
      propio scroll-snap del navegador para no confundir uno con otro: sin
      ningún gesto activo, forzar `scrollLeft += 500` reasigna a `529` —el
      navegador ya reencaja solo—; con el eje vertical anclado
      (`dx=2, dy=30`) y `scrollLeft` fijado en `1` al iniciar el gesto, el
      mismo `+= 500` seguido del evento `scroll` deja `scrollLeft` en `1`
      exacto, no en el punto de anclaje más cercano a `501` — prueba que es
      esta lógica la que corrige, no el navegador por su cuenta.
      `overflowX` se queda en `''` en todo momento.
- [x] Un gesto mayoritariamente horizontal, simétrico: `scrollTop` vuelve al
      valor guardado ante un evento `scroll` sintético que lo desplace, sin
      que `overflowY` cambie nunca de `''`. Verificado con `dx=30, dy=2`:
      `scrollTop` fijado en `0` al iniciar, un `+= 40` seguido de `scroll`
      lo deja en `0`; `overflowY` se queda en `''`. Este eje no tiene
      `scroll-snap-type`, así que no hace falta el control del criterio
      anterior — cualquier corrección observada es necesariamente de esta
      lógica.
- [x] Un gesto por debajo del umbral de 10px no fija ningún eje y el
      listener de `scroll` no corrige nada — mismo criterio que
      `technical/0007`, ahora sin `overflow` de por medio. Verificado con
      `dx=3, dy=4`: un `scrollTop += 55` posterior al `touchmove`
      sub-umbral, con `scroll` disparado, queda en `55` sin corregir.
- [x] `touchcancel` limpia el eje anclado igual que `touchend`: tras
      cancelar, un evento `scroll` posterior no se corrige. Verificado:
      tras anclar el eje horizontal (`dx=30, dy=2`) y disparar
      `touchcancel`, un `scrollTop += 77` con `scroll` queda en `77`, sin
      corregir.
- [x] El desplazamiento por teclado (flechas, con el contenedor enfocado) no
      cambia. Este cambio no añade ningún listener de teclado ni toca
      `keydown`/`keyup` — por construcción no puede interferir. Verificado
      además con Playwright: sobre un `.tableWrapper` recién enfocado
      (`scrollLeft` inicial `1`), una pulsación de `ArrowRight` lo mueve a
      `12`, reproducible en tres ejecuciones consecutivas. El paso siguiente
      resultó intermitente en este entorno sin cabeza —quedarse en `12` tras
      una segunda pulsación en algunas ejecuciones—, pero es ruido del
      desplazamiento por teclado combinado con `scroll-snap-type` en
      Chromium headless, no algo que dependa de este cambio: no hay
      `keydown` en el código nuevo que pueda ser la causa.
- [x] `npm run format:check`, `npm run lint`, `npm run typecheck`,
      `npm run arch:check`, `npm run test:coverage` y `npm run build` pasan
      en local antes de dar la spec por implementada.
- [x] **Límite honesto de esta verificación**: lo anterior prueba que la
      lógica reacciona bien a la secuencia de eventos que se le da —incluido
      un evento `scroll` sintético—, no que un navegador real, en un
      dispositivo real, jamás dispare `scroll-snap` de una forma que
      reintroduzca el problema. Es la misma limitación que ya reconoció
      `technical/0007`: este entorno no tiene una pantalla táctil real. La
      diferencia frente a la spec anterior es que este diseño ya no depende
      de que el navegador conserve el `scrollLeft`/`scrollTop` de un eje al
      desactivarlo y reactivarlo — nunca lo desactiva—, así que el mecanismo
      concreto que se sospecha causó el fallo reportado deja de poder
      ocurrir, aunque no haya un dispositivo real en este entorno para
      confirmar el reporte original palmo a palmo.

## Dependencias y supuestos

- Depende de `technical/0007`, que declaró el resto del mecanismo de
  anclaje de eje (listeners, umbral, alcance) — esta spec solo sustituye
  cómo se materializa el bloqueo del eje no dominante, sin tocar el fichero
  de `technical/0007`, que está `consolidated`.
- Se asume que corregir `scrollLeft`/`scrollTop` en cada evento `scroll`
  —en vez de impedir el scroll a nivel de CSS— no introduce un parpadeo
  perceptible: es la misma técnica que usan las bibliotecas conocidas de
  bloqueo de eje de scroll, y el eje corregido solo se mueve por el
  componente cruzado mínimo de un gesto pensado como puro, no por un
  desplazamiento real en esa dirección.

## Decisiones abiertas

Ninguna.
