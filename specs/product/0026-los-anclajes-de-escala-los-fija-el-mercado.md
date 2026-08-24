# 0026 — Los anclajes de escala los fija el mercado, no la gama comparada

- **Id:** product/0026
- **Estado:** consolidated
- **Tipo:** product
- **Fecha:** 2026-08-23
- **Specs relacionadas:** product/0002, product/0003, product/0005,
  product/0006, product/0007, product/0017
- **ADRs relacionados:** 0004, 0010
- **Doc de estado:** `docs/estado/dominio.md` y
  `docs/proceso/calibracion-de-escalas.md`

> ⚠️ **Spec consolidada (2026-08-23).** Describe un cambio en el momento en
> que se redactó; su sección *Contexto* retrata el sistema **anterior** al
> cambio y hoy es histórica. Para el estado actual, ver
> `docs/estado/dominio.md` y `docs/proceso/calibracion-de-escalas.md`.
> Vigentes aquí solo los **criterios de aceptación**, como registro de
> verificación.

## Contexto

Los seis ejes puntúan contra escalas absolutas desde `product/0002`‥`0007`.
Ninguna nota depende de qué otros coches haya en el catálogo, y eso funciona:
un coche solo en la lista saca la misma nota que si hubiera trece.

Pero los **números** de esos anclajes se eligieron mirando dónde caían los
candidatos de entonces. Está escrito en las propias specs. El 0 de anchura se
dejó en 2.000 mm y no más arriba «porque habría dejado a los once candidatos
entre 9,1 y 9,9». El 10 de prestaciones se subió a 145 CV/t porque una escala
más blanda «dejaba a seis de los once por encima de 9,7». El criterio de
`calibracion-de-escalas.md` §2 —«el 10 es *a partir de aquí deja de mejorar*,
no *lo mejor que existe*»— se resolvió las dos veces mirando el catálogo.

El resultado es una escala centrada en la gama que se estaba comparando, con
tres efectos visibles hoy:

- **Un 10 no significa lo que dice.** Un 10 en maletero son 620 litros. En el
  mercado se venden 910. Un 10 en batalla son 2.850 mm y se venden 3.215.
- **Los anclajes se saturan al crecer el catálogo.** El IONIQ 5 ya supera el
  anclaje de 10 en anchura de hombros —1.460 mm contra 1.390—, y en anchura de
  hombros varios candidatos empatan en 10,0. La magnitud ha dejado de medir.
- **El trabajo de separar se hace dos veces.** Apretar la escala contra la
  gama es decidir cuánto discrimina un eje; eso ya lo decide su peso. Uno de
  los dos sitios sobra, y el que sobra es el escondido.

El ADR 0010 decide el criterio nuevo: los anclajes son los extremos del
mercado real de venta al público. Esta spec lo aplica magnitud a magnitud.

## Objetivo

Que un 10 signifique «no hay nada mejor a la venta» y un 0 «lo peor que se
vende», de modo que la nota de un eje sitúe al coche dentro del mercado y no
dentro de la lista que alguien decidió mirar.

## Alcance

- **Los dos anclajes de cada magnitud de `diario`, `viaje` y `prestaciones`**,
  re-fijados sobre modelos de mercado con fuente publicada.
- **La declaración del universo de mercado** que fija los extremos, para que
  el siguiente anclaje se elija con el mismo criterio y no a ojo.
- **La descripción de fórmula de cada eje afectado**, que muestra los
  anclajes al usuario y por tanto cambia con ellos.
- **La consolidación del criterio nuevo** en `calibracion-de-escalas.md` §2 y
  de los anclajes nuevos, con su razonamiento, en `dominio.md`.

## Fuera de alcance

- **`coste`.** Sus dos anclajes se quedan como están —25.000 € / 47.000 € de
  precio y 100 / 250 €/mes de uso—. El 0 de precio es el presupuesto
  declarado, un techo duro de esta compra concreta, no una cifra de mercado:
  re-anclarlo en el precio del coche más caro que se vende dejaría a los trece
  candidatos por encima de 9 y el eje dejaría de decir qué cuesta el coche.
  Es una excepción decidida, no un olvido.
- **`fiabilidad`.** Ya cumple el criterio nuevo sin tocar nada: el índice OCU
  usa los extremos publicados de las 39 marcas (93 Lexus, 64 Land Rover) y la
  garantía usa el techo real del mercado sin condiciones (7 años). Se declara
  aquí para que conste que se revisó y no cambia.
- **`estetica`.** Es una preferencia, no una afirmación sobre el mundo. No
  tiene mercado contra el que anclarse y el ADR 0010 no le aplica.
- **Cambiar qué magnitudes entra en cada eje, y con qué peso se combinan.**
  `diario` sigue siendo 0,6/0,4 configurable, `viaje` 0,5/0,25/0,25 y
  `prestaciones` 0,5/0,5.
- **Cambiar la forma de la curva entre anclajes.** Sigue la curva en S. Que
  ensanchar el recorrido aleje la zona de máxima pendiente de donde están los
  candidatos es una consecuencia conocida y aceptada; revisarla sería otra
  spec, con el disparador que el ADR 0010 deja escrito.
- **Los pesos por defecto.** Que las notas bajen en bloque no es motivo para
  recalibrar pesos dentro de esta spec.
- **Corregir los datos del catálogo.** Esta spec decide contra qué se puntúa.

## El universo que fija los extremos

Turismo generalista de venta al público en España, del utilitario más pequeño
al SUV grande y la berlina premium. **Fuera:** deportivos y superdeportivos y
las versiones de prestaciones de un modelo normal (GT, N, RS, M, AMG y
equivalentes); ultralujo; vehículos comerciales y sus derivados de pasajeros;
cuadriciclos ligeros y pesados.

Es el universo que el ADR 0010 declara, y esta spec no lo amplía ni lo
recorta. El caso que lo motiva es la aceleración: anclar el 10 en los 2,8 s de
un superdeportivo no informa de nada sobre un SUV híbrido.

## Los modelos que fijan los extremos

| Modelo | Longitud | Anchura | Batalla | Maletero | Hombros 2ª fila | CV | Peso | 0-100 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Kia Picanto 1.0 DPi | 3.605 mm | 1.595 mm | 2.400 mm | 255 L | 1.260 mm | 67 | — | 14,7 s |
| Fiat 500 1.0 Hybrid | — | — | — | 185 L | — | 70 | — | 13,8 s |
| Dacia Sandero SCe 65 | 4.102 mm | 1.853 mm | — | 328 L | 1.310 mm | 67 | 1.012 kg | 16,7 s |
| Škoda Superb Combi | — | — | — | 690 L | 1.390 mm | — | — | — |
| Škoda Kodiaq | 4.758 mm | 1.864 mm | 2.791 mm | 910 L | 1.380 mm | — | — | — |
| Mercedes Clase E Berlina | — | — | — | — | 1.460 mm | — | — | — |
| Tesla Model 3 Gran Autonomía 4WD | 4.720 mm | 1.849 mm | 2.875 mm | 425 L | — | 498 | 1.899 kg | 4,4 s |
| BMW i7 | 5.391 mm | 1.950 mm | 3.215 mm | 500 L | 1.420 mm | — | — | — |
| Land Rover Range Rover | 5.252 mm | 2.003 mm | 3.197 mm | 857 L | — | — | — | — |

Dimensiones y maleteros de [motor.es](https://www.motor.es/); anchuras de
hombros de la segunda fila, de las mediciones propias de
[km77](https://www.km77.com/), que es la fuente que ya usa el catálogo para
esa magnitud; potencia, peso y 0-100 del Tesla, de la ficha de km77; el 0-100
del Sandero SCe 65, de la ficha del fabricante recogida por
[larevueautomobile](https://www.larevueautomobile.com/fiche-technique-auto/Caracteristique-dacia-sandero-sce-65-2025).
Una celda vacía es «este modelo no fija ningún anclaje de esa magnitud», no un
dato que falte.

## Los anclajes

| Eje | Magnitud | 10 hoy | 10 nuevo | 0 hoy | 0 nuevo |
| --- | --- | --- | --- | --- | --- |
| `diario` | Anchura | 1.765 mm | **1.600 mm** | 2.000 mm | **2.000 mm** |
| `diario` | Longitud | 4.000 mm | **3.600 mm** | 5.200 mm | **5.400 mm** |
| `viaje` | Maletero | 620 L | **910 L** | 250 L | **185 L** |
| `viaje` | Batalla | 2.850 mm | **3.200 mm** | 2.400 mm | **2.400 mm** |
| `viaje` | Anchura de hombros | 1.390 mm | **1.460 mm** | 1.310 mm | **1.260 mm** |
| `prestaciones` | CV por tonelada | 145 | **260** | 75 | **65** |
| `prestaciones` | Aceleración 0-100 | 6,5 s | **4,4 s** | 13,0 s | **16,7 s** |

### De dónde sale cada uno

- **Anchura, 1.600 mm / 2.000 mm.** El Picanto mide 1.595 mm y es el suelo del
  mercado; nada más estrecho se vende como turismo. El 0 **no se mueve**: los
  2.000 mm ya eran el techo real —Range Rover 2.003, BMW X7 2.000— y por
  casualidad coincidían. Cambia solo el 10, que estaba en un Corsa.
- **Longitud, 3.600 mm / 5.400 mm.** Picanto abajo (3.605 mm) y BMW i7 arriba
  (5.391 mm). El 0 estaba en 5.200 mm, que era el tamaño de una plaza de
  aparcamiento y no una cifra de mercado.
- **Maletero, 910 L / 185 L.** El Kodiaq da 910 L en configuración de cinco
  plazas y es el techo generalista; el Fiat 500 da 185 L. El 10 estaba en los
  620 L de un Superb, que hoy ni siquiera es el mejor maletero a la venta.
- **Batalla, 3.200 mm / 2.400 mm.** BMW i7 arriba (3.215 mm). El 0 **no se
  mueve**: los 2.400 mm eran ya exactamente la batalla del Picanto.
- **Anchura de hombros, 1.460 mm / 1.260 mm.** Arriba, los 146 cm que km77
  mide en el Mercedes Clase E; abajo, los 126 cm del Picanto. Este es el
  anclaje que estaba peor: el 10 en 1.390 mm lo superaban ya cinco candidatos
  del propio catálogo, y el IONIQ 5 lo pasa por 70 mm.
- **CV por tonelada, 260 / 65.** Arriba, el Tesla Model 3 Gran Autonomía 4WD
  —498 CV y 1.899 kg, 262,2 CV/t—, que es una berlina de venta normal y no una
  versión de prestaciones. Abajo, el Sandero SCe 65 —67 CV y 1.012 kg,
  66,2 CV/t—, el coche más barato del mercado.
- **Aceleración, 4,4 s / 16,7 s.** Los mismos dos coches por los dos extremos.
  El 0 estaba en 13,0 s, y se vende un coche nuevo que tarda 16,7.

## Dónde caen los candidatos

Nota de cada magnitud, hoy → con los anclajes nuevos, sobre los trece
candidatos publicados:

| Coche | Anchura | Longitud | Maletero | Batalla | Hombros | CV/t | 0-100 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EV3 | 7,0 → 3,2 | 8,4 → 6,6 | 6,0 → 3,2 | 6,8 → 2,8 | 3,2 → 3,5 | 5,7 → 1,5 | 9,1 → 8,2 |
| Kona HEV | 8,4 → 4,1 | 7,9 → 6,2 | 6,2 → 3,3 | 6,2 → 2,5 | 9,6 → 6,5 | 1,6 → 0,6 | 2,3 → 4,5 |
| Kona Eléctrico | 8,4 → 4,1 | 7,9 → 6,2 | 6,2 → 3,3 | 6,2 → 2,5 | 9,6 → 6,5 | 8,2 → 2,3 | 9,0 → 8,1 |
| Corolla Cross | 8,4 → 4,1 | 6,7 → 5,3 | 6,5 → 3,5 | 5,5 → 2,2 | 5,0 → 4,3 | 3,1 → 0,9 | 2,1 → 4,3 |
| Tonale | 7,5 → 3,5 | 6,0 → 4,8 | 7,5 → 4,0 | 5,4 → 2,1 | 8,4 → 5,7 | 4,9 → 1,3 | 7,1 → 7,1 |
| Sportage HEV | 6,1 → 2,6 | 5,7 → 4,7 | 9,8 → 5,8 | 6,8 → 2,8 | 10,0 → 7,2 | 10,0 → 3,9 | 8,8 → 8,0 |
| Civic e:HEV | 9,3 → 4,9 | 5,5 → 4,5 | 4,0 → 2,3 | 8,3 → 3,8 | 10,0 → 9,0 | 7,9 → 2,2 | 8,8 → 8,0 |
| CX-5 | 6,4 → 2,8 | 3,9 → 3,4 | 9,7 → 5,7 | 9,8 → 5,3 | 10,0 → 7,2 | 0,7 → 0,3 | 3,3 → 5,1 |
| ID.4 | 6,9 → 3,1 | 5,2 → 4,3 | 8,9 → 4,9 | 9,1 → 4,4 | 8,4 → 5,7 | 9,2 → 2,8 | 10,0 → 9,1 |
| EV5 | 5,5 → 2,3 | 4,9 → 4,1 | 9,4 → 5,4 | 8,7 → 4,1 | 10,0 → 7,8 | 3,9 → 1,1 | 7,9 → 7,5 |
| IONIQ 5 | 4,5 → 1,9 | 4,4 → 3,8 | 8,2 → 4,4 | 10,0 → 8,4 | 10,0 → 10,0 | 5,1 → 1,4 | 9,4 → 8,4 |
| Tucson HEV | 6,1 → 2,6 | 6,1 → 4,9 | 10,0 → 6,4 | 6,8 → 2,8 | 10,0 → 7,2 | 8,9 → 2,6 | 8,3 → 7,7 |
| Tucson PHEV | 6,1 → 2,6 | 6,1 → 4,9 | 9,3 → 5,2 | 6,8 → 2,8 | 10,0 → 7,2 | 10,0 → 4,6 | 9,4 → 8,4 |

Y la nota de cada eje afectado:

| Coche | `diario` | `viaje` | `prestaciones` |
| --- | --- | --- | --- |
| EV3 | 6,1 → 3,1 | 5,5 → 3,2 | 7,4 → 4,9 |
| Kona HEV | 8,2 → 4,9 | 7,1 → 3,9 | 1,9 → 2,5 |
| Kona Eléctrico | 6,7 → 3,4 | 7,1 → 3,9 | 8,6 → 5,2 |
| Corolla Cross | 7,7 → 4,6 | 5,9 → 3,3 | 2,6 → 2,6 |
| Tonale | 6,9 → 4,0 | 7,2 → 4,0 | 6,0 → 4,2 |
| Sportage HEV | 6,0 → 3,5 | 9,1 → 5,4 | 9,4 → 5,9 |
| Civic e:HEV | 7,8 → 4,8 | 6,6 → 4,3 | 8,4 → 5,1 |
| CX-5 | 5,4 → 3,1 | 9,8 → 6,0 | 2,0 → 2,7 |
| ID.4 | 4,7 → 2,1 | 8,8 → 5,0 | 9,6 → 5,9 |
| EV5 | 3,7 → 1,5 | 9,4 → 5,7 | 5,9 → 4,3 |
| IONIQ 5 | 3,0 → 1,1 | 9,1 → 6,8 | 7,3 → 4,9 |
| Tucson HEV | 6,1 → 3,6 | 9,2 → 5,7 | 8,6 → 5,2 |
| Tucson PHEV | 6,1 → 3,6 | 8,8 → 5,1 | 9,7 → 6,5 |

Las cinco filas con `diario` más bajo de lo que la sola escala de anchura y
longitud daría a entender —EV3, Kona Eléctrico, ID.4, EV5, IONIQ 5— son las
cinco eléctricas: la penalización de −1,5 puntos sin carga en casa
(`product/0008`) se sigue aplicando después de combinar las dos escalas,
igual que antes de esta spec.

**Es aceptable, y esto es lo que hay que juzgar al aprobar la spec.** Tres
lecturas:

1. **Nadie satura ya un extremo**, salvo el IONIQ 5 en anchura de hombros, que
   marca un 10,0 legítimo: mide 1.460 mm y ese es el techo del mercado. Los
   cinco empates en 10,0 de hoy desaparecen.
2. **Las notas bajan en bloque.** Ningún candidato pasa de 4,9 en `diario`
   —lo saca el Kona HEV, la única no eléctrica que no arrastra la
   penalización de carga— ni de 6,8 en `viaje`, y en CV por tonelada el mejor
   saca 4,6. Es la lectura correcta: son SUV medios de 1.500-2.100 kg medidos
   contra todo lo que se vende, y en uso diario un SUV medio no es bueno, es
   normal tirando a estorbo. Hoy la escala decía que eran buenos porque los
   comparaba con el resto de SUV medios.
3. **Se pierde separación.** El recorrido de `diario` entre el mejor y el peor
   candidato pasa de 5,2 puntos a 3,8; el de `viaje`, de 4,3 a 3,6; el de
   `prestaciones`, de 7,7 a 4,0. Es el coste que el ADR 0010 asume, y quien
   decide cuánto importa cada eje son los pesos.

Con los pesos por defecto (viaje 4, diario 3, fiabilidad 2, estética 2,
prestaciones 1, coste 1), la clasificación queda:

| # | Hoy | % | Con los anclajes nuevos | % |
| --- | --- | --- | --- | --- |
| 1 | Tucson HEV | 78,2 | Tucson HEV | 59,0 |
| 2 | Tucson PHEV | 77,6 | Tucson PHEV | 57,8 |
| 3 | Sportage HEV | 75,4 | Sportage HEV | 55,6 |
| 4 | CX-5 | 72,2 | CX-5 | 55,5 |
| 5 | Civic e:HEV | 70,8 | EV3 | 54,5 |
| 6 | EV3 | 70,5 | Civic e:HEV | 54,4 |
| 7 | Kona Eléctrico | 70,2 | Kona HEV | 52,6 |
| 8 | EV5 | 69,8 | EV5 | 52,0 |
| 9 | Kona HEV | 69,4 | Kona Eléctrico | 50,4 |
| 10 | ID.4 | 68,4 | IONIQ 5 | 49,8 |
| 11 | Tonale | 67,2 | Tonale | 49,1 |
| 12 | IONIQ 5 | 62,9 | ID.4 | 47,7 |
| 13 | Corolla Cross | 59,4 | Corolla Cross | 44,3 |

La cabeza no se mueve —Tucson HEV y PHEV siguen primero y segundo— y el
último tampoco: Corolla Cross cierra la tabla en los dos casos. Lo que se
reordena es la zona media: el IONIQ 5 sube dos puestos —su `viaje` era el
único eje donde ya destacaba, y ahora pesa más al comprimirse el resto— y el
ID.4 baja dos.

## Requisitos / comportamiento esperado

1. La anchura se puntúa con nota 10 en 1.600 mm o menos y nota 0 en 2.000 mm o
   más; la longitud, con nota 10 en 3.600 mm o menos y nota 0 en 5.400 mm o
   más. Curva en S entre anclajes.
2. El maletero se puntúa con nota 10 en 910 L o más y nota 0 en 185 L o menos;
   la batalla, con nota 10 en 3.200 mm o más y nota 0 en 2.400 mm o menos; la
   anchura de hombros, con nota 10 en 1.460 mm o más y nota 0 en 1.260 mm o
   menos. Curva en S entre anclajes.
3. Los CV por tonelada se puntúan con nota 10 en 260 o más y nota 0 en 65 o
   menos; la aceleración 0-100, con nota 10 en 4,4 s o menos y nota 0 en 16,7 s
   o más. Curva en S entre anclajes.
4. Los anclajes de `coste`, `fiabilidad` y `estetica` no cambian.
5. Ningún reparto entre magnitudes cambia: `diario` sigue 0,6/0,4 configurable,
   `viaje` 0,5/0,25/0,25 y `prestaciones` 0,5/0,5.
6. La penalización condicional de `diario` —−1,5 puntos si el coche es
   eléctrico y no hay carga en casa— se sigue aplicando después de combinar
   las dos escalas, y el resultado se sigue acotando a 0-10.
7. La descripción de fórmula que ve el usuario en cada eje afectado declara los
   anclajes nuevos, y el desglose de cada magnitud muestra su valor, sus dos
   anclajes y su nota.
8. Ninguna nota depende de qué otros coches haya en el catálogo. Los anclajes
   siguen sin ser un supuesto global editable desde el panel.
9. La página que explica cómo se calcula todo muestra los anclajes vigentes,
   no los antiguos, sin necesidad de tocarla aparte.

## Criterios de aceptación

> Obligatorios y verificables.

- [x] Un coche de 1.600 mm de ancho saca un 10 en anchura, y uno de 1.500 mm
      también; uno de 2.000 mm saca un 0, y uno de 2.100 mm también.
- [x] Un coche de 3.600 mm de largo saca un 10 en longitud, y uno de 5.400 mm
      un 0.
- [x] Un coche con 910 L de maletero saca un 10, y uno con 1.000 L también;
      uno con 185 L saca un 0, y uno con 150 L también.
- [x] Un coche con 3.200 mm de batalla saca un 10, y uno con 2.400 mm un 0.
- [x] Un coche con 1.460 mm de anchura de hombros saca un 10, y uno con
      1.260 mm un 0.
- [x] Un coche de 260 CV/t saca un 10, y uno de 65 CV/t un 0.
- [x] Un coche que hace el 0-100 en 4,4 s saca un 10, y uno que lo hace en
      16,7 s un 0.
- [x] Un coche en el punto medio de cualquiera de esas siete escalas saca un 5
      en esa magnitud: la curva sigue siendo la misma.
- [x] Ningún candidato del catálogo actual saca 10,0 en anchura de hombros
      salvo el IONIQ 5, que lo saca por medir 1.460 mm.
- [x] Las notas de `coste`, `fiabilidad` y `estetica` de todos los candidatos
      del catálogo son idénticas antes y después del cambio.
- [x] La nota de cada eje de un coche es la misma con trece candidatos en el
      catálogo que con uno solo.
- [x] La descripción de fórmula de `diario`, `viaje` y `prestaciones` cita los
      anclajes nuevos, y no queda ningún anclaje antiguo escrito en el código
      ni en la interfaz.
- [x] La CI pasa entera en local, en la secuencia de
      `docs/proceso/ci-y-guardarrailes.md`.

## Dependencias y supuestos

- Depende del **ADR 0010**, que decide el criterio, y no sustituye al ADR
  0004, que sigue vigente entero.
- **El universo de mercado es una decisión tomada, no un supuesto:** turismo
  generalista de venta al público, sin deportivos, versiones de prestaciones,
  ultralujo, comerciales ni cuadriciclos. Está en el ADR 0010.
- **Los anclajes caducan y hay que mantenerlos.** Un anclaje que dice «lo
  mejor que se vende» deja de ser cierto cuando sale algo mejor. El disparador
  de revisión lo fija el ADR 0010: dar de alta un coche que supere un anclaje
  de 10 o empeore uno de 0.
- **Los anclajes de anchura de hombros mezclan mínimo y máximo.** km77 publica
  para unos modelos «anchura hombros mínima» y para otros «máxima», y el
  catálogo guarda la cifra que km77 dé en cada ficha sin distinguir cuál es.
  El 10 propuesto son los 146 cm **máximos** del Clase E y el 0 los 126 cm
  **mínimos** del Picanto. Es un anclaje algo más ancho de lo que sería con un
  criterio homogéneo, y no se resuelve aquí: homogeneizar esa magnitud es
  trabajo de catálogo, y queda anotado como deuda en `docs/roadmap.md`.
- **La anchura de hombros se publica en centímetros enteros.** Su resolución
  real es de 10 mm y no debe leerse como precisión milimétrica; sigue igual
  que hasta ahora.
- **El peso del Tesla Model 3 Gran Autonomía 4WD son 1.899 kg** según km77, lo
  que da 262,2 CV/t, redondeados a 260 para el anclaje. Solo afecta a la fila
  de referencia, no a ningún candidato.
- **Los 910 L del Kodiaq son su configuración de cinco plazas**, comparable
  con el maletero que declara el resto del catálogo.
- Se asume que las magnitudes de cada eje y el reparto entre ellas no cambian.

## Decisiones abiertas

Ninguna.
