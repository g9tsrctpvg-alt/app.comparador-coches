# 0009 — La comparativa se lee de un vistazo

- **Id:** product/0009
- **Estado:** draft
- **Tipo:** product
- **Fecha:** 2026-08-06
- **Specs relacionadas:** product/0001, product/0008, product/0010, technical/0004
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
fuera de alcance a propósito. Esta spec cierra ese hueco.

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
3. La fila representa la puntuación total también **de forma no numérica**
   —una barra, una proporción— de modo que la distancia entre el primero y el
   último se aprecie sin leer.
4. **El estado «fuera de presupuesto» es una marca visual** con su propio
   texto legible, situada fuera del rótulo del control que despliega el
   desglose. La marca no depende **solo** del color: lleva texto, forma o
   ambos, para que sea perceptible sin distinguir colores.
5. **Desplegar el desglose es una acción explícita y evidente**, con su
   estado —desplegado o plegado— comunicado por `aria-expanded` además de
   visualmente.
6. Dentro del desglose, **cada eje es un bloque delimitado** con: cabecera
   (nombre del eje, peso, puntuación sobre 10, aportación al total), y a
   continuación los grupos que `product/0001` fijó —datos de entrada,
   supuestos aplicados, pasos intermedios, normalización, penalizaciones—
   visualmente distinguibles entre sí.
7. **Cada eje muestra su puntuación como barra sobre la escala 0-10**, con la
   escala implícita en la propia barra. La barra acompaña al número; no lo
   sustituye.
8. **El texto secundario se ve como secundario**: la descripción de la
   fórmula, las fuentes descartadas con su motivo, y la línea «No aplican a
   este eje.» de las penalizaciones ocupan un nivel tipográfico por debajo
   del dato al que acompañan.
9. **Un dato estimado se distingue de uno verificado por algo más que la
   palabra entre paréntesis**, y esa distinción tiene su equivalente textual
   para quien no la perciba visualmente.
10. **Los seis controles de peso se leen como una lista**, uno por línea, cada
    uno con el nombre de su eje y su valor numérico actual visible junto al
    deslizador, en el orden de `AXIS_ORDER`.
11. **Los supuestos globales y el presupuesto siguen siendo un único punto de
    edición**, ahora agrupado visualmente como tal. La regla de `product/0001`
    —los desgloses muestran el valor aplicado y no ofrecen edición propia—
    sigue vigente y esta spec no la toca.
12. **El aviso de fallo de carga del catálogo tiene tratamiento de error**:
    hoy es un `<p role="alert">` sin estilo. Conserva su `role="alert"`.
13. **Ninguna puntuación cambia por efecto de esta spec.** Ningún módulo de
    `src/ui/` gana lógica de cálculo, y la regla `ui-no-scoring-internals`
    sigue pasando sin modificar.
14. **El contraste de texto cumple WCAG AA** —4,5:1 para texto normal, 3:1
    para texto grande y para los elementos gráficos que transmiten
    información, como las barras— en el esquema claro y en el oscuro.

## Criterios de aceptación

> Obligatorios y verificables.

- [ ] La puntuación total de los once candidatos, con los pesos y supuestos
      por defecto, es **idéntica** antes y después del cambio. Se comprueba
      con un test sobre `scoreCatalog`, no mirando la pantalla.
- [ ] `npm run arch:check` sigue pasando y `.dependency-cruiser.mjs` no se ha
      modificado.
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
- [ ] Los seis controles de peso aparecen uno por línea, y cada uno muestra
      su valor numérico actual sin necesidad de interactuar.
- [ ] Ningún componente de `src/ui/` contiene un literal de color, espaciado
      o tamaño de fuente: todos salen de los tokens de `technical/0004`.
- [ ] El contraste de todo texto sobre su fondo es ≥ 4,5:1 (≥ 3:1 para texto
      grande y para las barras), medido con una herramienta de contraste
      sobre el build de producción, en esquema claro y oscuro.
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
- **No depende de la fase 3.** Las escalas absolutas cambian los números que
  el desglose enseña, no su estructura. Esta spec puede implementarse antes o
  después de que los ejes migren.
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

## Decisiones abiertas

1. **El artefacto original no está disponible en el repositorio.** Se
   compartió como referencia de diseño para esta fase, pero el fichero que
   llegó era un alias de macOS —un marcador de 2,4 kB sin contenido—, no el
   `.tsx`. Esta spec está escrita **sin verlo**, en términos de qué tiene que
   quedar legible y comprobable, que es como debe estar escrita de todos
   modos. Pero la paleta, la tipografía y la composición concretas del
   artefacto siguen siendo la referencia declarada de la fase 4, y hoy no
   están en ningún sitio. **Antes de aprobar**: o se adjunta el fuente del
   artefacto al repositorio como referencia, o se declara explícitamente que
   el diseño se decide de cero y la referencia deja de existir. Las dos
   salidas son válidas; lo que no vale es aprobar creyendo que la referencia
   está disponible.
2. **Si la paleta del esquema oscuro se decide aquí o en `technical/0004`.**
   Es la otra cara de la decisión abierta 2 de aquella spec, y se cierra a la
   vez que ella, en el mismo sentido.
