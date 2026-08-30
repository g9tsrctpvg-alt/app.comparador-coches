# 0030 — El estado de decisión de cada coche

- **Id:** product/0030
- **Estado:** draft
- **Tipo:** product
- **Fecha:** 2026-08-30
- **Specs relacionadas:** product/0012, product/0014, product/0015,
  product/0018, product/0022, product/0024, product/0025, product/0029,
  technical/0010
- **ADRs relacionados:** 0004
- **Doc de estado:** `docs/estado/dominio.md`, `docs/estado/interfaz.md`

## Contexto

La aplicación puntúa, ordena y —desde `product/0029`— explica por qué un
coche le gana a otro. Lo que no hace es acompañar la decisión: **elegir es
descartar**, y el descarte no se registra en ninguna parte.

Lo único parecido a una decisión que existe hoy es `published`
(`product/0015`): un booleano en `src/data/cars.json` que un agente cambia
por *skill* y que se comitea al repositorio. Saca al coche de todas las
vistas conservando sus datos, y eso está bien para lo que es —una decisión
de catálogo—, pero no sirve para decidir:

- Es todo o nada. No distingue «sigue en juego» de «me da igual».
- No guarda **por qué**. Dos semanas después, un coche fuera de la lista es
  indistinguible de un coche que nunca estuvo.
- No guarda **cuándo**. Un descarte por precio de julio y uno por maletero
  pesan distinto cuando el precio cambia y el maletero no.
- No se hace desde el navegador: hay que pedírselo a un agente y esperar un
  commit.

El resultado es que el estado de la decisión vive en la cabeza de quien
decide. A la segunda o tercera sesión, la clasificación se ve igual que el
primer día: quince coches en fila, sin rastro de cuáles siguen en juego.

Las valoraciones subjetivas que sí se pueden editar hoy —las dos de estética
(`product/0001`)— entran en la nota. Aquí hace falta lo contrario: una
anotación que **no** toque la nota.

## Objetivo

Que la aplicación registre, por coche y desde la interfaz, en qué punto de la
decisión está cada candidato —sin decidir, lista corta, descartado—, con su
motivo y su fecha, y que ese registro sirva para filtrar la clasificación y
la ficha sin tocar la puntuación.

## Alcance

- Un estado de decisión por coche, de un conjunto cerrado de tres valores,
  con motivo en texto libre y fecha.
- Un tercer objeto persistido, con clave y versión propias, hermano de
  `AppConfig` (`product/0012`) y de `ViewState` (`product/0024`).
- La marca del estado en la clasificación y en la cabecera de columna de la
  ficha; el motivo y la fecha en la fila desplegada.
- La edición del estado y del motivo desde las dos vistas: la fila desplegada
  de la clasificación y la cabecera de columna de la ficha.
- Una acción propia para borrar el registro entero, separada de
  «Restablecer».
- Un filtro de tres posiciones sobre el estado, aplicado a la clasificación y
  a la ficha a la vez.
- La degradación de lo guardado —entrada a entrada— y su registro.

## Fuera de alcance

- **Cambiar la nota.** El estado de decisión no entra en ninguna fórmula, ni
  como peso, ni como bonificación, ni como desempate. Un descartado se
  puntúa exactamente igual que antes de descartarlo.
- **Tocar `published`.** Sigue siendo lo que es: decisión de catálogo, en el
  repositorio, por *skill*. Esta spec no lo lee, no lo escribe y no lo
  sustituye.
- **Criterios eliminatorios** (P4 del roadmap): «descartado» aquí es una
  decisión que alguien toma y escribe, no una regla que la aplicación aplica
  sola a partir de una magnitud.
- **El registro de la prueba real y la checklist de concesionario** (P6 y P7):
  esta spec da el estado, no las notas de haberse sentado dentro.
- **Compartir o exportar las decisiones.** No viajan en el enlace y no hay
  fichero de salida; el motivo está en el requisito 3.4.
- **Historial.** Se guarda la decisión vigente, no la secuencia de las
  anteriores. Cambiar de opinión sobrescribe.
- **Decidir sobre referencias.** El estado es de los coches candidatos; una
  referencia (`references.json`, hoy el Alfa Romeo Giulietta) es el patrón
  contra el que se compara, no algo que se elija.

## Requisitos / comportamiento esperado

### 1. El estado

1.1. Cada coche del catálogo tiene **exactamente un** estado de decisión, de
un conjunto cerrado de tres: `undecided`, `shortlist` y `discarded`. Sus
rótulos en la interfaz son «Sin decidir», «Lista corta» y «Descartado».

1.2. Los identificadores van **en inglés**, como manda `CLAUDE.md` §2 para
todo identificador nuevo. Los ejes (`viaje`, `diario`…) y los conjuntos de
campos (`esenciales`) están en español por herencia del artefacto de
referencia; eso no se propaga a vocabulario nuevo.

1.3. `undecided` es el valor por defecto **y no se guarda**: un coche sin
entrada en el registro está sin decidir. Así, añadir un coche al catálogo no
obliga a migrar nada, y el registro solo pesa lo que se ha decidido de
verdad.

1.4. Los tres valores **no son una escala**. No hay orden entre ellos, no se
promedian y no se suman. `shortlist` y `discarded` son dos casillas
distintas, no dos puntos de un mismo eje, y `undecided` es la ausencia de
casilla, no el punto medio.

1.5. **No hay un estado intermedio de «candidato».** Un coche o está en la
lista corta, o está descartado, o todavía no se ha decidido nada sobre él.
Se anota porque la propuesta P3 del roadmap lo mencionaba y se ha dejado
fuera a propósito: distinguir «lo he mirado y me vale» de «no lo he mirado»
añadía una casilla que hay que mantener a cambio de un matiz que quien
decide ya lleva en la cabeza.

### 2. Motivo y fecha

2.1. Una decisión registra tres cosas: el estado, el **motivo** (texto libre)
y la **fecha** (`AAAA-MM-DD`) en que se fijó ese estado.

2.2. La fecha la aporta **quien llama**, no el dominio: `src/domain/` no lee
el reloj, con el mismo criterio con que `defaultViewState` recibe
`defaultComparisonId` desde fuera en vez de leer `references.json`. Así el
dominio sigue siendo puro y la fecha es comprobable en un test sin congelar
el reloj global.

2.3. La fecha se mueve **cuando cambia el estado**, no cuando se corrige la
redacción del motivo. Lo que interesa recordar es cuándo se decidió, no
cuándo se arregló una errata.

2.4. El motivo es **opcional en los tres estados**, descarte incluido.
Descartar es un clic y no pide nada más. Se asume a cambio que habrá
descartes sin explicación: el registro sirve igual para saber **qué** se
decidió y **cuándo**, y quien quiera dejar escrito el porqué tiene el campo
ahí mismo sin que nadie se lo exija.

2.5. Volver un coche a `undecided` **borra su entrada entera**, motivo y
fecha incluidos. No se conserva un motivo huérfano de un estado que ya no
está.

### 3. Persistencia

3.1. Las decisiones viven en un **tercer objeto persistido**, con clave de
almacenamiento propia (`comparador-coches:decisions`) y número de versión
propio (`DECISION_LOG_VERSION`), independiente de `CONFIG_VERSION` y de
`VIEW_STATE_VERSION`. Mismo precedente que `ViewState` en `product/0024`, y
por una razón más fuerte: es el único de los tres que contiene **texto
escrito por el usuario**. Que una subida de versión de los pesos se lleve por
delante los motivos que alguien tecleó sería un mal reparto.

3.2. Se lee y se escribe por el mismo puerto que las otras dos claves
(`src/adapters/localStorageConfigPort.ts`), que sigue siendo el único módulo
que toca `window.localStorage`. `src/domain/` no lo importa —lo comprueba la
regla `domain-no-storage-adapter`—.

3.3. **Degradación por partes, entrada a entrada**, con el mismo criterio que
`restoreOverrides` en `restoreConfig`: una entrada inválida se descarta sola
y se registra, sin llevarse las demás; un coche que ya no está en el catálogo
descarta su entrada; una versión desconocida o un JSON corrupto descartan el
objeto entero. Un campo ausente no es un descarte y no se registra.

3.4. **No viaja en el enlace compartible.** El enlace de `product/0012`
reproduce la configuración —cómo se puntúa—, no las anotaciones de quien
comparte. Además, los motivos son texto libre de longitud arbitraria y no
caben en una URL sin volverla ilegible, que es justo lo contrario de lo que
`product/0012` buscaba con sus nombres cortos de parámetro.

3.5. **«Restablecer» no toca las decisiones.** Sigue limpiando `AppConfig` y
`ViewState` —pesos, supuestos, presupuesto, filtro de presupuesto,
valoraciones y las cinco elecciones de la ficha—, y deja el registro de
decisiones intacto. Esto **enmienda a propósito** la promesa de
`product/0024`, que decía que ese botón deja la aplicación «como una primera
visita»: pesos y elecciones de vista se vuelven a poner en un minuto, y un
motivo escrito a mano no. El botón pasa a significar lo que su rótulo dice,
restablecer la configuración, y su texto de ayuda lo aclara.

3.6. **Borrar las decisiones es una acción propia**, «Borrar decisiones»,
junto a «Restablecer» en el mismo bloque de acciones. Es destructiva, así que
pide confirmación diciendo cuántas decisiones se van a perder, y **solo
aparece cuando hay al menos una registrada**: sin nada que borrar no hay
botón que estorbe.

### 4. El filtro

4.1. La clasificación gana un control de **tres posiciones**: «Todos» (por
defecto), «Sin descartados» y «Solo lista corta».

4.2. El filtro se guarda **junto a las decisiones**, no en `AppConfig`.
Parece que su sitio natural sería al lado de `hideOverBudget` —es otro filtro
de la misma lista—, pero ahí viajaría en el enlace mientras que las
decisiones no (3.4): quien abriera un enlace con «Solo lista corta» vería una
lista vacía sin ninguna manera de entender por qué. Un filtro viaja con lo
que filtra o no viaja.

4.3. El filtro se aplica **a la clasificación y a la ficha**. La ficha es
donde de verdad paga: comparar tres columnas en vez de quince es la mitad del
valor de tener una lista corta.

4.4. El filtro **nunca esconde el modelo elegido como comparación** en la
ficha (`comparisonId`, `product/0024`), sea cual sea su estado de decisión.
Si lo escondiera, la ficha se quedaría sin el patrón contra el que resta.

4.5. El filtro **se combina** con «Ocultar fuera de presupuesto»: son
independientes y se aplican los dos.

4.6. Si el filtro deja la lista visible **vacía**, la clasificación lo dice
con un mensaje que nombra el filtro activo y ofrece volver a «Todos». No se
cae, no muestra una lista en blanco y no se confunde con el mensaje de
catálogo no cargado, que es otra cosa.

### 5. Dónde se ve

5.1. En la fila de la clasificación, una **marca** junto al nombre para todo
estado que no sea `undecided`. Un coche sin decidir no lleva marca: el ruido
visual se reserva a lo que sí se ha decidido, que es lo que se busca de un
vistazo.

5.2. En la **fila desplegada**, el estado, el motivo y la fecha en texto
corrido, por delante del resumen del duelo de `product/0029`: «Descartado el
30/08/2026 — el maletero se queda corto para lo que cuesta». Sin motivo
escrito, la línea es solo el estado y la fecha.

5.3. En la **cabecera de columna de la ficha**, la misma marca que en 5.1.

5.4. La marca **no codifica el estado solo con color**: lleva su rótulo de
texto. Es la misma regla con la que `technical/0011` pinta los ejes, y aquí
manda más todavía por la deuda de paleta ya anotada en el roadmap: los seis
colores de eje no pasan el contraste par a par en visión con deficiencia de
color, así que ningún significado nuevo se cuelga solo del tono.

### 6. Dónde se edita

6.1. Desde la **fila desplegada de la clasificación**: un control con los
tres estados y un campo de motivo, en línea.

6.2. Desde la **cabecera de columna de la ficha**: la marca de 5.3 es además
un control que abre un **diálogo** con los tres estados y el campo de motivo,
sobre el modelo de esa columna. Es donde de verdad se decide —comparando en
paralelo—, y no toca la barra de la ficha: los cuatro controles que
`technical/0010` igualó gobiernan la vista entera, y este es de una columna.

6.3. Es un diálogo y no un control en línea porque una columna de la ficha es
estrecha por diseño —una por modelo— y no hay sitio para un campo de texto.
La ficha ya tiene ese patrón desde `product/0014` y `product/0025`, así que
no se inventa un mecanismo nuevo.

6.4. Las dos superficies editan **el mismo registro**: fijar un estado en la
ficha se ve en la clasificación al volver, sin recargar, y al revés.

### 7. Registro

7.1. Los descartes de restauración se registran con `logError`, siguiendo
`docs/proceso/logging.md`: `decision_log_discarded` con su motivo para el
objeto entero, y `decision_entry_discarded` con `car.id` y el motivo para una
entrada suelta. Ningún motivo escrito por el usuario entra nunca en un
registro.

## Criterios de aceptación

> Obligatorios y verificables.

- [ ] Un test comprueba que el conjunto de estados es cerrado y de tres
      valores, y que un coche sin entrada en el registro se lee como
      `undecided`.
- [ ] Un test comprueba que fijar un estado guarda la fecha que se le pasa
      desde fuera, y que corregir solo el motivo **no** la mueve.
- [ ] Un test comprueba que los tres estados se aceptan **con motivo y sin
      motivo**, descarte incluido.
- [ ] Un test comprueba que volver a `undecided` deja el registro sin entrada
      para ese coche.
- [ ] Un test comprueba que la puntuación de un coche es **idéntica** antes y
      después de descartarlo, para todos los coches publicados del catálogo
      real y con los pesos y supuestos por defecto.
- [ ] Un test comprueba la degradación por partes: una entrada con estado
      desconocido se descarta sola y las demás sobreviven; un `car.id` que no
      está en el catálogo descarta su entrada; una versión desconocida
      descarta el objeto entero; un campo ausente no genera registro.
- [ ] Un test comprueba que restaurar un registro descartado emite
      `decision_log_discarded` o `decision_entry_discarded` según el caso, y
      que **el motivo escrito por el usuario no aparece** en ningún atributo
      registrado.
- [ ] Un test comprueba las tres posiciones del filtro sobre una lista
      conocida: «Todos» las devuelve todas, «Sin descartados» quita solo los
      `discarded` y «Solo lista corta» deja solo los `shortlist`.
- [ ] Un test comprueba que el filtro y «Ocultar fuera de presupuesto» se
      aplican a la vez, y que el modelo elegido como comparación sobrevive al
      filtro en la ficha aunque su estado lo excluyera.
- [ ] Un test comprueba que, con la lista visible vacía por el filtro, la
      clasificación renderiza su mensaje y no la lista.
- [ ] Un test comprueba que la fila del ranking lleva marca para los dos
      estados decididos y **no** la lleva para `undecided`, y que la marca
      incluye su rótulo de texto y no solo una clase de color.
- [ ] Un test comprueba que la fila desplegada muestra estado, motivo y fecha
      por delante del resumen de `product/0029`, y que sin motivo escrito
      muestra solo estado y fecha.
- [ ] Un test comprueba que la cabecera de columna de la ficha lleva la marca
      y que su control abre el diálogo de decisión para ese modelo.
- [ ] Un test comprueba que «Restablecer» deja el registro de decisiones
      **intacto**, que «Borrar decisiones» lo vacía, y que ese botón no se
      renderiza cuando no hay ninguna decisión registrada.
- [ ] Verificación manual sobre el *build* de producción: fijar los tres
      estados desde la clasificación **y desde la ficha**, recargar y
      comprobar que sobreviven; comprobar que el enlace compartible **no** los
      lleva; comprobar que «Restablecer» no los borra y que «Borrar
      decisiones» pide confirmación antes de hacerlo.
- [ ] La secuencia de CI pasa entera en local
      (`docs/proceso/ci-y-guardarrailes.md`, §4), con cobertura al 100 % en
      `src/domain/`, `src/data/` y `src/logging/`.

## Dependencias y supuestos

- **No depende de ninguna spec sin implementar.** Se apoya en piezas ya
  consolidadas: el puerto de almacenamiento y la restauración tolerante de
  `product/0012`, el precedente de segunda clave de `product/0024`, la fila
  desplegable de `product/0022` y `product/0029`, la cabecera de columna de
  `product/0018` y el patrón de diálogo de `product/0014` y `product/0025`.
- **Enmienda `product/0024`** en un punto y solo en uno: qué significa
  «Restablecer» (requisito 3.5). No la edita —está `consolidated`—, con el
  mismo precedente con que `product/0016` amplió a `product/0014`.
- **Supone que decidir es de una sola persona en un solo navegador.** No hay
  cuentas ni sincronización entre dispositivos —eso sigue aplazado con su
  disparador en el roadmap—, así que las decisiones son locales a donde se
  tomaron.
- **Supone que el catálogo cambia poco.** Si un coche desaparece del
  catálogo, su decisión se pierde sin aviso; con quince candidatos estables y
  altas por *skill*, es un caso raro y no merece un mecanismo de rescate.
- **El ADR 0004 sigue mandando**: la nota de un coche no depende de qué otros
  coches haya ni de qué se haya decidido sobre ellos. El requisito 4 filtra
  qué se ve, nunca qué se calcula — por eso el filtro se aplica **después**
  de puntuar y el quinto criterio de aceptación lo fija por escrito.

## Decisiones abiertas

Ninguna. Las cuatro que el borrador dejó abiertas las cerró el usuario el
2026-08-30, las cuatro en contra de la recomendación que la spec traía:

1. **El motivo es opcional al descartar**, no obligatorio (requisito 2.4).
2. **Se edita también desde la ficha**, no solo desde la clasificación
   (requisitos 6.2 y 6.3).
3. **«Restablecer» no borra las decisiones**; se separa en una acción propia
   (requisitos 3.5 y 3.6).
4. **Tres estados, no cuatro**: «Candidato» se queda fuera (requisito 1.5).
