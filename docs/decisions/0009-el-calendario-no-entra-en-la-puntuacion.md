# 0009 — El calendario no entra en la puntuación

- **Estado:** draft
- **Fecha:** 2026-08-15
- **Nivel:** 🟡

## Contexto

El ADR 0004 fijó que cada eje puntúa contra una escala absoluta y no contra
el conjunto de candidatos. De ahí salió una propiedad que hoy se da por
sentada: **la nota de un coche solo cambia cuando cambia un dato del coche,
un peso o un supuesto**. Añadir, quitar o despublicar candidatos no
repuntúa a nadie.

Ese ADR dice contra qué **no** puede anclarse una escala —el conjunto de
candidatos— porque era el problema que tenía delante. No dice nada del
reloj, y no hacía falta: ninguna magnitud del catálogo es una fecha. El
dominio no sabe qué día es, y la única lectura del reloj en todo el árbol es
el `Timestamp` del logger (`src/logging/logger.ts`).

El primer dato fechado que quiere entrar es el año de la generación
(`product/0021`), y con él llega la pregunta obvia: si sirve para saber en
qué punto tecnológico está un coche, ¿por qué no puntúa?

Porque una escala sobre un año no se comporta como las demás. Un anclaje del
tipo «nota 10 desde 2023, nota 0 hasta 2015» no describe el coche: describe
la distancia entre el coche y hoy. El dato no cambia y la nota sí. En
concreto:

- **El ranking se reordena solo**, sin ningún diff que lo explique. Es
  justo lo que el ADR 0004 quitó al eliminar la normalización relativa, por
  otra puerta.
- **`scoreCatalog.snapshot.test.ts` se pone rojo un 1 de enero** sin que
  nadie haya tocado nada, y el arreglo consiste en aceptar el nuevo
  snapshot: el test deja de comprobar algo.
- **La página que explica los cálculos** (`product/0011`) mostraría un
  anclaje que ya no es el que produjo la nota que el usuario recuerda de la
  semana pasada.

## Decisión

**Ninguna puntuación de este proyecto depende de la fecha en que se
ejecuta.**

- Ningún eje lee el reloj, ni directamente ni a través de un valor derivado
  del tipo «años desde».
- Un dato fechado —año de generación, de retoque, de homologación, de
  matriculación— **se declara en el catálogo, se muestra en la ficha y se
  compara entre coches, pero no produce nota.** Tiene precedente: la
  extensión de garantía ya es un dato que se muestra y no puntúa
  (`AxisBreakdown.info`, `product/0007`).
- Si alguna vez se decide que la antigüedad debe puntuar, **la spec que lo
  decida fija una fecha de referencia explícita** y la escala se ancla
  contra ella. El reloj sigue sin entrar: renovar esa fecha pasa a ser un
  cambio con su diff y su commit, como cualquier otro cambio de escala.

Esto no degrada el dato fechado a información de segunda. Lo coloca donde
sirve: en la ficha, donde el lector compara y decide, en vez de en una nota
que decidiría por él con una escala que envejece sola.

## Alternativas consideradas

- **Puntuar el año contra anclajes fijos** («10 desde 2023, 0 hasta 2015»).
  Es lo que pide el cuerpo cuando se ve el dato en la ficha. Descartada por
  lo de arriba: es la única magnitud del sistema cuya nota se movería sin
  que cambiara ningún dato, y rompe la propiedad que el ADR 0004 compró.
- **Puntuar la antigüedad calculada** (`hoy − año de generación`) en vez del
  año. Parece distinto y es lo mismo escrito de otra manera: la dependencia
  del reloj se muda del anclaje al valor. Encima empeora la trazabilidad —
  el número que se puntúa ya no está en `cars.json`, así que no hay fuente
  que citar para él.
- **Puntuar el año contra una fecha de referencia congelada en la spec**
  («a efectos de esta escala, hoy es 2026»). Es defendible, no rompe nada, y
  es justo lo que esta decisión deja abierto para el futuro. Descartada
  **para ahora**, no por principio: el punto tecnológico ya se cobra
  indirectamente en `coste` (consumo), `prestaciones` (empuje) y
  `fiabilidad`, y un eje propio cobraría dos veces la misma vejez. Su
  disparador está en las consecuencias.
- **No declarar el dato en absoluto**, para no tener la tentación.
  Descartada porque el dato ya se está usando a mano, en texto libre: las
  notas del catálogo distinguen «la primera generación (NX 300h), otro coche
  distinto» y las fotos se justifican con «misma generación NX4 retocada».
  El problema nunca fue tener el dato, sino puntuarlo.
- **Dejarlo como convención no escrita.** Descartada porque
  `docs/proceso/calibracion-de-escalas.md` obliga a mirar con sospecha un
  eje en el que los candidatos apenas se separan, y el año es la tentación
  más obvia para separar a coches parecidos. Sin ADR, la próxima spec lo
  intentaría con toda la razón aparente y sin nada escrito que la parase.

## Consecuencias

- **Las notas siguen siendo estables**, y el snapshot de `scoreCatalog`
  sigue significando algo: si cambia, es porque alguien cambió un dato, un
  peso o una fórmula.
- **La ficha gana un tipo de dato nuevo**: comparable, con Δ y sin nota. No
  necesita mecanismo nuevo — se apoya en la polaridad `neutral` que
  `product/0013` ya declaró para las magnitudes sin dirección.
- **Queda aplazado un eje de antigüedad u obsolescencia.** *Disparador
  explícito:* que alguien quiera que el punto tecnológico pese en la
  decisión. La spec que lo recoja tendrá que declarar la fecha de referencia
  y defender que no se solapa con consumo, prestaciones y fiabilidad, que ya
  cobran parte de esa vejez.
- **Coste asumido: el año lo interpreta el lector.** El comparador enseña
  «2020, retocado en 2024» y no traduce eso a puntos. Es menos automático y
  es lo correcto: no hay una función de años a calidad que se pueda
  defender.
- **Rige sobre la puntuación, no sobre la interfaz.** Que la ficha muestre
  el año declarado en vez de una edad calculada al vuelo es coherente con
  esta decisión, pero si una spec de interfaz quiere mostrar «hace seis
  años» en algún sitio, es asunto suyo: no hay ninguna nota detrás.
- **El logger no se ve afectado.** Su `Timestamp` es un hecho del registro,
  no una entrada de ninguna fórmula.

## Historial

- **2026-08-15** — ADR creado, junto con la spec `product/0021` que lo
  motiva: el año de generación es el primer dato fechado del catálogo, y la
  pregunta de si debía puntuar no tenía dónde responderse.
