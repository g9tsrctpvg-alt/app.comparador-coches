# 0022 — El podio de la clasificación se distingue del resto

- **Id:** product/0022
- **Estado:** draft
- **Tipo:** product
- **Fecha:** 2026-08-18
- **Specs relacionadas:** product/0008, product/0009, product/0020
- **ADRs relacionados:** ninguno
- **Doc de estado:** `docs/estado/interfaz.md`

## Contexto

Hoy, `docs/estado/interfaz.md` describe la clasificación como una lista
uniforme: `RankingList` ordena los coches por `total` descendente y delega
cada uno a `RankingRow`, que renderiza siempre la misma fila —posición,
nombre, línea de apoyo (tecnología, potencia, aceleración, precio), marca de
«Fuera de presupuesto», puntuación y barra de proporción de 3px—, sea el
coche el primero o el último. La única pieza que distingue al líder es
`LeaderCard`, una tarjeta aparte por encima de los controles.

Esta spec nace de explorar el diseño de esa pantalla —maquetas estáticas
sobre los datos y puntuaciones reales del catálogo, revisadas con el
propietario del producto— y de dos decisiones que se tomaron ahí, sobre la
marcha:

1. **Los tres primeros coches merecen un tratamiento visual distinto del
   resto.** Es donde de verdad se decide la comparación, y hoy se ven
   exactamente igual que el décimo.
2. **La línea de apoyo cambia la potencia por el maletero.** El maletero es
   la magnitud de mayor peso dentro de la fórmula del eje `viaje`
   —`nota = 0,5 × escala(maletero) + 0,25 × escala(batalla) + 0,25 ×
   escala(anchura de hombros)`, `product/0017`— y `viaje` es, con los pesos
   por defecto, el eje que más pesa (4, frente a 1 de `prestaciones`, el eje
   al que pertenece la potencia). Hoy el maletero solo aparece dentro del
   desglose; la potencia, que pesa una décima parte de la decisión por
   defecto, aparece en la fila.

Lo que esta spec **no** hereda del boceto explorado en el lienzo es todo lo
que nadie pidió explícitamente: el boceto también encogía la tipografía del
resto de la lista y le quitaba la barra de proporción, para que las trece
filas cupieran cómodas en una maqueta. Ninguna de las dos cosas se pidió, y
encoger texto ya legible o quitar la única representación no numérica de la
puntuación (`product/0009`, requisito 4) no es gratis en accesibilidad. Esta
spec formaliza únicamente lo acordado: el podio se distingue, y la línea de
apoyo cambia de dato.

## Objetivo

Que la clasificación distinga visualmente el podio —los tres primeros
coches— del resto, y que la línea de apoyo de cada coche muestre el maletero
en vez de la potencia, en las dos partes de la lista.

## Alcance

- **La composición de `RankingList`**: separar los tres primeros coches de
  la lista visible (`rankVisible`, tras aplicar el filtro de presupuesto si
  está activo) del resto, y darles un tratamiento visual propio.
- **El tratamiento del podio**: tarjeta —no una fila simple— con el nombre y
  la posición a la izquierda, y a la derecha la línea de apoyo seguida de la
  puntuación, en una sola línea.
- **El tratamiento del resto**: la fila que ya existe hoy (`RankingRow`),
  sin más cambio que el dato que sustituye a la potencia.
- **El contenido y el orden de la línea de apoyo**, en las dos partes:
  tipo de motor, aceleración 0-100, maletero, precio — en ese orden, de
  izquierda a derecha, con la puntuación fuera de ese grupo.
- **Qué pasa con `LeaderCard`** frente a la tarjeta del primer clasificado
  del podio: se resuelve como parte de esta spec — ver *Decisiones
  abiertas*.

## Fuera de alcance

- **Cualquier puntuación, fórmula, peso o supuesto.** Es un cambio de qué
  dato se enseña y de cómo se agrupa, no de cómo se calcula.
- **La ficha técnica y la ficha completa** (`product/0013`, `product/0018`,
  `product/0020`). La potencia sigue en la ficha exactamente donde está; el
  conjunto «Esenciales» no se toca.
- **El comportamiento responsive general** de `product/0010` — los puntos de
  ruptura, el conmutador de vista, los paneles plegables—, más allá de
  comprobar que el podio no rompe el ancho de la página.
- **Nuevos tokens, primitivos o colores.** El podio se construye con lo que
  ya existe: `card`, `surfaceRaised`, `invertedSurface`, `proportionBarRow`,
  `mono`, `label`.
- **El filtro de presupuesto, `rankVisible` o la persistencia de la
  configuración.** Ninguno de los tres cambia.
- **Reducir la tipografía o quitar la barra de proporción del resto de la
  lista.** Ver *Contexto*: no se pidió y no se hace.
- **Las otras dos variantes exploradas en el mismo lienzo de diseño** —una
  tabla densa y una vista de distancia al líder—. Solo se implementa la del
  podio; las otras quedan como exploración, sin spec propia.

## Requisitos / comportamiento esperado

1. La clasificación se divide en dos grupos: el **podio** —los tres primeros
   coches de la lista visible— y **el resto**. Si la lista visible tiene
   tres coches o menos, el resto no se renderiza y el podio muestra
   exactamente los que hay, sin huecos ni relleno.
2. Cada coche del podio se renderiza como una **tarjeta** —fondo, sombra y
   radio reutilizados de `surfaceRaised`, con el mismo canto de acento a la
   izquierda que ya usan `LeaderCard` y `AxisBreakdownView`— en una sola
   línea: posición y nombre a la izquierda, con el mismo tratamiento
   tipográfico y el mismo hueco de posición de ancho fijo que hoy; a la
   derecha, la línea de apoyo seguida de la puntuación. Bajo esa línea, la
   misma barra de proporción de 3px que ya existe.
3. El resto de coches se sigue renderizando con el marcado y el estilo que
   `RankingRow` ya tiene hoy —posición, nombre, línea de apoyo, marca de
   presupuesto, puntuación, barra de proporción—, sin cambios de tamaño ni
   de disposición. El único cambio en esta parte es el del requisito 5.
4. La lógica de nombre accesible, `aria-expanded` y despliegue del desglose
   **no se duplica** entre el tratamiento de podio y el de fila: vive en un
   solo sitio, del que las dos variantes visuales son una capa de
   presentación distinta.
5. En las dos partes de la lista, la línea de apoyo muestra, en este orden:
   **tipo de motor** (etiqueta legible, nunca la sigla — `product/0008`),
   **aceleración 0-100** (con su marca de estimado si aplica), **maletero**
   en litros (`Car.trunkLiters`, leído directamente, igual que hoy se lee la
   potencia) y **precio**. La potencia (`powerCv`) deja de aparecer en la
   línea de apoyo de la clasificación.
6. La marca de «Fuera de presupuesto» se conserva **con su propio texto**,
   no solo con el color del precio, en las dos partes de la lista —
   `product/0009`, requisito 8, sigue vigente y esta spec no lo relaja.
7. La puntuación del podio se distingue de la del resto por ser mayor, sin
   dejar de usar la escala tipográfica ya declarada en `technical/0004`
   (ningún tamaño nuevo).
8. Todo lo demás del comportamiento de una fila —controles de valoración
   editables antes que el desglose por eje, orden de los seis ejes,
   contenido íntegro del desglose— se mantiene igual en las dos partes de la
   lista. Ninguna información desaparece: lo que cambia es dónde vive el
   maletero (de solo-desglose a también-línea-de-apoyo) y dónde deja de
   vivir la potencia (de línea-de-apoyo a solo-desglose, donde ya aparece
   como dato de entrada del eje `prestaciones`).

## Criterios de aceptación

> Obligatorios y verificables.

- [ ] Con el catálogo real, pesos y presupuesto por defecto: los tres
      primeros coches de la clasificación (Tucson HEV, Tucson PHEV, Sportage
      HEV) se renderizan con el tratamiento de tarjeta de podio; los diez
      restantes, con el tratamiento de fila que ya existe hoy. Comprobado
      con un test que cuenta cuántos nodos llevan cada tratamiento.
- [ ] La puntuación de los trece candidatos publicados es **idéntica** antes
      y después del cambio: `scoreCatalog.snapshot.test.ts` sigue en verde
      sin modificar sus valores esperados.
- [ ] La línea de apoyo de cada coche —podio y resto— contiene, en este
      orden, el tipo de motor, la aceleración 0-100, el maletero en litros y
      el precio; no contiene la potencia. Comprobado recorriendo el marcado
      de `RankingList` y afirmando el orden y la ausencia de «CV».
- [ ] El maletero se lee de `rawCar.trunkLiters`, nunca calculado por la
      interfaz: `npm run arch:check` sigue en verde y `ui-no-scoring-internals`
      no reporta ninguna importación nueva hacia `domain/scoring/axes/`.
- [ ] Un coche fuera de presupuesto se distingue con texto, no solo con
      color, en el podio y en el resto. Verificación a mano con el navegador
      en escala de grises, declarada como tal.
- [ ] El control de despliegue conserva su nombre accesible —posición y
      nombre del coche, «ver desglose» / «ocultar desglose», sin puntuación
      ni marca de presupuesto embutidas— en las dos partes de la lista.
      Verificado con Playwright.
- [ ] Con tres coches o menos visibles (filtro de presupuesto activo con un
      presupuesto muy bajo sobre `threeCarFixture`), la clasificación
      renderiza solo el podio, con tantas tarjetas como coches haya, y no
      deja un hueco ni un rótulo vacío donde iría el resto.
- [ ] Revisión de código: la lógica de `aria-expanded` y de nombre accesible
      vive en un único lugar; no hay una copia para el podio y otra para el
      resto.
- [ ] Ninguna puntuación, fórmula, peso o supuesto cambia:
      `ui-no-scoring-internals` sigue pasando sin modificar
      `.dependency-cruiser.mjs`.
- [ ] Ningún componente de `src/ui/` contiene un literal de color, espaciado
      o tipografía nuevo: `scripts/validateStyleTokensRepo.test.ts` sigue en
      verde sin añadir tokens.
- [ ] El contraste de todo texto de la tarjeta del podio —incluida la línea
      de apoyo sobre su fondo, y el tratamiento del primer clasificado según
      lo que resuelva la decisión abierta de esta spec— cumple WCAG AA
      (≥4,5:1 texto normal, ≥3:1 texto grande y barras), medido igual que
      `product/0009`.
- [ ] Sobre el build de producción, en un navegador real, con las trece
      filas del catálogo real: el podio y el resto de la lista se leen sin
      desplazamiento horizontal del documento a 320, 592, 960 y 1440px.
- [ ] `npm run format:check`, `npm run lint`, `npm run typecheck`,
      `npm run arch:check`, `npm run test:coverage` y `npm run build` pasan
      en local.

## Dependencias y supuestos

- **Depende de `product/0009`**, que define el marcado y el estilo de la
  fila que el resto de la lista conserva, y la tarjeta del líder cuyo futuro
  decide esta spec. Esta spec **amplía** ese requisito 6 (única superficie
  invertida): lo deja vigente o lo sustituye, según la decisión abierta, pero
  no lo deja ambiguo.
- **Depende de `product/0008`**, cuya etiqueta legible de tecnología sigue
  usándose sin cambios, en las dos partes de la lista.
- **No toca `product/0020`**: la ficha sigue mostrando potencia en
  «Esenciales», con su `FieldDef` intacto.
- Asume que `trunkLiters` sigue siendo un campo obligatorio de `Car` con
  unidad `L`, como hoy lo es para los dieciséis coches del catálogo,
  publicados o no.
- Asume que los tests de interfaz siguen siendo `renderToStaticMarkup` sin
  jsdom: los criterios de contraste, escala de grises y ancho responsive son
  manuales, igual que en `product/0009`.
- **No requiere una spec `technical/`**: no introduce tokens, primitivos,
  dependencias nuevas ni cambios de arquitectura — reutiliza los primitivos
  que `technical/0004` ya declaró.

## Decisiones abiertas

- **Qué pasa con `LeaderCard` frente a la tarjeta del primer clasificado del
  podio.** El boceto explorado en el lienzo de diseño le da a esa tarjeta el
  mismo fondo `ink`/texto `paper` que `LeaderCard`, lo que crearía una
  segunda superficie invertida y rompería el requisito 6 de `product/0009`
  («Es la **única** superficie invertida de la interfaz: si se usa dos
  veces, deja de señalar nada»). Dos salidas, ninguna aplicada todavía:
  - **A. `LeaderCard` desaparece** y la tarjeta del primer clasificado del
    podio pasa a ser la única superficie invertida, ahora dentro de la
    propia lista en vez de por encima de los controles. Quita una
    repetición del mismo dato (el líder ya se ve, con más detalle, en el
    podio) pero cambia una pieza con nombre propio desde `product/0009`.
  - **B. `LeaderCard` se queda** y la tarjeta del primer clasificado del
    podio usa el mismo tratamiento elevado que las otras dos —sin fondo
    `ink`—, distinguida solo por el acento de su puntuación. Es el cambio
    más pequeño y no toca `product/0009`, pero dos tarjetas que nombran al
    mismo coche como «el primero», con tratamientos distintos, es la
    redundancia que el requisito 6 quería evitar desde el principio.

  Esta decisión la toma quien apruebe la spec; los requisitos 2 y el
  criterio de contraste correspondiente se ajustan a lo que se decida antes
  de pasar a `approved`.
