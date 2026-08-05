# 0007 — El eje de fiabilidad, en dos escalas absolutas

- **Id:** product/0007
- **Estado:** draft
- **Tipo:** product
- **Fecha:** 2026-08-05
- **Specs relacionadas:** product/0001, product/0002, product/0003, product/0006
- **ADRs relacionados:** 0004
- **Doc de estado:** `docs/estado/dominio.md`

## Contexto

El eje `fiabilidad` es el último que queda con normalización relativa:

```text
0,7 × norm(índice de fiabilidad OCU) + 0,3 × norm(años de garantía)
```

Estructuralmente está sano, como `prestaciones`: normaliza cada sumando por
separado, así que el 0,7/0,3 rige sobre notas comparables. Pero comete el
error del ADR 0004 en su forma más pura, y encima sobre un dato que ya estaba
bien.

**El índice OCU ya es una escala absoluta.** Es un índice publicado de 0 a
100, construido con 85.590 encuestas en diez países sobre 392 modelos,
ponderando número de averías, gravedad, antigüedad del coche y kilómetros al
fallar. Llega al modelo con su significado hecho, y el eje lo destruye para
reconstruir una escala peor.

Se ve en los datos vigentes. Ocho de los once candidatos están entre 87 y 93
—**seis puntos sobre cien**— y la normalización los reparte entre 5,4 y 10,0.
Y el Tonale, con 80, saca un **0,0**: la misma nota que merecería una marca
que se rompiera de verdad, cuando comparte ese 80 con Ford, Jaguar y Opel y
todavía tiene por debajo a Peugeot, Citroën, DS, Lynk & Co, MG y Land Rover.
Un 0 debería significar «esta marca se avería»; significa «es la peor de
once».

## Objetivo

Que la nota de fiabilidad diga cómo de fiable es el coche contra el mercado
entero, que es exactamente lo que el índice ya mide, y que la garantía se
puntúe por lo que el fabricante debe pase lo que pase.

## Alcance

- **Una escala absoluta para el índice OCU** y **otra para los años de
  garantía**, cada una con sus dos anclajes.
- **La forma de la escala**: la misma curva en S de `product/0002`.
- **La definición de «años de garantía»**: años de garantía comercial
  **incondicional**, sin extensiones sujetas a mantenimiento en red oficial.
- **La combinación de ambas** con el 0,7/0,3 ya declarado, que no cambia.
- **El desglose del eje**: las dos magnitudes con su valor, sus anclajes y su
  nota, más la extensión condicionada como nota informativa.

## Fuera de alcance

- **Meter el índice de satisfacción de la OCU en la fórmula.** Se consideró y
  se descarta; el razonamiento está abajo, porque es la alternativa más
  tentadora y conviene que quede escrita.
- **Cambiar el reparto 0,7/0,3.** Sigue igual y sigue significando lo que
  dice.
- **Corregir los datos del catálogo.** Esta spec decide la escala. La columna
  de garantía tiene cinco filas equivocadas y eso se arregla aparte, con su
  deuda registrada.
- **Buscar un índice de fiabilidad por modelo** en vez de por marca. Sería
  mejor dato y no existe publicado; queda anotado como limitación, no como
  trabajo de esta spec.

## Las dos escalas

| Magnitud | Nota 10 | Nota 0 |
| --- | --- | --- |
| Índice OCU | **desde 93** | **hasta 64** |
| Años de garantía incondicional | **desde 7** | **hasta 0** |

Entre anclajes, la misma **curva en S** que fija `product/0002`:
`nota = 10 × (1 − t²(3 − 2t))`.

### El índice OCU: los anclajes son los extremos publicados

No hay que inventarlos. La OCU publica el índice de las 39 marcas, y los
extremos son **Lexus con 93 y Land Rover con 64**:

| Marcas | Índice | Nota |
| --- | --- | --- |
| Lexus | 93 | 10,0 |
| Toyota · Suzuki · Subaru | 91 | 9,9 |
| Honda · Mazda · Kia · Tesla · BYD · Smart · Mitsubishi | 89 | 9,5 |
| BMW · Hyundai · Mini · Lancia · Nissan | 87 | 8,9 |
| Mercedes · Audi · Cupra · Dacia · Seat · Porsche | 84 | 7,7 |
| Skoda · Fiat · Volvo · VW · Renault · Jeep · Polestar | 82 | 6,8 |
| Ford · **Alfa Romeo** · Jaguar · Opel | 80 | 5,8 |
| Peugeot · Citroën · DS · Lynk & Co | 76 | 3,7 |
| MG | 72 | 1,9 |
| Land Rover | 64 | 0,0 |

Anclar el 0 en 64 y no más arriba tiene una ventaja que no es estética: **no
hay que justificar por qué se recorta**. La escala es el mercado tal como se
publica. Se consideró anclar el 0 en 72 —MG, la penúltima— y se descartó por
eso: obligaba a decidir a mano dónde empieza lo inaceptable, cuando la propia
tabla ya lo dice.

**Consecuencia asumida: este eje deja de separar a los candidatos, y ese es
el hallazgo.** Nueve de once quedan por encima de 8,9 en el índice. No es un
fallo de la escala: es que los once salen de marcas fiables —ocho marcas, y
siete en el tercio alto de 39—. La escala relativa fabricaba un ranking
donde solo hay un empate.

### La garantía: qué se puntúa y qué no

**Se puntúan los años de garantía comercial incondicional.** No entran las
extensiones que dependen de pasar el mantenimiento por la red oficial, porque
esas no son un compromiso del fabricante sino uno del comprador, renovado
servicio a servicio.

Es lo que separa dos cosas que hoy la columna suma como si fueran iguales:
los **7 años de Kia**, que se tienen hagas lo que hagas, y los **«hasta 15
años» de Toyota Relax**, que se pierden el día que llevas el coche a otro
taller. No son el mismo producto.

| Años | Nota | Quién |
| --- | --- | --- |
| 7 | 10,0 | Kia · MG · Omoda · Jaecoo |
| 6 | 9,4 | Mazda · BYD |
| 5 | 8,0 | Alfa Romeo · Honda · Hyundai (sin límite de km) |
| 4 | 6,1 | Tesla |
| 3 | 3,9 | BMW · Audi · Mercedes · VW · Toyota · Lexus · Nissan |
| 0 | 0,0 | — |

**El 10 en 7 años** es el techo real del mercado: ninguna marca ofrece más
sin condiciones.

**El 0 en 0 años, y no en 3.** Los 3 años son el mínimo legal en España desde
enero de 2022, y quedarse ahí no dice que el coche se rompa: dice que la
marca ha elegido otra estrategia de postventa. Anclar el 0 en el mínimo legal
convertía esa elección comercial en un cero absoluto y hacía que las
garantías largas puntuaran de más. Con el 0 en 0 años, la distancia entre los
7 de Kia y los 3 de BMW baja de 10,0 a 6,1 puntos, y el eje entero pasa de
mover 4,1 puntos a mover 3,2.

Efecto lateral conocido: con el 0 fuera del rango alcanzable, la máxima
pendiente de la curva cae en 3,5 años, dentro del rango real del mercado. El
tramo de 3 a 5 años separa más que el de 5 a 7. Es defendible —el tercer y
cuarto año es cuando las cosas empiezan a fallar— pero es una consecuencia
del anclaje, no una intención aparte.

### Por qué no entra el índice de satisfacción

La OCU publica, junto al de fiabilidad, un índice de satisfacción por marca:
misma encuesta, misma escala, misma granularidad. Es un dato tan sólido como
el otro, y por eso conviene decir por qué se queda fuera.

**Mide si la gente quiere su coche, y eso ya tiene dos ejes.** `estetica`
(peso 2) y `viaje` (peso 4) son «me gusta este coche» — 6 de 13, casi la
mitad del total. Meter satisfacción aquí añadiría una tercera señal de gusto,
y además **el gusto de otra gente**, dentro del único eje cuyo trabajo es
decir si el coche se avería. El usuario ya ha puntuado los once candidatos;
deferir encima a la satisfacción de desconocidos es contar lo mismo tres
veces con el peor instrumento de los tres.

Se ve en la propia tabla de la OCU: Porsche 91, Polestar 89, Alfa Romeo 88,
Jaguar 85 son marcas que se desean; Lancia 76, Peugeot 76, Opel 78, Dacia 79
son marcas que se compran. La satisfacción sigue la aspiración y el rango de
precio, no las averías.

## Lo que este eje mide, y lo que no

**El índice OCU es por marca, no por modelo.** La OCU analiza 392 modelos y
publica el ranking por marca, así que el 80 del Tonale es el promedio de Alfa
Romeo entera aplicado a un coche concreto. Ese es el límite real del eje, y
no lo arregla ninguna escala: mientras no exista un índice por modelo,
`fiabilidad` puntúa la marca y lo llama fiabilidad del coche.

Merece la pena dejar escrito el caso que lo hizo evidente. El coche de
referencia del proyecto es un Alfa Romeo Giulietta con trece años y ninguna
avería fuera del mantenimiento. Eso **no corrige el 80**: un coche no es una
muestra, y un índice de fiabilidad es una distribución sobre decenas de miles
de respuestas — un coche sin averías es perfectamente compatible con una
marca mediocre de media. Pero tampoco lo confirma, y por el mismo motivo: el
Giulietta no es el Tonale, ni la misma plataforma, ni la misma época, ni el
mismo grupo industrial. El número es bueno para lo que mide y no mide lo que
parece.

## Requisitos / comportamiento esperado

1. El índice OCU se puntúa contra su escala absoluta: nota 10 en 93 o por
   encima, nota 0 en 64 o por debajo, curva en S entre ambos.
2. Los años de garantía se puntúan contra la suya: nota 10 en 7 años o por
   encima, nota 0 en 0 años, curva en S entre ambos.
3. Los años de garantía que se puntúan son los **incondicionales**. Una
   extensión sujeta a mantenimiento en red oficial no suma años a esta
   magnitud.
4. Cuando un coche tiene una extensión condicionada, el desglose la muestra
   como nota informativa —sus años, su límite de kilómetros y su condición—
   sin que entre en la nota.
5. Las dos notas se combinan al 0,7/0,3, como hoy.
6. Ninguna nota de este eje depende de qué otros coches haya en el catálogo.
7. Los anclajes son parte del modelo, no un supuesto global editable desde el
   panel.
8. El desglose muestra, para cada magnitud, el valor del coche, los dos
   anclajes de su escala y la nota que sale. Sustituye a nombrar el modelo que
   marca cada extremo.
9. El desglose declara que el índice de fiabilidad es **por marca**, no por
   modelo.

## Criterios de aceptación

> Obligatorios y verificables.

- [ ] Un coche de una marca con índice 93 saca un 10 en esa magnitud, y uno
      con 96 saca también un 10.
- [ ] Un coche de una marca con índice 64 saca un 0, y uno con 50 saca
      también un 0.
- [ ] Un coche con 7 años de garantía incondicional saca un 10 en esa
      magnitud, y uno con 10 años saca también un 10.
- [ ] Un coche con 3 años de garantía saca aproximadamente un 3,9, no un 0.
- [ ] Un coche con 3 años incondicionales y una extensión condicionada a 15
      saca la misma nota de garantía que otro con 3 años y sin extensión.
- [ ] La nota del eje de un coche es la misma con once candidatos en el
      catálogo que con uno solo.
- [ ] El desglose del eje muestra los dos anclajes de cada escala y la nota
      que sale de cada magnitud.
- [ ] El desglose del eje ya no nombra qué modelo marca el mínimo ni el
      máximo.
- [ ] El desglose declara que el índice es por marca y muestra la extensión
      condicionada cuando existe.

## Dependencias y supuestos

- Depende del ADR 0004, que decide el principio de escalas absolutas.
- Sucede al requisito 6 de `product/0001` **solo para este eje**. Con esta
  spec, los seis ejes quedan cubiertos.
- Se asume que las magnitudes del eje siguen siendo el índice OCU y los años
  de garantía, y que el reparto entre ambas sigue siendo 0,7/0,3.
- Se asume que el índice OCU del catálogo es el de la edición 2026, que es la
  que cuadra fila a fila con los valores actuales.
- **El catálogo necesita una columna nueva.** Hoy `warrantyYears` no
  distingue años incondicionales de extensión condicionada, y el requisito 3
  exige la distinción. Es trabajo de catálogo, con su deuda registrada.
- **La columna de garantía tiene cinco filas equivocadas** —NX 350h, Corolla
  Cross, Civic, CR-V y Tonale— y el eje es tan bueno como los datos que
  recibe. Registrado como deuda; esta spec no toca datos.
- El índice OCU del Tonale figura en `cars.json` como estimado y no lo es:
  el 80 es el valor publicado. Registrado como deuda.

## Decisiones abiertas

Ninguna.
