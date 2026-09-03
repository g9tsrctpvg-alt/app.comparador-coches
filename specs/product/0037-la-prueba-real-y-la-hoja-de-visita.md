# 0037 — La prueba real y la hoja de visita

- **Id:** product/0037
- **Estado:** approved
- **Tipo:** product
- **Fecha:** 2026-09-03
- **Specs relacionadas:** product/0001, product/0005, product/0011,
  product/0012, product/0014, product/0018, product/0024, product/0029,
  product/0030, product/0031, product/0033, product/0035, product/0036,
  technical/0005, technical/0006, technical/0011
- **ADRs relacionados:** 0004, 0009, 0010, 0012
- **Doc de estado:** `docs/estado/dominio.md`, `docs/estado/interfaz.md`

## Contexto

La aplicación puntúa dieciocho candidatos con siete ejes, explica de dónde
sale cada nota, reparte la diferencia entre dos coches eje a eje, deja
descartar con motivo y fecha, filtra por imprescindibles y deduce los pesos
de una tanda de duelos. Todo eso ocurre **sin haberse sentado en ningún
coche**.

Y lo que decide una compra no está ahí. La postura al volante, el ruido a
120, los pilares que tapan una rotonda, si atrás caben las rodillas de un
adulto detrás de otro adulto, si el maletero tiene un escalón que obliga a
levantar la maleta veinte centímetros: nada de eso se deduce de una ficha, y
ninguna de las veintiséis magnitudes lo mide. El proyecto lo sabe y lo tiene
escrito en dos sitios. `docs/estado/dominio.md` lo declara como hueco
—«un eje de conducción subjetiva tras probar los coches queda fuera del
dominio actual»— y el roadmap lo tiene abierto como P6, con P7 encadenada
detrás.

Lo único subjetivo que hoy se puede anotar es la estética, y llega rellena
desde el catálogo. El resto de lo que una persona sabe de un coche después
de verlo vive donde vivía el estado de decisión antes de `product/0030`: en
su cabeza. Con una diferencia que lo empeora — a la tercera visita, en
sábado, uno ya no se acuerda de si el Tucson tenía más ruido que el CR-V o
era al revés.

La otra mitad del problema es la visita en sí. Se llega al concesionario sin
lista, el comercial lleva la conversación a lo que él quiere enseñar, y se
sale sin haber mirado el maletero por dentro ni haber preguntado por los tres
datos que en el catálogo están marcados como estimados. **Sin qué mirar, la
prueba se olvida a la mitad**, que es literalmente lo que P7 dice.

Las dos propuestas son la misma cosa en dos momentos: la hoja de visita es el
registro **antes** de rellenarlo, y el registro es la hoja de visita
**después**. Por eso esta spec cubre las dos y no dos specs encadenadas:
separarlas obligaría a que la primera declarase el formulario que la segunda
va a rellenar, y a que la segunda no pudiese verificarse sin la primera.

## Objetivo

Que la aplicación genere, para cada candidato, una hoja de visita con qué
mirar y qué preguntar delante del coche; que esa misma hoja recoja, con
fecha, los cinco juicios que solo se pueden dar sentado dentro; y que esos
juicios entren en la nota como un octavo eje, sin que la clasificación se
mueva mientras no haya ninguna prueba anotada.

## Alcance

- Cinco juicios de 1 a 5 por coche, con nota libre y fecha, guardados en un
  cuarto objeto persistido con clave y versión propias.
- Un octavo eje, `prueba`, con escala absoluta lineal, neutro declarado para
  quien no se ha probado (ADR 0012) y **peso 0 por defecto**.
- La subida de `CONFIG_VERSION` a 4, con migración de los pesos guardados y
  de los enlaces ya compartidos.
- Una vista nueva —la hoja de visita— con índice y ruta por coche, generada
  a partir de datos declarados, y su copia como texto plano.
- Los cuatro puntos de entrada a esa vista y la cuarta pastilla de
  navegación.
- El ajuste de la calibración de `product/0035` para que un eje que no
  distingue a nadie no multiplique por cinco el coste de una tanda.
- El eje nuevo en la página que explica los cálculos, con su color y su
  icono.

## Fuera de alcance

- **Que los cinco juicios entren en los ejes objetivos.** `carga` sigue
  puntuando litros y `habitabilidad` sigue puntuando batalla y anchura de
  hombros. Mezclar un juicio dentro de un eje medido es el fallo que
  `product/0005` corrigió sacando el confort subjetivo de `viaje`.
- **Filas de la ficha para los cinco juicios.** La ficha compara magnitudes
  declaradas de los coches; estos juicios son de quien decide, existen para
  tres coches de dieciocho y llenarían quince columnas de celdas vacías. Como
  consecuencia directa, tampoco se puede poner un **imprescindible**
  (`product/0031`) sobre ellos: una regla que excluyera por un juicio que
  solo existe después de conducir dejaría fuera a todo lo que no se ha
  conducido.
- **Historial de visitas.** Una prueba por coche. Volver al concesionario
  sobrescribe la anterior y mueve la fecha; no se guarda la secuencia.
- **Fotos, audio o adjuntos de la visita.** La hoja recoge números y texto.
- **Compartir o exportar la prueba.** No viaja en el enlace compartible, con
  el mismo criterio y el mismo motivo que las decisiones de `product/0030`;
  la copia al portapapeles es para llevársela uno mismo, no para mandarla.
- **Hoja de impresión.** No se declara ningún `@media print`: quien quiera
  papel imprime la página o pega el texto copiado.
- **Probar una referencia.** El Alfa Romeo Giulietta de `references.json` no
  se puntúa, así que no tiene eje `prueba` ni hoja de visita.
- **Concesionarios, citas y recordatorios.** Nombres, direcciones, teléfonos
  o calendarios son datos de terceros y acción hacia fuera (🔴): esta spec no
  los toca ni prepara su sitio.
- **El eje de autonomía y repostaje**, que sigue donde estaba en el roadmap.
- **Un peso por juicio.** Los cinco reparten a partes iguales; el requisito
  2.6 dice por qué y qué habría que hacer si dejara de valer.

## Requisitos / comportamiento esperado

### 1. Qué es una prueba

1.1. Una prueba registra **cinco juicios**, cada uno de 1 a 5, sobre un
coche del catálogo:

| Id | Rótulo | Qué se juzga |
| --- | --- | --- |
| `posture` | Postura al volante | Asiento, volante, pedales, dónde caen los mandos, si se conduce cómodo a los diez minutos |
| `noise` | Ruido | Rodadura, aire y motor a velocidad de autovía |
| `visibility` | Visibilidad | Pilares, luneta, ángulos muertos, lo que se ve al maniobrar |
| `rearSeats` | Plazas de atrás | Rodillas y cabeza de un adulto detrás de otro adulto, y si la plaza del medio existe de verdad |
| `boot` | Maletero por dentro | Forma, escalón de carga, hueco bajo el suelo, si el portón deja meter algo ancho |

1.2. Los identificadores van **en inglés**, como manda `CLAUDE.md` §2 para
vocabulario nuevo, y el rótulo en español, igual que hizo `product/0030` con
los estados de decisión.

1.3. **Cada juicio es sobre lo que la magnitud declarada no dice.** Dos de
los cinco tienen una magnitud del catálogo con el mismo tema y no se solapan
con ella: `rearSeats` no juzga los milímetros de batalla ni de anchura de
hombros —eso ya lo puntúa `habitabilidad`—, sino si esos milímetros están
donde hacen falta; `boot` no juzga los litros —eso ya lo puntúa `carga`—,
sino la forma en que están repartidos. La hoja de visita lo dice delante de
cada pregunta (requisito 5.2), porque es la única defensa contra puntuar dos
veces lo mismo.

1.4. Una prueba lleva además una **nota en texto libre**, opcional, y una
**fecha** (`AAAA-MM-DD`).

1.5. **Una prueba por coche.** Guardar de nuevo sobrescribe.

1.6. **Una prueba puede ser parcial.** Se guarda con los juicios que se
hayan dado, incluso con ninguno —solo la nota escrita—, y cada juicio sin
contestar cuenta como un 3, el mismo neutro declarado que un coche sin probar
(ADR 0012, punto 2). La interfaz dice cuántos de los cinco están
contestados.

1.7. Un coche está **probado** si tiene entrada en el registro, aunque sea
parcial. `undefined` es «sin probar», y no se guarda nada por un coche que no
se ha visitado: el registro pesa lo que se ha probado de verdad, con el mismo
criterio con que `undecided` no se guarda en `product/0030`.

1.8. **La fecha no entra en ninguna fórmula** (ADR 0009). Es editable —una
visita se anota muchas veces esa noche, no en el mostrador—, se valida como
fecha real en el dominio, y por defecto es hoy. La aporta **quien llama**,
nunca `src/domain/`, con el mismo criterio que `setDecision`.

### 2. El octavo eje

2.1. `prueba` entra en `AxisId`, en `AXIS_ORDER` **detrás de `estetica` y
delante de `coste`** —junto a la otra valoración que da el usuario— y en
`AXIS_LABELS` como «Prueba real».

2.2. La nota es la **media simple de los cinco juicios**, traducida con la
misma recta que la estética:

```text
nota = (media(posture, noise, visibility, rearSeats, boot) − 1) × 2,5
```

Lineal y sin curva en S, por la razón que `product/0004` ya fijó para la
estética: un 1-5 que da una persona **ya es** su juicio completo, y
comprimir los extremos otra vez lo deformaría dos veces. Los anclajes de la
escala son los extremos de la propia valoración —1 y 5—, no cifras de
mercado: el ADR 0010 rige sobre magnitudes medidas, y aquí no hay ninguna.

2.3. **Un coche sin probar saca 5,0**, el neutro declarado del ADR 0012, que
es exactamente lo que da la fórmula con un 3 en los cinco. Su desglose lo
declara en `info` —«Sin probar: puntúa el neutro»—, no en una nota al pie de
la interfaz, para que el dato viaje con el desglose a cualquier superficie
que lo muestre.

2.4. **El peso por defecto de `prueba` es 0.** El día que el eje se
implementa, la clasificación de los dieciocho candidatos queda **bit a bit
igual** que sin él, y eso se comprueba contra el snapshot que ya existe.

2.5. **«Que la prueba cuente»** es una acción explícita que sube el peso de
`prueba` a 5. Aparece en la hoja de visita, solo cuando hay al menos una
prueba guardada y el peso sigue en 0, y dice lo que va a hacer antes de
hacerlo. Guardar una prueba **nunca** cambia un peso por su cuenta: el ADR
0012 lo exige, y un objeto que se escribe solo porque otro se ha escrito es
justo lo que hace que nadie confíe en lo que ve.

2.6. **Los cinco juicios reparten a partes iguales** —0,2 cada uno— y ese
reparto **no es configurable**: no hay supuesto global nuevo ni deslizador.
Nadie puede calibrar a ojo si el ruido importa el doble que la visibilidad, y
un control para eso sería el «supuesto escondido en un panel» que
`product/0033` descartó por producto. Si algún día uno de los cinco necesita
pesar aparte, se parte el eje como se partió `viaje`, en su spec y con su
migración.

2.7. El desglose del eje trae los **cinco subcomponentes** con su escala y su
valor. **Ninguno es `editableRating`**: los cinco se editan en la hoja de
visita y solo ahí (requisito 5.5). Un deslizador de «postura al volante» en
la fila del ranking invita a contestarlo de memoria o desde una foto, que es
exactamente el error que `product/0005` midió y corrigió.

2.8. `scoreCatalog` recibe **un parámetro más**, el registro de pruebas, con
valor por defecto «ninguna prueba». Es la primera anotación del usuario que
entra en la puntuación —el estado de decisión (`product/0030`) y los
imprescindibles (`product/0031`) declaran justo lo contrario—, y la
diferencia es deliberada: aquellos dicen qué se ve, este dice qué se sabe del
coche. El dominio sigue puro: recibe el registro ya restaurado, no lee
`localStorage` ni el reloj.

2.9. El reparto de la diferencia entre dos coches (`product/0029`) y la nota
total en porcentaje incluyen el eje nuevo **sin código nuevo**: los dos
recorren `AXIS_ORDER`. Con peso 0, la aportación del eje es 0 y la línea de
resumen no lo menciona.

### 3. Dónde se guarda

3.1. Las pruebas viven en un **cuarto objeto persistido**, hermano de
`AppConfig`, `ViewState` y `DecisionLog`: clave propia
(`comparador-coches:testdrives`) y versión propia (`TEST_DRIVE_LOG_VERSION`).
Mismo motivo que llevó a `DecisionLog` a tener la suya: contiene texto
escrito a mano, y una subida de versión de los pesos no puede llevárselo por
delante.

3.2. Se lee y se escribe por el mismo puerto que las otras tres claves
(`src/adapters/localStorageConfigPort.ts`), que sigue siendo el único módulo
que toca `window.localStorage`.

3.3. **Degradación por partes, y hasta el juicio suelto**: un `car.id` que ya
no está en el catálogo descarta su entrada; una entrada que no es un objeto,
o cuya fecha no es una fecha, se descarta entera; **un juicio fuera de 1-5 o
que no es número se descarta solo él** y la prueba sobrevive con ese juicio
en el neutro. Una versión desconocida o un JSON corrupto descartan el objeto
entero. Un campo ausente no es un descarte y no se registra. El grano fino
del juicio suelto no es simetría con `restoreConfig`: es que una nota escrita
a mano no se pierde por un número mal guardado.

3.4. **No viaja en el enlace compartible**, por los dos motivos de
`product/0030`: el enlace reproduce cómo se puntúa, no lo que anotó quien
comparte, y un texto libre no cabe en una URL sin volverla ilegible. El
**peso** del eje sí viaja, como cualquier otro peso (requisito 4.3).

3.5. **«Restablecer» no toca las pruebas**, igual que no toca las
decisiones. Vaciar el registro es una acción propia, **«Borrar pruebas»**,
junto a «Borrar decisiones» en el mismo bloque: destructiva, con confirmación
que dice cuántas se van a perder, y visible solo cuando hay al menos una.

3.6. **Ningún texto escrito por el usuario entra en un registro de log**
(requisito 9).

### 4. La configuración sube a la versión 4

4.1. `AxisWeightsSchema` gana la clave `prueba` y `CONFIG_VERSION` pasa a
**4**. Sin esa subida, una configuración guardada con los siete pesos fallaría
el esquema entero y los siete caerían a los valores por defecto: el usuario
perdería sus pesos por haber llegado un eje nuevo.

4.2. **El salto 3 → 4 se migra**, no se descarta, con el mismo criterio con
que `product/0033` migró el 2 → 3: no hay nada que adivinar. `prueba: 0`
conserva la clasificación exacta que producían los siete pesos guardados. La
migración **se compone** con la anterior, así que una configuración guardada
con `version: 2` se migra 2 → 3 → 4 y sigue valiendo.

4.3. El enlace compartible gana `w_prueba`, presente solo si el peso se
aparta del 0 por defecto. Un enlace ya compartido —con `v=3` o `v=2`— sigue
reproduciendo la misma clasificación que reproducía antes de esta spec.

### 5. La hoja de visita

5.1. Vive en una ruta propia: `#/visita` es el índice y `#/visita/<carId>` es
la hoja de un coche. Es una vista y no un diálogo porque se usa de pie, en
un concesionario, durante veinte minutos y a ratos: un diálogo se pierde al
recargar y no se puede abrir directamente desde el móvil.

5.2. La hoja de un coche tiene **cinco bloques**, en este orden:

1. **Identidad**: nombre, marca, tecnología, la foto frontal si la declara y
   la fecha de la prueba, editable.
2. **Lo que solo se sabe dentro**: los cinco juicios del requisito 1.1, cada
   uno con su pregunta, con el control de 1 a 5 y con el dato declarado que
   **no** hay que volver a juzgar cuando lo hay —«379 L declarados, ya
   puntuados en Capacidad de carga: juzga la forma, no el volumen»—.
3. **Lo que hay que preguntar**: una línea por cada magnitud de la ficha
   cuya fuente vigente esté marcada como estimada, y una por cada magnitud
   opcional que este coche no declara —hoy, el diámetro de giro y la carga
   máxima sobre el techo—, cada una redactada como pregunta y con el valor
   estimado cuando lo hay.
4. **Dónde flojea este coche**: sus **tres ejes con la nota más baja**,
   `prueba` excluido, cada uno con el sumando peor de su desglose. Es lo que
   conviene mirar con lupa delante del coche, y sale del desglose que ya se
   calcula.
5. **Notas**: el texto libre de la prueba.

5.3. **La hoja se genera de datos declarados y es determinista**: mismo
coche, misma configuración y mismo registro producen la misma hoja, palabra
por palabra. No hay texto redactado por coche a mano ni nada traído de
fuera.

5.4. Un botón **«Copiar»** pone la hoja entera en el portapapeles como texto
plano —los cinco juicios con lo contestado, las preguntas y los tres ejes
flojos—, para llevársela en el móvil o pegarla donde sea. Si el portapapeles
no está disponible, se dice y no se rompe nada.

5.5. **La hoja es el único sitio donde se editan los cinco juicios, la nota y
la fecha.** Ninguna otra superficie los edita (ver 2.7).

5.6. El **índice** (`#/visita`) lista los candidatos publicados en el orden
de la clasificación vigente, cada uno con «Probado el DD/MM/AAAA» o «Sin
probar» y con cuántos de los cinco juicios tiene contestados. Aplica el
filtro de decisión de `product/0030` —preparar visitas es trabajo de la lista
corta—, sin la excepción del modelo de comparación, que aquí no existe. Si el
filtro lo deja vacío, lo dice y ofrece volver a «Todos», igual que la
clasificación.

5.7. Un `carId` desconocido o no publicado **no tiene hoja**: la vista lo
dice y enlaza al índice. No se cae y no muestra una hoja en blanco.

### 6. Cómo se llega

6.1. La navegación pasa de tres destinos a **cuatro**: «Clasificación»,
«Ficha», «Visita» y «Cómo se calcula». «Visita» apunta a `#/visita` y está
activa —con `aria-current` en escritorio y seleccionada en el `<select>` de
móvil (`technical/0006`)— también en `#/visita/<carId>`.

6.2. Desde la **cabecera de columna de la ficha**, un enlace a la hoja de ese
modelo, junto a la marca de decisión que ya está ahí.

6.3. Desde la **fila desplegada de la clasificación**, el mismo enlace.

6.4. El **desglose del eje `prueba`** enlaza a la hoja del coche cuando no
hay prueba: es donde uno se entera de que ese 5,0 no significa nada todavía.

### 7. La calibración no paga por un eje que no distingue

7.1. La rejilla de `product/0035` se enumera **solo sobre los ejes cuyo
perfil no es constante** en el conjunto de coches que entra en la tanda. Un
eje en el que los dieciocho candidatos sacan la misma nota no puede decidir
ningún duelo: su término se cancela en `Σ pesoᵢ × (notaᵢ(A) − notaᵢ(B))` sea
cual sea su peso, así que sus cinco niveles son cinco copias idénticas de la
misma respuesta.

7.2. **Excluirlo no cambia ningún resultado**, y esa es la condición para
hacerlo: el coche que gana con cada combinación, qué combinaciones siguen
siendo compatibles y qué pregunta divide más al conjunto son exactamente los
mismos. Lo que cambia es el coste: con el eje dentro y todos los coches sin
probar, la rejilla pasa de 78.124 combinaciones a 390.624 y la primera
pregunta multiplica su trabajo por cinco a cambio de nada.

7.3. Las dos cifras de avance y el recuento de combinaciones compatibles se
calculan sobre la **rejilla enumerada**. Un eje constante multiplica por
igual el compatible y el total, así que ninguna proporción cambia por
excluirlo.

7.4. Un eje constante **no se ofrece como eje decisivo** (`product/0036`):
marcarlo como el que decidió una elección afirmaría una desigualdad que sus
notas no pueden sostener.

7.5. Los pesos de los ejes excluidos **se conservan** tal como estén: la
tanda no los propone ni los toca. En cuanto haya un coche probado y otro sin
probar, `prueba` deja de ser constante, entra en la rejilla y se calibra como
los demás.

### 8. Explicación, color e icono

8.1. La página que explica los cálculos (`product/0011`) gana el eje: su
fórmula, la recta sin curva en S y su porqué, el neutro del ADR 0012 con lo
que significa, y que su peso nace en 0.

8.2. `axisTheme.module.css` declara la clase del eje nuevo y `AxisIcon` su
icono (`technical/0011`), con el mismo tratamiento que los siete: el color
nunca es el único portador del significado, y el contraste lo comprueba el
validador que ya existe.

### 9. Registro

9.1. Los descartes de restauración se registran con `logError`, siguiendo
`docs/proceso/logging.md`: `test_drive_log_discarded` para el objeto entero,
`test_drive_entry_discarded` con `car.id` para una prueba suelta y
`test_drive_rating_discarded` con `car.id` y el id del juicio para un juicio
suelto. **Ningún texto escrito por el usuario entra nunca en un atributo
registrado**, ni la nota ni nada derivado de ella.

## Criterios de aceptación

> Obligatorios y verificables.

- [ ] Un test comprueba que los cinco juicios son un conjunto cerrado, que
      cada uno acepta 1-5 y rechaza lo demás, y que la nota del eje es
      `(media − 1) × 2,5`.
- [ ] Un test comprueba que un coche sin prueba saca exactamente 5,0 en
      `prueba`, y que una prueba con 3 en los cinco juicios saca **el mismo**
      5,0.
- [ ] Un test comprueba que una prueba parcial puntúa como si los juicios sin
      contestar valieran 3, y que el desglose declara cuántos hay
      contestados.
- [ ] Un test comprueba que el desglose de un coche sin probar trae la línea
      de `info` que lo declara, y que ningún subcomponente del eje es
      `editableRating`.
- [ ] `scoreCatalog.snapshot.test.ts` pasa **sin tocar el snapshot**: con los
      pesos por defecto y sin ninguna prueba, la puntuación de los dieciocho
      candidatos publicados es bit a bit la de antes de esta spec.
- [ ] Un test comprueba que, con peso 0, guardar una prueba con los cinco
      juicios a 5 **no mueve** ninguna nota total ni ningún puesto; y que con
      peso 5 sí los mueve.
- [ ] Un test comprueba que guardar una prueba no modifica `AppConfig`, y que
      «Que la prueba cuente» sube el peso de `prueba` a 5 y solo eso.
- [ ] Un test comprueba la migración de pesos: una configuración `version: 3`
      con sus siete pesos se restaura con los siete intactos y `prueba: 0`;
      una `version: 2` se migra 2 → 3 → 4 y conserva el reparto de `viaje`.
- [ ] Un test comprueba que un enlace generado antes de esta spec —con `v=3`
      y sin `w_prueba`— reproduce la misma clasificación que reproducía, y
      que `w_prueba` solo aparece en el enlace cuando el peso no es 0.
- [ ] Un test comprueba la degradación por partes del registro: un `car.id`
      fuera del catálogo descarta su entrada; una fecha inválida descarta la
      prueba; un juicio fuera de rango descarta **solo ese juicio** y
      conserva la nota escrita; una versión desconocida descarta el objeto
      entero; un campo ausente no genera registro.
- [ ] Un test comprueba que los tres eventos de descarte se emiten con
      `car.id` y motivo, y que **el texto de la nota no aparece** en ningún
      atributo registrado.
- [ ] Un test comprueba que la fecha se valida como fecha real, que por
      defecto es la que se le pasa desde fuera y que **ninguna nota cambia**
      al cambiarla (ADR 0009).
- [ ] Un test comprueba que la hoja de un coche es determinista: dos
      construcciones con el mismo coche, la misma configuración y el mismo
      registro dan el mismo texto.
- [ ] Un test comprueba que el bloque «Lo que hay que preguntar» lista
      exactamente las magnitudes con fuente vigente estimada más las
      opcionales que ese coche no declara, sobre un coche real del catálogo.
- [ ] Un test comprueba que «Dónde flojea» trae los tres ejes de nota más
      baja de ese coche, con `prueba` excluido.
- [ ] Un test comprueba que `#/visita/<id>` con un id desconocido o no
      publicado renderiza el aviso y el enlace al índice, y no una hoja
      vacía.
- [ ] Un test comprueba que el índice aplica el filtro de decisión y muestra
      «Sin probar» o la fecha, y que con el filtro vaciando la lista
      renderiza su mensaje.
- [ ] Un test comprueba que la navegación tiene cuatro destinos y marca
      exactamente uno como activo en cada una de las cuatro rutas,
      `#/visita/<id>` incluida.
- [ ] Un test comprueba que «Restablecer» deja el registro de pruebas
      intacto, que «Borrar pruebas» lo vacía y que ese botón no se renderiza
      sin ninguna prueba guardada.
- [ ] Un test comprueba que, con todos los coches sin probar, la tanda de
      calibración propone **los mismos pesos** y hace **las mismas
      preguntas** que antes de esta spec, y que `prueba` conserva su peso; y
      que con un coche probado el eje entra en la rejilla.
- [ ] `axisTheme.test.ts` sigue comprobando que la hoja declara clase para
      **todos** los ejes de `AXIS_ORDER`, y el validador de contraste pasa con
      el color nuevo.
- [ ] Verificación manual sobre el *build* de producción: rellenar una hoja
      de visita en un viewport de 320px, recargar y comprobar que sobrevive;
      copiarla al portapapeles y comprobar el texto; comprobar que el enlace
      compartible no lleva la prueba; subir el peso y ver moverse la
      clasificación en vivo.
- [ ] La secuencia de CI pasa entera en local
      (`docs/proceso/ci-y-guardarrailes.md`, §4), con cobertura al 100 % en
      `src/domain/`, `src/data/` y `src/logging/`.

## Dependencias y supuestos

- **Depende del ADR 0012**, redactado con esta spec y pendiente del mismo
  gate. Sin él, el requisito 2.3 sería una decisión de calado tomada dentro
  de una spec.
- **No depende de ninguna spec sin implementar.** Se apoya en piezas ya
  consolidadas: el puerto de almacenamiento y la restauración tolerante de
  `product/0012`, el precedente de clave propia de `product/0024` y
  `product/0030`, la migración de pesos de `product/0033`, la fila
  desplegable de `product/0022` y `product/0029`, la cabecera de columna de
  `product/0018`, la navegación de `technical/0005` y `technical/0006` y el
  color por eje de `technical/0011`.
- **Supone que se prueban pocos coches.** Tres o cuatro de dieciocho, y
  tarde. Todo el diseño del neutro y del peso 0 sale de ahí: si algún día se
  probaran todos, el neutro dejaría de aplicarse solo y no habría nada que
  cambiar.
- **Supone una persona y un navegador**, igual que `product/0030`: las
  pruebas son locales a donde se anotaron y no se sincronizan.
- **Supone que el catálogo cambia poco.** Un coche que desaparece del
  catálogo pierde su prueba sin aviso, con el mismo criterio y el mismo
  riesgo asumido que las decisiones.
- **El ADR 0004 sigue mandando**: el neutro es un valor declarado y
  constante, no depende de qué otros coches haya ni de cuántos se hayan
  probado, así que añadir o quitar candidatos sigue sin mover ninguna nota.
- **El ADR 0009 sigue mandando**: la prueba lleva fecha, se muestra y se
  ordena por ella, pero ninguna fórmula la lee.

## Decisiones abiertas

Ninguna.
