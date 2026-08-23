# 0027 — La ficha se ordena por cualquiera de sus magnitudes

- **Id:** product/0027
- **Estado:** approved
- **Tipo:** product
- **Fecha:** 2026-08-23
- **Specs relacionadas:** product/0018, product/0020, product/0021,
  product/0023, product/0024, technical/0010
- **ADRs relacionados:** ninguno
- **Doc de estado:** `docs/estado/interfaz.md`, `docs/estado/dominio.md`

## Contexto

La ficha enseña **veintidós magnitudes** por modelo cuando el conjunto de
campos vigente es «Completa» (`product/0018`, `product/0020`,
`product/0021`), y las compara todas contra el modelo elegido: cada celda
lleva debajo su Δ, con la dirección de «mejor» declarada campo a campo en la
tabla de polaridad del dominio (`POLARITY`, `docs/estado/dominio.md`).

Pero **ordenar solo se puede por tres de ellas**. El tercer control de la
barra —«Orden» (`technical/0010`, requisito 1.1)— ofrece cuatro opciones:
`Catálogo`, `Longitud`, `Anchura` y `Precio`, y las tres últimas ordenan
ascendente. El conjunto cerrado vive en dos sitios que se validan entre sí:
`FICHA_SORT_CRITERIA` en `src/domain/ficha.ts` —de donde `viewState.ts` saca
el esquema con el que valida el criterio restaurado de `localStorage`
(`product/0024`)— y `SORT_OPTIONS` en `src/ui/FichaPage.tsx`, la lista de
rótulos del `<select>`.

Esas tres magnitudes son las que `product/0013` necesitaba en la extinta
ficha técnica, más el precio que `product/0018` añadió al fundir las dos
vistas. No responden a ningún criterio de hoy: son las que había. El
resultado es que preguntas que la ficha ya tiene contestadas en sus celdas
—«¿cuál tiene más maletero?», «¿cuál se deprecia menos?», «¿cuál es el más
potente?»— obligan a recorrer catorce columnas a ojo, aunque el dato esté
ahí, con fuente, y aunque su dirección de mérito esté declarada en el
dominio.

El orden no gobierna solo las columnas de la tabla: también fija el orden de
las opciones del selector «Comparar» (`technical/0010`, requisito 3.2) y el
de la tira de candidatos de la vista de duelo en móvil (`product/0023`,
requisito 2). Ampliarlo amplía las tres cosas a la vez.

## Objetivo

Que el selector «Orden» de la ficha ofrezca **todas las magnitudes del
conjunto «Completa»**, no tres, y que ordenar por cualquiera de ellas ponga
primero el modelo que mejor sale en esa magnitud según la polaridad que el
dominio ya declara.

## Alcance

- **Las opciones de «Orden»**: de cuatro a veintitrés —«Catálogo» más las
  veintidós magnitudes de «Completa»—, con los mismos rótulos y la misma
  agrupación por bloques que ya usan las filas de la tabla.
- **La dirección de ordenación**, que hoy es «ascendente» a secas y pasa a
  derivarse de la polaridad declarada de cada magnitud.
- **El conjunto de criterios válidos del dominio** (`FICHA_SORT_CRITERIA`) y,
  por dependencia, el esquema con el que se valida el criterio restaurado de
  `localStorage`.

## Fuera de alcance

- **El conjunto de campos que se muestra.** «Esenciales» sigue enseñando sus
  seis magnitudes y «Completa» las veintidós. Ordenar y mostrar son dos
  controles independientes, y lo siguen siendo: se puede ordenar por una
  magnitud que el conjunto vigente no enseña.
- **La tabla de polaridad.** Ninguna magnitud cambia de dirección, ni gana
  una que no tenía: esta spec **lee** `POLARITY`, no la reabre. Las cinco
  neutras siguen siendo neutras.
- **La Δ y el modelo de comparación** (`product/0018`, requisitos 2 y 3):
  intactos. El orden no cambia contra quién se compara ni cómo se muestra la
  diferencia.
- **El orden por más de un criterio**, ascendente/descendente a elección, o
  invertir el orden con un segundo control. Un solo criterio, con una sola
  dirección, la declarada.
- **Ordenar por identidad** —nombre, marca, tecnología— o por puntuación.
  Esta spec amplía a las magnitudes de la ficha, que son las que tienen
  celda; el ranking es otra vista y tiene su propio orden.
- **La clasificación (`#/`)**, que ordena por puntuación total y no toca
  ninguno de estos controles.
- **El valor por defecto**, que sigue siendo `Longitud` (`product/0024`), y
  la versión de `ViewState`, que no sube: ampliar un conjunto de valores
  válidos no invalida ninguno de los ya guardados.
- **El aspecto de la barra** (`technical/0010`): las cuatro pastillas siguen
  siendo cuatro, del mismo tamaño y en la misma rejilla. Cambia lo que hay
  dentro de un `<select>`, no la barra.

## Requisitos / comportamiento esperado

1. **Veintitrés opciones.** El selector «Orden» ofrece `Catálogo` más **una
   opción por cada una de las veintidós magnitudes** del conjunto «Completa».
   Ninguna magnitud de «Completa» queda fuera, y no aparece ninguna que no
   sea de «Completa».
2. **Los rótulos son los de la ficha.** Cada opción se rotula exactamente
   como la fila de esa magnitud en la tabla («Longitud», «Anchura de hombros
   atrás», «Valor residual a 5 años»…), reutilizando la misma declaración de
   campo que ya usan las filas, no una segunda lista escrita a mano.
3. **Agrupadas como la tabla.** Las veintidós van agrupadas por los mismos
   seis bloques de «Completa» —Generación, Tamaño y espacio, Mecánica y
   prestaciones, Coste, Fiabilidad y respaldo, Juicio propio—, en el mismo
   orden, con el nombre del bloque visible como cabecera de grupo dentro del
   selector. `Catálogo` va primero y fuera de todo grupo.
4. **Mejor primero.** Ordenar por una magnitud pone delante al modelo que
   mejor sale en ella, según la polaridad ya declarada en el dominio:
   4.1. `moreIsBetter` —maletero, litros por m², anchura de hombros atrás,
   potencia, valor residual, fiabilidad, garantía, extensión de garantía y
   las dos notas de estética— ordena **descendente**: primero el valor mayor.
   4.2. `moreIsWorse` —longitud, anchura, peso, aceleración, consumo, precio
   y mantenimiento— ordena **ascendente**: primero el valor menor.
   4.3. Las magnitudes sin dirección declarada (`neutral`) —altura, altura
   libre al suelo, batalla, generación y retoque— ordenan **ascendente**, que
   es el orden natural de lectura de un número y no afirma ningún mérito.
5. **Lo de hoy no cambia.** Con el requisito 4, `Longitud`, `Anchura` y
   `Precio` —las tres opciones que ya existían, las tres `moreIsWorse`—
   siguen ordenando ascendente, exactamente igual que antes de esta spec.
6. **`Catálogo` sigue siendo el orden del catálogo**, sin tocar.
7. **Sin dato, al final.** Una entidad que no declara la magnitud por la que
   se ordena va al final de la lista, en las dos direcciones: la ausencia de
   dato no es un valor extremo, así que no encabeza el orden descendente. El
   orden relativo entre dos entidades que ambas carecen del dato no se
   declara, como hoy.
8. **Un orden, tres sitios.** El criterio vigente sigue gobernando a la vez
   las columnas desplazables de la tabla, las opciones del selector
   «Comparar» y la tira de candidatos de la vista de duelo, sin ninguna
   diferencia entre ellos.
9. **Independiente del conjunto de campos.** Elegir una magnitud que
   «Esenciales» no enseña ordena igual y no cambia el conjunto vigente ni lo
   fuerza a «Completa». Cambiar de conjunto de campos no cambia el criterio
   de orden.
10. **Persistencia sin ruptura.** El criterio elegido se sigue guardando y
    restaurando (`product/0024`) sin subir `VIEW_STATE_VERSION`: un
    `sortCriterion` guardado antes de esta spec sigue siendo válido, y uno
    que no esté entre los veintitrés se sigue descartando con su registro y
    cae a `Longitud`.
11. **El dominio sigue decidiendo el orden.** La interfaz elige el criterio y
    lo rotula; quién va delante de quién lo resuelve `sortFicha`, que ya
    conoce la polaridad (`ui-no-scoring-internals`).
12. **Sin tokens, primitivos ni dependencias nuevas.** Las opciones viven
    dentro del `<select>` que ya existe.

## Criterios de aceptación

> Obligatorios y verificables.

- [ ] El conjunto de criterios del dominio es exactamente `catalog` más
      `FICHA_FIELDS`, comprobado por test contra `FICHA_FIELDS` y no contra
      una lista repetida: si mañana se añade una magnitud a la ficha, la
      opción de orden aparece sola o el test falla.
- [ ] El `<select id="sort-select">` renderiza veintitrés `<option>` y seis
      `<optgroup>`, con los rótulos de bloque de «Completa» en su orden, y
      cada rótulo de opción coincide con el `label` del `FieldDef` de esa
      magnitud.
- [ ] Ordenar por `powerCv` deja las columnas de mayor a menor potencia, y
      ordenar por `priceEur` de menor a mayor precio, con el catálogo real.
- [ ] Ordenar por una magnitud `neutral` (`heightMm`) deja las columnas de
      menor a mayor altura.
- [ ] Ordenar por `Longitud`, `Anchura` y `Precio` produce exactamente el
      mismo orden que antes de esta spec: los tests vigentes de `sortFicha`
      siguen en verde sin cambiar ningún valor esperado.
- [ ] Una entidad sin el dato queda la última tanto ordenando por una
      magnitud `moreIsBetter` como por una `moreIsWorse`, comprobado con las
      dos.
- [ ] El criterio vigente ordena igual la tabla, las opciones de «Comparar»
      y la tira de candidatos de la vista de duelo.
- [ ] Con `fieldSet` en `Esenciales`, elegir una magnitud que solo enseña
      «Completa» reordena las columnas y deja el conjunto de campos en
      `Esenciales`.
- [ ] `VIEW_STATE_VERSION` sigue en 1; un `sortCriterion` guardado con valor
      `lengthMm` se restaura tal cual, y uno con un valor que no existe se
      descarta con su registro `view_state_field_discarded` y cae a
      `lengthMm`.
- [ ] `npm run format:check`, `npm run lint`, `npm run typecheck`,
      `npm run arch:check`, `npm run test:coverage` y `npm run build` pasan
      en local, con cobertura al 100 % en `domain/`.

## Dependencias y supuestos

- **Depende de la tabla de polaridad de `product/0018`** (requisito 3) como
  única fuente de la dirección de mérito. Que ordenar y colorear la Δ usen la
  misma tabla no es una coincidencia: son la misma afirmación —«en esta
  magnitud, más es mejor»— aplicada a dos sitios. Si mañana una magnitud
  cambia de polaridad, cambian las dos a la vez, sin una segunda tabla que
  actualizar.
- **Depende de `product/0020`** en que «Completa» es el conjunto que define
  el inventario: las opciones de orden son sus veintidós magnitudes, no las
  seis de «Esenciales».
- **Depende de `product/0024`** solo para no contradecirla: el criterio se
  sigue persistiendo con el mismo mecanismo y la misma versión.
- Asume que un `<select>` con veintitrés opciones agrupadas es manejable en
  móvil: los navegadores lo resuelven con su propio selector nativo a pantalla
  completa, que es exactamente el motivo por el que `technical/0010` eligió
  `<select>` y no una lista propia.
- **No requiere una spec `technical/`**: no introduce tokens, primitivos,
  puntos de ruptura ni dependencias nuevas.
- Asume el límite de verificación ya conocido: `renderToStaticMarkup` sin
  jsdom no dispara eventos, así que lo que depende de cambiar el selector en
  vivo se cierra con Playwright sobre `npm run preview`, como en
  `product/0023`, `product/0024` y `product/0025`.

## Decisiones abiertas

Ninguna.
