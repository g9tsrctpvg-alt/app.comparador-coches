# 0018 — Una sola ficha, con diferencias contra el modelo elegido

- **Id:** product/0018
- **Estado:** approved
- **Tipo:** product
- **Fecha:** 2026-08-08
- **Specs relacionadas:** product/0013, product/0014, product/0016, technical/0005
- **ADRs relacionados:** 0006, 0007
- **Doc de estado:** `docs/estado/interfaz.md`, `docs/estado/dominio.md`

## Contexto

La aplicación tiene **dos vistas que son la misma vista**.

`#/ficha-tecnica` (`product/0013`) enseña una tabla con una fila por modelo,
ordenada por longitud, y seis magnitudes: longitud, anchura, altura, altura
libre al suelo, maletero y litros por metro cuadrado. Cada dimensión lleva al
lado su **Δ frente al Alfa Romeo Giulietta**, con el signo escrito y el color
según la polaridad declarada.

`#/ficha-completa` (`product/0014`) enseña la tabla transpuesta —una columna
por modelo, una fila por magnitud— con **las veinte magnitudes**, agrupadas en
cinco bloques, la foto de cada modelo como cabecera de su columna, y una
columna fijable que el usuario elige para tenerla siempre a la vista mientras
el resto se desplaza.

Las seis magnitudes de la primera son **un subconjunto exacto** de las veinte
de la segunda: viven en su bloque «Tamaño y espacio». Los dos módulos de
dominio que las construyen ya están acoplados —`fichaCompleta.ts` importa de
`technicalSheet.ts` la métrica de litros por metro cuadrado y la función que
localiza la fuente vigente—. Las dos páginas repiten la misma cabecera, el
mismo patrón de tabla con desplazamiento propio, la misma etiqueta
«Referencia» y la misma leyenda de dato estimado.

Lo único que la ficha técnica tiene y la completa no es **la Δ**. Y lo único
que la completa tiene y la técnica no es, entre otras cosas, **el mecanismo
que la Δ necesitaría para dejar de estar clavada**: la columna fijada ya es,
literalmente, «el modelo contra el que comparo», y su control ya se rotula
`Comparar contra {nombre}`. La ficha técnica solo sabe comparar contra la
Giulietta porque su constructor lee `references[0]`; la completa deja elegir
contra quién, pero luego no resta.

Para quien usa la aplicación el resultado es que hay que ir y venir entre dos
pestañas para responder una sola pregunta —«¿cuánto más grande es este coche
que el mío?»— y que la respuesta solo está disponible contra un coche, el que
ya no se quiere.

## Objetivo

Fundir las dos fichas en una sola vista que enseñe cualquier subconjunto de
las veinte magnitudes y calcule la diferencia contra **el modelo que el
usuario elija**, no contra uno fijado en el código.

## Alcance

- **Una vista única** en lugar de las dos actuales, con su ruta canónica y con
  las dos rutas de hoy conservadas como alias.
- **La Δ generalizada**: de cinco magnitudes a veinte, y de una referencia
  fija a cualquier modelo del catálogo.
- **La polaridad de las veinte magnitudes**: en qué dirección «más» es mejor,
  peor o ninguna de las dos, con su razón declarada.
- **Un conmutador de conjunto de campos** que recupera la lectura de un
  vistazo que hoy da la ficha técnica.
- **La ordenación de los modelos**, que hoy solo existe en la ficha técnica y
  solo por longitud.
- **La fusión de los dos módulos de dominio** en uno.
- **La retirada** de la página de ficha técnica y de su módulo de dominio.

## Fuera de alcance

- **Las fotos y su comportamiento.** El selector de vista, el hueco rotulado
  cuando no hay foto, el diálogo ampliado con su crédito y la degradación
  cuando la carga falla son de `product/0014` y `product/0016`, y siguen tal
  cual. Esta spec no toca de dónde salen las fotos ni cómo se encuadran.
- **Los datos del catálogo.** No se añade ni se corrige ninguna magnitud de
  ningún coche. Las diez fotos de maletero que faltan siguen faltando.
- **La puntuación.** Ningún eje, ningún peso y ningún anclaje cambia. Esta
  vista no puntúa: enseña magnitudes con fuente y sus diferencias.
- **El aspecto visual**, que es de `technical/0005`. Aquí se decide qué se
  enseña y cómo se compara; el color, la escala y el shell vienen de allí.
- **Persistir la elección.** El modelo fijado, el conjunto de campos y el
  orden siguen siendo estado efímero, como ya declara `product/0014`: no se
  guardan ni viajan en el enlace compartible de `product/0012`.
- **La navegación por teclado del diálogo** y las demás verificaciones
  manuales pendientes de `product/0014`, que se comprueban aquí por
  oportunidad pero pertenecen a aquella spec.

## Requisitos / comportamiento esperado

### 1. La vista y sus rutas

1.1. Existe **una sola ficha**, rotulada «Ficha», accesible desde la
navegación única de `technical/0005`. La navegación pasa de listar dos fichas
a listar una.

1.2. Su ruta canónica es `#/ficha`.

1.3. `#/ficha-tecnica` y `#/ficha-completa` **siguen resolviendo a esa misma
vista**. Son alias, no rutas: cualquier enlace ya compartido sigue llevando a
algo, y no a la pantalla de clasificación por defecto. Ningún enlace de la
aplicación apunta ya a los alias.

### 2. La comparación

2.1. Cada celda numérica muestra su valor y, debajo, **su diferencia frente a
la celda equivalente del modelo de comparación**.

2.2. El modelo de comparación es **el que el usuario fija**, con el control
que ya existe en la cabecera de cada columna. Arranca fijado el Alfa Romeo
Giulietta, el coche a sustituir, igual que hoy.

2.3. Existe la opción **«Ninguno»**: sin modelo de comparación no se muestra
ninguna diferencia, y la vista es exactamente la ficha completa de hoy. Ésta
es la única forma de apagar las Δ; no hay un control separado para ello,
porque «comparar contra nadie» y «no enseñar diferencias» son la misma cosa
dicha dos veces.

2.4. **La columna del modelo de comparación no muestra diferencias.** Es el
origen, y su Δ sería siempre cero.

2.5. Cuando el modelo de comparación **no tiene el dato**, la celda no
muestra diferencia, sino la misma raya con texto accesible que hoy usa la
ficha técnica. No es un caso raro: una referencia solo declara cinco de las
veinte magnitudes, así que comparar contra la Giulietta deja quince filas sin
Δ, y eso es correcto y debe verse como ausencia, no como cero.

2.6. **El signo va siempre escrito.** El color refuerza la dirección, nunca la
porta en solitario. Es el requisito de `product/0013` y no se relaja al
multiplicarse por veinte: quien no distinga los colores lee el signo.

### 3. La polaridad de las veinte magnitudes

3.1. Cada magnitud declara si «más» es mejor, peor o ninguna de las dos, y la
declaración lleva su razón escrita al lado, no solo su valor.

3.2. **Las cinco direcciones que `product/0013` ya declaró no cambian**:
longitud y anchura, más es peor —el problema que el proyecto resuelve es que
los sustitutos son más grandes—; maletero, más es mejor; altura y altura libre
al suelo, sin dirección declarada.

3.3. Las quince restantes se declaran así:

| Magnitud | Dirección | Por qué |
| --- | --- | --- |
| Batalla | ninguna | Más batalla da más espacio dentro y más coche fuera. El proyecto no ha declarado cuál de las dos cosas le importa más, y ante la duda no se inventa un juicio |
| Anchura de hombros atrás | más es mejor | Es la magnitud que `product/0017` añadió al eje de viaje precisamente porque mide si caben tres atrás |
| Litros por m² | más es mejor | Mide cuánto maletero da un coche por el sitio que ocupa, que es la pregunta del proyecto en una sola cifra |
| Potencia | más es mejor | Dirección del eje de prestaciones |
| Peso | más es peor | Penaliza consumo, frenada y agilidad; ningún eje lo premia |
| Aceleración 0-100 | más es peor | Son segundos: más segundos es más lento |
| Consumo | más es peor | Dirección del eje de coste de tenencia |
| Precio | más es peor | Dirección del eje de coste de compra |
| Mantenimiento | más es peor | Dirección del eje de coste de tenencia |
| Valor residual a 5 años | más es mejor | Lo que se recupera al vender |
| Fiabilidad OCU | más es mejor | El índice sube con la fiabilidad |
| Garantía | más es mejor | Dirección del eje de fiabilidad |
| Extensión de garantía | más es mejor | Misma dirección que la garantía |
| Estética exterior | más es mejor | Es una nota del usuario sobre cinco |
| Estética interior | más es mejor | Es una nota del usuario sobre cinco |

3.4. La polaridad **vive en el dominio**, con el resto de la lógica de la
ficha, y no en un componente de interfaz. Es la misma regla que hoy hace que
`src/ui/` no divida para calcular los litros por metro cuadrado.

### 4. El conjunto de campos

4.1. Un conmutador elige entre **«Esenciales»** —longitud, anchura, altura,
altura libre al suelo, maletero y litros por metro cuadrado: exactamente las
seis de la ficha técnica de hoy— y **«Completa»**, las veinte agrupadas en sus
cinco bloques.

4.2. La vista **arranca en «Esenciales»**. El problema declarado del proyecto
es que los sustitutos son más grandes, así que ésa es la lectura que conviene
tener delante al entrar, y es la que hoy da la ficha técnica.

4.3. En «Completa» se conservan las cabeceras de bloque que agrupan las
magnitudes. En «Esenciales» no hay cabecera de bloque, porque hay un solo
grupo y rotularlo no añade nada.

4.4. **La anchura conserva su énfasis** en los dos modos: es la prioridad
declarada del proyecto y se distingue del resto de filas.

### 5. El orden de los modelos

5.1. Los modelos se pueden ordenar por **catálogo, longitud, anchura o
precio**, y arranca **por longitud ascendente**, que es el orden que hoy da la
ficha técnica.

5.2. El orden es una operación del dominio, no de la interfaz.

5.3. El modelo fijado como comparación **no se mueve de su sitio** al cambiar
el orden: sigue siendo la columna fija de la izquierda, porque su papel es
estar siempre a la vista.

5.4. Un modelo al que le falte la magnitud por la que se ordena va al final,
no en medio ni al principio: sin dato no hay posición que defender.

### 6. Lo que se conserva de las dos fichas

6.1. De `product/0014`: la tabla transpuesta con una columna por modelo, los
bloques, la foto como cabecera de columna con su selector de vista y su
diálogo ampliado, la columna fijada, el anclaje del desplazamiento por
columna, el comportamiento por debajo de `--bp-columna` —el rótulo de la
magnitud dentro de cada celda cuando la columna de rótulos no cabe— y el
contenedor desplazable alcanzable con teclado.

6.2. De `product/0013`: la Δ con signo escrito y color según polaridad, la
métrica de litros por metro cuadrado, la etiqueta «Referencia» sobre las filas
que lo son, el énfasis en anchura y **la leyenda al pie**, que explica qué es
la Δ, por qué en unas magnitudes más es mejor y en otras peor, qué son los
litros por metro cuadrado y qué significa la marca de dato estimado. La
leyenda se traslada, no se pierde: es lo que hace la tabla interpretable sin
salir de ella.

### 7. Lo que desaparece

7.1. La página de ficha técnica, su módulo de estilos y su test.

7.2. El módulo de dominio de la ficha técnica, **fundido** con el de la ficha
completa en uno solo. Hoy el segundo ya importa del primero; separarlos dejó
de tener sentido en cuanto hubo una sola vista.

7.3. `product/0013` queda **sustituida** por esta spec. Su vista deja de
existir; su contenido sobrevive dentro de esta ficha, y por eso los requisitos
3 y 6.2 lo recogen aquí de forma explícita en lugar de remitir a ella.

## Criterios de aceptación

> Obligatorios y verificables.

- [ ] `#/ficha`, `#/ficha-tecnica` y `#/ficha-completa` renderizan la misma
      vista, y ninguna de las tres cae en la pantalla de clasificación.
      Comprobado con un test sobre el marcado de cada ruta.
- [ ] La navegación no ofrece dos fichas: ofrece una.
- [ ] Con el Alfa Romeo Giulietta como comparación y el conjunto «Completa»,
      las cinco magnitudes que la referencia declara muestran diferencia y las
      quince que no declara muestran ausencia de dato, no un cero. Comprobado
      con un test.
- [ ] Fijar otro modelo recalcula todas las diferencias contra él, y su propia
      columna deja de mostrar diferencias. Comprobado con un test.
- [ ] Con «Ninguno» como comparación, ninguna celda muestra diferencia.
      Comprobado con un test.
- [ ] Toda diferencia distinta de cero se renderiza con su signo escrito.
      Comprobado con un test que busca el signo en el marcado, no el color.
- [ ] Las veinte magnitudes tienen polaridad declarada, y las cinco de
      `product/0013` conservan la que aquella spec les dio. Comprobado con un
      test sobre la tabla de polaridad.
- [ ] El conjunto «Esenciales» renderiza exactamente las seis magnitudes del
      requisito 4.1, y «Completa» las veinte. Comprobado con un test que
      cuenta filas.
- [ ] La vista arranca en «Esenciales» y con orden por longitud ascendente.
      Comprobado con un test.
- [ ] Un modelo sin la magnitud por la que se ordena aparece al final.
      Comprobado con un test.
- [ ] La leyenda al pie explica la Δ, la polaridad, los litros por metro
      cuadrado y la marca de estimado.
- [ ] `src/ui/FichaTecnicaPage.tsx`, su módulo de estilos, su test y
      `src/domain/technicalSheet.ts` ya no existen, y nada los importa.
- [ ] La cobertura de `src/domain/` sigue al 100 % en líneas, sentencias,
      funciones y ramas, incluida la tabla de polaridad completa, la
      diferencia ausente y cada criterio de orden.
- [ ] `npm run format:check`, `npm run lint`, `npm run typecheck`,
      `npm run arch:check`, `npm run test:coverage` y `npm run build` pasan en
      local antes de dar la spec por implementada.
- [ ] Sobre el build de producción y en un navegador real, a 320, 592, 960 y
      1440 px: no hay desplazamiento horizontal del documento; la columna
      fijada se lee sobre las que pasan por debajo al desplazar; y las
      diferencias se distinguen del valor sin depender del color, comprobado
      mirando la captura en escala de grises.
- [ ] Los tres controles —conjunto de campos, modelo de comparación y orden—
      son alcanzables y manejables con el teclado, y cada uno tiene nombre
      accesible.
- [ ] El sitio desplegado en GitHub Pages sirve `#/ficha` y los dos alias.

## Dependencias y supuestos

- **Depende de `technical/0005`**, que aporta el shell, los papeles de
  dirección (`positive` / `negative`) y el primitivo de tabla que esta vista
  consume. El orden de implementación es aquélla primero; al revés habría que
  escribir dos veces la cabecera que aquélla elimina.
- **Sustituye a `product/0013`.** Esa transición es 🔴 y la hace una persona,
  en el mismo commit del gate que aprueba esta spec. Como `product/0013` nunca
  llegó a consolidarse, su comportamiento no está escrito en ningún doc de
  estado: por eso los requisitos 3 y 6.2 lo recogen literalmente aquí en vez
  de remitir a ella, y por eso congelarla no pierde nada.
- **Enmienda a `product/0014`, no la sustituye.** Su ficha sigue siendo la
  base: bloques, fotos, diálogo, columna fijada y comportamiento móvil quedan
  vigentes. Hay precedente exacto en el repositorio: `product/0016` enmendó a
  `product/0014` sin sustituirla. Las dos se consolidan juntas sobre
  `docs/estado/interfaz.md`.
- **`docs/estado/interfaz.md` no describe hoy ninguna de las tres páginas
  nuevas ni el enrutado por fragmento**, porque `product/0011`, `0013` y
  `0014` están implementadas y sin consolidar. El estado real de partida está
  en el código. La consolidación de esta spec cierra ese hueco para el área
  entera, y no solo para lo que ella cambia.
- Se asume que **una referencia seguirá declarando solo las cinco magnitudes
  dimensionales**. Si algún día declarara más, el requisito 2.5 sigue siendo
  correcto sin tocar nada: la ausencia se decide por celda, no por tipo de
  entidad.
- Se asume que el catálogo seguirá teniendo del orden de una decena de
  modelos. Con dos decenas, la tabla transpuesta necesitaría paginación o
  filtro, y eso sería otra spec.
- Se asume que los tests siguen usando `renderToStaticMarkup`, sin jsdom: los
  criterios que dependen de interacción real —teclado, desplazamiento,
  contraste percibido— están declarados como verificación a mano en navegador.

## Decisiones abiertas

Ninguna.
