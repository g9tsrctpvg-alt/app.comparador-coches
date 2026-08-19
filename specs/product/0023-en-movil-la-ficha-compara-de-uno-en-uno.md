# 0023 — En móvil, la ficha compara de uno en uno

- **Id:** product/0023
- **Estado:** implemented
- **Tipo:** product
- **Fecha:** 2026-08-19
- **Specs relacionadas:** product/0010, product/0018, product/0020
- **ADRs relacionados:** ninguno
- **Doc de estado:** `docs/estado/interfaz.md`

> ⚠️ **Spec histórica — implementada, sin consolidar.** Describe un cambio ya
> implementado: su sección *Contexto* retrata el sistema **anterior** al
> cambio y hoy no es cierta. **No es referencia del estado actual** — para
> eso, ver el **Doc de estado** indicado arriba. Vigentes aquí los
> **criterios de aceptación**, como registro de verificación.

## Contexto

Hoy, por debajo de `--bp-columna` (592px), `FichaPage` sigue siendo la misma
tabla transpuesta que por encima: una columna por modelo, con la referencia
fijada a la izquierda y el resto desplazándose en horizontal dentro de su
propio contenedor (`product/0010`, requisitos 1 y 13). A ese ancho la columna
de un modelo mide `--size-ficha-model-min` y cada celda funde dentro de sí el
rótulo de la magnitud, así que solo cabe **un candidato visible junto a la
referencia** a la vez: ver el segundo exige arrastrar la tabla en horizontal,
y con `scroll-snap-type: x mandatory` ese arrastre ancla de columna en
columna, una por gesto.

Es exactamente la salida por defecto que `product/0010`, requisito 13, prevé
para contenido tabular que no cabe: desplazamiento dentro de un contenedor
propio. Es correcta como suelo, pero no es la única forma de cumplir los
requisitos 1 y 14 de esa misma spec —«no hay scroll horizontal de la página»
y «ninguna información desaparece por efecto del ancho, se reordena, se
apila o se pliega tras un control explícito»—, y para el caso concreto de
comparar candidatos, arrastrar una tabla no es lo mismo que elegir un
candidato: no hay ningún control explícito, solo una posición de scroll.

Se ha explorado un diseño alternativo —maquetas estáticas sobre los datos y
puntuaciones reales del catálogo, revisadas con el propietario del
producto— que sustituye la tabla, solo por debajo de `--bp-columna`, por una
**tira de candidatos seleccionable** más una **tarjeta de un candidato a la
vez** con sus magnitudes en una sola columna. El boceto solo cubrió el
conjunto «Esenciales»; esta spec extiende el mismo patrón a «Completa»,
porque dejarla en la tabla ilegible habría resuelto la mitad del problema.

## Objetivo

Que comparar un candidato contra la referencia en un móvil sea elegirlo de
una tira, no arrastrar una tabla a ciegas hasta encontrarlo.

## Alcance

- **La composición de `FichaPage` por debajo de `--bp-columna`**: sustituir
  la tabla ancha por una vista de un candidato a la vez —tira de candidatos
  con desplazamiento propio, más una tarjeta del candidato enfocado con sus
  magnitudes en una sola columna.
- **El contenido de cada fila de magnitud** de esa tarjeta: el valor del
  candidato, la Δ firmada contra la referencia, y el valor crudo de la
  propia referencia — las tres cosas que hoy están repartidas entre una
  celda y la columna fijada, que en esta vista deja de existir como columna
  aparte.
- **Que «Completa» reciba el mismo tratamiento** que «Esenciales», agrupado
  en los mismos seis bloques que ya declara `COMPLETE_BLOCKS`.
- **Qué candidato se enfoca por defecto** y cómo reacciona el foco a
  cambios en «Comparar» y en «Orden».
- **La accesibilidad de la tira** como control explícito: nombre accesible
  por candidato, estado enfocado señalado sin depender solo del color.

## Fuera de alcance

- **Cualquier cálculo del dominio.** `buildFicha`, `withComparison` y
  `sortFicha` se reutilizan sin modificar; ninguna Δ, polaridad o campo
  cambia.
- **El conmutador Esenciales/Completa en sí** (`product/0020`): sigue
  siendo el mismo control con las mismas dos opciones. Esta spec solo
  cambia cómo se disponen sus filas por debajo del punto de ruptura.
- **El control «Comparar»**, en sus dos formas actuales —el `<select>` de
  la barra y el radio de cada cabecera de columna—: ninguno de los dos
  cambia. El radio de cabecera sigue en el marcado, oculto por CSS junto
  con el resto de la tabla por debajo del punto de ruptura.
- **Persistencia o URL compartible del candidato enfocado.** Es estado
  efímero, igual que `fieldSet`, `sortCriterion` o `photoView` ya lo son
  hoy en `FichaPage`: no forma parte de `AppConfig` (`product/0012`).
- **La ficha por encima de `--bp-columna`.** La tabla se queda exactamente
  como está hoy, sin un solo cambio de marcado ni de estilo.
- **Un tercer punto de ruptura.** Se reutiliza `--bp-columna`; no se
  declara ninguno nuevo.
- **El diálogo de foto ampliada y `PhotoBox`.** Se reutilizan tal cual.
- **Las otras dos variantes exploradas en el mismo lienzo de diseño** —una
  que gira la tabla y muestra cada magnitud con los catorce candidatos a la
  vez, y otra que comprime la tabla sin cambiar su forma—. Solo se
  implementa la de la tira y la tarjeta; las otras quedan como exploración,
  sin spec propia.

## Requisitos / comportamiento esperado

1. Por debajo de `--bp-columna`, `FichaPage` sustituye la tabla ancha por
   una vista de **un candidato a la vez**: una tira horizontal de
   candidatos con desplazamiento propio, y debajo una tarjeta con las
   magnitudes del candidato enfocado en una sola columna. Por encima de ese
   ancho, la tabla se renderiza exactamente como hoy.
2. Las dos vistas —tabla y tira-más-tarjeta— **se generan siempre en el
   marcado**; cuál se ve la decide una media query de `FichaPage.module.css`
   con `--bp-columna`, igual que ya hace `ViewSwitcher` con la navegación y
   `CollapsiblePanel` con el contenido de los paneles del ranking. Ningún
   estado de React decide entre las dos.
3. La tira contiene, en el orden vigente de «Orden», los mismos candidatos
   que hoy son columnas desplazables de la tabla —todas las entidades salvo
   la fijada como referencia—. Cada candidato es un control real, con una
   miniatura decorativa (`aria-hidden`) y el nombre como texto real; el
   enfocado se marca con `aria-current="true"` además de con su propio
   tratamiento visual, para que el estado no dependa solo del color.
4. Hay siempre un candidato enfocado: por defecto, el primero de la tira.
   Si el candidato enfocado deja de estar en la tira —porque pasa a ser la
   propia referencia tras un cambio en «Comparar»—, el foco pasa al nuevo
   primero de la tira; nunca queda apuntando a un candidato que ya no se ve.
5. La tarjeta del candidato enfocado muestra su foto —misma vista que el
   resto de la ficha, mismo comportamiento de marcador ausente y de diálogo
   ampliado que `PhotoBox` ya tiene—, su nombre, marca y tecnología, y una
   fila por magnitud del conjunto de campos vigente.
6. Cada fila de magnitud muestra **tres datos**, no solo la Δ que muestra
   hoy cada celda de la tabla: el valor del candidato, la Δ firmada contra
   la referencia —con su color de refuerzo, nunca la única vía de leerla—
   cuando hay comparación activa, y el valor crudo de la referencia con su
   nombre. Repetir el valor de la referencia en cada fila es necesario, no
   decorativo: al dejar de existir como columna aparte en esta vista, es la
   única forma de que su valor no desaparezca (`product/0010`, requisito
   14).
7. Cuando no hay referencia elegida (Comparar en «Ninguno»), la fila
   muestra solo el valor del candidato, sin Δ ni línea de referencia —igual
   que hoy una celda sin comparación activa no muestra nada donde iría la
   Δ.
8. Cuando hay referencia pero el dato no se puede comparar —la referencia
   no lo declara, o las unidades no coinciden—, la fila lo señala igual que
   hoy lo señala una celda: la raya con su texto accesible, nunca un número
   inventado.
9. Con «Completa» seleccionado, las filas se agrupan en los mismos seis
   bloques que ya declara `COMPLETE_BLOCKS`, con su cabecera de bloque como
   separador dentro de la tarjeta, en el mismo orden que en la tabla.
10. La tira se desplaza dentro de su propio contenedor, nunca la página
    (`product/0010`, requisito 13); ningún elemento de esta vista provoca
    scroll horizontal del documento a ningún ancho desde 320px (`product/0010`,
    requisito 1).
11. Todo candidato de la tira mide al menos 44×44px de área accionable
    (`product/0010`, requisito 8).
12. Esta vista no introduce ningún punto de ruptura nuevo: usa
    exclusivamente `--bp-columna`, ya declarado.
13. Ninguna puntuación, fórmula, Δ o campo del dominio cambia: `buildFicha`,
    `withComparison` y `sortFicha` se reutilizan sin modificar, y la
    interfaz sigue sin calcular nada (`ui-no-scoring-internals`).

## Criterios de aceptación

> Obligatorios y verificables.

- [ ] Con el catálogo real y los valores por defecto (Comparar: Giulietta,
      Orden: Longitud, Campos: Esenciales), la tira contiene un candidato
      por cada entidad de las columnas desplazables de hoy, en el mismo
      orden, y ninguno es la propia Giulietta. Comprobado recorriendo el
      marcado de `FichaPage` con `renderToStaticMarkup`.
- [ ] El candidato enfocado por defecto es el primero de la tira (EV3, con
      los valores por defecto del catálogo real).
- [ ] Para Longitud, la fila del candidato enfocado por defecto muestra el
      valor del candidato (4300 mm), la Δ firmada (−51 mm) y el valor de la
      referencia con su nombre (Giulietta, 4351 mm).
- [ ] Con «Comparar» en «Ninguno», ninguna fila de esta vista muestra Δ ni
      línea de referencia.
- [ ] Con «Completa» seleccionado, las filas se agrupan en los seis bloques
      de `COMPLETE_BLOCKS`, con su rótulo, en el mismo orden que la tabla.
- [ ] Cada candidato de la tira tiene un nombre accesible igual al nombre
      del modelo, y el enfocado —y solo el enfocado— lleva
      `aria-current="true"`. Comprobado recorriendo el marcado.
- [ ] Elegir un candidato de la tira lo enfoca: tras el clic, ese candidato
      pasa a llevar `aria-current="true"` y la tarjeta pasa a mostrar sus
      datos. Verificado con Playwright contra el build de producción.
- [ ] Si el candidato enfocado se convierte en la referencia —se elige en
      «Comparar»—, el foco pasa a ser el nuevo primero de la tira, sin
      quedar apuntando a un candidato que ya no aparece. Verificado con
      Playwright.
- [ ] La tabla no cambia: los tests ya existentes de `FichaPage.test.tsx`
      sobre su marcado y su comportamiento siguen en verde sin modificar
      ninguna de sus aserciones.
- [ ] Sobre el build de producción, en un navegador real: a 320, 375 y
      591px se ve la tira y la tarjeta, y no la tabla; a 592px y más se ve
      la tabla, y no la tira ni la tarjeta. Ningún ancho desde 320px produce
      scroll horizontal del documento.
- [ ] A 320px, cada candidato de la tira mide al menos 44×44px de área
      accionable, medido con las herramientas del navegador.
- [ ] Ninguna puntuación, Δ o campo del dominio cambia: `ficha.test.ts`
      sigue en verde sin modificar ninguno de sus valores esperados, y
      `ui-no-scoring-internals` sigue pasando sin modificar
      `.dependency-cruiser.mjs`.
- [ ] Ningún componente de `src/ui/` contiene un literal de color,
      espaciado o tipografía nuevo: `scripts/validateStyleTokensRepo.test.ts`
      sigue en verde sin añadir tokens.
- [ ] `npm run format:check`, `npm run lint`, `npm run typecheck`,
      `npm run arch:check`, `npm run test:coverage` y `npm run build` pasan
      en local.

## Dependencias y supuestos

- **Depende de `product/0010`**, cuyos requisitos 1, 8, 13, 14 y 15 esta
  spec satisface por una vía distinta de la que esa spec previó por
  defecto —desplazamiento dentro de un contenedor propio— para el caso
  concreto de comparar candidatos. No la contradice: requisito 13 declara
  esa salida como el **suelo** para contenido tabular que no cabe, no como
  la única forma válida.
- **Depende de `product/0018`**, que define `withComparison`, el
  significado de la Δ y el mecanismo de «Comparar»: todo se reutiliza sin
  cambios. Esta spec no reabre esa spec `consolidated`; añade una segunda
  forma de **presentar** los mismos datos, igual que la enmienda ya
  registrada en `docs/estado/interfaz.md` sobre el `<select>` de la barra
  añadió una segunda forma de fijar la referencia sin tocar el texto de
  `product/0018`.
- **Depende de `product/0020`**, cuyo `FieldDef` de cada magnitud de
  «Esenciales» se reutiliza sin cambios.
- Asume que `COMPLETE_BLOCKS` sigue siendo la agrupación vigente de
  «Completa»: seis bloques, en el orden que `FichaPage.tsx` ya declara.
- Asume que los tests de interfaz siguen siendo `renderToStaticMarkup` sin
  jsdom para el marcado y el estado, y manuales en navegador para el ancho,
  el scroll y el tamaño táctil — igual que `product/0010` ya lo asume.
- **No requiere una spec `technical/`**: no introduce tokens, primitivos ni
  dependencias nuevas — reutiliza `--bp-columna` y los primitivos que
  `technical/0004` ya declaró.

## Decisiones abiertas

Ninguna.
