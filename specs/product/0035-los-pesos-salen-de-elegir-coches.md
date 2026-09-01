# 0035 — Los pesos salen de elegir coches, no de mover deslizadores

- **Id:** product/0035
- **Estado:** draft
- **Tipo:** product
- **Fecha:** 2026-09-01
- **Specs relacionadas:** product/0009, product/0012, product/0018,
  product/0023, product/0029, product/0030, product/0031, product/0033,
  technical/0010, technical/0011
- **ADRs relacionados:** 0004, 0011
- **Doc de estado:** `docs/estado/dominio.md`, `docs/estado/interfaz.md`

## Contexto

Los siete pesos son **el control que más manda en la nota** y el único que se
fija a ojo. `WeightSliders` (`src/ui/components/WeightSliders.tsx`) ofrece
siete deslizadores de 0 a 10 con paso 1, `product/0012` los persiste y los
comparte por enlace, y `DEFAULT_WEIGHTS` —`carga 5 · habitabilidad 5 ·
diario 7 · prestaciones 5 · fiabilidad 7 · estética 6 · coste 5`— es solo un
punto de partida que `product/0033` fijó por equivalencia aritmética, no por
preferencia de nadie.

El problema es que **nadie sabe contestar a la pregunta que el deslizador
hace**. «¿Cuánto vale la habitabilidad, un 4 o un 5?» no es una pregunta que
tenga respuesta introspectiva: la habitabilidad no se valora en abstracto,
se valora frente a algo que se pierde a cambio. Y las consecuencias de
elegir mal no se ven, porque el espacio de configuraciones es enorme y opaco.

Medido el 2026-09-01 sobre los dieciocho coches publicados de
`src/data/cars.json`, con `DEFAULT_ASSUMPTIONS` y el presupuesto por defecto:

- Recorriendo **78.124 combinaciones enteras de pesos** —cada eje en
  `{0, 2, 5, 8, 10}`, descartada la combinación nula—, **trece de los
  dieciocho coches llegan a ser líderes** con alguna de ellas. Solo cinco no
  lideran con ninguna: Kona Eléctrico, Corolla Cross, ID.4, X-Trail e-Power
  y ZR-V e:HEV.
- **Ninguno de los 153 enfrentamientos posibles está decidido de antemano**:
  0 de 153. Para cada par de coches existe una combinación de pesos que
  invierte su orden. Lo que se ve en pantalla no es «la» clasificación: es
  una de muchas, elegida por siete números que nadie ha calibrado.
- Enfrentando los pesos por defecto a sesenta perfiles de preferencia
  sintéticos, reproducen el **81,2 %** de los 153 enfrentamientos de cada
  perfil y aciertan su líder el **33,3 %** de las veces. Es el suelo del que
  se parte: mejor que el azar, y lejos de decir lo que cada uno quiere.

`product/0029` ya atacó media pregunta. Su bloque «Detalle ejes» explica una
diferencia de nota repartiéndola entre los siete ejes, y
`crossingsInRange`/`stableAxes` dicen en qué valor de un peso se da la vuelta
un par concreto. Pero eso responde «¿qué pasaría si moviera este peso?»,
nunca «¿qué peso te corresponde?». Sigue haciendo falta mover el deslizador
primero.

Hay una propiedad del modelo que hace posible la otra dirección, y viene del
ADR 0004: desde que los siete ejes puntúan contra escalas absolutas, **la
nota de un eje no depende de los pesos ni del resto de candidatos**. Se ha
comprobado, no supuesto: puntuando el catálogo con dos vectores de pesos
deliberadamente opuestos, la diferencia máxima entre las notas de eje
resultantes es **exactamente 0**. El peso solo multiplica. Por tanto «este
coche me gusta más que ese» **es exactamente una desigualdad lineal sobre los
siete pesos**, `Σ pesoᵢ × (notaᵢ(A) − notaᵢ(B)) > 0`, y una tanda de
elecciones es un sistema de desigualdades que se puede resolver por
enumeración, sin optimizador, sin dependencias nuevas y sin aproximar nada.

## Objetivo

Que los siete pesos se puedan **deducir de una tanda de elecciones entre dos
coches** —«¿cuál prefieres?»—, que la aplicación diga con honestidad qué han
fijado esas respuestas y qué no, y que los deslizadores queden como lo que
deben ser: el ajuste fino de un punto de partida ya calibrado.

## Alcance

- **El perfil de un coche**: sus siete notas de eje, que el ADR 0004 hace
  independientes de los pesos, extraídas de `scoreCatalog` en el dominio.
- **La rejilla declarada de combinaciones** de pesos sobre la que se razona,
  y el **conjunto compatible**: las combinaciones que no contradicen ninguna
  respuesta dada.
- **Los pesos propuestos**: un representante del conjunto compatible,
  elegido por una regla determinista y expresable en los deslizadores.
- **La siguiente pregunta**: qué par se ofrece en cada paso y cuándo se deja
  de preguntar, por un criterio exacto y no por una cuota fija.
- **La tanda en la interfaz** (`#/`): un diálogo abierto desde el panel de
  pesos, con la elección, el avance y el resultado.
- **La honestidad del resultado**: cuántos coches pueden todavía ser
  primeros y cuántos enfrentamientos han quedado decididos.
- **Aplicar o descartar** los pesos propuestos, sin tocar los deslizadores
  hasta que se aplican.

## Fuera de alcance

- **Cómo se puntúa.** Ni un anclaje, ni una curva, ni una fórmula de eje, ni
  el reparto interno de ningún eje. Esta spec **lee** las notas de eje que
  `scoreCatalog` ya produce; no reabre ni el ADR 0004 ni el ADR 0010.
- **Los pesos por defecto.** `DEFAULT_WEIGHTS` no cambia: sigue siendo el
  punto de partida de una primera visita y el ancla de `product/0033`. Lo
  que esta spec añade es una forma de salir de él, no otro sitio de partida.
- **Los deslizadores.** `WeightSliders` conserva sus siete controles, su
  recorrido `0-10`, su paso 1 y su comportamiento en vivo. No se ocultan, no
  se bloquean y no cambian de sitio.
- **Que la tanda sobreviva a una recarga.** La tanda vive en memoria: al
  cerrar el diálogo sin aplicar, o al recargar la página, las respuestas se
  pierden. No se añade ninguna clave de almacenamiento ni sube
  `CONFIG_VERSION`: lo único que persiste sigue siendo el resultado, y solo
  cuando se aplica, por el camino que `product/0012` ya tiene. Se aplaza con
  disparador: que alguien abandone una tanda a medias y se queje de haberla
  perdido.
- **Los supuestos globales, el presupuesto y las reglas eliminatorias.** Una
  elección solo mueve pesos. Ni `AssumptionsPanel` ni
  `EliminatoryRulesPanel` aprenden nada de la tanda, aunque la respuesta
  «prefiero el barato» sea, en parte, una afirmación sobre el presupuesto.
- **Las valoraciones de estética.** Siguen editándose donde se editan; la
  tanda no las deduce ni las propone, aunque `estetica` sea uno de los siete
  pesos que sí deduce.
- **El estado de decisión** (`product/0030`). Preferir un coche en una
  elección **no** lo pone en la lista corta, y rechazarlo no lo descarta:
  son registros distintos, uno sobre el modelo de puntuación y otro sobre la
  decisión de compra.
- **La palabra «duelo»**, que en esta aplicación ya nombra otra cosa: la
  vista de la ficha en móvil que compara de uno en uno (`product/0023`,
  `.duelView`, `.duelChip`, `.duelCard`), tal y como `product/0029` dejó
  anotado. Aquí cada pregunta es un **cara a cara** y el conjunto, una
  **tanda**; en código, `matchup`.
- **Comparar perfiles de dos personas.** Es la propuesta P8 del roadmap,
  descartada por decisión del usuario el 2026-08-29, y esta spec no la
  reabre: una tanda calibra los pesos de quien la contesta, y son los únicos
  que hay.
- **Aprender de nada que no sea una elección explícita.** Ni de qué fichas
  se abren, ni de cuánto se mira una foto, ni del orden en que se navega.

## Requisitos / comportamiento esperado

### 1. El perfil de un coche

1.1. El **perfil** de un coche son sus siete notas de eje, en el orden de
`AXIS_ORDER`, tal como `scoreCatalog` las deja en
`CarScoreBreakdown.axes[].score`.

1.2. El perfil **no depende de los pesos** con que se haya puntuado, por el
ADR 0004. Es la propiedad que sostiene toda la spec, así que se comprueba en
un test y no se da por buena: dos vectores de pesos distintos producen
perfiles idénticos, con diferencia exactamente 0.

### 2. Qué es una respuesta

2.1. Un **cara a cara** es un par ordenado de coches del catálogo activo. Una
**respuesta** dice cuál de los dos se prefiere.

2.2. Una respuesta «prefiero A» equivale exactamente a la desigualdad
`Σ pesoᵢ × (perfilᵢ(A) − perfilᵢ(B)) > 0`. La igualdad estricta cuenta como
**contradicha**: un empate no confirma una preferencia.

2.3. «Me da igual» **no es una respuesta**: no aporta ninguna desigualdad. El
par queda marcado como visto y no se vuelve a ofrecer en esa tanda. No se
modela como igualdad, porque `Σ pesoᵢ × Δᵢ = 0` casi nunca tiene solución en
la rejilla y convertiría una indiferencia sincera en una contradicción.

### 3. La rejilla declarada

3.1. Se razona sobre una rejilla finita y declarada: cada uno de los siete
pesos toma valor en **`{0, 2, 5, 8, 10}`**, lo que da `5⁷ = 78.125`
combinaciones, menos la combinación nula —que no define ninguna
clasificación— = **78.124**.

3.2. Los cinco niveles son un compromiso medido, no una intuición: cubren el
recorrido entero del deslizador con sus dos extremos y su centro, y una
rejilla más fina de siete niveles (823.542 combinaciones) apenas mejora el
resultado —a igualdad de veinte preguntas, 98,2 % contra 97,0 % de acuerdo—
a cambio de multiplicar por diez el trabajo.

3.3. Todos los valores de la rejilla son enteros de 0 a 10, así que
**cualquier resultado es representable en los deslizadores** tal como están.
Nada de lo que la tanda proponga necesita un control nuevo ni un paso más
fino.

3.4. La rejilla se recorre siempre en el mismo orden, derivado de
`AXIS_ORDER` y del orden de los niveles. No hay muestreo aleatorio ni
semilla en ninguna parte: dos ejecuciones con las mismas respuestas dan el
mismo resultado, bit a bit.

### 4. El conjunto compatible

4.1. El **conjunto compatible** son las combinaciones de la rejilla que
contradicen **el menor número posible** de respuestas dadas.

4.2. Con respuestas coherentes ese mínimo es 0 y el conjunto son las
combinaciones que las satisfacen todas. Con respuestas contradictorias entre
sí el mínimo es mayor que 0, y el conjunto sigue estando definido y no vacío:
la tanda **nunca se rompe** por una respuesta arrepentida.

4.3. Sin ninguna respuesta, el conjunto compatible es la rejilla entera.

### 5. Los pesos propuestos

5.1. Los **pesos propuestos** son un elemento del conjunto compatible,
elegido por este orden lexicográfico:

1. menor número de respuestas contradichas —lo garantiza ya la pertenencia
   al conjunto—;
2. **mayor margen mínimo**: se maximiza la menor de las diferencias de nota,
   en puntos porcentuales, con que la combinación gana los cara a cara
   respondidos. Entre todas las explicaciones válidas se prefiere la que
   gana con más holgura, que es la que menos depende de un dato al filo;
3. **menor distancia** a los pesos que hoy tienen los deslizadores, sumando
   diferencia absoluta eje a eje. A igualdad de todo lo demás, la tanda
   mueve lo menos posible lo que ya había;
4. el primero en el orden de recorrido de la rejilla.

5.2. La diferencia de nota se mide en la misma unidad que ya usa la pantalla
—puntos porcentuales del máximo alcanzable, `percentageOf`—, que es
invariante de escala: multiplicar los siete pesos por dos no cambia ni la
clasificación ni el margen. El criterio 3 es lo que fija la escala y hace que
el resultado no baile de un paso al siguiente.

5.3. Los pesos propuestos **reproducen todas las respuestas coherentes**: si
existe alguna combinación de la rejilla que las satisface todas, la propuesta
es una de ellas.

### 6. La siguiente pregunta

6.1. El **comité** es el conjunto compatible cuando tiene 1.500 elementos o
menos, y si no, los que resultan de recorrerlo a paso fijo hasta quedarse en
1.500 o menos. El recorte es determinista y solo existe por coste: sin él,
la primera pregunta obliga a mirar 78.124 combinaciones por cada uno de los
153 pares.

6.2. El **primer cara a cara** de la tanda es el par de coches cuyos perfiles
están más lejos entre sí, en distancia euclídea sobre los siete ejes. Es
fijo, no depende de nada y con el catálogo de hoy es **EV3 contra Compass**.

6.3. Cada cara a cara siguiente es el par no visto que **más divide al
comité**: aquel en que la proporción de combinaciones que dan ganador al
primero está más cerca de la mitad. Se pregunta lo que no se sabe, no lo que
ya está decidido. Empates a favor del par de perfiles más separados.

6.4. **La tanda termina cuando ningún par sin ver divide al comité**: todas
las combinaciones que siguen en pie ordenan igual todos los pares
restantes, así que ninguna respuesta más aportaría nada. No hay cuota fija de
preguntas.

6.5. Elegir así **no es un adorno**. Medido sobre sesenta perfiles
sintéticos, con la misma regla de parada: preguntando por el par que más
divide al comité, la tanda se cierra en **14 a 18 preguntas (mediana 17)**;
ofreciendo pares en orden aleatorio, la mediana sube a **27** y llega al
tope de 40. Además acierta más: 81,7 % de líderes contra 66,7 %.

6.6. Hay un tope duro de **25 preguntas** por tanda, por si un catálogo
futuro no llegase a agotar el criterio 6.4. Con el catálogo de hoy no se
alcanza nunca —el máximo medido es 18—, y llegar a él no es un error: la
tanda termina como cualquier otra.

### 7. Qué enseña cada cara a cara

7.1. Los dos coches se enseñan **en dos columnas, con su foto de cabecera y
las magnitudes de la ficha en el orden y los bloques de la ficha**
(`product/0018`, `product/0020`), incluida la Δ entre los dos.

7.2. **Ninguna cifra que salga del modelo aparece en la pregunta**: ni la
nota, ni el porcentaje, ni una nota de eje, ni el desglose de
`product/0029`, ni el puesto en la clasificación, ni la marca de estado de
decisión. Se pregunta qué coche se prefiere, no qué coche prefiere la
aplicación; enseñar la nota convertiría la respuesta en un eco.

7.3. Sí se enseña todo lo que es dato del coche: fotos, magnitudes, fuentes,
marca de estimado y tecnología. No se recorta la lista a las magnitudes en
que los dos coches más difieren, porque elegir qué enseñar sería elegir por
quien contesta.

### 8. Las respuestas y el deshacer

8.1. Cada cara a cara ofrece exactamente tres salidas: **preferir el de la
izquierda**, **preferir el de la derecha** y **«me da igual»**.

8.2. **Deshacer** retira la última respuesta y vuelve a ese cara a cara. El
conjunto compatible, los pesos propuestos y el avance se recalculan como si
nunca se hubiera contestado. Un clic equivocado se corrige; no hace falta
empezar de cero.

8.3. La tanda se puede **cerrar en cualquier momento**, con las respuestas
que lleve. Cerrar sin aplicar no cambia ningún peso.

### 9. El avance

9.1. Mientras la tanda está abierta se muestran dos cifras, las dos
recalculadas tras cada respuesta:

- **cuántos coches pueden todavía ser el primero** —cuántos líderes
  distintos producen las combinaciones del comité—, sobre el total de coches
  activos;
- **cuántos de los enfrentamientos posibles han quedado decididos** —los
  pares que todas las combinaciones del comité ordenan igual—, sobre el
  total.

9.2. Son la medida honesta del avance porque miden **lo que cambia en la
clasificación**, no lo estrecho que ha quedado un peso. Con el catálogo de
hoy se parte de **trece coches capaces de liderar y 0 de 153
enfrentamientos decididos**.

9.3. No se muestra ningún porcentaje de «confianza», ni una barra de
progreso sobre un número fijo de preguntas: no hay número fijo (6.4), y una
confianza inventada sería exactamente el tipo de cifra sin respaldo que este
proyecto no publica.

### 10. El resultado

10.1. Al terminar, la tanda enseña **los siete pesos propuestos**, cada uno
con el valor que tenía antes al lado cuando ha cambiado, y las dos cifras de
avance en su estado final.

10.2. Enseña también, en una línea, **qué han fijado las respuestas y qué
no**: cuántas combinaciones de la rejilla siguen siendo compatibles. Cuando
queda más de una, se dice explícitamente que los pesos propuestos son *una*
de las explicaciones posibles de lo respondido, no *la* medida de lo que
quien contesta valora.

10.3. Es la lectura honesta de lo medido: las respuestas fijan **la
clasificación** mucho mejor que **los pesos**. Sobre sesenta perfiles
sintéticos, la tanda completa reproduce el **97,1 %** de los 153
enfrentamientos del perfil real y acierta su líder el **81,7 %** de las
veces —frente al 81,2 % y 33,3 % de los pesos por defecto—, y sin embargo
los siete números que propone rara vez coinciden con los del perfil. En una
sesión de ejemplo, un perfil con los pesos por defecto exactos
(`5,5,7,5,7,6,5`) recibe la propuesta `5,8,10,5,10,8,5`: números distintos,
mismo líder y 96,7 % de los enfrentamientos iguales.

10.4. **Aplicar** copia los siete pesos a los deslizadores, por la misma vía
que mover un deslizador a mano: se persiste y viaja en el enlace como
cualquier otra configuración (`product/0012`). **Descartar** cierra sin
tocar nada. No se aplica solo.

10.5. Aplicado el resultado, los deslizadores se mueven con normalidad. Ese
es el ajuste fino, y no hay ningún modo, aviso ni bloqueo que lo distinga de
mover un deslizador cualquiera.

### 11. Qué coches entran

11.1. Entran los coches **publicados** (`product/0015`) que además estén en
el tramo elegible en el momento de abrir la tanda: los que cumplen
presupuesto y reglas eliminatorias (`product/0031`) y no están descartados
(`product/0030`). No se pregunta por coches ya excluidos.

11.2. El conjunto queda **fijado al abrir la tanda** y no cambia mientras
dure, aunque se toquen las reglas por detrás: una tanda es un sistema de
desigualdades sobre un conjunto concreto, y cambiarlo a media tanda dejaría
respuestas sin par que las sostenga.

11.3. Con **menos de cuatro** coches elegibles la tanda no se ofrece, y el
panel de pesos explica por qué. Con tres o menos no hay bastantes pares para
distinguir siete pesos.

### 12. Dónde vive

12.1. La tanda se abre desde un control dentro del panel «Pesos de decisión»
de la clasificación (`#/`), que es donde viven los pesos. No añade una vista
nueva ni una entrada al menú de navegación (`technical/0006`), ni un quinto
control a la barra de la ficha (`technical/0010`).

12.2. Se presenta en un **diálogo**, con el patrón de foco y cierre que ya
usan el diálogo de foto (`technical/0009`) y el de decisión
(`product/0030`).

12.3. Todo el cálculo vive en el dominio, en un módulo propio. `src/ui/`
no divide, no multiplica y no recorre la rejilla: recibe el cara a cara que
toca, los pesos propuestos y las dos cifras de avance ya hechos, como manda
la regla `ui-no-scoring-internals`.

### 13. Coste

13.1. Recalcular tras una respuesta debe ser imperceptible. Medido sobre
esta máquina con diecisiete respuestas: **57,5 ms** recorrer las 78.124
combinaciones enteras y **13,4 ms** elegir el siguiente par sobre un comité
de 1.500.

13.2. El conjunto compatible **solo se estrecha** mientras las respuestas no
se contradigan, así que basta filtrar los supervivientes con la respuesta
nueva en vez de recorrer la rejilla entera cada vez. Se vuelve a la rejilla
completa solo cuando el filtrado dejaría el conjunto vacío —el caso 4.2— y
al deshacer una respuesta.

13.3. La rejilla no se guarda como 78.124 objetos: son siete valores de 0 a
10 por combinación, que caben en un `Uint8Array` de 547 KB, o se generan al
vuelo. Ni una dependencia nueva.

## Criterios de aceptación

> Obligatorios y verificables.

- [ ] Puntuando el catálogo con dos vectores de pesos distintos, los perfiles
      de los dieciocho coches son idénticos: diferencia máxima exactamente 0
      (requisito 1.2).
- [ ] La rejilla tiene exactamente 78.124 combinaciones, todas con los siete
      pesos en `{0, 2, 5, 8, 10}`, ninguna nula, y el mismo orden en dos
      ejecuciones (requisitos 3.1 y 3.4).
- [ ] Dado un conjunto de respuestas coherentes, los pesos propuestos no
      contradicen ninguna, y el conjunto compatible es no vacío
      (requisitos 4.2 y 5.3).
- [ ] Dadas dos respuestas que se contradicen entre sí sobre el mismo par, la
      derivación devuelve pesos y un conjunto compatible no vacío, sin lanzar
      (requisito 4.2).
- [ ] Con las mismas respuestas y los mismos pesos de partida, dos
      derivaciones devuelven los siete pesos idénticos (requisito 3.4).
- [ ] Entre dos combinaciones que satisfacen todas las respuestas con el
      mismo margen mínimo, se propone la más cercana a los pesos vigentes
      (requisito 5.1, criterio 3).
- [ ] «Me da igual» no cambia los pesos propuestos ni el conjunto compatible,
      y el par no se vuelve a ofrecer en esa tanda (requisito 2.3).
- [ ] Deshacer la última respuesta devuelve los pesos propuestos, el conjunto
      compatible y las dos cifras de avance al valor exacto que tenían antes
      de contestarla (requisito 8.2).
- [ ] El primer cara a cara del catálogo de hoy es EV3 contra Compass, y no
      cambia entre ejecuciones (requisito 6.2).
- [ ] La tanda termina sola: existe un momento en que ningún par sin ver
      divide al comité, y a partir de ahí no se ofrece ninguna pregunta más
      (requisito 6.4).
- [ ] Sobre sesenta perfiles de preferencia sintéticos, la tanda completa
      con selección por comité se cierra en **18 preguntas o menos** y
      reproduce **al menos el 95 %** de los 153 enfrentamientos del perfil
      real, contra el 81,2 % de los pesos por defecto (requisitos 6.5 y
      10.3).
- [ ] Con el 10 % de las respuestas invertidas a propósito, la tanda sigue
      cerrándose y reproduce **al menos el 90 %** de los enfrentamientos
      (requisitos 4.2 y 10.3).
- [ ] Ningún elemento del diálogo de un cara a cara muestra la nota, el
      porcentaje, una nota de eje ni el puesto de ninguno de los dos coches
      (requisito 7.2).
- [ ] Cerrar la tanda sin aplicar deja los siete deslizadores exactamente
      como estaban; aplicar los deja en los pesos propuestos, y esa
      configuración se persiste y viaja en el enlace compartible
      (requisitos 8.3 y 10.4).
- [ ] `CONFIG_VERSION` no cambia y no se añade ninguna clave de
      almacenamiento nueva (fuera de alcance, «que la tanda sobreviva a una
      recarga»).
- [ ] Con menos de cuatro coches elegibles no se ofrece la tanda y el panel
      de pesos dice por qué (requisito 11.3).
- [ ] `src/ui/` no contiene ninguna operación aritmética sobre perfiles,
      pesos ni combinaciones: `arch:check` y la revisión del diff lo
      confirman (requisito 12.3).
- [ ] La CI entera pasa en local con cobertura al 100 % en `domain/`,
      `data/` y `logging/`.

## Dependencias y supuestos

- **Depende del ADR 0004** y de que los siete ejes estén en escala absoluta.
  Sin esa propiedad una respuesta no sería una desigualdad lineal sobre los
  pesos, y toda la spec se cae. El requisito 1.2 la comprueba en vez de
  confiar en ella.
- **Depende de `scoreCatalog`** como única fuente de las notas de eje. No se
  recalcula ninguna nota por otra vía.
- **Reutiliza la ficha** (`product/0018`, `product/0020`) para pintar los dos
  coches del cara a cara, y el patrón de diálogo ya existente. No inventa un
  primitivo nuevo.
- **Supone que quien contesta responde sobre el coche, no sobre el modelo.**
  Es lo que el requisito 7.2 protege escondiendo toda cifra derivada.
- **Supone que las respuestas pueden ser incoherentes** y no lo trata como un
  error: el requisito 4.2 lo absorbe. En lo medido, ni con el 10 % de las
  respuestas invertidas aparecieron contradicciones irresolubles, porque la
  rejilla es lo bastante ancha para explicar casi cualquier tanda.
- **Las cifras del contexto y de los requisitos 6.5, 9.2 y 10.3 son medidas**
  del 2026-09-01 sobre los dieciocho coches publicados, con
  `DEFAULT_ASSUMPTIONS` y presupuesto por defecto. Cambiar el catálogo las
  mueve; los criterios de aceptación que dependen de ellas están escritos
  como cotas («18 preguntas o menos», «al menos el 95 %») para que sigan
  siendo verificables cuando entre un coche nuevo.
- **Los perfiles sintéticos no son personas.** Miden si el método recupera un
  criterio lineal que existe; no dicen si una persona real tiene un criterio
  lineal ni si contesta de forma estable. Es el límite honesto de toda la
  verificación de esta spec, y la única forma de superarlo es usarla.

## Decisiones abiertas

Ninguna.

**Cerrada el 2026-09-01 — «¿hace falta un ADR?»: sí.** Las dos cosas de
calado que esta spec traía dentro —que se razona sobre una **rejilla
declarada y finita** en vez de resolver un problema continuo, y que lo que
una tanda identifica es **la clasificación y no los pesos**, con lo que eso
obliga a decir en pantalla— salen de aquí y pasan al **ADR 0011**, por la
regla de `docs/proceso/adrs.md`: si al redactar una spec aparece una decisión
estructural, sale de la spec y entra en un ADR. Los requisitos 3, 5, 9 y 10.2
son ahora la aplicación de ese ADR, y su razonamiento no se duplica aquí.
