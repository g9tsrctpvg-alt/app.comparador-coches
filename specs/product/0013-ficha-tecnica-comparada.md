# 0013 — La ficha técnica comparada

- **Id:** product/0013
- **Estado:** draft
- **Tipo:** product
- **Fecha:** 2026-08-06
- **Specs relacionadas:** product/0001, product/0009, product/0010, technical/0004
- **ADRs relacionados:** 0003, 0006
- **Doc de estado:** `docs/estado/interfaz.md`, `docs/estado/dominio.md`

## Contexto

El artefacto original tiene **dos vistas**, no una. Un conmutador bajo el
titular alterna entre «Clasificación» —el ranking ponderado, que es lo que el
proyecto ha migrado— y «Ficha técnica», que es una tabla comparada y **no se
ha migrado nunca**.

No aparece en el roadmap, ni en `docs/estado/interfaz.md`, ni en ninguna spec.
La fase 4 se describía a sí misma como «terminar de traer el artefacto», y
resulta que lo que faltaba no era solo el aspecto: faltaba media aplicación.

La vista responde una pregunta que el ranking no responde. El ranking dice
**qué coche gana con estos pesos**; la ficha técnica dice **en qué se
diferencian de verdad**, dato a dato, y en particular cuánto más grandes son
que el coche que se va a sustituir. Son las dos preguntas de quien cambia de
coche, y hoy la aplicación solo contesta a una.

Su pieza central es la **fila de referencia del Alfa Romeo Giulietta**: el
coche a sustituir. Cada columna dimensional lleva al lado una columna Δ con la
diferencia respecto a ella, coloreada según mejore o empeore. La anchura, que
es la prioridad declarada del proyecto desde el principio, va además en
negrita. Sin esa fila la tabla es una lista de cifras; con ella es una
respuesta.

Esa fila es también una **deuda registrada** desde el 2026-08-03:
`cars.json` no la tiene, `product/0001` no la pedía, y su condición de cierre
es literalmente «que una spec futura la pida explícitamente». Esta es esa
spec.

La tabla trae además una métrica que el dominio no calcula: **litros de
maletero por metro cuadrado de huella en el suelo** —`maletero / (largo ×
ancho)`, en L/m²—, que mide cuánto espacio da un coche por el sitio que ocupa.
Es la cifra que distingue a un coche bien aprovechado de uno que solo es
grande, y ningún eje de puntuación la recoge.

## Objetivo

Que se pueda comparar a los candidatos dato a dato, y medir cuánto crece cada
uno respecto al coche al que sustituyen.

## Alcance

- **Una segunda vista** de la aplicación, con el conmutador entre ella y la
  clasificación.
- **La tabla comparada**, con una fila por candidato, ordenada por longitud.
- **La fila de referencia del Alfa Romeo Giulietta**, destacada como tal, y
  su alta en el catálogo con sus fuentes.
- **Las columnas Δ** frente a la referencia, con su signo y su color según
  mejoren o empeoren.
- **La métrica derivada de litros por metro cuadrado**, calculada en el
  dominio.
- **La marca de dato estimado**, coherente con la que `product/0009` fija para
  el desglose.
- **El comportamiento de la tabla cuando no cabe**: desplazamiento propio con
  la columna del modelo fijada.

## Fuera de alcance

- **Puntuar nada.** La ficha técnica no tiene notas, ni pesos, ni
  aportaciones. Enseña datos; el juicio lo pone la clasificación. La
  Giulietta, en particular, **no entra en la puntuación**: es referencia, no
  candidata, y no aparece en el ranking ni desplaza a nadie.
- **Ordenar por cualquier columna.** El artefacto ordena por longitud y punto.
  Una tabla ordenable es funcionalidad nueva, y esta spec migra lo que había.
- **Editar datos desde la tabla.** Las valoraciones se siguen editando desde
  el desglose del ranking, que es su único sitio.
- **Añadir datos que el catálogo no tiene**, más allá de la fila de la
  Giulietta que esta spec da de alta explícitamente.
- **El eje de autonomía y repostaje.** La tabla no trae columna de autonomía
  aunque sería el sitio natural: ese trabajo está en el roadmap con su propia
  spec pendiente y sus propios datos por conseguir.
- **La jerarquía visual y los tokens**, que son `product/0009` y
  `technical/0004`.

## Los datos de la fila de referencia

| Dato | Valor | Nota |
| --- | --- | --- |
| Nombre | Alfa Romeo Giulietta | |
| Tecnología | Gasolina (`ICE`) | Es el único `ICE` del catálogo, que hoy no usa ningún candidato |
| Longitud | 4.351 mm | |
| Anchura | 1.798 mm | La cifra contra la que se mide todo lo demás |
| Altura | 1.465 mm | |
| Altura libre al suelo | 130 mm | Estimada en el artefacto |
| Maletero | 350 L | |

Son los valores del artefacto, y **entran al catálogo con el mismo régimen de
fuentes que cualquier otro dato**: cada uno con su `SourceEntry`, su marca de
estimación y su fuente vigente. Un dato sin fuente no entra, aunque venga del
artefacto — la regla de `product/0001` no tiene excepciones y esta spec no
crea la primera.

## Requisitos / comportamiento esperado

1. **La aplicación tiene dos vistas** —clasificación y ficha técnica— y un
   conmutador entre ellas, con la vista activa señalada visualmente y
   comunicada de forma accesible.
2. **La vista activa viaja en la URL**, con el mismo mecanismo de fragmento
   que `product/0011` establece para la página de explicación. Compartir un
   enlace estando en la ficha técnica lleva a la ficha técnica.
3. **La Giulietta se da de alta como referencia en una lista separada**, con
   su propio esquema y sus fuentes, no como una fila más de la lista de
   candidatos marcada con un booleano. El booleano sería menos código y
   dejaría abierto que alguien olvide filtrar antes de puntuar; con dos listas
   ese olvido **no es expresable**, porque no hay ningún punto del programa en
   el que una referencia esté donde se esperan candidatos.
4. **Una referencia tiene solo los datos que la tabla compara** —identidad,
   tecnología, dimensiones y maletero—, y **no** los que solo sirven para
   puntuar: ni consumo, ni fiabilidad, ni garantía, ni residual, ni
   valoraciones del usuario. Su esquema comparte con `CarSchema` la forma de
   los datos con fuente, no la lista de campos.
5. **La lista de referencias admite más de una** por construcción, y hoy tiene
   exactamente una. No hace falta decidir ahora si algún día habrá otra: la
   estructura ya la admite sin coste, y las columnas Δ se calculan contra la
   referencia vigente, no contra «la Giulietta» escrita en el código.
6. **Ninguna puntuación cambia** por dar de alta la referencia. `scoreCatalog`
   sigue recibiendo la lista de candidatos y no conoce la de referencias —
   pero el criterio se comprueba de todos modos, porque es exactamente el
   fallo que un alta descuidada provocaría.
7. **La tabla lleva una fila por candidato más la de referencia**, ordenadas
   por longitud ascendente, con la referencia destacada y rotulada como tal.
8. **Cada columna dimensional lleva su columna Δ** frente a la referencia, con
   signo explícito —`+164`, `−12`, `0`— y color según mejore o empeore. La
   dirección de «mejor» **depende del dato**: en maletero más es mejor; en
   anchura y longitud, más es peor, porque el problema que el proyecto resuelve
   es que los sustitutos son más grandes.
9. **La columna Δ de anchura se destaca sobre las demás.** Es la prioridad
   declarada del proyecto y la que gobierna el eje `diario` con un 60 %.
10. **El color no es el único portador del signo.** El `+` y el `−` van
    escritos: quien no distinga el verde del naranja lee la diferencia igual.
11. **La métrica de litros por metro cuadrado la calcula el dominio**, no la
    interfaz, y se muestra con una unidad legible. La regla
    `ui-no-scoring-internals` sigue rigiendo: `src/ui/` no divide nada.
12. **Los datos estimados se marcan**, con la misma convención que
    `product/0009` fija para el desglose, y con su explicación accesible.
13. **La tabla no arrastra la página cuando no cabe**: se desplaza dentro de
    su contenedor, con la columna del modelo fijada a la izquierda para no
    perder de vista de qué coche es cada fila. Es el requisito 13 de
    `product/0010` aplicado aquí.
14. **La tabla es una tabla de verdad** —`table`, `thead`, `th` con su
    `scope`—, no una rejilla de `div`. Es tabular por naturaleza, y un lector
    de pantalla debe poder recorrerla por filas y columnas.
15. **La tabla explica sus propias convenciones**: qué es Δ, qué significan
    los colores, qué es L/m² y qué marca un dato estimado. El artefacto ya lo
    hace en un párrafo al pie, y ese párrafo se migra.

## Criterios de aceptación

> Obligatorios y verificables.

- [ ] La aplicación tiene dos vistas alcanzables desde un conmutador, y
      recargar con el fragmento de la ficha técnica **sobre el sitio
      desplegado en GitHub Pages** abre la ficha técnica.
- [ ] La puntuación total de los once candidatos es **idéntica** antes y
      después de dar de alta la Giulietta. Test sobre `scoreCatalog`.
- [ ] El ranking sigue mostrando once coches, y la Giulietta no aparece en él.
- [ ] La carga del catálogo sigue exigiendo exactamente una fuente vigente por
      dato, y la fila de la Giulietta la cumple en todos sus campos.
- [ ] `scoreCatalog` no acepta una referencia: pasarle una es un error de
      tipos que no compila. Es la propiedad que se compra con la lista
      separada, y si no se cumple, el modelado elegido no está bien hecho.
- [ ] Añadir una segunda referencia al fichero de datos no exige tocar ningún
      componente: las columnas Δ salen de la referencia vigente, no de un
      identificador escrito en el código. Se comprueba añadiéndola en local y
      revirtiendo.
- [ ] La tabla muestra doce filas ordenadas por longitud ascendente, con la
      Giulietta rotulada como referencia.
- [ ] La fila de la Giulietta muestra `—` en sus propias columnas Δ, no `0`:
      no se compara consigo misma.
- [ ] Una Δ de maletero positiva y una Δ de anchura positiva se muestran con
      colores **distintos**, porque una mejora y la otra empeora.
- [ ] Todos los valores Δ llevan su signo escrito. Se comprueba con el
      navegador en escala de grises: la información se conserva.
- [ ] El cálculo de L/m² tiene su test en el dominio, con un caso conocido
      comprobado a mano.
- [ ] Buscar una división o una multiplicación de dimensiones en `src/ui/` no
      devuelve ninguna coincidencia, y `npm run arch:check` pasa.
- [ ] La tabla usa `table`, `thead` y `th` con `scope`, y se recorre con un
      lector de pantalla anunciando la cabecera de cada columna.
- [ ] A 320 px la tabla se desplaza dentro de su contenedor, la columna del
      modelo permanece visible, y
      `document.documentElement.scrollWidth` no supera el ancho del viewport.
- [ ] La leyenda de la tabla explica Δ, los colores, L/m² y la marca de
      estimado.
- [ ] `npm run format:check`, `npm run lint`, `npm run typecheck`,
      `npm run arch:check`, `npm run test:coverage` y `npm run build` pasan
      en local.

## Dependencias y supuestos

- **Cierra la deuda de la fila de la Giulietta** registrada el 2026-08-03,
  cuya condición era «que una spec futura la pida explícitamente». La pide.
- **Depende de `technical/0004` y `product/0009`** para verse como el resto de
  la aplicación, y de **`product/0010`** para el requisito 13.
- **Comparte mecanismo de navegación con `product/0011`.** Las dos introducen
  una vista alcanzable por fragmento de URL; se implemente la que se
  implemente primero, la segunda reutiliza el mecanismo y no monta otro.
- **No depende de la fase 3.** No puntúa nada.
- Dar de alta una **referencia** obliga a distinguir en el modelo entre coche
  candidato y coche de referencia, con esquemas separados (requisitos 3 y 4).
  Es un cambio de dominio pequeño pero real, y es la razón por la que esta
  spec declara `docs/estado/dominio.md` como segundo doc de estado.
- El coste del modelado elegido es **duplicar la parte común del esquema**
  —identidad, dimensiones, maletero— entre candidatos y referencias. Se paga a
  sabiendas: `estilo.md` §1 dice que duplicar en el núcleo es preferible a
  acoplarlo, y aquí la alternativa era un booleano que permite que una
  referencia acabe puntuada.
- Se asume que los siete datos de la tabla de referencia son los del
  artefacto, y que **hay que encontrarles fuente publicada** antes de
  implementar. Si alguno no la tiene, entra marcado como estimado, no se
  inventa una fuente. La altura libre de 130 mm ya viene marcada como
  estimada en el propio artefacto.
- Se asume que el catálogo se sigue editando a mano en el repositorio.

## Decisiones abiertas

Ninguna.
