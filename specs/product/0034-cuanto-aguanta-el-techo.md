# 0034 — Cuánto aguanta el techo

- **Id:** product/0034
- **Estado:** verified
- **Tipo:** product
- **Fecha:** 2026-08-31
- **Specs relacionadas:** product/0013, product/0014, product/0018,
  product/0027, product/0031, product/0032, product/0033
- **ADRs relacionados:** 0004, 0010 (los dos, solo como motivo del *fuera de
  alcance*: puntuar esta magnitud exigiría anclar una escala con el criterio
  que fijan)
- **Doc de estado:** `docs/estado/dominio.md`, `docs/estado/interfaz.md`

> ⚠️ **Spec histórica — implementada, sin consolidar.** Describe un cambio ya
> implementado: su sección *Contexto* retrata el sistema **anterior** al
> cambio y hoy no es cierta. **No es referencia del estado actual** — para
> eso, ver el **Doc de estado** indicado arriba. Vigentes aquí los
> **criterios de aceptación**, como registro de verificación.

## Contexto

`product/0033` parte el eje de espacio en dos —carga y habitabilidad— porque
un cofre de techo convierte el maletero en una restricción comprable. Esa
spec no mira ni una vez al coche: le da al usuario dos deslizadores y confía
en que sepa lo que hace.

Y hay algo que el usuario **no puede saber desde la aplicación**: si el
coche que está bajando de peso en carga admite de verdad un cofre. La ficha
compara veinticinco magnitudes y ninguna dice cuánto aguanta el techo. Es un
dato que separa a los candidatos de verdad —los límites publicados van
aproximadamente de 45 a 100 kg, y un cofre vacío ya pesa entre 13 y 20—, que
depende de detalles que no se leen en ninguna otra celda —un techo
panorámico o unos raíles ausentes cambian el número o lo anulan— y que se
publica en la documentación del fabricante.

El riesgo es concreto y nace de la spec anterior: bajar el peso de la carga
es declarar «el equipaje va arriba». Si el coche que gana con esa decisión
resulta ser el único que no admite baca, la aplicación habrá ayudado a
elegirlo **por una capacidad que no tiene**, sin decirlo en ninguna parte.

Esta spec no inventa un mecanismo para eso. `product/0031` ya permite poner
un imprescindible sobre cualquier magnitud de la ficha: en cuanto la carga
máxima sobre el techo *sea* una magnitud de la ficha, «que aguante al menos
50 kg» es una regla eliminatoria más, sin código nuevo.

Se hereda el aviso de `product/0032`: la fuente tiene que decir **qué** está
midiendo. Aquí conviven al menos tres cifras distintas —la carga dinámica
máxima sobre el techo, la capacidad de las barras y la carga estática con el
coche parado, que en un techo con tienda es mucho mayor—. Se declara una
sola, la misma para todos.

## Objetivo

Que el catálogo declare **la carga dinámica máxima sobre el techo** de cada
coche, con fuente real y una sola definición para todos, y que se lea en la
ficha completa junto al resto de magnitudes: comparable, con Δ, ordenable y
disponible como criterio eliminatorio. Sin nota y sin eje.

## Alcance

- **Un campo nuevo y opcional en `Car`**: `maxRoofLoadKg`, la carga dinámica
  máxima sobre el techo en kilogramos.
- **El mismo campo, también opcional, en `Reference`**, por el motivo por el
  que `product/0032` añadió allí el diámetro de giro: sin él, la Δ de esta
  magnitud saldría `'unavailable'` para los dieciocho candidatos siempre que
  se compare contra la referencia.
- **Una fila nueva en la ficha completa**, dentro de «Tamaño y espacio»,
  detrás de «Litros por m²», que cierra el grupo de «cuánto cabe».
- **La polaridad declarada** de la magnitud, para la Δ, el orden y el
  operador que `product/0031` fuerza en una regla.
- **El alta del dato para los registros de hoy** —publicados y despublicados
  por igual, más la referencia— con fuente real citada, donde la fuente lo
  publique para la versión que el catálogo compara.
- **La incorporación del campo a la skill `add-model`.**

## Fuera de alcance

- **Que la carga del techo puntúe.** Ningún eje la lee, ningún peso cambia,
  ninguna nota se mueve. Meterla en `carga` obligaría a anclar una escala
  con el criterio del ADR 0010 y a decidir su peso frente al maletero, y eso
  es una spec de eje con su propia calibración. **Se aplaza con
  disparador**, que se registra en `docs/roadmap.md`: que un candidato quede
  descartado de verdad por no poder llevar arriba lo que no le cabe dentro.
- **La carga estática** —la del techo con el coche parado, la que importa
  para una tienda de techo— como segunda magnitud. Es otra pregunta, la
  publican muchas menos fuentes, y una magnitud que la mayoría de fichas
  dejaría vacía es el error que `product/0028` ya decidió no cometer con la
  capacidad bruta de batería.
- **Modelar el cofre**: sus litros, su peso, su precio, su efecto en el
  consumo o en la altura total del coche. Esta spec declara lo que el techo
  aguanta, no lo que se le pone encima.
- **Si el coche trae raíles de serie o los lleva de opción.** Es equipamiento
  por acabado, y el catálogo no modela acabados.

## Requisitos / comportamiento esperado

### 1. El dato

1.1. `Car` declara `maxRoofLoadKg?: SourcedNumber`, en kilogramos, con la
misma estructura de fuentes que el resto: exactamente una vigente, y una
descartada obliga a declarar su motivo.

1.2. **Es opcional en la forma, y opcional de verdad**: a diferencia de la
autonomía eléctrica (`product/0028`), no hay ninguna invariante cruzada con
`technology` ni con ningún otro campo. Todo coche tiene techo, pero no toda
fuente publica su límite, y un registro sin el dato es un registro
incompleto, no inválido.

1.3. La magnitud declarada es **la carga dinámica máxima sobre el techo**:
lo que el fabricante permite llevar arriba con el coche en marcha,
**incluido el peso del portaequipajes y del cofre**. No es la capacidad de
unas barras concretas, ni la carga estática con el coche parado.

1.4. La fuente debe decir cuál de las tres publica. Si solo publica la
capacidad de unas barras de accesorio, **no vale**: es un dato del
accesorio, no del coche, por la misma razón por la que `product/0032`
rechaza el diámetro entre paredes.

### 2. En la ficha

2.1. Fila nueva en «Tamaño y espacio», detrás de «Litros por m²», con
etiqueta «Carga máxima en techo» y unidad de respaldo `kg`. Sin decimales:
las fuentes lo publican en kilogramos enteros.

2.2. `maxRoofLoadKg` entra en `FICHA_FIELDS`, así que gana Δ contra la
referencia, orden por la columna (`product/0027`) y disponibilidad como
criterio eliminatorio (`product/0031`) sin código propio en ninguno de los
tres.

2.3. Su polaridad es `moreIsBetter`. Es afirmable sin matices, como el
diámetro de giro y a diferencia de la batalla: a igualdad de todo lo demás,
nadie prefiere que el techo aguante menos. Como consecuencia,
`product/0031` solo admite el operador `min` sobre esta magnitud —«que
aguante al menos N kg»—, que es exactamente la regla que motiva la spec.

2.4. Un coche sin el dato muestra la celda vacía, como cualquier otra
magnitud opcional ausente, y su Δ sale `'unavailable'`. **No cuenta como
incumplimiento de una regla eliminatoria por omisión**: se comporta igual
que hoy se comporta cualquier campo opcional ausente frente a una regla, sin
excepción propia.

### 3. El alta del dato

3.1. Se declara para los dieciocho candidatos publicados, para los tres
despublicados y para la referencia, con fuente citada y enlace, donde la
fuente lo publique para la versión comparada.

3.2. Un valor que no se encuentre publicado **se deja ausente**, no
estimado. Un límite de carga inventado no es un dato flojo: es una
afirmación sobre lo que el fabricante autoriza, y quien la lea puede acabar
poniendo peso de más sobre un techo real.

3.3. Los registros que queden sin dato se anotan como deuda en
`docs/roadmap.md`, con el mismo formato que dejó `product/0032` para los
tres coches sin diámetro de giro.

## Criterios de aceptación

> Obligatorios y verificables.

- [ ] `CarSchema` y `ReferenceSchema` aceptan `maxRoofLoadKg` opcional y lo
      validan como `SourcedNumber`; un registro con dos fuentes vigentes, o
      con una descartada sin motivo, sigue fallando al cargar el catálogo
      nombrando el campo y el registro.
- [ ] Ninguna tecnología obliga a declarar el campo ni lo prohíbe: un `EV`,
      un `HEV` y un `ICE` con y sin el dato cargan los seis sin error.
- [ ] `FICHA_FIELDS` incluye `maxRoofLoadKg`, y `polarityOf` devuelve
      `'moreIsBetter'`.
- [ ] La ficha completa muestra «Carga máxima en techo» dentro de «Tamaño y
      espacio», inmediatamente después de «Litros por m²».
- [ ] Una regla eliminatoria sobre `maxRoofLoadKg` solo admite `min`;
      `isOperatorAllowed` rechaza `max` sobre esta magnitud, y una regla
      guardada con `max` se descarta sola al restaurar la configuración.
- [ ] Un coche sin el dato muestra la celda vacía y Δ `'unavailable'`, y no
      queda marcado como incumplidor por una regla sobre esta magnitud.
- [ ] Todo `maxRoofLoadKg` presente en `cars.json` y en `references.json`
      lleva fuente con enlace, y ninguno está marcado `estimated: true`.
- [ ] La skill `add-model` pide el campo, con la definición del requisito
      1.3 y el rechazo del requisito 1.4 escritos en su guía.
- [ ] Los registros sin el dato están anotados en `docs/roadmap.md`.
- [ ] La CI entera pasa en local: `typecheck`, `lint`, `format:check`,
      `arch:check`, `test:coverage` con el suelo de cobertura vigente,
      `check:photos` y el lint de Markdown.

## Dependencias y supuestos

- **No depende de `product/0033`.** Ningún eje lee este campo, así que las
  dos specs pueden implementarse en cualquier orden. Se redactan juntas
  porque nacen del mismo cambio de planteamiento —el cofre—, no porque una
  necesite a la otra.
- **Supone que el dato se publica para la mayoría de los candidatos.** Si al
  darlo de alta resultara que falta en más de la mitad, la fila sería una
  columna de huecos y habría que reconsiderar la spec antes de implementar
  la interfaz, igual que `product/0032` reconsideró el diámetro entre
  paredes. Es un supuesto a comprobar durante el alta, no una decisión
  abierta: la spec dice qué hacer con cada valor que falte.
- **Supone que un límite de carga no cambia entre acabados** de una misma
  motorización. Donde una fuente publique dos, se declara el de la versión
  que el catálogo compara, como manda
  `docs/proceso/calibracion-de-escalas.md` §6: un dato por versión, no por
  modelo.

## Decisiones abiertas

Ninguna.
