# 0009 — La comparativa se lee de un vistazo

- **Id:** product/0009
- **Estado:** approved
- **Tipo:** product
- **Fecha:** 2026-08-06
- **Specs relacionadas:** product/0001, product/0008, product/0010, 0013, technical/0004
- **ADRs relacionados:** 0006
- **Doc de estado:** `docs/estado/interfaz.md`

## Contexto

El comparador muestra hoy toda la información que `product/0001` le exigió
mostrar, y no la muestra jerarquizada. La aplicación no tiene estilos —ni un
`.css` en el repositorio— así que cada dato se ve exactamente igual que
cualquier otro:

- El ranking es una `<ol>` con viñetas de navegador. Cada coche es **un único
  `<button>` cuyo texto concatena** nombre, puntuación, la cadena
  «FUERA DE PRESUPUESTO» en mayúsculas y «(ver desglose)». El nombre del
  coche, el número que decide el orden y una advertencia de presupuesto son
  la misma cadena de texto, con el mismo peso visual.
- Los seis pesos son `input[type="range"]` dentro de `<label>` en línea, sin
  salto entre ellos: se ven amontonados en una fila.
- El desglose de un eje es una sucesión de `<p>`, `<h4>` y `<ul>` anidadas.
  La puntuación del eje, la descripción de la fórmula, las fuentes
  descartadas y las penalizaciones que no aplican comparten tratamiento.
- Nada indica la **proporción**. Una puntuación de 8,4/10 y otra de 3,1/10
  son dos cadenas de longitud parecida; hay que leerlas y compararlas
  mentalmente, una por una, para saber qué eje está tirando de la nota.

Es información completa y auditable —eso ya lo resolvió `product/0001`— pero
ilegible de un vistazo. Y de un vistazo es exactamente como se usa una
comparativa: se abre para ver quién gana y por qué, no para leerla entera.

El comparador viene de un artefacto React de un solo fichero que sí tenía
diseño; `product/0001` se trajo sus fórmulas y su desglose, y dejó el aspecto
fuera de alcance a propósito. Esta spec cierra ese hueco, y lo hace contra una
referencia concreta: el fuente del artefacto, transcrito abajo.

## El artefacto de referencia

El diseño del artefacto original no es un boceto: es un sistema pequeño y
coherente, con siete decisiones que lo sostienen. Se transcriben aquí porque
el artefacto es un fichero suelto fuera del repositorio y **una referencia que
no se puede consultar no es una referencia**.

### La paleta

| Papel en el artefacto | Valor | Uso |
| --- | --- | --- |
| `paper` | `#E9EBE6` | Fondo de la página, y fondo de las cajas anidadas dentro de una tarjeta |
| `card` | `#F3F5F1` | Superficie de tarjeta y de tabla |
| `ink` | `#1A2420` | Texto principal; también fondo de las dos superficies invertidas |
| `mute` | `#6B7A72` | Texto secundario, rótulos, datos de apoyo |
| `rule` | `#C8CFC6` | Líneas, bordes y canal de las barras |
| `accent` | `#14655C` | Acento: líder, barras, valores activos, mejoras |
| `signal` | `#B4551B` | Alerta: fuera de presupuesto, empeoramientos |

Es una paleta de siete papeles, sin tonos crudos: los grises tiran a verde y
el acento es verde petróleo. El acento aparece además al 6-7 % de opacidad
como fondo de la fila líder y de la fila de referencia.

**El artefacto ya se salta su propia paleta**: `#8FA69B` está escrito a mano
dos veces, como texto apagado sobre fondo `ink`, y no existe en la constante
de colores. Es exactamente el octavo color que el gate del requisito 13 de
`technical/0004` existe para impedir, y al migrarlo se convierte en token.

### La tipografía, que es la decisión más característica

**Todo número va en monoespaciada y todo texto en sans.** Puntuaciones,
precios, dimensiones, potencias, aceleraciones, posiciones del ranking y
valores de los deslizadores: monoespaciada. Nombres de coche, rótulos de eje,
prosa y titulares: sans. Las dos son pilas del sistema, sin fuente web que
descargar.

No es un capricho: con cifras de ancho fijo, dos números en columna se pueden
comparar por su longitud sin leerlos, y una tabla de dimensiones se lee como
una tabla y no como una lista de palabras.

Escala tipográfica del artefacto, en píxeles: `30` el titular (interlineado
1,05; espaciado entre letras −0,02em), `22` el nombre del líder, `15` el
nombre de un coche y su puntuación, `13` el texto de un control, `11` la
letra pequeña, `10,5`-`11,5` los datos monoespaciados, `10` el rótulo
`Label`, `9,5` la cabecera de la tabla.

### Los primitivos que ya existen en el artefacto

- **`Label`** — rótulo de sección: monoespaciada, 10 px, versalitas por
  `text-transform`, espaciado entre letras 0,14em, color `mute`. Aparece
  siete veces. Es el primitivo que marca dónde empieza cada bloque.
- **`Slider`** — etiqueta a la izquierda, **valor a la derecha en
  monoespaciada y en color acento**, y el control debajo a todo el ancho. El
  valor se apaga a `mute` cuando vale 0, de modo que un eje desactivado se ve
  desactivado.
- **La barra de proporción** — canal en `rule`, relleno en `accent`, radio 2.
  Aparece en dos tamaños: 3 px bajo cada fila del ranking, 6 px por eje en el
  desglose. En el desglose, el relleno se apaga a `rule` cuando el peso del
  eje es 0.
- **La tarjeta** — fondo `card`, borde de 1 px en `rule`, radio 4, relleno
  16. Es la unidad de agrupación de los dos paneles de control.
- **La superficie invertida** — fondo `ink`, texto `paper`. Se usa una sola
  vez, para la tarjeta del líder, y esa unicidad es lo que la hace destacar.

### La composición

Una sola columna de **560 px de ancho máximo**, centrada, sobre fondo
`paper`, con relleno `20px 16px 48px`. En orden: rótulo superior, titular,
párrafo que explica el modelo, conmutador de dos vistas, tarjeta del líder,
panel de pesos, panel de supuestos y presupuesto, y la clasificación.

### La fila de la clasificación

Es la pieza más trabajada del artefacto, y concentra seis datos sin
amontonarlos:

1. **La posición**, en monoespaciada y con cero a la izquierda —`01`, `02`—,
   en un hueco de ancho fijo. El `01` va en color acento.
2. **El nombre del coche**, en sans y seminegrita.
3. **Una línea de datos de apoyo** en monoespaciada pequeña y color `mute`:
   tecnología, potencia, aceleración y precio, separados por `·`.
4. **La marca de fuera de presupuesto**, en `signal` y negrita, al final de
   esa misma línea.
5. **La puntuación**, alineada a la derecha, en monoespaciada grande y
   negrita, en acento si es la primera.
6. **La barra de proporción** de 3 px cruzando el ancho de la fila, con
   transición de 0,35 s.

La fila del líder lleva además fondo de acento al 6 %.

### Lo que el artefacto hace y esta spec no copia

- **La puntuación se muestra como porcentaje sobre 100**, no como suma de
  aportaciones: `total / (10 × Σ pesos) × 100`. Ver el requisito 3.
- **La aceleración estimada se marca con una tilde pegada a la cifra**
  —`11.1s~`—, y la altura libre estimada con una tilde delante. Es una
  convención de una sola letra, sin leyenda: ver el requisito 13.
- **El párrafo de cabecera explica el modelo entero** en seis líneas. Es el
  antecesor de `product/0011`, y con seis ejes y doce anclajes ya no cabe en
  un párrafo.
- **Dos incoherencias que no se migran**: el párrafo dice «12 candidatos»
  cuando la lista tiene once, y «los cinco ejes» cuando son seis. Se
  transcriben aquí para que nadie las reintroduzca creyendo que son fieles al
  original.

## Objetivo

Que quien abra el comparador vea en segundos qué coche gana, por cuánto y en
qué ejes se decide, sin leer el desglose completo de nadie.

## Alcance

- **Jerarquía visual del ranking.** El nombre del coche y su puntuación como
  elementos distintos y con pesos visuales distintos, no como una cadena.
- **La posición en el ranking, visible.** Hoy la da el orden de la lista y una
  viñeta de navegador.
- **La proporción, representada.** Una barra por eje en el desglose y una
  representación de la puntuación total en la fila, de forma que comparar dos
  coches no exija leer dos números.
- **El estado «fuera de presupuesto» como marca visual**, con su color y su
  texto accesible, en vez de una cadena en mayúsculas sostenidas embutida en
  el rótulo de un botón.
- **El desglose por eje, estructurado**: cabecera del eje, datos de entrada,
  supuestos, pasos intermedios, normalización y penalizaciones como bloques
  distinguibles, con el dato principal destacado y la letra pequeña como
  letra pequeña.
- **Los controles, usables**: los seis pesos como una lista legible con su
  valor visible, los supuestos agrupados, y los deslizadores de valoración
  del desglose con su valor y su rango claros.
- **La etiqueta de tecnología** que `product/0008` introduce, con sitio propio
  en la fila. Esta spec no la inventa: le da un lugar en la jerarquía.
- **La distinción visual entre dato verificado y dato estimado**, que hoy es
  la palabra «(estimado)» al final de una línea.
- **La paleta, la tipografía y los primitivos del artefacto**, transcritos
  arriba, como valores concretos de los tokens que `technical/0004` declara.
- **La tarjeta del líder** del artefacto: la única superficie invertida de la
  interfaz, que dice quién gana antes de que haya que leer la lista.

## Fuera de alcance

- **Cambiar cualquier puntuación.** Ni fórmulas, ni escalas, ni pesos, ni
  supuestos por defecto. Este cambio es de presentación, y el criterio de
  aceptación que lo comprueba es obligatorio.
- **Quitar información del desglose.** `product/0001` decidió qué se muestra
  y por qué; esta spec decide cómo se ve. Nada de lo que hoy aparece
  desaparece: lo que estorba se subordina, no se elimina.
- **El comportamiento en cada tamaño de pantalla.** Es `product/0010`. Aquí
  se diseña la jerarquía; allí se decide cómo sobrevive a 320 px y a 1440 px.
- **La página que explica cómo se calcula todo.** Es `product/0011`.
- **Persistir o compartir la configuración.** Es `product/0012`.
- **La vista de ficha técnica del artefacto** —la tabla comparada con la
  Giulietta como referencia— y el conmutador entre las dos vistas. Es
  `product/0013`: tiene datos que el catálogo no trae y una métrica derivada
  que el dominio no calcula, así que no cabe aquí.
- **El andamiaje de estilos** —tokens, módulos, primitivos, gate de CI—, que
  es `technical/0004`. Esta spec consume esos tokens; no los monta.
- **Comparar dos coches en paralelo, filtrar por tecnología, o cualquier
  funcionalidad nueva.** Se ve mejor lo que ya hay; no se añade nada que
  hacer.
- **Iconografía, ilustración o imágenes de los coches.** El catálogo no trae
  imágenes y conseguirlas es otro trabajo, con sus derechos de uso.
- **Animaciones y transiciones más allá de las que un cambio de estado
  necesite para no dar un salto seco.** Y las que haya respetan
  `prefers-reduced-motion`, que `technical/0004` impone globalmente.

## Requisitos / comportamiento esperado

1. En una fila del ranking, el **nombre del coche**, su **puntuación total**,
   su **posición**, su **etiqueta de tecnología** y su **estado de
   presupuesto** son elementos distintos del marcado, cada uno con su propio
   tratamiento visual. Ninguno se obtiene concatenando texto de otro.
2. La **puntuación total es el elemento más destacado** de la fila después
   del nombre, y su tratamiento es idéntico en todas las filas: lo que
   distingue a un 7,9 de un 4,2 es el número, no el estilo.
3. **La puntuación de la fila se muestra como porcentaje sobre 100**, igual
   que en el artefacto: `total / (10 × Σ pesos) × 100`. Hoy la fila enseña la
   suma de aportaciones —«43,2 puntos»—, que depende de los pesos elegidos y
   por tanto no se puede comparar con nada. El porcentaje sí tiene techo fijo,
   y ese techo es lo que lo hace legible. **El cálculo lo hace el dominio, no
   la interfaz**: `CarScoreBreakdown` gana un campo derivado del `total` y de
   los pesos, y `src/ui/` lo renderiza. Es la única forma compatible con la
   regla de que la interfaz no calcula.
4. La fila representa la puntuación también **de forma no numérica** —la
   barra de 3 px del artefacto, con su canal en `rule` y su relleno en
   `accent`— de modo que la distancia entre el primero y el último se aprecie
   sin leer.
5. **La posición en el ranking se muestra en monoespaciada, con cero a la
   izquierda** y en un hueco de ancho fijo, para que las dos cifras de `10` y
   `11` no desplacen el nombre del coche respecto a las demás filas.
6. **Existe una tarjeta del líder**, con la superficie invertida del
   artefacto, que nombra al primer clasificado con los pesos vigentes y su
   puntuación. Es la **única** superficie invertida de la interfaz: si se usa
   dos veces, deja de señalar nada.
7. **Todo número va en monoespaciada y todo texto en sans**, con las pilas del
   sistema y sin fuente web. Es la decisión tipográfica del artefacto y la que
   hace comparables dos cifras en columna.
8. **El estado «fuera de presupuesto» es una marca visual** con su propio
   texto legible, situada fuera del rótulo del control que despliega el
   desglose. La marca no depende **solo** del color: lleva texto, forma o
   ambos, para que sea perceptible sin distinguir colores. El artefacto la
   resuelve con texto en `signal` y negrita, y esa es la referencia.
9. **Desplegar el desglose es una acción explícita y evidente**, con su
   estado —desplegado o plegado— comunicado por `aria-expanded` además de
   visualmente. El artefacto lo resuelve con un `onClick` sobre un `div`, que
   **no** se migra: la zona de despliegue es un control real, alcanzable con
   teclado.
10. Dentro del desglose, **cada eje es un bloque delimitado** con: cabecera
    (nombre del eje, peso, puntuación sobre 10, aportación al total), y a
    continuación los grupos que hoy renderiza `AxisBreakdownView` —datos de
    entrada, supuestos aplicados, información, pasos intermedios, escala o
    normalización, penalizaciones— visualmente distinguibles entre sí.
    **La escala es ahora el grupo que más importa.** Desde que la fase 3
    cerró, cada magnitud lleva sus dos anclajes —«620 L → 10, 250 L → 0»— en
    vez de un mínimo y un máximo del conjunto. Es lo que convierte la nota en
    interpretable, y hoy se lee como una línea de texto entre paréntesis.
    `normalization` sigue en el tipo y ya no lo usa ningún eje: el diseño no
    le reserva sitio destacado, pero tampoco puede romperse si algún día
    reaparece.
11. **Cada eje muestra su puntuación como barra sobre la escala 0-10** —la
    barra de 6 px del artefacto—, con la escala implícita en la propia barra.
    La barra acompaña al número; no lo sustituye. **Un eje con peso 0 se ve
    apagado**: el artefacto apaga el relleno a `rule`, y así se distingue de
    un eje que puntúa bajo.
12. **El texto secundario se ve como secundario**: la descripción de la
    fórmula, las fuentes descartadas con su motivo, y la línea «No aplican a
    este eje.» de las penalizaciones ocupan un nivel tipográfico por debajo
    del dato al que acompañan.
13. **Un dato estimado se distingue de uno verificado por algo más que la
    palabra entre paréntesis**, y esa distinción tiene su equivalente textual
    para quien no la perciba visualmente. La tilde del artefacto —`11.1s~`—
    es el punto de partida, **pero sin leyenda no significa nada para quien la
    ve por primera vez**: se migra con su explicación accesible, no sola.
14. **Los seis controles de peso se leen como una lista**, uno por línea, cada
    uno con el nombre de su eje y su valor numérico actual visible junto al
    deslizador, en el orden de `AXIS_ORDER`. El valor va a la derecha, en
    monoespaciada y en acento, **apagado a `mute` cuando el peso es 0**, como
    en el artefacto.
15. **Los supuestos globales y el presupuesto siguen siendo un único punto de
    edición**, ahora agrupado visualmente como tal —las dos tarjetas del
    artefacto: «Pesos de decisión» y «Supuestos de coste y presupuesto»—. La
    regla de `product/0001` —los desgloses muestran el valor aplicado y no
    ofrecen edición propia— sigue vigente y esta spec no la toca.
16. **El aviso de fallo de carga del catálogo tiene tratamiento de error**:
    hoy es un `<p role="alert">` sin estilo. Conserva su `role="alert"`.
17. **Ninguna puntuación cambia por efecto de esta spec.** Ningún módulo de
    `src/ui/` gana lógica de cálculo, y la regla `ui-no-scoring-internals`
    sigue pasando sin modificar. El porcentaje del requisito 3 es un campo
    **del dominio**, y por eso no es una excepción a esta regla.
18. **El contraste de texto cumple WCAG AA** —4,5:1 para texto normal, 3:1
    para texto grande y para los elementos gráficos que transmiten
    información, como las barras—. La paleta del artefacto se comprueba, no
    se supone: si algún par no llega, **se ajusta el token y se registra el
    ajuste**, porque un diseño bonito e ilegible no cumple esta spec.

## Criterios de aceptación

> Obligatorios y verificables.

- [ ] La puntuación total de los once candidatos, con los pesos y supuestos
      por defecto, es **idéntica** antes y después del cambio. Se comprueba
      con un test sobre `scoreCatalog`, no mirando la pantalla.
- [ ] El porcentaje del requisito 3 lo calcula el dominio: existe un test que
      comprueba que con todos los pesos a 0 no se divide por cero, y que un
      coche que sacara 10 en los seis ejes daría 100.
- [ ] `npm run arch:check` sigue pasando y `.dependency-cruiser.mjs` no se ha
      modificado.
- [ ] Todo número visible de la interfaz se renderiza en la familia
      monoespaciada y todo texto en la sans. Se recorre la interfaz a mano,
      con el desglose de un coche abierto.
- [ ] Existe **una sola** superficie invertida en toda la interfaz: la
      tarjeta del líder.
- [ ] Con un peso a 0, la barra de ese eje en el desglose y su valor en el
      control se ven apagados, y se distinguen de un eje con peso alto y
      puntuación baja.
- [ ] Las filas del ranking mantienen alineados los nombres de coche entre la
      posición `09` y la `10`: el hueco de la posición es de ancho fijo.
- [ ] El rótulo del control que despliega el desglose **no contiene** la
      puntuación, ni la cadena «FUERA DE PRESUPUESTO», ni la etiqueta de
      tecnología: cada uno vive en su propio elemento.
- [ ] Un coche fuera de presupuesto se distingue de uno dentro **con el
      navegador en escala de grises**. Verificación a mano, declarada como
      tal.
- [ ] El control de despliegue expone `aria-expanded` con el valor correcto
      en los dos estados. Comprobable con `renderToStaticMarkup`.
- [ ] Con el desglose abierto, cada uno de los seis ejes presenta una barra
      cuya longitud es proporcional a su puntuación sobre 10, y el eje con
      mayor puntuación tiene la barra más larga.
- [ ] Los dos anclajes de cada magnitud se leen sin buscarlos dentro de una
      frase: el valor que vale 10 y el que vale 0 son elementos propios, no
      texto entre paréntesis.
- [ ] Los seis controles de peso aparecen uno por línea, y cada uno muestra
      su valor numérico actual sin necesidad de interactuar.
- [ ] Ningún componente de `src/ui/` contiene un literal de color, espaciado
      o tamaño de fuente: todos salen de los tokens de `technical/0004`.
- [ ] El contraste de todo texto sobre su fondo es ≥ 4,5:1 (≥ 3:1 para texto
      grande y para las barras), medido con una herramienta de contraste
      sobre el build de producción. **Se miden explícitamente los cinco pares
      de la paleta del artefacto**: `mute` sobre `card`, `mute` sobre `paper`,
      `accent` sobre `card`, `signal` sobre `card` y el apagado sobre `ink` de
      la tarjeta del líder. Los que no lleguen se ajustan y se anota el ajuste.
- [ ] Navegando solo con teclado se llega a todos los controles, se despliega
      y se pliega un desglose, y se mueve un peso, con el foco visible en
      todo momento.
- [ ] La aplicación sigue mostrando el aviso de fallo de carga —y solo el
      aviso— cuando el catálogo no carga. El test existente de `App.test.tsx`
      que lo comprueba sigue pasando sin modificar su aserción.
- [ ] Toda la información que `product/0001` exigía en el desglose sigue
      presente: se recorre su lista de criterios y se comprueba uno a uno
      contra la interfaz nueva.
- [ ] `npm run format:check`, `npm run lint`, `npm run typecheck`,
      `npm run arch:check`, `npm run test:coverage` y `npm run build` pasan
      en local.

## Dependencias y supuestos

- **Depende de `technical/0004`**, que monta los tokens y los primitivos que
  esta spec consume. Implementar el diseño antes que el andamiaje significa
  escribir literales que luego habrá que reemplazar.
- **Depende del ADR 0006** en el sentido de que su enfoque de estilos es el
  que se aplica. Si el gate lo cambia, los criterios sobre literales y tokens
  cambian con él; los criterios sobre jerarquía, contraste y teclado no.
- **La fase 3 ya cerró**, así que el desglose que esta spec estructura es el
  definitivo: seis ejes en escala absoluta, con su campo `scale` en el
  desglose. Nunca fue una dependencia —las escalas cambian los números que se
  enseñan, no su estructura—, pero implementar el diseño sobre el modelo ya
  estable ahorra revisarlo dos veces.
- **Se relaciona con `product/0008`** pero no lo bloquea ni lo requiere: si
  `0008` ya está implementado, esta spec le da sitio en la jerarquía; si no,
  el sitio queda reservado y `0008` lo ocupa después.
- Se asume que los tests de interfaz siguen siendo `renderToStaticMarkup` sin
  jsdom. Por eso los criterios se dividen explícitamente en comprobables por
  test —marcado, `aria-expanded`, ausencia de literales, puntuaciones— y
  verificables a mano en navegador —contraste, escala de grises, foco,
  teclado—. Ninguno finge ser automático sin serlo.
- Se asume que el catálogo sigue teniendo once candidatos y que el ranking
  cabe entero en una lista, sin paginación ni virtualización.
- **La referencia de diseño es el fuente del artefacto**, transcrito en la
  sección *El artefacto de referencia*. La transcripción es la referencia
  vigente a efectos de esta spec: el fichero original vive fuera del
  repositorio y no se puede consultar desde aquí.
- El requisito 3 **toca el dominio**, no solo la interfaz: es el único punto
  de esta spec que no es puramente presentacional, y está así por la regla de
  que `src/ui/` no calcula. Su coste es un campo nuevo en `CarScoreBreakdown`
  y su test.

## Decisiones abiertas

Ninguna.
