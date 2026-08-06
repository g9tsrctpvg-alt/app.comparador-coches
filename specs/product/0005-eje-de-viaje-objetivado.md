# 0005 — El eje de viaje, objetivado en dos escalas absolutas

- **Id:** product/0005
- **Estado:** implemented
- **Tipo:** product
- **Fecha:** 2026-08-05
- **Specs relacionadas:** product/0001, product/0002, product/0004
- **ADRs relacionados:** 0004
- **Doc de estado:** `docs/estado/dominio.md`

> ⚠️ **Spec histórica — implementada, sin consolidar.** Describe un cambio ya
> implementado: su sección *Contexto* retrata el sistema **anterior** al
> cambio y hoy no es cierta. **No es referencia del estado actual** — para
> eso, ver el **Doc de estado** indicado arriba. Vigentes aquí los
> **criterios de aceptación**, como registro de verificación.

## Contexto

El eje `viaje` mide el espacio y el confort en viajes largos. Es el eje de
**mayor peso del modelo** —4 sobre 13, el 31%— y hoy no tiene fórmula: es una
valoración de 1 a 5 que da el usuario sobre fotos de catálogo, normalizada
después contra los otros diez candidatos.

Una primera versión de esta spec se limitaba a quitar la normalización,
traduciendo la valoración con `(v − 1) × 2,5`. Eso arreglaba una deformación
real —de los once candidatos, tres tenían un 4 y ocho un 3, y la
normalización convertía ese único escalón en la diferencia entre 10,0 y 0,0,
o sea 40 puntos del total— pero dejaba en pie un problema más grande, que
solo se vio al mirar los datos.

**La valoración no estaba midiendo lo que el eje dice medir.**

| Coche | Viaje | Ext | Int | Maletero |
| --- | --- | --- | --- | --- |
| X1 xDrive25e | **4** | 5 | 5 | 490 L |
| Tonale | **4** | 4 | 4 | 500 L |
| NX 350h | **4** | 4 | 4 | 549 L |
| Sportage HEV | 3 | 2 | 4 | **587 L** |
| CX-5 | 3 | 4 | 3 | **583 L** |
| CR-V e:HEV | 3 | 2 | 3 | **579 L** |

Los tres maleteros más grandes del catálogo son los tres que sacan la nota
más baja. Sobre los once candidatos:

| Correlación | r |
| --- | --- |
| viaje ↔ maletero | **+0,08** |
| viaje ↔ estética interior | **+0,77** |
| viaje ↔ precio | +0,63 |

El eje de espacio no tiene relación con la única medida de espacio del
catálogo, y sí una fuerte con lo bonito que parece el interior. Los tres
coches valorados con un 4 son los tres de marca premium, juzgados en fotos.

La consecuencia es que **el aspecto del interior pesaba cerca de un tercio
del total bajo dos nombres distintos**: `estetica` lo cuenta con 0,4 × 2 =
0,8 de 13, y `viaje` añadía 4 de 13 correlacionados al 0,77 con eso mismo.

Con solo dos niveles del 1-5 en uso y once candidatos, la correlación es un
instrumento tosco y conviene decirlo. Lo del maletero se sostiene sin
estadística.

**Y hay una razón de principio, no solo de datos.** Los cuatro ejes medidos
anclan su 10 y su 0 contra el mundo: un Corsa, 47.000 €, 6,5 segundos, el 64
de Land Rover. `viaje` no anclaba contra nada. Para que «misma nota, mismo
peso, mismos puntos» signifique algo, la misma nota tiene que querer decir lo
mismo en todos los ejes; si no, es aritméticamente justo y semánticamente
falso.

A diferencia de `estetica` —donde el gusto no tiene referente externo y una
valoración autocontenida es la herramienta correcta—, «cabe el equipaje y se
viaja cómodo» es una afirmación sobre el mundo. Y el mundo se mide.

## Objetivo

Que la nota de viaje salga de medidas del coche con su fuente, no de una
impresión sobre fotos, y que deje de duplicar lo que ya mide `estetica`.

## Alcance

- **Dos magnitudes medidas con su escala absoluta cada una**: capacidad de
  maletero y batalla —distancia entre ejes— como medida del espacio para los
  ocupantes de atrás.
- **La forma de la escala**: la misma curva en S de `product/0002`.
- **La combinación de ambas** con un reparto declarado.
- **La retirada de la valoración subjetiva de viaje**: deja de puntuar y deja
  de editarse desde el ranking.
- **El desglose del eje**: las dos magnitudes con su valor, sus anclajes y su
  nota.

## Fuera de alcance

- **La autonomía.** Es la mayor diferencia práctica entre estos once coches
  en un viaje largo —los térmicos e híbridos hacen 640-950 km con un
  depósito, los eléctricos la mitad en autopista— y el modelo es hoy
  completamente ciego a ella. No entra aquí a propósito: meter eléctricos y
  térmicos en una misma escala de autonomía mezcla cosas distintas, porque lo
  que molesta no es solo el alcance sino el tiempo de repostaje. Es materia
  de un eje propio, no de un sumando de este.
- **El peso 4 del eje.** Sigue siendo decisión del usuario. Lo que esta spec
  cambia es que ese peso se aplicaba sobre una nota que medía otra cosa.
- **Un eje subjetivo de conducción**, tras probar los coches. Está en el
  roadmap y es donde vuelve el juicio de primera mano, con las cosas que una
  ficha técnica no recoge: butacas, ruido, suspensión.
- **La estética.** Se queda exactamente como está: es el único eje donde una
  valoración sin anclaje externo es lo correcto.

## Las dos escalas

| Magnitud | Nota 10 | Nota 0 |
| --- | --- | --- |
| Capacidad de maletero | **desde 620 L** | **hasta 250 L** |
| Batalla | **desde 2.850 mm** | **hasta 2.400 mm** |

Entre anclajes, la misma **curva en S** que fija `product/0002`:
`nota = 10 × (1 − t²(3 − 2t))`.

### De dónde salen los anclajes

Calibrados contra modelos conocidos, con sus medidas de
[motor.es](https://www.motor.es/):

| Modelo | Maletero | Batalla | Nota del eje |
| --- | --- | --- | --- |
| Skoda Superb Combi | 690 L | 2.841 mm | 10,0 |
| Skoda Superb berlina | 645 L | 2.837 mm | 10,0 |
| Alfa Romeo Giulietta | 350 L | 2.634 mm | 3,2 |
| Dacia Sandero | 328 L | 2.604 mm | 2,4 |

El techo de las dos escalas es el **Skoda Superb**, que es la referencia
generalista de «coche para viajar en familia»: a partir de ahí el problema
deja de existir, y lo que hay por encima son monovolúmenes y furgonetas, otra
categoría. El suelo es un utilitario de ciudad, donde el equipaje de cuatro
personas ya no cabe.

**La batalla es una magnitud floja, y conviene saberlo.** Los once candidatos
caben en 179 mm, y el Superb está solo 26 mm por encima del CX-5, el más
largo entre ejes de la lista. Recorre 4,5 puntos frente a los 5,8 del
maletero. Entra igual porque el espacio para los de atrás es parte real del
confort de viaje y es el único proxy publicado, pero va a aportar poco. Según
el ADR 0004, eso es comportamiento correcto: un eje en el que los candidatos
apenas difieren debe influir poco, no fabricar diferencias.

### El reparto: 0,6 maletero / 0,4 batalla

El maletero pesa más porque es la restricción que **se incumple**: el
equipaje cabe o no cabe, y si no cabe, se deja en casa. El espacio de atrás
es gradual —se va más o menos cómodo— y además su medida es indirecta: la
batalla reparte entre habitáculo y vanos, así que dos coches con la misma
batalla pueden dar distinto sitio a las piernas.

## Dónde caen los candidatos

| Coche | Maletero | Nota | Batalla | Nota | Eje | Antes |
| --- | --- | --- | --- | --- | --- | --- |
| CX-5 | 583 L | 9,7 | 2.815 | 9,8 | **9,8** | 5,0 |
| CR-V e:HEV | 579 L | 9,7 | 2.701 | 7,4 | 8,8 | 5,0 |
| Sportage HEV | 587 L | 9,8 | 2.680 | 6,8 | 8,6 | 5,0 |
| NX 350h | 549 L | 9,0 | 2.690 | 7,1 | 8,3 | 7,5 |
| X1 xDrive25e | 490 L | 7,2 | 2.692 | 7,2 | 7,2 | 7,5 |
| Tonale | 500 L | 7,5 | 2.636 | 5,4 | 6,7 | 7,5 |
| EV3 | 460 L | 6,0 | 2.680 | 6,8 | 6,3 | 5,0 |
| Kona HEV · Eléctrico | 466 L | 6,2 | 2.660 | 6,2 | 6,2 | 5,0 |
| Corolla Cross | 473 L | 6,5 | 2.640 | 5,5 | 6,1 | 5,0 |
| Civic e:HEV | 410 L | 4,0 | 2.734 | 8,3 | 5,7 | 5,0 |

**El eje se da la vuelta**, que es justo lo que la correlación de +0,08
anunciaba. Los tres primeros son los tres que la valoración subjetiva ponía
al fondo. El Civic queda último por maletero pese a ser el segundo en batalla:
es una berlina baja, va bien de piernas y mal de bultos.

Las escalas **no dependen del catálogo**: son las mismas con once candidatos
que con uno.

## Requisitos / comportamiento esperado

1. La capacidad de maletero se puntúa contra su escala absoluta: nota 10 en
   620 L o por encima, nota 0 en 250 L o por debajo, curva en S entre ambos.
2. La batalla se puntúa contra la suya: nota 10 en 2.850 mm o por encima,
   nota 0 en 2.400 mm o por debajo, curva en S entre ambos.
3. Las dos notas se combinan al 0,6 maletero / 0,4 batalla.
4. Ninguna nota de este eje depende de qué otros coches haya en el catálogo.
5. El eje deja de declarar que no tiene fórmula: ahora la tiene y se muestra.
6. **La valoración subjetiva de viaje desaparece**: no puntúa, no se edita
   desde el ranking y no figura en el desglose.
7. Los anclajes son parte del modelo, no un supuesto global editable desde el
   panel.
8. El desglose muestra, para cada magnitud, el valor del coche, los dos
   anclajes de su escala y la nota que sale. Sustituye a nombrar el modelo que
   marca cada extremo.

## Criterios de aceptación

> Obligatorios y verificables.

- [ ] Un coche con 620 L de maletero saca un 10 en esa magnitud, y uno con
      700 L saca también un 10.
- [ ] Un coche con 250 L saca un 0, y uno con 180 L saca también un 0.
- [ ] Un coche con 2.850 mm de batalla saca un 10 en esa magnitud, y uno con
      2.400 mm saca un 0.
- [ ] Un coche en el punto medio de una escala saca un 5 en esa magnitud, y
      uno al 10% del anclaje malo saca menos de 1: la curva es en S, no una
      recta.
- [ ] La nota del eje de un coche es la misma con once candidatos en el
      catálogo que con uno solo.
- [ ] Dos coches con el mismo maletero y distinta batalla obtienen notas de
      eje distintas, en la proporción que declara el reparto.
- [ ] El ranking ya no ofrece editar una valoración de viaje, y el desglose
      no la menciona.
- [ ] El desglose del eje muestra los dos anclajes de cada escala y la nota
      que sale de cada magnitud.
- [ ] El desglose del eje ya no nombra qué modelo marca el mínimo ni el
      máximo.

## Dependencias y supuestos

- Depende del ADR 0004, que decide el principio de escalas absolutas.
- Sucede al requisito 6 de `product/0001` **solo para este eje**, y retira el
  campo de valoración de viaje que aquella spec hizo editable.
- **El catálogo necesita una columna nueva:** la batalla no está hoy en
  `cars.json`. Los once valores están tomados de las páginas de medidas de
  motor.es y hay que incorporarlos con su fuente. Registrado como deuda.
- **Tres maleteros del catálogo no cuadran con motor.es**: Tonale 500 vs 385
  L, X1 490 vs 540 L, Corolla Cross 473 vs 425 L. Probablemente tenga razón
  el catálogo —las páginas de motor.es son por modelo, y esas tres son
  versiones enchufables o AWD que pierden maletero por la batería— pero el
  eje pasa a descansar sobre esa cifra y hay que confirmarla por versión.
  Registrado como deuda.
- Se asume que la capacidad de maletero es la de cinco plazas en uso, no la
  de asientos abatidos.
- El campo `travelComfort` queda sin uso en el modelo. Retirarlo o
  conservarlo para el futuro eje subjetivo de conducción es decisión de la
  spec técnica que implemente esta.

## Decisiones abiertas

Ninguna.
