# 0003 — El eje de coste, en dos escalas absolutas

- **Id:** product/0003
- **Estado:** implemented
- **Tipo:** product
- **Fecha:** 2026-08-04
- **Specs relacionadas:** product/0001, product/0002
- **ADRs relacionados:** 0004
- **Doc de estado:** `docs/estado/dominio.md`

> ⚠️ **Spec histórica — implementada, sin consolidar.** Describe un cambio ya
> implementado: su sección *Contexto* retrata el sistema **anterior** al
> cambio y hoy no es cierta. **No es referencia del estado actual** — para
> eso, ver el **Doc de estado** indicado arriba. Vigentes aquí los
> **criterios de aceptación**, como registro de verificación.

## Contexto

El eje `coste` calcula hoy un único número y lo normaliza contra los otros
diez candidatos:

```text
coste_total = precio_compra + (energía + mantenimiento) × años − residual
```

Arrastra el problema general que recoge el ADR 0004 —la nota dice en qué
puesto va un coche, no si es caro—, pero aquí con un matiz importante: **el
recorrido sí es grande**. Del más barato al más caro hay 25.965 € a doce
años, unos 180 €/mes. La escala relativa no está inflando diferencias
irrelevantes como en `diario`; lo que falla es que el 10 y el 0 no significan
nada. ¿Es barato un coste de 47.960 €? ¿Es inasumible uno de 73.925 €? La
escala relativa no responde ninguna de las dos, que son las únicas que
importan.

Y hay un segundo problema, propio de este eje: **la fórmula suma dos tipos de
dinero que no se comportan igual**.

- El **precio de compra** (32.000–51.900 € en el catálogo) es dinero que hace
  falta tener de una vez, y tiene una barrera dura: o lo tienes o no compras
  el coche.
- El **coste de uso** (108–208 €/mes) es dinero que gotea, absorbible, sin
  barrera.

Sumarlos trata un euro de precio y un euro de gasolina repartido en doce años
como si fueran lo mismo. Como el precio pesa entre el 60% y el 70% del total,
en la práctica `coste` acaba siendo **casi un eje de precio de compra con
ruido**: el Kona Eléctrico es el más barato de usar de los once —108 €/mes— y
eso hoy queda enterrado.

## Objetivo

Que el eje diga si un coche es caro, separando lo que cuesta comprarlo de lo
que cuesta tenerlo, y que ninguna de las dos cosas tape a la otra.

## Alcance

- **Dos magnitudes con su escala absoluta cada una**: precio de compra y
  coste de uso mensual.
- **La combinación de ambas** con un peso que se deriva del propio dinero, no
  se elige a ojo.
- **La retirada del supuesto `anios`**, que deja de tener función en el eje.
- **El desglose del eje**: las dos notas, sus escalas y sus anclajes.

## Fuera de alcance

- **El valor residual y «pienso venderlo».** Se quedan desactivados y sin
  tocar: analizar la reventa no es lo que se quiere de este eje hoy.
- **El presupuesto como filtro.** Sigue existiendo aparte, marcando los
  coches que superan el techo. Esta spec usa el mismo número como anclaje de
  la escala de precio, pero no fusiona las dos cosas.
- **Los otros cuatro ejes** sin migrar.
- **Cambiar de dónde salen consumo, mantenimiento o precio.** Siguen siendo
  los mismos datos del catálogo, con sus mismas fuentes.

## Las dos escalas

| Magnitud | Nota 10 hasta | Nota 0 desde |
| --- | --- | --- |
| Precio de compra | **25.000 €** | **47.000 €** |
| Coste de uso | **100 €/mes** | **250 €/mes** |

Entre anclajes, la misma **curva en S** que fija `product/0002`:
`nota = 10 × (1 − t²(3 − 2t))`.

El anclaje de rechazo del precio son los **47.000 € que ya estaban declarados
como presupuesto**. Es un techo duro: por encima no se compra. Los 25.000 €
del otro extremo son el punto en que el precio deja de preocupar; por debajo,
todos empatan.

El coste de uso se puntúa **por mes**, no por año ni por total de vida útil.
Es la unidad en la que se puede opinar, y sobre todo hace que **la escala no
dependa del horizonte**: los anclajes no deberían moverse porque uno decida
tener el coche ocho años en vez de doce.

### El peso sale del dinero

Las dos notas se combinan **50/50**, y ese número no es una preferencia: es
una equivalencia.

```text
recorrido de la escala de precio:  47.000 − 25.000 = 22.000 €
recorrido de la escala de uso:     (250 − 100) × 12 = 1.800 €/año

22.000 € ÷ 1.800 €/año = 12,2 años
```

Es decir: **teniendo el coche unos doce años, las dos escalas cubren la misma
cantidad de dinero**. Con recorridos equivalentes, repartir 50/50 es lo único
coherente — cualquier otro reparto estaría diciendo que un euro de compra
vale distinto que un euro de uso sin declarar por qué.

La regla, para cuando alguien mueva un anclaje: **el peso se recalcula con
esa misma cuenta**, no se ajusta a ojo. Si se estrecha la escala de uso a
100-220 €/mes, los recorridos se igualan a los quince años y el 50/50 dejaría
de ser coherente para un horizonte de doce.

## Requisitos / comportamiento esperado

1. El precio de compra se puntúa contra su escala absoluta: 10 hasta
   25.000 €, 0 desde 47.000 €, curva en S entre ambos.
2. El coste de uso mensual —energía más mantenimiento, dividido entre doce—
   se puntúa contra la suya: 10 hasta 100 €/mes, 0 desde 250 €/mes.
3. Las dos notas se combinan al 50/50.
4. Ninguna nota de este eje depende de qué otros coches haya en el catálogo.
5. El supuesto `anios` desaparece: ni multiplica el coste de uso, ni figura en
   el panel de supuestos. El horizonte de doce años pasa a ser el
   razonamiento escrito detrás del peso, no un valor editable.
6. Los supuestos que sí siguen vivos —km/año, precio del litro, precio del
   kWh— se mantienen: hacen falta para llegar del consumo del catálogo al
   coste de uso mensual.
7. El desglose muestra las dos magnitudes con su valor, sus dos anclajes y su
   nota, y el peso con el que se combinan.

## Criterios de aceptación

> Obligatorios y verificables.

- [ ] Un coche de 25.000 € saca un 10 en precio, y uno de 20.000 € saca
      también un 10.
- [ ] Un coche de 47.000 € saca un 0 en precio, y uno de 60.000 € saca
      también un 0.
- [ ] Un coche con 100 €/mes de uso saca un 10 en uso, y uno con 250 €/mes
      saca un 0.
- [ ] La nota del eje de un coche es la misma con once candidatos en el
      catálogo que con uno solo.
- [ ] Dos coches con el mismo precio y distinto coste de uso obtienen notas
      de eje distintas: el uso no queda difuminado por el precio.
- [ ] `anios` no aparece en `GlobalAssumptions` ni en el panel de supuestos.
- [ ] El desglose del eje muestra los cuatro anclajes y las dos notas
      intermedias.
- [ ] El desglose del eje ya no nombra qué modelo marca el mínimo ni el
      máximo.

## Dependencias y supuestos

- Depende del ADR 0004, que decide el principio de escalas absolutas.
- Sucede al requisito 6 de `product/0001` **solo para este eje**.
- Se asume que el catálogo sigue trayendo precio, consumo y mantenimiento
  anual con sus fuentes, y que los precios pendientes de reconfirmar se
  reconfirman aparte: una escala absoluta de precio es tan buena como los
  precios que recibe.
- Se asume un horizonte de tenencia en torno a doce años. No es un valor
  editable, es el razonamiento detrás del peso 50/50.

## Decisiones abiertas

Ninguna.
