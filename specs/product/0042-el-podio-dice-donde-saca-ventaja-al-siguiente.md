# 0042 — El podio dice dónde saca ventaja al siguiente

- **Id:** product/0042
- **Estado:** draft
- **Tipo:** product
- **Fecha:** 2026-09-07
- **Specs relacionadas:** product/0022, product/0029, product/0031, technical/0011
- **ADRs relacionados:** 0004
- **Doc de estado:** `docs/estado/dominio.md`, `docs/estado/interfaz.md`

## Contexto

La lista de modelos **clasifica pero no compara**. Cada tarjeta del podio
(product/0022) enseña posición, nombre, línea de apoyo, porcentaje y barra:
todo son propiedades del coche a solas. Lo único que dice por qué un coche va
por delante de otro está **detrás de un clic** —la línea de resumen que
`product/0029` puso en la fila desplegada— y compara contra el líder, no
contra el vecino de puesto.

El resultado es que el orden se ve y no se entiende: entre el 1.º y el 2.º
del catálogo publicado hay hoy 1,22 puntos porcentuales, y nada en pantalla
dice de dónde salen sin desplegar la fila.

La maquinaria para decirlo ya existe entera y no hay que calcular nada nuevo:

- `splitScoreGap(a, b)` (`src/domain/scoring/scoreGap.ts`, product/0029)
  reparte la diferencia de nota en una línea por eje, con
  `value = peso × (score(A) − score(B))`.
- `AxisIcon` y `AXIS_THEME_CLASS` (technical/0011) dan icono y color por eje,
  los mismos que ya se ven en el desglose.
- `RankingList` ya conoce el orden completo del tramo elegible, así que sabe
  quién es el siguiente clasificado de cada coche.

Lo que falta no es cálculo, es **elegir qué línea se enseña y contra quién**.

### Por qué contra el siguiente y no contra el líder

`product/0029` compara cada fila con el líder —y la del líder con el
segundo— porque responde a «cuánto le falta a este coche para ganar». El
podio plantea otra pregunta, la de la escalera: **qué defiende cada puesto
frente al que viene justo detrás**. Comparar al 3.º con el 1.º no explica por
qué está 3.º y no 4.º.

Que el 3.º se compare con el **4.º**, que ya no está en el podio, es
deliberado: el rival de un puesto es quien lo disputa, esté o no en el podio.

### Por qué la ventaja se mide en puntos ponderados

Medir la ventaja en nota de eje (0-10) haría que el icono pudiera ser el de
un eje con peso 0 —hoy `prueba`—, que no aporta absolutamente nada al puesto:
el icono estaría nombrando un motivo que no existe. Medida en `value`
—peso × Δnota, la unidad del reparto de `product/0029` y la que ya se enseña
en pp— un eje de peso 0 vale 0 y no puede salir nunca, y el icono se mueve al
mover los deslizadores, que es justo lo que se quiere de un elemento
dinámico.

### Por qué no vale `topGapLines`

`topGapLines` devuelve la línea de mayor valor **absoluto**, que puede ser un
eje donde el coche **pierde**. Medido sobre el catálogo publicado con los
pesos por defecto, le pasa al líder: su línea de mayor valor absoluto frente
al 2.º es `prestaciones` con **−1,67 pp**. Un icono así diría exactamente lo
contrario de lo que se quiere decir. Hace falta un selector nuevo.

### Lo que se vería hoy

Medido con `scoreCatalog` sobre los dieciocho publicados y los pesos por
defecto:

| Puesto | Coche | Rival | Δ total | Eje de mayor ventaja | Valor |
| --- | --- | --- | --- | --- | --- |
| 1.º | Tucson HEV | Tucson PHEV | 1,22 pp | Capacidad de carga | +1,48 pp |
| 2.º | Tucson PHEV | Sportage HEV | 1,80 pp | Estética | +4,50 pp |
| 3.º | Sportage HEV | X-Trail e-Power | 0,28 pp | Coste total | +2,05 pp |

Tres iconos distintos, y ninguno es el que habría elegido `topGapLines` en
el primer caso. La tabla enseña además que **la ventaja de un eje puede ser
mayor que la diferencia total** —la estética del 2.º vale 4,50 pp y la
distancia con el 3.º es 1,80 pp—, porque el resto de ejes tiran en contra.
Por eso el elemento dice «donde más ventaja saca» y nunca «gana por esto».

## Objetivo

Que cada tarjeta del podio enseñe, sin desplegar nada, en qué eje saca más
ventaja al clasificado inmediatamente posterior, con el icono de ese eje.

## Alcance

- **Un selector nuevo en el dominio** que devuelve la línea de mayor ventaja
  de un `ScoreGap`.
- **El podio del ranking**: las tres tarjetas de `variant="podium"` del tramo
  elegible.
- **El rival de cada tarjeta**: el clasificado inmediatamente posterior
  dentro del tramo elegible, con el orden y los filtros vigentes.
- **La lectura por lector de pantalla** del elemento nuevo.

## Fuera de alcance

- **El resto de la lista** (`variant="list"`). El podio es donde se mira; una
  fila por coche con su icono es ruido, no información.
- **Un segundo icono de debilidad** —el eje donde ese coche pierde más frente
  al siguiente—. Se consideró y se deja fuera: duplica el elemento y obliga a
  distinguir el signo con color o con flecha, justo lo que esta spec evita al
  enseñar una sola cosa.
- **La cifra en pp junto al icono.** El elemento es discreto a propósito
  (decisión del usuario, 2026-09-07); la cifra exacta sigue estando en la
  línea de resumen al desplegar la fila y en el bloque «Detalle ejes» de la
  ficha.
- **Cambiar la referencia de comparación de `product/0029`**, que sigue
  siendo el líder para toda fila que no sea la suya, y el segundo para la del
  líder. Conviven dos referencias a propósito, y cada una responde a su
  pregunta.
- **El eje que decide el escalón** —el de `crossingsInRange`, cuyo peso,
  movido solo él, daría la vuelta al orden—. Es un dato distinto y ya
  calculado, pero no se lee de un vistazo; queda como propuesta.
- **Cualquier cambio en las notas, los pesos o el orden de la clasificación.**
  Esta spec no toca ningún eje.

## Requisitos / comportamiento esperado

1. **El selector.** `topAdvantageLine(gap)` devuelve la línea de `ScoreGap`
   con mayor `value` **estrictamente positivo**, o `undefined` si no hay
   ninguna. Vive en `src/domain/scoring/scoreGap.ts`, junto a las cuatro
   funciones que ya reparten la diferencia.
   1. Empate exacto entre dos líneas: gana la primera según `AXIS_ORDER`, de
      forma que dos ejecuciones con los mismos datos den siempre el mismo
      icono.
   2. Un eje de peso 0 tiene `value` 0 y por tanto nunca puede ser la línea
      devuelta.
   3. La interfaz no calcula nada de esto (`ui-no-scoring-internals`): recibe
      la línea ya elegida.
2. **El rival.** Para cada una de las tres primeras posiciones del tramo
   elegible, el rival es el coche de la posición inmediatamente siguiente en
   ese mismo tramo, con el filtro de decisión y los imprescindibles vigentes
   ya aplicados.
   1. La tercera tarjeta se compara con el 4.º clasificado aunque este no
      esté en el podio.
   2. Si no hay siguiente clasificado —el 3.º cuando solo hay tres coches
      elegibles, o un único coche— la tarjeta no enseña icono.
3. **El elemento.** La tarjeta del podio muestra el icono del eje de la línea
   devuelta por el requisito 1, junto al nombre del coche, con el color de su
   eje (`AXIS_THEME_CLASS`).
   1. Es el mismo dibujo y el mismo color que ese eje tiene en su desglose y
      en la ficha: el mapa eje → icono es único en toda la aplicación
      (technical/0011).
   2. Si el selector devuelve `undefined` no se pinta nada, sin hueco ni
      relleno.
   3. El icono queda **fuera** del botón que despliega la fila, para no
      cambiar su nombre accesible.
4. **La lectura accesible.** El icono va acompañado de texto solo para
   lectores de pantalla que nombra al rival, el eje y la ventaja en puntos
   porcentuales; el mismo texto está disponible como `title` para el puntero.
   1. `AxisIcon` sigue siendo `aria-hidden`, sin cambios: el significado lo
      lleva el texto de al lado, como en los otros tres sitios donde se usa.
   2. El significado nunca depende solo del color: lo llevan el dibujo y el
      texto, igual que `DecisionMark` lleva su rótulo.
5. **Es dinámico.** Mover un peso puede cambiar el icono, el rival y el
   propio podio, porque los tres salen de la misma clasificación recalculada.
6. **No cambia ninguna nota, ningún peso ni el orden de la clasificación.**

## Criterios de aceptación

> Obligatorios y verificables.

- [ ] `topAdvantageLine` devuelve la línea de mayor `value` positivo de un
      `ScoreGap`, y `undefined` cuando ninguna línea es positiva.
- [ ] Con dos líneas de idéntico `value` positivo, `topAdvantageLine`
      devuelve siempre la primera según `AXIS_ORDER`.
- [ ] Un eje con peso 0 y ventaja de nota a favor no es nunca la línea
      devuelta.
- [ ] Sobre el catálogo real y los pesos por defecto, las tres tarjetas del
      podio enseñan el icono de `carga`, `estetica` y `coste`, en ese orden,
      y ninguno es el eje de mayor valor absoluto del primer par
      (`prestaciones`, negativo).
- [ ] Una tarjeta de podio sin siguiente clasificado no contiene ningún
      icono de eje.
- [ ] Una fila con `variant="list"` no contiene ningún icono de eje, ni
      desplegada ni plegada.
- [ ] El icono no está dentro del elemento `button` que despliega la fila.
- [ ] El texto accesible del elemento nombra al rival, al eje y la ventaja en
      pp.
- [ ] El *snapshot* de `scoreCatalog` no cambia, y `npm run test:recovery`
      sigue en verde: ninguna nota se ha movido.
- [ ] La CI entera pasa en local, con el suelo de cobertura del dominio
      intacto.

## Dependencias y supuestos

- Depende de `product/0029` (el reparto de la diferencia) y de
  `technical/0011` (icono y color por eje), que no cambian.
- Depende de que los ejes puntúen contra escalas absolutas (ADR 0004): es lo
  que hace que `value` sea comparable entre ejes sin normalizar nada más.
- **Nace de una petición directa del usuario** (2026-09-07), no del repaso de
  producto. Es vecina de la propuesta **P13** —«qué renuncias si eliges el
  líder»—, descartada el 2026-08-29 porque la ficha comparada ya da esa
  información entre dos coches. El argumento nuevo que la separa: P13 miraba
  la **renuncia** del que gana y vivía en la ficha, previo clic; esta enseña
  la **fortaleza** relativa en la propia lista, sin abrir nada, y su rival no
  es el líder sino el vecino de puesto. Se registra como propuesta P23 en
  `docs/roadmap.md` con ese motivo.
- Se aprovecha el cambio para corregir el recuento obsoleto de
  `scoreGap.ts` —un comentario habla de «las siete entradas de `AXIS_ORDER`»
  cuando desde `product/0037` son ocho—, deuda registrada a la espera de una
  spec que tocara ese fichero.

## Decisiones abiertas

Ninguna.
