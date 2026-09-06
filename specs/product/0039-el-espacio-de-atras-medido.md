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
en su bloque de segunda fila, además de la anchura de hombros: «Distancia del
respaldo al respaldo delantero», «Altura al techo», «Regulación longit. de la
banqueta» e «Isofix. Distancia entre anclajes»; y en el de maletero, anchura,
profundidad y «Altura de borde de carga». Comprobado fila a fila sobre la
ficha del Kia EV3 el 2026-09-06.

De paso, esa misma tabla cierra una deuda abierta desde `product/0017`: km77
publica la anchura de hombros como máxima y mínima, y el catálogo guardó
«la que publicara cada ficha» sin distinguir cuál, así que hoy mezcla mínimos
con máximos en la misma columna.

Está registrado como propuesta P18 en `docs/roadmap.md`.

## Objetivo

Que `habitabilidad` puntúe el espacio de atrás **medido dentro del coche**,
no inferido de la distancia entre ejes, y que la anchura de hombros deje de
mezclar mínimos con máximos en la misma columna.

## Alcance

- **Un campo nuevo y obligatorio en `Car`**: `rearLegroomMm`, el espacio
  longitudinal de la segunda fila, en milímetros.
- **La fórmula de `habitabilidad`**, que pasa a puntuar esa magnitud en lugar
  de la batalla, con el mismo reparto 50/50.
- **Los dos anclajes de la escala nueva**, con el criterio del ADR 0010.
- **La re-declaración de los veintiún `rearShoulderWidthMm`** desde una fila
  declarada y la misma para todos, conservando el valor anterior como fuente
  descartada.
- **Una fila nueva en la ficha completa**, con su polaridad, su orden y su
  disponibilidad como criterio eliminatorio.
- **El alta del dato para los veintiún registros** —publicados y
  despublicados por igual— con fuente real citada.
- **La incorporación del campo a la skill `add-model`.**
- **La actualización del *snapshot* de puntuación**, que se moverá a
  propósito.

## Fuera de alcance

- **La altura al techo atrás como tercer sumando.** La misma tabla la
  publica, y es espacio de atrás tan legítimo como los otros dos, pero
  añadirla obliga a repartir el eje entre tres y a anclar una escala más.
  Esta spec cambia una magnitud por otra mejor; no rehace el eje.
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

2.3. Los dos anclajes de la escala nueva son los extremos del turismo
generalista de venta al público (ADR 0010), cada uno con su modelo y su
fuente publicada. Quedan por fijar: es la única **decisión abierta** de esta
spec, y sin ellos no puede pasar a `approved`.

2.4. La curva entre anclajes es la misma que la del resto de ejes medidos:
*smoothstep*, vía `scoreOnAbsoluteScale`.

2.5. **`wheelbaseMm` deja de entrar en ninguna nota.** Ningún otro eje la
lee, así que no queda ningún consumidor de puntuación; sigue en la ficha con
polaridad `neutral`, comparable y ordenable.

2.6. Los anclajes de la anchura de hombros —1.460 y 1.260 mm— **se revisan al
re-declarar el dato** (requisito 3): si el criterio del requisito 3.1 cambia
la magnitud que la columna guarda, los extremos que la anclan tienen que
medirse con ese mismo criterio o dejan de ser comparables con ella.

### 3. Los hombros

3.1. Los veintiún registros re-declaran `rearShoulderWidthMm` desde **la fila
mínima** de esa tabla, la misma para todos, y la etiqueta de la fuente dice
cuál se ha tomado. Se elige la mínima porque es la que manda para lo que la
magnitud existe para responder —si caben tres atrás—: el hueco lo decide el
punto más estrecho, no el más ancho. Es un juicio, y el gate humano puede
darle la vuelta; lo que no puede quedarse es la columna mezclando las dos.

3.2. El valor anterior **se conserva como fuente descartada** con su
`discardedReason`, no se sobrescribe: corregir un valor no es cambiarlo de
opinión sin registro (`docs/proceso/calibracion-de-escalas.md` §6).

3.3. La deuda de hombros mínimos mezclados con máximos se cierra en
`docs/roadmap.md`, no se reescribe.

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
requisito 1.2, el criterio de hombros del 3.1 y su recuento actualizado.

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
      escala(rearShoulderWidthMm)`, y su desglose declara los dos anclajes de
      cada sumando con el valor, la nota y el modelo que los fija.
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
- [ ] Los veintiún `rearShoulderWidthMm` declaran la misma fila de la fuente,
      la etiqueta lo dice, y el valor anterior sigue presente como fuente
      descartada con su motivo allí donde haya cambiado.
- [ ] El *snapshot* de puntuación está actualizado y la verificación declara
      qué puestos se movieron y cuánto.
- [ ] La correlación medida entre la subnota de espacio de piernas y el
      maletero está declarada en la verificación.
- [ ] La skill `add-model` pide la magnitud y el criterio de hombros del
      requisito 3.1.
- [ ] La deuda de hombros mínimos mezclados con máximos está cerrada en
      `docs/roadmap.md`.
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

1. **Los dos anclajes de la escala de espacio de piernas atrás**: qué valor
   marca el 10 y cuál el 0, cada uno con el modelo que lo fija y su fuente
   publicada, dentro del universo que declara el ADR 0010 —turismo
   generalista de venta al público, sin deportivos, versiones de
   prestaciones, ultralujo, comerciales ni cuadriciclos—. No se pueden
   deducir del catálogo: apretarlos contra la gama comparada es exactamente
   el fallo que el ADR 0010 corrige. Cerrar esta decisión es trabajo de
   búsqueda en la misma fuente que mide la magnitud, y hasta que no esté
   hecha esta spec no puede pasar a `approved`.
