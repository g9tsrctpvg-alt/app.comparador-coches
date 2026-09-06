# 0039 — El espacio de atrás, medido

- **Id:** product/0039
- **Estado:** draft
- **Tipo:** product
- **Fecha:** 2026-09-06
- **Specs relacionadas:** product/0005, product/0013, product/0017,
  product/0018, product/0026, product/0027, product/0031, product/0033,
  product/0038
- **ADRs relacionados:** 0004, 0010
- **Doc de estado:** `docs/estado/dominio.md`, `docs/estado/interfaz.md`

## Contexto

`habitabilidad` puntúa hoy `0,5 × escala(batalla) + 0,5 × escala(anchura de
hombros)`, y su propia fórmula declara por qué las dos pesan igual: «ninguna
es mejor proxy que la otra del espacio de quien va detrás — la batalla
reparte entre habitáculo y vanos, la anchura de hombros se mide dentro del
habitáculo pero solo a una altura».

Eso es exacto y es el problema: **la batalla no mide el espacio de atrás, lo
insinúa**. Es la distancia entre ejes, y dos coches con la misma pueden dar
sitio distinto a las piernas según dónde caiga el habitáculo dentro de ella.
El eje mide a lo largo con una regla que está por fuera del coche.

Este proyecto ya pagó una vez por medir con lo que había en vez de con lo que
importaba. `product/0005` sacó el confort de viaje del eje porque aquella
valoración subjetiva resultó estar midiendo lo bonito que parecía el interior
en las fotos (r = 0,77 con la estética) y no el espacio (r = 0,08 con el
maletero). La lección no fue «no uses valoraciones»: fue que una magnitud que
se parece a la que quieres medir no es la que quieres medir.

Y la medida directa está en la fuente que el catálogo ya usa. La ficha de
*mediciones propias* de km77 —de la que salen **los veintiún** valores de
`rearShoulderWidthMm` del catálogo, comprobado registro a registro— publica
en su bloque de segunda fila la fila «Distancia del respaldo al respaldo
delantero»: cuánto hay, dentro del coche, entre el respaldo de atrás y el de
delante.

**Esa fila se publica con un solo rótulo y un solo valor**, y eso no es un
detalle menor: comprobado el 2026-09-06 en tres fichas de segmentos opuestos
—Kia Picanto, Kia EV3 y Mercedes-Benz Clase E—, las tres la publican igual.
La anchura de hombros, en cambio, aparece en unas fichas como «Anchura
hombros mínima» y en otras como «Anchura hombros máxima», **nunca las dos a
la vez**: la del Picanto solo trae la mínima (126 cm) y la de la Clase E solo
la máxima (146 cm). La magnitud nueva llega sin la ambigüedad que arrastra la
que ya está.

Está registrado como propuesta P18 en `docs/roadmap.md`.

## Objetivo

Que `habitabilidad` puntúe el espacio de atrás **medido dentro del coche**,
no inferido de la distancia entre ejes, y que cada anchura de hombros diga
qué fila de la fuente hay detrás de su número.

## Alcance

- **Un campo nuevo y obligatorio en `Car`**: `rearLegroomMm`, el espacio
  longitudinal de la segunda fila, en milímetros.
- **La fórmula de `habitabilidad`**, que pasa a puntuar esa magnitud en lugar
  de la batalla, con el mismo reparto 50/50.
- **Los dos anclajes de la escala nueva**, fijados con el criterio del ADR
  0010 y medidos en la misma fuente y la misma fila que la magnitud.
- **El re-etiquetado de los veintiún `rearShoulderWidthMm`** para que cada
  uno declare qué fila de la fuente hay detrás de su valor. Ningún valor
  cambia.
- **Una fila nueva en la ficha completa**, con su polaridad, su orden y su
  disponibilidad como criterio eliminatorio.
- **El alta del dato para los veintiún registros** —publicados y
  despublicados por igual— con fuente real citada.
- **La incorporación del campo a la skill `add-model`.**
- **La actualización del *snapshot* de puntuación**, que se moverá a
  propósito.

## Fuera de alcance

- **La altura al techo atrás como tercer sumando.** La misma tabla la
  publica, y es espacio de atrás tan legítimo como los otros dos, pero llega
  con el mismo defecto que la anchura de hombros —unas fichas dan «Altura
  mínima al techo» y otras «Altura máxima con techo solar»— y además obliga a
  repartir el eje entre tres y a anclar una escala más. Esta spec cambia una
  magnitud por otra mejor; no rehace el eje.
- **Homogeneizar la anchura de hombros.** No se puede con esta fuente, y el
  requisito 3 lo demuestra en vez de suponerlo.
- **`Reference`.** La referencia declara solo magnitudes dimensionales de
  carrocería, y la anchura de hombros ya no está allí: la Δ de esta magnitud
  saldrá `'unavailable'` contra ella, exactamente como pasa hoy con los
  hombros. Añadirla exigiría una medición propia de km77 del Giulietta, y no
  es lo que la referencia existe para dar.
- **Cambiar el 50/50** entre las dos magnitudes del eje, ni el peso por
  defecto del eje, que sigue en 5.
- **Retirar `wheelbaseMm`** del catálogo o de la ficha. Deja de puntuar y
  sigue declarada, comparable y ordenable, con el mismo trato que ya reciben
  `generation` o `warrantyExtension`: informativa por diseño.
- **Medir el espacio de la primera fila.** Quien decide va a ir delante, pero
  ninguna de las dos plazas delanteras es lo que este eje mide, y ningún
  candidato se descarta por no caber el conductor.

## Requisitos / comportamiento esperado

### 1. El dato

1.1. `Car` declara `rearLegroomMm: SourcedNumber`, en milímetros,
**obligatorio**, con la misma estructura de fuentes que el resto y el mismo
trato que `rearShoulderWidthMm`: si un eje lo puntúa, ningún candidato puede
no tenerlo.

1.2. La magnitud declarada es la fila **«Distancia del respaldo al respaldo
delantero»** del bloque de segunda fila de las mediciones propias de km77.
Una cifra de «espacio para las piernas» publicada por el fabricante, o la
longitud del habitáculo, **no valen**: no es la misma medida y no se compara
con esta, por la misma razón por la que `product/0032` rechaza el diámetro
entre paredes.

1.3. **Su resolución real es de centímetros.** Se guarda en milímetros por
coherencia con el resto de medidas, y no debe leerse como precisión
milimétrica: es el mismo aviso que ya arrastra la anchura de hombros desde
`product/0017`.

1.4. **Depende de dónde esté el asiento delantero**, y la fuente lo mide en
la posición en que lo deja su protocolo. El catálogo declara el valor tal
como lo publica, sin corregirlo ni normalizarlo: corregir una medición ajena
es inventar una propia.

### 2. El eje

2.1. `habitabilidad` pasa a ser
`0,5 × escala(espacio de piernas atrás) + 0,5 × escala(anchura de hombros)`.

2.2. **El 50/50 se mantiene, y ahora con mejor razón que antes.** Ya no es
«ninguna es mejor proxy que la otra», que era un empate entre dos medidas
indirectas: una mide el sitio a lo largo y otra a lo ancho, ninguna sustituye
a la otra, y las dos se miden dentro del coche.

2.3. Los anclajes de la magnitud nueva son los extremos del turismo
generalista de venta al público (ADR 0010):

| Magnitud | Nota 10 desde | Nota 0 hasta |
| --- | --- | --- |
| Espacio de piernas atrás | 810 mm | 590 mm |

**El techo lo pone el BMW i7 xDrive60 —81 cm—**, el mismo modelo que ya ancla
la batalla, y no es un artefacto de berlina de lujo: el Škoda Superb, una
berlina generalista, se queda a un centímetro. **El suelo lo pone el Toyota
Aygo X Cross Play —59 cm—**, el más justo de los siete urbanos medidos.
Consultado el 2026-09-06 en las mediciones propias de km77, en la misma fila
que declara el requisito 1.2:

| Modelo medido | Espacio de piernas atrás |
| --- | --- |
| BMW i7 xDrive60 (2022) | 81 cm |
| Škoda Superb (2024) | 80 cm |
| Tesla Model S (2021) | 75 cm |
| Mercedes-Benz Clase E Berlina (2023) | 74 cm |
| Hyundai i10 (2020) | 69 cm |
| Mitsubishi Space Star (2020) | 68 cm |
| Dacia Spring (2021) | 62 cm |
| Leapmotor T03 (2024) | 62 cm |
| Fiat 500 3 puertas (2021) | 61 cm |
| Kia Picanto (2024) | 61 cm |
| Toyota Aygo X Cross Play (2022) | 59 cm |

Ninguno de los dos anclajes se elige mirando dónde caen los candidatos: los
once modelos medidos son ajenos a la comparativa, y entre los dieciocho
publicados no hay ni un urbano ni una berlina de representación. Es el
criterio del ADR 0010, y el fallo que ese ADR corrige era exactamente el
contrario —apretar la escala contra la gama que se compara—.

2.4. La curva entre anclajes es la misma que la del resto de ejes medidos:
*smoothstep*, vía `scoreOnAbsoluteScale`.

2.5. **`wheelbaseMm` deja de entrar en ninguna nota.** Ningún otro eje la
lee, así que no queda ningún consumidor de puntuación; sigue en la ficha con
polaridad `neutral`, comparable y ordenable.

2.6. **Los anclajes de la anchura de hombros no se tocan** —1.460 y
1.260 mm—: son los que publican las fichas de sus dos modelos, y el requisito
3 explica por qué no hay una fila común con la que re-medirlos.

### 3. Los hombros, y por qué su deuda no se cierra aquí

3.1. **Comprobado el 2026-09-06** sobre las fichas de los dos modelos que
anclan esa escala: la del Kia Picanto publica **solo** «Anchura hombros
mínima» (126 cm) y la de la Mercedes-Benz Clase E publica **solo** «Anchura
hombros máxima» (146 cm). km77 no publica las dos filas para un mismo coche,
así que **elegir una y re-declarar los veintiún registros con ella es
imposible con esta fuente**. La deuda abierta desde `product/0017` no se
cierra aquí: su condición de cierre —«decidir cuál de las dos usa el proyecto
y revisar las fichas»— da por hecho que hay dos entre las que elegir.

3.2. Lo que esta spec sí hace es **hacer visible la mezcla**: cada
`rearShoulderWidthMm` declara en la etiqueta de su fuente cuál de las dos
filas hay detrás de su número, y los registros que hoy no lo dicen se
re-etiquetan contra su ficha. **Ningún valor cambia**, así que este requisito
no mueve ninguna nota.

3.3. La asimetría llega también a los anclajes, y se escribe en vez de
disimularse: el 1.460 del techo es una anchura **máxima** y el 1.260 del
suelo es una **mínima**. Se consolida así en `docs/estado/dominio.md`.

3.4. La deuda de `docs/roadmap.md` se **actualiza con este hallazgo**, no se
cierra: su condición de cierre pasa a ser encontrar una fuente que publique
la misma fila para todos los candidatos, o declarar la mezcla como límite
asumido del eje.

### 4. En la ficha

4.1. Fila nueva en «Tamaño y espacio», **entre «Diámetro de giro» y «Anchura
de hombros atrás»**, con etiqueta «Espacio de piernas atrás» y unidad de
respaldo `mm`: las tres medidas de la segunda fila quedan seguidas.

4.2. `rearLegroomMm` entra en `FICHA_FIELDS`, y con ello gana Δ, orden por su
columna (`product/0027`) y disponibilidad como criterio eliminatorio
(`product/0031`) sin código propio en ninguno de los tres.

4.3. Su polaridad es `moreIsBetter`, afirmable sin matices y a diferencia de
la batalla: la batalla es `neutral` porque más batalla es más coche por fuera
además de más sitio por dentro, y esta magnitud solo mide lo de dentro.
`product/0031` solo admitirá el operador `min` sobre ella.

4.4. Contra la referencia, la Δ de esta fila sale `'unavailable'` para todos
los candidatos, como ya ocurre con la anchura de hombros. No es un caso
especial: la referencia no declara la magnitud.

### 5. El alta del dato

5.1. Se declara para los dieciocho candidatos publicados y los tres
despublicados, con fuente citada, con enlace y con la versión medida, tal
como ya se hace con la anchura de hombros.

5.2. **Ningún valor se estima.** El campo es obligatorio y un eje lo puntúa:
un número puesto a ojo iría directo a la nota. Si un registro no tuviera la
medición publicada, el alta se detiene ahí y se decide qué hacer con ese
coche —no se rellena—.

5.3. La skill `add-model` pasa a pedir la magnitud, con la definición del
requisito 1.2, la regla de etiquetado del 3.2 y su recuento actualizado.

### 6. El movimiento de las notas

6.1. `scoreCatalog.snapshot.test.ts` se actualiza **a propósito**: cambia una
de las dos magnitudes de un eje con peso 5, así que los totales se mueven.
Que el test falle antes de actualizarlo es la señal esperada.

6.2. La verificación **declara cuánto se mueve la clasificación** —qué coches
cambian de puesto y cuánto varía cada porcentaje—, con el precedente de
`product/0033`, que midió su equivalencia bit a bit antes de darla por buena.

6.3. Se mide además la correlación entre la subnota nueva y el maletero sobre
el catálogo real. `product/0033` partió `viaje` porque maletero y
habitabilidad resultaron ser casi independientes (r = 0,28); si la magnitud
nueva llegara correlacionada con el maletero, el eje estaría midiendo otra
vez lo mismo por otra puerta, y eso hay que verlo antes de consolidar, no
después.

## Criterios de aceptación

> Obligatorios y verificables.

- [ ] `CarSchema` exige `rearLegroomMm` y lo valida como `SourcedNumber`; un
      registro sin el campo, con dos fuentes vigentes o con una descartada
      sin motivo falla al cargar el catálogo nombrando el campo y el
      registro.
- [ ] `habitabilidad` puntúa `0,5 × escala(rearLegroomMm) + 0,5 ×
      escala(rearShoulderWidthMm)`, con los anclajes 810 mm y 590 mm para la
      primera y 1.460 mm y 1.260 mm para la segunda.
- [ ] El desglose del eje declara los dos anclajes de cada sumando con su
      valor y su nota, y la descripción de fórmula nombra el modelo que fija
      cada extremo.
- [ ] Ningún eje lee ya `wheelbaseMm`: buscarlo en `src/domain/scoring/` no
      devuelve ninguna aparición.
- [ ] `wheelbaseMm` sigue en `FICHA_FIELDS` con polaridad `neutral`, con su
      fila, su Δ y su orden intactos.
- [ ] `FICHA_FIELDS` incluye `rearLegroomMm` y `polarityOf` devuelve
      `'moreIsBetter'`; una regla eliminatoria sobre la magnitud solo admite
      `min`.
- [ ] La ficha completa muestra «Espacio de piernas atrás» en «Tamaño y
      espacio», entre «Diámetro de giro» y «Anchura de hombros atrás».
- [ ] Los veintiún registros declaran `rearLegroomMm` con fuente con enlace y
      versión, y ninguno está marcado `estimated: true`.
- [ ] Los veintiún `rearShoulderWidthMm` declaran en la etiqueta de su fuente
      qué fila de km77 —«máxima» o «mínima»— hay detrás de su valor, y
      ninguno de los veintiún valores ha cambiado.
- [ ] El *snapshot* de puntuación está actualizado y la verificación declara
      qué puestos se movieron y cuánto.
- [ ] La correlación medida entre la subnota de espacio de piernas y el
      maletero está declarada en la verificación.
- [ ] La skill `add-model` pide la magnitud y la regla de etiquetado del
      requisito 3.2.
- [ ] La deuda de hombros mínimos mezclados con máximos está **actualizada**
      en `docs/roadmap.md` con el hallazgo del requisito 3.1 y su nueva
      condición de cierre.
- [ ] La CI entera pasa en local: `format:check`, `lint`, `typecheck`,
      `arch:check`, `test:coverage` con el suelo de cobertura vigente,
      `markdownlint` y `build`.

## Dependencias y supuestos

- **Supone que la fuente publica la fila para los veintiún registros.** No es
  una apuesta: los veintiuno ya citan esa misma tabla para la anchura de
  hombros, así que la tabla existe para todos y la fila vive en ella. Lo que
  hay que comprobar durante el alta es que ninguna ficha concreta la deje en
  «No disponible», como le pasa a cuatro híbridos con la capacidad de
  batería.
- **Los anclajes se han medido en la misma fuente y la misma fila que la
  magnitud** (requisito 2.3), no en una fuente distinta: comparar el valor de
  un coche contra un extremo medido con otro protocolo es el error que este
  proyecto ya cometió con la anchura de hombros.
- **Es independiente de `product/0038`**, redactada el mismo día: las dos
  añaden un campo a `FICHA_FIELDS`, así que la que llegue segunda ajusta el
  recuento en su verificación. Ninguna necesita a la otra.
- **Un dato por versión, no por modelo**
  (`docs/proceso/calibracion-de-escalas.md` §6): donde km77 haya medido dos
  versiones, se declara la que el catálogo compara, igual que ya se hace con
  la anchura de hombros.
- **Los anclajes viven en esta spec y se consolidan con su razonamiento** en
  `docs/estado/dominio.md` (`calibracion-de-escalas.md` §5). Un anclaje sin
  porqué legible en un doc de estado es un número mágico.

## Decisiones abiertas

Ninguna.
