# 0005 — El eje de viaje, sin normalización

- **Id:** product/0005
- **Estado:** draft
- **Tipo:** product
- **Fecha:** 2026-08-04
- **Specs relacionadas:** product/0001, product/0004
- **ADRs relacionados:** 0004
- **Doc de estado:** `docs/estado/dominio.md`

## Contexto

El eje `viaje` mide el espacio y el confort en viajes largos. No tiene
fórmula: es una valoración de 1 a 5 que da el usuario, que después se
**normaliza contra los otros diez candidatos**.

Es el mismo defecto que `product/0004` corrige en `estetica` —una escala
absoluta destruida al convertirla en relativa—, pero aquí el daño es de otro
orden, por dos motivos que se multiplican entre sí.

**Primero: solo se han usado dos valores.** De los once candidatos, tres
tienen un 4 y ocho tienen un 3. La normalización estira esos dos valores a la
escala entera:

| Valoración | Nota vigente |
| --- | --- |
| 4 / 5 | **10,0** |
| 3 / 5 | **0,0** |

Ocho coches sacan un **cero absoluto** por haber recibido un 3 en vez de un
4. Un solo escalón de una valoración subjetiva sobre fotos de catálogo se
convierte en la diferencia entre perfecto y nulo.

**Segundo: es el eje de mayor peso.** Pesa 4 sobre 13 —el 31% del total—, así
que ese escalón mueve **40 puntos** de la puntuación final. Con una escala
directa movería 10.

El efecto sobre la clasificación no es un matiz. Cambiando **solo** la escala
de este eje, sin tocar nada más:

| Puesto | Vigente | Con escala directa |
| --- | --- | --- |
| 1.º | X1 xDrive25e (93,2) | **EV3 (89,8)** |
| 2.º | NX 350h (81,5) | X1 xDrive25e (83,2) |
| 3.º | Tonale (76,9) | Kona Eléctrico (76,1) |
| 8.º | Corolla Cross (47,6) | **Tonale (66,9)** |

Los tres primeros de la clasificación vigente son exactamente los tres coches
que recibieron un 4, y el Tonale cae del tercer puesto al octavo. Dicho de
otro modo: **el ranking actual es, en buena parte, la lista de los coches a
los que se dio un punto más en una valoración subjetiva.**

## Objetivo

Que la nota de viaje de un coche sea la valoración que se le ha dado, sin que
la lista de candidatos la altere, y que un escalón de valoración mueva lo que
un escalón debe mover.

## Alcance

- **La traducción directa de la valoración 1-5 a la nota 0-10**, sin
  normalizar contra el conjunto.
- **El desglose del eje**: la valoración y la nota que sale de ella.

## Fuera de alcance

- **Objetivar el eje.** Sigue siendo un juicio y esta spec no lo cambia: se
  limita a dejar de deformarlo. Convertirlo en algo medible —maletero, plazas
  traseras, autonomía— es trabajo propio, ya registrado en el roadmap.
- **Revisar el peso 4 del eje.** Que un eje puramente subjetivo sea el de
  mayor peso es una decisión del usuario, y sigue siéndolo. Lo que esta spec
  arregla es que ese peso se aplicaba sobre una nota deformada.
- **Qué valoración merece cada coche.** Es juicio del usuario y se edita desde
  el ranking, como hoy.

## La escala

```text
nota = (valoración − 1) × 2,5
```

**1 → 0, 3 → 5, 5 → 10.** Lineal, sin curva, idéntica a la de `estetica`.

Es el mismo tipo de dato —un juicio de 1 a 5— y vale el mismo razonamiento:
la compresión de los extremos ya la aplica el usuario al puntuar, así que
añadir una curva en S deformaría dos veces el mismo juicio.

Siendo el eje de más peso, es donde más importa que un 3 signifique
«normalito» y no «catástrofe».

A diferencia de `estetica`, aquí hay **un solo sumando**: no hay mezcla que
aplicar ni pesos internos que declarar.

## Un dato que ya está en el catálogo y este eje no mira

El catálogo trae la capacidad de maletero de cada coche, con su fuente, y el
eje no la usa. Hoy el Sportage tiene 587 L y saca un 0,0; el X1 tiene 490 L y
saca un 10,0. No es un fallo de esta spec —el eje es subjetivo por diseño—,
pero conviene dejarlo escrito: **cuando se quiera objetivar el eje, la
materia prima ya está en el catálogo**, y no hará falta salir a buscarla.

## Requisitos / comportamiento esperado

1. La valoración de espacio y confort en viaje se traduce a nota con
   `(v − 1) × 2,5`, sin normalizar contra el catálogo.
2. La nota del eje de un coche no cambia al añadir, quitar o editar otro
   coche del catálogo.
3. Un coche valorado 5 saca un 10; uno valorado 1 saca un 0; uno valorado 3
   saca un 5.
4. Si todos los coches del catálogo tienen la misma valoración, todos sacan
   esa nota —no un 5 neutro—, y esa nota es distinta según cuál sea la
   valoración compartida.
5. El eje sigue declarando que no tiene fórmula y que es un juicio del
   usuario, editable desde el ranking.
6. El desglose muestra la valoración y la nota que sale de ella.

## Criterios de aceptación

> Obligatorios y verificables.

- [ ] Un coche valorado 5 saca un 10 en el eje; uno valorado 1 saca un 0; uno
      valorado 3 saca un 5.
- [ ] La nota del eje de un coche es la misma con once candidatos en el
      catálogo que con uno solo.
- [ ] Con todos los candidatos valorados 3, todos sacan 5; con todos
      valorados 4, todos sacan 7,5. Las dos situaciones dan notas distintas.
- [ ] La diferencia de puntuación total entre un coche valorado 3 y otro
      idéntico valorado 4 es de 10 puntos, no de 40.
- [ ] El desglose del eje ya no nombra qué modelo marca el mínimo ni el
      máximo.
- [ ] El desglose sigue declarando que el eje no tiene fórmula y que la
      valoración es editable.

## Dependencias y supuestos

- Depende del ADR 0004, que decide el principio de escalas absolutas.
- Comparte escala y razonamiento con `product/0004`: son el mismo tipo de
  dato y se tratan igual.
- Sucede al requisito 6 de `product/0001` **solo para este eje**.
- Se asume que la valoración se sigue dando de 1 a 5 con paso de 0,5, y que
  se sigue editando desde el ranking.

## Decisiones abiertas

Ninguna.
