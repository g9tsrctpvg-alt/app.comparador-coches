# 0038 — El consumo del enchufable cuando no se carga en casa

- **Id:** product/0038
- **Estado:** draft
- **Tipo:** product
- **Fecha:** 2026-09-06
- **Specs relacionadas:** product/0003, product/0008, product/0013,
  product/0018, product/0027, product/0028, product/0031, product/0039
- **ADRs relacionados:** 0004 y 0010, los dos solo como motivo del *fuera de
  alcance*: la escala de `coste` no se toca, solo la cifra que entra en ella
- **Doc de estado:** `docs/estado/dominio.md`, `docs/estado/interfaz.md`

## Contexto

El eje `coste` calcula la energía anual de un coche con una sola cifra,
`car.consumption`, y con el precio unitario que le corresponde a su
tecnología (`product/0008`): kWh si es `EV`, litros en todo lo demás. Para un
`PHEV`, esa cifra es el **consumo WLTP ponderado**, y el ponderado sale de
suponer que el coche empieza cada trayecto con la batería llena.

La aplicación supone justo lo contrario. `cargaEnCasa` viene desactivado por
defecto, porque es la situación declarada de quien decide, y el perfil de uso
son viajes largos. Un enchufable que no se enchufa es un híbrido que carga
con trece kilos y medio de batería vacía, y su consumo real no se parece al
ponderado.

Hoy el catálogo tiene un `PHEV` publicado, el Hyundai Tucson PHEV, que
declara `consumption` 2,7 l/100 km con fuente «km77, consumo WLTP
combinado». Con esa cifra va **segundo de dieciocho, con 60,12 %, a 0,35 pp
del líder**. Medido con el propio `scoreCatalog` y los pesos por defecto,
sustituyendo únicamente ese número: a 5,5 l/100 km sigue segundo con
59,63 %; a 6,6 baja a **tercero** con 58,66 %; a 7,5, a **cuarto** con
57,65 %. Esas tres cifras son sensibilidad, no dato: ninguna tiene fuente, y
encontrarla es parte de esta spec.

Hay además una asimetría que el modelo no ha declarado en ninguna parte.
`diario` resta 1,5 puntos a un eléctrico cuando `cargaEnCasa` está
desactivado, porque cargar fuera de casa es la molestia que ese eje mide. El
enchufable, cuyo consumo homologado **depende enteramente** de cargar, no
paga nada por lo mismo. No es que le falte la penalización de `diario` —no
le corresponde, y el *fuera de alcance* lo razona—: es que su coste se
calcula con una cifra que presupone lo que el usuario ha dicho que no puede
hacer.

Está registrado como propuesta P17 en `docs/roadmap.md`, con estas mismas
mediciones.

## Objetivo

Que el coste de un enchufable se calcule con el consumo que ese coche tiene
de verdad para quien no puede cargar en casa, y que el desglose diga qué
cifra ha aplicado y por qué.

## Alcance

- **Un campo nuevo y opcional en `Car`**: `sustainedConsumption`, el consumo
  homologado en modo sostenido, en litros a los 100 km. Solo lo puede
  declarar un `PHEV`.
- **La regla de selección de cifra en el eje `coste`**, y solo ahí.
- **El desglose declara qué cifra ha aplicado y por qué**, como línea propia,
  con el precedente de `product/0008` para el precio unitario de la energía.
- **Una fila nueva en la ficha completa**, con su polaridad, su orden y su
  disponibilidad como criterio eliminatorio, que salen de estar en
  `FICHA_FIELDS` sin código propio.
- **El alta del dato** para los dos registros `PHEV` del catálogo —el Tucson
  PHEV publicado y el BMW X1 xDrive25e despublicado— con fuente real.
- **La incorporación del campo a la skill `add-model`.**
- **La actualización del *snapshot* de puntuación**, que se moverá a
  propósito para el `PHEV` que declare el dato.

## Fuera de alcance

- **Un factor de utilización** que reparta kilómetros entre modo eléctrico y
  modo térmico. Es el modelo correcto y es otra spec: exige saber cuánto se
  carga, y `cargaEnCasa` es un booleano, no un patrón de uso. Esta spec
  resuelve el caso que hoy está mal —no se carga nunca— y deja el caso
  intermedio donde está.
- **Cambiar la penalización de `diario`.** No se extiende al enchufable, y no
  por olvido: esa penalización mide la molestia de depender de un cargador
  ajeno, y quien no enchufa un `PHEV` no la sufre — reposta gasolina como
  cualquiera. Lo que sí cambia por no cargar es lo que gasta, y eso es
  exactamente lo que esta spec corrige.
- **Tocar los anclajes de `coste`.** Los 100 y 250 €/mes de la escala de uso
  siguen siendo los mismos: cambia la cifra que entra, no la regla con la que
  se puntúa (ADR 0004 y ADR 0010).
- **El consumo real de los eléctricos en autopista**, que es el mismo problema
  por la otra cara —el WLTP mixto tampoco describe el uso declarado— pero
  exige otra magnitud, otra fuente y su propia medición. Queda registrado como
  propuesta P20 en `docs/roadmap.md`.
- **Sustituir el consumo homologado por consumo real medido** para todo el
  catálogo. Es una pregunta distinta —qué fuente, medida en qué recorrido, y
  si se puede comparar entre medios— y no cabe aquí.

## Requisitos / comportamiento esperado

### 1. El dato

1.1. `Car` declara `sustainedConsumption?: SourcedNumber`, en `l/100km`, con
la misma estructura de fuentes que el resto: exactamente una vigente, y una
descartada obliga a declarar su motivo.

1.2. **Quién puede declararlo lo impone el esquema**, no una convención, con
la misma mecánica que `product/0028` usa para la autonomía eléctrica: es una
invariante cruzada entre `technology` y el campo, así que vive en el
`superRefine` del registro completo.

| Tecnología | `sustainedConsumption` |
| --- | --- |
| `PHEV` | Opcional |
| `EV`, `HEV`, `MHEV`, `ICE` | Prohibida |

La infracción falla nombrando el campo y la tecnología. El motivo de la
prohibición es que la magnitud no existe fuera del enchufable: un `EV` no
quema nada, y un `HEV`, un `MHEV` o un `ICE` no tienen modo de agotamiento
—su `consumption` ya es, por construcción, un consumo sostenido—.

1.3. **Es opcional de verdad.** Si la fuente no lo publica para la versión
que el catálogo compara, el campo se deja ausente: es ausencia de fuente y se
registra como deuda, nunca un número puesto a ojo.

1.4. La magnitud declarada es el **consumo WLTP en modo sostenido**
(*charge-sustaining*): el que la homologación mide con la batería en su
estado mínimo de carga. No es el ponderado, que es el que ya vive en
`consumption`, ni ninguna cifra de ciclo urbano. La fuente tiene que decir
cuál de las dos publica; si no lo distingue, no vale, por la misma razón por
la que `product/0032` rechaza el diámetro entre paredes.

### 2. El cálculo

2.1. `costeComponents` usa `sustainedConsumption` **si y solo si** se cumplen
las tres condiciones a la vez: el coche es `PHEV`, el supuesto `cargaEnCasa`
está desactivado y el campo está declarado. En cualquier otro caso usa
`consumption`, exactamente como hoy.

2.2. El precio unitario no cambia: sigue rigiendo `product/0008`, y solo un
`EV` paga en kWh. Un enchufable en modo sostenido gasta combustible, así que
`precioLitro` es el precio correcto y ya era el que se aplicaba.

2.3. Los dos anclajes del eje y el reparto 50/50 entre precio y uso no se
tocan.

2.4. Ningún otro eje lee el campo nuevo, y ninguna otra nota se mueve.

2.5. **Con `cargaEnCasa` activado, un enchufable sigue puntuando con la cifra
homologada.** Es una limitación declarada, no un olvido: el ponderado también
supone un patrón de uso que puede no ser el de quien decide, y afinarlo es el
factor de utilización que queda fuera de alcance. Se anota como deuda en
`docs/roadmap.md`.

### 3. El desglose

3.1. El `AxisBreakdown` de `coste` declara en `info` **qué cifra de consumo
ha aplicado y por qué**, con tres textos posibles y excluyentes: la
sostenida, porque el coche es enchufable y no se carga en casa; la
homologada, porque se carga en casa; y la homologada, porque el coche es
enchufable pero no declara la sostenida. Es información del coche y de los
supuestos, no un supuesto global, así que va en `info` y no en
`assumptionsUsed`, igual que el precio unitario de la energía.

3.2. Cuando se aplica la cifra sostenida, el dato de entrada que el desglose
enseña bajo «Consumo» es **ese**, con su fuente y su marca de estimación, no
el homologado. La nota no puede calcularse con un número distinto del que se
muestra: es el requisito de trazabilidad de `product/0001`.

3.3. La descripción de fórmula del eje enuncia la regla del requisito 2.1, y
la página que explica los cálculos (`product/0011`) la hereda por renderizar
esa misma descripción, sin texto duplicado a mano.

### 4. En la ficha

4.1. Fila nueva en «Mecánica y prestaciones», **inmediatamente detrás de
«Consumo»** y delante de «Autonomía eléctrica», con etiqueta «Consumo sin
cargar», unidad de respaldo `l/100km` y un decimal, como el consumo.

4.2. `sustainedConsumption` entra en `FICHA_FIELDS`, y con ello gana Δ,
orden por su columna (`product/0027`) y disponibilidad como criterio
eliminatorio (`product/0031`) sin código propio en ninguno de los tres.

4.3. Su polaridad es `moreIsWorse`: son litros a los 100 km, la misma
dirección afirmable que el consumo. `product/0031` solo admitirá el operador
`max` sobre esta magnitud.

4.4. Un coche que no lo declara —cualquiera que no sea `PHEV`, y un `PHEV`
sin fuente— muestra la celda vacía y su Δ sale `'unavailable'`, como
cualquier magnitud opcional ausente. **No cuenta como incumplimiento** de una
regla eliminatoria por omisión.

### 5. El alta del dato

5.1. Se declara para los dos registros `PHEV` del catálogo —
`hyundai-tucson-phev`, publicado, y `bmw-x1-xdrive25e`, despublicado— con
fuente fechada, con versión y con enlace, y con la definición del requisito
1.4.

5.2. Lo que no se encuentre publicado se deja ausente y se anota como deuda
en `docs/roadmap.md`, con el formato que ya usan los tres coches sin diámetro
de giro.

5.3. La skill `add-model` pasa a pedir la magnitud cuando el coche es `PHEV`,
con la definición del requisito 1.4 y la prohibición del 1.2 escritas en su
guía, y actualiza su recuento de magnitudes.

### 6. El movimiento de las notas

6.1. `scoreCatalog.snapshot.test.ts` se actualiza **a propósito**, como ya
hicieron `product/0017` y `product/0026`: con `cargaEnCasa` desactivado por
defecto, el `PHEV` que declare el dato baja. Que el test falle antes de
actualizarlo es la señal esperada, no una regresión.

6.2. **Ningún registro que no sea `PHEV` cambia de nota**, y se comprueba uno
a uno, no en bloque: esta spec no toca ninguna escala.

6.3. La verificación declara el movimiento medido —puesto y porcentaje antes
y después— con la cifra real que se haya encontrado, no con las tres de
sensibilidad del *Contexto*.

## Criterios de aceptación

> Obligatorios y verificables.

- [ ] `CarSchema` acepta `sustainedConsumption` opcional en un `PHEV` y lo
      valida como `SourcedNumber`; un registro con dos fuentes vigentes, o
      con una descartada sin motivo, sigue fallando al cargar nombrando el
      campo y el registro.
- [ ] Un `EV`, un `HEV`, un `MHEV` y un `ICE` que declaran el campo fallan al
      cargar, con un error que nombra el campo y la tecnología; los mismos
      cuatro sin el campo cargan sin error.
- [ ] Con `cargaEnCasa` desactivado, el coste de uso de un `PHEV` que declara
      la cifra sostenida se calcula con ella; con `cargaEnCasa` activado, con
      la homologada; un `PHEV` sin la cifra usa la homologada en los dos
      casos; y un coche que no es `PHEV` usa la homologada siempre.
- [ ] El desglose de `coste` muestra en `info` cuál de los tres casos del
      requisito 3.1 se ha aplicado, y el dato de entrada que enseña coincide
      con el que ha entrado en el cálculo.
- [ ] `FICHA_FIELDS` incluye `sustainedConsumption` y `polarityOf` devuelve
      `'moreIsWorse'`; una regla eliminatoria sobre la magnitud solo admite
      `max`.
- [ ] La ficha completa muestra «Consumo sin cargar» en «Mecánica y
      prestaciones», inmediatamente después de «Consumo».
- [ ] Todo `sustainedConsumption` presente en `cars.json` lleva fuente con
      enlace y versión, y ninguno está marcado `estimated: true`.
- [ ] El *snapshot* de puntuación se mueve solo en los registros `PHEV` que
      declaran la cifra, y ningún otro total cambia.
- [ ] La skill `add-model` pide la magnitud para un `PHEV`, con la definición
      del requisito 1.4.
- [ ] Los registros `PHEV` que se queden sin el dato, y la limitación del
      requisito 2.5, están anotados en `docs/roadmap.md`.
- [ ] La CI entera pasa en local: `format:check`, `lint`, `typecheck`,
      `arch:check`, `test:coverage` con el suelo de cobertura vigente,
      `markdownlint` y `build`.

## Dependencias y supuestos

- **No depende de que el dato exista.** Si la fuente no publicara el modo
  sostenido para ninguna de las dos versiones, la spec se implementa igual
  —el mecanismo, la ficha y el desglose— y ninguna nota se mueve hasta que el
  dato aparezca. Es la diferencia entre un modelo que no sabe preguntar y uno
  que pregunta y todavía no tiene respuesta.
- **Es independiente de `product/0039`**, redactada el mismo día: las dos
  añaden un campo a `FICHA_FIELDS`, así que la que llegue segunda ajusta el
  recuento en su verificación. Ninguna necesita a la otra.
- **No añade ningún supuesto global** ni cambia `AppConfig`: `cargaEnCasa` ya
  existe, ya se edita en el panel de supuestos y ya viaja en el enlace
  compartible.
- **Supone que un consumo en modo sostenido no cambia entre acabados** de una
  misma motorización. Donde la fuente publique dos, se declara el de la
  versión que el catálogo compara
  (`docs/proceso/calibracion-de-escalas.md` §6).

## Decisiones abiertas

Ninguna.
