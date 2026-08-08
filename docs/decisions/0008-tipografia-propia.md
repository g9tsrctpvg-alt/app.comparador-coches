# 0008 — Una tipografía propia, servida desde el repositorio

- **Estado:** draft
- **Fecha:** 2026-08-08
- **Nivel:** 🟡

## Contexto

La aplicación no carga ninguna fuente. `index.html` no enlaza nada, no existe
ningún `@font-face` en el repositorio y `src/styles/global.css` declara dos
pilas del sistema con un comentario que lo dice literalmente: «Tipografía —
dos pilas del sistema, sin fuente web».

Eso no fue una decisión: fue el residuo de una. El ADR 0006 decidió **con qué
se escribe** el CSS y `technical/0004` montó los tokens, pero ninguno de los
dos se pronunció sobre de dónde salen las letras. `product/0009` transcribió
del artefacto de referencia la regla que sí importa —«todo número va en
monoespaciada y todo texto en sans»— y una escala de tamaños, no una familia.
`--font-sans: system-ui, …` es lo que quedó al no elegir.

La consecuencia es que **el aspecto de la aplicación lo decide el sistema
operativo de quien mira**: Segoe UI Variable en Windows, San Francisco en
macOS, Roboto en Android y lo que haya instalado en Linux. Cuatro
proporciones, cuatro alturas de x y cuatro anchos distintos para la misma
tabla. Un comparador cuyo contenido son cifras alineadas en columnas es
precisamente el caso donde esa lotería se nota.

Ahora obliga a decidir porque el rediseño de la fase 4 abre la escala
tipográfica hacia arriba —de un titular de 30 px a uno de 40— y hacia abajo
la aprieta —el cuerpo de tabla sube de 11 px a 12-14—. Una familia elegida
aguanta ese rango; una familia sorteada por el sistema, no. Y la elección hay
que hacerla antes de fijar la escala, no después: los tamaños de una escala
tipográfica dependen de la altura de x de la familia que los va a pintar.

## Decisión

La aplicación sirve **una familia tipográfica variable propia, alojada en el
repositorio**, para el papel `--font-sans`.

1. **Formato y ubicación.** Un único `.woff2` variable en
   `src/assets/fonts/`, referenciado con `url()` **desde
   `src/styles/global.css`**. Así lo procesa el pipeline de Vite: le pone
   huella de contenido y reescribe la ruta respetando
   `base: '/app.comparador-coches/'`, que es justo lo que un fichero en
   `public/` obligaría a resolver a mano.
2. **La familia es Inter**, en su distribución variable con eje óptico
   (`opsz`). Un solo fichero cubre todo el rango que el rediseño abre: con
   `font-optical-sizing: auto` el navegador ajusta el trazo y el espaciado
   entre el cuerpo de tabla y el titular sin cargar una segunda fuente. Está
   dibujada para interfaz a tamaños pequeños, que es donde vive el 90 % del
   texto de este proyecto, y su licencia es SIL Open Font License 1.1.
3. **Subset latino** (`latin` y `latin-ext`, que cubre el español completo) y
   `font-display: swap`: la página se lee con la pila del sistema mientras la
   fuente llega, y nunca queda texto invisible.
4. **La pila del sistema sigue declarada como respaldo** dentro del propio
   token `--font-sans`. Si la fuente no carga —red bloqueada, caché
   corrupta—, la aplicación se ve como hoy, no rota.
5. **`--font-mono` no cambia.** Sigue siendo la pila monoespaciada del
   sistema, y la regla «todo número en monoespaciada» de `product/0009` queda
   intacta. Esta decisión no la toca ni la reabre.
6. **El `@font-face` vive solo en la hoja global.**
   `scripts/validateStyleTokens.ts` prohíbe el nombre de una pila tipográfica
   en cualquier `.module.css`, y la hoja global es la única exenta. Ningún
   componente nombra una fuente: sigue usando `var(--font-sans)`.

Sigue sin haber dependencias nuevas de producción. El recuento se mantiene en
`react`, `react-dom` y `zod`.

## Alternativas consideradas

- **Seguir con las pilas del sistema.** Cero peso, cero decisión, cero
  riesgo. **Se descarta porque es exactamente el problema**: delega el aspecto
  del producto en el sistema operativo de quien mira, y con él la métrica de
  las columnas numéricas, que es lo que esta aplicación enseña. Además no
  ofrece eje óptico, así que el titular de 40 px y la celda de 12 px se
  pintan con el mismo dibujo.
- **Cargar la fuente desde un CDN (Google Fonts, `fonts.bunny.net`).** Es la
  vía de una línea. **Se descarta por tres motivos que se suman**: mete una
  petición a un tercero en la ruta crítica de una SPA estática que hoy no
  habla con nadie; convierte cada visita en un dato que otro registra, sin que
  nadie lo haya decidido; y falla entera si ese host está bloqueado o caído,
  dejando el respaldo del sistema de forma permanente e invisible.
- **Instalar la fuente por npm (`@fontsource/inter`).** Resuelve el
  alojamiento y las rutas. **Se descarta** porque es una dependencia nueva
  —sometida a decisión explícita 🟡 por `docs/proceso/estilo.md` §1— a cambio
  de copiar un fichero que se puede copiar una vez. Añade además una
  superficie más que Dependabot sigue y que hay que actualizar, para un
  artefacto que no cambia.
- **Dos familias propias, una sans y una mono.** Cerraría también la lotería
  de la monoespaciada, que es la que pinta las cifras. **Se descarta ahora**
  por peso: duplica los bytes de fuente para arreglar un problema que todavía
  no se ha observado, porque las monoespaciadas del sistema comparten métrica
  de avance por definición y descuadran mucho menos que las sans. Queda
  aplazado con disparador, abajo.
- **Una fuente propia solo para titulares.** Peso mínimo, casi todo el efecto.
  **Se descarta** porque mezcla dos sistemas tipográficos en la misma
  pantalla: el titular tendría carácter propio y el cuerpo —que es casi todo
  lo que se lee aquí— seguiría siendo el del sistema. El eje óptico de una
  variable da el contraste entre titular y cuerpo sin ese divorcio.

## Consecuencias

**Se gana:**

- El producto se ve igual en todas partes, y las columnas de cifras miden lo
  mismo en Windows, macOS, Android y Linux.
- Un rango tipográfico real: el mismo fichero sirve el titular de 40 px y la
  celda de 12 px con el ajuste óptico correcto, que es lo que hace que una
  tabla densa se lea como diseño y no como volcado.
- Un eje de peso continuo. La escala de tres pesos de hoy —400, 600, 700—
  puede crecer a un 500 intermedio sin cargar otro fichero, y ese peso es el
  que faltaba para separar un rótulo de un valor sin gritar.
- La aplicación sigue sin hablar con ningún tercero. Sirve exactamente los
  mismos orígenes que hoy.

**Se pierde:**

- Bytes: entre 90 y 130 KB de `.woff2` variable con el subset latino. Se
  cachean tras la primera carga y no bloquean el pintado gracias a `swap`,
  pero son bytes que hoy no se pagan.
- Un binario en el repositorio. Es el primer artefacto que no es texto y que
  no se puede revisar en un diff; hay que fiarse de su procedencia y dejarla
  escrita al añadirlo.
- Un salto visual perceptible al cargar (*FOUT*). Es la contrapartida elegida
  frente a `font-display: block`, que esconde el texto: se prefiere texto
  legible al instante y un reflujo, a una página en blanco.

**Queda aplazado:**

| Aplazado | Disparador |
| --- | --- |
| **Una monoespaciada propia.** Cerraría del todo la lotería del sistema en las cifras, que es lo que esta aplicación enseña | Que se observe descuadre real de ancho entre columnas numéricas al comparar la misma tabla en dos sistemas operativos, o que la mono del sistema no distinga 1/l/I y 0/O en una captura |
| **Precarga con `<link rel="preload">` en `index.html`** | Que la métrica de carga real —no la intuición— enseñe que el reflujo por `swap` molesta. Hoy no hay medición de rendimiento de ninguna clase en el proyecto |
| **Subsetting agresivo por glifos usados** | Que los 90-130 KB del subset latino se demuestren caros en una conexión real. El catálogo es español con nombres de marca, así que el ahorro sería pequeño y el riesgo de perder un glifo, alto |

## Historial

- **2026-08-08 — Creación.** Se registra al abrir el rediseño de la interfaz,
  antes de tocar la escala tipográfica, porque los tamaños de una escala
  dependen de la familia que los pinta y elegirla después obligaría a
  recalcularla. Recoge una decisión que hasta hoy nadie había tomado: el
  «sin fuente web» de `global.css` era el residuo de no haber elegido, no una
  postura argumentada.
