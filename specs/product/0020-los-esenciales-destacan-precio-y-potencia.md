# 0020 — Los campos esenciales destacan precio y potencia

- **Id:** product/0020
- **Estado:** consolidated
- **Tipo:** product
- **Fecha:** 2026-08-12
- **Specs relacionadas:** product/0018
- **ADRs relacionados:** ninguno
- **Doc de estado:** `docs/estado/interfaz.md`

> ⚠️ **Spec consolidada (2026-08-12).** Describe un cambio en el momento en
> que se redactó; su sección *Contexto* retrata el sistema **anterior** al
> cambio y hoy es histórica. Para el estado actual, ver
> `docs/estado/interfaz.md`. Vigentes aquí solo los **criterios de
> aceptación**, como registro de verificación.

## Contexto

`product/0018` fijó el conjunto «Esenciales» de la ficha —el que se ve al
entrar, antes de cambiar a «Completa»— con las seis magnitudes que ya traía
la extinta ficha técnica: longitud, anchura, altura, altura libre al suelo,
maletero y litros por metro cuadrado. Esa lista es una herencia literal de
`product/0013`, pensada para un problema concreto —los sustitutos del coche
de referencia son más grandes—, no una elección hecha mirando qué mira
primero quien compara coches.

Con el rediseño ya desplegado y revisado de verdad, el vistazo inicial
resulta corto en dos frentes que sí importan al elegir: cuánto cuesta el
coche y qué potencia tiene. Altura y litros por metro cuadrado, en cambio,
son magnitudes secundarias frente a longitud y anchura —ya cubiertas—: la
altura no tiene ni dirección declarada (`product/0018`, tabla de polaridad:
`neutral`), y litros por m² es una métrica derivada, no una medida directa
que alguien busque de un vistazo.

## Objetivo

Que el conjunto «Esenciales» de la ficha muestre, además del tamaño, el
precio y la potencia de cada modelo, sin ampliar su número de filas ni tocar
el conjunto «Completa».

## Alcance

- La composición del conjunto «Esenciales» de `FichaPage`: qué seis
  magnitudes lo forman y en qué orden.
- Los `FieldDef` de precio y potencia ya existen —los usa «Completa»—; esta
  spec solo cambia en qué conjunto aparecen, no cómo se etiquetan ni se
  formatean.

## Fuera de alcance

- **El conjunto «Completa»**: sigue con sus veinte magnitudes y sus cinco
  bloques, sin cambios. Precio y potencia ya vivían ahí; aparecer también en
  «Esenciales» no los duplica como concepto, solo los repite en dos vistas
  del mismo dato.
- **La tabla de polaridad, la Δ, el orden de columnas y el resto del
  comportamiento de `product/0018`**: nada de eso cambia.
- **Añadir una séptima magnitud**: el conjunto se queda en seis: se quita
  tanto como se añade.

## Requisitos / comportamiento esperado

1. El conjunto «Esenciales» pasa a mostrar, en este orden: Longitud,
   Anchura, Altura libre al suelo, Maletero, Potencia, Precio.
2. Se retiran del conjunto «Esenciales» Altura (`heightMm`) y Litros por m²
   (`litersPerSquareMeter`). Ambas magnitudes siguen existiendo en la
   ficha —dentro de «Completa», en el bloque «Tamaño y espacio»—, con su
   `FieldDef` sin cambios.
3. Potencia (`powerCv`) y Precio (`priceEur`) se añaden al conjunto
   «Esenciales» reutilizando exactamente el `FieldDef` que ya usa
   «Completa» —`{ key: 'powerCv', label: 'Potencia', unitFallback: 'CV' }`
   y `{ key: 'priceEur', label: 'Precio', isEuro: true }`—, sin una segunda
   declaración ni una etiqueta distinta entre los dos conjuntos.
4. El conjunto «Esenciales» sigue sin cabecera de bloque —sigue siendo un
   único grupo, como hoy—, y sigue siendo el conjunto por defecto al entrar
   en la ficha.

## Criterios de aceptación

> Obligatorios y verificables.

- [x] El conjunto «Esenciales» renderiza exactamente seis filas: Longitud,
      Anchura, Altura libre al suelo, Maletero, Potencia y Precio, en ese
      orden. Comprobado con un test que extrae el rótulo de cada fila
      (`th[scope="row"]`) y afirma el array completo con `toEqual`.
- [x] Altura y Litros por m² no aparecen en «Esenciales», pero sí en
      «Completa». El propio `toEqual` del criterio anterior ya lo prueba —al
      afirmar el array **exacto** de seis rótulos, cualquiera de las dos
      haría fallar el test si apareciera—; que siguen en «Completa» lo
      prueba, sin cambios, `TOTAL_FIELD_COUNT === 20`.
- [x] El valor y la unidad de Potencia y Precio en «Esenciales» coinciden
      con los que ya renderiza «Completa» para el mismo modelo. Confirmado
      por construcción, no por un test dedicado —`renderToStaticMarkup` no
      permite abrir la vista ya en «Completa» sin interacción real (deuda ya
      registrada en `docs/roadmap.md`)—: los dos conjuntos usan literalmente
      el mismo `FieldDef` (`{ key: 'powerCv', ... }`/
      `{ key: 'priceEur', ... }`), y el valor de la celda sale siempre de
      `entity.cells[def.key]`, nunca del bloque que la renderiza.
- [x] El conjunto «Completa» sigue con sus veinte magnitudes y sus cinco
      bloques, sin cambios de recuento. `COMPLETE_BLOCKS` no se tocó;
      `TOTAL_FIELD_COUNT === 20` sigue en verde.
- [x] La vista sigue arrancando en «Esenciales». Comprobado con un test ya
      existente (`'offers "Esenciales" and "Completa"...'`).
- [x] `npm run format:check`, `npm run lint`, `npm run typecheck`,
      `npm run arch:check`, `npm run test:coverage` y `npm run build` pasan
      en local antes de dar la spec por implementada.
- [x] Sobre el build de producción y en un navegador real: las seis filas de
      «Esenciales» se leen sin desplazamiento horizontal del documento a
      320, 592, 960 y 1440px.

## Dependencias y supuestos

- Depende de `product/0018`, que declaró `ESSENTIAL_BLOCKS`/`COMPLETE_BLOCKS`
  en `src/ui/FichaPage.tsx` y los `FieldDef` de `powerCv` y `priceEur` que
  esta spec reutiliza sin cambiarlos.
- No depende de ningún ADR: no hay dependencia nueva ni decisión de
  arquitectura, solo una reordenación de qué `FieldDef` ya existentes entran
  en qué conjunto.

## Decisiones abiertas

Ninguna.
