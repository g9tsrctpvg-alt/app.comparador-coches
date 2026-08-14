# 0009 — Afinado visual de superficies y controles

- **Id:** technical/0009
- **Estado:** draft
- **Tipo:** technical
- **Fecha:** 2026-08-14
- **Specs relacionadas:** technical/0004, technical/0005, technical/0006,
  product/0009, product/0010
- **ADRs relacionados:** 0006
- **Doc de estado:** `docs/estado/interfaz.md`

## Contexto

`technical/0004` levantó el sistema de tokens y primitivos, `technical/0005`
lo reforzó con estados, superficies y shell, y `technical/0006` rehízo la
navegación. El resultado es un sistema **correcto y bien gobernado** —ningún
literal fuera de la hoja global, contraste verificado en CI, un primitivo por
concepto— y, a la vez, **visualmente duro**. Tres medidas sobre el código de
hoy explican por qué:

1. **El radio dominante es de 2px.** De las 24 declaraciones de
   `border-radius` del repositorio, **18** usan `--radius-sm` (`0.125rem`), un
   valor que a tamaño real no se distingue de una esquina recta: botones,
   pastillas de navegación, los tres selectores, `checkboxRow`, las barras de
   proporción y el propio anillo de foco. Solo cuatro reglas llegan a los 4px
   de `--radius-md`. `--radius-lg` está declarado y **no lo consume nadie**.
2. **Hay dos sombras en toda la aplicación**, ambas en
   `primitives.module.css`. `--shadow-card` es `0 1px 2px rgb(0 0 0 / 8%)`:
   sobre `--color-card` es prácticamente invisible. `--shadow-overlay` está
   declarado y **no lo consume nadie** — ni siquiera el `<dialog>` de la foto
   ampliada, que se pinta con `border: 0` y sin sombra. No hay un solo
   degradado. Toda la jerarquía la sostienen **15 bordes de pelo** de
   `--color-rule`, un color que da 1,45:1 sobre `card`: una rejilla tenue en
   todas partes y ninguna elevación.
3. **Los controles llevan el aspecto que les da el navegador.** Los tres
   `<select>` de la aplicación —`.toolbarSelect` y `.viewSelect` en
   `FichaPage.module.css`, `.mobileSelect` en `ViewSwitcher.module.css`—
   repiten las mismas ocho propiedades por triplicado y los tres pintan la
   flecha del sistema operativo. El pulgar de `.rangeInput` es un círculo
   macizo de acento de 44×44px sobre un carril de 6px: ese tamaño está ahí
   por el objetivo táctil que exige `product/0010`, no porque nadie lo haya
   dibujado así. Y las casillas y los radios nativos —los supuestos, el
   presupuesto, «Comparar contra»— salen del azul del sistema, porque nadie
   ha declarado `accent-color` sobre una paleta que es verde.

Nada de esto es un defecto de implementación: son los valores con los que
`product/0009` trajo el artefacto de referencia, que estilaba con atributos
`style` en línea y no tenía ni un `:hover` ni una sombra que traducir. La
oportunidad es que, por el propio diseño del sistema, **casi todo el efecto
está a un diff de la hoja de tokens**.

## Objetivo

Que la interfaz se lea más amable —menos cuadriculada, con profundidad real y
con controles dibujados en vez de heredados del navegador— sin tocar
maquetación, marcado ni contenido, y sin mover el acento de la marca.

## Alcance

- Los tokens de **radio** y de **sombra** de `src/styles/global.css`, y los
  tokens nuevos que hagan falta para lo de abajo.
- Los **neutros** de la paleta: `--color-paper`, `--color-card`,
  `--color-card-raised`, `--color-rule` y el derivado
  `--color-accent-tint-solid`.
- Un **degradado de fondo** de página, y `accent-color` heredado para todo
  control nativo.
- Los **controles** de `src/ui/primitives.module.css`: un primitivo `.select`
  nuevo que absorba las tres copias de hoy, las tres formas de `.button`,
  `.rangeInput` y las barras de proporción.
- Los **sitios de llamada** que esos cambios obligan a tocar:
  `src/ui/FichaPage.module.css` y `src/ui/components/ViewSwitcher.module.css`.

## Fuera de alcance

- **Maquetación, marcado y contenido.** Ningún `.tsx` cambia. Ningún
  componente aparece, desaparece ni se reordena.
- **El acento y la señal** (`--color-accent`, `--color-signal` y sus derivados
  de dirección `--color-positive`/`--color-negative`): no se tocan. El
  carácter de la marca no está en discusión aquí.
- **La escala tipográfica.** `--font-size-2xl` (28px) y `--font-size-lg`
  (18px) están declarados y no los consume nadie, así que los `<h2>` saltan de
  los 40px del título de vista a los 16px del cuerpo. Es un hueco real de
  jerarquía, y es **otro cambio**: se anota como deuda en `docs/roadmap.md`,
  no se resuelve aquí.
- **El esquema oscuro**, que el ADR 0006 dejó aplazado con su propio
  disparador. Este cambio no lo adelanta ni lo bloquea.
- **Los puntos de ruptura y el comportamiento responsive**, que `product/0010`
  fijó y esta spec no revisa.

## Requisitos / comportamiento esperado

### 1. Radios

1.1. `--radius-sm` pasa de `0.125rem` a `0.375rem` (6px) y `--radius-md` de
`0.25rem` a `0.625rem` (10px). Ninguna regla que hoy los consume se edita: el
cambio se propaga por el token, que es justo lo que el ADR 0006 compró.

1.2. `--radius-lg` pasa de `0.5rem` a `0.875rem` (14px) y **estrena
consumidor**: el `<dialog>` de la foto ampliada de `FichaPage`, la superficie
más grande y más «encima» de la aplicación.

1.3. Se declara `--radius-pill`, para las barras de proporción y el carril del
deslizador. Un radio mayor que la mitad de la altura lo recorta el navegador
por su cuenta, así que la misma cápsula sirve a la barra de 3px del ranking y
a la de 6px del desglose sin un caso especial para cada una.

### 2. Sombras

2.1. `--shadow-card` pasa de una capa a dos —un contacto de 1px muy tenue más
una difusión ancha y de baja opacidad—, de forma que la tarjeta se despegue
del papel sin oscurecerse ni ganar peso visual.

2.2. `--shadow-raised` se ahonda en la misma dirección, conservando la
distancia que hoy la separa de `--shadow-card`: `surfaceRaised` debe seguir
leyéndose por encima de `card`, que es para lo que existe.

2.3. Se declara `--shadow-control`: la sombra mínima de un objeto accionable
—botón, selector, pastilla activa—, para que se lea como una pieza y no como
un rectángulo contorneado. Es deliberadamente más floja que `--shadow-card`:
un control no es una superficie.

2.4. `--shadow-overlay` **no cambia de valor** y pasa a consumirse en el
`<dialog>` de la foto.

### 3. Neutros

3.1. Los cuatro neutros y el derivado opaco pasan a:

| Token | Hoy | Nuevo |
| --- | --- | --- |
| `--color-paper` | `#e9ebe6` | `#eceee9` |
| `--color-card` | `#f3f5f1` | `#f7f8f5` |
| `--color-card-raised` | `#fbfdfa` | `#ffffff` |
| `--color-rule` | `#c8cfc6` | `#d3d8d0` |
| `--color-accent-tint-solid` | `#e2ebe7` | `#e7eeea` |

3.2. Los tres primeros se aclaran, lo que **sube** el contraste de todos los
pares de `DECLARED_PAIRS` (`scripts/validateContrast.ts`), porque en todos
ellos el texto es el color oscuro. Los dos peores pares pasan de 4,68:1 a
4,81:1 (`mute` sobre `paper`, umbral 4,5) y de 3,49:1 a 3,59:1
(`ink-tertiary` sobre `paper`, umbral 3). Ninguno baja.

3.3. `--color-rule` se aclara para que la rejilla de pelo pese menos ahora que
la elevación empieza a cargar con parte de la jerarquía. No es color de texto
y no entra en `DECLARED_PAIRS`, así que su umbral no lo fija WCAG: lo fija que
siga viéndose como línea. `--color-rule-strong` no cambia.

3.4. `--color-accent-tint-solid` se recalcula porque es, por definición, el
7 % de `accent` sobre `card` en opaco —lo dice su propio comentario en
`global.css`— y `card` se mueve. Sin recalcularlo, la celda fijada de la ficha
dejaría de coincidir con el `--color-accent-tint` translúcido que imita.

### 4. Fondo y controles nativos

4.1. Se declara `--gradient-paper`, un degradado vertical de `card` a `paper`,
y se aplica a `body` con `background-attachment: fixed` para que no se repita
al desplazar. Es deliberadamente casi imperceptible: la respuesta a «los
colores son planos» que no cambia ningún tono.

4.2. `body` declara `accent-color: var(--color-accent)`. La propiedad se
hereda, así que de una línea dejan de salir azules del sistema las casillas de
`AssumptionsPanel` y los radios de «Comparar contra» de `FichaPage`, sin tocar
ninguno de los dos ficheros.

### 5. Un primitivo de selector

5.1. Se declara `.select` en `src/ui/primitives.module.css`: `appearance:
none`, la flecha propia como imagen de fondo, relleno derecho que la despeje,
borde de pelo, `--radius-sm`, `--shadow-control`, y `:hover` a
`--color-rule-strong`. La flecha vive en la hoja global como
`--icon-chevron`, un `url("data:image/svg+xml,…")` —es donde el proyecto
admite un literal—, con el color escrito en su forma escapada, que además es
la única que un `url()` acepta.

5.2. `.toolbarSelect` y `.viewSelect` (`FichaPage.module.css`) y
`.mobileSelect` (`ViewSwitcher.module.css`) pasan a componerlo y pierden sus
propiedades duplicadas. Las tres reglas son hoy idénticas salvo el nombre, así
que ninguna necesita anular nada del primitivo — que es la condición que
`primitives.module.css` ya documenta para `.unstyledButton`: una clase
compuesta entre módulos se emite **antes** que las reglas del módulo que la
compone, y ganaría cualquier conflicto.

5.3. `.noneOption` (`FichaPage.module.css`) no es un `<select>` —es una
etiqueta con un radio dentro—, así que **no** compone `.select`; recibe solo
`--shadow-control`, para que la barra de herramientas se lea homogénea.

### 6. Botón y deslizador

6.1. Las tres formas de `.button` heredan el radio nuevo por token.
`.buttonSolid` y `.buttonOutline` reciben `--shadow-control`, y `box-shadow`
entra en la lista de transiciones de `.button`, que hoy solo anima el color de
fondo y el del borde. `.buttonGhost` no recibe sombra: su definición es no
tener superficie propia hasta que se interactúa con él.

6.2. El pulgar de `.rangeInput` **conserva su caja de 44×44** —el objetivo
táctil de `product/0010` no se toca— pero deja de pintarse entero: su fondo
pasa a un degradado radial que dibuja un botón de `--size-thumb-visual` con un
halo claro alrededor y transparente a partir de ahí. Mismo tratamiento en
`::-webkit-slider-thumb` y en `::-moz-range-thumb`.

6.3. El `:hover` y el `:active` del pulgar mueven la parada del degradado, no
el tamaño de la caja: el estado no desplaza nada, que es la regla que
`docs/estado/interfaz.md` impone a todo elemento accionable.

6.4. El carril del deslizador y las dos barras de proporción pasan a
`--radius-pill`.

## Criterios de aceptación

> Obligatorios y verificables.

- [ ] Ningún `.module.css` declara un color, una longitud, un radio, una
      sombra o una pila tipográfica como literal: todo valor nuevo está
      declarado como token en `src/styles/global.css`.
      `scripts/validateStyleTokensRepo.test.ts` en verde.
- [ ] Los 14 pares de `DECLARED_PAIRS` siguen por encima de su umbral con los
      neutros nuevos, y **ninguno baja** respecto de los valores de hoy.
      `scripts/validateContrastRepo.test.ts` en verde, más la comparación par
      a par anotada en la verificación.
- [ ] `--radius-lg` y `--shadow-overlay` dejan de ser tokens sin consumidor:
      ambos los usa el `<dialog>` de la foto ampliada.
- [ ] Existe un único primitivo `.select` y **ninguna** de las tres reglas de
      selector declara ya `appearance`, `background`, `border`,
      `border-radius` ni `padding` por su cuenta.
- [ ] Los tres `<select>` pintan la misma flecha propia, no la del sistema
      operativo, comprobado en un navegador real.
- [ ] El pulgar del deslizador se ve como un botón de menos de la mitad del
      ancho de su caja, y la caja sigue midiendo 44×44px —comprobado sobre el
      elemento renderizado, no sobre el CSS—.
- [ ] Las casillas y los radios nativos se pintan en el verde de acento, no en
      el azul del sistema.
- [ ] Ningún `.tsx` cambia, y la tanda de tests de `src/ui/` pasa sin
      editar un solo test.
- [ ] `npm run format:check`, `npm run lint`, `npm run typecheck`,
      `npm run arch:check`, `npm run test:coverage` y `npm run build` pasan en
      local antes de dar la spec por implementada.
- [ ] Sobre el build de producción y en un navegador real, a 320, 592, 960 y
      1440px y en las tres vistas: no aparece desplazamiento horizontal del
      documento que hoy no exista, el elemento con el foco lo sigue mostrando,
      y la foto ampliada abre y cierra igual que antes.
- [ ] Con `prefers-reduced-motion: reduce` activo, ninguna de las transiciones
      nuevas se anima.

## Dependencias y supuestos

- Depende de `technical/0004` (la hoja de tokens y la regla de «ningún literal
  fuera de ella») y de `technical/0005` (los primitivos de botón, las
  superficies y los tokens de movimiento), que este cambio reutiliza sin
  rehacer.
- `product/0009` fijó los valores de la paleta y está `consolidated`: **no se
  edita**. La enmienda de los neutros se registra aquí y se pliega en
  `docs/estado/interfaz.md`, igual que `technical/0007` enmendó a
  `technical/0005` sin tocarla.
- Se asume que el alcance —tokens y controles, con los neutros afinados y el
  acento intacto— es el que el usuario pidió: quedó confirmado antes de
  redactar esta spec.
- Se asume que un degradado en `body` es seguro con la cabecera fija: `AppHeader`
  se pinta con fondo opaco y nunca con `backdrop-filter`, por decisión propia
  ya documentada en su hoja.
- Se asume que `radial-gradient` sobre `::-webkit-slider-thumb` y
  `::-moz-range-thumb` es soportado por los motores que el proyecto atiende.
  Si alguno lo ignorase, degrada al fondo plano de hoy, que es exactamente el
  aspecto actual: el fallo no rompe nada.

## Decisiones abiertas

Ninguna.
