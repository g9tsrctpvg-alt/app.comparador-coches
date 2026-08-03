# 0002 — Robustez del núcleo de puntuación y desacoplo de la interfaz

- **Id:** technical/0002
- **Estado:** verified
- **Tipo:** technical
- **Fecha:** 2026-08-03
- **Specs relacionadas:** product/0001
- **ADRs relacionados:** 0003
- **Doc de estado:** `docs/estado/dominio.md`, `docs/estado/interfaz.md`

> ⚠️ **Spec histórica — implementada, sin consolidar.** Describe un cambio ya
> implementado: su sección *Contexto* retrata el sistema **anterior** al
> cambio y hoy no es cierta. **No es referencia del estado actual** — para
> eso, ver el **Doc de estado** indicado arriba. Vigentes aquí los
> **criterios de aceptación**, como registro de verificación.

## Contexto

`product/0001` dejó el comparador funcionando: el núcleo devuelve desgloses
explicables y la interfaz los renderiza sin recalcular nada. Una revisión de
código posterior encontró cinco defectos reales en ese código, ninguno
detectable por la CI actual.

El más grave es un fallo en cadena. `normalizeAll` calcula el mínimo y el
máximo con `raw.reduce(...)` sin valor inicial, así que **lanza
`TypeError: Reduce of empty array with no initial value` cuando el catálogo
está vacío** —comprobado ejecutándolo—. Ese caso es alcanzable por dos
caminos: `CatalogSchema` es `z.array(CarSchema)` sin `.min(1)`, de modo que
un `cars.json` truncado a `[]` valida como catálogo correcto; y en `App.tsx`
el `useMemo` que llama a `scoreCatalog` se ejecuta **antes** del
`if ('error' in catalogResult)`, con `cars = []`, de manera que cuando la
carga del catálogo falla se llama igualmente a `scoreCatalog([], …)`. El
resultado es que el mensaje «No se ha podido cargar el catálogo» que `App`
tiene preparado no llega a renderizarse nunca: sin *error boundary* en
`main.tsx`, React desmonta y el usuario ve una página en blanco. El manejo de
errores existe y está muerto.

El segundo es de acoplamiento. `RankingList` localiza las tres valoraciones
editables filtrando por el **texto de presentación** de los subcomponentes
—`label.startsWith('Nota exterior')`, `'Nota interior'`, `'Tu valoración'`—,
strings definidos en `axes/estetica.ts` y `axes/viaje.ts`. Reescribir esas
etiquetas es una edición cosmética que no toca ningún import: pasa
`typecheck`, `lint` y `arch:check`, y rompe los controles de valoración en
ejecución con un `assertDefined` lanzado. Es exactamente el acoplamiento que
`ui-no-scoring-internals` existe para impedir, pero la regla mira imports y
esto no lo es.

Los otros tres son de presentación: `Number(discarded.value)` sobre una
fuente descartada de valor textual —permitido por `SourceEntrySchema`, que
declara `z.union([z.number(), z.string()])`— renderiza `NaN`; el bloque de
normalización del eje llama a `formatValue` sin unidad, así que el eje
`coste` muestra euros como números pelados mientras sus propias filas de
entrada sí llevan `€`; y `coste` añade la línea «Descuento por valor
residual: −0 €» a cualquier coche sin `residualPct5y` cuando «pienso
venderlo» está activo, presentando como cero verificado lo que es un dato
ausente.

Ninguno lo detecta la CI: `src/ui/` no tiene tests y queda fuera del suelo de
cobertura, y el fallo del catálogo vacío no lo cubre ningún test de dominio.

## Objetivo

Que estos cinco defectos no puedan repetirse en silencio: que el núcleo falle
de forma explícita ante un catálogo vacío, que la interfaz deje de depender
del texto de presentación del dominio, y que la CI detecte la regresión de
cada uno.

## Alcance

- **Catálogo vacío**, en sus tres capas: rechazo en la carga, guarda
  explícita en `normalizeAll`, y orden de evaluación en `App` que no llame al
  motor de puntuación en la rama de error.
- **Clave estable para las valoraciones editables**: el dominio declara qué
  subcomponente es editable y cuál de los tres campos representa; la interfaz
  conmuta sobre esa clave y nunca sobre el texto mostrado.
- **Corrección de los tres defectos de presentación**: valor textual
  descartado, unidad en el bloque de normalización, y línea de residual para
  un coche sin el dato.
- **Revalidación de las valoraciones sobrescritas**: un *override* que salga
  del rango 1-5 que `UserRatingSchema` declara debe fallar, no colarse.
- **Tests de regresión** para cada uno de los puntos anteriores.

## Fuera de alcance

- **Meter `src/ui/` en el suelo de cobertura del 100%.** Esta spec añade los
  tests que cubren los fallos que corrige; si toda la interfaz debe entrar en
  el suelo es una decisión aparte, registrada como deuda.
- **Cotas por campo en los datos numéricos del catálogo** (precios o
  dimensiones negativas hoy validan). Es una unidad de trabajo propia:
  requiere decidir la cota correcta de dieciocho campos, no una regla global.
- **Añadir un *error boundary* de React.** El arreglo aquí es no llamar al
  motor en la rama de error; una red de seguridad genérica para toda la
  aplicación es una decisión de arquitectura aparte.
- **Cambiar cualquier fórmula o el orden de normalización de un eje.** La
  lectura del requisito 7 de `product/0001` sobre `estetica`/`coste` sigue
  pendiente de confirmación y no se toca aquí.
- **Refactorizar el andamiaje repetido de los seis ejes.** La revisión lo
  señaló como duplicación; no es un defecto de comportamiento y no entra.

## Requisitos / comportamiento esperado

1. `normalizeAll` con una lista vacía de candidatos lanza un error propio y
   descriptivo, no un `TypeError` genérico de `reduce`.
2. Un catálogo sin ningún coche es un error de carga: `parseCatalog` lo
   rechaza nombrando el problema, igual que rechaza un registro inválido.
3. `App` no invoca el motor de puntuación cuando la carga del catálogo ha
   fallado. El mensaje de error declarado se renderiza de verdad.
4. `SubcomponentBreakdown` declara un identificador estable y opcional del
   campo editable que representa. El dominio lo rellena en los subcomponentes
   de `estetica` y `viaje`.
5. La interfaz localiza las valoraciones editables por ese identificador.
   Ningún módulo de `src/ui/` compara, filtra ni conmuta sobre el texto de
   una etiqueta procedente del dominio.
6. Una fuente descartada de valor no numérico se muestra tal cual, sin
   convertirla a número.
7. El bloque de normalización de un eje muestra sus valores con la misma
   unidad que las demás cifras de ese eje.
8. Un coche sin `residualPct5y` no genera línea de descuento residual, esté
   como esté el supuesto «pienso venderlo».
9. Una valoración sobrescrita fuera del rango 1-5 falla de forma explícita en
   lugar de entrar al cálculo.

## Criterios de aceptación

> Obligatorios y verificables.

- [x] Existe un test que llama al motor de puntuación con un catálogo vacío y
      comprueba que el error es el declarado por `normalizeAll`, no un
      `TypeError` de `reduce`.
- [x] Existe un test que comprueba que `parseCatalog([])` falla, y que el
      mensaje identifica el catálogo vacío como causa.
- [x] Con la carga del catálogo fallando, la aplicación renderiza el mensaje
      de error y no lanza ninguna excepción — comprobado con un test que
      monta `App` con una carga que lanza.
- [x] Renombrar la etiqueta de presentación de un subcomponente editable en
      `axes/estetica.ts` o `axes/viaje.ts` no rompe los controles de
      valoración de la interfaz.
- [x] Una búsqueda de comparaciones sobre etiquetas del dominio en
      `src/ui/` no devuelve ninguna coincidencia.
- [x] Un desglose con una fuente descartada de valor textual muestra ese
      texto, y no `NaN`, en la lista de fuentes descartadas.
- [x] En el eje `coste`, las cifras del bloque de normalización se muestran
      en euros, igual que las de sus datos de entrada.
- [x] Con «pienso venderlo» activo, el desglose de un coche sin
      `residualPct5y` no contiene ninguna línea de descuento residual.
- [x] Una valoración sobrescrita a un valor fuera de 1-5 falla de forma
      explícita, comprobado por test.
- [x] La secuencia completa de CI pasa, con el suelo de cobertura vigente
      intacto.

## Dependencias y supuestos

- Depende de `product/0001`, ya `consolidated`: esta spec corrige el código
  que aquella introdujo, sin cambiar el comportamiento que documenta.
- Se asume que el suelo de cobertura sigue cubriendo `domain/`, `data/` y
  `logging/` al 100%, y que los tests nuevos de interfaz no lo alteran.
- Se asume que las fórmulas y el orden de normalización de los seis ejes se
  mantienen exactamente como están hoy.

## Decisiones abiertas

Ninguna.
