---
name: republish-model
description: Devuelve a la comparativa de comparador-coches un coche que se había despublicado — pone `published: true` en `src/data/cars.json` para que vuelva a verse en el ranking, la ficha técnica, la ficha completa y la página de explicación, con todos sus datos intactos tal como se dejaron. Úsala en cuanto el usuario pida "recuperar", "republicar", "volver a comparar", "meter de nuevo" o "deshacer" la baja de un coche que ya está en el catálogo pero oculto. No la uses para dar de alta un coche que nunca ha estado en el catálogo (`add-model`) ni para un coche que ya está publicado — en ese caso no hay nada que hacer.
---

# Republicar un modelo despublicado

La skill hermana de `unpublish-model`: revierte su efecto, sin más. Un
coche despublicado conserva en `src/data/cars.json` exactamente los mismos
datos que tenía —fuentes, fotos, notas—, así que republicarlo es cambiar
un único campo, no reconstruir nada.

## Antes de nada

Confirma qué coche —por `id` o por nombre reconocible— y localízalo en
`src/data/cars.json`. Comprueba que de verdad tiene `published: false`: si
ya está publicado, dilo y no hagas nada — no hay una acción que ejecutar,
y un commit vacío no aporta nada.

## Qué cambiar

En el registro del coche:

1. `published: true` (o borra el campo por completo, que por defecto de
   `CarSchema` equivale a lo mismo — cualquiera de las dos formas es
   correcta, elige la que quede más simple de leer en el diff).
2. Una entrada nueva en `notes`, con la fecha de hoy, dejando constancia de
   que vuelve a estar en la comparativa. No hace falta repetir el motivo
   por el que se había despublicado —ya está escrito en la nota anterior,
   que no se toca—, basta con algo como
   `"Republicado el 2026-08-07: vuelve a la comparativa."` Si el usuario da
   un motivo para el regreso (bajó de precio, ha reaparecido en stock...),
   inclúyelo.

No toques ninguna otra magnitud, fuente ni foto del coche.

## Antes de comitear

La misma secuencia que exige `add-model` y `unpublish-model`:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run arch:check
npm run test:coverage   # exige 100% de cobertura
```

## El commit

Un commit, en una rama propia para esta unidad de trabajo
(`docs/proceso/trazabilidad.md`), con el mensaje
`data(web): republish <marca> <modelo>`, en inglés, que solo toque el
registro del coche en `src/data/cars.json`. No hagas `push` ni abras PR por
tu cuenta salvo que el usuario lo pida explícitamente en esa conversación.

Al terminar, confirma al usuario que el coche ha vuelto a la comparativa
con todos sus datos previos intactos.
