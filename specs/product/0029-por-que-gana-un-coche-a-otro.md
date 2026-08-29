# 0029 — Por qué gana un coche a otro

- **Id:** product/0029
- **Estado:** approved
- **Tipo:** product
- **Fecha:** 2026-08-29
- **Specs relacionadas:** product/0001, product/0009, product/0018,
  product/0022, product/0023, product/0024, technical/0010, technical/0011
- **ADRs relacionados:** 0004
- **Doc de estado:** `docs/estado/interfaz.md`, `docs/estado/dominio.md`

## Contexto

La aplicación sabe explicar **una nota**: `product/0001` desglosa cada eje
en sus sumandos, con la fuente de cada dato, los supuestos aplicados y las
penalizaciones activas, y `AxisBreakdown` guarda para cada eje su `score`,
su `weight` y la `contribution = score × weight` cuya suma reproduce el
`total` del coche (`src/domain/scoring/score.ts`).

Lo que no sabe explicar es **una diferencia**. Ninguna vista contesta «¿por
qué este y no ese?», que es la pregunta con la que se compra un coche:

- La clasificación (`#/`) ordena por `total` y pinta la nota como porcentaje
  **sin decimales** (`formatNumber(car.percentage, 0)`, `RankingRow.tsx`).
  Con el catálogo y los pesos de hoy, el Sportage HEV (55,59 %) y el CX-5
  (55,53 %) se pintan **los dos como «56 %»**, en puestos distintos y sin
  nada que diga de dónde sale ese orden.
- La ficha (`product/0018`) compara las veintidós magnitudes del modelo
  elegido con su Δ celda a celda, pero **ninguna de esas Δ está en las
  unidades de la nota**: la tabla dice que un coche tiene 40 litros más de
  maletero, no cuánto de la diferencia de nota explica ese maletero.
- El desglose por eje del ranking se despliega **coche a coche**: dos
  desgloses abiertos a la vez siguen sin restarse.

El resultado es que dos coches con la misma nota parecen intercambiables
cuando no lo son. Medido el 2026-08-29 sobre `src/data/cars.json` con los
pesos por defecto (`viaje 4 · diario 3 · fiabilidad 2 · estética 2 ·
prestaciones 1 · coste 1`), el **Kia EV3** y el **Honda Civic e:HEV** están
a **0,09 puntos porcentuales** —el mismo «54 %» en pantalla—, y por dentro
son coches opuestos: el EV3 saca **+5,77 pp en estética** y los devuelve
enteros en **uso diario (−3,93)** y **viaje (−3,48)**. Elegir entre ellos no
es indiferente: es cambiar de bando.

A esto se suma que los seis pesos se mueven **a ciegas**. `product/0012`
permite ajustarlos y compartir el resultado, pero nada dice si el orden que
sale aguanta un ajuste pequeño o se da la vuelta al primer empujón. Con los
pesos de hoy, el líder cambia si `viaje` baja de **1,5** o si `prestaciones`
sube de **2,1**; los otros cuatro ejes no lo cambian ni llevándolos a
cualquier extremo de su recorrido. Ese hecho no está en ninguna pantalla.

Hay una propiedad del modelo que hace todo esto barato y exacto, y que no
existía antes de la fase 3: desde que los seis ejes puntúan contra escalas
absolutas (ADR 0004), **la nota de un eje no depende de los pesos ni del
resto de candidatos**. El peso solo multiplica. Por tanto la diferencia de
nota entre dos coches es una **función lineal** de cualquier peso, y el
punto en que cambia de signo es una división, no una búsqueda.

## Objetivo

Que la aplicación conteste **por qué un coche gana a otro** repartiendo la
diferencia de nota entre los seis ejes, y **cuánto hay que mover un peso**
para que esa respuesta cambie.

## Alcance

- **El reparto de la diferencia entre dos coches puntuados**, eje a eje, en
  el dominio: una función pura que recibe dos `CarScoreBreakdown` y devuelve
  las seis líneas ordenadas, con la identidad `Σ líneas = diferencia de
  nota` garantizada por construcción.
- **Los rangos de peso que cambian el resultado** de ese par: por cada eje,
  el valor del peso en el que la diferencia cruza el cero, y si ese valor
  cae dentro del recorrido `0-10` del deslizador.
- **Su lectura en la ficha** (`#/ficha`): un bloque nuevo sobre la tabla,
  con el titular y las líneas, para el modelo enfocado frente al modelo de
  comparación.
- **Su lectura en la clasificación** (`#/`): un resumen de una línea dentro
  de la fila ya desplegable, frente al líder.
- **El estado vacío** cuando el modelo de comparación es la referencia
  (`references.json`, hoy el Alfa Romeo Giulietta), que no se puntúa.

## Fuera de alcance

- **El empate técnico.** No se declara ningún umbral por debajo del cual dos
  coches «empatan», ni se marca ninguna pareja como empatada, ni cambia la
  numeración de puestos ni el podio de `product/0022`. Es una decisión
  explícita: quien mira la comparativa juzga por sí mismo si una diferencia
  es pequeña, y para eso le basta con verla. Lo que faltaba no era el aviso,
  era el reparto.
- **La incertidumbre de los datos.** Que una magnitud sea estimada sigue
  marcándose donde ya se marca (`EstimatedMark`), y la nota no gana banda de
  error ni intervalo. Queda registrado como propuesta P11 en
  `docs/roadmap.md`, en espera.
- **Cómo se puntúa.** Ni un anclaje, ni una curva, ni un peso por defecto,
  ni la fórmula de ningún eje. Esta spec **lee** `scoreCatalog`, no lo
  reabre.
- **El catálogo.** Ningún dato, fuente ni foto cambia.
- **El orden de la clasificación**, que sigue siendo `total` descendente, y
  el filtro de presupuesto, que sigue funcionando igual.
- **Comparar más de dos coches a la vez** en términos de nota, y la
  sensibilidad conjunta —mover dos pesos a la vez—: un par y un peso cada
  vez.
- **La palabra «duelo»**, que en esta aplicación ya nombra otra cosa: la
  vista de la ficha en móvil que compara de uno en uno (`product/0023`,
  `.duelView`, `.duelChip`, `.duelCard`). Este bloque no la reutiliza.
- **El arranque de la ficha.** El modelo de comparación por defecto sigue
  siendo la primera referencia (`product/0018`, requisito 12;
  `FichaPage.tsx`), y esta spec no lo cambia: cuando ahí hay una referencia,
  enseña el estado vacío del requisito 6.
- **La barra de cuatro controles de la ficha** (`technical/0010`): no gana
  un quinto control, ni el bloque trae selector propio de rival.
- **Los colores de eje** (`technical/0011`), que se reutilizan tal cual.
- **Recordar si el bloque quedó plegado.** Ni en `localStorage` ni en la
  URL: el estado de vista que se persiste (`product/0024`) no cambia, y su
  versión tampoco.

## Requisitos / comportamiento esperado

1. **El reparto, en el dominio.** Una función pura recibe dos
   `CarScoreBreakdown` —A, el modelo enfocado, y B, el de comparación— y
   devuelve una línea por eje:
   1.1. El valor de la línea es `peso × (score_i(A) − score_i(B))`, que por
   construcción es también `contribution_i(A) − contribution_i(B)`.
   1.2. **La suma de las seis líneas es exactamente la diferencia de nota**
   `total(A) − total(B)`, dentro de la tolerancia de coma flotante que ya
   usa `score.test.ts`.
   1.3. Las líneas se ordenan por **valor absoluto descendente**: primero el
   eje que más explica, gane quien gane.
   1.4. Cada línea conserva por separado **el peso** y **la ventaja en la
   nota del eje** (`score_i(A) − score_i(B)`), no solo su producto: son dos
   cosas distintas —«es mejor» y «a ti te importa»— y la interfaz las
   distingue.
   1.5. Un eje con ventaja exactamente 0 **es una línea válida** con valor 0:
   que dos coches empaten en un eje es información, no ausencia de dato. La
   interfaz decide si la dibuja (requisito 3.5), el dominio no.
2. **Las unidades son las de la nota en pantalla.** El reparto se expresa en
   **puntos porcentuales del máximo alcanzable**, la misma magnitud que
   `percentage` (`percentageOf`), con **un decimal**. Con cero decimales
   —los que usa hoy la clasificación— diferencias reales se imprimirían como
   «0».
3. **En la ficha (`#/ficha`), un bloque sobre la tabla.** Para el modelo
   enfocado frente al de comparación:
   3.1. El bloque se rotula **«Detalle ejes»**, y ese mismo rótulo es el que
   usa la página que explica los cálculos (`product/0011`) cuando describe
   el reparto: un nombre, en los dos sitios.
   3.2. Un **titular** en una frase: quién gana y por cuánto.
   3.3. Las **líneas del requisito 1**, cada una con el nombre del eje, su
   color e icono (`technical/0011`), una barra que sale hacia el lado de
   quien gana ese eje desde un eje central común, y su valor con signo.
   3.4. Cada línea **lleva a su desglose**, que ya existe: el bloque es una
   entrada, no un destino.
   3.5. Los ejes con ventaja 0 se resumen en una línea de texto al final, en
   vez de dibujar barras de longitud cero.
   3.6. El bloque **se puede plegar**, y su estado **no se recuerda**: nace
   desplegado en cada carga. `ViewState` (`product/0024`) no cambia de forma
   ni sube de versión, y la URL compartible (`product/0012`) tampoco lo
   lleva.
4. **En la clasificación (`#/`), una línea en la fila desplegada.** La fila
   ya desplegable de `RankingRow` gana **una sola línea** que resume el
   reparto frente al **líder**: la diferencia de nota y los dos ejes de
   mayor valor absoluto, uno de cada signo cuando los haya. La fila del
   líder lo resume **frente al segundo**. Aparece en **todas las filas**,
   las tres del podio (`product/0022`, variante `'podium'`) incluidas: el
   podio y la lista comparten fila y comparten esta línea. No se añade
   ningún control nuevo ni se toca el desglose por ejes que ya se despliega
   debajo.
5. **La sensibilidad, junto al reparto.** Para el mismo par:
   5.1. Por cada eje se calcula el **peso de cruce**: el valor de ese peso
   —con los otros cinco fijos— en el que la diferencia de nota cambia de
   signo. Es exacto, no una búsqueda: la diferencia es lineal en el peso.
   5.2. Se enseñan **solo los ejes cuyo peso de cruce cae dentro de `0-10`**,
   el recorrido real del deslizador, con la dirección («por debajo de» / «por
   encima de») y el valor con un decimal.
   5.3. Los demás se resumen en **una línea plegada**: no cambian el
   resultado en todo el recorrido.
   5.4. Un eje con ventaja 0 no tiene cruce y cae siempre en el resumen de
   5.3: ningún peso multiplicando a cero cambia nada.
   5.5. Si **ningún** eje cruza dentro de `0-10`, se dice así en una frase:
   el resultado no depende de los pesos.
6. **Cuando no hay nota que comparar.** Si el modelo de comparación es una
   referencia —no se puntúa— o es «Ninguno» (`product/0018`, requisito 9),
   el bloque **no desaparece sin explicación**: enseña una frase que dice
   que esa fila es la referencia y no entra en la puntuación, y qué hacer
   para ver el reparto (elegir un candidato como comparación).
7. **El color nunca es la única codificación.** Cada línea lleva su rótulo
   de texto y su valor numérico junto al color y el icono del eje. Es
   requisito, no estilo: los seis colores de eje no se separan lo bastante
   como paleta categórica (deuda registrada el 2026-08-29 en
   `docs/roadmap.md`), y esta es la primera vista que los pone juntos.
8. **Se lee a cualquier ancho.** El bloque cumple lo que ya cumple el resto
   de la aplicación: sin desbordamiento horizontal del documento a 320, 390,
   768 y 1440 px (`product/0010`, `technical/0011`).

## Criterios de aceptación

> Obligatorios y verificables.

- [ ] Un test comprueba, sobre el catálogo real y con los pesos por defecto,
      que para todo par de coches publicados la suma de las seis líneas
      iguala `total(A) − total(B)` dentro de la tolerancia de coma flotante.
- [ ] Un test comprueba que las líneas salen ordenadas por valor absoluto
      descendente, y que el orden no depende del orden de `AXIS_ORDER`.
- [ ] Un test comprueba el caso medido en *Contexto*: EV3 frente a Civic
      e:HEV da estética `+5,8`, uso diario `−3,9` y viaje `−3,5` puntos
      porcentuales, y la suma de las seis líneas es `+0,1`.
- [ ] Un test comprueba que el peso de cruce es exacto: puesto el peso en
      ese valor, la diferencia de nota es 0; a un lado gana A y al otro
      gana B.
- [ ] Un test comprueba el caso medido en *Contexto*: para Tucson HEV
      frente a Tucson PHEV, los ejes con cruce dentro de `0-10` son
      exactamente `viaje` (1,5) y `prestaciones` (2,1).
- [ ] Un test comprueba que un eje con ventaja 0 no aporta cruce y queda en
      el resumen de ejes que no cambian el resultado.
- [ ] Un test comprueba que con el modelo de comparación puesto en la
      referencia, y con «Ninguno», la ficha enseña el texto del requisito 6
      y ninguna barra.
- [ ] Un test comprueba que la fila desplegada de la clasificación enseña la
      línea del requisito 4, que la del líder se compara con el segundo, y
      que el desglose por ejes sigue estando debajo.
- [ ] Un test comprueba que esa línea aparece también en las tres filas del
      podio, y que el podio conserva su composición.
- [ ] Un test comprueba que `ViewState` no cambia de forma ni de versión, y
      que una configuración guardada antes de esta spec se restaura igual.
- [ ] Verificación manual en navegador: el bloque de la ficha y la línea de
      la clasificación se leen sin desbordamiento horizontal del documento a
      320, 390, 768 y 1440 px.
- [ ] Verificación manual en navegador: cada línea del reparto lleva rótulo
      y valor legibles sin recurrir al color, y el enlace al desglose del eje
      funciona.
- [ ] La CI entera pasa en local, con la cobertura de `domain/` al 100 %.

## Dependencias y supuestos

- **Depende del ADR 0004 y de la fase 3.** El reparto y la linealidad solo
  valen porque ningún eje normaliza ya contra el conjunto de candidatos:
  `normalizeAll` no lo llama ninguno, y el peso solo multiplica. Si un eje
  futuro volviera a puntuar en relativo, esta spec deja de ser cierta y hay
  que revisarla.
- **Depende de `product/0018`** para el concepto de «modelo de comparación»
  y de `product/0022`/`product/0009` para la fila desplegable, y **no edita
  ninguna de las dos**: están `consolidated`.
- **Supone que el par a comparar ya está elegido** con los controles que
  hay: la comparación de la ficha y el líder de la clasificación. No añade
  ninguna forma nueva de elegirlo.
- **Supone que ambos coches están puntuados**, y por tanto publicados
  (`product/0015`): un coche despublicado no está en el ranking ni en la
  ficha.

## Decisiones abiertas

Ninguna.
