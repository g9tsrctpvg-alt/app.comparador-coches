# 0008 — El tipo de motor, visible en la comparativa

- **Id:** product/0008
- **Estado:** draft
- **Tipo:** product
- **Fecha:** 2026-08-05
- **Specs relacionadas:** product/0001, product/0003, product/0005
- **ADRs relacionados:** 0004
- **Doc de estado:** `docs/estado/interfaz.md`

## Contexto

El catálogo clasifica cada coche por tecnología de propulsión —`ICE`, `MHEV`,
`HEV`, `PHEV`, `EV`—, el dato está validado en el modelo de dominio, y
**gobierna dos cálculos**:

- En `coste`, decide el precio unitario de la energía: €/kWh si es `EV`, €/l
  en cualquier otro caso.
- En `diario`, dispara la penalización por no tener carga en casa, que solo
  se aplica a los `EV`.

Y **no se muestra en ningún sitio**. La fila del ranking enseña el nombre del
coche, sus puntos y si se pasa de presupuesto. Ni la fila ni el desglose
dicen si el coche es eléctrico, híbrido enchufable o híbrido ligero.

El resultado es que una diferencia que cambia la puntuación por dos caminos
distintos es invisible para quien lee la comparativa. Los once candidatos
reparten cuatro tecnologías —seis `HEV`, dos `EV`, dos `MHEV`, un `PHEV`— y
comparar un eléctrico con un híbrido ligero sin saber cuál es cuál esconde
justo lo que más separa a un coche de otro en el uso real.

Esta spec no cambia ninguna puntuación. Cambia lo que la comparativa dice de
sí misma.

## Objetivo

Que quien mire el ranking sepa de un vistazo qué mueve cada coche, y que
sepa dónde eso ha entrado en la nota.

## Alcance

- **El tipo de motor en la fila del ranking**, sin necesidad de desplegar.
- **Una etiqueta legible** para cada tecnología, en vez de la sigla del
  modelo de datos.
- **La declaración, en el desglose de los ejes afectados**, de que la
  tecnología ha intervenido en el cálculo y cómo.

## Fuera de alcance

- **Cambiar cualquier puntuación.** Ni fórmulas, ni escalas, ni pesos. Este
  cambio es de presentación.
- **Filtrar o agrupar el ranking por tecnología.** Se ve, no se filtra. Un
  filtro es otra decisión y otra spec.
- **Un eje de autonomía y repostaje.** Es el trabajo que de verdad recogería
  la diferencia entre llenar un depósito y recargar una batería, y está
  registrado en el roadmap como eje propio. Esta spec solo hace visible la
  tecnología; no la puntúa.
- **Añadir tecnologías al modelo.** Las cinco del `TechnologySchema` se
  quedan como están, incluida `ICE`, que hoy no usa ningún candidato.

## Las etiquetas

| Valor | Etiqueta |
| --- | --- |
| `ICE` | Combustión |
| `MHEV` | Híbrido ligero |
| `HEV` | Híbrido |
| `PHEV` | Híbrido enchufable |
| `EV` | Eléctrico |

Las siglas se quedan en el modelo de datos y en `cars.json`; la etiqueta es
cosa de la interfaz. Es la misma separación que ya rige entre el `axisId` y
su `label`.

## Requisitos / comportamiento esperado

1. Cada fila del ranking muestra la etiqueta de tecnología del coche, sin
   desplegar el desglose.
2. La etiqueta es la de la tabla de arriba; el ranking no muestra la sigla.
3. El desglose de `coste` declara qué precio unitario se ha aplicado y que la
   tecnología es lo que lo decide.
4. El desglose de `diario` declara que la penalización por carga en casa solo
   se aplica a los eléctricos, tanto cuando está activa como cuando no.
5. Ninguna puntuación cambia por efecto de esta spec.

## Criterios de aceptación

> Obligatorios y verificables.

- [ ] La fila de un `EV` muestra «Eléctrico» y la de un `PHEV` muestra
      «Híbrido enchufable», con el desglose plegado.
- [ ] Ninguna fila del ranking muestra las cadenas `EV`, `PHEV`, `MHEV`,
      `HEV` ni `ICE`.
- [ ] Las cinco tecnologías del `TechnologySchema` tienen etiqueta, incluida
      `ICE`, que hoy no usa ningún candidato.
- [ ] El desglose de `coste` de un eléctrico nombra el precio del kWh, y el
      de un híbrido el precio del litro.
- [ ] El desglose de `diario` de un coche no eléctrico declara que la
      penalización de carga no le aplica por su tecnología.
- [ ] La puntuación total de los once candidatos es idéntica antes y después
      del cambio.

## Dependencias y supuestos

- El dato ya existe: `technology` está en `CarSchema`, validado, y con valor
  en las once filas del catálogo. No hace falta columna nueva.
- Se asume que las etiquetas van en español, como el resto de la interfaz,
  mientras las siglas siguen en inglés en el modelo de datos.
- No depende del ADR 0004 ni de que ningún eje haya migrado: es ortogonal a
  las escalas y puede implementarse antes o después.

## Decisiones abiertas

Ninguna.
