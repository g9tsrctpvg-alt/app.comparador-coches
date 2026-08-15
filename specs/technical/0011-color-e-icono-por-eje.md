# 0011 — Color e icono por eje

- **Id:** technical/0011
- **Estado:** implemented
- **Tipo:** technical
- **Fecha:** 2026-08-15
- **Specs relacionadas:** product/0009, product/0010, product/0011,
  technical/0004, technical/0005, technical/0009
- **ADRs relacionados:** 0006
- **Doc de estado:** `docs/estado/interfaz.md`

> ⚠️ **Spec histórica — implementada, sin consolidar.** Su *Contexto* retrata
> el sistema anterior al cambio. Para el estado actual, ver
> `docs/estado/interfaz.md`.

## Contexto

La aplicación es gris, y no es una impresión: es la proporción. Contando usos
de token de color en `src/ui/`, hay **67 neutros** —`ink` 39, `rule` 16,
`mute` 12— frente a **22 del acento** y **5 del naranja de alerta**. Es decir,
un solo tono cromático real en toda la interfaz.

Los seis ejes son el sitio donde más se nota. `viaje`, `diario`,
`prestaciones`, `fiabilidad`, `estetica` y `coste` se pintan en cuatro sitios
—las tarjetas de `#/explicacion`, los deslizadores de peso, el desglose por eje
de cada coche y la fila del ranking— y **en los cuatro con el mismo verde**.
Qué eje se está mirando lo dice solo el texto; el color no aporta nada, y en un
desglose de seis bloques idénticos eso obliga a leer el rótulo cada vez.

No hay un solo icono en la aplicación. La única forma dibujada es la curva en S
de `SCurveChart`, que sí es SVG en línea con sus clases en un módulo CSS.

`technical/0009` afinó superficies y controles y `technical/0010` rehízo la
barra de la ficha; ninguna de las dos tocó el color, a propósito. Ésta sí.

## Objetivo

Que el color **signifique qué eje es** en lugar de decorar, y que cada eje se
reconozca de un vistazo por un icono propio — sin que ninguna información
dependa del color para poder leerse.

## Alcance

1. Seis tonos de eje y sus seis tintes, en `src/styles/global.css`.
2. Un mecanismo de tema por eje que no meta literales en ningún módulo y no
   toque el dominio: `src/ui/axisTheme.module.css` y `src/ui/axisTheme.ts`.
3. Seis iconos SVG en línea, uno por eje: `src/ui/components/AxisIcon.tsx`.
4. El consumo en los tres sitios que sí son un eje: `ExplicacionPage`,
   `WeightSliders` y `AxisBreakdownView`.
5. Los pares de contraste nuevos en `scripts/validateContrast.ts`.
6. La enmienda a la paleta de siete papeles de `product/0009`.

## Fuera de alcance

- **La barra del ranking** (`RankingRow`). Su barra es la puntuación **total**,
  no un eje: teñirla del color de un eje sería decir algo falso. Se queda en
  acento, y el mecanismo se diseña para que siga igual sin tocar el fichero.
- **La atmósfera de las superficies** —cabecera, degradado de página, tarjeta
  de líder, titulares de sección—. Es color sin significado nuevo y va en
  `technical/0012`, para que esta spec se pueda verificar por sí sola.
- **La escala tipográfica.** `--font-size-2xl` y `--font-size-lg` siguen sin
  consumidor y siguen anotados como deuda en `docs/roadmap.md`. Mezclar
  jerarquía de texto con color es justo lo que `technical/0009` evitó.
- **Cualquier cambio de puntuación.** Ningún módulo de `src/ui/` gana lógica de
  cálculo y ninguna nota se mueve.

## Requisitos / comportamiento esperado

### 1. La paleta de eje

1.1. Seis tokens nuevos en `src/styles/global.css`, con estos valores, que
**salen de medir y no de elegir**:

| Eje | Token | Valor | `card` | `paper` |
| --- | --- | --- | --- | --- |
| `viaje` | `--color-axis-viaje` | `#2a6f8f` azul | 5,23:1 | 4,77:1 |
| `diario` | `--color-axis-diario` | `#14655c` teal | 6,47:1 | 5,90:1 |
| `prestaciones` | `--color-axis-prestaciones` | `#8e2f45` carmín | 7,45:1 | 6,80:1 |
| `fiabilidad` | `--color-axis-fiabilidad` | `#31417a` índigo | 9,09:1 | 8,29:1 |
| `estetica` | `--color-axis-estetica` | `#8d4784` ciruela | 5,85:1 | 5,34:1 |
| `coste` | `--color-axis-coste` | `#7d6417` ocre | 5,31:1 | 4,85:1 |

Los doce valores están por encima de 4,5:1, el umbral de texto normal de WCAG
AA 1.4.3. El más justo es `viaje` sobre `paper`, a 4,77:1.

1.2. **`diario` reutiliza el valor exacto del acento.** Es el eje del uso de
todos los días; gastar un tono nuevo en él no compraba nada. Es un token
propio con el mismo valor, no un alias: la misma razón por la que
`--color-positive` existe aparte de `--color-accent` (`technical/0005`,
requisito 1.6).

1.3. **La luminosidad se separa a propósito**: L\* de 29 a 44, en vez de los
35-39 que salían de igualar los seis tonos. Con los seis a la misma
luminosidad, el peor par bajo protanopia caía a **ΔE 5,2**; abriendo el rango
sube a **10,1**. La separación de luminosidad es el único recurso que
sobrevive a una deficiencia de visión del color, y por eso manda sobre la
uniformidad estética.

1.4. **`prestaciones` es carmín y no terracota.** El candidato natural
(`#8f3a34`, rojo tierra) quedaba a **ΔE 24,5** del naranja de alerta
`--color-signal`, con el que comparte pantalla en las celdas Δ del desglose:
un rojo de eje confundible con «este coche empeora» es un bug de diseño.
`#8e2f45` lo aleja a **ΔE 38,7** sin perder contraste — de hecho sube a
7,45:1.

1.5. **No hay tinte por eje.** Este requisito declaraba seis tintes al 8 %
para teñir el fondo de la tarjeta de cada eje. Al implementarlo se retiraron,
en vez de dejarlos declarados sin consumidor, por dos razones que solo se ven
con el diseño delante:

- Los pares de `scripts/validateContrast.ts` miden el texto contra `card`.
  Teñir esa tarjeta cambia el fondo real de todo el texto que lleva encima
  —`mute` sobre `card` está a 4,81:1, con poco margen—, así que un tinte no es
  decorativo: obliga a recalcular los pares contra el resultado compuesto.
- Con el filete, el icono, la barra y la nota ya llevando color, seis tarjetas
  seguidas con el fondo teñido era más color del que este cambio pretende.

La razón queda escrita en `global.css`, donde estaban los tokens, para que el
próximo que quiera un tinte sepa qué trabajo trae de la mano.

### 2. El color nunca sustituye al texto

2.1. **Ningún dato queda codificado solo por color.** El nombre del eje
aparece siempre en texto real junto a su color y junto a su icono. Un usuario
que no distinga dos de los seis tonos no pierde ninguna información.

2.2. Esta regla se escribe ahora porque hasta hoy no hacía falta: con un solo
tono cromático no había nada que confundir. El peor par de esta paleta bajo
deuteranopia es **ΔE 8,0** (`viaje`/`estetica`), suficiente para distinguirlos
en superficies contiguas y no para jugárselo todo a ellos.

### 3. El mecanismo, sin literales y sin tocar el dominio

3.1. `src/ui/axisTheme.module.css` declara una clase por eje, y cada clase
declara **una sola custom property local**: `--axis-color`, apuntando a su
token global. Ningún literal, así que `scripts/validateStyleTokens.ts` sigue
pasando sin excepciones.

3.2. `src/ui/axisTheme.ts` expone un `Record<AxisId, string>` de `axisId` al
nombre de clase. Es el mismo patrón que `src/ui/technologyLabels.ts`: un mapa
**de interfaz** sobre un id **de dominio**, que ya tiene precedente y razón
escrita.

3.3. **Ningún componente necesita datos nuevos.** `AxisBreakdown` ya expone
`axisId` (`src/domain/scoring/breakdown.ts`), y `ExplicacionPage` y
`WeightSliders` ya iteran `AXIS_ORDER`. La regla `ui-no-scoring-internals`
sigue pasando sin modificar.

3.4. Los consumidores leen `var(--axis-color)`. El relleno de barra de
`primitives.module.css` pasa a `background: var(--axis-color, var(--color-accent))`:
**con respaldo**, para que los sitios sin eje —la barra del ranking, los seis
deslizadores de supuestos— sigan exactamente igual sin tocar su fichero.

3.5. **El color de eje no se puede pintar con un borde sobre un `card`.** El
primitivo `card` se emite en el CSS final **después** que los módulos que lo
componen, así que su `border` y su `background` ganan a lo que declare quien lo
compone — es la misma trampa que `primitives.module.css` ya documenta para
`padding` y `margin`. Medido: la primera versión pintaba el filete con
`border-left` y salía a 1px y en gris, con `--axis-color` correctamente
resuelto en el mismo elemento. El filete va en un `::before` posicionado, que
no compite en esa cascada y además no mueve el relleno de la tarjeta.

### 4. Dónde aterriza el color

4.1. **`ExplicacionPage`**: cada una de las seis `.axisBlock` recibe su clase
de tema, un filete izquierdo en `--axis-color` y el icono junto al `<h3>`. Las
seis filas de la lista de pesos reciben el mismo tema, con su icono y su cifra
en el color del eje.

Este requisito decía también «el índice de ejes». **No existe tal índice**: el
`<nav>` de la página es su tabla de contenidos, con una entrada por sección
—`Los seis ejes`, `Los pesos`, `Supuestos globales`…— y ninguna por eje.
Teñir una entrada que dice «Los seis ejes» de uno de los seis colores diría
algo falso, así que el índice se queda como está.

4.2. **`WeightSliders`**: cada fila recibe su clase de tema, con el icono junto
al nombre del eje, la cifra del peso y el pulgar del deslizador en
`--axis-color`.

4.3. **`AxisBreakdownView`**: cada bloque recibe su clase de tema; el filete,
la barra de proporción, la nota del eje y el icono van en `--axis-color`. La
nota entra aquí y no estaba en la versión aprobada: es la cifra de la que va
el bloque entero y dejarla en acento la desemparejaba de su propia barra.

4.4. **`RankingRow` no cambia.** Requisito de no hacer, no de hacer.

4.5. El estado apagado de peso 0 sigue mandando sobre el color de eje: un eje
con peso 0 se pinta apagado, como hoy, porque «este eje no cuenta» es más
importante que «este eje es el azul».

### 5. Los iconos

5.1. `src/ui/components/AxisIcon.tsx`, un componente que despacha por `axisId`,
siguiendo el patrón de `SCurveChart.tsx`: SVG en línea con clase de módulo CSS.

5.2. Todos comparten forma: `viewBox="0 0 24 24"`, `fill="none"`,
`stroke="currentColor"`, un solo grosor de trazo, extremos redondeados. El
color entra por `color: var(--axis-color)` heredado del contenedor, no por un
atributo.

5.3. **`aria-hidden="true"` siempre.** El nombre del eje está al lado en texto
real; un icono que anunciara su forma solo duplicaría ese nombre en el lector
de pantalla.

5.4. Formas: `viaje` maleta · `diario` volante · `prestaciones`
cuentarrevoluciones · `fiabilidad` escudo · `estetica` rombo · `coste` moneda.

5.5. Ningún icono cambia la altura de una fila ni reduce un objetivo táctil por
debajo de los 44px de `product/0010`, requisito 8, ni provoca desplazamiento
horizontal del documento a ninguna anchura (`product/0010`, requisito 13).

### 6. El gate de contraste crece con la paleta

6.1. `DECLARED_PAIRS` de `scripts/validateContrast.ts` gana **doce pares**:
cada uno de los seis tonos sobre `card` y sobre `paper`, al umbral `normal` de
4,5:1. Hoy ninguno se usa en texto pequeño, pero declararlos al umbral estricto
deja escrito el margen y convierte en mecánica la garantía del requisito 1.1.

### 7. La paleta deja de ser de siete papeles

7.1. `product/0009` describe «una paleta de siete papeles» y el gate del
requisito 13 de `technical/0004` existe para impedir el octavo color. Esta spec
**amplía deliberadamente esa paleta** de siete papeles a trece: los siete
originales más los seis de eje.

7.2. `product/0009` está `consolidated` y **no se edita**. La enmienda se
registra aquí y se consolida en `docs/estado/interfaz.md`, que es donde se lee
cómo es la paleta hoy.

7.3. Lo que **no** cambia es la regla que hay detrás del gate: todo literal de
color sigue viviendo en `src/styles/global.css` y nada más. Se amplía la
paleta, no la libertad de saltársela.

## Criterios de aceptación

> Obligatorios y verificables.

- [x] Los seis tokens existen en `src/styles/global.css` con los valores del
      requisito 1.1, y la suite los verifica contra el umbral de 4,5:1 mediante
      los doce pares nuevos de `DECLARED_PAIRS`. Un par cuyo token no exista es
      un error del validador, no un salto silencioso, así que que pase prueba
      además que los seis tokens están.
- [x] `scripts/validateStyleTokens.ts` sigue pasando: ningún `.module.css` de
      `src/ui/` contiene un literal de color, incluidos los tres ficheros
      nuevos.
- [x] Los seis ejes rinden su clase de tema en los tres sitios del requisito 4,
      con `renderToStaticMarkup`: `ExplicacionPage.test.tsx` (dos apariciones
      por eje: tarjeta y fila de peso), `WeightSliders.test.tsx` (una por eje) y
      `AxisBreakdownView.test.tsx`, que además comprueba que **ningún otro eje
      se cuela** en el marcado de un bloque.
- [x] `AxisIcon` rinde un `<svg>` para cada uno de los seis ejes, todos con
      `aria-hidden="true"`, ninguno con `aria-label` ni `<title>`, y los seis
      con dibujo distinto. `AxisIcon.test.tsx` recorre `AXIS_ORDER`, no una
      lista propia.
- [x] El mapa de `axisTheme.ts` cubre `AXIS_ORDER` entero, no tiene claves de
      más y da a cada eje una clase distinta (`axisTheme.test.ts`).
- [x] La barra de `RankingRow` sigue pintándose en acento: su fichero no
      aparece en el diff. Medido además en pantalla: los seis deslizadores de
      supuestos, que tampoco son ejes, siguen en `rgb(20, 101, 92)`.
- [x] La cobertura sigue al 100 % en líneas, sentencias, funciones y ramas
      (394 sentencias, 184 ramas, 71 funciones), con 387 tests en verde.
- [x] Medido en navegador real sobre el build a 320, 390, 768 y 1440px: los
      seis filetes y los seis iconos salen con **seis colores distintos** y
      coincidentes entre sí, las seis barras del desglose también, el
      desbordamiento horizontal del documento es **0px** en las cuatro
      anchuras, y el objetivo táctil de los deslizadores se queda en **44px**
      —el mínimo de `product/0010`, requisito 8— con los iconos a 20px.
- [x] La CI entera pasa en local: `format:check`, `lint`, `typecheck`,
      `arch:check`, `test:coverage`, `build`.

## Dependencias y supuestos

- Los valores de contraste del requisito 1.1 están calculados con la misma
  fórmula de luminancia relativa de WCAG que implementa
  `scripts/validateContrast.ts`, sobre los neutros que fijó `technical/0009`.
  Si esos neutros se mueven, estas cifras se recalculan: son función de ellos.
- Las distancias ΔE de los requisitos 1.3, 1.4 y 2.2 son CIE76 en Lab, con la
  simulación de dicromacia de Viénot 1999 para protanopia y deuteranopia. Es
  una aproximación: sirve para descartar un par malo, no para certificar uno
  bueno — que es exactamente por qué existe el requisito 2.
- Las fotos del catálogo son URL absolutas externas y no se pueden cargar en el
  entorno de verificación, sin red saliente. No afecta a esta spec: ningún eje
  ni ningún icono vive en el diálogo de foto.

## Decisiones abiertas

Ninguna.
