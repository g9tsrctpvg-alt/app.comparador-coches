# 0004 — El eje de estética, sin normalización

- **Id:** product/0004
- **Estado:** draft
- **Tipo:** product
- **Fecha:** 2026-08-04
- **Specs relacionadas:** product/0001, product/0002, product/0003
- **ADRs relacionados:** 0004
- **Doc de estado:** `docs/estado/dominio.md`

## Contexto

El eje `estetica` combina dos valoraciones que el usuario da de 1 a 5 —una
del exterior y otra del interior— con una mezcla configurable, hoy 0,6/0,4, y
después **normaliza el compuesto contra los otros diez candidatos**.

Ese último paso es el problema, y aquí es más grave que en los ejes de
magnitud física. En `diario` había que traducir milímetros a una nota: 1850
mm no significa nada sin contexto, y calibrarlo contra algo era necesario.
**Aquí no hay nada que traducir.** Cuando el usuario le pone un 3 a un coche,
ya ha emitido el juicio completo: «ni fu ni fa». El 1 al 5 **ya es una escala
absoluta**, con su propio cero y su propio techo. Normalizarla contra el
grupo coge ese juicio y lo deshace.

Se ve en los datos vigentes:

| Coche | Ext | Int | Compuesto | Nota hoy |
| --- | --- | --- | --- | --- |
| X1 xDrive25e | 5 | 5 | 5,0 / 5 | 10,0 |
| EV3 | 5 | 3 | 4,2 / 5 | 7,3 |
| Kona HEV | 3 | 3 | 3,0 / 5 | **3,3** |
| Corolla Cross | 2 | 2 | 2,0 / 5 | **0,0** |

Al Kona se le puso un 3 sobre 5 —justo la mitad— y el modelo lo convierte en
un 3,3 sobre 10. Al Corolla Cross se le puso un 2 sobre 5 —feo, no
insufrible— y saca un **0,0**, la misma nota que merecería algo verdaderamente
repugnante.

Y la nota **depende de a quién más se mire**: quitar el X1 del catálogo
convertiría al EV3 en el más guapo y lo subiría a 10, sin que nadie haya
cambiado de opinión sobre ningún coche.

Hay además un caso degenerado que hoy está roto. Si todos los coches
gustaran por igual —un 4 a los once— la normalización les daría un 5 a todos,
el punto neutro. Y si gustaran poco por igual —un 2 a los once— también un 5
a todos. **La nota diría exactamente lo mismo en dos situaciones opuestas.**

## Objetivo

Que la nota de estética de un coche sea la valoración que el usuario le ha
dado, sin que la lista de candidatos la altere.

## Alcance

- **La traducción directa de la valoración 1-5 a la nota 0-10**, sin
  normalizar contra el conjunto.
- **La combinación de exterior e interior** con la mezcla ya declarada, que
  pasa a regir sobre notas comparables siempre y no por casualidad.
- **El desglose del eje**: las dos valoraciones y cómo se combinan.

## Fuera de alcance

- **Qué valoración merece cada coche.** Es juicio del usuario y se edita
  desde el ranking, como hoy.
- **La escala 1-5 y su paso de 0,5.** Nueve niveles son resolución de sobra
  para «me gusta o no»; cambiarlos sería otra spec.
- **La mezcla exterior/interior.** Sigue siendo 0,6/0,4 y sigue siendo
  editable donde ya lo es.
- **Los ejes que quedan sin migrar cuando se escribe esta spec**:
  `prestaciones`, `fiabilidad` y `viaje`. Cada uno lleva la suya.

## La escala

```text
nota = (valoración − 1) × 2,5
```

Es decir: **1 → 0, 3 → 5, 5 → 10**. Lineal, sin curva.

**Sin curva en S, a diferencia de `diario` y `coste`.** Allí la S servía para
decir «pasado este punto ya no mejora» o «esto ya es igual de malo». Aquí esa
compresión **ya la aplica el usuario al puntuar**: decir 5 es decir «tan
guapo como hace falta», y decir 1 es decir «no hay nada que salvar». Meter
una S encima deformaría dos veces el mismo juicio.

**Un 1 vale un 0.** Es un eje que mide si un coche te gusta; si te parece
horrible, la nota lo dice sin amortiguarlo. El eje pesa 2 sobre 13, así que
un cero en estética no hunde a nadie por sí solo.

Con esta escala, la mezcla 0,6/0,4 significa lo que dice **siempre**. Hoy
coincide por casualidad —exterior e interior comparten rango 2-5 en el
catálogo, y normalizar antes o después da el mismo resultado cuando los
recorridos coinciden—, pero esa coincidencia se rompería en cuanto las dos
valoraciones dejaran de moverse en el mismo rango.

## Requisitos / comportamiento esperado

1. La valoración de exterior se traduce a nota con `(v − 1) × 2,5`, sin
   normalizar contra el catálogo.
2. La valoración de interior se traduce igual.
3. Las dos notas se combinan con la mezcla declarada del eje.
4. La nota del eje de un coche no cambia al añadir, quitar o editar otro
   coche del catálogo.
5. Un coche valorado 5 y 5 saca un 10; uno valorado 1 y 1 saca un 0; uno
   valorado 3 y 3 saca un 5.
6. Si todos los coches del catálogo tienen la misma valoración, todos sacan
   esa nota —no un 5 neutro—, y esa nota es distinta según cuál sea la
   valoración compartida.
7. El desglose muestra las dos valoraciones, la nota que sale de cada una y
   la mezcla con la que se combinan.

## Criterios de aceptación

> Obligatorios y verificables.

- [ ] Un coche valorado 5 en exterior y 5 en interior saca un 10 en el eje.
- [ ] Un coche valorado 1 y 1 saca un 0.
- [ ] Un coche valorado 3 y 3 saca un 5.
- [ ] La nota del eje de un coche es la misma con once candidatos en el
      catálogo que con uno solo.
- [ ] Con todos los candidatos valorados 4, todos sacan 7,5; con todos
      valorados 2, todos sacan 2,5. Las dos situaciones dan notas distintas.
- [ ] El desglose del eje ya no nombra qué modelo marca el mínimo ni el
      máximo.
- [ ] El desglose muestra las dos valoraciones con su nota y la mezcla
      aplicada.

## Dependencias y supuestos

- Depende del ADR 0004, que decide el principio de escalas absolutas. Este
  eje es su caso extremo: la escala absoluta ya existía en el dato de
  entrada, y lo único que hacía falta era dejar de destruirla.
- Sucede al requisito 6 de `product/0001` **solo para este eje**.
- Se asume que la valoración se sigue dando de 1 a 5 con paso de 0,5, y que
  se sigue editando desde el ranking.

## Decisiones abiertas

Ninguna.
